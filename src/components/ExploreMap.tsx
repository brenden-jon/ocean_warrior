"use client";

import { useCallback, useMemo, useState } from "react";
import OceanGlobe from "./OceanGlobe";
import StatusBadge from "./StatusBadge";
import { GIBS_LAYERS, clampToCoverage } from "@/lib/gibs";
import { REGION_PRESETS } from "@/lib/mapStyle";
import { getLayer } from "@/lib/catalog";
import { EXPEDITIONS } from "@/data/expeditions";
import { useArgo, useNdbc, relativeAge } from "@/lib/baked";
import type { PointOverlay } from "./OceanGlobe";

/**
 * The explore view: one map, one time control, one contextual card.
 *
 * Layer choice is deliberately a single-select rather than a pile of toggles.
 * Stacking six semi-transparent scientific rasters produces colours that mean
 * nothing, and the brief is explicit that this should not look or behave like
 * a GIS portal.
 */

type LayerKey = keyof typeof GIBS_LAYERS;

const SELECTABLE: { key: LayerKey; group: string }[] = [
  { key: "sstAnomaly", group: "Ocean physics" },
  { key: "sst", group: "Ocean physics" },
  { key: "chlorophyll", group: "Life" },
  { key: "seaIceAmsr2", group: "Ice" },
  { key: "trueColor", group: "Context" },
];

export default function ExploreMap() {
  const [layerKey, setLayerKey] = useState<LayerKey>("sstAnomaly");
  const [date, setDate] = useState(
    () => GIBS_LAYERS.sstAnomaly.end ?? "2026-08-25",
  );
  const [opacity, setOpacity] = useState(0.85);
  const [region, setRegion] = useState(REGION_PRESETS[0]);
  const [showExpeditions, setShowExpeditions] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [outsideCoverage, setOutsideCoverage] = useState(false);
  const [showArgo, setShowArgo] = useState(false);
  const [showBuoys, setShowBuoys] = useState(false);

  const argo = useArgo();
  const ndbc = useNdbc();

  const layer = GIBS_LAYERS[layerKey];
  const meta = getLayer(layer.catalogId);

  const effectiveDate = useMemo(
    () => clampToCoverage(layer, date),
    [layer, date],
  );

  const handleCoverage = useCallback((outside: boolean) => {
    setOutsideCoverage(outside);
  }, []);

  const expeditionSlugs = useMemo(
    () => (showExpeditions ? EXPEDITIONS.map((e) => e.slug) : []),
    [showExpeditions],
  );

  /**
   * Observing-platform overlays.
   *
   * Both are in-situ measurements — actual instruments in actual water — which
   * is why they are drawn as discrete points rather than a continuous field.
   * Where they are absent, nothing is measured. That gap is the point.
   */
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
            properties: { id: f.id, time: f.time.slice(0, 10), lat: f.lat, lon: f.lon },
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

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <OceanGlobe
        dataLayer={layerKey}
        overlays={overlays}
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
      <div className="absolute left-0 top-16 z-20 max-h-[calc(100dvh-8rem)] w-[min(88vw,320px)] overflow-y-auto p-4">
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
          <div className="glass rounded-sm p-4">
            <ul className="space-y-1">
              {SELECTABLE.map(({ key, group }) => {
                const def = GIBS_LAYERS[key];
                const m = getLayer(def.catalogId);
                const active = key === layerKey;
                return (
                  <li key={key}>
                    <button
                      onClick={() => setLayerKey(key)}
                      aria-pressed={active}
                      className={`w-full rounded-sm px-3 py-2.5 text-left transition-colors duration-200 ${
                        active
                          ? "bg-cyan/10 text-cyan-bright"
                          : "text-muted hover:bg-white/[0.03] hover:text-ice"
                      }`}
                    >
                      <span className="block text-[9px] uppercase tracking-[0.14em] text-dim">
                        {group}
                      </span>
                      <span className="mt-0.5 block text-sm">{def.label}</span>
                      {m && (
                        <span className="mt-1 block text-[10px] text-dim">
                          {m.sourceOrg}
                          {def.start && def.end
                            ? ` · ${def.start.slice(0, 4)}–${def.end.slice(0, 4)}`
                            : ""}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 border-t border-[var(--hairline)] pt-4">
              <label
                htmlFor="opacity"
                className="eyebrow mb-2 block"
              >
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

            <div className="mt-4 space-y-2.5 border-t border-[var(--hairline)] pt-4">
              <p className="eyebrow">Observing systems</p>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={showArgo}
                  onChange={(e) => setShowArgo(e.target.checked)}
                  className="accent-cyan"
                />
                <span className="flex-1">Argo floats</span>
                {argo.data && (
                  <span className="text-[10px] text-dim tnum">
                    {argo.data.count.toLocaleString()}
                  </span>
                )}
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={showBuoys}
                  onChange={(e) => setShowBuoys(e.target.checked)}
                  className="accent-cyan"
                />
                <span className="flex-1">NOAA buoys</span>
                {ndbc.data && (
                  <span className="text-[10px] text-dim tnum">
                    {ndbc.data.count.toLocaleString()}
                  </span>
                )}
              </label>

              {(showArgo || showBuoys) && (
                <p className="pt-1 text-[10px] leading-relaxed text-dim">
                  In-situ measurements. Empty ocean means no instrument there,
                  not calm or unremarkable water.
                  {argo.data && showArgo && (
                    <>
                      {" "}
                      Snapshot {relativeAge(argo.data.fetchedAt)}.
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="mt-4 border-t border-[var(--hairline)] pt-4">
              <p className="eyebrow mb-2.5">Ocean Warrior</p>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={showExpeditions}
                  onChange={(e) => setShowExpeditions(e.target.checked)}
                  className="accent-cyan"
                />
                Expedition routes
              </label>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------- regions -- */}
      <div className="absolute right-0 top-16 z-20 w-[min(88vw,240px)] p-4">
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
              <p className="text-sm text-ice">{layer.label}</p>
              {meta && (
                <p className="mt-0.5 text-[11px] text-dim">
                  {meta.sourceOrg} · {meta.spatialResolution ?? ""}
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
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-sm border border-[var(--hairline)] bg-[rgba(7,20,36,0.6)] px-3 py-2 text-sm text-ice focus:border-cyan focus:outline-none"
          />

          {outsideCoverage && (
            <p className="mt-2 text-[11px] text-amber" role="status">
              This layer has no data for {date}. Showing {effectiveDate}, the
              nearest date within{" "}
              {layer.start?.slice(0, 4)}–{layer.end?.slice(0, 4)}.
            </p>
          )}

          {layer.legend && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-2 flex-1 overflow-hidden rounded-full">
                {layer.legend.map((stop) => (
                  <div
                    key={stop.label}
                    className="flex-1"
                    style={{ background: stop.color }}
                  />
                ))}
              </div>
            </div>
          )}
          {layer.legend && (
            <div className="mt-1 flex justify-between text-[10px] text-dim tnum">
              {layer.legend.map((stop) => (
                <span key={stop.label}>{stop.label}</span>
              ))}
            </div>
          )}
          {layer.legendUnit && (
            <p className="mt-1 text-center text-[10px] text-dim">
              {layer.legendUnit}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
