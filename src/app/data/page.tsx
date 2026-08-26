import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import DataCatalog from "@/components/DataCatalog";

export const metadata: Metadata = {
  title: "Data catalog",
  description:
    "Every dataset Planetary Pulse draws on, with source, licence, resolution and limitations.",
};

export default function DataPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1500px] px-6 pb-24 pt-28 sm:px-10 lg:px-16">
        <header className="mb-12 max-w-2xl">
          <p className="eyebrow mb-4">Data catalog</p>
          <h1 className="display text-[clamp(2.4rem,5.5vw,4rem)] text-ice">
            Where all of
            <br />
            this comes from
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Planetary Pulse holds no ocean data of its own. Everything here is
            produced by the world&rsquo;s observing systems and is listed below
            with its source, licence, resolution and — most importantly — what
            it cannot tell you.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-dim">
            Layers marked <span className="text-muted">connector ready</span> or{" "}
            <span className="text-muted">credentials required</span> are built
            and wired but not showing real data, and say so wherever they appear.
            Nothing is substituted for missing data.
          </p>
        </header>

        <DataCatalog />
      </main>
    </>
  );
}
