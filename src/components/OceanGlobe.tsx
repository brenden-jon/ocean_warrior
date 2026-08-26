"use client";

import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, useState, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import { buildBaseStyle } from "@/lib/mapStyle";
import {
  GIBS_LAYERS,
  clampToCoverage,
  gibsTileUrl,
  isOutsideCoverage,
  type GibsLayerDef,
} from "@/lib/gibs";
import { EXPEDITIONS, type ExpeditionRecord } from "@/data/expeditions";
import {
  expeditionPortFeatures,
  expeditionRegionFeature,
  expeditionRouteFeatures,
} from "@/lib/geo";

/**
 * A point overlay drawn above the raster layers — observing platforms,
 * biodiversity records, stations. Kept generic so the map component does not
 * need to know what any particular dataset means.
 */
export interface PointOverlay {
  id: string;
  data: GeoJSON.FeatureCollection;
  color: string;
  /** Radius in pixels at zoom 1 and zoom 6, interpolated between. */
  radius: [number, number];
  opacity?: number;
  strokeColor?: string;
  /** Property name to show as a label in the click popup. */
  popupFields?: { key: string; label: string; unit?: string }[];
  popupTitle?: string;
}

/** A polygon overlay — protected areas, management boundaries, regions. */
export interface PolygonOverlay {
  id: string;
  /** Either inline GeoJSON, or a URL fetched lazily by MapLibre itself. */
  data: GeoJSON.FeatureCollection | string;
  fillColor: string;
  lineColor: string;
  fillOpacity?: number;
  popupFields?: { key: string; label: string; unit?: string }[];
  popupTitle?: string;
  /** Property holding the feature's display name, used as the popup heading. */
  nameField?: string;
}

export interface OceanGlobeProps {
  /** Which GIBS overlay to draw, by key in GIBS_LAYERS. Null for base only. */
  dataLayer: keyof typeof GIBS_LAYERS | null;
  /** Point datasets drawn above the raster. */
  overlays?: PointOverlay[];
  /** Polygon datasets drawn between the raster and the points. */
  polygons?: PolygonOverlay[];
  /** ISO date for the overlay. */
  date: string;
  /** Overlay opacity 0–1. */
  opacity?: number;
  center?: [number, number];
  zoom?: number;
  /** Expedition slugs to draw. Empty array draws none. */
  expeditions?: string[];
  /** Render as a 3-D globe. False gives a flat Mercator map. */
  globe?: boolean;
  interactive?: boolean;
  showCoastlines?: boolean;
  showGraticule?: boolean;
  /** Slowly rotate. Used on the home page hero only. */
  autoRotate?: boolean;
  className?: string;
  onReady?: (map: MapLibreMap) => void;
  onDataCoverageChange?: (outside: boolean, clampedDate: string) => void;
  /** Fires when the visitor clicks the ocean, with the clicked position. */
  onOceanClick?: (lngLat: { lng: number; lat: number }) => void;
}

const OVERLAY_SOURCE = "gibs-overlay";
const OVERLAY_LAYER = "gibs-overlay-layer";
const ICE_SOURCE = "gibs-ice-underlay";
const ICE_LAYER = "gibs-ice-underlay-layer";

/*
 * Layers that are undefined over sea ice.
 *
 * Sea surface temperature has no value where the sea has a lid on it, so the
 * Arctic and the Southern Ocean render as holes and the base imagery shows
 * through. Drawing ice concentration UNDERNEATH means the gap fills with the
 * actual reason for the gap: ice. It is real data, it is the correct
 * explanation, and it looks like the ocean rather than like a rendering fault.
 */
const NEEDS_ICE_UNDERLAY = new Set(["sst", "sstAnomaly"]);

