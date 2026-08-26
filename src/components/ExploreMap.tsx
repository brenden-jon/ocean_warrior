"use client";

import { useCallback, useMemo, useState } from "react";
import OceanGlobe, { type PointOverlay, type PolygonOverlay } from "./OceanGlobe";
import StatusBadge from "./StatusBadge";
import { GIBS_LAYERS, clampToCoverage } from "@/lib/gibs";
import { REGION_PRESETS } from "@/lib/mapStyle";
import { getLayer } from "@/lib/catalog";
import { EXPEDITIONS } from "@/data/expeditions";
import { useArgo, useNdbc, useSeaIce, relativeAge } from "@/lib/baked";
import { asset } from "@/lib/paths";

/**
 * The explore view.
 *
 * Organised as one base layer plus stacked overlays, rather than a flat pile of
 * toggles. Only one scientific raster can be shown at a time: stacking several
 * semi-transparent ones produces colours that mean nothing, which is exactly the
 * GIS-portal failure mode the brief warns against. Points, boundaries and routes
 * stack freely on top, because they do not fight each other visually.
 */

type LayerKey = keyof typeof GIBS_LAYERS;

interface BaseLayerOption {
  key: LayerKey;
  blurb: string;
}

const BASE_GROUPS: { group: string; layers: BaseLayerOption[] }[] = [
  {
    group: "Ocean physics",
    layers: [
      {
        key: "sstAnomaly",
        blurb: "How far the surface is from normal for the date",
      },
      { key: "sst", blurb: "Absolute surface temperature" },
    ],
  },
  {
    group: "Ice",
    layers: [
      { key: "seaIceMur", blurb: "Where the ice is, and how dense" },
    ],
  },
  {
    group: "Life",
    layers: [{ key: "chlorophyll", blurb: "Phytoplankton at the surface" }],
  },
  {
    group: "Context",
    layers: [{ key: "trueColor", blurb: "What a satellite actually sees" }],
  },
];

