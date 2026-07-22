import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  advanceDailyLog,
  dayIndexFor,
  emptyDailyLog,
} from "@/lib/game/daily";

const H = 3_600_000;

describe("dayIndexFor", () => {
  it("counts schedule days with the local anchor shift", () => {
    assert.equal(dayIndexFor(0, 0), 0);
    assert.equal(dayIndexFor(23 * H, 0), 0);
    assert.equal(dayIndexFor(25 * H, 0), 1);
    // Started 10:30 local (shift 4.5h): local midnight arrives at 13.5h elapsed
    assert.equal(dayIndexFor(13 * H, 4.5 * H), 0);
    assert.equal(dayIndexFor(20 * H, 4.5 * H), 1);
  });
});

describe("advanceDailyLog", () => {
  it("accumulates within the same day", () => {
    let log = emptyDailyLog();
    log = advanceDailyLog(log, 0, 1200).daily;
    const step = advanceDailyLog(log, 0, 800);
    assert.equal(step.daily.metersToday, 2000);
    assert.equal(step.rolledOver, false);
    assert.equal(step.daily.history.length, 0);
  });

  it("rolls the day, archives yesterday, and reports it once", () => {
    let log = emptyDailyLog();
    log = advanceDailyLog(log, 0, 50_000).daily;
    const roll = advanceDailyLog(log, 1, 300);
    assert.equal(roll.rolledOver, true);
    assert.equal(roll.yesterdayMeters, 50_000);
    assert.equal(roll.daily.dayIndex, 1);
    assert.equal(roll.daily.metersToday, 300);
    assert.deepEqual(roll.daily.history[0], { dayIndex: 0, meters: 50_000 });
  });

  it("adopts a later day silently when nothing was recorded", () => {
    const adopt = advanceDailyLog(emptyDailyLog(), 7, 0);
    assert.equal(adopt.rolledOver, false);
    assert.equal(adopt.daily.dayIndex, 7);
    assert.equal(adopt.daily.history.length, 0);
  });

  it("never crashes when the clock goes backwards", () => {
    let log = emptyDailyLog();
    log = advanceDailyLog(log, 3, 900).daily;
    const back = advanceDailyLog(log, 2, 100);
    assert.equal(back.rolledOver, false);
    assert.equal(back.daily.metersToday, 1000);
  });
});
