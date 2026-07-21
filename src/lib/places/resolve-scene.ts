/**
 * Resolve walker coordinates → place label + visual scene pack.
 */

import { haversineMeters } from "@/lib/routing/mock-provider";
import {
  DEFAULT_SCENE,
  LANDMARKS,
  REGION_PACKS,
} from "@/lib/places/registry";
import type { ResolvedPlace } from "@/lib/places/types";
import type { Coordinate } from "@/lib/types/domain";

export function resolvePlace(coord: Coordinate): ResolvedPlace {
  // 1) Nearest landmark in radius wins (local identity moments)
  let bestLandmark: (typeof LANDMARKS)[0] | null = null;
  let bestLandmarkDist = Number.POSITIVE_INFINITY;

  for (const lm of LANDMARKS) {
    const d = haversineMeters(coord, lm.coordinate);
    if (d <= lm.radiusMeters && d < bestLandmarkDist) {
      bestLandmark = lm;
      bestLandmarkDist = d;
    }
  }

  if (bestLandmark) {
    const state =
      REGION_PACKS.find(
        (r) =>
          coord.latitude >= r.minLat &&
          coord.latitude <= r.maxLat &&
          coord.longitude >= r.minLon &&
          coord.longitude <= r.maxLon,
      )?.stateHint ?? "United States";

    return {
      town: bestLandmark.name,
      state,
      short: `${bestLandmark.headline}`,
      biome: bestLandmark.biome,
      sceneImage: bestLandmark.sceneImage ?? DEFAULT_SCENE.sceneImage,
      sceneVideo: bestLandmark.sceneVideo ?? null,
      landmark: bestLandmark,
      locationLine: `${bestLandmark.headline}${
        state !== "United States" && !bestLandmark.headline.includes(state)
          ? ` · ${state}`
          : ""
      }`,
      matchReason: "landmark",
    };
  }

  // 2) Region bounding box
  for (const region of REGION_PACKS) {
    if (
      coord.latitude >= region.minLat &&
      coord.latitude <= region.maxLat &&
      coord.longitude >= region.minLon &&
      coord.longitude <= region.maxLon
    ) {
      return {
        town: region.defaultTown,
        state: region.stateHint ?? region.name,
        short: `${region.defaultTown}${region.stateHint ? `, ${region.stateHint}` : ""}`,
        biome: region.biome,
        sceneImage: region.sceneImage,
        sceneVideo: region.sceneVideo ?? null,
        landmark: null,
        locationLine: region.stateHint
          ? `${region.defaultTown}, ${region.stateHint}`
          : region.name,
        matchReason: "region",
      };
    }
  }

  // 3) Default highway
  return {
    town: DEFAULT_SCENE.town,
    state: DEFAULT_SCENE.state,
    short: "Open road, United States",
    biome: DEFAULT_SCENE.biome,
    sceneImage: DEFAULT_SCENE.sceneImage,
    sceneVideo: null,
    landmark: null,
    locationLine: "Open road · United States",
    matchReason: "default",
  };
}

/**
 * Demo helper: map 0–1 progress along a journey onto sample US highlight coords
 * so sandbox can preview multi-region scenes without a full national route yet.
 */
export const SCENIC_DEMO_WAYPOINTS: Array<{
  progress: number;
  coordinate: Coordinate;
  label: string;
}> = [
  {
    progress: 0,
    coordinate: { latitude: 43.6591, longitude: -70.2568 },
    label: "Portland, Maine",
  },
  {
    progress: 0.18,
    coordinate: { latitude: 40.758, longitude: -73.9855 },
    label: "New York City",
  },
  {
    progress: 0.4,
    coordinate: { latitude: 41.0375, longitude: -81.468 },
    label: "Akron, Ohio",
  },
  {
    progress: 0.55,
    coordinate: { latitude: 41.8781, longitude: -87.6298 },
    label: "Chicago",
  },
  {
    progress: 0.72,
    coordinate: { latitude: 39.7392, longitude: -104.9903 },
    label: "Denver",
  },
  {
    progress: 0.88,
    coordinate: { latitude: 36.0544, longitude: -112.1401 },
    label: "Grand Canyon",
  },
  {
    progress: 1,
    coordinate: { latitude: 34.0522, longitude: -118.2437 },
    label: "Los Angeles",
  },
];

/**
 * For scenic demo mode: blend visual sample coords by route progress
 * while the game still advances on its real sandbox geometry.
 */
export function scenicDemoCoordinate(progress01: number): Coordinate {
  const p = Math.min(1, Math.max(0, progress01));
  const pts = SCENIC_DEMO_WAYPOINTS;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    if (p >= a.progress && p <= b.progress) {
      const t = (p - a.progress) / (b.progress - a.progress || 1);
      return {
        latitude:
          a.coordinate.latitude +
          (b.coordinate.latitude - a.coordinate.latitude) * t,
        longitude:
          a.coordinate.longitude +
          (b.coordinate.longitude - a.coordinate.longitude) * t,
      };
    }
  }
  return pts[pts.length - 1]!.coordinate;
}
