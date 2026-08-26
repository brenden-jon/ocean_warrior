/**
 * NASA GIBS (Global Imagery Browse Services) tile definitions.
 *
 * GIBS serves pre-rendered, colour-mapped imagery for hundreds of NASA
 * products as standard WMTS tiles — no authentication, permissive CORS, and
 * fast. This is what makes a genuinely beautiful map possible without mirroring
 * any data ourselves.
 *
 * Two important consequences of using rendered tiles, both surfaced in the UI:
 *   1. The colour scale is NASA's, not ours. We show their legend, not an
 *      invented one.
 *   2. Pixels cannot be queried for numbers. Numeric readout comes from ERDDAP
 *      instead. A pretty tile is not a measurement you can cite.
 *
 * Every parameter below (tile matrix set, format, temporal range) was read from
 * the live WMTS capabilities documents rather than assumed — GIBS is
 * inconsistent about matrix sets between layers and guessing produces 400s.
 */

export type GibsProjection = "epsg3857" | "epsg3413" | "epsg3031";

export interface GibsLayerDef {
  /** GIBS layer identifier. */
  id: string;
  /** Catalog entry this tile layer renders. */
  catalogId: string;
  label: string;
  /** Tile matrix set — differs per layer, must match capabilities exactly. */
  tileMatrixSet: string;
  format: "jpg" | "png";
  /** Max zoom the source actually has. Beyond this MapLibre overzooms. */
  maxNativeZoom: number;
  /** False for static layers, whose URL omits the date segment. */
  temporal: boolean;
  /** Earliest date with data, ISO. */
  start?: string;
  /** Latest date with data, ISO. Verified from capabilities. */
  end?: string;
  projections: GibsProjection[];
  /** Legend stops for the UI, matching NASA's own colour mapping. */
  legend?: { label: string; color: string }[];
  legendUnit?: string;
}

const GIBS_HOST = "https://gibs.earthdata.nasa.gov/wmts";

/**
 * Build a MapLibre-compatible tile URL template.
 *
 * Note the segment order: GIBS WMTS REST is {TileMatrix}/{TileRow}/{TileCol},
 * i.e. z/y/x — row before column. MapLibre substitutes by placeholder name, so
 * writing them in GIBS order is correct even though it reads oddly.
 */
export function gibsTileUrl(
  layer: GibsLayerDef,
  projection: GibsProjection,
  date?: string,
): string {
  const time = layer.temporal ? `${date ?? "default"}/` : "";
  return `${GIBS_HOST}/${projection}/best/${layer.id}/default/${time}${layer.tileMatrixSet}/{z}/{y}/{x}.${layer.format}`;
}

/** Diverging blue→white→red, matching NASA's GHRSST anomaly palette. */
const ANOMALY_LEGEND = [
  { label: "−5", color: "#2b3a8f" },
  { label: "−3", color: "#3b7fd4" },
  { label: "−1", color: "#9fd4f0" },
  { label: "0", color: "#f2f2f2" },
  { label: "+1", color: "#f7c46c" },
  { label: "+3", color: "#e8562f" },
  { label: "+5", color: "#8f1d14" },
];

const ICE_LEGEND = [
  { label: "15%", color: "#1c3f66" },
  { label: "40%", color: "#4a7fb5" },
  { label: "60%", color: "#8fc0e0" },
  { label: "80%", color: "#cfe6f5" },
  { label: "100%", color: "#ffffff" },
];

