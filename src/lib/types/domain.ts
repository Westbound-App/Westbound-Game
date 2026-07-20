/**
 * Shared domain types for WESTBOUND.
 * Keep these free of React and Supabase client imports.
 */

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Faction = "finisher" | "drifter" | "neutral";

export type UserRole =
  | "viewer"
  | "player"
  | "moderator"
  | "admin"
  | "super_admin";

export type UserStatus = "active" | "suspended" | "deleted";

export type GameEnvironment = "sandbox" | "production";

export type GameStatus =
  | "not_started"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type WalkerStatus =
  | "not_started"
  | "walking"
  | "approaching_decision"
  | "decision_window_open"
  | "rerouting"
  | "resting"
  | "paused_by_admin"
  | "temporarily_blocked"
  | "completed";

export type WalletTransactionType =
  | "purchase"
  | "promotional_credit"
  | "control_contribution"
  | "refund"
  | "admin_adjustment"
  | "chargeback"
  | "expired_credit";

export type RouteVersionReason =
  | "initial"
  | "detour"
  | "reroute"
  | "admin"
  | "recovery";

export type EventVisibility = "public" | "internal";

export type RouteSegment = {
  id: string;
  routeVersionId: string;
  segmentIndex: number;
  start: Coordinate;
  end: Coordinate;
  distanceMeters: number;
  cumulativeStartMeters: number;
  cumulativeEndMeters: number;
  pedestrianAllowed: boolean;
};

export type DecisionOption = {
  id: string;
  optionType:
    | "support_route"
    | "northern_detour"
    | "southern_detour"
    | "route_shield";
  title: string;
  description: string;
  factionAffinity: Faction;
  additionalDistanceMeters: number;
  estimatedAdditionalMinutes: number;
  landmarkLabel: string | null;
  destinationWaypoint: Coordinate | null;
  routePreviewGeometry: Coordinate[];
};

export type WalkerSnapshot = {
  gameId: string;
  status: WalkerStatus;
  latitude: number;
  longitude: number;
  speedMps: number;
  segmentId: string | null;
  distanceIntoSegmentMeters: number;
  totalDistanceWalkedMeters: number;
  originalRouteDistanceMeters: number;
  projectedRemainingMeters: number;
  movementStartedAt: string | null;
  nextStateChangeAt: string | null;
  serverTimestamp: string;
  stateVersion: number;
};

export type CompanionDogPublic = {
  name: string;
  breedMix: string;
  description: string;
};

export type GamePublicView = {
  id: string;
  slug: string;
  name: string;
  environment: GameEnvironment;
  status: GameStatus;
  walkerName: string;
  companionDog: CompanionDogPublic;
  start: Coordinate;
  destination: Coordinate;
  destinationRadiusMeters: number;
  startedAt: string | null;
  completedAt: string | null;
  completionLocked: boolean;
  config: Record<string, unknown>;
};

export type RecentRouteRule = {
  blockedSegmentIds: string[];
  lookbackDistanceMiles: number;
  lookbackHours: number;
};
