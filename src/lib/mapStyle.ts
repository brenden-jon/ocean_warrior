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
          // Dark, desaturated, low contrast. The base is scenery, not subject.
          "raster-brightness-max": 0.62,
          "raster-brightness-min": 0.02,
          "raster-saturation": -0.42,
          "raster-contrast": -0.12,
          "raster-opacity": 0.92,
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
    ],
  };

  if (globe) {
    style.projection = { type: "globe" };
    // A thin cyan-tinted atmosphere. Enough to read as a planet, not so much
    // that it looks like a screensaver.
    style.sky = {
      "sky-color": "#04101f",
      "sky-horizon-blend": 0.55,
      "horizon-color": "#0b3a52",
      "horizon-fog-blend": 0.7,
      "fog-color": "#020914",
      "fog-ground-blend": 0.6,
      "atmosphere-blend": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        0.9,
        4,
        0.5,
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
