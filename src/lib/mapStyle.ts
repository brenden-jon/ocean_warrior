import type { StyleSpecification } from "maplibre-gl";
import { GIBS_LAYERS, gibsTileUrl } from "./gibs";

/**
 * Base map style.
 *
 * Built by hand rather than pulled from a style provider, for three reasons:
 * no API key to leak, no third-party dependency for a private prototype, and
 * total control over the palette. The brief asks for a map that reads as a
 * documentary rather than a GIS portal, and stock basemaps read as GIS portals.
 *
 * The base imagery is NASA Blue Marble with bathymetric shading, pushed dark
 * and desaturated so that scientific overlays — which carry the actual
 * information — are the brightest thing on screen. This is a deliberate
 * hierarchy: context recedes, data advances.
 */

export const ATTRIBUTION =
  '<a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noopener">NASA EOSDIS GIBS</a>';

export function buildBaseStyle(options?: {
  globe?: boolean;
  showCoastlines?: boolean;
  showGraticule?: boolean;
}): StyleSpecification {
  const { globe = true, showCoastlines = true, showGraticule = false } = options ?? {};

  const style: StyleSpecification = {
    version: 8,
    // No glyph or sprite server: every label this map draws comes from GeoJSON
    // rendered with the browser's own fonts via symbol layers using
    // `text-font` fallbacks, or from HTML markers overlaid on the canvas.
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
      "blue-marble": {
        type: "raster",
        tiles: [gibsTileUrl(GIBS_LAYERS.blueMarble, "epsg3857")],
        tileSize: 256,
        maxzoom: GIBS_LAYERS.blueMarble.maxNativeZoom,
        attribution: ATTRIBUTION,
      },
      coastlines: {
        type: "raster",
        tiles: [gibsTileUrl(GIBS_LAYERS.coastlines, "epsg3857")],
        tileSize: 256,
        maxzoom: GIBS_LAYERS.coastlines.maxNativeZoom,
      },
      graticule: {
        type: "raster",
        tiles: [gibsTileUrl(GIBS_LAYERS.graticule, "epsg3857")],
        tileSize: 256,
        maxzoom: GIBS_LAYERS.graticule.maxNativeZoom,
      },
      /*
       * Polar caps.
       *
       * Web Mercator stops at ±85.051129°, so no tiled source can supply
       * anything closer to the poles than that. Left bare, the base imagery's
       * final pixel row smears into a radial starburst centred on the pole,
       * which reads as a data artefact — because it is one.
       *
       * These polygons cover the gap with a flat ice tone. They are NOT a
       * measurement and the layer panel says so, pointing to the Arctic view,
       * which uses a true polar projection and can actually show the pole.
       */
      "polar-cap": {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { pole: "north" },
              geometry: {
                type: "MultiPolygon",
                // Split at the antimeridian: a single ring spanning the whole
                // longitude range is degenerate and can leave the source in a
                // state the map never reports as loaded.
                coordinates: [
                  [[[-179.9, 85.0], [-90, 85.0], [-0.05, 85.0], [-0.05, 89.9], [-90, 89.9], [-179.9, 89.9], [-179.9, 85.0]]],
                  [[[0.05, 85.0], [90, 85.0], [179.9, 85.0], [179.9, 89.9], [90, 89.9], [0.05, 89.9], [0.05, 85.0]]],
                ],
              },
            },
            {
              type: "Feature",
              properties: { pole: "south" },
              geometry: {
                type: "MultiPolygon",
                coordinates: [
                  [[[-179.9, -85.0], [-90, -85.0], [-0.05, -85.0], [-0.05, -89.9], [-90, -89.9], [-179.9, -89.9], [-179.9, -85.0]]],
                  [[[0.05, -85.0], [90, -85.0], [179.9, -85.0], [179.9, -89.9], [90, -89.9], [0.05, -89.9], [0.05, -85.0]]],
                ],
              },
            },
          ],
        },
      },
    },
    layers: [
      {
        // The void behind the globe.
        id: "space",
        type: "background",
        paint: { "background-color": "#020914" },
      },
      {
        id: "blue-marble",
        type: "raster",
        source: "blue-marble",
        paint: {
          // Gently desaturated, but NOT darkened. Blue Marble is already dark
          // over ocean, which is most of the frame; pulling brightness down as
          // well as saturation turned the globe into a silhouette.
          "raster-brightness-max": 1,
          "raster-brightness-min": 0,
          "raster-saturation": -0.18,
          "raster-contrast": 0.04,
          "raster-opacity": 1,
          "raster-fade-duration": 260,
        },
      },
      {
        id: "coastlines",
        type: "raster",
        source: "coastlines",
        layout: { visibility: showCoastlines ? "visible" : "none" },
        paint: {
          "raster-opacity": 0.34,
          "raster-fade-duration": 200,
        },
      },
      {
        id: "graticule",
        type: "raster",
        source: "graticule",
        layout: { visibility: showGraticule ? "visible" : "none" },
        paint: { "raster-opacity": 0.14 },
      },
      {
        /*
         * Must sit ABOVE the data rasters, not below them. The starburst is
         * produced by the data layer's own top tile row being stretched across
         * the cap, so a fill underneath it hides nothing.
         *
         * Data layers are inserted before "coastlines", which puts them below
         * this. Expedition routes are added afterwards and draw on top, which
         * is correct — a route crossing the pole should still be visible.
         */
        id: "polar-cap",
        type: "fill",
        source: "polar-cap",
        paint: {
          "fill-color": "#e8f1f7",
          "fill-opacity": 0.94,
        },
      },
    ],
  };

  if (globe) {
    style.projection = { type: "globe" };
    /*
     * A thin cyan-tinted atmosphere. Enough to read as a planet, not so much
     * that it looks like a screensaver.
     *
     * `fog-ground-blend` is the dangerous one: it blends `fog-color` into the
     * globe's SURFACE, not just the space around it. Set high with a near-black
     * fog colour, it renders the entire planet as a black disc with a lit rim —
     * which is exactly what the first deployment did. Keep it near zero and let
     * the atmosphere live at the limb where it belongs.
     */
    style.sky = {
      "sky-color": "#050f1e",
      "sky-horizon-blend": 0.5,
      "horizon-color": "#15516e",
      "horizon-fog-blend": 0.6,
      "fog-color": "#0a2438",
      "fog-ground-blend": 0.02,
      "atmosphere-blend": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        0.55,
        4,
        0.22,
        7,
        0,
      ],
    };
  }

  return style;
}

/** Region presets used by the explore view and the home page. */
export const REGION_PRESETS = [
  { id: "global", label: "Global", center: [-20, 25] as [number, number], zoom: 1.1 },
  { id: "arctic", label: "Arctic", center: [0, 78] as [number, number], zoom: 3.1 },
  { id: "svalbard", label: "Svalbard & Fram Strait", center: [10, 78.6] as [number, number], zoom: 4.2 },
  { id: "north-atlantic", label: "North Atlantic", center: [-30, 55] as [number, number], zoom: 2.6 },
  { id: "baffin", label: "Baffin Bay & Canadian Arctic", center: [-70, 72] as [number, number], zoom: 3.0 },
  { id: "gulf-california", label: "Gulf of California", center: [-110.5, 25.5] as [number, number], zoom: 5.2 },
  { id: "southern-ocean", label: "Southern Ocean", center: [-50, -60] as [number, number], zoom: 2.8 },
  { id: "tropical-pacific", label: "Tropical Pacific", center: [-150, 0] as [number, number], zoom: 2.2 },
];
