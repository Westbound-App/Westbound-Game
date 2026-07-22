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
  dayAnchorShiftMs = 0,
): boolean {
  const shifted = gameClockMs + dayAnchorShiftMs;
  const hourOfDay = ((shifted % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY;
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
  dayAnchorShiftMs = 0,
): number {
  if (toMs <= fromMs) return 0;

  const walkingMsPerDay = config.walkingHoursPerDay * MS_PER_HOUR;
  const dayMs = MS_PER_DAY;

  let total = 0;
  let cursor = fromMs + dayAnchorShiftMs;
  const shiftedEnd = toMs + dayAnchorShiftMs;

  while (cursor < shiftedEnd) {
    const offsetInDay = ((cursor % dayMs) + dayMs) % dayMs;
    const dayStart = cursor - offsetInDay;

    if (offsetInDay < walkingMsPerDay) {
      const walkEnd = dayStart + walkingMsPerDay;
      const segmentEnd = Math.min(shiftedEnd, walkEnd);
      total += segmentEnd - cursor;
      cursor = segmentEnd;
    } else {
      cursor = dayStart + dayMs;
    }
  }

  return total;
}

/**
 * Day-cycle shift that opens the walking window at `startLocalHour` in the
 * walker's timezone: milliseconds already elapsed in the walker-local day
 * at journey start, minus the window's start hour. Pass the result as
 * `dayAnchorShiftMs` so "hour 0" of the schedule cycle = local start hour.
 */
export function dayAnchorShiftForStart(
  startedAtIso: string,
  timeZone: string,
  startLocalHour: number,
): number {
  const started = new Date(Date.parse(startedAtIso));
  let hour = started.getHours();
  let minute = started.getMinutes();
  try {
    hour =
      Number(
        new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          hour12: false,
          timeZone,
        }).format(started),
      ) % 24;
    minute = Number(
      new Intl.DateTimeFormat("en-US", { minute: "numeric", timeZone }).format(
        started,
      ),
    );
  } catch {
    // Unknown zone — fall back to server-local clock
  }
  return (
    hour * MS_PER_HOUR + minute * 60_000 - startLocalHour * MS_PER_HOUR
  );
}

/**
 * Where the movement anchor lands when a paid rest ends: never earlier than
 * the previous anchor, never later than now. Keeps rest time from counting
 * as walking time without a catch-up jump afterward.
 */
export function restResumeAnchorMs(
  previousAnchorMs: number,
  nowMs: number,
  paidRestUntilMs: number | null,
): number {
  if (!paidRestUntilMs) return previousAnchorMs;
  return Math.min(nowMs, Math.max(previousAnchorMs, paidRestUntilMs));
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
