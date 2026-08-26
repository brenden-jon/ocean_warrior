import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { EXPEDITIONS } from "@/data/expeditions";
import { routeLengthKm, KM_PER_NAUTICAL_MILE } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Expeditions",
  description:
    "Where Ocean Warrior has sailed, plans to sail, and is considering sailing.",
};

const STATUS_STYLE: Record<string, string> = {
  completed: "border-ice/30 text-ice",
  active: "border-cyan/50 bg-cyan/10 text-cyan-bright",
  planned: "border-cyan/40 text-cyan-bright",
  concept: "border-amber/40 text-amber",
};

export default function ExpeditionsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1500px] px-6 pb-24 pt-28 sm:px-10 lg:px-16">
        <header className="mb-14 max-w-2xl">
          <p className="eyebrow mb-4">Expeditions</p>
          <h1 className="display text-[clamp(2.4rem,5.5vw,4rem)] text-ice">
            Where the ship
            <br />
            meets the data
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Satellites see the surface. Models fill the gaps. Neither can put an
            instrument in the water at 80&deg; north. Each expedition begins
            with a question that the existing observing system cannot answer on
            its own.
          </p>
          <p className="mt-4 rounded-sm border border-[var(--hairline)] bg-[rgba(255,181,71,0.04)] p-4 text-sm leading-relaxed text-muted">
            <span className="text-amber">No route shown here is a GPS track.</span>{" "}
            Ocean Warrior has not supplied recorded vessel positions. Published
            port calls are real; the lines between them are drawn by Planetary
            Pulse and carry no navigational meaning. Each expedition states its
            own fidelity below.
          </p>
        </header>

        <ul className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
          {EXPEDITIONS.map((expedition) => {
            const km = routeLengthKm(expedition);
            return (
              <li key={expedition.slug}>
                <Link
                  href={`/expeditions/${expedition.slug}`}
                  className="group flex h-full flex-col border border-[var(--hairline)] p-6 transition-colors duration-200 hover:border-cyan/40 hover:bg-[rgba(0,183,232,0.03)]"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <span
                      className={`rounded-[2px] border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${STATUS_STYLE[expedition.status]}`}
                    >
                      {expedition.status}
                    </span>
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: expedition.accent }}
                      aria-hidden
                    />
                  </div>

                  <h2 className="display text-2xl leading-tight text-ice transition-colors duration-200 group-hover:text-cyan-bright">
                    {expedition.name}
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {expedition.question}
                  </p>

                  <div className="mt-auto pt-6">
                    <p className="text-[11px] text-dim">{expedition.region}</p>
                    {km > 0 && (
                      <p className="mt-1 text-[11px] text-dim tnum">
                        {Math.round(km).toLocaleString()} km ·{" "}
                        {Math.round(km / KM_PER_NAUTICAL_MILE).toLocaleString()}{" "}
                        nautical miles
                      </p>
                    )}
                    <p className="mt-3 text-[10px] uppercase tracking-[0.1em] text-amber/80">
                      {expedition.fidelityLabel}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
