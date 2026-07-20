import type { GameConfig } from "@/lib/config/game-config";

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Simple 8h walk / 16h rest schedule used by the prototype.
 * Time is measured in "game clock" milliseconds (already speed-adjusted if desired).
 *
 * Cycle: [0, walkingHours) walking, [walkingHours, 24h) resting, repeating.
 */
export function isWalkingAtSimpleSchedule(
  gameClockMs: number,
  config: Pick<GameConfig, "walkingHoursPerDay">,
): boolean {
  const hourOfDay = ((gameClockMs % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY;
  const walkingWindowMs = config.walkingHoursPerDay * MS_PER_HOUR;
  return hourOfDay < walkingWindowMs;
}

/**
 * Pure walking milliseconds between two absolute timestamps under the simple schedule.
 * Does not apply sandbox speed multiplier — caller converts wall time → game time first.
 */
export function walkingMillisecondsBetween(
  fromMs: number,
  toMs: number,
  config: Pick<GameConfig, "walkingHoursPerDay" | "restingHoursPerDay">,
): number {
  if (toMs <= fromMs) return 0;

  const walkingMsPerDay = config.walkingHoursPerDay * MS_PER_HOUR;
  const dayMs = MS_PER_DAY;

  let total = 0;
  let cursor = fromMs;

  while (cursor < toMs) {
    const offsetInDay = ((cursor % dayMs) + dayMs) % dayMs;
    const dayStart = cursor - offsetInDay;

    if (offsetInDay < walkingMsPerDay) {
      const walkEnd = dayStart + walkingMsPerDay;
      const segmentEnd = Math.min(toMs, walkEnd);
      total += segmentEnd - cursor;
      cursor = segmentEnd;
    } else {
      cursor = dayStart + dayMs;
    }
  }

  return total;
}

/**
 * Convert wall-clock elapsed ms to game-clock ms when sandbox acceleration applies.
 * Production multiplier should be 1.
 */
export function wallToGameMs(
  wallElapsedMs: number,
  speedMultiplier: number,
): number {
  return wallElapsedMs * Math.max(1, speedMultiplier);
}
