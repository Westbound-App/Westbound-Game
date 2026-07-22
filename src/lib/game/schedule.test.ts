import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  dayAnchorShiftForStart,
  isWalkingAtSimpleSchedule,
  walkingMillisecondsBetween,
} from "@/lib/game/schedule";

const H = 3_600_000;
const CONFIG = { walkingHoursPerDay: 14, restingHoursPerDay: 10 };

describe("dayAnchorShiftForStart", () => {
  it("computes the shift from the journey's local start clock", () => {
    // Started 10:30 UTC in UTC zone, window opens at 6 → shift = 4.5h
    assert.equal(
      dayAnchorShiftForStart("2026-07-22T10:30:00Z", "UTC", 6),
      4.5 * H,
    );
  });

  it("goes negative when the journey starts before the window opens", () => {
    assert.equal(
      dayAnchorShiftForStart("2026-07-22T04:00:00Z", "UTC", 6),
      -2 * H,
    );
  });
});

describe("locally anchored walking window", () => {
  // Journey starts 10:30 local → shift 4.5h. Schedule hour = elapsed + shift.
  const shift = 4.5 * H;

  it("is walking right at the start (mid-morning)", () => {
    assert.equal(isWalkingAtSimpleSchedule(0, CONFIG, shift), true);
  });

  it("rests once the local evening arrives", () => {
    // Window is 6:00–20:00 local; start was 10:30, so 9.5h later = 20:00
    assert.equal(isWalkingAtSimpleSchedule(9.4 * H, CONFIG, shift), true);
    assert.equal(isWalkingAtSimpleSchedule(9.6 * H, CONFIG, shift), false);
  });

  it("counts only the in-window portion of an overnight span", () => {
    // From start (10:30 local) across 24h: walks 9.5h to 20:00, rests 10h,
    // then walks 4.5h from 6:00 to 10:30 = 14h total walking
    assert.equal(
      walkingMillisecondsBetween(0, 24 * H, CONFIG, shift),
      14 * H,
    );
  });
});
