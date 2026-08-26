import { z } from "zod";

/**
 * The provenance model.
 *
 * Everything the interface draws must declare what kind of thing it is. This is
 * the single most important type in the codebase: it is what stops a model from
 * being mistaken for a measurement, and a demo from being mistaken for evidence.
 */
export const SourceType = z.enum([
  /** Measured in the water by an instrument. Argo, NDBC, ship CTD. */
  "in_situ",
  /** Measured from orbit. Radiometers, scatterometers, altimeters. */
  "satellite",
  /** Output of a numerical model, including reanalysis. Not a measurement. */
  "model",
  /** Statistical blend of observations onto a grid. OISST, sea-ice indices. */
  "analysis",
  /** Computed by us or the provider from one of the above. Anomalies, means. */
  "derived",
  /** Human/instrument records of organisms. OBIS occurrences. */
  "occurrence",
  /** Administrative or cartographic reference. MPAs, coastlines, bathymetry. */
  "reference",
  /** Ocean Warrior field measurement. The reason this platform exists. */
  "ocean_warrior_insitu",
  /** Synthetic. Exists only to demonstrate the interface. Never evidence. */
  "demo",
]);
export type SourceType = z.infer<typeof SourceType>;

/**
 * Human-readable freshness. Deliberately separate from SourceType, and
 * deliberately not a boolean "live" flag — the brief is emphatic that a cached
 * daily product must never be presented as live.
 */
export const Cadence = z.enum([
  "live",
  "near_real_time",
  "daily",
  "weekly",
  "monthly",
  "annual",
  "historical",
  "static",
]);
export type Cadence = z.infer<typeof Cadence>;

/** Implementation state of a layer, surfaced honestly in the UI. */
export const LayerStatus = z.enum([
  /** Implemented and pulling real data right now. */
  "live",
  /** Connector written, UI wired, but the source needs credentials we lack. */
  "credentials_required",
  /** Connector written but not surfaced as a map layer yet. */
  "connector_ready",
  /** Catalogued as roadmap. No connector yet. */
  "planned",
  /** Synthetic data for interface demonstration. Badged everywhere. */
  "demo",
]);
export type LayerStatus = z.infer<typeof LayerStatus>;

export const LayerCategory = z.enum([
  "ocean_physics",
  "ice",
  "climate",
  "biodiversity",
  "observing_systems",
  "human_activity",
  "conservation",
  "ocean_warrior",
]);
export type LayerCategory = z.infer<typeof LayerCategory>;

/**
 * Everything the UI needs to answer the brief's four questions for any layer:
 * what am I seeing, why does it matter, where did it come from, what are the
 * limitations.
 */
export const LayerMetadata = z.object({
  id: z.string(),
  title: z.string(),
  /** One sentence, plain English, no jargon. Shown to the public. */
  plainSummary: z.string(),
  /** Why a non-specialist should care. Optional but strongly encouraged. */
  whyItMatters: z.string().optional(),

  category: LayerCategory,
  sourceType: SourceType,
  status: LayerStatus,
  cadence: Cadence,

  /** Organisation that produced the data, e.g. "NOAA NCEI". */
  sourceOrg: z.string(),
  /** Product or dataset name as the provider calls it. */
  productName: z.string(),
  /** Provider's own dataset identifier, where one exists. */
  datasetId: z.string().optional(),

  variables: z.array(
    z.object({
      name: z.string(),
      unit: z.string(),
      description: z.string().optional(),
    }),
  ),

  spatialCoverage: z.string(),
  spatialResolution: z.string().optional(),
  temporalCoverage: z.string(),
  /** Typical lag between observation and availability. Be honest here. */
  latency: z.string().optional(),

  /** How we actually get the bytes. */
  accessMethod: z.string(),
  /** True if the source will not serve a browser directly (no CORS). */
  requiresProxy: z.boolean().default(false),
  /** Env var names needed, if any. Never the values. */
  requiredCredentials: z.array(z.string()).default([]),

  license: z.string(),
  attribution: z.string(),
  citation: z.string().optional(),
  sourceUrl: z.string().url(),
  doi: z.string().optional(),

  /**
   * The limitations note. Required, not optional — if a layer has no caveats
   * worth stating, it has not been thought about hard enough.
   */
  caveats: z.array(z.string()).min(1),
});
export type LayerMetadata = z.infer<typeof LayerMetadata>;

