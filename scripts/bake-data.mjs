#!/usr/bin/env node
/**
 * Fetch the data sources that refuse cross-origin browser requests, and write
 * them as compact JSON into public/data.
 *
 * Run daily by .github/workflows/bake-data.yml. Everything here is public data
 * requiring no credentials; the only reason it cannot be fetched live by the
 * browser is that these servers send no Access-Control-Allow-Origin header.
 *
 * Every output carries `fetchedAt`, and the UI labels these as daily snapshots
 * with that timestamp. None of them is ever presented as live.
 *
 * Sources that DO send permissive CORS — NASA GIBS, NOAA ERDDAP, OBIS, GEBCO —
 * are deliberately absent here. They are fetched by the browser at request
 * time, so baking them would only make the data staler.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, "..", "public", "data");

const NOW = new Date().toISOString();

async function fetchText(url, { timeoutMs = 120_000, label } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "PlanetaryPulse/0.1 (Ocean Warrior prototype)" },
    });
    if (!response.ok) {
      throw new Error(`${label ?? url} responded ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function write(name, payload) {
  await mkdir(OUT_DIR, { recursive: true });
  const target = resolve(OUT_DIR, name);
  await writeFile(target, JSON.stringify(payload));
  const kb = (JSON.stringify(payload).length / 1024).toFixed(0);
  console.log(`  wrote ${name} (${kb} kB)`);
}

/* ========================================================================== */
/* NSIDC Sea Ice Index v4 — daily extent                                      */
/* ========================================================================== */

const DAY_MS = 86_400_000;

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

/** Day of year 1–366, with leap years aligned so 29 Feb does not shift things. */
function dayOfYear(y, m, d) {
  const start = Date.UTC(y, 0, 1);
  return Math.floor((Date.UTC(y, m - 1, d) - start) / DAY_MS) + 1;
}

/**
 * Parse NSIDC's daily extent CSV into a dense day-indexed array.
 *
 * The record is every second day before mid-1987, so a dense array with nulls
 * is both smaller than date-value pairs and honest about the gaps — the chart
 * can then break the line rather than interpolating across missing days.
 */
