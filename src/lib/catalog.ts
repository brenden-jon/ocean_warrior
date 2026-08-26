import type { LayerMetadata } from "./types";

/**
 * The layer catalog.
 *
 * Single source of truth for what the platform knows about. Drives the layer
 * drawer, the data catalog page and every provenance panel. A layer that is not
 * in here cannot be drawn — which is the point: nothing reaches the screen
 * without a source, a licence and a stated limitation.
 *
 * `status` is honest by construction:
 *   live                 — really pulling real data now
 *   credentials_required — connector written, source needs a key we don't have
 *   connector_ready      — connector written, not yet surfaced as a map layer
 *   planned              — roadmap only
 *   demo                 — synthetic, badged everywhere it appears
 */

export const CATALOG: LayerMetadata[] = [
  /* ---------------------------------------------------------------- ICE -- */
  {
    id: "nsidc-extent-arctic",
    title: "Arctic sea-ice extent",
    plainSummary:
      "How much of the Arctic Ocean is covered by sea ice, measured every day since 1978.",
    whyItMatters:
      "Sea ice is the Arctic's thermostat and its habitat. Bright ice reflects sunlight back to space; dark open water absorbs it. The long daily record makes this one of the clearest measurements of change anywhere on Earth.",
    category: "ice",
    sourceType: "analysis",
    status: "live",
    cadence: "daily",
    sourceOrg: "NSIDC",
    productName: "Sea Ice Index, Version 4",
    datasetId: "G02135",
    variables: [
      {
        name: "extent",
        unit: "million km²",
        description:
          "Total area of ocean with at least 15% sea-ice concentration.",
      },
    ],
    spatialCoverage: "Northern Hemisphere",
    spatialResolution: "25 km source grid, reported as a single total",
    temporalCoverage: "1978-10-26 to present",
    latency: "1–2 days",
    accessMethod: "CSV over HTTPS, proxied and cached server-side",
    requiresProxy: true,
    requiredCredentials: [],
    license: "Freely available for use with attribution",
    attribution:
      "Fetterer, F., K. Knowles, W. N. Meier, M. Savoie, and A. K. Windnagel. Sea Ice Index, Version 4. NSIDC, Boulder, Colorado USA.",
    citation:
      "Fetterer, F., et al. Sea Ice Index, Version 4. Boulder, Colorado USA: National Snow and Ice Data Center.",
    sourceUrl: "https://nsidc.org/data/g02135/versions/4",
    caveats: [
      "Extent counts a grid cell as ice-covered if at least 15% of it is ice, so it is not the same as ice area.",
      "The satellite record begins in late 1978. Earlier Arctic conditions are known from other, less consistent sources.",
      "Before mid-1987 the record is every second day, not daily.",
      "Instruments have changed over the record; NSIDC applies intercalibration, but small steps between sensor eras exist.",
    ],
  },
  {
    id: "nsidc-extent-antarctic",
    title: "Antarctic sea-ice extent",
    plainSummary:
      "The same daily measurement for the Southern Ocean, where the ice behaves very differently.",
    whyItMatters:
      "Antarctic sea ice grew slightly for decades, then fell to record lows from 2016 onwards. It is a live scientific question why, which makes it an honest example of what is and is not settled.",
    category: "ice",
    sourceType: "analysis",
    status: "live",
    cadence: "daily",
    sourceOrg: "NSIDC",
    productName: "Sea Ice Index, Version 4",
    datasetId: "G02135",
    variables: [{ name: "extent", unit: "million km²" }],
    spatialCoverage: "Southern Hemisphere",
    spatialResolution: "25 km source grid",
    temporalCoverage: "1978-10-26 to present",
    latency: "1–2 days",
    accessMethod: "CSV over HTTPS, proxied and cached server-side",
    requiresProxy: true,
    requiredCredentials: [],
    license: "Freely available for use with attribution",
    attribution:
      "Fetterer, F., K. Knowles, W. N. Meier, M. Savoie, and A. K. Windnagel. Sea Ice Index, Version 4. NSIDC.",
    sourceUrl: "https://nsidc.org/data/g02135/versions/4",
    caveats: [
      "Antarctic sea ice is mostly seasonal and floats freely, so it responds to winds and currents far more than Arctic ice does.",
      "Trends here are not a mirror of the Arctic and should never be presented as cancelling them out.",
      "Same 15% concentration threshold and same sensor-era caveats as the Arctic product.",
    ],
  },
  {
    id: "gibs-sea-ice-conc",
    title: "Sea-ice concentration",
    plainSummary:
      "A daily satellite map of how densely packed the sea ice is, from 1978 to 2021.",
    whyItMatters:
      "The extent number tells you how much ice there is. This shows you where it is, and lets you watch the ice edge move north across four decades.",
    category: "ice",
    sourceType: "satellite",
    status: "live",
    cadence: "historical",
    sourceOrg: "NASA GIBS / NSIDC",
    productName: "SSMIS Sea Ice Concentration (NSIDC-0051 / 0081 via GIBS)",
    datasetId: "SSMIS_Sea_Ice_Concentration",
    variables: [{ name: "sea ice concentration", unit: "%" }],
    spatialCoverage: "Arctic and Antarctic, polar stereographic projection",
    spatialResolution: "25 km, served as 1 km tiles",
    temporalCoverage: "1978-10-26 to 2021-08-22",
    latency: "Archive only — this product is not current",
    accessMethod: "WMTS raster tiles (EPSG:3413 / EPSG:3031), direct from browser",
    requiresProxy: false,
    requiredCredentials: [],
    license: "NASA open data — free and unrestricted use",
    attribution:
      "Imagery courtesy of NASA Worldview / Global Imagery Browse Services (GIBS), part of NASA ESDIS.",
    sourceUrl: "https://nsidc.org/data/nsidc-0051",
    caveats: [
      "This GIBS layer ends on 2021-08-22 and is a historical archive, not a current view. Recent ice comes from a different product.",
      "Passive-microwave concentration is unreliable during summer melt, when meltwater ponds on the ice surface are read as open water.",
      "Coastal grid cells are contaminated by the land signal, so concentration near shore is less trustworthy.",
    ],
  },
  {
    id: "gibs-amsr2-ice",
    title: "Sea-ice concentration (higher resolution)",
    plainSummary:
      "A sharper daily view of the ice, from a Japanese satellite radiometer, covering 2012 to 2025.",
    category: "ice",
    sourceType: "satellite",
    status: "live",
    cadence: "historical",
    sourceOrg: "NASA GIBS / JAXA",
    productName: "AMSR2 Sea Ice Concentration 12 km",
    datasetId: "AMSRU2_Sea_Ice_Concentration_12km",
    variables: [{ name: "sea ice concentration", unit: "%" }],
    spatialCoverage: "Arctic and Antarctic polar",
    spatialResolution: "12 km",
    temporalCoverage: "2012-07-02 to 2025-09-01",
    latency: "Archive",
    accessMethod: "WMTS raster tiles, direct from browser",
    requiresProxy: false,
    requiredCredentials: [],
    license: "NASA open data",
    attribution: "NASA GIBS; AMSR2 data courtesy of JAXA.",
    sourceUrl: "https://nsidc.org/data/au_si12",
    caveats: [
      "Twice the resolution of the SSMIS record but only covers 2012 onwards, so it cannot show long-term change on its own.",
      "Same summer-melt limitation as all passive-microwave ice products.",
    ],
  },

  /* -------------------------------------------------------- OCEAN PHYSICS -- */
  {
    id: "oisst-sst",
    title: "Sea surface temperature",
    plainSummary:
      "The temperature of the ocean's surface, everywhere, every day since 1981.",
    whyItMatters:
      "The ocean has absorbed the overwhelming majority of the extra heat trapped by greenhouse gases. This is the measurement where that shows up.",
    category: "ocean_physics",
    sourceType: "analysis",
    status: "live",
    cadence: "daily",
    sourceOrg: "NOAA NCEI",
    productName: "Optimum Interpolation SST (OISST) v2.1",
    datasetId: "ncdc_oisst_v2_avhrr_by_time_zlev_lat_lon",
    variables: [{ name: "sst", unit: "°C" }],
    spatialCoverage: "Global ocean",
    spatialResolution: "0.25° (roughly 25 km)",
    temporalCoverage: "1981-09-01 to present",
    latency: "Roughly two weeks on the NCEI ERDDAP endpoint used here",
    accessMethod: "ERDDAP griddap subset, requested directly from the browser",
    requiresProxy: false,
    requiredCredentials: [],
    license: "NOAA open data — public domain",
    attribution:
      "Huang, B., et al. (2021). NOAA 0.25-degree Daily Optimum Interpolation Sea Surface Temperature (OISST), Version 2.1. NOAA NCEI.",
    doi: "10.25921/RE9P-PT57",
    sourceUrl:
      "https://www.ncei.noaa.gov/products/optimum-interpolation-sst",
    caveats: [
      "This is an analysis, not a raw measurement: satellite and ship/buoy observations are blended and interpolated onto a regular grid.",
      "Gaps are filled by interpolation, so a value exists everywhere even where nothing was observed that day.",
      "It measures the top fraction of a millimetre to a few metres of ocean, not the water column.",
      "Under sea ice, values are constrained by the ice and should not be read as open-water temperature.",
      "The endpoint used here runs roughly two weeks behind. It is daily data, not a live feed.",
    ],
  },
  {
    id: "oisst-anomaly",
    title: "Sea surface temperature anomaly",
    plainSummary:
      "How much warmer or cooler the sea surface is than normal for the time of year.",
    whyItMatters:
      "Raw temperature mostly shows you that the tropics are warm and the poles are cold. Subtracting the seasonal average strips that away and leaves only the departure from normal — which is where marine heatwaves, El Niño and long-term warming become visible.",
    category: "ocean_physics",
    sourceType: "derived",
    status: "live",
    cadence: "daily",
    sourceOrg: "NOAA NCEI",
    productName: "OISST v2.1 anomaly field",
    datasetId: "ncdc_oisst_v2_avhrr_by_time_zlev_lat_lon",
    variables: [
      {
        name: "anom",
        unit: "°C",
        description: "Departure from the 1971–2000 daily climatology.",
      },
    ],
    spatialCoverage: "Global ocean",
    spatialResolution: "0.25°",
    temporalCoverage: "1981-09-01 to present",
    latency: "Roughly two weeks",
    accessMethod: "ERDDAP griddap subset, direct from browser",
    requiresProxy: false,
    requiredCredentials: [],
    license: "NOAA open data — public domain",
    attribution:
      "Huang, B., et al. (2021). NOAA OISST V2.1. NOAA NCEI.",
    doi: "10.25921/RE9P-PT57",
    sourceUrl: "https://www.ncei.noaa.gov/products/optimum-interpolation-sst",
    caveats: [
      "An anomaly is only meaningful relative to its baseline. This one uses 1971–2000, which already contains substantial warming — so anomalies against it understate change since pre-industrial times.",
      "Inherits every limitation of the underlying SST analysis.",
      "The colour scale is fixed, not auto-scaled, so that small anomalies cannot be made to look dramatic.",
    ],
  },
  {
    id: "gibs-mur-sst-anomaly",
    title: "High-resolution SST anomaly",
    plainSummary:
      "The same idea at roughly a kilometre, sharp enough to see individual eddies and fronts.",
    category: "ocean_physics",
    sourceType: "derived",
    status: "live",
    cadence: "daily",
    sourceOrg: "NASA GIBS / JPL",
    productName: "GHRSST L4 MUR Sea Surface Temperature Anomalies",
    datasetId: "GHRSST_L4_MUR_Sea_Surface_Temperature_Anomalies",
    variables: [{ name: "sst anomaly", unit: "°C" }],
    spatialCoverage: "Global ocean",
    spatialResolution: "1 km",
    temporalCoverage: "2002-06-01 to present",
    latency: "Several days",
    accessMethod: "WMTS raster tiles, direct from browser, no authentication",
    requiresProxy: false,
    requiredCredentials: [],
    license: "NASA open data",
    attribution:
      "Imagery courtesy of NASA GIBS. MUR SST produced by NASA/JPL.",
    sourceUrl: "https://podaac.jpl.nasa.gov/dataset/MUR-JPL-L4-GLOB-v4.1",
    caveats: [
      "A gap-free analysis: fine detail in cloudy regions is inferred, not observed.",
      "As pre-rendered tiles, values cannot be queried numerically — use the OISST layer for numbers.",
      "Its high resolution can imply more certainty than the underlying observations support.",
    ],
  },
  {
    id: "copernicus-currents",
    title: "Surface currents",
    plainSummary:
      "The direction and speed of water movement at the ocean surface.",
    whyItMatters:
      "Currents carry heat, nutrients, larvae and pollution. They are the reason an expedition's position matters: the same latitude on either side of a front can be a different ocean.",
    category: "ocean_physics",
    sourceType: "model",
    status: "credentials_required",
    cadence: "daily",
    sourceOrg: "Copernicus Marine Service",
    productName: "Global Ocean Physics Analysis and Forecast",
    datasetId: "GLOBAL_ANALYSISFORECAST_PHY_001_024",
    variables: [
      { name: "uo", unit: "m/s", description: "Eastward surface velocity" },
      { name: "vo", unit: "m/s", description: "Northward surface velocity" },
    ],
    spatialCoverage: "Global ocean",
    spatialResolution: "1/12° (roughly 8 km)",
    temporalCoverage: "2020 to present, plus forecast",
    latency: "Daily update",
    accessMethod: "Copernicus Marine Data Store subset, cached server-side",
    requiresProxy: true,
    requiredCredentials: [
      "COPERNICUS_MARINE_USERNAME",
      "COPERNICUS_MARINE_PASSWORD",
    ],
    license:
      "Copernicus Marine Service licence — free use with attribution",
    attribution:
      "Generated using E.U. Copernicus Marine Service Information.",
    sourceUrl:
      "https://data.marine.copernicus.eu/product/GLOBAL_ANALYSISFORECAST_PHY_001_024/description",
    caveats: [
      "This is a MODEL, not a measurement. It assimilates observations but the velocity at any given point is computed, not observed.",
      "Animated particles are a way of drawing the model's vectors. The particles are not water and not tracked drifters.",
      "Model skill is lower near coasts, in ice-covered water and in regions with sparse observations to assimilate.",
    ],
  },
  {
    id: "gebco-bathymetry",
    title: "Bathymetry",
    plainSummary: "The shape of the sea floor.",
    whyItMatters:
      "Depth controls where water masses can go, where nutrients well up and where life concentrates. Most ocean features make no sense without it.",
    category: "ocean_physics",
    sourceType: "reference",
    status: "live",
    cadence: "annual",
    sourceOrg: "GEBCO",
    productName: "GEBCO Grid",
    variables: [{ name: "elevation", unit: "m" }],
    spatialCoverage: "Global",
    spatialResolution: "15 arc-second grid",
    temporalCoverage: "Current release",
    accessMethod: "WMS, requested as tiles",
    requiresProxy: false,
    requiredCredentials: [],
    license: "GEBCO grid — free use with attribution",
    attribution:
      "GEBCO Compilation Group. GEBCO Grid.",
    sourceUrl: "https://www.gebco.net/",
    caveats: [
      "NOT FOR NAVIGATION under any circumstances.",
      "Much of the deep ocean has never been directly surveyed; those areas are interpolated from satellite gravity measurements and are approximate.",
    ],
  },

  /* ---------------------------------------------------- OBSERVING SYSTEMS -- */
  {
    id: "argo-floats",
    title: "Argo floats",
    plainSummary:
      "Nearly four thousand robotic floats drifting worldwide, diving to 2 km and back every ten days.",
    whyItMatters:
      "Argo is the only thing that measures the interior of the global ocean continuously. It is also the clearest illustration of where the observing system is blind — floats cannot surface through sea ice.",
    category: "observing_systems",
    sourceType: "in_situ",
    status: "live",
    cadence: "near_real_time",
    sourceOrg: "International Argo Programme / Ifremer",
    productName: "Argo Global Data Assembly Centre (via ERDDAP)",
    variables: [
      { name: "temperature", unit: "°C" },
      { name: "salinity", unit: "PSU" },
      { name: "pressure", unit: "dbar" },
    ],
    spatialCoverage: "Global ocean, sparse at high latitudes",
    spatialResolution: "Point measurements",
    temporalCoverage: "2000 to present",
    latency: "Hours to days for real-time profiles",
    accessMethod: "Ifremer ERDDAP subset, proxied and cached server-side",
    requiresProxy: true,
    requiredCredentials: [],
    license: "Argo data are free and unrestricted",
    attribution:
      "These data were collected and made freely available by the International Argo Program and the national programmes that contribute to it.",
    doi: "10.17882/42182",
    sourceUrl: "https://argo.ucsd.edu/data/",
    caveats: [
      "Real-time profiles carry automated quality control only. Delayed-mode, expert-reviewed data arrive months later and may differ.",
      "Coverage collapses under sea ice and in shallow shelf seas — the absence of floats is not the absence of ocean.",
      "Floats drift freely; a float is not a fixed station and does not repeat a location.",
    ],
  },
  {
    id: "ndbc-buoys",
    title: "Moored buoys",
    plainSummary:
      "Fixed weather and wave buoys reporting conditions right now, mostly in US waters.",
    category: "observing_systems",
    sourceType: "in_situ",
    status: "live",
    cadence: "near_real_time",
    sourceOrg: "NOAA National Data Buoy Center",
    productName: "NDBC latest observations",
    variables: [
      { name: "water temperature", unit: "°C" },
      { name: "significant wave height", unit: "m" },
      { name: "wind speed", unit: "m/s" },
      { name: "air pressure", unit: "hPa" },
    ],
    spatialCoverage:
      "Strongly concentrated in US coastal waters, the Gulf of Mexico and the tropical Pacific",
    spatialResolution: "Point measurements",
    temporalCoverage: "Current observations",
    latency: "Under an hour",
    accessMethod: "Fixed-width text feed, proxied and parsed server-side",
    requiresProxy: true,
    requiredCredentials: [],
    license: "NOAA open data — public domain",
    attribution: "NOAA National Data Buoy Center.",
    sourceUrl: "https://www.ndbc.noaa.gov/",
    caveats: [
      "Coverage is regional, not global. Empty ocean on this layer means no buoy, not calm water.",
      "These are raw real-time reports with minimal quality control. Individual values can be wrong.",
      "Missing values are common; sensors fail and buoys go adrift.",
    ],
  },

  /* ----------------------------------------------------------- BIODIVERSITY -- */
  {
    id: "obis-occurrences",
    title: "Marine species occurrences",
    plainSummary:
      "Individual records of marine life observed or collected, pooled from thousands of datasets worldwide.",
    whyItMatters:
      "It is the largest open record of what lives where in the ocean — and, read carefully, also a map of where humans have bothered to look.",
    category: "biodiversity",
    sourceType: "occurrence",
    status: "live",
    cadence: "daily",
    sourceOrg: "OBIS",
    productName: "Ocean Biodiversity Information System",
    variables: [
      { name: "occurrence records", unit: "count" },
      { name: "taxon", unit: "name" },
    ],
    spatialCoverage: "Global, extremely uneven",
    spatialResolution: "Point records",
    temporalCoverage: "1700s to present, dominated by recent decades",
    latency: "Continuous contribution",
    accessMethod: "OBIS REST API, direct from browser",
    requiresProxy: false,
    requiredCredentials: [],
    license: "Records carry their own licences, mostly CC-BY or CC0",
    attribution:
      "OBIS. Ocean Biodiversity Information System. Intergovernmental Oceanographic Commission of UNESCO.",
    sourceUrl: "https://obis.org/",
    caveats: [
      "This is observation density, NOT biodiversity density. Dense areas may simply be well studied. Never label it as abundance.",
      "Absence of records is not evidence of absence of the species.",
      "Historical records carry variable location precision, sometimes tens of kilometres.",
      "Sampling effort is heavily biased towards coasts, wealthy nations and shipping routes.",
    ],
  },

  /* --------------------------------------------------------------- CLIMATE -- */
  {
    id: "gistemp",
    title: "Global surface temperature",
    plainSummary:
      "How much warmer the planet's surface is than the 1951–1980 average, month by month.",
    category: "climate",
    sourceType: "analysis",
    status: "live",
    cadence: "monthly",
    sourceOrg: "NASA GISS",
    productName: "GISTEMP v4",
    variables: [{ name: "temperature anomaly", unit: "°C" }],
    spatialCoverage: "Global, land and ocean combined",
    temporalCoverage: "1880 to present",
    latency: "Roughly two weeks after month end",
    accessMethod: "CSV, proxied and cached server-side",
    requiresProxy: true,
    requiredCredentials: [],
    license: "NASA open data",
    attribution:
      "GISTEMP Team. GISS Surface Temperature Analysis (GISTEMP), version 4. NASA Goddard Institute for Space Studies.",
    sourceUrl: "https://data.giss.nasa.gov/gistemp/",
    caveats: [
      "This is global CONTEXT, not an ocean measurement. It combines land air temperature with sea surface temperature.",
      "Early decades have sparser coverage and wider uncertainty, particularly in the Southern Hemisphere.",
    ],
  },
  {
    id: "noaa-co2",
    title: "Atmospheric carbon dioxide",
    plainSummary:
      "The concentration of CO₂ in the atmosphere, measured continuously at Mauna Loa since 1958.",
    category: "climate",
    sourceType: "in_situ",
    status: "live",
    cadence: "monthly",
    sourceOrg: "NOAA Global Monitoring Laboratory",
    productName: "Mauna Loa CO₂ record",
    variables: [{ name: "CO₂ mole fraction", unit: "ppm" }],
    spatialCoverage: "Single station, representative of the global background",
    temporalCoverage: "1958 to present",
    latency: "Roughly one month",
    accessMethod: "CSV, proxied and cached server-side",
    requiresProxy: true,
    requiredCredentials: [],
    license: "NOAA open data — public domain",
    attribution:
      "Dr. Xin Lan, NOAA/GML and Dr. Ralph Keeling, Scripps Institution of Oceanography.",
    sourceUrl: "https://gml.noaa.gov/ccgg/trends/",
    caveats: [
      "This is an ATMOSPHERIC measurement shown for context. It is not an ocean variable.",
      "The sawtooth is the Northern Hemisphere growing season, not measurement noise.",
      "The ocean absorbs roughly a quarter of these emissions, which is what drives ocean acidification.",
    ],
  },

  /* ------------------------------------------------------------ CONSERVATION -- */
  {
    id: "wdpa-marine",
    title: "Marine protected areas",
    plainSummary:
      "The world's designated marine protected areas and other effective conservation measures.",
    whyItMatters:
      "Protection on paper and protection in the water are different things. Seeing boundaries next to fishing activity and temperature is how the difference becomes visible.",
    category: "conservation",
    sourceType: "reference",
    status: "connector_ready",
    cadence: "monthly",
    sourceOrg: "UNEP-WCMC and IUCN",
    productName: "World Database on Protected Areas (marine subset), August 2026",
    variables: [
      { name: "protected area boundary", unit: "polygon" },
      { name: "IUCN category", unit: "class" },
      { name: "no-take status", unit: "class" },
    ],
    spatialCoverage: "Global, 17,163 marine polygons in the August 2026 release",
    temporalCoverage: "Designations from the 1800s to present",
    latency: "Monthly release cycle",
    accessMethod: "Supplied shapefile, simplified to vector geometry at build time",
    requiresProxy: false,
    requiredCredentials: [],
    license:
      "WDPA terms of use — free for non-commercial use with attribution. Redistribution of the raw dataset is restricted; only simplified display geometry is served.",
    attribution:
      "UNEP-WCMC and IUCN (2026), Protected Planet: The World Database on Protected Areas (WDPA), August 2026, Cambridge, UK: UNEP-WCMC and IUCN.",
    sourceUrl: "https://www.protectedplanet.net/",
    caveats: [
      "A boundary shows legal designation, not enforcement, funding or ecological outcome.",
      "Protection levels vary enormously — some permit industrial fishing, some prohibit all extraction. The IUCN category and no-take flag matter more than the boundary.",
      "Geometry shown here is heavily simplified for display and must not be used for any legal, navigational or management purpose.",
      "Reported and mapped areas disagree for many sites; the database records both.",
    ],
  },

  /* ---------------------------------------------------------- HUMAN ACTIVITY -- */
  {
    id: "gfw-fishing-effort",
    title: "Apparent fishing effort",
    plainSummary:
      "Where vessels appear to be fishing, inferred from their movement patterns.",
    category: "human_activity",
    sourceType: "derived",
    status: "credentials_required",
    cadence: "daily",
    sourceOrg: "Global Fishing Watch",
    productName: "Apparent fishing effort",
    variables: [{ name: "apparent fishing hours", unit: "hours" }],
    spatialCoverage: "Global, limited to vessels carrying AIS",
    temporalCoverage: "2012 to present",
    accessMethod: "Global Fishing Watch API",
    requiresProxy: true,
    requiredCredentials: ["GLOBAL_FISHING_WATCH_TOKEN"],
    license: "Global Fishing Watch API terms — attribution required",
    attribution: "Global Fishing Watch.",
    sourceUrl: "https://globalfishingwatch.org/our-apis/",
    caveats: [
      "APPARENT fishing effort is inferred from vessel movement by a model. It is not confirmed fishing and it is certainly not confirmed illegal fishing.",
      "Only vessels transmitting AIS are visible. Vessels that switch it off, or are not required to carry it, are absent.",
      "Coverage is biased towards larger industrial vessels; small-scale fishing is largely invisible.",
    ],
  },

  /* ------------------------------------------------------------ OCEAN WARRIOR -- */
  {
    id: "ow-expedition-routes",
    title: "Ocean Warrior expeditions",
    plainSummary:
      "Where Ocean Warrior has sailed, plans to sail, and is considering sailing.",
    category: "ocean_warrior",
    sourceType: "reference",
    status: "live",
    cadence: "static",
    sourceOrg: "Ocean Warrior",
    productName: "Published expedition itineraries",
    variables: [{ name: "route", unit: "line" }],
    spatialCoverage: "Arctic, North Atlantic, and concept regions",
    temporalCoverage: "2023 to 2027",
    accessMethod: "Configuration file in this repository",
    requiresProxy: false,
    requiredCredentials: [],
    license: "Ocean Warrior",
    attribution: "Ocean Warrior / Global Warrior.",
    sourceUrl: "https://www.global-warrior.com/expeditions/ocean-warrior",
    caveats: [
      "No line on this platform is a recorded GPS track. Ocean Warrior has not supplied vessel positions.",
      "Routes between published port calls are drawn by Planetary Pulse to stay in navigable water. They have no navigational meaning.",
      "The 2023 Svalbard expeditions are shown as an operating area rather than a track, because the track is not known.",
    ],
  },
  {
    id: "ow-demo-stations",
    title: "Demonstration stations",
    plainSummary:
      "Synthetic sampling stations showing how real expedition measurements will appear.",
    category: "ocean_warrior",
    sourceType: "demo",
    status: "demo",
    cadence: "static",
    sourceOrg: "Planetary Pulse",
    productName: "Synthetic demonstration dataset",
    variables: [
      { name: "temperature", unit: "°C" },
      { name: "salinity", unit: "PSU" },
    ],
    spatialCoverage: "2027 Svalbard concept route",
    temporalCoverage: "Not applicable",
    accessMethod: "Generated in this repository",
    requiresProxy: false,
    requiredCredentials: [],
    license: "Not applicable — synthetic",
    attribution: "Synthetic data generated by Planetary Pulse.",
    sourceUrl: "https://www.global-warrior.com/expeditions/ocean-warrior",
    caveats: [
      "THIS DATA IS NOT REAL. Every value is generated to demonstrate the interface.",
      "It is physically plausible by construction, which makes it more dangerous, not less. It must never be cited, exported as evidence, or compared with real measurements.",
    ],
  },

  /* ------------------------------------------------------------------ PLANNED -- */
  {
    id: "obis-edna",
    title: "eDNA occurrences",
    plainSummary:
      "Species detected from traces of DNA in seawater rather than by being seen or caught.",
    category: "biodiversity",
    sourceType: "occurrence",
    status: "planned",
    cadence: "daily",
    sourceOrg: "OBIS",
    productName: "DNA-derived occurrence records",
    variables: [{ name: "DNA-derived occurrence", unit: "count" }],
    spatialCoverage: "Global, very sparse",
    temporalCoverage: "Recent years",
    accessMethod: "OBIS API with DNA-derived filter",
    requiresProxy: false,
    requiredCredentials: [],
    license: "Per-record licences",
    attribution: "OBIS.",
    sourceUrl: "https://obis.org/",
    caveats: [
      "eDNA detects genetic material, which may have drifted from elsewhere or persisted after the organism left.",
      "It cannot count individuals or determine their condition.",
      "This is the intended destination for Ocean Warrior's own eDNA sampling.",
    ],
  },
  {
    id: "coral-reef-watch",
    title: "Coral heat stress",
    plainSummary:
      "How much accumulated heat stress corals have experienced, and whether bleaching is likely.",
    category: "climate",
    sourceType: "derived",
    status: "planned",
    cadence: "daily",
    sourceOrg: "NOAA Coral Reef Watch",
    productName: "Degree Heating Weeks",
    variables: [{ name: "degree heating weeks", unit: "°C-weeks" }],
    spatialCoverage: "Global tropics",
    spatialResolution: "5 km",
    temporalCoverage: "1985 to present",
    accessMethod: "NOAA CoastWatch ERDDAP",
    requiresProxy: false,
    requiredCredentials: [],
    license: "NOAA open data",
    attribution: "NOAA Coral Reef Watch.",
    sourceUrl: "https://coralreefwatch.noaa.gov/",
    caveats: [
      "Heat stress predicts bleaching risk; it does not confirm that bleaching occurred.",
      "Corals in different regions have different thermal tolerances.",
    ],
  },
  {
    id: "chlorophyll",
    title: "Chlorophyll-a",
    plainSummary:
      "How much phytoplankton is in the surface ocean — the base of nearly every marine food web.",
    category: "biodiversity",
    sourceType: "satellite",
    status: "connector_ready",
    cadence: "monthly",
    sourceOrg: "NASA Ocean Biology Processing Group",
    productName: "MODIS-Aqua L3 mapped chlorophyll concentration",
    variables: [{ name: "chlor_a", unit: "mg/m³" }],
    spatialCoverage: "Global ocean",
    spatialResolution: "4 km",
    temporalCoverage: "2002 to present",
    accessMethod: "NASA GIBS tiles",
    requiresProxy: false,
    requiredCredentials: [],
    license: "NASA open data",
    attribution: "NASA Ocean Biology Processing Group / GIBS.",
    sourceUrl: "https://oceancolor.gsfc.nasa.gov/",
    caveats: [
      "Optical sensors cannot see through cloud, so gaps are frequent and persistent at high latitudes.",
      "Polar winter has no sunlight, so there is no data at all for months at a time.",
      "Chlorophyll is a proxy for biomass, not a direct count, and is displayed on a logarithmic scale because it spans orders of magnitude.",
      "Coastal values are less reliable where sediment and dissolved organic matter confuse the retrieval.",
    ],
  },
];

export function getLayer(id: string): LayerMetadata | undefined {
  return CATALOG.find((l) => l.id === id);
}

export const CATEGORY_LABELS: Record<string, string> = {
  ocean_physics: "Ocean physics",
  ice: "Ice",
  climate: "Climate",
  biodiversity: "Life",
  observing_systems: "Observing systems",
  human_activity: "Human activity",
  conservation: "Conservation",
  ocean_warrior: "Ocean Warrior",
};

export const STATUS_LABELS: Record<string, string> = {
  live: "Live",
  credentials_required: "Credentials required",
  connector_ready: "Connector ready",
  planned: "Planned",
  demo: "Demo",
};

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  in_situ: "In-situ measurement",
  satellite: "Satellite observation",
  model: "Model output",
  analysis: "Gridded analysis",
  derived: "Derived product",
  occurrence: "Occurrence records",
  reference: "Reference data",
  ocean_warrior_insitu: "Ocean Warrior measurement",
  demo: "Demonstration data",
};