/** Standard connector result states. Mirrors the brief's error-state list. */
export type ConnectorState =
  | "loading"
  | "success"
  | "no_data"
  | "source_unavailable"
  | "credentials_required"
  | "rate_limited"
  | "stale_cache"
  | "unsupported_request";

export interface ConnectorResult<T> {
  state: ConnectorState;
  data: T | null;
  metadata: LayerMetadata;
  /** When we fetched it. */
  retrievedAt: string;
  /** Provider's own timestamp for the data, when they give us one. */
  sourceUpdatedAt?: string;
  /** Served from cache rather than a fresh fetch. */
  fromCache?: boolean;
  /** Human-readable explanation, shown in the UI when state !== success. */
  message?: string;
}

/**
 * Ocean Warrior field observation schema.
 *
 * Written before any expedition data exist, deliberately. Designing it now is
 * what makes the platform able to accept real measurements without a redesign.
 */
export const QcFlag = z.enum([
  "raw",
  "provisional",
  "passed",
  "failed",
  "expert_reviewed",
]);
export type QcFlag = z.infer<typeof QcFlag>;

export const Observation = z.object({
  expedition_id: z.string(),
  leg_id: z.string(),
  station_id: z.string(),
  timestamp_utc: z.string().datetime(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  depth_m: z.number().nullable(),

  /** CF standard name where one exists. */
  variable: z.string(),
  value: z.number(),
  unit: z.string(),

  instrument: z.string(),
  instrument_serial: z.string().nullable(),
  method: z.string(),
  sop_ref: z.string().nullable(),
  qc_flag: QcFlag,

  scientific_partner: z.string(),
  source_type: SourceType,

  license: z.string(),
  citation: z.string(),
  doi: z.string().nullable(),
  media_links: z.array(z.string()).default([]),
  notes: z.string().nullable(),

  ingested_at: z.string().datetime(),
  version: z.string(),
});
export type Observation = z.infer<typeof Observation>;

export const Station = z.object({
  station_id: z.string(),
  expedition_id: z.string(),
  leg_id: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  /** planned: not yet visited. sampled: data collected. validated: QC passed. */
  status: z.enum(["planned", "sampled", "validated"]),
  planned_date: z.string().nullable(),
  water_depth_m: z.number().nullable(),
  observations: z.array(Observation).default([]),
  notes: z.string().nullable(),
});
export type Station = z.infer<typeof Station>;

/** How a drawn route relates to reality. The brief is strict about this. */
export const RouteFidelity = z.enum([
  /** Actual recorded GPS positions. We have none of these yet. */
  "gps_track",
  /** Interpolated between officially published port calls. */
  "published_itinerary",
  /** A region, not a line. Used where the true track is unknown. */
  "region_only",
  /** Illustrative future concept. Not a commitment. */
  "concept",
]);
export type RouteFidelity = z.infer<typeof RouteFidelity>;

export const Expedition = z.object({
  slug: z.string(),
  name: z.string(),
  status: z.enum(["completed", "active", "planned", "concept"]),
  fidelity: RouteFidelity,
  /**
   * The label shown on the map and in every export. Non-negotiable: this is
   * what stops an illustrative line being read as a vessel track.
   */
  fidelityLabel: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  vessel: z.string().nullable(),
  region: z.string(),
  /** The big public question. Each expedition leads with one. */
  question: z.string(),
  questionDetail: z.string(),
  whatWeAlreadyKnow: z.array(
    z.object({ layerId: z.string(), note: z.string() }),
  ),
  whatWeWillMeasure: z.array(z.string()),
  scientificPartners: z.array(z.string()),
  waypoints: z.array(
    z.object({
      name: z.string(),
      lat: z.number(),
      lon: z.number(),
      country: z.string().optional(),
    }),
  ),
  /** Bounding region for region_only expeditions. */
  regionPolygon: z.array(z.tuple([z.number(), z.number()])).optional(),
  stations: z.array(Station).default([]),
  sourceNote: z.string(),
});
export type Expedition = z.infer<typeof Expedition>;
