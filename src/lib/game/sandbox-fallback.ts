/**
 * In-memory sandbox snapshot used when Supabase is not configured.
 * Keeps the live page functional during local UI development.
 */

import {
  defaultGameConfig,
  mergeGameConfig,
  resolveEffectiveSpeedMps,
} from "@/lib/config/game-config";
import {
  getSandboxSeedRoute,
  SANDBOX_DESTINATION,
  SANDBOX_START,
} from "@/lib/routing";
import type {
  GamePublicView,
  RouteSegment,
  WalkerSnapshot,
} from "@/lib/types/domain";

export const SANDBOX_GAME_ID = "a0000000-0000-4000-8000-000000000001";
export const SANDBOX_SLUG = "sandbox-portland";

export function getFallbackGameView(): GamePublicView {
  const config = mergeGameConfig({
    sandboxSpeedMultiplier: 100,
    publicGameName: "WESTBOUND Sandbox",
  });

  return {
    id: SANDBOX_GAME_ID,
    slug: SANDBOX_SLUG,
    name: "WESTBOUND Sandbox — Portland Loop",
    environment: "sandbox",
    status: "active",
    walkerName: config.walkerName,
    companionDog: config.companionDog,
    start: SANDBOX_START,
    destination: SANDBOX_DESTINATION,
    destinationRadiusMeters: config.destinationRadiusMeters,
    startedAt: new Date().toISOString(),
    completedAt: null,
    completionLocked: false,
    config: config as unknown as Record<string, unknown>,
  };
}

export function getFallbackSegments(): RouteSegment[] {
  const route = getSandboxSeedRoute();
  let cumulative = 0;
  return route.segments.map((segment, index) => {
    const row: RouteSegment = {
      id: `fallback-seg-${index}`,
      routeVersionId: "fallback-route",
      segmentIndex: index,
      start: segment.start,
      end: segment.end,
      distanceMeters: segment.distanceMeters,
      cumulativeStartMeters: cumulative,
      cumulativeEndMeters: cumulative + segment.distanceMeters,
      pedestrianAllowed: segment.pedestrianAllowed,
    };
    cumulative += segment.distanceMeters;
    return row;
  });
}

export function getFallbackWalkerSnapshot(): WalkerSnapshot {
  const route = getSandboxSeedRoute();
  const speed = resolveEffectiveSpeedMps(defaultGameConfig, "sandbox");
  const segments = getFallbackSegments();
  const first = segments[0];

  return {
    gameId: SANDBOX_GAME_ID,
    status: "walking",
    latitude: SANDBOX_START.latitude,
    longitude: SANDBOX_START.longitude,
    speedMps: speed,
    segmentId: first?.id ?? null,
    distanceIntoSegmentMeters: 0,
    totalDistanceWalkedMeters: 0,
    originalRouteDistanceMeters: route.totalDistanceMeters,
    projectedRemainingMeters: route.totalDistanceMeters,
    movementStartedAt: new Date().toISOString(),
    nextStateChangeAt: null,
    serverTimestamp: new Date().toISOString(),
    stateVersion: 1,
  };
}

export function getFallbackEvents(): Array<{
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  eventType: string;
}> {
  return [
    {
      id: "fallback-event-1",
      eventType: "game_started",
      title: "He started walking",
      description:
        "The sandbox walker left the Old Port and turned west. Supabase is not connected — showing local fallback data.",
      occurredAt: new Date().toISOString(),
    },
  ];
}
