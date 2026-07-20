/**
 * Pure game-engine tick: advances walker from authoritative timestamps.
 * No I/O — safe for unit tests and both local/Supabase stores.
 */

import type { GameConfig } from "@/lib/config/game-config";
import {
  mphToMps,
  resolveEffectiveSpeedMps,
} from "@/lib/config/game-config";
import {
  advanceAlongSegments,
  isWithinDestinationRadius,
} from "@/lib/game/position";
import {
  isWalkingAtSimpleSchedule,
  walkingMillisecondsBetween,
  wallToGameMs,
} from "@/lib/game/schedule";
import type {
  Coordinate,
  GameEnvironment,
  RouteSegment,
  WalkerStatus,
} from "@/lib/types/domain";

export type EngineWalkerState = {
  status: WalkerStatus;
  latitude: number;
  longitude: number;
  segmentIndex: number;
  distanceIntoSegmentMeters: number;
  totalDistanceWalkedMeters: number;
  originalRouteDistanceMeters: number;
  projectedRemainingMeters: number;
  currentSpeedMps: number;
  /** Wall-clock ISO when the current distance anchor was set. */
  movementStartedAt: string | null;
  nextStateChangeAt: string | null;
  versionNumber: number;
};

export type EngineGameMeta = {
  environment: GameEnvironment;
  destination: Coordinate;
  destinationRadiusMeters: number;
  completionLocked: boolean;
  gameStatus: "not_started" | "active" | "paused" | "completed" | "archived";
  /** Wall-clock when the game officially started (schedule epoch). */
  startedAt: string;
};

export type TickInput = {
  nowMs: number;
  walker: EngineWalkerState;
  game: EngineGameMeta;
  segments: RouteSegment[];
  config: GameConfig;
};

export type TickEvent = {
  eventType: string;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
};

export type TickResult = {
  walker: EngineWalkerState;
  gameStatus: EngineGameMeta["gameStatus"];
  completionLocked: boolean;
  events: TickEvent[];
  /** True if official state should be persisted. */
  dirty: boolean;
  metersAdvanced: number;
};

function baseSpeedMps(config: GameConfig, environment: GameEnvironment): number {
  // Store base human speed; effective movement uses multiplier via game-time.
  if (environment === "sandbox") {
    // Prefer wall-time * multiplier applied as effective m/s for simpler demo math:
    // distance = wall_seconds * base_mps * multiplier during walking periods.
    return mphToMps(config.normalWalkingSpeedMph) * config.sandboxSpeedMultiplier;
  }
  return resolveEffectiveSpeedMps(config, environment);
}

function scheduleSpeedMultiplier(
  environment: GameEnvironment,
  config: GameConfig,
): number {
  // For schedule game-clock compression in sandbox.
  return environment === "sandbox" ? config.sandboxSpeedMultiplier : 1;
}

/**
 * Advance walker from last anchor time to nowMs using schedule + speed.
 */
