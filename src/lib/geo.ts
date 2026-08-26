import { geoInterpolate } from "d3-geo";
import type { ExpeditionRecord, RouteWaypoint } from "@/data/expeditions";
import type { FeatureCollection, LineString, Point, Polygon } from "geojson";

/**
 * Route geometry.
 *
 * Waypoints are joined with great-circle interpolation, which is both the
 * shortest path on a sphere and — importantly for a globe projection — the line
 * that stays visually correct when the map is rotated. A straight line in
 * longitude/latitude is a curve on the real Earth, and drawing one would make
 * the Arctic routes badly wrong.
 */

const STEPS_PER_SEGMENT = 48;

function densifySegment(
  a: RouteWaypoint,
  b: RouteWaypoint,
): [number, number][] {
  const interpolate = geoInterpolate([a.lon, a.lat], [b.lon, b.lat]);
  const points: [number, number][] = [];
  for (let i = 0; i < STEPS_PER_SEGMENT; i++) {
    points.push(interpolate(i / STEPS_PER_SEGMENT) as [number, number]);
  }
  return points;
}

/**
 * Split a densified path wherever it crosses the antimeridian.
 *
 * Without this a route crossing 180° draws a horizontal streak straight across
 * the entire map. Splitting into separate LineStrings is the standard fix.
 */
function splitAtAntimeridian(
  coords: [number, number][],
): [number, number][][] {
  const parts: [number, number][][] = [];
  let current: [number, number][] = [];

  for (let i = 0; i < coords.length; i++) {
    if (i > 0 && Math.abs(coords[i][0] - coords[i - 1][0]) > 180) {
      parts.push(current);
      current = [];
    }
    current.push(coords[i]);
  }
  if (current.length > 1) parts.push(current);
  return parts.filter((p) => p.length > 1);
}

export function legToLineFeatures(
  expedition: ExpeditionRecord,
  legId: string,
): FeatureCollection<LineString> {
  const leg = expedition.legs.find((l) => l.id === legId);
  if (!leg) return { type: "FeatureCollection", features: [] };

  const coords: [number, number][] = [];
  for (let i = 0; i < leg.waypoints.length - 1; i++) {
    coords.push(...densifySegment(leg.waypoints[i], leg.waypoints[i + 1]));
  }
  const last = leg.waypoints[leg.waypoints.length - 1];
  coords.push([last.lon, last.lat]);

  return {
    type: "FeatureCollection",
    features: splitAtAntimeridian(coords).map((part, index) => ({
      type: "Feature" as const,
      id: `${expedition.slug}-${legId}-${index}`,
      geometry: { type: "LineString" as const, coordinates: part },
      properties: {
        expedition: expedition.slug,
        expeditionName: expedition.name,
        leg: legId,
        legName: leg.name,
        legDescription: leg.description,
        fidelity: expedition.fidelity,
        fidelityLabel: expedition.fidelityLabel,
        // Per-leg colour so each voyage is separately identifiable.
        accent: leg.accent ?? expedition.accent,
        dashed: expedition.dashed,
      },
    })),
  };
}

export function expeditionRouteFeatures(
  expedition: ExpeditionRecord,
): FeatureCollection<LineString> {
  const features = expedition.legs.flatMap(
    (leg) => legToLineFeatures(expedition, leg.id).features,
  );
  return { type: "FeatureCollection", features };
}

/** Only `port` waypoints become markers. Routing points stay invisible. */
export function expeditionPortFeatures(
  expedition: ExpeditionRecord,
): FeatureCollection<Point> {
  const seen = new Set<string>();
  const features = expedition.legs.flatMap((leg) =>
    leg.waypoints
      .filter((w) => w.kind === "port")
      .filter((w) => {
        const key = `${w.name}@${w.lat.toFixed(3)},${w.lon.toFixed(3)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((w) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [w.lon, w.lat] },
        properties: {
          name: w.name,
          country: w.country ?? "",
          expedition: expedition.slug,
          expeditionName: expedition.name,
          accent: expedition.accent,
          leg: leg.id,
        },
      })),
  );
  return { type: "FeatureCollection", features };
}

export function expeditionRegionFeature(
  expedition: ExpeditionRecord,
): FeatureCollection<Polygon> {
  if (!expedition.regionPolygon) {
    return { type: "FeatureCollection", features: [] };
  }
  // Stored as [lat, lon] for readability; GeoJSON wants [lon, lat].
  const ring = expedition.regionPolygon.map(
    ([lat, lon]) => [lon, lat] as [number, number],
  );
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [ring] },
        properties: {
          expedition: expedition.slug,
          expeditionName: expedition.name,
          fidelityLabel: expedition.fidelityLabel,
          accent: expedition.accent,
        },
      },
    ],
  };
}

/** Great-circle distance in kilometres. */
export function haversineKm(
  [lon1, lat1]: [number, number],
  [lon2, lat2]: [number, number],
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Total route length, summed along the densified great-circle path. */
export function routeLengthKm(expedition: ExpeditionRecord): number {
  let total = 0;
  for (const leg of expedition.legs) {
    for (let i = 0; i < leg.waypoints.length - 1; i++) {
      total += haversineKm(
        [leg.waypoints[i].lon, leg.waypoints[i].lat],
        [leg.waypoints[i + 1].lon, leg.waypoints[i + 1].lat],
      );
    }
  }
  return total;
}

export const KM_PER_NAUTICAL_MILE = 1.852;