export default function OceanGlobe({
  dataLayer,
  overlays = [],
  polygons = [],
  date,
  opacity = 0.85,
  center = [-20, 25],
  zoom = 1.1,
  expeditions = [],
  globe = true,
  interactive = true,
  showCoastlines = true,
  showGraticule = false,
  autoRotate = false,
  className,
  onReady,
  onDataCoverageChange,
  onOceanClick,
}: OceanGlobeProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const rotationFrame = useRef<number | null>(null);
  const userInteracted = useRef(false);

  /* -------------------------------------------------------------- init -- */
  useEffect(() => {
    if (!container.current || map.current) return;

    const instance = new maplibregl.Map({
      container: container.current,
      style: buildBaseStyle({ globe, showCoastlines, showGraticule }),
      center,
      zoom,
      minZoom: 0.6,
      maxZoom: 9,
      interactive,
      attributionControl: false,
      // The globe reads as a physical object; a little tilt sells it without
      // making the map hard to read.
      pitch: globe ? 0 : 0,
      dragRotate: globe,
      touchZoomRotate: true,
      // Rendering the world once avoids duplicated expedition routes at the
      // edges of a flat map.
      renderWorldCopies: !globe,
    });

    instance.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    if (interactive) {
      instance.addControl(
        new maplibregl.NavigationControl({ showCompass: globe, visualizePitch: false }),
        "bottom-right",
      );
    }

    /*
     * Do not rely on the `load` event alone.
     *
     * If the style is already loaded by the time this handler is attached —
     * which happens when tiles come from cache — `load` has already fired and
     * MapLibre does not replay it. The component then sits with ready=false
     * forever and NOTHING is drawn: no data layer, no routes, no overlays.
     * That is exactly the failure this replaces.
     *
     * So: mark ready immediately if the style is already up, otherwise wait for
     * `load`, and keep `styledata` as a backstop. Guarded so it runs once.
     */
    let readyFired = false;
    const markReady = () => {
      if (readyFired) return;
      readyFired = true;
      map.current = instance;
      setReady(true);
      onReady?.(instance);
    };

    if (instance.isStyleLoaded()) {
      markReady();
    } else {
      instance.once("load", markReady);
      instance.on("styledata", () => {
        if (instance.isStyleLoaded()) markReady();
      });
    }

    // Any deliberate interaction cancels auto-rotation for good.
    for (const event of ["mousedown", "touchstart", "wheel", "keydown"] as const) {
      instance.on(event, () => {
        userInteracted.current = true;
      });
    }

    map.current = instance;

    return () => {
      if (rotationFrame.current) cancelAnimationFrame(rotationFrame.current);
      instance.remove();
      map.current = null;
    };
    // Deliberately mount-only: subsequent prop changes are handled by the
    // effects below rather than by tearing the map down and rebuilding it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------- overlay layer -- */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;

    // Remove any existing overlay first so switching layers is clean.
    if (instance.getLayer(OVERLAY_LAYER)) instance.removeLayer(OVERLAY_LAYER);
    if (instance.getSource(OVERLAY_SOURCE)) instance.removeSource(OVERLAY_SOURCE);
    if (instance.getLayer(ICE_LAYER)) instance.removeLayer(ICE_LAYER);
    if (instance.getSource(ICE_SOURCE)) instance.removeSource(ICE_SOURCE);

    if (!dataLayer) {
      onDataCoverageChange?.(false, date);
      return;
    }

    const def: GibsLayerDef = GIBS_LAYERS[dataLayer];
    const outside = isOutsideCoverage(def, date);
    const effectiveDate = clampToCoverage(def, date);
    onDataCoverageChange?.(outside, effectiveDate);

    instance.addSource(OVERLAY_SOURCE, {
      type: "raster",
      tiles: [gibsTileUrl(def, "epsg3857", effectiveDate)],
      tileSize: 256,
      maxzoom: def.maxNativeZoom,
    });

    // Insert beneath coastlines so land outlines stay legible over the data.
    const before = instance.getLayer("coastlines") ? "coastlines" : undefined;

    if (NEEDS_ICE_UNDERLAY.has(dataLayer as string)) {
      const iceDef = GIBS_LAYERS.seaIceMur;
      instance.addSource(ICE_SOURCE, {
        type: "raster",
        tiles: [
          gibsTileUrl(iceDef, "epsg3857", clampToCoverage(iceDef, effectiveDate)),
        ],
        tileSize: 256,
        maxzoom: iceDef.maxNativeZoom,
      });
      instance.addLayer(
        {
          id: ICE_LAYER,
          type: "raster",
          source: ICE_SOURCE,
          paint: {
            "raster-opacity": 1,
            "raster-fade-duration": 220,
            "raster-resampling": "linear",
          },
        },
        before,
      );
    }

    instance.addLayer(
      {
        id: OVERLAY_LAYER,
        type: "raster",
        source: OVERLAY_SOURCE,
        paint: {
          "raster-opacity": opacity,
          "raster-fade-duration": 220,
          "raster-resampling": "linear",
        },
      },
      before,
    );
  }, [dataLayer, date, ready, opacity, onDataCoverageChange]);

  /* ------------------------------------------------- overlay opacity -- */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    if (instance.getLayer(OVERLAY_LAYER)) {
      instance.setPaintProperty(OVERLAY_LAYER, "raster-opacity", opacity);
    }
  }, [opacity, ready]);

  /* ------------------------------------------------------ expeditions -- */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;

    // Clear previous expedition layers.
    for (const expedition of EXPEDITIONS) {
      for (const suffix of ["route", "route-halo", "route-glow", "ports", "port-labels", "region", "region-line"]) {
        const id = `exp-${expedition.slug}-${suffix}`;
        if (instance.getLayer(id)) instance.removeLayer(id);
      }
      for (const suffix of ["route", "ports", "region"]) {
        const id = `exp-src-${expedition.slug}-${suffix}`;
        if (instance.getSource(id)) instance.removeSource(id);
      }
    }

    for (const slug of expeditions) {
      const expedition = EXPEDITIONS.find((e) => e.slug === slug);
      if (!expedition) continue;
      addExpeditionLayers(instance, expedition);
    }
  }, [expeditions, ready]);

  /* ------------------------------------------------ polygon overlays -- */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;

    const drawn: string[] = [];

    for (const polygon of polygons) {
      const sourceId = `pg-src-${polygon.id}`;
      const fillId = `pg-fill-${polygon.id}`;
      const lineId = `pg-line-${polygon.id}`;
      drawn.push(polygon.id);

      if (instance.getSource(sourceId)) continue;

      // A string `data` lets MapLibre fetch the file itself, so a large
      // boundary set is only downloaded when the layer is actually switched on.
      instance.addSource(sourceId, { type: "geojson", data: polygon.data });

      instance.addLayer({
        id: fillId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": polygon.fillColor,
          "fill-opacity": polygon.fillOpacity ?? 0.22,
        },
      });
      instance.addLayer({
        id: lineId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": polygon.lineColor,
          // Keep a visible stroke even at global zoom, where most protected
          // areas are smaller than a few pixels and would otherwise vanish.
          "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.9, 3, 1.4, 7, 2],
          "line-opacity": 0.95,
        },
      });

      if (polygon.popupFields) {
        instance.on("click", fillId, (event) => {
          const feature = event.features?.[0];
          if (!feature) return;
          const props = feature.properties ?? {};
          const heading = polygon.nameField ? props[polygon.nameField] : "";
          const rows = polygon.popupFields!
            .filter((f) => props[f.key] != null && props[f.key] !== "")
            .map(
              (f) =>
                `<div style="display:flex;justify-content:space-between;gap:16px;padding:2px 0">
                   <span style="color:#5d7488">${f.label}</span>
                   <span style="color:#f4faff;font-variant-numeric:tabular-nums;text-align:right">${props[f.key]}${f.unit ? " " + f.unit : ""}</span>
                 </div>`,
            )
            .join("");
          new maplibregl.Popup({ closeButton: true, maxWidth: "300px" })
            .setLngLat(event.lngLat)
            .setHTML(
              `<div style="padding:14px 16px;font-family:var(--font-inter),sans-serif;font-size:12px">
                 <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#5d7488;margin-bottom:6px">${polygon.popupTitle ?? ""}</div>
                 ${heading ? `<div style="color:#f4faff;font-size:13px;margin-bottom:8px;line-height:1.35">${heading}</div>` : ""}
                 ${rows}
               </div>`,
            )
            .addTo(instance);
        });
        instance.on("mouseenter", fillId, () => {
          instance.getCanvas().style.cursor = "pointer";
        });
        instance.on("mouseleave", fillId, () => {
          instance.getCanvas().style.cursor = "";
        });
      }
    }

    return () => {
      for (const id of drawn) {
        for (const layerId of [`pg-fill-${id}`, `pg-line-${id}`]) {
          if (instance.getLayer(layerId)) instance.removeLayer(layerId);
        }
        const sourceId = `pg-src-${id}`;
        if (instance.getSource(sourceId)) instance.removeSource(sourceId);
      }
    };
  }, [polygons, ready]);

  /* -------------------------------------------------- point overlays -- */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;

    const drawn: string[] = [];

    for (const overlay of overlays) {
      const sourceId = `ov-src-${overlay.id}`;
      const layerId = `ov-${overlay.id}`;
      drawn.push(overlay.id);

      if (instance.getSource(sourceId)) {
        (instance.getSource(sourceId) as maplibregl.GeoJSONSource).setData(
          overlay.data,
        );
      } else {
        instance.addSource(sourceId, { type: "geojson", data: overlay.data });
        instance.addLayer({
          id: layerId,
          type: "circle",
          source: sourceId,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              1,
              overlay.radius[0],
              6,
              overlay.radius[1],
            ],
            "circle-color": overlay.color,
            "circle-opacity": overlay.opacity ?? 0.85,
            "circle-stroke-color": overlay.strokeColor ?? "#020914",
            "circle-stroke-width": 0.6,
          },
        });

        if (overlay.popupFields) {
          instance.on("click", layerId, (event) => {
            const feature = event.features?.[0];
            if (!feature) return;
            const props = feature.properties ?? {};
            const rows = overlay.popupFields!
              .filter((f) => props[f.key] != null && props[f.key] !== "")
              .map(
                (f) =>
                  `<div style="display:flex;justify-content:space-between;gap:16px;padding:2px 0">
                     <span style="color:#5d7488">${f.label}</span>
                     <span style="color:#f4faff;font-variant-numeric:tabular-nums">${props[f.key]}${f.unit ? " " + f.unit : ""}</span>
                   </div>`,
              )
              .join("");
            new maplibregl.Popup({ closeButton: true, maxWidth: "280px" })
              .setLngLat(event.lngLat)
              .setHTML(
                `<div style="padding:14px 16px;font-family:var(--font-inter),sans-serif;font-size:12px">
                   <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#5d7488;margin-bottom:8px">${overlay.popupTitle ?? ""}</div>
                   ${rows}
                 </div>`,
              )
              .addTo(instance);
          });
          instance.on("mouseenter", layerId, () => {
            instance.getCanvas().style.cursor = "pointer";
          });
          instance.on("mouseleave", layerId, () => {
            instance.getCanvas().style.cursor = "";
          });
        }
      }
    }

    // Remove overlays that are no longer requested.
    return () => {
      for (const id of drawn) {
        const layerId = `ov-${id}`;
        const sourceId = `ov-src-${id}`;
        if (instance.getLayer(layerId)) instance.removeLayer(layerId);
        if (instance.getSource(sourceId)) instance.removeSource(sourceId);
      }
    };
  }, [overlays, ready]);

  /* ----------------------------------------------------- auto-rotate -- */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || !autoRotate) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let last = performance.now();
    const step = (now: number) => {
      const delta = now - last;
      last = now;
      if (!userInteracted.current && instance.isStyleLoaded()) {
        const c = instance.getCenter();
        // Roughly one revolution every six minutes. Slow enough to feel
        // like the Earth turning rather than a carousel.
        instance.setCenter([c.lng + (delta / 1000) * 1.0, c.lat]);
      }
      rotationFrame.current = requestAnimationFrame(step);
    };
    rotationFrame.current = requestAnimationFrame(step);

    return () => {
      if (rotationFrame.current) cancelAnimationFrame(rotationFrame.current);
    };
  }, [autoRotate, ready]);

  /* ---------------------------------------------------- camera moves -- */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    instance.easeTo({ center, zoom, duration: 1400, essential: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom, ready]);

  /* ---------------------------------------------------------- clicks -- */
  const handleClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      onOceanClick?.({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    },
    [onOceanClick],
  );

  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || !onOceanClick) return;
    instance.on("click", handleClick);
    return () => {
      instance.off("click", handleClick);
    };
  }, [handleClick, ready, onOceanClick]);

  return (
    <div
      ref={container}
      className={className}
      role="application"
      aria-label="Interactive ocean data globe"
    />
  );
}

