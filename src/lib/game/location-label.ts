/**
 * Human-readable place labels + scenic demo helpers.
 * Prefer resolvePlace() for full scene + landmark fidelity.
 */

import { resolvePlace, scenicDemoCoordinate } from "@/lib/places/resolve-scene";
import type { ResolvedPlace } from "@/lib/places/types";
import type { Coordinate } from "@/lib/types/domain";

export function approximateLocationLabel(coord: Coordinate): {
  town: string;
  state: string;
  short: string;
} {
  const place = resolvePlace(coord);
  return {
    town: place.town,
    state: place.state,
    short: place.short,
  };
}

export function resolveLocationPresentation(
  coord: Coordinate,
  options?: {
    /** 0–1 route progress; when set, scenic demo samples famous US places for visuals */
    scenicDemoProgress?: number | null;
  },
): ResolvedPlace {
  if (
    options?.scenicDemoProgress != null &&
    Number.isFinite(options.scenicDemoProgress)
  ) {
    const sample = scenicDemoCoordinate(options.scenicDemoProgress);
    return resolvePlace(sample);
  }
  return resolvePlace(coord);
}

export function dayNumber(startedAt: string | null, nowMs = Date.now()): number {
  if (!startedAt) return 1;
  const start = Date.parse(startedAt);
  if (Number.isNaN(start)) return 1;
  const days = Math.floor((nowMs - start) / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, days);
}

/** Simulated viewer count for livestream feel (deterministic from version). */
export function simulatedViewerCount(stateVersion: number): number {
  const base = 1200 + (stateVersion % 900);
  return base + Math.floor((Date.now() / 60000) % 80);
}
