/**
 * Place packs + landmarks for location-feeling live visuals.
 *
 * Accuracy goal: recognizable character of a place (Akron feels like Akron,
 * Grand Canyon feels like canyon country) — not Google Street View fidelity.
 * Expand this table as the national route grows.
 */

import type { Landmark, RegionPack, SceneBiome } from "@/lib/places/types";

const SCENE = {
  newEngland: "/media/scenes/new-england.jpg",
  nyc: "/media/scenes/nyc-urban.jpg",
  midwest: "/media/scenes/midwest-akron.jpg",
  canyon: "/media/scenes/grand-canyon.jpg",
  plains: "/media/scenes/great-plains.jpg",
  pacific: "/media/scenes/pacific-coast.jpg",
  highway: "/media/scenes/generic-highway.jpg",
  // Existing cinematic still doubles as Portland default
  portland: "/media/walker-hero.jpg",
} as const;

/** Coarse US regions for biome selection. */
export const REGION_PACKS: RegionPack[] = [
  {
    id: "maine-coast",
    name: "Maine coast",
    minLat: 43.0,
    maxLat: 47.5,
    minLon: -71.2,
    maxLon: -66.8,
    biome: "new_england_town",
    stateHint: "Maine",
    sceneImage: SCENE.portland,
    defaultTown: "Maine",
  },
  {
    id: "new-england",
    name: "New England",
    minLat: 40.9,
    maxLat: 47.5,
    minLon: -73.8,
    maxLon: -69.5,
    biome: "new_england_town",
    stateHint: "New England",
    sceneImage: SCENE.newEngland,
    defaultTown: "New England",
  },
  {
    id: "nyc-metro",
    name: "New York metro",
    minLat: 40.4,
    maxLat: 41.1,
    minLon: -74.4,
    maxLon: -73.5,
    biome: "northeast_city",
    stateHint: "New York",
    sceneImage: SCENE.nyc,
    defaultTown: "New York",
  },
  {
    id: "ohio",
    name: "Ohio",
    minLat: 38.4,
    maxLat: 42.0,
    minLon: -84.9,
    maxLon: -80.5,
    biome: "midwest_industrial",
    stateHint: "Ohio",
    sceneImage: SCENE.midwest,
    defaultTown: "Ohio",
  },
  {
    id: "midwest",
    name: "Midwest",
    minLat: 37.0,
    maxLat: 49.0,
    minLon: -97.5,
    maxLon: -80.5,
    biome: "midwest_industrial",
    stateHint: "Midwest",
    sceneImage: SCENE.midwest,
    defaultTown: "Midwest",
  },
  {
    id: "great-plains",
    name: "Great Plains",
    minLat: 35.0,
    maxLat: 49.0,
    minLon: -106.0,
    maxLon: -96.0,
    biome: "great_plains",
    stateHint: "Plains",
    sceneImage: SCENE.plains,
    defaultTown: "Great Plains",
  },
  {
    id: "southwest-canyon",
    name: "Southwest canyon country",
    minLat: 34.5,
    maxLat: 37.5,
    minLon: -114.0,
    maxLon: -109.0,
    biome: "southwest_canyon",
    stateHint: "Arizona",
    sceneImage: SCENE.canyon,
    defaultTown: "Arizona",
  },
  {
    id: "pacific-west",
    name: "Pacific coast",
    minLat: 32.5,
    maxLat: 42.1,
    minLon: -124.5,
    maxLon: -116.5,
    biome: "pacific_coast",
    stateHint: "Pacific",
    sceneImage: SCENE.pacific,
    defaultTown: "Pacific Coast",
  },
];

/**
 * Named landmarks — the "he's in MY town" moments.
 * Radii are generous for sandbox demos; tighten for production.
 */
export const LANDMARKS: Landmark[] = [
  {
    id: "portland-me-old-port",
    name: "Portland Old Port",
    headline: "Portland, Maine",
    blurb: "Brick streets and harbor air — the walk begins.",
    coordinate: { latitude: 43.6591, longitude: -70.2568 },
    radiusMeters: 2500,
    biome: "new_england_town",
    sceneImage: SCENE.portland,
  },
  {
    id: "akron-derby-downs",
    name: "Derby Downs",
    headline: "Near Derby Downs",
    blurb:
      "Akron’s Soap Box Derby hill — hangar and airfield character in the distance.",
    // Derby Downs / Akron Municipal Airport vicinity
    coordinate: { latitude: 41.0375, longitude: -81.468 },
    radiusMeters: 8000,
    biome: "midwest_industrial",
    sceneImage: SCENE.midwest,
  },
  {
    id: "akron-blimp-hangar",
    name: "Goodyear Airdock area",
    headline: "Near the airfield hangars",
    blurb: "Midwest sky and industrial silhouette — blimp-country energy.",
    coordinate: { latitude: 41.029, longitude: -81.47 },
    radiusMeters: 6000,
    biome: "midwest_industrial",
    sceneImage: SCENE.midwest,
  },
  {
    id: "nyc-midtown",
    name: "Midtown Manhattan",
    headline: "Midtown Manhattan",
    blurb: "Canyons of glass and street energy — unmistakably New York.",
    coordinate: { latitude: 40.758, longitude: -73.9855 },
    radiusMeters: 12000,
    biome: "northeast_city",
    sceneImage: SCENE.nyc,
  },
  {
    id: "nyc-brooklyn",
    name: "Brooklyn waterfront",
    headline: "Brooklyn",
    blurb: "Bridges, brownstone rhythm, skyline across the water.",
    coordinate: { latitude: 40.702, longitude: -73.987 },
    radiusMeters: 10000,
    biome: "northeast_city",
    sceneImage: SCENE.nyc,
  },
  {
    id: "grand-canyon-south",
    name: "Grand Canyon South Rim",
    headline: "Grand Canyon",
    blurb: "Red rock shelves and endless sky — the canyon country.",
    coordinate: { latitude: 36.0544, longitude: -112.1401 },
    radiusMeters: 25000,
    biome: "southwest_canyon",
    sceneImage: SCENE.canyon,
  },
  {
    id: "chicago-loop",
    name: "Chicago Loop",
    headline: "Chicago",
    blurb: "Lake wind and steel towers — the Midwest metropolis.",
    coordinate: { latitude: 41.8781, longitude: -87.6298 },
    radiusMeters: 15000,
    biome: "midwest_industrial",
    sceneImage: SCENE.midwest,
  },
  {
    id: "denver-front-range",
    name: "Denver Front Range",
    headline: "Denver",
    blurb: "Plains meeting mountains — thin air and open horizon.",
    coordinate: { latitude: 39.7392, longitude: -104.9903 },
    radiusMeters: 20000,
    biome: "great_plains",
    sceneImage: SCENE.plains,
  },
  {
    id: "la-pacific",
    name: "Los Angeles coast",
    headline: "Los Angeles",
    blurb: "Pacific light and endless asphalt — the western edge.",
    coordinate: { latitude: 34.0522, longitude: -118.2437 },
    radiusMeters: 25000,
    biome: "pacific_coast",
    sceneImage: SCENE.pacific,
  },
];

export const DEFAULT_SCENE: {
  biome: SceneBiome;
  sceneImage: string;
  town: string;
  state: string;
} = {
  biome: "generic_highway",
  sceneImage: SCENE.highway,
  town: "Open road",
  state: "United States",
};

export const SCENE_PATHS = SCENE;
