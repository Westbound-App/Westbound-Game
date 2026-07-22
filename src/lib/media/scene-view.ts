/**
 * Derive the full presentation view (scene media + overlay values) from the
 * authoritative live payload. Shared by /watch and /stream so the world
 * behaves identically everywhere it is shown.
 */

import { resolveAtmosphere, type SeasonId } from "@/lib/atmosphere/season";
import {
  dayNumber,
  resolveLocationPresentation,
} from "@/lib/game/location-label";
import type { LiveGamePayload } from "@/lib/game/load-live-state";
import {
  resolveSceneMedia,
  SCENE_MEDIA,
  type SceneMediaEntry,
} from "@/lib/media/manifest";
import type { SceneBiome } from "@/lib/places/types";
import { timeOfDayFromHour, type TimeOfDayId } from "@/lib/scene/presets";

const METERS_PER_MILE = 1609.344;

/**
 * Statuses where the pair is not actively traveling — these show resting /
 * moment scenes, never mid-stride walking shots.
 */
const RESTING_STATUSES = new Set([
  "not_started",
  "preparing",
  "resting",
  "weather_rest",
  "scenic_stop",
  "decision_window_open",
  "paused_by_admin",
  "temporarily_blocked",
  "completed",
]);

/** Grade applied when a time-generic asset is shown after dark. */
export type SceneGrade = "none" | "dusk" | "night";

export type SceneView = {
  media: SceneMediaEntry | null;
  fallbackImage: SceneMediaEntry | null;
  grade: SceneGrade;
  timeOfDay: TimeOfDayId;
  locationLine: string;
  moodLine: string;
  status: string;
  day: number;
  milesWalked: number;
  milesRemaining: number;
  progress: number;
  dogName: string;
  walkerName: string;
};

export function statusLabel(status: string): string {
  switch (status) {
    case "walking":
      return "Walking west";
    case "approaching_decision":
      return "Coming up on a choice";
    case "decision_window_open":
      return "The crowd is deciding";
    case "resting":
      return "Resting";
    case "weather_rest":
      return "Waiting out the weather";
    case "scenic_stop":
      return "Taking in the view";
    case "completed":
      return "Journey complete";
    default:
      return status.replaceAll("_", " ");
  }
}

export type SceneViewOverrides = {
  timeOfDay?: TimeOfDayId | null;
  biome?: SceneBiome | null;
  season?: SeasonId | null;
};

export function deriveSceneView(
  live: LiveGamePayload,
  now: Date,
  overrides: SceneViewOverrides = {},
): SceneView {
  const coord = {
    latitude: live.walker.latitude,
    longitude: live.walker.longitude,
  };
  const place = resolveLocationPresentation(coord);
  const atmosphere = resolveAtmosphere(coord.latitude, now);
  const hour = now.getHours() + now.getMinutes() / 60;

  const biome = overrides.biome ?? place.biome;
  const season = overrides.season ?? atmosphere.season;
  const timeOfDay = overrides.timeOfDay ?? timeOfDayFromHour(hour);

  // After dark the pair is resting on screen no matter how fast the sandbox
  // engine walks — the world must never show night-walking.
  const context =
    timeOfDay === "night" || RESTING_STATUSES.has(live.walker.status)
      ? ("resting" as const)
      : ("walking" as const);

  const query = {
    biome,
    season,
    timeOfDay,
    context,
    landmarkId: place.landmark?.id ?? null,
  };
  const nowMs = now.getTime();
  const media = resolveSceneMedia(query, SCENE_MEDIA, nowMs);
  const fallbackImage = resolveSceneMedia(
    query,
    SCENE_MEDIA.filter((e) => e.kind === "image"),
    nowMs,
  );

  const grade: SceneGrade =
    media && media.timeOfDay === "any" && timeOfDay === "night"
      ? "night"
      : media && media.timeOfDay === "any" && timeOfDay === "dusk"
        ? "dusk"
        : "none";

  const milesWalked = live.walker.totalDistanceWalkedMeters / METERS_PER_MILE;
  const milesRemaining = Math.max(
    0,
    live.walker.projectedRemainingMeters / METERS_PER_MILE,
  );

  return {
    media,
    fallbackImage,
    grade,
    timeOfDay,
    locationLine: place.locationLine,
    moodLine: atmosphere.moodLine,
    status: statusLabel(live.walker.status),
    day: dayNumber(live.game.startedAt, nowMs),
    milesWalked,
    milesRemaining,
    progress:
      live.walker.totalDistanceWalkedMeters /
      Math.max(
        1,
        live.walker.totalDistanceWalkedMeters +
          live.walker.projectedRemainingMeters,
      ),
    dogName: live.game.companionDog?.name ?? "Beacon",
    walkerName: live.game.walkerName,
  };
}
