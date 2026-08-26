import type { Expedition } from "@/lib/types";

/**
 * Ocean Warrior expedition definitions.
 *
 * ---------------------------------------------------------------------------
 * PROVENANCE RULE FOR THIS FILE — read before editing.
 *
 * No line in this file is a GPS track. Ocean Warrior has not supplied recorded
 * vessel positions, so none are drawn. What is drawn is one of:
 *
 *   published_itinerary — a smooth line between port calls that Ocean Warrior
 *                         has publicly named. The ports are real; the path
 *                         between them is drawn by us.
 *   region_only         — an area, because the real track is unknown.
 *   concept             — a future idea, drawn to demonstrate the interface.
 *
 * Waypoints are typed. `port` waypoints are places Ocean Warrior published and
 * are shown as labelled markers. `routing` waypoints are cartographic only:
 * they exist so the illustrative line stays in water instead of cutting across
 * Norway or Greenland. They are never labelled, never claimed as port calls,
 * and carry no scientific meaning whatsoever.
 * ---------------------------------------------------------------------------
 */

export type WaypointKind = "port" | "routing";

export interface RouteWaypoint {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  kind: WaypointKind;
}

export interface ExpeditionLeg {
  id: string;
  name: string;
  description: string;
  /** Distinct colour so each leg is separately identifiable on the map. */
  accent: string;
  waypoints: RouteWaypoint[];
}

export interface ExpeditionRecord extends Omit<Expedition, "waypoints"> {
  legs: ExpeditionLeg[];
  /** Colour used for this expedition's route on the map. */
  accent: string;
  /** Dash pattern signalling fidelity: solid = published, dashed = concept. */
  dashed: boolean;
}

const port = (
  name: string,
  lat: number,
  lon: number,
  country?: string,
): RouteWaypoint => ({ name, lat, lon, country, kind: "port" });

const via = (lat: number, lon: number): RouteWaypoint => ({
  name: "",
  lat,
  lon,
  kind: "routing",
});

/* ===========================================================================
   1. Arctic / North Atlantic — published itinerary concept
   ===========================================================================
   Port calls confirmed from Ocean Warrior's published expedition map
   (global-warrior.com/expeditions/ocean-warrior) and its published description
   of the Resolute Expeditions as eight legs. Each leg is coloured separately
   because participants join individual legs, not the whole circuit.
   =========================================================================== */

