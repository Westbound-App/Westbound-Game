import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  restResumeAnchorMs,
  walkingMillisecondsBetween,
} from "@/lib/game/schedule";
import { rebuildThroughWaypoint } from "@/lib/game/detour";
import { haversineMeters } from "@/lib/routing/mock-provider";

describe("non-stop walking schedule", () => {
  it("counts every millisecond as walking time at 24h/day", () => {
    const config = { walkingHoursPerDay: 24, restingHoursPerDay: 0 };
    const span = 3 * 24 * 3_600_000 + 12_345;
    assert.equal(walkingMillisecondsBetween(1_000, 1_000 + span, config), span);
  });

  it("still honors a partial schedule when configured", () => {
    const config = { walkingHoursPerDay: 8, restingHoursPerDay: 16 };
    const day = 24 * 3_600_000;
    assert.equal(
      walkingMillisecondsBetween(0, day, config),
      8 * 3_600_000,
    );
  });
});

describe("restResumeAnchorMs (paid rest bookkeeping)", () => {
  it("passes through when no rest is active", () => {
    assert.equal(restResumeAnchorMs(100, 500, null), 100);
  });

  it("moves the anchor to the rest end so rest time never counts", () => {
    assert.equal(restResumeAnchorMs(100, 5_000, 3_000), 3_000);
  });

  it("never places the anchor in the future", () => {
    assert.equal(restResumeAnchorMs(100, 2_000, 9_000), 2_000);
  });

  it("never rewinds an anchor that is already past the rest end", () => {
    assert.equal(restResumeAnchorMs(4_000, 5_000, 3_000), 4_000);
  });
});

describe("rebuildThroughWaypoint (paid detour routing)", () => {
  const portland = { latitude: 43.6591, longitude: -70.2568 };
  const keyWest = { latitude: 24.5551, longitude: -81.7800 };
  const pacific = { latitude: 46.9741, longitude: -123.8095 };

  it("routes current → waypoint → destination with continuous cumulatives", () => {
    const { segments, totalDistanceMeters } = rebuildThroughWaypoint({
      current: portland,
      waypoint: keyWest,
      destination: pacific,
      routeVersionId: "rv-test",
    });
    assert.equal(segments.length, 2);
    assert.equal(segments[0].start.latitude, portland.latitude);
    assert.equal(segments[0].end.latitude, keyWest.latitude);
    assert.equal(segments[1].end.longitude, pacific.longitude);
    assert.equal(segments[0].cumulativeEndMeters, segments[1].cumulativeStartMeters);

    const expected =
      haversineMeters(portland, keyWest) + haversineMeters(keyWest, pacific);
    assert.ok(Math.abs(totalDistanceMeters - expected) < 1);
    // Sanity: a Key West detour is a seriously long walk
    assert.ok(totalDistanceMeters / 1609.344 > 3000);
  });

  it("drops a waypoint identical to the current position", () => {
    const { segments } = rebuildThroughWaypoint({
      current: portland,
      waypoint: portland,
      destination: pacific,
      routeVersionId: "rv-test-2",
    });
    assert.equal(segments.length, 1);
    assert.ok(segments[0].distanceMeters > 0);
  });
});