function parseSeaIceCsv(csv) {
  const lines = csv.split("\n");
  const observations = [];

  for (const line of lines) {
    const parts = line.split(",");
    if (parts.length < 4) continue;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const extent = Number(parts[3]);
    if (!Number.isFinite(year) || !Number.isFinite(extent) || extent <= 0) continue;
    observations.push({ year, month, day, extent });
  }

  if (observations.length === 0) throw new Error("no rows parsed from NSIDC CSV");

  const first = observations[0];
  const last = observations[observations.length - 1];
  const startMs = Date.UTC(first.year, first.month - 1, first.day);
  const endMs = Date.UTC(last.year, last.month - 1, last.day);
  const days = Math.round((endMs - startMs) / DAY_MS) + 1;

  const values = new Array(days).fill(null);
  for (const o of observations) {
    const index = Math.round((Date.UTC(o.year, o.month - 1, o.day) - startMs) / DAY_MS);
    if (index >= 0 && index < days) values[index] = Number(o.extent.toFixed(3));
  }

  /* --- 1981–2010 daily climatology, the standard NSIDC baseline ---------- */
  const sums = new Array(367).fill(0);
  const counts = new Array(367).fill(0);
  for (const o of observations) {
    if (o.year < 1981 || o.year > 2010) continue;
    const doy = dayOfYear(o.year, o.month, o.day);
    sums[doy] += o.extent;
    counts[doy] += 1;
  }
  const climatology = sums.map((sum, i) =>
    counts[i] > 0 ? Number((sum / counts[i]).toFixed(3)) : null,
  );

  /* --- annual minima and maxima ----------------------------------------- */
  const byYear = new Map();
  for (const o of observations) {
    if (!byYear.has(o.year)) byYear.set(o.year, []);
    byYear.get(o.year).push(o);
  }

  const annualMinima = [];
  const annualMaxima = [];
  for (const [year, records] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    // Exclude partial years — 1978, and the current one — because a minimum
    // drawn from part of a year is not comparable with a full one.
    //
    // Completeness is measured by the span the records cover, NOT by how many
    // there are: before mid-1987 the satellite recorded every second day, so a
    // simple count threshold silently discards 1979–1987, which is exactly the
    // period the long-term comparison depends on.
    const doys = records.map((r) => dayOfYear(r.year, r.month, r.day));
    const span = Math.max(...doys) - Math.min(...doys);
    if (span < 350 || records.length < 150) continue;
    const min = records.reduce((a, b) => (b.extent < a.extent ? b : a));
    const max = records.reduce((a, b) => (b.extent > a.extent ? b : a));
    annualMinima.push({
      year,
      date: `${year}-${String(min.month).padStart(2, "0")}-${String(min.day).padStart(2, "0")}`,
      extent: Number(min.extent.toFixed(3)),
    });
    annualMaxima.push({
      year,
      date: `${year}-${String(max.month).padStart(2, "0")}-${String(max.day).padStart(2, "0")}`,
      extent: Number(max.extent.toFixed(3)),
    });
  }

  const latest = {
    date: `${last.year}-${String(last.month).padStart(2, "0")}-${String(last.day).padStart(2, "0")}`,
    extent: Number(last.extent.toFixed(3)),
  };
  const latestDoy = dayOfYear(last.year, last.month, last.day);
  const latestClimatology = climatology[latestDoy];
  if (latestClimatology != null) {
    latest.climatology = latestClimatology;
    latest.anomaly = Number((latest.extent - latestClimatology).toFixed(3));
  }

  // Rank of the latest value against the same calendar day in every other
  // year. 1 = lowest on record for this day.
  const sameDay = observations
    .filter((o) => dayOfYear(o.year, o.month, o.day) === latestDoy)
    .sort((a, b) => a.extent - b.extent);
  const rankIndex = sameDay.findIndex((o) => o.year === last.year);
  if (rankIndex >= 0) {
    latest.rankLowest = rankIndex + 1;
    latest.rankOutOf = sameDay.length;
  }

  return {
    start: isoDay(new Date(startMs)),
    end: isoDay(new Date(endMs)),
    values,
    climatology,
    climatologyPeriod: "1981–2010",
    annualMinima,
    annualMaxima,
    latest,
  };
}

async function bakeSeaIce() {
  console.log("NSIDC Sea Ice Index v4 — daily extent");
  const base = "https://noaadata.apps.nsidc.org/NOAA/G02135";
  const [north, south] = await Promise.all([
    fetchText(`${base}/north/daily/data/N_seaice_extent_daily_v4.0.csv`, {
      label: "NSIDC north",
    }),
    fetchText(`${base}/south/daily/data/S_seaice_extent_daily_v4.0.csv`, {
      label: "NSIDC south",
    }),
  ]);

  await write("sea-ice-extent.json", {
    fetchedAt: NOW,
    source: {
      org: "NSIDC",
      product: "Sea Ice Index, Version 4",
      datasetId: "G02135",
      url: "https://nsidc.org/data/g02135/versions/4",
      unit: "million km²",
      definition:
        "Extent is the total area of ocean where sea-ice concentration is at least 15%.",
      attribution:
        "Fetterer, F., K. Knowles, W. N. Meier, M. Savoie, and A. K. Windnagel. Sea Ice Index, Version 4. NSIDC, Boulder, Colorado USA.",
    },
    north: parseSeaIceCsv(north),
    south: parseSeaIceCsv(south),
  });
}

/* ========================================================================== */
/* NOAA NDBC — latest buoy observations                                       */
/* ========================================================================== */

