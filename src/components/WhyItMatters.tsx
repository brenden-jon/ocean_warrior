import Image from "next/image";
import { asset } from "@/lib/paths";

/**
 * The human half of the argument.
 *
 * Every other section of the home page is about data. This one is about the
 * people who go and get it, because the case for Ocean Warrior is not that the
 * ocean is under-observed in the abstract — it is that somebody has to sail
 * there, in person, repeatedly, for a decade.
 *
 * Photographs are Ocean Warrior's own, from the 2023 Svalbard foundation
 * expeditions.
 */
export default function WhyItMatters() {
  return (
    <section className="border-t border-[var(--hairline)]">
      <div className="mx-auto max-w-[1500px] px-6 py-24 sm:px-10 lg:px-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ------------------------------------------------------ image -- */}
          <figure className="relative">
            <div className="relative overflow-hidden rounded-sm">
              <Image
                src={asset("/images/expedition-science.webp")}
                alt="Two Ocean Warrior expedition members on deck examining a water-column sensor, with a glacier behind them."
                width={1600}
                height={900}
                className="h-auto w-full"
                priority={false}
              />
              {/* Ties the photograph into the dark palette instead of sitting
                  on the page as a bright rectangle. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(2,9,20,0.55) 0%, rgba(2,9,20,0.08) 45%, transparent 75%)",
                }}
              />
            </div>
            <figcaption className="mt-3 text-[11px] leading-relaxed text-dim">
              Preparing instruments aboard during the Svalbard foundation
              expeditions. Photograph: Ocean Warrior.
            </figcaption>
          </figure>

          {/* ------------------------------------------------------- copy -- */}
          <div>
            <p className="eyebrow mb-5">Why it matters</p>

            <h2 className="display text-[clamp(2rem,4vw,3.2rem)] leading-[1.02] text-ice">
              Somebody has to
              <br />
              go and measure it
            </h2>

            <p className="mt-6 text-base leading-relaxed text-muted">
              Ocean Warrior puts scientists, early-career researchers, students
              and trained citizen participants aboard sailing vessels and takes
              them to the parts of the ocean that instruments rarely reach. They
              collect the measurements that satellites cannot make and models
              can only estimate: temperature and salinity through the water
              column, water chemistry, eDNA, and what is actually living there.
            </p>

            <p className="mt-4 text-base leading-relaxed text-muted">
              Those measurements are aimed at questions that matter — how fast
              warm Atlantic water is pushing north beneath the Arctic ice, what
              is happening to the food web where the ice used to be, and whether
              protection is keeping pace with heat. None of them can be answered
              from orbit alone.
            </p>

            <p className="mt-4 text-base leading-relaxed text-muted">
              And the value compounds. A single profile is a data point; the same
              transect repeated every year for a decade is a record. That is why
              the circuit repeats, and why the data has to be preserved, made
              public and made legible — which is what this platform is for.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="https://www.global-warrior.com/sponsorship"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm bg-cyan px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-abyss transition-colors duration-200 hover:bg-cyan-bright"
              >
                Become a partner
              </a>
              <a
                href="https://www.crowdfunder.co.uk/p/ocean-warrior-project"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-[var(--hairline-bright)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-ice transition-colors duration-200 hover:border-cyan hover:text-cyan-bright"
              >
                Support the expedition
              </a>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-dim">
              Ocean Warrior is a ten-year programme: three vessels, roughly
              20,000 nautical miles a year, sailing the same waters again and
              again so that change becomes measurable rather than argued about.
              Partners and supporters make the next leg possible.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
