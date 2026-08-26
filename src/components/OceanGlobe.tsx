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

export interface OceanGlobeProps {
  /** Which GIBS overlay to draw, by key in GIBS_LAYERS. Null for base only. */
  dataLayer: keyof typeof GIBS_LAYERS | null;
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

export default function OceanGlobe({
  dataLayer,
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

    instance.on("load", () => {
      map.current = instance;
      setReady(true);
      onReady?.(instance);
    });

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
      for (const suffix of ["route", "route-glow", "ports", "port-labels", "region", "region-line"]) {
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
        "fill-opacity": 0.1,
      },
    });
    instance.addLayer({
      id: `exp-${slug}-region-line`,
      type: "line",
      source: `exp-src-${slug}-region`,
      paint: {
        "line-color": expedition.accent,
        "line-width": 1.2,
        "line-opacity": 0.55,
        "line-dasharray": [1, 2],
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

  // A soft glow beneath the line gives it presence over bright data without
  // needing a heavy stroke that would obscure the map.
  instance.addLayer({
    id: `exp-${slug}-route-glow`,
    type: "line",
    source: `exp-src-${slug}-route`,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": expedition.accent,
      "line-width": ["interpolate", ["linear"], ["zoom"], 1, 6, 6, 14],
      "line-opacity": 0.16,
      "line-blur": 6,
    },
  });

  instance.addLayer({
    id: `exp-${slug}-route`,
    type: "line",
    source: `exp-src-${slug}-route`,
    layout: { "line-cap": "butt", "line-join": "round" },
    paint: {
      "line-color": expedition.accent,
      "line-width": ["interpolate", ["linear"], ["zoom"], 1, 1.4, 6, 3],
      "line-opacity": 0.95,
      ...(expedition.dashed ? { "line-dasharray": [2.5, 2] } : {}),
    },
  });

  // --- ports -------------------------------------------------------------
  instance.addSource(`exp-src-${slug}-ports`, {
    type: "geojson",
    data: expeditionPortFeatures(expedition),
  });

  instance.addLayer({
    id: `exp-${slug}-ports`,
    type: "circle",
    source: `exp-src-${slug}-ports`,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 3, 6, 6],
      "circle-color": "#020914",
      "circle-stroke-color": expedition.accent,
      "circle-stroke-width": 1.8,
      "circle-opacity": 0.9,
    },
  });
}