function parseNdbc(text) {
  const lines = text.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  const stations = [];
  const num = (v) => {
    const n = Number(v);
    return v === "MM" || !Number.isFinite(n) ? null : n;
  };

  for (const line of lines) {
    const f = line.trim().split(/\s+/);
    if (f.length < 19) continue;
    const lat = num(f[1]);
    const lon = num(f[2]);
    if (lat == null || lon == null) continue;
    if (lat === 0 && lon === 0) continue;

    const [y, mo, d, h, mi] = [f[3], f[4], f[5], f[6], f[7]];
    stations.push({
      id: f[0],
      lat,
      lon,
      time: `${y}-${mo}-${d}T${h}:${mi}:00Z`,
      windDir: num(f[8]),
      windSpeed: num(f[9]),
      waveHeight: num(f[11]),
      wavePeriod: num(f[12]),
      pressure: num(f[15]),
      airTemp: num(f[17]),
      waterTemp: num(f[18]),
    });
  }
  return stations;
}

async function bakeNdbc() {
  console.log("NOAA NDBC — latest observations");
  const text = await fetchText(
    "https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt",
    { label: "NDBC" },
  );
  const stations = parseNdbc(text);
  await write("ndbc-latest.json", {
    fetchedAt: NOW,
    source: {
      org: "NOAA National Data Buoy Center",
      product: "Latest observations",
      url: "https://www.ndbc.noaa.gov/",
      attribution: "NOAA National Data Buoy Center.",
    },
    count: stations.length,
    stations,
  });
}

/* ========================================================================== */
/* NASA GISTEMP — global surface temperature anomaly                          */
/* ========================================================================== */

async function bakeGistemp() {
  console.log("NASA GISTEMP v4");
  const csv = await fetchText(
    "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv",
    { label: "GISTEMP" },
  );
  const lines = csv.split("\n");
  const annual = [];
  const monthly = [];

  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim());
    const year = Number(parts[0]);
    if (!Number.isFinite(year) || year < 1880) continue;

    for (let m = 1; m <= 12; m++) {
      const value = Number(parts[m]);
      if (Number.isFinite(value)) {
        monthly.push([`${year}-${String(m).padStart(2, "0")}`, value]);
      }
    }
    // Column 13 is the calendar-year mean (J-D).
    const yearMean = Number(parts[13]);
    if (Number.isFinite(yearMean)) annual.push({ year, anomaly: yearMean });
  }

  await write("gistemp.json", {
    fetchedAt: NOW,
    source: {
      org: "NASA GISS",
      product: "GISTEMP v4",
      url: "https://data.giss.nasa.gov/gistemp/",
      unit: "°C",
      baseline: "1951–1980",
      attribution:
        "GISTEMP Team. GISS Surface Temperature Analysis (GISTEMP), version 4. NASA Goddard Institute for Space Studies.",
    },
    annual,
    monthly,
  });
}

/* ========================================================================== */
/* Argo — recent float positions                                              */
/* ========================================================================== */

async function bakeArgo() {
  console.log("Argo — recent float positions (Ifremer ERDDAP)");
  const since = new Date(Date.now() - 10 * DAY_MS).toISOString().slice(0, 19);
  const url =
    "https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.json?" +
    "platform_number,time,latitude,longitude" +
    `&time%3E=${since}Z&distinct()&orderByMax(%22platform_number,time%22)`;

  const json = JSON.parse(await fetchText(url, { label: "Argo", timeoutMs: 180_000 }));
  const rows = json.table.rows;

  const floats = [];
  let withoutPosition = 0;
  for (const [id, time, lat, lon] of rows) {
    if (lat == null || lon == null) {
      // Floats that surfaced without a position fix — most often under or near
      // sea ice. Counted rather than dropped, because the count is itself
      // evidence of where the observing system struggles.
      withoutPosition += 1;
      continue;
    }
    floats.push({
      id,
      time,
      lat: Number(lat.toFixed(3)),
      lon: Number(lon.toFixed(3)),
    });
  }

  await write("argo-floats.json", {
    fetchedAt: NOW,
    source: {
      org: "International Argo Programme",
      product: "Argo GDAC via Ifremer ERDDAP",
      url: "https://argo.ucsd.edu/data/",
      doi: "10.17882/42182",
      attribution:
        "These data were collected and made freely available by the International Argo Program and the national programmes that contribute to it.",
    },
    windowDays: 10,
    count: floats.length,
    withoutPosition,
    floats,
  });
}


