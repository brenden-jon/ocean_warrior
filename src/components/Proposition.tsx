import Link from "next/link";

/**
 * The proposition, stated plainly.
 *
 * This is the first thing a visitor arriving from the Ocean Warrior website's
 * "Data" section should understand: that the platform does two distinct things,
 * and that the second one is the part nobody else has. Written so the two
 * columns can be read in either order and still make the argument.
 */
export default function Proposition() {
  return (
    <section className="border-t border-[var(--hairline)]">
      <div className="mx-auto max-w-[1500px] px-6 py-24 sm:px-10 lg:px-16">
        <div className="mb-16 max-w-3xl">
          <p className="eyebrow mb-4">What this is</p>
          <h2 className="display text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.02] text-ice">
            The state of the ocean,
            <br />
            and the ship that goes there
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Planetary Pulse does two things. It shows what the world&rsquo;s
            observing systems know about the ocean and the poles right now. And
            it shows where Ocean Warrior sails to measure what those systems
            cannot reach.
          </p>
        </div>

        <div className="grid gap-px lg:grid-cols-2">
          {/* ------------------------------------------------------ one -- */}
          <div className="border border-[var(--hairline)] p-8 lg:p-10">
            <div className="mb-6 flex items-center gap-3">
              <span className="display text-5xl leading-none text-cyan/40">
                01
              </span>
              <span className="rounded-[2px] border border-cyan/40 bg-cyan/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-bright">
                Live now
              </span>
            </div>

            <h3 className="display text-2xl leading-tight text-ice">
              Near-real-time data on the oceans and the poles
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-muted">
              Sea-ice extent updated daily since 1978. Surface temperature and
              its departure from normal, at one kilometre, current to within a
              day or two. Chlorophyll from NASA&rsquo;s newest ocean-colour
              mission. Nearly four thousand Argo floats reporting from the open
              ocean, and every NOAA buoy in the water.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-muted">
              None of it is ours. It comes from NASA, NOAA, NSIDC, the
              international Argo programme, OBIS and GEBCO — and every layer
              names its source, its resolution, its age and its limitations.
            </p>

            <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[13px] text-dim">
              {[
                "Sea-ice extent, 1978→today",
                "Sea-ice maps, every year",
                "Surface temperature anomaly",
                "Chlorophyll-a",
                "Argo float positions",
                "NOAA buoy observations",
                "Marine protected areas",
                "Bathymetry",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-cyan/60" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/explore"
              className="mt-8 inline-block rounded-sm bg-cyan px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-abyss transition-colors duration-200 hover:bg-cyan-bright"
            >
              Explore the data
            </Link>
          </div>

          {/* ------------------------------------------------------ two -- */}
          <div className="border border-[var(--hairline)] p-8 lg:p-10">
            <div className="mb-6 flex items-center gap-3">
              <span className="display text-5xl leading-none text-amber/40">
                02
              </span>
              <span className="rounded-[2px] border border-amber/40 bg-amber/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber">
                Coming soon
              </span>
            </div>

            <h3 className="display text-2xl leading-tight text-ice">
              Expedition data nobody else collects
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-muted">
              Satellites measure the top millimetre of the sea. Models compute
              the rest. Argo floats cover the open ocean but cannot surface
              through ice, so the high Arctic has a hole in the record that no
              amount of processing can fill.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-muted">
              Ocean Warrior sails into that hole. Temperature and salinity
              through the water column, water samples, eDNA, marine mammal
              observations — taken from a vessel, at stations, repeated in the
              same places year after year. That repetition is what turns a
              measurement into evidence.
            </p>

            <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[13px] text-dim">
              {[
                "CTD temperature profiles",
                "Salinity through depth",
                "eDNA biodiversity samples",
                "Water chemistry",
                "Marine mammal watches",
                "Repeated annual transects",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber/60" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-6 rounded-sm border border-[var(--hairline)] bg-[rgba(255,181,71,0.05)] p-3 text-[11px] leading-relaxed text-muted">
              No expedition measurements exist on this platform yet. The data
              schema is built and validated so they can be ingested without a
              redesign, and the routes below show where they will come from.
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