export const GIBS_LAYERS: Record<string, GibsLayerDef> = {
  /* -------------------------------------------------------------- basemap -- */
  blueMarble: {
    id: "BlueMarble_ShadedRelief_Bathymetry",
    catalogId: "gebco-bathymetry",
    label: "Blue Marble with bathymetry",
    tileMatrixSet: "GoogleMapsCompatible_Level8",
    format: "jpg",
    maxNativeZoom: 8,
    temporal: false,
    projections: ["epsg3857"],
  },
  coastlines: {
    id: "Coastlines_15m",
    catalogId: "gebco-bathymetry",
    label: "Coastlines",
    tileMatrixSet: "GoogleMapsCompatible_Level13",
    format: "png",
    maxNativeZoom: 13,
    temporal: false,
    projections: ["epsg3857"],
  },
  graticule: {
    id: "Graticule_15m",
    catalogId: "gebco-bathymetry",
    label: "Graticule",
    tileMatrixSet: "GoogleMapsCompatible_Level13",
    format: "png",
    maxNativeZoom: 13,
    temporal: false,
    projections: ["epsg3857"],
  },

  /* ------------------------------------------------------------ hero data -- */
  sstAnomaly: {
    id: "GHRSST_L4_MUR_Sea_Surface_Temperature_Anomalies",
    catalogId: "gibs-mur-sst-anomaly",
    label: "SST anomaly",
    tileMatrixSet: "GoogleMapsCompatible_Level7",
    format: "png",
    maxNativeZoom: 7,
    temporal: true,
    start: "2002-09-01",
    end: "2026-08-25",
    projections: ["epsg3857"],
    legend: ANOMALY_LEGEND,
    legendUnit: "°C from normal",
  },
  sst: {
    id: "GHRSST_L4_MUR_Sea_Surface_Temperature",
    catalogId: "oisst-sst",
    label: "Sea surface temperature",
    tileMatrixSet: "GoogleMapsCompatible_Level7",
    format: "png",
    maxNativeZoom: 7,
    temporal: true,
    start: "2002-09-01",
    end: "2026-08-25",
    projections: ["epsg3857"],
    legend: [
      { label: "−2", color: "#3b1f8f" },
      { label: "6", color: "#2b7fd4" },
      { label: "14", color: "#3fbf7f" },
      { label: "22", color: "#f2d43c" },
      { label: "30", color: "#d92b2b" },
    ],
    legendUnit: "°C",
  },
  chlorophyll: {
    id: "OCI_PACE_Chlorophyll_a",
    catalogId: "chlorophyll",
    label: "Chlorophyll-a",
    tileMatrixSet: "GoogleMapsCompatible_Level7",
    format: "png",
    maxNativeZoom: 7,
    temporal: true,
    start: "2024-03-01",
    end: "2026-08-26",
    projections: ["epsg3857"],
    legend: [
      { label: "0.01", color: "#3b1f8f" },
      { label: "0.1", color: "#2b7fd4" },
      { label: "0.3", color: "#3fbf7f" },
      { label: "1", color: "#f2d43c" },
      { label: "10", color: "#d92b2b" },
    ],
    legendUnit: "mg/m³ (log scale)",
  },
  trueColor: {
    id: "VIIRS_SNPP_CorrectedReflectance_TrueColor",
    catalogId: "gebco-bathymetry",
    label: "True colour (VIIRS)",
    tileMatrixSet: "GoogleMapsCompatible_Level9",
    format: "jpg",
    maxNativeZoom: 9,
    temporal: true,
    start: "2015-11-24",
    end: "2026-08-26",
    projections: ["epsg3857", "epsg3413"],
  },

  /* ------------------------------------------------------------------ ice -- */
  seaIceAmsr2: {
    id: "AMSRU2_Sea_Ice_Concentration_12km",
    catalogId: "gibs-amsr2-ice",
    label: "Sea-ice concentration (AMSR2, 12 km)",
    tileMatrixSet: "GoogleMapsCompatible_Level6",
    format: "png",
    maxNativeZoom: 6,
    temporal: true,
    start: "2012-07-02",
    end: "2025-09-01",
    projections: ["epsg3857", "epsg3413"],
    legend: ICE_LEGEND,
    legendUnit: "% concentration",
  },
};

/**
 * Polar-projection variants. GIBS uses a different tile matrix set naming
 * scheme for EPSG:3413 (plain "1km", "250m") than for Web Mercator.
 */
export const GIBS_POLAR_LAYERS: Record<string, GibsLayerDef> = {
  seaIceHistoric: {
    id: "SSMIS_Sea_Ice_Concentration",
    catalogId: "gibs-sea-ice-conc",
    label: "Sea-ice concentration (SSMIS)",
    tileMatrixSet: "1km",
    format: "png",
    maxNativeZoom: 3,
    temporal: true,
    start: "1978-10-26",
    end: "2021-08-22",
    projections: ["epsg3413", "epsg3031"],
    legend: ICE_LEGEND,
    legendUnit: "% concentration",
  },
  seaIceAmsr2Polar: {
    id: "AMSRU2_Sea_Ice_Concentration_12km",
    catalogId: "gibs-amsr2-ice",
    label: "Sea-ice concentration (AMSR2)",
    tileMatrixSet: "1km",
    format: "png",
    maxNativeZoom: 3,
    temporal: true,
    start: "2012-07-02",
    end: "2025-09-01",
    projections: ["epsg3413", "epsg3031"],
    legend: ICE_LEGEND,
    legendUnit: "% concentration",
  },
  trueColorPolar: {
    id: "VIIRS_SNPP_CorrectedReflectance_TrueColor",
    catalogId: "gebco-bathymetry",
    label: "True colour (VIIRS)",
    tileMatrixSet: "250m",
    format: "jpg",
    maxNativeZoom: 5,
    temporal: true,
    start: "2015-11-24",
    end: "2026-08-26",
    projections: ["epsg3413"],
  },
};

/** Clamp a requested date into a layer's actual coverage. */
export function clampToCoverage(layer: GibsLayerDef, date: string): string {
  if (layer.start && date < layer.start) return layer.start;
  if (layer.end && date > layer.end) return layer.end;
  return date;
}

/** True when the requested date falls outside coverage — the UI must say so. */
export function isOutsideCoverage(layer: GibsLayerDef, date: string): boolean {
  return Boolean(
    (layer.start && date < layer.start) || (layer.end && date > layer.end),
  );
}
