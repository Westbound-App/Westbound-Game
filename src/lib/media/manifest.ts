/**
 * Scene media manifest — the data layer of the AI photoreal pipeline.
 *
 * Each entry is a photoreal still or video clip staged for a combination of
 * biome, season, and time of day (optionally pinned to a named landmark).
 * The resolver picks the most specific match for the walker's authoritative
 * state; the player presents it as a slow-TV live scene.
 *
 * Media sources are labeled honestly:
 * - stock_placeholder: temporary imagery until character-locked scenes exist
 * - generated_locked: AI-generated from the character bible reference set
 * - renderer_stream: future live renderer output
 */

import type { SceneBiome } from "@/lib/places/types";
import type { SeasonId } from "@/lib/atmosphere/season";
import type { TimeOfDayId } from "@/lib/scene/presets";

export type MediaKind = "image" | "video";

export type MediaSource =
  | "stock_placeholder"
  | "generated_locked"
  | "renderer_stream";

/**
 * What the walker is doing in the scene. Walking shots must never show
 * while he rests (and vice versa); "any" fits both (e.g. pure scenery).
 */
export type SceneContext = "walking" | "resting" | "any";

export type SceneMediaEntry = {
  id: string;
  kind: MediaKind;
  url: string;
  biome: SceneBiome | "any";
  season: SeasonId | "any";
  timeOfDay: TimeOfDayId | "any";
  context: SceneContext;
  /** Pin to a specific landmark id from the places registry */
  landmarkId: string | null;
  source: MediaSource;
  /** Short honest viewer-facing label for non-final media */
  label: string | null;
};

export type SceneMediaQuery = {
  biome: SceneBiome;
  season: SeasonId;
  timeOfDay: TimeOfDayId;
  context: "walking" | "resting";
  landmarkId?: string | null;
};

/**
 * Seed manifest built from the assets already in the repo. Every entry is a
 * placeholder; character-locked generations replace these one corridor at a
 * time (Maine first), keeping the same shape.
 */
export const SCENE_MEDIA: SceneMediaEntry[] = [
  // Maine corridor — character-locked scenes generated from docs/references/
  {
    id: "maine-summer-day",
    kind: "image",
    url: "/media/scenes/packs/maine/summer-day.jpg",
    biome: "new_england_town",
    season: "summer",
    timeOfDay: "any",
    context: "walking",
    landmarkId: null,
    source: "generated_locked",
    label: null,
  },
  {
    id: "maine-fall-day",
    kind: "image",
    url: "/media/scenes/packs/maine/fall-day.jpg",
    biome: "new_england_town",
    season: "fall",
    timeOfDay: "any",
    context: "walking",
    landmarkId: null,
    source: "generated_locked",
    label: null,
  },
  {
    id: "maine-winter-day",
    kind: "image",
    url: "/media/scenes/packs/maine/winter-day.jpg",
    biome: "new_england_town",
    season: "winter",
    timeOfDay: "any",
    context: "walking",
    landmarkId: null,
    source: "generated_locked",
    label: null,
  },
  {
    id: "maine-spring-day",
    kind: "image",
    url: "/media/scenes/packs/maine/spring-day.jpg",
    biome: "new_england_town",
    season: "spring",
    timeOfDay: "any",
    context: "walking",
    landmarkId: null,
    source: "generated_locked",
    label: null,
  },
  {
    id: "city-still",
    kind: "image",
    url: "/media/scenes/nyc-urban.jpg",
    biome: "northeast_city",
    season: "any",
    timeOfDay: "any",
    context: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: "temporary placeholder scene",
  },
  {
    id: "midwest-still",
    kind: "image",
    url: "/media/scenes/midwest-akron.jpg",
    biome: "midwest_industrial",
    season: "any",
    timeOfDay: "any",
    context: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: "temporary placeholder scene",
  },
  {
    id: "plains-still",
    kind: "image",
    url: "/media/scenes/great-plains.jpg",
    biome: "great_plains",
    season: "any",
    timeOfDay: "any",
    context: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: "temporary placeholder scene",
  },
  {
    id: "canyon-still",
    kind: "image",
    url: "/media/scenes/grand-canyon.jpg",
    biome: "southwest_canyon",
    season: "any",
    timeOfDay: "any",
    context: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: "temporary placeholder scene",
  },
  {
    id: "pacific-still",
    kind: "image",
    url: "/media/scenes/pacific-coast.jpg",
    biome: "pacific_coast",
    season: "any",
    timeOfDay: "any",
    context: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: "temporary placeholder scene",
  },
  {
    id: "highway-still",
    kind: "image",
    url: "/media/scenes/generic-highway.jpg",
    biome: "generic_highway",
    season: "any",
    timeOfDay: "any",
    context: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: "temporary placeholder scene",
  },
  // Season-flavored fallbacks usable in any biome
  {
    id: "fall-any",
    kind: "image",
    url: "/media/scenes/seasonal/fall-small-town.jpg",
    biome: "any",
    season: "fall",
    timeOfDay: "any",
    context: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: "temporary placeholder scene",
  },
  {
    id: "winter-any",
    kind: "image",
    url: "/media/scenes/seasonal/winter-holiday.jpg",
    biome: "any",
    season: "winter",
    timeOfDay: "any",
    context: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: "temporary placeholder scene",
  },
  {
    id: "spring-any",
    kind: "image",
    url: "/media/scenes/seasonal/spring-roadside.jpg",
    biome: "any",
    season: "spring",
    timeOfDay: "any",
    context: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: "temporary placeholder scene",
  },
  {
    id: "summer-any",
    kind: "image",
    url: "/media/scenes/seasonal/summer-daytime.jpg",
    biome: "any",
    season: "summer",
    timeOfDay: "any",
    context: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: "temporary placeholder scene",
  },
];

