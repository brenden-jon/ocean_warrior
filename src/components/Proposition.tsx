import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/paths";

/**
 * The proposition, stated briefly.
 *
 * Deliberately short. The home page's job is to make one distinction land —
 * continuous global observation on one side, science-led expeditions on the
 * other — and then get out of the way. Detail belongs on the pages that exist
 * for it: /explore, /expeditions, /methodology.
 */
export default function Proposition() {
  return (
    <section className="border-t border-[var(--hairline)]">
      <div className="mx-auto max-w-[1500px] px-6 py-20 sm:px-10 lg:px-16">
        {/* ------------------------------------------- heading + photo -- */}
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow mb-4">What this is</p>
            <h2 className="display text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.02] text-ice">
              Two ways of knowing
              <br />
              the ocean
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              One watches continuously, from orbit and from thousands of
              instruments in the water. The other is a ship with scientists
              aboard, sent to answer a question the continuous record cannot
              settle on its own.
            </p>
          </div>

          <figure>
            <div className="relative overflow-hidden rounded-sm">
              <Image
                src={asset("/images/expedition-science.webp")}
                alt="Two Ocean Warrior expedition members on deck examining a water-column sensor, with a glacier behind them."
                width={1600}
                height={900}
                className="h-auto w-full"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(2,9,20,0.5) 0%, transparent 55%)",
                }}
              />
            </div>
            <figcaption className="mt-2.5 text-[11px] text-dim">
              Preparing instruments during the Svalbard foundation expeditions.
              Photograph: Ocean Warrior.
            </figcaption>
          </figure>
        </div>

        {/* --------------------------------------------------- two cards -- */}
        <div className="mt-16 grid gap-px lg:grid-cols-2">
          <div className="border border-[var(--hairline)] p-7 lg:p-9">
            <div className="mb-5 flex items-center gap-3">
              <span className="display text-4xl leading-none text-cyan/40">01</span>
              <span className="rounded-[2px] border border-cyan/40 bg-cyan/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-bright">
                Live now
              </span>
            </div>

            <h3 className="display text-xl leading-tight text-ice">
              Near-real-time data on the oceans and the poles
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              Sea ice since 1978, surface temperature at one kilometre,
              chlorophyll, currents, and every float and buoy reporting today.
              From NASA, NOAA, NSIDC, Argo, OBIS and GEBCO — each layer naming
              its source, its age and its limits.
            </p>

            <Link
              href="/explore"
              className="mt-6 inline-block rounded-sm bg-cyan px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-abyss transition-colors duration-200 hover:bg-cyan-bright"
            >
              Explore the data
            </Link>
          </div>

          <div className="border border-[var(--hairline)] p-7 lg:p-9">
            <div className="mb-5 flex items-center gap-3">
              <span className="display text-4xl leading-none text-amber/40">02</span>
              <span className="rounded-[2px] border border-amber/40 bg-amber/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber">
                Coming soon
              </span>
            </div>

            <h3 className="display text-xl leading-tight text-ice">
              Science-led expeditions, built around a question
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              Each voyage starts with a research question set with scientific
              partners, and the route, stations and instruments are chosen to
              answer it — then repeated in the same waters, year after year.
              Repetition is what turns a reading into evidence.
            </p>

            <Link
              href="/expeditions"
              className="mt-6 inline-block rounded-sm border border-[var(--hairline-bright)] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ice transition-colors duration-200 hover:border-cyan hover:text-cyan-bright"
            >
              See the expeditions
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
