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
