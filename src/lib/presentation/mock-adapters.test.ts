import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mockTodayMiles, mockWeather } from "@/lib/presentation/mock-adapters";

describe("mockWeather", () => {
  it("summer is warmer than winter at the same place and hour", () => {
    const summer = mockWeather("summer", "day", 44, 200);
    const winter = mockWeather("winter", "day", 44, 20);
    assert.ok(summer.tempF > winter.tempF);
  });

  it("night is cooler than day", () => {
    const day = mockWeather("fall", "day", 44, 280);
    const night = mockWeather("fall", "night", 44, 280);
    assert.ok(night.tempF < day.tempF);
  });

  it("southern latitudes run warmer", () => {
    const maine = mockWeather("spring", "day", 44.5, 100);
    const florida = mockWeather("spring", "day", 25.5, 100);
    assert.ok(florida.tempF > maine.tempF);
  });

  it("is deterministic for the same inputs", () => {
    const a = mockWeather("summer", "golden_hour", 43.7, 203);
    const b = mockWeather("summer", "golden_hour", 43.7, 203);
    assert.deepEqual(a, b);
  });
});

describe("mockTodayMiles", () => {
  it("is zero before the walking day starts", () => {
    assert.equal(mockTodayMiles(500, 5, 35), 0);
  });

  it("grows through the day and caps at the daily target", () => {
    const morning = mockTodayMiles(500, 9, 35);
    const evening = mockTodayMiles(500, 19, 35);
    assert.ok(morning > 0 && evening > morning);
    assert.equal(mockTodayMiles(500, 23, 35), 35);
  });

  it("never exceeds the journey total", () => {
    assert.equal(mockTodayMiles(3, 23, 35), 3);
  });
});
