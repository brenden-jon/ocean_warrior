import Link from "next/link";

/**
 * A plain index of the platform, at the foot of the home page.
 *
 * The header nav is compact by necessity; this says what each section actually
 * contains, for a visitor who has just arrived and has no idea which of five
 * words to click.
 */
const SECTIONS = [
  {
    href: "/explore",
    title: "Explore",
    blurb:
      "The full map. Choose a base layer, stack observing platforms and protected areas on top, and move through time.",
  },
  {
    href: "/arctic",
    title: "Arctic",
    blurb:
      "Forty-six years of sea ice, one map for each year's maximum and minimum, in a true polar projection.",
  },
  {
    href: "/expeditions",
    title: "Expeditions",
    blurb:
      "Where Ocean Warrior sails, the question each voyage asks, and what the existing observing systems already say about that place.",
  },
  {
    href: "/data",
    title: "Data catalog",
    blurb:
      "Every dataset on the platform with its source, licence, resolution, update cadence and limitations.",
  },
  {
    href: "/methodology",
    title: "Methodology",
    blurb:
      "How to read any of this. What an anomaly is, why a model is not a measurement, and where the numbers stop meaning anything.",
  },
];

export default function WhereToGo() {
  return (
    <section className="border-t border-[var(--hairline)]">
      <div className="mx-auto max-w-[1500px] px-6 py-20 sm:px-10 lg:px-16">
        <p className="eyebrow mb-8">Where to go</p>
        <ul className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => (
            <li key={section.href}>
              <Link
                href={section.href}
                className="group flex h-full flex-col border border-[var(--hairline)] p-6 transition-colors duration-200 hover:border-cyan/40 hover:bg-[rgba(0,183,232,0.03)]"
              >
                <h3 className="display text-xl text-ice transition-colors duration-200 group-hover:text-cyan-bright">
                  {section.title}
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
                  {section.blurb}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-16 border-t border-[var(--hairline)] pt-12">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-xl">
              <p className="eyebrow mb-3">Take part</p>
              <h3 className="display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight text-ice">
                Keeping a pulse on the planet takes a fleet
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Ocean Warrior is an ambitious, long-term attempt to collect
                critical ocean data from the places nobody else goes — and to
                keep collecting it, in the same waters, for a decade. Partners,
                sponsors and supporters are what put the next vessel to sea.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.global-warrior.com/sponsorship"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm bg-cyan px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-abyss transition-colors duration-200 hover:bg-cyan-bright"
              >
                Become a partner
              </a>
              <a
                href="https://www.global-warrior.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-[var(--hairline-bright)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-ice transition-colors duration-200 hover:border-cyan hover:text-cyan-bright"
              >
                Get in touch
              </a>
            </div>
          </div>
        </div>

        <p className="mt-12 max-w-2xl text-[11px] leading-relaxed text-dim">
          Planetary Pulse is a private prototype for Ocean Warrior. It holds no
          ocean data of its own: everything shown is produced by NASA, NOAA,
          NSIDC, the international Argo programme, OBIS, GEBCO, Copernicus
          Marine and UNEP-WCMC/IUCN, and is credited in the data catalog.
        </p>
      </div>
    </section>
  );
}
