/**
 * Apply a winning control option to route geometry (mock routing).
 */

import { haversineMeters } from "@/lib/routing/mock-provider";
import type { ControlOptionType } from "@/lib/types/control";
import type { Coordinate, RouteSegment } from "@/lib/types/domain";

function buildSegments(
  coordinates: Coordinate[],
  routeVersionId: string,
): RouteSegment[] {
  const segments: RouteSegment[] = [];
  let cumulative = 0;
  for (let i = 0; i < coordinates.length - 1; i += 1) {
    const start = coordinates[i]!;
    const end = coordinates[i + 1]!;
    const distanceMeters = haversineMeters(start, end);
    segments.push({
      id: `${routeVersionId}-seg-${i}`,
      routeVersionId,
      segmentIndex: i,
      start,
      end,
      distanceMeters,
      cumulativeStartMeters: cumulative,
      cumulativeEndMeters: cumulative + distanceMeters,
      pedestrianAllowed: true,
    });
    cumulative += distanceMeters;
  }
  return segments;
}

function offsetCoordinate(
  c: Coordinate,
  northMeters: number,
  eastMeters: number,
): Coordinate {
  const dLat = northMeters / 111_320;
  const dLon = eastMeters / (111_320 * Math.cos((c.latitude * Math.PI) / 180));
  return {
    latitude: c.latitude + dLat,
    longitude: c.longitude + dLon,
  };
}

/**
 * Route a paid waypoint send: current position → waypoint → final
 * destination. Mock geometry (straight legs); a real pedestrian routing
 * provider slots in behind the same shape later.
 */
export function rebuildThroughWaypoint(params: {
  current: Coordinate;
  waypoint: Coordinate;
  destination: Coordinate;
  routeVersionId: string;
}): { segments: RouteSegment[]; totalDistanceMeters: number } {
  const raw = [params.current, params.waypoint, params.destination];
  const coords: Coordinate[] = [];
  for (const c of raw) {
    const prev = coords[coords.length - 1];
    if (
      !prev ||
      Math.abs(prev.latitude - c.latitude) > 1e-7 ||
      Math.abs(prev.longitude - c.longitude) > 1e-7
    ) {
      coords.push(c);
    }
  }
  const segments = buildSegments(coords, params.routeVersionId);
  return {
    segments,
    totalDistanceMeters: segments.reduce((s, seg) => s + seg.distanceMeters, 0),
  };
}

/**
 * Rebuild remaining path from hold point through optional waypoint to destination.
 */
export function applyWinningRoute(params: {
  optionType: ControlOptionType;
  hold: Coordinate;
  destination: Coordinate;
  remainingCoordinates: Coordinate[];
  routeVersionId: string;
}): {
  segments: RouteSegment[];
  totalDistanceMeters: number;
  milesAdded: number;
  coordinates: Coordinate[];
} {
  const { optionType, hold, destination, remainingCoordinates, routeVersionId } =
    params;

  // Baseline remaining path (skip past hold if present)
  let remaining = remainingCoordinates.filter(
    (c) =>
      Math.abs(c.latitude - hold.latitude) > 1e-6 ||
      Math.abs(c.longitude - hold.longitude) > 1e-6,
  );
  if (remaining.length === 0) {
    remaining = [destination];
  }

  const baselineCoords = [hold, ...remaining];
  if (
    baselineCoords[baselineCoords.length - 1]!.latitude !== destination.latitude
  ) {
    baselineCoords.push(destination);
  }
  const baseline = buildSegments(baselineCoords, `${routeVersionId}-base`);
  const baselineTotal = baseline.reduce((s, seg) => s + seg.distanceMeters, 0);

  let coordinates: Coordinate[] = baselineCoords;

  if (optionType === "northern_detour") {
    const mid = remaining[Math.floor(remaining.length / 2)] ?? destination;
    const via = offsetCoordinate(mid, 900, -200);
    coordinates = [hold, via, ...remaining.slice(Math.floor(remaining.length / 2)), destination];
  } else if (optionType === "southern_detour") {
    const mid = remaining[Math.floor(remaining.length / 2)] ?? destination;
    const via = offsetCoordinate(mid, -800, -150);
    coordinates = [hold, via, ...remaining.slice(Math.floor(remaining.length / 2)), destination];
  } else {
    // support_route / route_shield — keep recommended remaining path
    coordinates = baselineCoords;
  }

  // Dedupe consecutive duplicates
  const deduped: Coordinate[] = [];
  for (const c of coordinates) {
    const prev = deduped[deduped.length - 1];
    if (
      !prev ||
      Math.abs(prev.latitude - c.latitude) > 1e-7 ||
      Math.abs(prev.longitude - c.longitude) > 1e-7
    ) {
      deduped.push(c);
    }
  }

  const segments = buildSegments(deduped, routeVersionId);
  const totalDistanceMeters = segments.reduce(
    (s, seg) => s + seg.distanceMeters,
    0,
  );
  const milesAdded = Math.max(0, totalDistanceMeters - baselineTotal) / 1609.344;

  return {
    segments,
    totalDistanceMeters,
    milesAdded:
      optionType === "northern_detour" || optionType === "southern_detour"
        ? Math.max(milesAdded, totalDistanceMeters > baselineTotal ? milesAdded : 0.1)
        : 0,
    coordinates: deduped,
  };
}

/**
 * Remaining coordinates after current walker progress along segments.
 */
export function remainingCoordinatesFromProgress(
  segments: RouteSegment[],
  segmentIndex: number,
): Coordinate[] {
  const coords: Coordinate[] = [];
  for (let i = segmentIndex; i < segments.length; i += 1) {
    const seg = segments[i]!;
    if (i === segmentIndex) {
      coords.push(seg.start);
    }
    coords.push(seg.end);
  }
  return coords;
}
