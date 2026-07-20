import { defaultGameConfig } from "@/lib/config/game-config";
import { MockRoutingProvider } from "@/lib/routing/mock-provider";
import type { RoutingProvider } from "@/lib/routing/types";

export type { RouteResult, RoutingProvider } from "@/lib/routing/types";
export {
  MockRoutingProvider,
  getSandboxSeedRoute,
  SANDBOX_START,
  SANDBOX_DESTINATION,
  SANDBOX_ROUTE_COORDINATES,
  haversineMeters,
} from "@/lib/routing/mock-provider";

export function createRoutingProvider(
  providerName: string = defaultGameConfig.routingProvider,
): RoutingProvider {
  switch (providerName) {
    case "mock":
      return new MockRoutingProvider();
    default:
      // Future: osrm, mapbox, google — fall back to mock until wired.
      return new MockRoutingProvider();
  }
}
