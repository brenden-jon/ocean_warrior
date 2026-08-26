# Ocean Warrior | Planetary Pulse

A living view of a changing ocean.

Planetary Pulse is the public interface between the world's ocean observing
systems and Ocean Warrior's expeditions. It holds no ocean data of its own. It
shows what NASA, NOAA, NSIDC, Copernicus Marine, Argo and OBIS already measure,
and shows where Ocean Warrior adds new observations to that picture.

**This is a private prototype behind a passphrase. Not for publication.**

---

## What it deliberately is not

It is not a scientific data portal, and does not compete with one. Copernicus
Marine, EMODnet, NASA Earthdata and the European Digital Twin Ocean already do
the enormous work of observing, modelling and serving the ocean.

What none of them has is a ship. The defensible position is not aggregation —
it is *ground truth with a human attached*, presented so that a non-specialist
can understand it.

---

## Running it

```bash
npm install
cp .env.example .env.local     # then set APP_PASSWORD and edit as needed
npm run bake                   # fetch the non-CORS data sources
python3 scripts/bake-ice-maps.py north   # needs Pillow; ~5 MB of ice maps
npm run dev
```

Build a production static export:

```bash
APP_PASSWORD='your passphrase' npm run build
```

Output lands in `out/`. `npm run build` runs `scripts/make-gate.mjs` first,
which turns `APP_PASSWORD` into a salted PBKDF2/AES-GCM sentinel. The passphrase
itself never enters the repository or the client bundle.

---

## Architecture

Static export on GitHub Pages. No server. Two consequences shape everything:

**The gate is client-side.** It is a keep-out sign, not a lock — the encrypted
sentinel is downloadable and can be attacked offline, so the passphrase is the
only real protection (PBKDF2, 600,000 iterations, so use four or more words).
Acceptable here because nothing behind it is confidential: every dataset is
public and the only thing withheld is an unfinished interface. If it ever needs
real confidentiality, that means a server-side gate, not a bigger number.

**Some sources block browsers.** NSIDC, NDBC, GISTEMP and Argo send no CORS
headers. A scheduled GitHub Action fetches them daily and commits compact JSON
to `public/data`, labelled in the UI as dated snapshots. Everything else — NASA
GIBS tiles, NOAA ERDDAP, OBIS, GEBCO — sends permissive CORS and is fetched
live by the browser.

```
src/lib/types.ts       provenance model — the scientific backbone
src/lib/catalog.ts     every layer, with status, licence and caveats
src/lib/gibs.ts        NASA GIBS tiles; params read from live capabilities
src/lib/gate.ts        client-side access gate
src/data/expeditions.ts  routes, typed by fidelity
scripts/bake-data.mjs    daily fetch of CORS-blocked sources
scripts/bake-ice-maps.py 46 years of sea-ice maps, min and max per year
```

---

## What is actually live

| Layer | Source | State |
|---|---|---|
| Arctic & Antarctic sea-ice extent, 1978→now | NSIDC Sea Ice Index v4 | Live, daily snapshot |
| Sea-ice maps, min + max per year 1979–2025 | NSIDC v4 over Blue Marble | Live, 93 frames |
| SST anomaly, 1 km | NASA GIBS / MUR | Live, current to yesterday |
| Sea surface temperature, 1 km | NASA GIBS / MUR | Live |
| Chlorophyll-a | NASA GIBS / PACE | Live, current to today |
| True colour | NASA GIBS / VIIRS | Live, current to today |
| Sea-ice concentration | NASA GIBS / AMSR2 | Live, 2012–2025 |
| Bathymetry | GEBCO / Blue Marble | Live |
| Argo float positions | Ifremer ERDDAP | Live, daily snapshot |
| NDBC buoys | NOAA | Live, daily snapshot |
| Global temperature, CO₂ | GISTEMP, NOAA GML | Live, daily snapshot |
| Surface currents | Copernicus Marine | **Credentials required** |
| Apparent fishing effort | Global Fishing Watch | **Credentials required** |
| Marine protected areas | WDPA Aug 2026 | **Connector ready** |
| OBIS occurrences, eDNA, coral heat stress | OBIS, NOAA CRW | **Planned** |

Nothing is faked. A layer without credentials says so; it never substitutes
demonstration data for missing real data.

---

## Known limitations

- The access gate is offline-attackable. See above.
- SST anomaly tiles are pre-rendered images, so values cannot be queried
  numerically. Numeric readout comes from NOAA ERDDAP separately.
- GIBS sea-ice concentration is historical: SSMIS ends 2021, AMSR2 ends 2025.
  Current ice comes from the NSIDC extent record instead.
- No expedition GPS tracks exist. Every route is an itinerary interpolation, an
  area, or a labelled concept.
- Demo station data is synthetic and badged as such.

---

## Attribution

Data are provided by NASA (GIBS, GISTEMP, PACE, MUR SST), NOAA (NCEI, NDBC,
GML), NSIDC (Sea Ice Index v4), the International Argo Programme, OBIS, GEBCO,
Copernicus Marine Service and UNEP-WCMC/IUCN (WDPA). Full citations, licences
and caveats for every layer are in the in-app data catalog at `/data`.