/* ========================================================================== */

/**
 * Draw one expedition.
 *
 * Fidelity is encoded visually, not just in a label: published itineraries are
 * solid, concepts are dashed, and unknown tracks are drawn as a translucent
 * area with no line at all. Someone who never opens a tooltip should still be
 * able to tell that the dashed line is not a record of where a ship went.
 */
function addExpeditionLayers(
  instance: MapLibreMap,
  expedition: ExpeditionRecord,
) {
  const slug = expedition.slug;

  // --- region-only expeditions: an area, never a line --------------------
  if (expedition.fidelity === "region_only" && expedition.regionPolygon) {
    instance.addSource(`exp-src-${slug}-region`, {
      type: "geojson",
      data: expeditionRegionFeature(expedition),
    });
    instance.addLayer({
      id: `exp-${slug}-region`,
      type: "fill",
      source: `exp-src-${slug}-region`,
      paint: {
        "fill-color": expedition.accent,
        "fill-opacity": 0.07,
      },
    });
    instance.addLayer({
      id: `exp-${slug}-region-line`,
      type: "line",
      source: `exp-src-${slug}-region`,
      paint: {
        "line-color": expedition.accent,
        "line-width": 1,
        "line-opacity": 0.5,
        // Long dashes read as "an area we worked in", not a boundary.
        "line-dasharray": [4, 3],
      },
    });
    return;
  }

  if (expedition.legs.length === 0) return;

  // --- routes ------------------------------------------------------------
  instance.addSource(`exp-src-${slug}-route`, {
    type: "geojson",
    data: expeditionRouteFeatures(expedition),
    lineMetrics: true,
  });

  /*
   * Three passes rather than one.
   *
   * A single stroke with dots at every port reads as a diagram. A wide, very
   * soft halo under a fine bright line reads as a route drawn on a chart: the
   * halo lifts it off busy scientific colour without thickening the line
   * itself, so the geography underneath stays visible.
   *
   * Colour comes from the feature, not the layer, so each leg keeps its own
   * identity within one source.
   */
  instance.addLayer({
    id: `exp-${slug}-route-halo`,
    type: "line",
    source: `exp-src-${slug}-route`,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "accent"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 1, 7, 6, 18],
      "line-opacity": 0.1,
      "line-blur": 8,
    },
  });

  instance.addLayer({
    id: `exp-${slug}-route`,
    type: "line",
    source: `exp-src-${slug}-route`,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "accent"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 1, 1.1, 4, 1.8, 7, 2.6],
      "line-opacity": 0.96,
      ...(expedition.dashed ? { "line-dasharray": [3, 2.5] } : {}),
    },
  });

  // --- ports -------------------------------------------------------------
  instance.addSource(`exp-src-${slug}-ports`, {
    type: "geojson",
    data: expeditionPortFeatures(expedition),
  });

  /*
   * Fine hollow rings, and only once the map is close enough for them to mean
   * something. At global zoom a dot every few hundred kilometres turns the
   * route into a string of beads and obscures the line it is annotating.
   */
  instance.addLayer({
    id: `exp-${slug}-ports`,
    type: "circle",
    source: `exp-src-${slug}-ports`,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 0, 3, 2.6, 7, 4.5],
      "circle-color": "rgba(0,0,0,0)",
      "circle-stroke-color": expedition.accent,
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 2, 0, 3, 1.1, 7, 1.6],
      "circle-opacity": 0,
      "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0, 3.2, 0.9],
    },
  });

  // Clicking a leg identifies it, which is the point of colouring them apart.
  instance.on("click", `exp-${slug}-route`, (event) => {
    const feature = event.features?.[0];
    if (!feature) return;
    const p = feature.properties ?? {};
    new maplibregl.Popup({ closeButton: true, maxWidth: "300px" })
      .setLngLat(event.lngLat)
      .setHTML(
        `<div style="padding:14px 16px;font-family:var(--font-inter),sans-serif;font-size:12px">
           <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#5d7488;margin-bottom:6px">${p.expeditionName ?? ""}</div>
           <div style="color:#f4faff;font-size:13px;margin-bottom:6px">${p.legName ?? ""}</div>
           <div style="color:#8fa7b8;line-height:1.5;margin-bottom:8px">${p.legDescription ?? ""}</div>
           <div style="color:#ffb547;font-size:10px;line-height:1.4">${p.fidelityLabel ?? ""}</div>
         </div>`,
      )
      .addTo(instance);
  });
  instance.on("mouseenter", `exp-${slug}-route`, () => {
    instance.getCanvas().style.cursor = "pointer";
  });
  instance.on("mouseleave", `exp-${slug}-route`, () => {
    instance.getCanvas().style.cursor = "";
  });
}