/** Tied top-score entries rotate on this interval so long sessions vary. */
const ROTATION_MS = 5 * 60 * 1000;

/**
 * Pick the most specific entry for the walker's current state.
 *
 * PRIORITY ORDER — character consistency comes first: a character-locked
 * scene in the wrong context (his walking shot shown while resting) beats
 * ANY placeholder with the wrong characters. Context is a soft preference
 * (bonus for matching, penalty for clashing), never a reason to fall back
 * to off-model media. Landmark pinning and biome/season/time matching stay
 * hard filters. Ties rotate deterministically on a time bucket.
 */
export function resolveSceneMedia(
  query: SceneMediaQuery,
  manifest: SceneMediaEntry[] = SCENE_MEDIA,
  nowMs = 0,
): SceneMediaEntry | null {
  let best: SceneMediaEntry[] = [];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const entry of manifest) {
    if (entry.landmarkId && entry.landmarkId !== (query.landmarkId ?? null)) {
      continue;
    }
    if (entry.biome !== "any" && entry.biome !== query.biome) continue;
    if (entry.season !== "any" && entry.season !== query.season) continue;
    if (entry.timeOfDay !== "any" && entry.timeOfDay !== query.timeOfDay) {
      continue;
    }

    let score = 0;
    if (entry.landmarkId) score += 16;
    if (entry.biome !== "any") score += 8;
    // The characters ARE the product — canon media dominates placeholders
    if (entry.source === "generated_locked") score += 12;
    if (entry.context !== "any") {
      score += entry.context === query.context ? 4 : -6;
    }
    if (entry.season !== "any") score += 2;
    if (entry.timeOfDay !== "any") score += 1;
    if (entry.kind === "video") score += 0.5;

    if (score > bestScore) {
      bestScore = score;
      best = [entry];
    } else if (score === bestScore) {
      best.push(entry);
    }
  }

  if (best.length === 0) return null;
  return best[Math.floor(Math.max(0, nowMs) / ROTATION_MS) % best.length];
}
