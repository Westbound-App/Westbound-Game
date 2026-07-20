import type { Coordinate, DecisionOption } from "@/lib/types/domain";
import type { RouteResult, RoutingProvider } from "@/lib/routing/types";

/**
 * Seeded Portland, ME waterfront-area sandbox route (pedestrian-plausible mock).
 * Not sourced from a live routing API — geometry is intentional test data.
 */
export const SANDBOX_START: Coordinate = {
  latitude: 43.6591,
  longitude: -70.2568,
};

export const SANDBOX_DESTINATION: Coordinate = {
  latitude: 43.6785,
  longitude: -70.2985,
};

/** Ordered waypoints forming a short multi-segment walk (~3–4 miles mock). */
export const SANDBOX_ROUTE_COORDINATES: Coordinate[] = [
  { latitude: 43.6591, longitude: -70.2568 },
  { latitude: 43.6612, longitude: -70.2615 },
  { latitude: 43.6638, longitude: -70.2662 },
  { latitude: 43.6665, longitude: -70.2718 },
  { latitude: 43.6688, longitude: -70.2775 },
  { latitude: 43.6712, longitude: -70.2828 },
  { latitude: 43.6735, longitude: -70.2882 },
  { latitude: 43.6758, longitude: -70.2935 },
  { latitude: 43.6785, longitude: -70.2985 },
];

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

function encodeSimplePolyline(coords: Coordinate[]): string {
  return JSON.stringify(coords);
}

function buildSegmentsFromCoordinates(
  coordinates: Coordinate[],
): RouteResult["segments"] {
  const segments: RouteResult["segments"] = [];
  for (let i = 0; i < coordinates.length - 1; i += 1) {
    const start = coordinates[i];
    const end = coordinates[i + 1];
    if (!start || !end) continue;
    segments.push({
      start,
      end,
      distanceMeters: haversineMeters(start, end),
      pedestrianAllowed: true,
      metadata: { mockIndex: i },
    });
  }
  return segments;
}

function buildRouteResult(coordinates: Coordinate[]): RouteResult {
  const segments = buildSegmentsFromCoordinates(coordinates);
  const totalDistanceMeters = segments.reduce(
    (sum, s) => sum + s.distanceMeters,
    0,
  );
  return {
    totalDistanceMeters,
    encodedGeometry: encodeSimplePolyline(coordinates),
    coordinates,
    segments,
  };
}

export class MockRoutingProvider implements RoutingProvider {
  async calculateWalkingRoute(
    start: Coordinate,
    destination: Coordinate,
    waypoints: Coordinate[] = [],
  ): Promise<RouteResult> {
    const coordinates = [start, ...waypoints, destination];
    if (coordinates.length < 2) {
      throw new Error("Route requires at least start and destination");
    }
    return buildRouteResult(coordinates);
  }

  async getValidDecisionOptions(
    currentLocation: Coordinate,
    destination: Coordinate,
  ): Promise<DecisionOption[]> {
    const remaining = haversineMeters(currentLocation, destination);

    return [
      {
        id: "opt-support",
        optionType: "support_route",
        title: "Stay westbound",
        description: "Keep him on the recommended route toward the destination.",
        factionAffinity: "finisher",
        additionalDistanceMeters: 0,
        estimatedAdditionalMinutes: 0,
        landmarkLabel: null,
        destinationWaypoint: null,
        routePreviewGeometry: [currentLocation, destination],
      },
      {
        id: "opt-north",
        optionType: "northern_detour",
        title: "Northern detour",
        description: "Send him north along a longer valid alternate.",
        factionAffinity: "drifter",
        additionalDistanceMeters: Math.min(remaining * 0.15, 3_000),
        estimatedAdditionalMinutes: 25,
        landmarkLabel: "Mill Creek",
        destinationWaypoint: {
          latitude: currentLocation.latitude + 0.008,
          longitude: currentLocation.longitude - 0.004,
        },
        routePreviewGeometry: [
          currentLocation,
          {
            latitude: currentLocation.latitude + 0.008,
            longitude: currentLocation.longitude - 0.004,
          },
          destination,
        ],
      },
      {
        id: "opt-south",
        optionType: "southern_detour",
        title: "Southern detour",
        description: "Send him south along a longer valid alternate.",
        factionAffinity: "drifter",
        additionalDistanceMeters: Math.min(remaining * 0.12, 2_500),
        estimatedAdditionalMinutes: 20,
        landmarkLabel: "Harbor Loop",
        destinationWaypoint: {
          latitude: currentLocation.latitude - 0.006,
          longitude: currentLocation.longitude - 0.003,
        },
        routePreviewGeometry: [
          currentLocation,
          {
            latitude: currentLocation.latitude - 0.006,
            longitude: currentLocation.longitude - 0.003,
          },
          destination,
        ],
      },
      {
        id: "opt-shield",
        optionType: "route_shield",
        title: "Route shield",
        description:
          "Protect the recommended route for the next decision window.",
        factionAffinity: "finisher",
        additionalDistanceMeters: 0,
        estimatedAdditionalMinutes: 0,
        landmarkLabel: null,
        destinationWaypoint: null,
        routePreviewGeometry: [currentLocation, destination],
      },
    ];
  }
}

export function getSandboxSeedRoute(): RouteResult {
  return buildRouteResult(SANDBOX_ROUTE_COORDINATES);
}
