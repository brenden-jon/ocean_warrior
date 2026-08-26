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
import { VESSELS } from "@/data/vessels";
import { BaseLayerOption, LayerGroup, LayerToggle } from "./LayerDrawer";

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
  const [layerKey, setLayerKey] = useState<LayerKey | null>("sstAnomaly");
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
  const [showVessels, setShowVessels] = useState(true);

  const argo = useArgo();
  const ndbc = useNdbc();
  const ice = useSeaIce();

  const layer = layerKey ? GIBS_LAYERS[layerKey] : null;
  const meta = layer ? getLayer(layer.catalogId) : null;
  const effectiveDate = useMemo(
    () => (layer ? clampToCoverage(layer, date) : date),
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

    if (showVessels && VESSELS.length > 0) {
      list.push({
        id: "vessels",
        color: "#ffffff",
        radius: [4, 8],
        opacity: 1,
        strokeColor: "#00b7e8",
        popupTitle: "Ocean Warrior vessel",
        popupFields: [
          { key: "name", label: "Vessel" },
          { key: "status", label: "Status" },
          { key: "position", label: "Position" },
          { key: "fix", label: "Position fix" },
          { key: "note", label: "" },
        ],
        data: {
          type: "FeatureCollection",
          features: VESSELS.map((v) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [v.longitude, v.latitude],
            },
            properties: {
              name: v.name,
              status: v.status === "in_port" ? "In port" : v.status === "under_way" ? "Under way" : "Unknown",
              position: `${v.latitude.toFixed(3)}°N, ${v.longitude.toFixed(3)}°E`,
              fix: v.timestampUtc ?? "No live feed connected",
              note: v.note,
            },
          })),
        },
      });
    }

    return list;
  }, [showArgo, showBuoys, showVessels, argo.data, ndbc.data]);

  const polygons = useMemo(() => {
    if (!showMpa) return [] as PolygonOverlay[];
    return [
      {
        id: "mpa",
        // Passed as a URL so MapLibre fetches it only when switched on.
        data: asset("/data/mpa-marine.geojson"),
        // Tuned against the live map: at 0.18 opacity in a muted teal these
        // were technically rendering and visually absent at global zoom.
        fillColor: "#37e0b0",
        lineColor: "#7dffd8",
        fillOpacity: 0.42,
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

      {/* ---------------------------------------------------------- drawer --
          Ordered by what makes this platform distinctive, not by dataset size.
          Ocean Warrior's own layers sit at the top where they are visible
          without scrolling; the scientific rasters, which are context, sit
          below and collapse away. */}
      <div className="absolute left-0 top-14 z-20 max-h-[calc(100dvh-10rem)] w-[min(90vw,330px)] overflow-y-auto p-4">
        <button
          onClick={() => setDrawerOpen((o) => !o)}
          aria-expanded={drawerOpen}
          className="glass mb-2 flex w-full items-center justify-between rounded-sm px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ice"
        >
          Layers
          <span aria-hidden className={drawerOpen ? "rotate-45" : ""}>+</span>
        </button>

        {drawerOpen && (
          <div className="glass rounded-sm">
            <LayerGroup title="Ocean Warrior" accent="#00b7e8" defaultOpen>
              <LayerToggle
                label="Expedition routes"
                checked={showExpeditions}
                onChange={setShowExpeditions}
                swatch="#4fd8ff"
                hint="Eight legs, each a different colour. Click a leg to identify it."
              />
              <LayerToggle
                label="Vessel positions"
                checked={showVessels}
                onChange={setShowVessels}
                swatch="#ffffff"
                badge="Demo"
                count={VESSELS.length}
                hint="No live tracker feed is connected. The vessel is shown at its home port so the interface can demonstrate how a live position will appear."
              />
              <LayerToggle
                label="Expedition observations"
                checked={false}
                onChange={() => {}}
                disabled
                badge="Soon"
                hint="CTD profiles, water samples and eDNA. Schema built; no measurements collected yet."
              />
            </LayerGroup>

            <LayerGroup title="Observing systems" accent="#4fd8ff" defaultOpen>
              <LayerToggle
                label="Argo floats"
                checked={showArgo}
                onChange={setShowArgo}
                count={argo.data?.count}
                swatch="#4fd8ff"
              />
              <LayerToggle
                label="NOAA buoys"
                checked={showBuoys}
                onChange={setShowBuoys}
                count={ndbc.data?.count}
                swatch="#ffb547"
              />
              {(showArgo || showBuoys) && (
                <p className="mt-1 text-[10px] leading-relaxed text-dim">
                  In-situ measurements. Empty ocean means no instrument there,
                  not calm water.
                  {argo.data && showArgo
                    ? ` Snapshot ${relativeAge(argo.data.fetchedAt)}.`
                    : ""}
                </p>
              )}
            </LayerGroup>

            <LayerGroup title="Conservation" accent="#5fe0c0" defaultOpen={false}>
              <LayerToggle
                label="Marine protected areas"
                checked={showMpa}
                onChange={setShowMpa}
                swatch="#5fe0c0"
                hint="A boundary shows legal designation, not enforcement or outcome."
              />
            </LayerGroup>

            <LayerGroup
              title="Ocean data"
              subtitle="One at a time — overlapping scientific colour scales cannot be read. Click the active layer again to turn it off."
              defaultOpen
            >
              <BaseLayerOption
                label="None"
                blurb="Imagery and bathymetry only"
                active={layerKey === null}
                onSelect={() => setLayerKey(null)}
                onClear={() => setLayerKey(null)}
              />
              {BASE_GROUPS.map(({ group, layers }) => (
                <div key={group} className="mt-2">
                  <p className="mb-0.5 px-2.5 text-[9px] uppercase tracking-[0.14em] text-dim">
                    {group}
                  </p>
                  {layers.map(({ key, blurb }) => (
                    <BaseLayerOption
                      key={key}
                      label={GIBS_LAYERS[key].label}
                      blurb={blurb}
                      active={key === layerKey}
                      onSelect={() => setLayerKey(key)}
                      onClear={() => setLayerKey(null)}
                    />
                  ))}
                </div>
              ))}

              {layerKey === "seaIceMur" && iceYears.length > 0 && (
                <div className="mt-4 border-t border-[var(--hairline)] pt-3">
                  <p className="eyebrow mb-1">Annual extremes</p>
                  <p className="mb-2.5 text-[10px] leading-relaxed text-dim">
                    Jump to the exact day of each year&rsquo;s greatest and
                    least Arctic ice, from the NSIDC record.
                  </p>
                  <div className="mb-2.5 flex gap-1">
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
                  <label htmlFor="ice-year-jump" className="sr-only">Year</label>
                  <input
                    id="ice-year-jump"
                    type="range"
                    min={0}
                    max={iceYears.length - 1}
                    step={1}
                    value={iceYear ? Math.max(0, iceYears.indexOf(iceYear)) : iceYears.length - 1}
                    onChange={(e) => applyIceExtreme(iceYears[Number(e.target.value)], iceKind)}
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
                  <p className="mt-2 text-[10px] leading-relaxed text-dim">
                    Mappable years start in 2002. For 1979 onwards see the{" "}
                    <a href={asset("/arctic/")} className="underline decoration-dotted underline-offset-2 hover:text-cyan-bright">
                      Arctic time machine
                    </a>.
                  </p>
                </div>
              )}

              {layer && (
                <div className="mt-4 border-t border-[var(--hairline)] pt-3">
                  <label htmlFor="opacity" className="eyebrow mb-2 block">
                    Layer opacity
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
              )}
            </LayerGroup>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------- regions -- */}
      <div className="absolute right-0 top-14 z-20 w-[min(88vw,220px)] p-4">
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
      {layer && (
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
                <button
                  onClick={() => setLayerKey(null)}
                  className="rounded-sm border border-[var(--hairline-bright)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:border-cyan hover:text-cyan-bright"
                >
                  Turn off
                </button>
              </div>
            </div>

            <label htmlFor="explore-date" className="sr-only">Date</label>
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

            {(layerKey === "sst" || layerKey === "sstAnomaly") && (
              <p className="mt-2 text-[11px] leading-relaxed text-dim">
                Sea surface temperature is undefined beneath sea ice, so ice
                concentration for the same date is drawn underneath — the
                colour at the poles is ice, not missing data.
              </p>
            )}

            <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
              Web Mercator cannot represent latitudes beyond 85&deg;, so the
              polar caps are shaded rather than measured. For a true polar
              projection see the{" "}
              <a href={asset("/arctic/")} className="underline decoration-dotted underline-offset-2 hover:text-cyan-bright">
                Arctic view
              </a>.
            </p>

            {outsideCoverage && (
              <p className="mt-2 text-[11px] text-amber" role="status">
                This layer has no data for {date}. Showing {effectiveDate}, the
                nearest date within {layer.start?.slice(0, 4)}–{layer.end?.slice(0, 4)}.
              </p>
            )}

            {layer.legend && (
              <>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full">
                  {layer.legend.map((stop) => (
                    <div key={stop.label} className="flex-1" style={{ background: stop.color }} />
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
      )}
    </div>
  );
}
