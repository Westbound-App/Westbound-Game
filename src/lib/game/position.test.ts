import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  advanceAlongSegments,
  bearingDegrees,
  interpolateSegment,
  isWithinDestinationRadius,
} from "@/lib/game/position";
import type { RouteSegment } from "@/lib/types/domain";

const segments: RouteSegment[] = [
  {
    id: "a",
    routeVersionId: "r",
    segmentIndex: 0,
    start: { latitude: 0, longitude: 0 },
    end: { latitude: 0, longitude: 0.01 },
    distanceMeters: 100,
    cumulativeStartMeters: 0,
    cumulativeEndMeters: 100,
    pedestrianAllowed: true,
  },
  {
    id: "b",
    routeVersionId: "r",
    segmentIndex: 1,
    start: { latitude: 0, longitude: 0.01 },
    end: { latitude: 0, longitude: 0.02 },
    distanceMeters: 100,
    cumulativeStartMeters: 100,
    cumulativeEndMeters: 200,
    pedestrianAllowed: true,
  },
];

describe("position helpers", () => {
  it("interpolates midpoint of a segment", () => {
    const mid = interpolateSegment(segments[0]!, 50);
    assert.ok(Math.abs(mid.longitude - 0.005) < 1e-9);
  });

  it("crosses into the next segment", () => {
    const result = advanceAlongSegments(segments, 0, 80, 40);
    assert.equal(result.segmentIndex, 1);
    assert.ok(Math.abs(result.distanceIntoSegmentMeters - 20) < 1e-6);
    assert.equal(result.completed, false);
  });

  it("marks completed when past final segment", () => {
    const result = advanceAlongSegments(segments, 1, 50, 1000);
    assert.equal(result.completed, true);
    assert.equal(result.segmentIndex, 1);
  });

  it("detects destination radius", () => {
    assert.equal(
      isWithinDestinationRadius(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 0 },
        100,
      ),
      true,
    );
  });

  it("computes westbound bearing", () => {
    const b = bearingDegrees(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: -1 },
    );
    assert.ok(b > 260 && b < 280);
  });
});
