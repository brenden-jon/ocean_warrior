import type { Metadata } from "next";
import ArcticTimeMachine from "@/components/ArcticTimeMachine";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Arctic",
  description: "Forty-six years of Arctic sea ice, one map per year.",
};

export default function ArcticPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1500px] px-6 pb-24 pt-28 sm:px-10 lg:px-16">
        <header className="mb-14 max-w-2xl">
          <p className="eyebrow mb-4">Arctic</p>
          <h1 className="display text-[clamp(2.6rem,6vw,4.5rem)] text-ice">
            Forty-six years
            <br />
            of sea ice
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Every year the Arctic Ocean freezes and thaws. These are the two
            turning points of that cycle &mdash; the most ice each winter and
            the least each summer &mdash; for every year since 1979. Drag
            through them.
          </p>
        </header>

        <ArcticTimeMachine />
      </main>
    </>
  );
}
