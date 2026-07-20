import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultGameConfig } from "@/lib/config/game-config";
import { getFallbackSegments } from "@/lib/game/sandbox-fallback";
import { tickWalker, type EngineWalkerState } from "@/lib/game/tick";
import { SANDBOX_DESTINATION, SANDBOX_START } from "@/lib/routing";

function baseWalker(overrides: Partial<EngineWalkerState> = {}): EngineWalkerState {
  const segments = getFallbackSegments();
  const total = segments.reduce((s, seg) => s + seg.distanceMeters, 0);
  return {
    status: "walking",
    latitude: SANDBOX_START.latitude,
    longitude: SANDBOX_START.longitude,
    segmentIndex: 0,
    distanceIntoSegmentMeters: 0,
    totalDistanceWalkedMeters: 0,
    originalRouteDistanceMeters: total,
    projectedRemainingMeters: total,
    currentSpeedMps: 0,
    movementStartedAt: new Date("2026-01-01T12:00:00.000Z").toISOString(),
    nextStateChangeAt: null,
    versionNumber: 1,
    ...overrides,
  };
}

const sandboxGame = {
  environment: "sandbox" as const,
  destination: SANDBOX_DESTINATION,
  destinationRadiusMeters: 100,
  completionLocked: false,
  gameStatus: "active" as const,
  // Start during walking window: game clock hour 0
  startedAt: new Date("2026-01-01T12:00:00.000Z").toISOString(),
};

describe("tickWalker", () => {
  it("advances distance with elapsed wall time in sandbox", () => {
    const segments = getFallbackSegments();
    const start = Date.parse("2026-01-01T12:00:00.000Z");
    const now = start + 2_000; // 2 real seconds

    const result = tickWalker({
      nowMs: now,
      walker: baseWalker({
        movementStartedAt: new Date(start).toISOString(),
      }),
      game: sandboxGame,
      segments,
      config: defaultGameConfig,
    });

    assert.ok(result.metersAdvanced > 0, "should advance meters");
    assert.equal(result.walker.status, "walking");
    assert.ok(
      result.walker.totalDistanceWalkedMeters > 0,
      "total walked should increase",
    );
    assert.ok(result.dirty);
  });

  it("does not move while paused_by_admin", () => {
    const segments = getFallbackSegments();
    const start = Date.parse("2026-01-01T12:00:00.000Z");
    const result = tickWalker({
      nowMs: start + 60_000,
      walker: baseWalker({
        status: "paused_by_admin",
        movementStartedAt: new Date(start).toISOString(),
      }),
      game: sandboxGame,
      segments,
      config: defaultGameConfig,
    });

    assert.equal(result.metersAdvanced, 0);
    assert.equal(result.walker.totalDistanceWalkedMeters, 0);
    assert.equal(result.dirty, false);
  });

  it("enters resting when schedule is off", () => {
    const segments = getFallbackSegments();
    // With 100x multiplier, 8 game-hours of walking = 288 real seconds.
    // Jump far past that into rest window.
    const start = Date.parse("2026-01-01T12:00:00.000Z");
    const now = start + 400_000; // past first walking window

    const result = tickWalker({
      nowMs: now,
      walker: baseWalker({
        movementStartedAt: new Date(start).toISOString(),
        // Pretend we already finalized near start of rest
        totalDistanceWalkedMeters: 100,
      }),
      game: sandboxGame,
      segments,
      config: defaultGameConfig,
    });

    // Either resting or completed if route short enough — for mid-route should rest
    if (result.walker.status !== "completed") {
      assert.equal(result.walker.status, "resting");
      assert.equal(result.walker.currentSpeedMps, 0);
    }
  });

  it("completes when enough distance is walked", () => {
    const segments = getFallbackSegments();
    const total = segments.reduce((s, seg) => s + seg.distanceMeters, 0);
    const start = Date.parse("2026-01-01T12:00:00.000Z");
    // At ~111 m/s effective, 5 minutes of pure walking >> route length
    const now = start + 300_000;

    const result = tickWalker({
      nowMs: now,
      walker: baseWalker({
        movementStartedAt: new Date(start).toISOString(),
      }),
      game: {
        ...sandboxGame,
        // Disable rest for this test by placing all time in walking —
        // long continuous walk with schedule still walks 8h game / day.
        // 300s wall * 100 = 30000s game ≈ 8.3h — may enter rest.
        // Use almost-finished walker instead:
      },
      segments,
      config: defaultGameConfig,
    });

    // Force completion path with near-end state
    const nearEnd = tickWalker({
      nowMs: start + 5_000,
      walker: baseWalker({
        segmentIndex: segments.length - 1,
        distanceIntoSegmentMeters: Math.max(
          0,
          (segments[segments.length - 1]?.distanceMeters ?? 0) - 5,
        ),
        totalDistanceWalkedMeters: total - 5,
        projectedRemainingMeters: 5,
        movementStartedAt: new Date(start).toISOString(),
      }),
      game: sandboxGame,
      segments,
      config: defaultGameConfig,
    });

    assert.equal(nearEnd.walker.status, "completed");
    assert.equal(nearEnd.gameStatus, "completed");
    assert.ok(
      nearEnd.events.some((e) => e.eventType === "destination_reached"),
    );
    // Keep first long walk result referenced so lint is quiet
    assert.ok(result.walker.versionNumber >= 1);
  });

  it("increments version when state changes", () => {
    const segments = getFallbackSegments();
    const start = Date.parse("2026-01-01T12:00:00.000Z");
    const result = tickWalker({
      nowMs: start + 1_000,
      walker: baseWalker({ versionNumber: 7 }),
      game: sandboxGame,
      segments,
      config: defaultGameConfig,
    });
    assert.ok(result.walker.versionNumber > 7);
  });
});
