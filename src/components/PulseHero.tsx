"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import OceanGlobe from "./OceanGlobe";
import { GIBS_LAYERS } from "@/lib/gibs";

/**
 * Home page hero.
 *
 * One globe, slowly turning, carrying the most recent sea-surface temperature
 * anomaly field and every Ocean Warrior route. The intent is that the first
 * screen answers "what is this?" before any text is read: a planet, its
 * temperature departing from normal, and lines where a ship goes.
 */

/** Most recent date GIBS has for the MUR anomaly product. */
function mostRecentAnomalyDate(): string {
  const end = GIBS_LAYERS.sstAnomaly.end;
  return end ?? new Date().toISOString().slice(0, 10);
}

export default function PulseHero() {
  const [date] = useState(mostRecentAnomalyDate);
  const expeditions = useMemo(
    () => ["arctic-north-atlantic", "svalbard-2027", "svalbard-2023"],
    [],
  );

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden">
      <OceanGlobe
        dataLayer="sstAnomaly"
        date={date}
        opacity={0.82}
        center={[-25, 40]}
        zoom={1.55}
        expeditions={expeditions}
        globe
        autoRotate
        /* Deliberately not interactive. A zoomable map here hijacks the scroll
           wheel, so the page would not scroll past the hero. The globe simply
           turns; Explore is where you handle the data. */
        interactive={false}
        className="absolute inset-0 h-full w-full"
      />

      {/* Legibility scrim. Weighted to the left, where the type sits. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(2,9,20,0.88) 0%, rgba(2,9,20,0.6) 22%, rgba(2,9,20,0.1) 46%, transparent 62%), linear-gradient(to top, rgba(2,9,20,0.85) 0%, transparent 30%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-10 lg:px-16">
          <div className="pointer-events-auto max-w-xl">
            {/* Ocean Warrior is the organisation; Planetary Pulse is one of
                its outputs. The type scale should say so. */}
            <p
              className="display fade-up text-[clamp(1.9rem,4.6vw,3.4rem)] leading-none text-ice"
              style={{ letterSpacing: "0.03em" }}
            >
              Ocean Warrior
            </p>

            <div
              className="fade-up mt-4 mb-4 h-px w-24 bg-[var(--hairline-bright)]"
              style={{ animationDelay: "60ms" }}
            />

            <h1
              className="display fade-up text-[clamp(2.4rem,6.4vw,5.2rem)] text-cyan-bright"
              style={{ animationDelay: "80ms" }}
            >
              Planetary
              <br />
              Pulse
            </h1>

            <p
              className="fade-up mt-7 max-w-md text-lg leading-relaxed text-ice/90"
              style={{ animationDelay: "160ms" }}
            >
              A living view of a changing ocean.
            </p>

            <p
              className="fade-up mt-3 max-w-md text-sm leading-relaxed text-muted"
              style={{ animationDelay: "220ms" }}
            >
              Global observations. Expedition science. One shared picture.
            </p>

            <div
              className="fade-up mt-10 flex flex-wrap gap-3"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                href="/explore"
                className="rounded-sm bg-cyan px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-abyss transition-colors duration-200 hover:bg-cyan-bright"
              >
                Explore the ocean
              </Link>
              <Link
                href="/expeditions"
                className="rounded-sm border border-[var(--hairline-bright)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-ice transition-colors duration-200 hover:border-cyan hover:text-cyan-bright"
              >
                Follow the expedition
              </Link>
              <Link
                href="/data"
                className="rounded-sm px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition-colors duration-200 hover:text-ice"
              >
                View the data
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* What the globe is currently showing. */}
      <div className="pointer-events-none absolute bottom-8 left-0 right-0">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-end justify-between gap-4 px-6 sm:px-10 lg:px-16">
          <div className="pointer-events-auto">
            <p className="eyebrow mb-1.5">Showing</p>
            <p className="text-xs text-muted">
              Sea surface temperature anomaly ·{" "}
              <span className="tnum text-ice">{date}</span>
            </p>
            <p className="mt-1 text-[11px] text-dim">
              NASA/JPL MUR · 1 km · departure from normal
            </p>
          </div>

          <div className="pointer-events-auto hidden sm:block">
            <p className="eyebrow mb-2 text-right">Sources</p>
            <p className="text-[11px] tracking-wide text-dim">
              NASA · NOAA · NSIDC · Copernicus Marine · Argo · OBIS
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