const arcticNorthAtlantic: ExpeditionRecord = {
  slug: "arctic-north-atlantic",
  name: "The Resolute Expeditions",
  status: "active",
  fidelity: "published_itinerary",
  fidelityLabel: "Published itinerary — illustrative route, not a GPS track",
  startDate: "2025-06-01",
  endDate: null,
  vessel: null,
  region: "Svalbard, North Atlantic, Greenland, Canadian Arctic",
  accent: "#00b7e8",
  dashed: false,

  question:
    "Is Atlantic water reaching further north each year — and what does it carry with it?",
  questionDetail:
    "Warm, salty Atlantic water flows north through the Fram Strait and along " +
    "the west coast of Svalbard. As it strengthens, it delivers heat beneath " +
    "the sea ice from below, a process satellites cannot see because it happens " +
    "under the surface. A vessel crossing this gateway repeatedly, in the same " +
    "places, in successive years, can measure the temperature and salinity of " +
    "that inflow directly. That is the point of repeating the same circuit " +
    "annually for a decade rather than sailing it once.",

  whatWeAlreadyKnow: [
    {
      layerId: "nsidc-extent-arctic",
      note: "Arctic sea-ice extent has declined in every month of the year since satellite records began in 1979.",
    },
    {
      layerId: "oisst-anomaly",
      note: "Surface temperature anomalies in the Barents and Norwegian Seas are among the largest anywhere in the ocean.",
    },
    {
      layerId: "argo-floats",
      note: "Argo float coverage thins sharply north of roughly 80°N, where seasonal ice prevents floats from surfacing.",
    },
  ],

  whatWeWillMeasure: [
    "CTD profiles (temperature, salinity, depth) on a repeated transect",
    "Surface temperature and salinity underway along the full circuit",
    "Water samples for nutrient and carbonate chemistry",
    "eDNA samples at fixed stations for biodiversity baselines",
    "Visual marine mammal and seabird observations on standardised watches",
  ],

  scientificPartners: [],

  /*
   * Eight legs, following the publicly described sequence: Svalbard to
   * Plymouth, then Iceland, South Greenland, Resolute Bay via Baffin Island,
   * back to Nuuk, on to West Greenland, Narsarsuaq, Reykjavík, and finally
   * Plymouth via the Faroes.
   *
   * Each leg carries its own colour so the circuit can be read as a sequence
   * of separately identifiable voyages rather than one undifferentiated line —
   * participants join individual legs, not the whole circuit.
   */
  legs: [
    {
      id: "LEG-01",
      name: "Svalbard → Plymouth",
      description: "South from the high Arctic along the Norwegian Sea and into the North Sea.",
      accent: "#7de3ff",
      waypoints: [
        port("Longyearbyen", 78.2232, 15.6469, "Svalbard, Norway"),
        via(75.5, 14.5), via(71.5, 13.0), via(66.0, 7.5), via(61.5, 3.0),
        via(57.5, 2.0), via(53.5, 2.5), via(51.4, 1.45), via(50.4, -1.6),
        port("Plymouth", 50.3714, -4.1422, "United Kingdom"),
      ],
    },
    {
      id: "LEG-02",
      name: "Plymouth → Reykjavík",
      description: "Across the North Atlantic to Iceland.",
      accent: "#4fd8ff",
      waypoints: [
        port("Plymouth", 50.3714, -4.1422, "United Kingdom"),
        via(51.5, -11.0), via(57.0, -17.0), via(62.0, -20.5),
        port("Reykjavík", 64.1466, -21.9426, "Iceland"),
      ],
    },
    {
      id: "LEG-03",
      name: "Reykjavík → Narsarsuaq",
      description: "West across the Irminger Sea to southern Greenland.",
      accent: "#3fc8f0",
      waypoints: [
        port("Reykjavík", 64.1466, -21.9426, "Iceland"),
        via(63.0, -28.0), via(61.8, -38.0),
        port("Narsarsuaq", 61.1605, -45.426, "Greenland"),
      ],
    },
    {
      id: "LEG-04",
      name: "Narsarsuaq → Resolute Bay",
      description:
        "North through Davis Strait and Baffin Bay, then west into the Canadian Arctic Archipelago.",
      accent: "#35b8e0",
      waypoints: [
        port("Narsarsuaq", 61.1605, -45.426, "Greenland"),
        via(59.8, -48.5), via(62.0, -52.0), via(66.0, -57.0),
        port("Baffin Island", 68.7, -66.5, "Nunavut, Canada"),
        via(72.0, -70.0), via(74.6, -76.0), via(74.4, -84.0), via(74.5, -90.0),
        port("Resolute Bay", 74.6973, -94.8297, "Nunavut, Canada"),
      ],
    },
    {
      id: "LEG-05",
      name: "Resolute Bay → Nuuk",
      description: "East out of the archipelago and south down the Greenland coast.",
      accent: "#2ba8d0",
      waypoints: [
        port("Resolute Bay", 74.6973, -94.8297, "Nunavut, Canada"),
        via(74.4, -86.0), via(74.6, -74.0), via(70.0, -60.0), via(66.0, -55.0),
        port("Nuuk", 64.1836, -51.7214, "Greenland"),
      ],
    },
    {
      id: "LEG-06",
      name: "Nuuk → Upernavik",
      description: "North along the west Greenland coast.",
      accent: "#2298c0",
      waypoints: [
        port("Nuuk", 64.1836, -51.7214, "Greenland"),
        via(67.0, -54.5), via(70.5, -55.8),
        port("Upernavik", 72.7868, -56.1549, "Greenland"),
      ],
    },
    {
      id: "LEG-07",
      name: "Upernavik → Narsarsuaq",
      description: "South again the length of the Greenland coast.",
      accent: "#1f88ae",
      waypoints: [
        port("Upernavik", 72.7868, -56.1549, "Greenland"),
        via(69.0, -55.0), via(65.0, -53.0), via(62.0, -50.0),
        port("Narsarsuaq", 61.1605, -45.426, "Greenland"),
      ],
    },
    {
      id: "LEG-08",
      name: "Narsarsuaq → Plymouth via the Faroes",
      description:
        "The closing leg: back to Iceland, then southeast past the Faroe Islands to Plymouth.",
      accent: "#1a7898",
      waypoints: [
        port("Narsarsuaq", 61.1605, -45.426, "Greenland"),
        via(61.8, -38.0), via(63.0, -28.0),
        port("Reykjavík", 64.1466, -21.9426, "Iceland"),
        via(63.5, -14.0),
        port("Tórshavn, Faroe Islands", 62.0079, -6.7719, "Faroe Islands"),
        via(59.0, -5.0), via(55.0, -6.5), via(51.0, -6.0),
        port("Plymouth", 50.3714, -4.1422, "United Kingdom"),
      ],
    },
  ],

  stations: [],

  sourceNote:
    "Ocean Warrior publicly describes the Resolute Expeditions as eight legs of " +
    "nine to thirty-one days, covering roughly 10,000 nautical miles per circuit, " +
    "with three vessels sailing about 20,000 nautical miles in total, beginning " +
    "in June 2025 and repeating annually for ten years. The port sequence used " +
    "here follows that published description and the expedition map on the " +
    "Ocean Warrior website. The line between ports is drawn by Planetary Pulse " +
    "to keep an illustrative path in navigable water; it is not a recorded " +
    "vessel track, not a planned course, and carries no navigational meaning. " +
    "Exact leg dates and vessel assignments are not published.",
};

