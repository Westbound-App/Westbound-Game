import type { Coordinate } from "@/lib/types/domain";

/**
 * Visual place packs: not photogrammetry of every building —
 * recognizable character of a region so viewers feel "he's here."
 */
export type SceneBiome =
  | "new_england_town"
  | "northeast_city"
  | "midwest_industrial"
  | "great_plains"
  | "southwest_canyon"
  | "pacific_coast"
  | "generic_highway";

export type Landmark = {
  id: string;
  name: string;
  /** Short line for livestream overlay, e.g. "Near Derby Downs" */
  headline: string;
  /** Why locals care */
  blurb: string;
  coordinate: Coordinate;
  /** Meters — when walker is inside, landmark wins over generic region */
  radiusMeters: number;
  biome: SceneBiome;
  /** Optional still/video under /public/media/scenes/ */
  sceneImage?: string;
  sceneVideo?: string;
};

export type RegionPack = {
  id: string;
  name: string;
  /** Rough bounding box */
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  biome: SceneBiome;
  stateHint?: string;
  sceneImage: string;
  sceneVideo?: string;
  /** Fallback town label inside this box */
  defaultTown: string;
};

export type ResolvedPlace = {
  town: string;
  state: string;
  short: string;
  biome: SceneBiome;
  /** Primary visual */
  sceneImage: string;
  sceneVideo: string | null;
  /** Nearby landmark if any */
  landmark: Landmark | null;
  /** For UI: "Near Derby Downs · Akron, Ohio" */
  locationLine: string;
  /** Why this scene was chosen */
  matchReason: "landmark" | "region" | "default";
};