export default function ExploreMap() {
  const [layerKey, setLayerKey] = useState<LayerKey>("sstAnomaly");
  const [date, setDate] = useState(
    () => GIBS_LAYERS.sstAnomaly.end ?? "2026-08-25",
  );
  const [opacity, setOpacity] = useState(0.85);
  const [region, setRegion] = useState(REGION_PRESETS[0]);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [outsideCoverage, setOutsideCoverage] = useState(false);

  const [showExpeditions, setShowExpeditions] = useState(true);
  const [showArgo, setShowArgo] = useState(false);
  const [showBuoys, setShowBuoys] = useState(false);
  const [showMpa, setShowMpa] = useState(false);

  const argo = useArgo();
  const ndbc = useNdbc();
  const ice = useSeaIce();

  const layer = GIBS_LAYERS[layerKey];
  const meta = getLayer(layer.catalogId);
  const effectiveDate = useMemo(
    () => clampToCoverage(layer, date),
    [layer, date],
  );

  const handleCoverage = useCallback((outside: boolean) => {
    setOutsideCoverage(outside);
  }, []);

  /* ------------------------------------------------ ice minimum/maximum -- */

  /**
   * Years for which this map layer can show the annual extremes.
   *
   * The dates come from the NSIDC extent record (which runs from 1979), but the
   * mappable ice raster only starts in 2002 — so the list is intersected rather
   * than offering years that would silently clamp to the wrong date.
   */
  const iceExtremes = useMemo(() => {
    if (!ice.data) return [];
    const layerStart = GIBS_LAYERS.seaIceMur.start ?? "2002-06-01";
    const layerEnd = GIBS_LAYERS.seaIceMur.end ?? "2026-08-25";
    const rows: { year: number; kind: "min" | "max"; date: string; extent: number }[] = [];
    for (const record of ice.data.north.annualMinima) {
      if (record.date >= layerStart && record.date <= layerEnd)
        rows.push({ ...record, kind: "min" });
    }
    for (const record of ice.data.north.annualMaxima) {
      if (record.date >= layerStart && record.date <= layerEnd)
        rows.push({ ...record, kind: "max" });
    }
    return rows.sort((a, b) => a.year - b.year);
  }, [ice.data]);

  const iceYears = useMemo(
    () => [...new Set(iceExtremes.map((r) => r.year))].sort((a, b) => a - b),
    [iceExtremes],
  );

  const [iceYear, setIceYear] = useState<number | null>(null);
  const [iceKind, setIceKind] = useState<"min" | "max">("min");

  const applyIceExtreme = useCallback(
    (year: number, kind: "min" | "max") => {
      const match = iceExtremes.find((r) => r.year === year && r.kind === kind);
      if (!match) return;
      setIceYear(year);
      setIceKind(kind);
      setLayerKey("seaIceMur");
      setDate(match.date);
    },
    [iceExtremes],
  );

  const activeExtreme = useMemo(
    () =>
      iceExtremes.find(
        (r) => r.date === effectiveDate && r.kind === iceKind,
      ) ?? null,
    [iceExtremes, effectiveDate, iceKind],
  );

  /* ------------------------------------------------------------ overlays -- */

  const expeditionSlugs = useMemo(
    () => (showExpeditions ? EXPEDITIONS.map((e) => e.slug) : []),
    [showExpeditions],
  );

  const overlays = useMemo(() => {
    const list: PointOverlay[] = [];

    if (showArgo && argo.data) {
      list.push({
        id: "argo",
        color: "#4fd8ff",
        radius: [1.8, 4],
        opacity: 0.8,
        popupTitle: "Argo float",
        popupFields: [
          { key: "id", label: "Platform" },
          { key: "time", label: "Last surfaced" },
          { key: "lat", label: "Latitude", unit: "°N" },
          { key: "lon", label: "Longitude", unit: "°E" },
        ],
        data: {
          type: "FeatureCollection",
          features: argo.data.floats.map((f) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [f.lon, f.lat] },
            properties: {
              id: f.id,
              time: f.time.slice(0, 10),
              lat: f.lat,
              lon: f.lon,
            },
          })),
        },
      });
    }

    if (showBuoys && ndbc.data) {
      list.push({
        id: "ndbc",
        color: "#ffb547",
        radius: [1.8, 4.5],
        opacity: 0.85,
        popupTitle: "NOAA buoy",
        popupFields: [
          { key: "id", label: "Station" },
          { key: "time", label: "Observed" },
          { key: "waterTemp", label: "Water temp", unit: "°C" },
          { key: "waveHeight", label: "Wave height", unit: "m" },
          { key: "windSpeed", label: "Wind", unit: "m/s" },
          { key: "pressure", label: "Pressure", unit: "hPa" },
        ],
        data: {
          type: "FeatureCollection",
          features: ndbc.data.stations.map((s) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [s.lon, s.lat] },
            properties: {
              id: s.id,
              time: s.time.replace("T", " ").replace(":00Z", " UTC"),
              waterTemp: s.waterTemp ?? "",
              waveHeight: s.waveHeight ?? "",
              windSpeed: s.windSpeed ?? "",
              pressure: s.pressure ?? "",
            },
          })),
        },
      });
    }

    return list;
  }, [showArgo, showBuoys, argo.data, ndbc.data]);

  const polygons = useMemo(() => {
    if (!showMpa) return [] as PolygonOverlay[];
    return [
      {
        id: "mpa",
        // Passed as a URL so MapLibre fetches it only when switched on.
        data: asset("/data/mpa-marine.geojson"),
        fillColor: "#3fbf9f",
        lineColor: "#5fe0c0",
        fillOpacity: 0.18,
        nameField: "NAME_ENG",
        popupTitle: "Marine protected area",
        popupFields: [
          { key: "DESIG_ENG", label: "Designation" },
          { key: "IUCN_CAT", label: "IUCN category" },
          { key: "NO_TAKE", label: "No-take" },
          { key: "STATUS_YR", label: "Designated" },
          { key: "GIS_M_AREA", label: "Marine area", unit: "km²" },
          { key: "ISO3", label: "Country" },
        ],
      } satisfies PolygonOverlay,
    ];
  }, [showMpa]);

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <OceanGlobe
        dataLayer={layerKey}
        overlays={overlays}
        polygons={polygons}
        date={effectiveDate}
        opacity={opacity}
        center={region.center}
        zoom={region.zoom}
        expeditions={expeditionSlugs}
        globe
        interactive
        onDataCoverageChange={handleCoverage}
        className="absolute inset-0 h-full w-full"
      />

      {/* ---------------------------------------------------------- drawer -- */}
      <div className="absolute left-0 top-14 z-20 max-h-[calc(100dvh-11rem)] w-[min(90vw,340px)] overflow-y-auto p-4">
        <button
          onClick={() => setDrawerOpen((o) => !o)}
          aria-expanded={drawerOpen}
          className="glass mb-2 flex w-full items-center justify-between rounded-sm px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ice"
        >
          Layers
          <span aria-hidden className={drawerOpen ? "rotate-45" : ""}>
            +
          </span>
        </button>

        {drawerOpen && (
          <div className="glass rounded-sm">
            {/* --------------------------------------------- base layer -- */}
            <div className="p-4">
              <p className="eyebrow mb-1">Base layer</p>
              <p className="mb-3 text-[10px] leading-relaxed text-dim">
                One at a time — overlapping scientific colour scales cannot be
                read.
              </p>

              {BASE_GROUPS.map(({ group, layers }) => (
                <div key={group} className="mb-3">
                  <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-dim">
                    {group}
                  </p>
                  <ul className="space-y-0.5">
                    {layers.map(({ key, blurb }) => {
                      const def = GIBS_LAYERS[key];
                      const active = key === layerKey;
                      return (
                        <li key={key}>
                          <button
                            onClick={() => setLayerKey(key)}
                            aria-pressed={active}
                            className={`w-full rounded-sm px-3 py-2 text-left transition-colors duration-200 ${
                              active
                                ? "bg-cyan/10 text-cyan-bright"
                                : "text-muted hover:bg-white/[0.03] hover:text-ice"
                            }`}
                          >
                            <span className="block text-[13px]">{def.label}</span>
                            <span className="mt-0.5 block text-[10px] leading-snug text-dim">
                              {blurb}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* ------------------------------- ice annual min / max jump -- */}
            {layerKey === "seaIceMur" && iceYears.length > 0 && (
              <div className="border-t border-[var(--hairline)] p-4">
                <p className="eyebrow mb-1">Annual extremes</p>
                <p className="mb-3 text-[10px] leading-relaxed text-dim">
                  Jump to the exact day of each year&rsquo;s greatest and least
                  Arctic ice, taken from the NSIDC record.
                </p>

                <div className="mb-3 flex gap-1">
                  {(["min", "max"] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() =>
                        iceYear ? applyIceExtreme(iceYear, k) : setIceKind(k)
                      }
                      aria-pressed={iceKind === k}
                      className={`flex-1 rounded-sm border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                        iceKind === k
                          ? "border-cyan bg-cyan/10 text-cyan-bright"
                          : "border-[var(--hairline)] text-muted hover:text-ice"
                      }`}
                    >
                      {k === "min" ? "Minimum" : "Maximum"}
                    </button>
                  ))}
                </div>

                <label htmlFor="ice-year-jump" className="sr-only">
                  Year
                </label>
                <input
                  id="ice-year-jump"
                  type="range"
                  min={0}
                  max={iceYears.length - 1}
                  step={1}
                  value={
                    iceYear ? Math.max(0, iceYears.indexOf(iceYear)) : iceYears.length - 1
                  }
                  onChange={(e) =>
                    applyIceExtreme(iceYears[Number(e.target.value)], iceKind)
                  }
                  className="w-full accent-cyan"
                />
                <div className="mt-1 flex justify-between text-[10px] text-dim tnum">
                  <span>{iceYears[0]}</span>
                  <span className="text-cyan-bright">
                    {activeExtreme ? activeExtreme.year : "—"}
                  </span>
                  <span>{iceYears[iceYears.length - 1]}</span>
                </div>

                {activeExtreme && (
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">
                    <span className="tnum text-ice">
                      {activeExtreme.extent.toFixed(2)}
                    </span>{" "}
                    million km² on {activeExtreme.date}
                  </p>
                )}

                <p className="mt-3 text-[10px] leading-relaxed text-dim">
                  Mappable years start in 2002. For 1979 onwards, see the{" "}
                  <a
                    href={asset("/arctic/")}
                    className="underline decoration-dotted underline-offset-2 hover:text-cyan-bright"
                  >
                    Arctic time machine
                  </a>
                  , which uses a true polar projection.
                </p>
              </div>
            )}

            {/* ---------------------------------------------- overlays -- */}
            <div className="border-t border-[var(--hairline)] p-4">
              <p className="eyebrow mb-1">Overlays</p>
              <p className="mb-3 text-[10px] leading-relaxed text-dim">
                Stack freely on top of the base layer.
              </p>

              <p className="mb-1.5 text-[9px] uppercase tracking-[0.14em] text-dim">
                Observing systems
              </p>
              <Toggle
                label="Argo floats"
                checked={showArgo}
                onChange={setShowArgo}
                count={argo.data?.count}
                swatch="#4fd8ff"
              />
              <Toggle
                label="NOAA buoys"
                checked={showBuoys}
                onChange={setShowBuoys}
                count={ndbc.data?.count}
                swatch="#ffb547"
              />
              {(showArgo || showBuoys) && (
                <p className="mb-3 mt-1 text-[10px] leading-relaxed text-dim">
                  In-situ measurements. Empty ocean means no instrument there,
                  not calm water.
                  {argo.data && showArgo
                    ? ` Snapshot ${relativeAge(argo.data.fetchedAt)}.`
                    : ""}
                </p>
              )}

              <p className="mb-1.5 mt-4 text-[9px] uppercase tracking-[0.14em] text-dim">
                Conservation
              </p>
              <Toggle
                label="Marine protected areas"
                checked={showMpa}
                onChange={setShowMpa}
                swatch="#5fe0c0"
              />
              {showMpa && (
                <p className="mb-3 mt-1 text-[10px] leading-relaxed text-dim">
                  A boundary shows legal designation, not enforcement or
                  outcome. Protection levels vary enormously — check the IUCN
                  category and no-take status.
                </p>
              )}

              <p className="mb-1.5 mt-4 text-[9px] uppercase tracking-[0.14em] text-dim">
                Ocean Warrior
              </p>
              <Toggle
                label="Expedition routes"
                checked={showExpeditions}
                onChange={setShowExpeditions}
                swatch="#00b7e8"
              />

              {/* The whole point of the platform, and honestly empty. */}
              <div className="mt-2 rounded-sm border border-[var(--hairline)] bg-[rgba(0,183,232,0.04)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-muted">
                    Expedition observations
                  </span>
                  <span className="shrink-0 rounded-[2px] border border-cyan/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-bright">
                    Coming soon
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-dim">
                  Temperature and salinity profiles, water samples and eDNA,
                  measured from the vessel. The schema is built and validated;
                  no measurements have been collected yet.
                </p>
              </div>
            </div>

            {/* --------------------------------------------- appearance -- */}
            <div className="border-t border-[var(--hairline)] p-4">
              <label htmlFor="opacity" className="eyebrow mb-2 block">
                Base layer opacity
              </label>
              <input
                id="opacity"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-cyan"
              />
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------- regions -- */}
      <div className="absolute right-0 top-14 z-20 w-[min(88vw,230px)] p-4">
        <div className="glass rounded-sm p-3">
          <p className="eyebrow mb-2">Region</p>
          <ul className="space-y-0.5">
            {REGION_PRESETS.map((preset) => (
              <li key={preset.id}>
                <button
                  onClick={() => setRegion(preset)}
                  aria-pressed={preset.id === region.id}
                  className={`w-full rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors duration-200 ${
                    preset.id === region.id
                      ? "bg-cyan/10 text-cyan-bright"
                      : "text-muted hover:text-ice"
                  }`}
                >
                  {preset.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ------------------------------------------------------------ time -- */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-4">
        <div className="glass-strong mx-auto max-w-4xl rounded-sm p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="text-sm text-ice">
                {layer.label}
                {activeExtreme && layerKey === "seaIceMur" && (
                  <span className="ml-2 text-xs text-cyan-bright">
                    {activeExtreme.year} annual{" "}
                    {activeExtreme.kind === "min" ? "minimum" : "maximum"}
                  </span>
                )}
              </p>
              {meta && (
                <p className="mt-0.5 text-[11px] text-dim">
                  {meta.sourceOrg}
                  {meta.spatialResolution ? ` · ${meta.spatialResolution}` : ""}
                  {meta.latency ? ` · latency ${meta.latency}` : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {meta && <StatusBadge status={meta.status} />}
              <span className="tnum text-sm text-cyan-bright">
                {effectiveDate}
              </span>
            </div>
          </div>

          <label htmlFor="explore-date" className="sr-only">
            Date
          </label>
          <input
            id="explore-date"
            type="date"
            value={date}
            min={layer.start}
            max={layer.end}
            onChange={(e) => {
              setDate(e.target.value);
              setIceYear(null);
            }}
            className="w-full rounded-sm border border-[var(--hairline)] bg-[rgba(7,20,36,0.6)] px-3 py-2 text-sm text-ice focus:border-cyan focus:outline-none"
          />

          {outsideCoverage && (
            <p className="mt-2 text-[11px] text-amber" role="status">
              This layer has no data for {date}. Showing {effectiveDate}, the
              nearest date within {layer.start?.slice(0, 4)}–
              {layer.end?.slice(0, 4)}.
            </p>
          )}

          {layer.legend && (
            <>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full">
                {layer.legend.map((stop) => (
                  <div
                    key={stop.label}
                    className="flex-1"
                    style={{ background: stop.color }}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-dim tnum">
                {layer.legend.map((stop) => (
                  <span key={stop.label}>{stop.label}</span>
                ))}
              </div>
              {layer.legendUnit && (
                <p className="mt-1 text-center text-[10px] text-dim">
                  {layer.legendUnit}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  count,
  swatch,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  count?: number;
  swatch?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[13px] text-muted transition-colors hover:text-ice">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-cyan"
      />
      {swatch && (
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: swatch }}
        />
      )}
      <span className="flex-1">{label}</span>
      {count != null && (
        <span className="text-[10px] text-dim tnum">
          {count.toLocaleString()}
        </span>
      )}
    </label>
  );
}