/* ===========================================================================
   2. Svalbard 2023 foundation expeditions — region only
   ===========================================================================
   Two 10-day expeditions ran in September 2023. No track has been supplied,
   so no line is drawn. An area is shown instead. This is deliberate: an
   invented line here would be the single most misleading thing the platform
   could display, because unlike the concept routes it would look like history.
   =========================================================================== */

const svalbard2023: ExpeditionRecord = {
  slug: "svalbard-2023",
  name: "Svalbard Foundation Expeditions",
  status: "completed",
  fidelity: "region_only",
  fidelityLabel: "Operating area — exact track not supplied",
  startDate: "2023-09-01",
  endDate: "2023-09-30",
  vessel: null,
  region: "Svalbard archipelago",
  accent: "#f4faff",
  dashed: false,

  question:
    "Can a sailing vessel with a mixed crew of scientists and trained citizens collect research-grade ocean data in the high Arctic?",
  questionDetail:
    "Two ten-day expeditions in September 2023 tested the Ocean Warrior concept " +
    "itself: the vessel, the instruments, the sampling protocols, and whether " +
    "participants without professional research backgrounds could be trained to " +
    "collect measurements that scientists would actually use. The output was a " +
    "working method, not a dataset.",

  whatWeAlreadyKnow: [
    {
      layerId: "gibs-sea-ice-conc",
      note: "September is the month of the annual Arctic sea-ice minimum, when the ice edge sits furthest north of Svalbard.",
    },
    {
      layerId: "oisst-anomaly",
      note: "The waters west of Svalbard are among the fastest-warming in the Arctic.",
    },
  ],

  whatWeWillMeasure: [
    "Concept, equipment and protocol trials — completed 2023",
  ],

  scientificPartners: [],
  legs: [],

  /** Rough operating area around the archipelago. An area, not a route. */
  regionPolygon: [
    [76.3, 9.0],
    [76.3, 22.0],
    [78.0, 26.0],
    [79.5, 28.0],
    [80.3, 22.0],
    [80.3, 12.0],
    [79.2, 8.5],
    [77.5, 7.5],
    [76.3, 9.0],
  ],

  stations: [],

  sourceNote:
    "Ocean Warrior has publicly described two ten-day foundation expeditions in " +
    "Svalbard in September 2023. No GPS track, station list or measurement " +
    "archive has been supplied to Planetary Pulse, so none is shown. The shaded " +
    "area indicates the archipelago the expeditions worked around and nothing " +
    "more precise than that.",
};

/* ===========================================================================
   3. 2027 Svalbard prototype — concept, demonstration route
   =========================================================================== */

