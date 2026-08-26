"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { asset } from "@/lib/paths";

/**
 * The Arctic sea-ice time machine.
 *
 * One map for each year's minimum and each year's maximum, 1979 to now, dragged
 * through on a single timeline. The map is the subject; the numbers support it.
 *
 * Frames come from NSIDC's own Sea Ice Index v4 rendering — the same product
 * that produces the extent figures shown beside them, so the picture and the
 * number can never disagree. Frames are preloaded for the active mode so that
 * dragging is instant rather than a sequence of network requests.
 */

interface Frame {
  kind: "min" | "max" | "latest";
  year: number;
  date: string;
  extent: number;
  file: string;
}

interface Manifest {
  hemisphere: string;
  source: {
    org: string;
    product: string;
    url: string;
    unit: string;
    definition: string;
    attribution: string;
  };
  imageSource: { product: string; url: string; note: string };
  frames: Frame[];
}

type Mode = "min" | "max";

const MODE_COPY: Record<Mode, { label: string; when: string; blurb: string }> = {
  min: {
    label: "Annual minimum",
    when: "September",
    blurb:
      "The least ice of the year, at the end of the melt season. This is the measurement that has changed most.",
  },
  max: {
    label: "Annual maximum",
    when: "March",
    blurb:
      "The most ice of the year, at the end of winter. It has declined too, but less dramatically than the summer minimum.",
  },
};

