/**
 * Phase 1 mock adapters (LIVE_JOURNEY_VISION §15): presentation-quality
 * stand-ins isolated here so Phase 2 can swap in real integrations without
 * touching components.
 *
 * - mockWeather → replaced by a real weather provider keyed to the
 *   walker's canonical coordinates
 * - mockTodayMiles → replaced by canonical per-day distance tracking in
 *   the persistent backend
 */

import type { SeasonId } from "@/lib/atmosphere/season";
import type { TimeOfDayId } from "@/lib/scene/presets";

const SEASON_BASE_F: Record<SeasonId, number> = {
  summer: 74,
  fall: 54,
  winter: 28,
  spring: 58,
};

const TOD_SHIFT_F: Record<TimeOfDayId, number> = {
  day: 0,
  golden_hour: -3,
  dusk: -6,
  night: -10,
};

const SKIES = [
  "fair skies",
  "a few slow clouds",
  "soft light",
  "a light breeze",
  "high thin clouds",
];

const WINTER_SKIES = [
  "cold and clear",
  "quiet snow clouds",
  "crisp air",
  "pale winter light",
];

/**
 * Gentle, deterministic weather line. Never frightening, never random
 * between renders — it drifts day to day and cools at night.
 */
export function mockWeather(
  season: SeasonId,
  timeOfDay: TimeOfDayId,
  latitude: number,
  dayOfYear: number,
): { tempF: number; line: string } {
  const wobble = Math.round(Math.sin(dayOfYear * 1.7) * 4);
  const latShift = Math.round((44 - latitude) * 0.8); // warmer as he goes south
  const tempF =
    SEASON_BASE_F[season] + TOD_SHIFT_F[timeOfDay] + latShift + wobble;
  const pool = season === "winter" ? WINTER_SKIES : SKIES;
  const sky = pool[((dayOfYear % pool.length) + pool.length) % pool.length];
  return { tempF, line: `${tempF}°F · ${sky}` };
}

/**
 * Plausible distance-so-far-today given the walker's local hour and the
 * daily schedule (walking roughly 6am–8pm). Monotonic through the day,
 * capped by the daily target and the journey total.
 */
export function mockTodayMiles(
  totalMiles: number,
  walkerLocalHour: number,
  milesPerDay: number,
): number {
  const fraction = Math.min(1, Math.max(0, (walkerLocalHour - 6) / 14));
  return Math.min(Math.max(0, totalMiles), milesPerDay * fraction);
}