export function tickWalker(input: TickInput): TickResult {
  const { nowMs, segments, config } = input;
  const events: TickEvent[] = [];
  let walker = { ...input.walker };
  let gameStatus = input.game.gameStatus;
  let completionLocked = input.game.completionLocked;
  let dirty = false;
  let metersAdvanced = 0;

  if (segments.length === 0) {
    return {
      walker,
      gameStatus,
      completionLocked,
      events,
      dirty: false,
      metersAdvanced: 0,
    };
  }

  // Terminal / blocked / held states (no distance progress)
  if (
    walker.status === "completed" ||
    walker.status === "paused_by_admin" ||
    walker.status === "temporarily_blocked" ||
    walker.status === "not_started" ||
    walker.status === "decision_window_open" ||
    walker.status === "rerouting" ||
    walker.status === "approaching_decision" ||
    gameStatus === "paused" ||
    gameStatus === "completed" ||
    gameStatus === "archived"
  ) {
    return {
      walker: {
        ...walker,
        currentSpeedMps: 0,
      },
      gameStatus,
      completionLocked,
      events,
      dirty: false,
      metersAdvanced: 0,
    };
  }

  const speedMps = baseSpeedMps(config, input.game.environment);
  const mult = scheduleSpeedMultiplier(input.game.environment, config);
  const startedAtMs = Date.parse(input.game.startedAt);

  // Game clock is elapsed wall time from game start (× sandbox multiplier).
  // t=0 begins a walking window so demos start moving immediately.
  const gameNowElapsedMs = wallToGameMs(
    Math.max(0, nowMs - startedAtMs),
    mult,
  );

  const shouldWalk = isWalkingAtSimpleSchedule(gameNowElapsedMs, config);

  if (!shouldWalk) {
    if (walker.status !== "resting") {
      walker = {
        ...walker,
        status: "resting",
        currentSpeedMps: 0,
        movementStartedAt: null,
        versionNumber: walker.versionNumber + 1,
      };
      dirty = true;
      events.push({
        eventType: "rest_started",
        title: "He stopped for the night",
        description:
          "Walking hours are over. He will resume when the schedule says so.",
        latitude: walker.latitude,
        longitude: walker.longitude,
      });
    } else {
      walker = { ...walker, currentSpeedMps: 0 };
    }

    return {
      walker,
      gameStatus,
      completionLocked,
      events,
      dirty,
      metersAdvanced: 0,
    };
  }

  // Resuming from rest
  if (walker.status === "resting" || walker.movementStartedAt === null) {
    walker = {
      ...walker,
      status: "walking",
      currentSpeedMps: speedMps,
      movementStartedAt: new Date(nowMs).toISOString(),
      versionNumber: walker.versionNumber + 1,
    };
    dirty = true;
    if (input.walker.status === "resting") {
      events.push({
        eventType: "walk_resumed",
        title: "He started walking again",
        description: "Rest is over. Westbound once more.",
        latitude: walker.latitude,
        longitude: walker.longitude,
      });
    }
  }

  const anchorMs = walker.movementStartedAt
    ? Date.parse(walker.movementStartedAt)
    : nowMs;

  if (nowMs <= anchorMs) {
    return {
      walker: { ...walker, currentSpeedMps: speedMps, status: "walking" },
      gameStatus,
      completionLocked,
      events,
      dirty,
      metersAdvanced: 0,
    };
  }

  // Count only schedule walking portions between anchor and now (game clock).
  const gameAnchorElapsedMs = wallToGameMs(
    Math.max(0, anchorMs - startedAtMs),
    mult,
  );
  const walkingGameMs = walkingMillisecondsBetween(
    gameAnchorElapsedMs,
    gameNowElapsedMs,
    config,
  );
  // walkingGameMs is game-time ms spent walking. Distance uses base human speed
  // against that game-time (sandbox compression already applied via game clock).
  const gameWalkingSeconds = walkingGameMs / 1000;
  const metersToAdvance =
    gameWalkingSeconds * mphToMps(config.normalWalkingSpeedMph);

  if (metersToAdvance < 0.001) {
    return {
      walker: { ...walker, currentSpeedMps: speedMps, status: "walking" },
      gameStatus,
      completionLocked,
      events,
      dirty,
      metersAdvanced: 0,
    };
  }

  const advanced = advanceAlongSegments(
    segments,
    walker.segmentIndex,
    walker.distanceIntoSegmentMeters,
    metersToAdvance,
  );

  metersAdvanced =
    metersToAdvance - advanced.remainingMetersUnconsumed;

  const totalWalked = walker.totalDistanceWalkedMeters + metersAdvanced;
  const remaining = Math.max(
    0,
    walker.originalRouteDistanceMeters - totalWalked,
  );

  walker = {
    ...walker,
    status: "walking",
    latitude: advanced.position.latitude,
    longitude: advanced.position.longitude,
    segmentIndex: advanced.segmentIndex,
    distanceIntoSegmentMeters: advanced.distanceIntoSegmentMeters,
    totalDistanceWalkedMeters: totalWalked,
    projectedRemainingMeters: remaining,
    currentSpeedMps: speedMps,
    movementStartedAt: new Date(nowMs).toISOString(),
    versionNumber: walker.versionNumber + 1,
  };
  dirty = true;

  const atDestination = isWithinDestinationRadius(
    advanced.position,
    input.game.destination,
    input.game.destinationRadiusMeters,
  );

  if (advanced.completed || atDestination) {
    walker = {
      ...walker,
      status: "completed",
      currentSpeedMps: 0,
      movementStartedAt: null,
      projectedRemainingMeters: 0,
      latitude: atDestination
        ? advanced.position.latitude
        : (segments[segments.length - 1]?.end.latitude ??
          advanced.position.latitude),
      longitude: atDestination
        ? advanced.position.longitude
        : (segments[segments.length - 1]?.end.longitude ??
          advanced.position.longitude),
      versionNumber: walker.versionNumber + 1,
    };
    gameStatus = "completed";
    // Sandbox may reset later; production locks permanently.
    if (input.game.environment === "production") {
      completionLocked = true;
    }
    events.push({
      eventType: "destination_reached",
      title: "He reached the destination",
      description:
        input.game.environment === "production"
          ? "The journey is over. The production game is now a permanent archive."
          : "Sandbox destination reached. The test journey is complete.",
      latitude: walker.latitude,
      longitude: walker.longitude,
    });
  }

  return {
    walker,
    gameStatus,
    completionLocked,
    events,
    dirty,
    metersAdvanced,
  };
}
