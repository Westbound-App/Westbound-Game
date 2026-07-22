/**
 * Canonical per-day distance tracking (vision §3/§15 Phase 2 — real
 * "today's distance" instead of a presentation mock).
 *
 * A "day" is a schedule day: the same cycle the walking window uses,
 * anchored to the walker's local clock via dayAnchorShiftMs. Day 1 is the
 * day the journey started.
 */

const MS_PER_DAY = 24 * 3_600_000;

export type DailyLog = {
  /** Schedule-day index the meters below belong to (0-based) */
  dayIndex: number;
  metersToday: number;
  /** Completed days, most recent first; days without movement are omitted */
  history: Array<{ dayIndex: number; meters: number }>;
};

export function emptyDailyLog(): DailyLog {
  return { dayIndex: 0, metersToday: 0, history: [] };
}

/** Schedule-day index for a game-clock timestamp. */
export function dayIndexFor(gameClockMs: number, dayAnchorShiftMs = 0): number {
  return Math.floor(
    Math.max(0, gameClockMs + dayAnchorShiftMs) / MS_PER_DAY,
  );
}

export type DailyAdvance = {
  daily: DailyLog;
  /** True when a new day began AND yesterday had real distance to report */
  rolledOver: boolean;
  yesterdayMeters: number;
};

/**
 * Fold a tick's movement into the log. A tick spanning midnight attributes
 * its meters to the new day (ticks are seconds apart; the error is noise).
 * Adopting a later day with nothing recorded yet (fresh state, migration,
 * long downtime) rolls silently.
 */
export function advanceDailyLog(
  daily: DailyLog,
  currentDayIndex: number,
  metersAdvanced: number,
): DailyAdvance {
  if (currentDayIndex === daily.dayIndex) {
    return {
      daily: { ...daily, metersToday: daily.metersToday + metersAdvanced },
      rolledOver: false,
      yesterdayMeters: 0,
    };
  }

  if (currentDayIndex < daily.dayIndex) {
    // Clock went backwards (admin correction) — keep counting, never crash
    return {
      daily: { ...daily, metersToday: daily.metersToday + metersAdvanced },
      rolledOver: false,
      yesterdayMeters: 0,
    };
  }

  const closingMeters = daily.metersToday;
  const history =
    closingMeters > 0
      ? [
          { dayIndex: daily.dayIndex, meters: closingMeters },
          ...daily.history,
        ].slice(0, 60)
      : daily.history;

  return {
    daily: {
      dayIndex: currentDayIndex,
      metersToday: metersAdvanced,
      history,
    },
    rolledOver: closingMeters > 0,
    yesterdayMeters: closingMeters,
  };
}
