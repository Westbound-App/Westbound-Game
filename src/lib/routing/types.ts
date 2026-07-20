import type { Coordinate, DecisionOption } from "@/lib/types/domain";

export type RouteResult = {
  totalDistanceMeters: number;
  encodedGeometry: string;
  coordinates: Coordinate[];
  segments: Array<{
    start: Coordinate;
    end: Coordinate;
    distanceMeters: number;
    pedestrianAllowed: boolean;
    metadata?: Record<string, unknown>;
  }>;
};

/**
 * Replaceable routing abstraction.
 * Do not couple app logic to a single vendor.
 */
export interface RoutingProvider {
  calculateWalkingRoute(
    start: Coordinate,
    destination: Coordinate,
    waypoints?: Coordinate[],
  ): Promise<RouteResult>;

  getValidDecisionOptions(
    currentLocation: Coordinate,
    destination: Coordinate,
  ): Promise<DecisionOption[]>;
}
