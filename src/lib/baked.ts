"use client";

import { useEffect, useState } from "react";
import { asset } from "./paths";

/**
 * Loaders for the daily snapshots in public/data.
 *
 * These four sources refuse cross-origin browser requests, so a scheduled job
 * fetches them and commits the result. Each payload carries its own `fetchedAt`
 * and the UI shows it — the honesty requirement is that nothing baked is ever
 * described as live.
 */

export interface SeaIceHemisphere {
  start: string;
  end: string;
  values: (number | null)[];
  climatology: (number | null)[];
  climatologyPeriod: string;
  annualMinima: { year: number; date: string; extent: number }[];
  annualMaxima: { year: number; date: string; extent: number }[];
  latest: {
    date: string;
    extent: number;
    climatology?: number;
    anomaly?: number;
    rankLowest?: number;
    rankOutOf?: number;
  };
}

export interface SeaIceData {
  fetchedAt: string;
  source: {
    org: string;
    product: string;
    url: string;
    unit: string;
    definition: string;
    attribution: string;
  };
  north: SeaIceHemisphere;
  south: SeaIceHemisphere;
}

export interface ArgoData {
  fetchedAt: string;
  source: { org: string; product: string; url: string; attribution: string };
  windowDays: number;
  count: number;
  withoutPosition: number;
  floats: { id: string; time: string; lat: number; lon: number }[];
}

export interface NdbcData {
  fetchedAt: string;
  source: { org: string; product: string; url: string; attribution: string };
  count: number;
  stations: {
    id: string;
    lat: number;
    lon: number;
    time: string;
    windSpeed: number | null;
    waveHeight: number | null;
    wavePeriod: number | null;
    pressure: number | null;
    airTemp: number | null;
    waterTemp: number | null;
  }[];
}

export interface GistempData {
  fetchedAt: string;
  source: { org: string; product: string; url: string; unit: string; baseline: string };
  annual: { year: number; anomaly: number }[];
  monthly: [string, number][];
}

type State<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string };

function useJson<T>(path: string): State<T> {
  const [state, setState] = useState<State<T>>({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(asset(path))
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data: T) => {
        if (!cancelled) setState({ status: "success", data, error: null });
      })
      .catch(() => {
        // Never substitute anything for a failed load. The caller renders an
        // explicit unavailable state instead.
        if (!cancelled)
          setState({
            status: "error",
            data: null,
            error: "This snapshot is unavailable.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}

export const useSeaIce = () => useJson<SeaIceData>("/data/sea-ice-extent.json");
export const useArgo = () => useJson<ArgoData>("/data/argo-floats.json");
export const useNdbc = () => useJson<NdbcData>("/data/ndbc-latest.json");
export const useGistemp = () => useJson<GistempData>("/data/gistemp.json");

/** "3 days ago" style relative age, for snapshot freshness labels. */
export function relativeAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "less than an hour ago";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
