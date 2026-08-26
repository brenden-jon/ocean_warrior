"use client";

import { useMemo } from "react";
import OceanGlobe from "./OceanGlobe";
import StatusBadge from "./StatusBadge";
import { getExpedition } from "@/data/expeditions";
import { getLayer } from "@/lib/catalog";
import { routeLengthKm, KM_PER_NAUTICAL_MILE } from "@/lib/geo";
import { GIBS_LAYERS } from "@/lib/gibs";

/**
 * One expedition, led by its question rather than its itinerary.
 *
 * The order is deliberate and follows the brief: the question first, then what
 * the existing observing systems already say about that place, then what the
 * expedition would add. That sequence is the whole argument for Ocean Warrior —
 * it only makes sense once you can see the gap.
 */
export default function ExpeditionDetail({ slug }: { slug: string }) {
  const expedition = getExpedition(slug);

  const camera = useMemo(() => {
    if (!expedition) return { center: [0, 60] as [number, number], zoom: 2 };
    const points = expedition.legs.flatMap((l) => l.waypoints);
    if (points.length === 0 && expedition.regionPolygon) {
      const lats = expedition.regionPolygon.map((p) => p[0]);
      const lons = expedition.regionPolygon.map((p) => p[1]);
      return {
        center: [
          (Math.min(...lons) + Math.max(...lons)) / 2,
          (Math.min(...lats) + Math.max(...lats)) / 2,
        ] as [number, number],
        zoom: 3.4,
      };
    }
    if (points.length === 0) return { center: [0, 60] as [number, number], zoom: 2 };
    const lats = points.map((p) => p.lat);
    const lons = points.map((p) => p.lon);
    const spread = Math.max(
      Math.max(...lats) - Math.min(...lats),
      (Math.max(...lons) - Math.min(...lons)) / 2,
    );
    return {
      center: [
        (Math.min(...lons) + Math.max(...lons)) / 2,
        (Math.min(...lats) + Math.max(...lats)) / 2,
      ] as [number, number],
      zoom: spread > 40 ? 1.6 : spread > 20 ? 2.4 : spread > 8 ? 3.4 : 4.6,
    };
  }, [expedition]);

  if (!expedition) return null;

  const km = routeLengthKm(expedition);
  const date = GIBS_LAYERS.sstAnomaly.end ?? "2026-08-25";

  return (
    <main>
      {/* ----------------------------------------------------------- hero -- */}
      <section className="relative h-[76dvh] min-h-[520px] w-full overflow-hidden">
        <OceanGlobe
          dataLayer="sstAnomaly"
          date={date}
          opacity={0.7}
          center={camera.center}
          zoom={camera.zoom}
          expeditions={[expedition.slug]}
          globe
          interactive
          className="absolute inset-0 h-full w-full"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(2,9,20,0.96) 4%, rgba(2,9,20,0.5) 34%, transparent 62%)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-[1500px] px-6 pb-10 sm:px-10 lg:px-16">
            <div className="pointer-events-auto max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-[2px] border border-cyan/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-bright">
                  {expedition.status}
                </span>
                <span className="text-[11px] text-dim">{expedition.region}</span>
              </div>
              <h1 className="display text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.95] text-ice">
                {expedition.name}
              </h1>
              <p className="mt-4 rounded-sm border border-amber/25 bg-[rgba(255,181,71,0.06)] px-3 py-2 text-[11px] uppercase tracking-[0.1em] text-amber">
                {expedition.fidelityLabel}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-6 pb-24 sm:px-10 lg:px-16">
        {/* ------------------------------------------------------ facts -- */}
        <dl className="grid gap-px border-b border-[var(--hairline)] py-8 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Status" value={expedition.status} />
          <Fact
            label="Dates"
            value={
              expedition.startDate
                ? `${expedition.startDate}${expedition.endDate ? ` → ${expedition.endDate}` : ""}`
                : "Not published"
            }
          />
          <Fact label="Vessel" value={expedition.vessel ?? "Not published"} />
          <Fact
            label="Route length"
            value={
              km > 0
                ? `${Math.round(km).toLocaleString()} km · ${Math.round(km / KM_PER_NAUTICAL_MILE).toLocaleString()} nm`
                : "Area, not a route"
            }
          />
        </dl>

        {/* --------------------------------------------------- question -- */}
        <section className="grid gap-12 py-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="eyebrow mb-5">The question</p>
            <h2 className="display text-[clamp(1.8rem,3.5vw,2.8rem)] leading-tight text-ice">
              {expedition.question}
            </h2>
          </div>
          <p className="self-end text-base leading-relaxed text-muted">
            {expedition.questionDetail}
          </p>
        </section>

        {/* ----------------------------------------- what we already know -- */}
        {expedition.whatWeAlreadyKnow.length > 0 && (
          <section className="border-t border-[var(--hairline)] py-16">
            <p className="eyebrow mb-2">What we already know</p>
            <p className="mb-8 max-w-2xl text-sm leading-relaxed text-dim">
              Before a ship leaves harbour, the world&rsquo;s observing systems
              already say a great deal about this place. Each of these comes
              from a dataset in the catalog, not from us.
            </p>
            <ul className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
              {expedition.whatWeAlreadyKnow.map((item) => {
                const layer = getLayer(item.layerId);
                return (
                  <li
                    key={item.layerId}
                    className="border border-[var(--hairline)] p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-cyan-bright">
                        {layer?.title ?? item.layerId}
                      </span>
                      {layer && <StatusBadge status={layer.status} />}
                    </div>
                    <p className="text-sm leading-relaxed text-muted">
                      {item.note}
                    </p>
                    {layer && (
                      <p className="mt-3 text-[10px] text-dim">
                        {layer.sourceOrg}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* -------------------------------------------- what we'll measure -- */}
        <section className="grid gap-12 border-t border-[var(--hairline)] py-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="eyebrow mb-5">What the expedition adds</p>
            <ul className="space-y-3">
              {expedition.whatWeWillMeasure.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm leading-relaxed text-muted"
                >
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-cyan" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-5">Scientific partners</p>
            {expedition.scientificPartners.length > 0 ? (
              <ul className="space-y-2">
                {expedition.scientificPartners.map((p) => (
                  <li key={p} className="text-sm text-muted">
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-dim">
                Not yet announced. Partner institutions and principal
                investigators will be listed here, and every measurement will
                carry its partner in its provenance record.
              </p>
            )}

            <p className="eyebrow mb-3 mt-10">Legs</p>
            {expedition.legs.length > 0 ? (
              <ul className="space-y-4">
                {expedition.legs.map((leg) => (
                  <li key={leg.id}>
                    <p className="text-sm text-ice">{leg.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-dim">
                      {leg.description}
                    </p>
                    <p className="mt-1.5 text-[11px] text-muted">
                      {leg.waypoints
                        .filter((w) => w.kind === "port")
                        .map((w) => w.name)
                        .join(" → ")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-dim">
                No route drawn — see the provenance note below.
              </p>
            )}
          </div>
        </section>

        {/* ------------------------------------------------- provenance -- */}
        <section className="border-t border-[var(--hairline)] py-10">
          <p className="eyebrow mb-3">How this route was made</p>
          <p className="max-w-3xl text-sm leading-relaxed text-muted">
            {expedition.sourceNote}
          </p>
        </section>
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-1 py-2">
      <dt className="eyebrow mb-1.5">{label}</dt>
      <dd className="text-sm capitalize text-ice">{value}</dd>
    </div>
  );
}