/* ========================================================================== */
/* NOAA CoastWatch — blended surface currents                                 */
/* ========================================================================== */

/**
 * Global surface-current vectors, thinned to a 1-degree grid.
 *
 * The native product is 0.25°, which is far finer than a particle animation
 * needs and would be a needlessly large download. ERDDAP can stride the grid
 * server-side, so we ask for every fourth cell rather than fetching everything
 * and throwing three quarters of it away.
 *
 * Stored as two flat row-major arrays with nulls over land, which is markedly
 * smaller than lat/lon/value triples and is exactly the shape the interpolator
 * in the browser wants.
 */
async function bakeCurrents() {
  console.log("NOAA CoastWatch — blended surface currents");
  const base =
    "https://coastwatch.noaa.gov/erddap/griddap/noaacwBLENDEDNRTcurrentsDaily.csv";
  const range = "%5B(last)%5D%5B(-89.875):4:(89.875)%5D%5B(-179.875):4:(179.875)%5D";
  const csv = await fetchText(`${base}?u_current${range},v_current${range}`, {
    label: "NOAA currents",
    timeoutMs: 240_000,
  });

  const lines = csv.split("\n");
  // Row 0 is column names, row 1 is units.
  const lats = new Set();
  const lons = new Set();
  const cells = new Map();
  let date = null;

  for (let i = 2; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 5) continue;
    const [time, latStr, lonStr, uStr, vStr] = parts;
    const lat = Number(latStr);
    const lon = Number(lonStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (!date) date = time.slice(0, 10);
    lats.add(lat);
    lons.add(lon);
    const u = Number(uStr);
    const v = Number(vStr);
    cells.set(
      `${lat},${lon}`,
      Number.isFinite(u) && Number.isFinite(v)
        ? [Number(u.toFixed(3)), Number(v.toFixed(3))]
        : null,
    );
  }

  const latList = [...lats].sort((a, b) => a - b);
  const lonList = [...lons].sort((a, b) => a - b);
  if (latList.length === 0 || lonList.length === 0) {
    throw new Error("no current cells parsed");
  }

  const u = [];
  const v = [];
  for (const lat of latList) {
    for (const lon of lonList) {
      const cell = cells.get(`${lat},${lon}`);
      u.push(cell ? cell[0] : null);
      v.push(cell ? cell[1] : null);
    }
  }

  const withData = u.filter((x) => x !== null).length;

  await write("currents.json", {
    fetchedAt: NOW,
    date,
    source: {
      org: "NOAA CoastWatch",
      product: "Blended near-real-time sea surface currents (geostrophic, altimetry-derived)",
      datasetId: "noaacwBLENDEDNRTcurrentsDaily",
      url: "https://coastwatch.noaa.gov/erddap/griddap/noaacwBLENDEDNRTcurrentsDaily.html",
      unit: "m/s",
      attribution: "NOAA CoastWatch blended sea surface currents.",
    },
    grid: {
      lat0: latList[0],
      lon0: lonList[0],
      dLat: latList.length > 1 ? Number((latList[1] - latList[0]).toFixed(4)) : 1,
      dLon: lonList.length > 1 ? Number((lonList[1] - lonList[0]).toFixed(4)) : 1,
      nLat: latList.length,
      nLon: lonList.length,
    },
    cellsWithData: withData,
    u,
    v,
  });
}

/* ========================================================================== */

const TASKS = [
  ["sea ice", bakeSeaIce],
  ["ndbc", bakeNdbc],
  ["gistemp", bakeGistemp],
  ["argo", bakeArgo],
  ["currents", bakeCurrents],
];

let failures = 0;
for (const [name, task] of TASKS) {
  try {
    await task();
  } catch (error) {
    // One flaky source must not block the others. The workflow reports a
    // non-zero exit so the failure is visible, but every other file is still
    // written and committed.
    failures += 1;
    console.error(`  FAILED (${name}): ${error.message}`);
  }
}

console.log(
  failures === 0
    ? "\nAll sources baked."
    : `\n${failures} of ${TASKS.length} sources failed.`,
);
process.exit(failures > 0 ? 1 : 0);
