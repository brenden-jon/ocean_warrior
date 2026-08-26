import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ProviderAcknowledgements from "@/components/ProviderAcknowledgements";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "Where the data comes from, how to read it, and where it stops meaning anything.",
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="grid scroll-mt-24 gap-8 border-t border-[var(--hairline)] py-12 lg:grid-cols-[260px_1fr]"
    >
      <h2 className="display text-xl leading-tight text-ice">{title}</h2>
      <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

const CONTENTS = [
  ["what-this-is", "What this is"],
  ["two-kinds", "Two kinds of data"],
  ["categories", "Observation, satellite, model, analysis"],
  ["anomalies", "Anomalies and baselines"],
  ["latency", "Latency and freshness"],
  ["effort", "Sampling effort is not abundance"],
  ["routes", "Expedition routes"],
  ["local", "A local sample is not a global conclusion"],
  ["sources", "Data sources and acknowledgements"],
  ["citing", "Citing this data"],
];

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1500px] px-6 pb-24 pt-28 sm:px-10 lg:px-16">
        <header className="mb-12 max-w-2xl">
          <p className="eyebrow mb-4">Methodology</p>
          <h1 className="display text-[clamp(2.4rem,5.5vw,4rem)] text-ice">
            How to read
            <br />
            this platform
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Planetary Pulse is a window onto measurements other people made. It
            collects no ocean data of its own — yet. This page explains where
            everything comes from, what the numbers mean, and where they stop
            meaning anything.
          </p>
        </header>

        {/* --------------------------------------------------- contents -- */}
        <nav aria-label="Contents" className="mb-8">
          <p className="eyebrow mb-3">Contents</p>
          <ol className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {CONTENTS.map(([id, label], i) => (
              <li key={id} className="text-[13px]">
                <a
                  href={`#${id}`}
                  className="text-muted transition-colors hover:text-cyan-bright"
                >
                  <span className="mr-2 text-dim tnum">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Section id="what-this-is" title="What this is">
          <p>
            Planetary Pulse brings together the world&rsquo;s public ocean
            observing systems in one view, and shows where Ocean Warrior
            expeditions add measurements to that picture.
          </p>
          <p>
            It is not a scientific data portal, and it does not try to be one.
            Copernicus Marine, EMODnet, NASA Earthdata, NOAA and the European
            Digital Twin Ocean already do the enormous work of observing,
            modelling, standardising and serving the ocean, at a scale no small
            project should attempt to duplicate. This platform sits on top of
            that work and tries to make it legible.
          </p>
          <p>
            It is also not an authoritative source. Every value shown here comes
            from somebody else, is credited to them, and should be cited from
            their archive rather than from this interface. Where we have
            simplified, subset or cached something, the layer says so.
          </p>
        </Section>

        <Section id="two-kinds" title="Two kinds of data">
          <p>
            Everything on this platform falls into one of two categories, and
            the distinction matters more than any other on this page.
          </p>

          <div className="!mt-6 space-y-4">
            <div className="rounded-sm border border-cyan/25 bg-[rgba(0,183,232,0.04)] p-5">
              <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-cyan-bright">
                External data — the context
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Satellite imagery, gridded analyses, model output, float and
                buoy networks, biodiversity records and protected-area
                boundaries, produced by NASA, NOAA, NSIDC, the international
                Argo programme, OBIS, GEBCO, Copernicus Marine and UNEP-WCMC.
                This is the overwhelming majority of what you see. None of it is
                ours, all of it is public, and every layer carries its
                provider&rsquo;s name, licence and citation.
              </p>
            </div>

            <div className="rounded-sm border border-amber/25 bg-[rgba(255,181,71,0.04)] p-5">
              <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-amber">
                Expedition data — the contribution
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Measurements taken from an Ocean Warrior vessel: temperature and
                salinity through the water column, water samples, eDNA, and
                standardised marine mammal and seabird observations. These are
                in-situ measurements from places the observing system reaches
                poorly or not at all.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                <span className="text-amber">
                  No expedition measurements exist on this platform yet.
                </span>{" "}
                The observation schema is built and validated so that real data
                can be ingested without redesigning anything, and the expedition
                pages show where those measurements are intended to come from.
                Nothing has been collected, and nothing synthetic is presented
                as though it had been.
              </p>
            </div>
          </div>

          <p className="!mt-6">
            The two are never blended into a single figure, never drawn in a way
            that makes one look like the other, and are separated in the data
            model itself: every record carries a <code>source_type</code> that
            distinguishes an Ocean Warrior in-situ measurement from a satellite
            retrieval, a model field, an external in-situ observation or a
            demonstration value.
          </p>
        </Section>

        <Section id="categories" title="Observation, satellite, model, analysis">
          <p>
            These four words are not interchangeable, and the interface never
            treats them as such.
          </p>
          <p>
            An <span className="text-ice">observation</span> is an instrument in
            the water — an Argo float, a moored buoy, a CTD lowered from a ship.
            A <span className="text-ice">satellite</span> measurement infers a
            property from radiation leaving the surface, which is why it sees the
            top fraction of a millimetre and not the water column. A{" "}
            <span className="text-ice">model</span> computes a physical state
            from equations, whether or not anyone measured that spot. An{" "}
            <span className="text-ice">analysis</span> blends observations onto a
            regular grid, filling gaps by interpolation so that a value exists
            everywhere — including where nothing was observed.
          </p>
          <p>
            All four are useful. Only the first is a measurement of that place at
            that time. Surface-current animations are model output: the moving
            particles are a way of drawing computed vectors, not water, and not
            tracked drifters.
          </p>
        </Section>

        <Section id="anomalies" title="Anomalies and baselines">
          <p>
            An anomaly is a departure from normal — but &ldquo;normal&rdquo; has
            to be defined, and the definition changes the number. Sea surface
            temperature anomalies here use a 1971&ndash;2000 baseline; sea-ice
            comparisons use 1981&ndash;2010; the global surface temperature
            context card uses 1951&ndash;1980.
          </p>
          <p>
            Every one of those baselines already contains substantial warming. An
            anomaly measured against them therefore{" "}
            <em>understates</em> the change since pre-industrial conditions. This
            is standard scientific practice, not a trick, but it matters when
            quoting a figure.
          </p>
          <p>
            Colour scales for anomalies are fixed and centred on zero, never
            auto-scaled to the visible data. Auto-scaling makes a quiet day look
            like a crisis.
          </p>
        </Section>

        <Section id="latency" title="Latency and freshness">
          <p>
            Data takes time to arrive. Sea-ice extent appears a day or two after
            the fact. Satellite temperature analyses run a few days behind.
            Argo profiles arrive within hours but carry only automated quality
            control; the expert-reviewed version follows months later and
            sometimes differs.
          </p>
          <p>
            Layers are therefore labelled daily, near-real-time, monthly or
            historical, with the actual observation date shown. Nothing is
            described as live unless it is.
          </p>
          <p>
            Four sources — NSIDC, NOAA NDBC, NASA GISTEMP and Argo — do not
            permit direct requests from a browser. Those are fetched once a day
            by a scheduled job and served as dated snapshots, with the time of
            the snapshot shown next to the number. Everything else is fetched
            from the provider at the moment you look at it.
          </p>
        </Section>

        <Section id="effort" title="Sampling effort is not abundance">
          <p>
            Biodiversity occurrence records show where people have looked as much
            as where life is. A dense cluster may mean a rich ecosystem, or a
            marine station with a long-running survey. An empty ocean on that
            layer means nobody recorded anything there — not that nothing lives
            there.
          </p>
          <p>
            The same caution applies to the observing system as a whole, and it
            is one of the reasons Ocean Warrior exists. Argo floats cannot
            surface through sea ice, so the high Arctic has a hole in the record
            that no amount of processing can fill. On any given day a few dozen
            floats report without a position at all, most of them under ice. That
            absence is visible on this platform, and it is not a flaw in the data
            — it is the map of where the evidence runs out.
          </p>
        </Section>

        <Section id="routes" title="Expedition routes">
          <p>
            <span className="text-ice">
              No line on this platform is a recorded GPS track.
            </span>{" "}
            Ocean Warrior has not supplied vessel positions, so none are drawn.
          </p>
          <p>
            Where Ocean Warrior has published port calls, those ports are real
            and are drawn as labelled markers. The line joining them is drawn by
            this platform using great-circle interpolation, with additional
            unlabelled points chosen only to keep the path in navigable water
            rather than cutting across Norway or Greenland. Those points are
            cartographic, not itinerary, and carry no navigational meaning
            whatsoever.
          </p>
          <p>
            Each route declares its own fidelity, and the fidelity is encoded
            visually as well as in words: published itineraries are solid,
            concepts are dashed, and where the true track is unknown — as with
            the 2023 Svalbard foundation expeditions — an area is shaded and no
            line is drawn at all.
          </p>
        </Section>

        <Section id="local" title="A local sample is not a global conclusion">
          <p>
            When Ocean Warrior measurements do arrive, they will be exactly that:
            measurements, at specific points, at specific moments. A warm profile
            in the Fram Strait in one July is evidence about the Fram Strait in
            that July.
          </p>
          <p>
            Its value comes from repetition — the same transect, the same
            stations, year after year — and from being placed alongside the
            satellite and model context that surrounds it. That is what this
            platform is built to do, and it is why the context layers came first.
          </p>
          <p>
            Expedition measurements will carry a quality-control state: raw,
            provisional, passed, failed or expert-reviewed. Provisional values
            can change. Anything not yet reviewed will say so.
          </p>
        </Section>

        <Section id="sources" title="Data sources and acknowledgements">
          <p>
            This platform exists because these organisations make their data
            public, document it properly and keep it available. That is not a
            small thing, and it is the reason a project of this size can show
            anything meaningful at all.
          </p>
          <p>
            Every dataset, with its full citation, licence, resolution, update
            cadence and limitations, is listed in the{" "}
            <a
              href="/data"
              className="text-cyan-bright underline decoration-dotted underline-offset-2"
            >
              data catalog
            </a>
            .
          </p>
          <ProviderAcknowledgements />
        </Section>

        <Section id="citing" title="Citing this data">
          <p>
            Cite the original provider, not this platform. Each catalog entry
            carries the citation the provider asks for, and a DOI where one
            exists.
          </p>
          <p>
            If you need to refer to something you saw here, name the dataset, the
            provider and the observation date — for example &ldquo;NOAA OISST
            v2.1 sea surface temperature anomaly, 25 August 2026&rdquo; — rather
            than referring to Planetary Pulse. The interface is a view; the
            archive is the source.
          </p>
          <p>
            Imagery from NASA GIBS, NOAA and NSIDC is generally free to reuse
            with attribution. The World Database on Protected Areas has its own
            terms which restrict redistribution of the raw dataset; only
            simplified display geometry is served here, and anyone needing the
            real boundaries should obtain them from Protected Planet directly.
          </p>
        </Section>
      </main>
    </>
  );
}