const svalbard2027: ExpeditionRecord = {
  slug: "svalbard-2027",
  name: "Svalbard & Fram Strait 2027",
  status: "concept",
  fidelity: "concept",
  fidelityLabel: "Prototype route for interface demonstration — final route to be confirmed",
  startDate: "2027-07-01",
  endDate: "2027-08-15",
  vessel: null,
  region: "Svalbard, Fram Strait, Nordaustlandet",
  accent: "#4fd8ff",
  dashed: true,

  question: "Where exactly is the Arctic's Atlantic gateway, and how fast is it moving north?",
  questionDetail:
    "The Fram Strait, between Svalbard and Greenland, is the main deep-water " +
    "connection between the Arctic and the rest of the world ocean. A transect " +
    "across it — a line of stations where the vessel stops and lowers " +
    "instruments through the water column — measures the inflow directly. " +
    "Repeat the same transect in successive years and the change becomes " +
    "measurable rather than inferred.",

  whatWeAlreadyKnow: [
    {
      layerId: "gibs-sea-ice-conc",
      note: "The ice edge north of Svalbard in summer has retreated substantially since 1979.",
    },
    {
      layerId: "copernicus-currents",
      note: "Model analyses show the West Spitsbergen Current carrying Atlantic water north along Svalbard's west coast.",
    },
    {
      layerId: "obis-occurrences",
      note: "Occurrence records show sub-Arctic species recorded progressively further north, though observation effort is uneven.",
    },
  ],

  whatWeWillMeasure: [
    "A repeated west–east CTD transect across the Fram Strait",
    "Temperature and salinity to 1000 m at fixed stations",
    "Surface underway temperature, salinity and fluorescence",
    "eDNA water samples at every station",
    "Marine mammal and seabird observations on standardised watches",
  ],

  scientificPartners: [],

  legs: [
    {
      id: "LEG-01",
      name: "Fram Strait transect and Nordaustlandet loop",
      accent: "#4fd8ff",
      description:
        "A demonstration route: west from Longyearbyen across the Fram Strait " +
        "towards the Greenland ice edge, north along the marginal ice zone, then " +
        "east around northern Svalbard and back down the east coast.",
      waypoints: [
        port("Longyearbyen", 78.2232, 15.6469, "Svalbard, Norway"),
        port("Fram Strait West", 78.8, 5.0),
        port("Marginal Ice Zone", 79.8, 2.0),
        port("Northern Approach", 81.0, 8.0),
        port("Nordaustlandet North", 80.5, 20.0),
        port("Hinlopen Strait", 79.3, 19.5),
        port("Storfjorden", 77.6, 19.0),
        via(77.2, 16.5),
        port("Longyearbyen", 78.2232, 15.6469, "Svalbard, Norway"),
      ],
    },
  ],

  stations: [],

  sourceNote:
    "This route was designed by Planetary Pulse to demonstrate how an expedition " +
    "transect appears against global datasets. It is not an Ocean Warrior plan " +
    "and has not been reviewed by Ocean Warrior. The stations shown on it carry " +
    "synthetic demonstration data, clearly badged as such.",
};

/* ===========================================================================
   4. Gulf of California — future concept
   =========================================================================== */