export default function ArcticTimeMachine() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("min");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [compare, setCompare] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    fetch(asset("/ice/manifest-north.json"))
      .then((r) => {
        if (!r.ok) throw new Error(`manifest ${r.status}`);
        return r.json();
      })
      .then(setManifest)
      .catch(() => setError("Sea-ice frames are not available in this build."));
  }, []);

  /** Frames for the active mode, oldest first. */
  const frames = useMemo(() => {
    if (!manifest) return [];
    return manifest.frames
      .filter((f) => f.kind === mode)
      .sort((a, b) => a.year - b.year);
  }, [manifest, mode]);

  // Land on the most recent year whenever the mode changes.
  useEffect(() => {
    if (frames.length > 0) setIndex(frames.length - 1);
  }, [frames.length, mode]);

  /* --- preload, so dragging never waits on the network ------------------ */
  useEffect(() => {
    if (frames.length === 0) return;
    let cancelled = false;
    setLoadedCount(0);
    let done = 0;
    for (const frame of frames) {
      const img = new Image();
      img.onload = img.onerror = () => {
        if (cancelled) return;
        done += 1;
        setLoadedCount(done);
      };
      img.src = asset(`/ice/${frame.file}`);
    }
    return () => {
      cancelled = true;
    };
  }, [frames]);

  /* --- playback ---------------------------------------------------------- */
  const stop = useCallback(() => {
    setPlaying(false);
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    timer.current = window.setInterval(() => {
      setIndex((current) => {
        if (current >= frames.length - 1) {
          // Hold on the final year rather than looping straight back to 1979,
          // which would undercut the point the sequence just made.
          window.setTimeout(() => setPlaying(false), 0);
          return current;
        }
        return current + 1;
      });
    }, 420);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, frames.length]);

  useEffect(() => () => stop(), [stop]);

  if (error) {
    return (
      <div className="glass rounded-sm p-8 text-center">
        <p className="text-sm text-muted">{error}</p>
      </div>
    );
  }

  if (!manifest || frames.length === 0) {
    return (
      <div className="flex aspect-square w-full max-w-2xl items-center justify-center">
        <div className="skeleton h-full w-full rounded-full" />
      </div>
    );
  }

  const current = frames[index];
  const first = frames[0];
  const baseline = frames.find((f) => f.year === 1979) ?? first;
  const changeFromBaseline = current.extent - baseline.extent;
  const percentChange = (changeFromBaseline / baseline.extent) * 100;
  const preloading = loadedCount < frames.length;

  return (
    <div className="w-full">
      {/* ---------------------------------------------------------- mode -- */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        {(Object.keys(MODE_COPY) as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              stop();
              setMode(m);
            }}
            aria-pressed={mode === m}
            className={`rounded-sm border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${
              mode === m
                ? "border-cyan bg-cyan/10 text-cyan-bright"
                : "border-[var(--hairline)] text-muted hover:border-[var(--hairline-bright)] hover:text-ice"
            }`}
          >
            {MODE_COPY[m].label}
            <span className="ml-2 font-normal normal-case tracking-normal text-dim">
              {MODE_COPY[m].when}
            </span>
          </button>
        ))}
      </div>

      <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
        {/* ------------------------------------------------------ readout -- */}
        <div className="order-2 lg:order-1 lg:text-right">
          <p className="eyebrow mb-2">
            {compare ? "Comparing" : MODE_COPY[mode].label}
          </p>
          <p className="display text-7xl leading-none text-ice tnum sm:text-8xl">
            {current.year}
          </p>
          <p className="mt-4 text-3xl text-cyan-bright tnum">
            {current.extent.toFixed(2)}
            <span className="ml-2 text-sm text-muted">million km²</span>
          </p>
          <p className="mt-1 text-xs text-dim tnum">{current.date}</p>

          {current.year !== baseline.year && (
            <p className="mt-5 text-sm leading-relaxed text-muted">
              <span
                className={
                  changeFromBaseline < 0 ? "text-amber" : "text-cyan-bright"
                }
              >
                {changeFromBaseline > 0 ? "+" : ""}
                {changeFromBaseline.toFixed(2)} million km²
              </span>{" "}
              <span className="text-dim">
                ({percentChange > 0 ? "+" : ""}
                {percentChange.toFixed(0)}%) compared with {baseline.year}
              </span>
            </p>
          )}
        </div>

        {/* -------------------------------------------------------- globe -- */}
        <div className="order-1 mx-auto w-full max-w-[min(78vw,560px)] lg:order-2">
          <div className="relative aspect-square">
            {compare && (
              <img
                src={asset(`/ice/${baseline.file}`)}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full opacity-40"
                style={{ filter: "saturate(0.25) brightness(1.15)" }}
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.file}
              src={asset(`/ice/${current.file}`)}
              alt={`Arctic sea-ice concentration on ${current.date}, ${MODE_COPY[mode].label.toLowerCase()} of ${current.year}`}
              className="absolute inset-0 h-full w-full"
              style={{
                filter: "drop-shadow(0 0 60px rgba(0,183,232,0.16))",
              }}
            />
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-dim">
            Orange line: median ice edge 1981–2010. Grey disc at the pole: the
            area the satellite orbit never observes.
          </p>
        </div>

        {/* ------------------------------------------------------ context -- */}
        <div className="order-3">
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            {MODE_COPY[mode].blurb}
          </p>

          <button
            onClick={() => setCompare((c) => !c)}
            aria-pressed={compare}
            className={`mt-6 rounded-sm border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${
              compare
                ? "border-cyan bg-cyan/10 text-cyan-bright"
                : "border-[var(--hairline)] text-muted hover:border-[var(--hairline-bright)] hover:text-ice"
            }`}
          >
            {compare ? `Comparing with ${baseline.year}` : `Ghost ${baseline.year} behind`}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------- timeline -- */}
      <div className="mt-12">
        <div className="mb-3 flex items-center gap-4">
          <button
            onClick={() => {
              if (playing) {
                stop();
              } else {
                if (index >= frames.length - 1) setIndex(0);
                setPlaying(true);
              }
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-bright)] text-ice transition-colors duration-200 hover:border-cyan hover:text-cyan-bright"
            aria-label={playing ? "Pause" : "Play through the years"}
          >
            {playing ? (
              <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                <rect width="4" height="14" rx="1" />
                <rect x="8" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="13" height="15" viewBox="0 0 13 15" fill="currentColor">
                <path d="M1 1.5a1 1 0 0 1 1.5-.87l9 6a1 1 0 0 1 0 1.74l-9 6A1 1 0 0 1 1 13.5z" />
              </svg>
            )}
          </button>

          <label htmlFor="ice-year" className="sr-only">
            Year
          </label>
          <input
            id="ice-year"
            type="range"
            min={0}
            max={frames.length - 1}
            step={1}
            value={index}
            onChange={(e) => {
              stop();
              setIndex(Number(e.target.value));
            }}
            className="ice-slider h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--hairline-bright)] accent-cyan"
            aria-valuetext={`${current.year}, ${current.extent.toFixed(2)} million square kilometres`}
          />
        </div>

        {/* Extent as a bar per year. The chart is deliberately secondary to the
            maps — a supporting readout, not the main event. */}
        <div className="flex h-16 items-end gap-[2px]" aria-hidden>
          {frames.map((frame, i) => {
            const max = Math.max(...frames.map((f) => f.extent));
            const height = (frame.extent / max) * 100;
            const active = i === index;
            return (
              <button
                key={frame.file}
                onClick={() => {
                  stop();
                  setIndex(i);
                }}
                title={`${frame.year}: ${frame.extent.toFixed(2)} million km²`}
                className="group relative flex-1 transition-opacity duration-150"
                style={{ height: "100%" }}
                tabIndex={-1}
              >
                <span
                  className="absolute bottom-0 left-0 right-0 rounded-t-[1px] transition-colors duration-150"
                  style={{
                    height: `${height}%`,
                    background: active
                      ? "var(--color-cyan-bright)"
                      : "rgba(143,167,184,0.28)",
                  }}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex justify-between text-[11px] text-dim tnum">
          <span>{first.year}</span>
          <span>{frames[frames.length - 1].year}</span>
        </div>

        {preloading && (
          <p className="mt-3 text-center text-[11px] text-dim" role="status">
            Loading frames… {loadedCount} of {frames.length}
          </p>
        )}
      </div>

      {/* ----------------------------------------------------- provenance -- */}
      <div className="mt-10 border-t border-[var(--hairline)] pt-5">
        <p className="text-[11px] leading-relaxed text-dim">
          <span className="text-muted">{manifest.source.product}</span> ·{" "}
          {manifest.source.definition} Extent is reported in{" "}
          {manifest.source.unit}. Maps are NSIDC&rsquo;s published daily
          concentration rendering over NASA Blue Marble, cropped to the globe.{" "}
          <a
            href={manifest.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted underline decoration-dotted underline-offset-2 hover:text-cyan-bright"
          >
            Source and full documentation
          </a>
          .
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-dim">
          {manifest.source.attribution}
        </p>
      </div>

      <style jsx>{`
        .ice-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-cyan-bright);
          border: 2px solid var(--color-abyss);
          cursor: grab;
        }
        .ice-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
        }
        .ice-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-cyan-bright);
          border: 2px solid var(--color-abyss);
          cursor: grab;
        }
      `}</style>
    </div>
  );
}
