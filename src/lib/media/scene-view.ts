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
import { mockTodayMiles, mockWeather } from "@/lib/presentation/mock-adapters";

const METERS_PER_MILE = 1609.344;
const MS_PER_DAY = 24 * 3_600_000;

/**
 * The feed reflects the WALKER's local clock, not the viewer's
 * (LIVE_JOURNEY_VISION §7). Falls back to viewer time on bad zones.
 */
function zonedClock(
  now: Date,
  timeZone: string,
): { hour: number; label: string } {
  try {
    const h24 =
      Number(
        new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          hour12: false,
          timeZone,
        }).format(now),
      ) % 24;
    const minute = Number(
      new Intl.DateTimeFormat("en-US", { minute: "numeric", timeZone }).format(
        now,
      ),
    );
    const label = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone,
    }).format(now);
    return { hour: h24 + minute / 60, label };
  } catch {
    return {
      hour: now.getHours() + now.getMinutes() / 60,
      label: new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(now),
    };
  }
}

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
  /** Walker-local clock label, e.g. "7:42 PM" */
  localTimeLabel: string;
  /** Gentle mock weather line, e.g. "68°F · fair skies" */
  weatherLine: string;
  /** Mocked distance-so-far-today (Phase 2: canonical tracking) */
  todayMiles: number;
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
  const timeZone =
    typeof live.game.config?.gameTimezone === "string"
      ? live.game.config.gameTimezone
      : "America/New_York";
  const clock = zonedClock(now, timeZone);

  const biome = overrides.biome ?? place.biome;
  const season = overrides.season ?? atmosphere.season;
  const timeOfDay = overrides.timeOfDay ?? timeOfDayFromHour(clock.hour);

  // He never stops walking by design — night included. Rest scenes appear
  // only for genuine rest states (paid breaks, votes, weather holds).
  const context = RESTING_STATUSES.has(live.walker.status)
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

  const dayOfYear = Math.floor(
    (nowMs - Date.UTC(now.getUTCFullYear(), 0, 0)) / MS_PER_DAY,
  );
  const weather = mockWeather(season, timeOfDay, coord.latitude, dayOfYear);
  const milesPerDay =
    typeof live.game.config?.estimatedMilesPerDay === "number"
      ? live.game.config.estimatedMilesPerDay
      : 35;

  return {
    localTimeLabel: clock.label,
    weatherLine: weather.line,
    todayMiles: mockTodayMiles(milesWalked, clock.hour, milesPerDay),
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