const gulfOfCalifornia: ExpeditionRecord = {
  slug: "gulf-of-california",
  name: "Gulf of California",
  status: "concept",
  fidelity: "concept",
  fidelityLabel: "Concept only — not a planned Ocean Warrior expedition",
  startDate: null,
  endDate: null,
  vessel: null,
  region: "Baja California Sur, Gulf of California, Mexico",
  accent: "#ffb547",
  dashed: true,

  question: "Can a protected sea recover fast enough to outrun the heat?",
  questionDetail:
    "The Gulf of California holds one of the clearest conservation successes " +
    "anywhere in the ocean — Cabo Pulmo, where a community-enforced no-take " +
    "reserve saw fish biomass recover several-fold. It is also warming, and " +
    "experiencing marine heatwaves that no local protection can prevent. The " +
    "two facts sit in the same water, which makes it an unusually honest place " +
    "to ask what protection can and cannot do.",

  whatWeAlreadyKnow: [
    {
      layerId: "oisst-anomaly",
      note: "The Gulf of California experiences pronounced warm anomalies during marine heatwave events.",
    },
    {
      layerId: "wdpa-marine",
      note: "The Gulf contains a dense cluster of marine protected areas, including no-take zones.",
    },
    {
      layerId: "obis-occurrences",
      note: "The Gulf is one of the better-sampled tropical seas in the occurrence record.",
    },
  ],

  whatWeWillMeasure: [
    "Temperature profiles inside and outside protected areas",
    "eDNA transects across protection boundaries",
    "Reef fish and megafauna observations",
  ],

  scientificPartners: [],

  legs: [
    {
      id: "LEG-01",
      name: "La Paz – Gulf islands – Cabo Pulmo",
      accent: "#ffb547",
      description:
        "A short demonstration transect crossing protected and unprotected water.",
      waypoints: [
        port("La Paz", 24.1426, -110.3128, "Mexico"),
        port("Isla Espíritu Santo", 24.4833, -110.3333, "Mexico"),
        via(24.9, -110.6),
        port("Isla San José", 25.0, -110.65, "Mexico"),
        via(24.2, -109.9),
        port("Cabo Pulmo", 23.4429, -109.4283, "Mexico"),
      ],
    },
  ],

  stations: [],

  sourceNote:
    "A concept route created by Planetary Pulse to demonstrate the platform " +
    "outside the Arctic. Ocean Warrior has not announced an expedition here.",
};

/* ===========================================================================
   5. Southern Ocean — future concept
   =========================================================================== */

const southernOcean: ExpeditionRecord = {
  slug: "southern-ocean",
  name: "Scotia Sea & Antarctic Peninsula",
  status: "concept",
  fidelity: "concept",
  fidelityLabel: "Concept only — not a planned Ocean Warrior expedition",
  startDate: null,
  endDate: null,
  vessel: null,
  region: "South Georgia, Scotia Sea, Antarctic Peninsula",
  accent: "#ffb547",
  dashed: true,

  question: "What happens to the Southern Ocean food web when the krill are fished where the ice used to be?",
  questionDetail:
    "Antarctic krill sit at the centre of the Southern Ocean food web, and the " +
    "krill fishery concentrates in exactly the areas around the Antarctic " +
    "Peninsula where sea ice has declined most. Whether those two pressures " +
    "compound each other is a question with very little in-water data behind it, " +
    "because the region is expensive and dangerous to sample.",

  whatWeAlreadyKnow: [
    {
      layerId: "nsidc-extent-antarctic",
      note: "Antarctic sea-ice extent has shown record lows in recent years, a reversal of its earlier behaviour.",
    },
    {
      layerId: "gfw-fishing-effort",
      note: "Apparent fishing effort data show krill fishing concentrated near the Antarctic Peninsula.",
    },
    {
      layerId: "obis-occurrences",
      note: "Krill occurrence records are sparse and strongly shaped by where research vessels have been able to go.",
    },
  ],

  whatWeWillMeasure: [
    "Krill density observations along a repeated transect",
    "CTD profiles at the ice edge",
    "eDNA sampling for food-web composition",
    "Seabird and marine mammal observations",
  ],

  scientificPartners: [],

  legs: [
    {
      id: "LEG-01",
      name: "South Georgia – Scotia Sea – Antarctic Peninsula",
      accent: "#ffb547",
      description: "A concept transect across the Scotia Sea.",
      waypoints: [
        port("Grytviken, South Georgia", -54.2814, -36.5089),
        via(-56.5, -40.0),
        via(-59.0, -45.0),
        port("South Orkney Islands", -60.6, -45.6),
        via(-61.5, -52.0),
        port("Elephant Island", -61.1, -55.1),
        via(-62.5, -57.5),
        port("Antarctic Sound", -63.4, -56.7),
        port("Gerlache Strait", -64.6, -62.5),
      ],
    },
  ],

  stations: [],

  sourceNote:
    "A concept route created by Planetary Pulse to demonstrate Southern Ocean " +
    "storytelling. Ocean Warrior has not announced an expedition here.",
};

export const EXPEDITIONS: ExpeditionRecord[] = [
  arcticNorthAtlantic,
  svalbard2027,
  svalbard2023,
  gulfOfCalifornia,
  southernOcean,
];

export function getExpedition(slug: string): ExpeditionRecord | undefined {
  return EXPEDITIONS.find((e) => e.slug === slug);
}
