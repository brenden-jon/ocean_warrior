/**
 * Ocean Warrior vessel positions.
 *
 * ---------------------------------------------------------------------------
 * THESE ARE NOT LIVE POSITIONS.
 *
 * No AIS or tracker feed is connected. Ocean Warrior has not provided one, and
 * the brief is explicit that commercial AIS sources must not be scraped. What
 * is drawn here is a single vessel at its home port, so that the interface can
 * demonstrate how a live position will appear once an authorised feed exists.
 *
 * Every vessel therefore carries `positionSource: "demo"` and is badged in the
 * UI. When a real feed is connected, the connector fills the same shape and the
 * badge changes — no component needs rewriting.
 * ---------------------------------------------------------------------------
 */

export type PositionSource = "ais" | "satellite_tracker" | "manual_report" | "demo";

export interface VesselPosition {
  id: string;
  name: string;
  /** Expedition this vessel is sailing for, if any. */
  expeditionSlug: string | null;
  latitude: number;
  longitude: number;
  /** ISO timestamp of the fix. Null while no feed is connected. */
  timestampUtc: string | null;
  /** Course over ground in degrees, when a feed supplies it. */
  headingDeg: number | null;
  /** Speed over ground in knots, when a feed supplies it. */
  speedKn: number | null;
  status: "in_port" | "under_way" | "unknown";
  positionSource: PositionSource;
  /** Shown verbatim in the UI. Must state plainly what this position is. */
  note: string;
}

export const VESSELS: VesselPosition[] = [
  {
    id: "OW-VESSEL-01",
    name: "Ocean Warrior vessel",
    expeditionSlug: "arctic-north-atlantic",
    // Longyearbyen, Svalbard — the northern end of the Resolute circuit.
    latitude: 78.2232,
    longitude: 15.6469,
    timestampUtc: null,
    headingDeg: null,
    speedKn: null,
    status: "in_port",
    positionSource: "demo",
    note:
      "Placeholder position at Longyearbyen. No live tracker feed is connected, so this is not a real-time location.",
  },
];

export const VESSEL_FEED_STATUS = {
  connected: false,
  summary:
    "No live vessel feed is connected. Positions shown are placeholders at home port and are badged accordingly.",
} as const;
