import type { Coordinate, RouteSegment } from "@/lib/types/domain";

/**
 * Linear interpolate along a single segment by distance from the start.
 */
export function interpolateSegment(
  segment: Pick<RouteSegment, "start" | "end" | "distanceMeters">,
  distanceIntoSegmentMeters: number,
): Coordinate {
  if (segment.distanceMeters <= 0) {
    return { ...segment.end };
  }
  const t = Math.min(
    1,
    Math.max(0, distanceIntoSegmentMeters / segment.distanceMeters),
  );
  return {
    latitude:
      segment.start.latitude +
      (segment.end.latitude - segment.start.latitude) * t,
    longitude:
      segment.start.longitude +
      (segment.end.longitude - segment.start.longitude) * t,
  };
}

/**
 * Advance along ordered segments by `metersToAdvance` from a starting offset.
 * Returns the new segment index, distance into that segment, and coordinate.
 */
export function advanceAlongSegments(
  segments: RouteSegment[],
  startSegmentIndex: number,
  startDistanceIntoSegment: number,
  metersToAdvance: number,
): {
  segmentIndex: number;
  distanceIntoSegmentMeters: number;
  position: Coordinate;
  remainingMetersUnconsumed: number;
  completed: boolean;
} {
  if (segments.length === 0) {
    throw new Error("Cannot advance on empty route");
  }

  let index = Math.min(Math.max(0, startSegmentIndex), segments.length - 1);
  let into = Math.max(0, startDistanceIntoSegment);
  let remaining = Math.max(0, metersToAdvance);

  while (remaining > 0 && index < segments.length) {
    const segment = segments[index];
    if (!segment) break;

    const leftOnSegment = segment.distanceMeters - into;
    if (remaining < leftOnSegment) {
      into += remaining;
      remaining = 0;
      break;
    }

    remaining -= leftOnSegment;
    index += 1;
    into = 0;

    if (index >= segments.length) {
      const last = segments[segments.length - 1];
      return {
        segmentIndex: segments.length - 1,
        distanceIntoSegmentMeters: last?.distanceMeters ?? 0,
        position: last ? { ...last.end } : { latitude: 0, longitude: 0 },
        remainingMetersUnconsumed: remaining,
        completed: true,
      };
    }
  }

  const current = segments[index] ?? segments[segments.length - 1];
  if (!current) {
    throw new Error("Route segment missing");
  }

  return {
    segmentIndex: index,
    distanceIntoSegmentMeters: into,
    position: interpolateSegment(current, into),
    remainingMetersUnconsumed: remaining,
    completed: false,
  };
}

export function metersBetween(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isWithinDestinationRadius(
  position: Coordinate,
  destination: Coordinate,
  radiusMeters: number,
): boolean {
  return metersBetween(position, destination) <= radiusMeters;
}

/** Compass bearing in degrees [0, 360) from a → b. */
export function bearingDegrees(from: Coordinate, to: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const φ1 = toRad(from.latitude);
  const φ2 = toRad(to.latitude);
  const Δλ = toRad(to.longitude - from.longitude);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Heading along current segment (toward segment end). */
export function headingAlongRoute(
  segments: RouteSegment[],
  segmentIndex: number,
): number {
  const seg = segments[segmentIndex] ?? segments[segments.length - 1];
  if (!seg) return 270; // default west
  return bearingDegrees(seg.start, seg.end);
}
