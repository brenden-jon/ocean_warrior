"use client";

import Link from "next/link";
import { useArgo, useGistemp, useSeaIce, relativeAge } from "@/lib/baked";
import { EXPEDITIONS } from "@/data/expeditions";

/**
 * The four headline readings, on the home page below the globe.
 *
 * Every figure is real and every one names its source and its age. There is
 * deliberately no composite "ocean health score" — the brief rules it out, and
 * rightly: a single number invented from incommensurable measurements would be
 * the least defensible thing on the site.
 */
export default function PulseCards() {
  const ice = useSeaIce();
  const argo = useArgo();
  const gistemp = useGistemp();

  const nextExpedition =
    EXPEDITIONS.find((e) => e.slug === "svalbard-2027") ?? EXPEDITIONS[0];

  return (
    <section className="mx-auto max-w-[1500px] px-6 py-24 sm:px-10 lg:px-16">
      <div className="mb-12 max-w-2xl">
        <p className="eyebrow mb-4">The pulse</p>
        <h2 className="display text-[clamp(2rem,4.5vw,3.2rem)] text-ice">
          Four readings,
          <br />
          taken this week
        </h2>
        <p className="mt-5 text-sm leading-relaxed text-muted">
          Each of these comes from a different observing system, and each says
          when it was last measured. None of them is a forecast, and there is no
          single score — the ocean does not have one.
        </p>
      </div>

      <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
        {/* ---------------------------------------------------- sea ice -- */}
        <Card
          eyebrow="Arctic sea ice"
          href="/arctic"
          state={ice.status}
          source="NSIDC Sea Ice Index v4"
          age={ice.data ? relativeAge(ice.data.fetchedAt) : undefined}
        >
          {ice.data && (
            <>
              <Value
                value={ice.data.north.latest.extent.toFixed(2)}
                unit="million km²"
              />
              <Detail>
                {ice.data.north.latest.anomaly !== undefined && (
                  <>
                    <span className="text-amber">
                      {ice.data.north.latest.anomaly > 0 ? "+" : ""}
                      {ice.data.north.latest.anomaly.toFixed(2)}
                    </span>{" "}
                    against the {ice.data.north.climatologyPeriod} average
                  </>
                )}
              </Detail>
              {ice.data.north.latest.rankLowest && (
                <Detail>
                  {ordinal(ice.data.north.latest.rankLowest)} lowest for this
                  date in {ice.data.north.latest.rankOutOf} years
                </Detail>
              )}
              <Detail dim>{ice.data.north.latest.date}</Detail>
            </>
          )}
        </Card>

        {/* ------------------------------------------------ antarctic -- */}
        <Card
          eyebrow="Antarctic sea ice"
          href="/arctic"
          state={ice.status}
          source="NSIDC Sea Ice Index v4"
          age={ice.data ? relativeAge(ice.data.fetchedAt) : undefined}
        >
          {ice.data && (
            <>
              <Value
                value={ice.data.south.latest.extent.toFixed(2)}
                unit="million km²"
              />
              <Detail>
                {ice.data.south.latest.anomaly !== undefined && (
                  <>
                    <span className="text-amber">
                      {ice.data.south.latest.anomaly > 0 ? "+" : ""}
                      {ice.data.south.latest.anomaly.toFixed(2)}
                    </span>{" "}
                    against the {ice.data.south.climatologyPeriod} average
                  </>
                )}
              </Detail>
              {ice.data.south.latest.rankLowest && (
                <Detail>
                  {ordinal(ice.data.south.latest.rankLowest)} lowest for this
                  date in {ice.data.south.latest.rankOutOf} years
                </Detail>
              )}
              <Detail dim>{ice.data.south.latest.date}</Detail>
            </>
          )}
        </Card>

        {/* --------------------------------------------------- argo -- */}
        <Card
          eyebrow="Floats reporting"
          href="/explore"
          state={argo.status}
          source="International Argo Programme"
          age={argo.data ? relativeAge(argo.data.fetchedAt) : undefined}
        >
          {argo.data && (
            <>
              <Value value={argo.data.count.toLocaleString()} unit="floats" />
              <Detail>
                surfaced in the last {argo.data.windowDays} days, each measuring
                temperature and salinity to 2 km
              </Detail>
              {argo.data.withoutPosition > 0 && (
                <Detail>
                  <span className="text-amber">
                    {argo.data.withoutPosition}
                  </span>{" "}
                  reported without a position — most of them under ice
                </Detail>
              )}
            </>
          )}
        </Card>

        {/* -------------------------------------------- expedition -- */}
        <Card
          eyebrow="Next expedition"
          href={`/expeditions/${nextExpedition.slug}`}
          state="success"
          source="Ocean Warrior"
        >
          <p className="display mt-1 text-2xl leading-tight text-ice">
            {nextExpedition.name}
          </p>
          <Detail>{nextExpedition.question}</Detail>
          <Detail dim>{nextExpedition.fidelityLabel}</Detail>
        </Card>
      </div>

      {/* ----------------------------------------------------- context -- */}
      {gistemp.data && (
        <p className="mt-10 max-w-3xl text-sm leading-relaxed text-dim">
          For context, the planet&rsquo;s surface averaged{" "}
          <span className="text-muted tnum">
            {gistemp.data.annual[gistemp.data.annual.length - 1].anomaly.toFixed(
              2,
            )}
            °C
          </span>{" "}
          above its {gistemp.data.source.baseline} average in{" "}
          {gistemp.data.annual[gistemp.data.annual.length - 1].year}. That is a
          land-and-ocean figure from NASA GISS, shown here as background — it is
          not an ocean measurement.
        </p>
      )}
    </section>
  );
}

function Card({
  eyebrow,
  href,
  state,
  source,
  age,
  children,
}: {
  eyebrow: string;
  href: string;
  state: "loading" | "success" | "error";
  source: string;
  age?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[240px] flex-col border border-[var(--hairline)] p-6 transition-colors duration-200 hover:border-cyan/40 hover:bg-[rgba(0,183,232,0.03)]"
    >
      <p className="eyebrow mb-3">{eyebrow}</p>

      {state === "loading" && <div className="skeleton h-10 w-2/3 rounded-sm" />}
      {state === "error" && (
        <p className="text-sm text-dim">
          This snapshot is unavailable. Nothing has been substituted for it.
        </p>
      )}
      {state === "success" && <div className="flex-1">{children}</div>}

      <div className="mt-auto pt-5">
        <p className="text-[10px] leading-relaxed text-dim">{source}</p>
        {age && (
          <p className="text-[10px] text-dim">Snapshot taken {age}</p>
        )}
      </div>
    </Link>
  );
}

function Value({ value, unit }: { value: string; unit: string }) {
  return (
    <p className="mt-1 text-4xl leading-none text-cyan-bright tnum">
      {value}
      <span className="ml-1.5 text-xs text-muted">{unit}</span>
    </p>
  );
}

function Detail({
  children,
  dim,
}: {
  children: React.ReactNode;
  dim?: boolean;
}) {
  return (
    <p
      className={`mt-2.5 text-xs leading-relaxed ${dim ? "text-dim" : "text-muted"}`}
    >
      {children}
    </p>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
