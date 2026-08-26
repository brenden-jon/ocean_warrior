"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { asset } from "@/lib/paths";

/**
 * Animated surface-current particles.
 *
 * Particles are advected by NOAA's blended surface-current field: each one
 * looks up the velocity at its position, moves, and leaves a short fading
 * trail. The motion is therefore derived from the data, not decorative — a
 * particle's direction and speed are the measured u/v at that point.
 *
 * What it is NOT: these particles are not water, and not drifters. They are a
 * way of drawing a vector field, which the UI states plainly. The underlying
 * product is geostrophic, altimetry-derived and daily, so it shows the large
 * scale circulation rather than tides, wind drift or anything short-lived.
 */

interface CurrentsData {
  fetchedAt: string;
  date: string;
  source: { org: string; product: string; url: string; unit: string };
  grid: {
    lat0: number;
    lon0: number;
    dLat: number;
    dLon: number;
    nLat: number;
    nLon: number;
  };
  u: (number | null)[];
  v: (number | null)[];
}

const PARTICLE_COUNT = 3200;
/** Frames a particle lives before being respawned, so trails keep renewing. */
const MAX_AGE = 90;
/** Degrees of longitude per (m/s · frame). Tuned for a readable drift speed. */
const SPEED_SCALE = 0.55;

export default function CurrentParticles({
  map,
  visible,
  onLoaded,
}: {
  map: MapLibreMap | null;
  visible: boolean;
  onLoaded?: (info: { date: string; fetchedAt: string }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<CurrentsData | null>(null);
  const frameRef = useRef<number | null>(null);

  /* ------------------------------------------------------------- data -- */
  useEffect(() => {
    if (!visible || data) return;
    let cancelled = false;
    fetch(asset("/data/currents.json"))
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CurrentsData | null) => {
        if (cancelled || !d) return;
        setData(d);
        onLoaded?.({ date: d.date, fetchedAt: d.fetchedAt });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visible, data, onLoaded]);

  /* -------------------------------------------------------- animation -- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map || !data || !visible) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const { grid, u, v } = data;

    /** Nearest-cell lookup. Returns null over land or outside the grid. */
    const sample = (lat: number, lon: number): [number, number] | null => {
      let wrapped = lon;
      while (wrapped < grid.lon0) wrapped += 360;
      while (wrapped >= grid.lon0 + grid.nLon * grid.dLon) wrapped -= 360;
      const i = Math.round((lat - grid.lat0) / grid.dLat);
      const j = Math.round((wrapped - grid.lon0) / grid.dLon);
      if (i < 0 || i >= grid.nLat || j < 0 || j >= grid.nLon) return null;
      const k = i * grid.nLon + j;
      const uu = u[k];
      const vv = v[k];
      if (uu == null || vv == null) return null;
      return [uu, vv];
    };

    interface Particle {
      lon: number;
      lat: number;
      age: number;
    }

    const particles: Particle[] = [];

    /** Respawn somewhere with actual current data, biased to the viewport. */
    const respawn = (p: Particle) => {
      for (let attempt = 0; attempt < 30; attempt++) {
        const bounds = map.getBounds();
        const lat =
          bounds.getSouth() +
          Math.random() * (bounds.getNorth() - bounds.getSouth());
        const lon =
          bounds.getWest() +
          Math.random() * (bounds.getEast() - bounds.getWest());
        if (sample(lat, lon)) {
          p.lon = lon;
          p.lat = lat;
          p.age = Math.floor(Math.random() * MAX_AGE);
          return;
        }
      }
      p.age = MAX_AGE; // Nothing found; try again next frame.
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = { lon: 0, lat: 0, age: 0 };
      respawn(p);
      particles.push(p);
    }

    const resize = () => {
      const rect = map.getContainer().getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    map.on("resize", resize);

    /**
     * On a globe, half the particles are round the back. MapLibre still
     * projects them, so without this they smear across the visible face.
     */
    const isVisible = (lon: number, lat: number): boolean => {
      const centre = map.getCenter();
      const toRad = Math.PI / 180;
      const cosAngle =
        Math.sin(centre.lat * toRad) * Math.sin(lat * toRad) +
        Math.cos(centre.lat * toRad) *
          Math.cos(lat * toRad) *
          Math.cos((lon - centre.lng) * toRad);
      return cosAngle > 0.06;
    };

    const width = () => canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
    const height = () => canvas.height / (Math.min(window.devicePixelRatio || 1, 2));

    const step = () => {
      // Fade rather than clear, which is what leaves the trails.
      context.globalCompositeOperation = "destination-out";
      context.fillStyle = "rgba(0,0,0,0.10)";
      context.fillRect(0, 0, width(), height());
      context.globalCompositeOperation = "source-over";

      context.lineWidth = 1.1;
      context.lineCap = "round";

      for (const p of particles) {
        p.age += 1;
        if (p.age > MAX_AGE) {
          respawn(p);
          continue;
        }

        const velocity = sample(p.lat, p.lon);
        if (!velocity) {
          respawn(p);
          continue;
        }

        const [uu, vv] = velocity;
        const speed = Math.hypot(uu, vv);

        // Longitude degrees shrink towards the poles; without this correction
        // particles race sideways at high latitude and crawl at the equator.
        const latRad = (p.lat * Math.PI) / 180;
        const cosLat = Math.max(Math.cos(latRad), 0.15);

        const nextLon = p.lon + (uu * SPEED_SCALE) / cosLat;
        const nextLat = p.lat + vv * SPEED_SCALE;

        if (nextLat > 89 || nextLat < -89) {
          respawn(p);
          continue;
        }

        if (isVisible(p.lon, p.lat) && isVisible(nextLon, nextLat)) {
          const a = map.project([p.lon, p.lat]);
          const b = map.project([nextLon, nextLat]);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          // A wrapped or occluded point produces an absurd jump; skip it.
          if (dx * dx + dy * dy < 40000) {
            // Faster water draws brighter, so the major currents stand out.
            const intensity = Math.min(speed / 0.7, 1);
            context.strokeStyle = `rgba(${150 + intensity * 105}, ${
              225 + intensity * 30
            }, 255, ${0.28 + intensity * 0.6})`;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }

        p.lon = nextLon;
        p.lat = nextLat;
      }

      frameRef.current = requestAnimationFrame(step);
    };

    if (reduceMotion) {
      // Draw one static frame of streaks: the field is still legible, nothing
      // moves. Repeated a few times so the streaks have some length.
      for (let i = 0; i < 26; i++) step();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    } else {
      frameRef.current = requestAnimationFrame(step);
    }

    const clear = () => context.clearRect(0, 0, width(), height());
    map.on("movestart", clear);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      map.off("resize", resize);
      map.off("movestart", clear);
      context.clearRect(0, 0, width(), height());
    };
  }, [map, data, visible]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  );
}
