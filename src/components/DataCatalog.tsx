"use client";

import { useMemo, useState } from "react";
import {
  CATALOG,
  CATEGORY_LABELS,
  SOURCE_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/catalog";
import type { LayerMetadata } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function DataCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(CATALOG.map((l) => l.category))],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((layer) => {
      if (category && layer.category !== category) return false;
      if (!q) return true;
      return [
        layer.title,
        layer.plainSummary,
        layer.sourceOrg,
        layer.productName,
        layer.datasetId ?? "",
        ...layer.variables.map((v) => v.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, category]);

  const liveCount = CATALOG.filter((l) => l.status === "live").length;

  return (
    <div>
      {/* ---------------------------------------------------------- tally -- */}
      <div className="mb-8 flex flex-wrap gap-x-8 gap-y-2 text-xs text-dim">
        <span>
          <span className="text-cyan-bright tnum">{liveCount}</span> live
        </span>
        <span>
          <span className="text-muted tnum">
            {CATALOG.filter((l) => l.status === "credentials_required").length}
          </span>{" "}
          awaiting credentials
        </span>
        <span>
          <span className="text-muted tnum">
            {CATALOG.filter((l) => l.status === "connector_ready").length}
          </span>{" "}
          connector ready
        </span>
        <span>
          <span className="text-muted tnum">
            {CATALOG.filter((l) => l.status === "planned").length}
          </span>{" "}
          planned
        </span>
        <span>
          <span className="text-amber tnum">
            {CATALOG.filter((l) => l.status === "demo").length}
          </span>{" "}
          demo
        </span>
      </div>

      {/* --------------------------------------------------------- filter -- */}
      <div className="mb-8 space-y-4">
        <label htmlFor="catalog-search" className="sr-only">
          Search datasets
        </label>
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search datasets, sources, variables…"
          className="w-full max-w-md rounded-sm border border-[var(--hairline)] bg-[rgba(7,20,36,0.6)] px-4 py-2.5 text-sm text-ice placeholder:text-dim focus:border-cyan focus:outline-none"
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory(null)}
            aria-pressed={category === null}
            className={`rounded-sm border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 ${
              category === null
                ? "border-cyan bg-cyan/10 text-cyan-bright"
                : "border-[var(--hairline)] text-muted hover:text-ice"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c === category ? null : c)}
              aria-pressed={category === c}
              className={`rounded-sm border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 ${
                category === c
                  ? "border-cyan bg-cyan/10 text-cyan-bright"
                  : "border-[var(--hairline)] text-muted hover:text-ice"
              }`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------- list -- */}
      <ul className="space-y-px">
        {filtered.map((layer) => (
          <li key={layer.id}>
            <LayerRow
              layer={layer}
              open={expanded === layer.id}
              onToggle={() =>
                setExpanded(expanded === layer.id ? null : layer.id)
              }
            />
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-dim">
          Nothing matches that search.
        </p>
      )}
    </div>
  );
}

function LayerRow({
  layer,
  open,
  onToggle,
}: {
  layer: LayerMetadata;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[var(--hairline)]">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-start justify-between gap-6 py-5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base text-ice transition-colors duration-200 group-hover:text-cyan-bright">
              {layer.title}
            </h3>
            <StatusBadge status={layer.status} />
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {layer.plainSummary}
          </p>
          <p className="mt-2 text-[11px] text-dim">
            {layer.sourceOrg} · {SOURCE_TYPE_LABELS[layer.sourceType]}
            {layer.spatialResolution ? ` · ${layer.spatialResolution}` : ""} ·{" "}
            {layer.temporalCoverage}
          </p>
        </div>
        <span
          aria-hidden
          className={`mt-1 shrink-0 text-dim transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        >
          +
        </span>
      </button>

      {open && (
        <div className="grid gap-8 pb-8 md:grid-cols-2">
          <div className="space-y-5">
            {layer.whyItMatters && (
              <Field label="Why it matters">{layer.whyItMatters}</Field>
            )}
            <Field label="Variables">
              <ul className="space-y-1">
                {layer.variables.map((v) => (
                  <li key={v.name}>
                    <span className="text-ice">{v.name}</span>{" "}
                    <span className="text-dim">({v.unit})</span>
                    {v.description && (
                      <span className="text-muted"> — {v.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Field>
            <Field label="Coverage">
              {layer.spatialCoverage}
              {layer.spatialResolution && ` · ${layer.spatialResolution}`}
              <br />
              {layer.temporalCoverage}
              {layer.latency && (
                <>
                  <br />
                  <span className="text-dim">Latency: {layer.latency}</span>
                </>
              )}
            </Field>
            <Field label="Access">
              {layer.accessMethod}
              {layer.requiresProxy && (
                <span className="text-dim">
                  {" "}
                  — this source blocks direct browser requests, so it is fetched
                  by a scheduled job and served as a dated snapshot.
                </span>
              )}
              {layer.requiredCredentials.length > 0 && (
                <>
                  <br />
                  <span className="text-amber">
                    Requires: {layer.requiredCredentials.join(", ")}
                  </span>
                </>
              )}
            </Field>
          </div>

          <div className="space-y-5">
            {/* The most important box on the page. */}
            <div className="rounded-sm border border-[var(--hairline)] bg-[rgba(255,181,71,0.04)] p-4">
              <p className="eyebrow mb-2.5 text-amber">Limitations</p>
              <ul className="space-y-2">
                {layer.caveats.map((caveat, i) => (
                  <li
                    key={i}
                    className="text-[13px] leading-relaxed text-muted"
                  >
                    {caveat}
                  </li>
                ))}
              </ul>
            </div>

            <Field label="Licence">{layer.license}</Field>
            <Field label="Attribution">{layer.attribution}</Field>
            {layer.citation && <Field label="Citation">{layer.citation}</Field>}
            {layer.doi && (
              <Field label="DOI">
                <a
                  href={`https://doi.org/${layer.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-2 hover:text-cyan-bright"
                >
                  {layer.doi}
                </a>
              </Field>
            )}
            <a
              href={layer.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-sm border border-[var(--hairline-bright)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ice transition-colors duration-200 hover:border-cyan hover:text-cyan-bright"
            >
              Go to source
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow mb-1.5">{label}</p>
      <div className="text-[13px] leading-relaxed text-muted">{children}</div>
    </div>
  );
}
