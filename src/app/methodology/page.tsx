import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Methodology",
  description: "What this platform is, what it is not, and how to read it.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-8 border-t border-[var(--hairline)] py-12 lg:grid-cols-[240px_1fr]">
      <h2 className="display text-xl text-ice">{title}</h2>
      <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

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
            Planetary Pulse is a window onto other people&rsquo;s
            measurements. It collects no data of its own — yet. This page
            explains what the numbers mean, and where they stop meaning
            anything.
          </p>
        </header>

        <Section title="What this is not">
          <p>
            It is not a scientific data portal, and it does not try to compete
            with one. Copernicus Marine, EMODnet, NASA Earthdata, NOAA and the
            European Digital Twin Ocean already do the enormous work of
            observing, modelling and serving the ocean at a scale no small
            project should attempt to duplicate.
          </p>
          <p>
            It is also not an authoritative source. Every value shown here comes
            from somebody else, is attributed to them, and should be cited from
            their archive rather than from this interface.
          </p>
        </Section>

        <Section title="Observation, satellite, model, analysis">
          <p>
            These four words are not interchangeable, and the interface never
            treats them as such.
          </p>
          <p>
            An <span className="text-ice">observation</span> is an instrument in
            the water. A <span className="text-ice">satellite</span> measurement
            infers a property from radiation leaving the surface. A{" "}
            <span className="text-ice">model</span> computes a physical state
            from equations, whether or not anyone measured that spot. An{" "}
            <span className="text-ice">analysis</span> blends observations onto
            a regular grid, filling gaps by interpolation.
          </p>
          <p>
            All four are useful. Only the first is a measurement of that place
            at that time. Surface-current animations on this site are model
            output: the particles are a way of drawing computed vectors, not
            water, and not tracked drifters.
          </p>
        </Section>

        <Section title="Anomalies and baselines">
          <p>
            An anomaly is a departure from normal — but &ldquo;normal&rdquo;
            has to be defined, and the definition changes the number. The sea
            surface temperature anomalies here use a 1971&ndash;2000 baseline,
            and the sea-ice comparisons use 1981&ndash;2010.
          </p>
          <p>
            Both baselines already contain substantial warming. An anomaly
            measured against them therefore <em>understates</em> the change
            since pre-industrial conditions. This is standard practice and it is
            not a trick, but it matters when quoting a figure.
          </p>
        </Section>

        <Section title="Latency, and why nothing here says &ldquo;live&rdquo;">
          <p>
            Data takes time to arrive. Sea-ice extent appears a day or two after
            the fact. The sea surface temperature analysis used here runs about
            two weeks behind. Argo profiles arrive within hours but carry only
            automated quality control; the expert-reviewed version follows
            months later and sometimes differs.
          </p>
          <p>
            Layers are therefore labelled daily, near-real-time, monthly or
            historical, with the actual date shown. Nothing is described as live
            unless it is.
          </p>
          <p>
            Four sources — NSIDC, NDBC, GISTEMP and Argo — refuse direct
            requests from a browser. Those are fetched once a day by a scheduled
            job and served as dated snapshots. Everything else is fetched from
            the provider as you look at it.
          </p>
        </Section>

        <Section title="Sampling effort is not abundance">
          <p>
            Biodiversity occurrence records show where people have looked as
            much as where life is. A dense cluster may mean a rich ecosystem, or
            a marine station with a long-running survey. An empty ocean on that
            layer means nobody recorded anything there — not that nothing lives
            there.
          </p>
          <p>
            The same applies to the observing system generally, and it is one of
            the reasons Ocean Warrior exists: Argo floats cannot surface through
            sea ice, so the high Arctic has a hole in it that no amount of
            processing can fill.
          </p>
        </Section>

        <Section title="Expedition routes">
          <p>
            No line on this platform is a recorded GPS track. Ocean Warrior has
            not supplied vessel positions.
          </p>
          <p>
            Where Ocean Warrior has published port calls, those ports are real
            and are drawn as labelled markers. The line joining them is drawn by
            this platform, using great-circle interpolation with additional
            unlabelled points chosen only to keep the path in navigable water.
            Those points are cartographic, not itinerary, and carry no
            navigational meaning whatsoever.
          </p>
          <p>
            The 2023 Svalbard foundation expeditions are shown as an area rather
            than a track, because the track is not known. Concept routes are
            drawn dashed and badged as concepts.
          </p>
        </Section>

        <Section title="Demonstration data">
          <p>
            Some expedition stations carry synthetic profiles, generated to show
            how real measurements will appear once expeditions begin. They are
            badged <span className="text-amber">DEMO</span> everywhere they
            appear.
          </p>
          <p>
            They are physically plausible by construction, which makes them more
            dangerous rather than less. They must never be cited, exported as
            evidence, or compared against real measurements.
          </p>
        </Section>

        <Section title="A local sample is not a global conclusion">
          <p>
            When Ocean Warrior measurements do arrive, they will be exactly
            that: measurements, at specific points, at specific moments. A warm
            profile in the Fram Strait in July 2027 is evidence about the Fram
            Strait in July 2027.
          </p>
          <p>
            Its value comes from repetition — the same transect, the same
            stations, year after year — and from being placed alongside the
            satellite and model context that surrounds it. That is what this
            platform is built to do.
          </p>
        </Section>

        <Section title="Access and privacy">
          <p>
            This prototype sits behind a passphrase, which is a keep-out sign
            rather than a lock. The site is a static export on public hosting,
            so the encrypted check is downloadable and can be attacked offline.
            Its strength is the passphrase and nothing else.
          </p>
          <p>
            That trade is deliberate and acceptable because nothing behind the
            gate is confidential: every dataset here is public, and the only
            thing being kept back is an unfinished interface.
          </p>
        </Section>
      </main>
    </>
  );
}
