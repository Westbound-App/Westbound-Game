/**
 * Central configuration for WESTBOUND simulation and product rules.
 * Prefer reading from games.config_json overrides at runtime when present.
 */

export type CreditBundle = {
  id: string;
  credits: number;
  /** Placeholder prices for Phase 2; not charged in Phase A. */
  priceCents: number;
  label: string;
};

export type RestScheduleBlock = {
  /** Local game time HH:mm */
  start: string;
  end: string;
  kind: "walking" | "resting";
};

export type CompanionDog = {
  name: string;
  breedMix: string;
  description: string;
};

export type GameConfig = {
  publicGameName: string;
  walkerName: string;
  companionDog: CompanionDog;
  normalWalkingSpeedMph: number;
  walkingHoursPerDay: number;
  restingHoursPerDay: number;
  estimatedMilesPerDay: number;
  stateBroadcastIntervalSeconds: number;
  decisionWindowDurationSeconds: number;
  minimumDecisionSpacingMiles: number;
  maximumBasicDetourMiles: number;
  destinationRadiusMeters: number;
  clientInterpolationEnabled: boolean;
  sandboxSpeedMultiplier: number;
  gameTimezone: string;
  contributionMinimumCredits: number;
  contributionMaximumCredits: number;
  factionNames: {
    finisher: string;
    drifter: string;
    neutral: string;
  };
  /** Paid direct actions — the only ways the walk ever pauses or bends */
  paidActions: {
    restBreakCredits: number;
    restBreakRealMinutes: number;
    waypointCredits: number;
    waypointMaxDetourMiles: number;
  };
  routeProtectionStrength: number;
  loopPrevention: {
    lookbackDistanceMiles: number;
    lookbackHours: number;
    minimumLoopSizeMiles: number;
  };
  mapProvider: "placeholder" | "maplibre" | "mapbox" | "leaflet";
  routingProvider: "mock" | "osrm" | "mapbox" | "google";
  maintenanceMode: boolean;
  publicLaunchDate: string | null;
  freeTestCreditsOnSignup: number;
  creditBundles: CreditBundle[];
  /** Simple prototype schedule: 8h walk then 16h rest repeating from start-of-day. */
  useSimpleSchedule: boolean;
  detailedSchedule: RestScheduleBlock[];
  /**
   * When true (sandbox), live visuals sample famous US places by route progress
   * so place packs can be previewed before the full national route exists.
   * Production should stay false — real lat/lng only.
   */
  scenicVisualDemoMode: boolean;
};

export const defaultGameConfig: GameConfig = {
  publicGameName: "WESTBOUND",
  walkerName: "The Walker",
  companionDog: {
    name: "Beacon",
    breedMix: "Bernese Mountain Dog × Siberian Husky",
    description:
      "Mostly black with white chest, paws, and muzzle; a little chunky like a Bernese, with a playful husky face. Walks with him and around him.",
  },
  normalWalkingSpeedMph: 2.5,
  // He never stops walking — rest exists only as a paid act of kindness
  walkingHoursPerDay: 24,
  restingHoursPerDay: 0,
  estimatedMilesPerDay: 60,
  stateBroadcastIntervalSeconds: 5,
  decisionWindowDurationSeconds: 45,
  minimumDecisionSpacingMiles: 0.25,
  maximumBasicDetourMiles: 5,
  destinationRadiusMeters: 100,
  clientInterpolationEnabled: true,
  sandboxSpeedMultiplier: 100,
  gameTimezone: "America/New_York",
  contributionMinimumCredits: 10,
  contributionMaximumCredits: 10_000,
  factionNames: {
    finisher: "Finishers",
    drifter: "Pathfinders",
    neutral: "Watchers",
  },
  paidActions: {
    restBreakCredits: 200,
    restBreakRealMinutes: 30,
    waypointCredits: 500,
    waypointMaxDetourMiles: 5000,
  },
  routeProtectionStrength: 1.25,
  loopPrevention: {
    lookbackDistanceMiles: 2,
    lookbackHours: 24,
    minimumLoopSizeMiles: 0.5,
  },
  mapProvider: "placeholder",
  routingProvider: "mock",
  maintenanceMode: false,
  publicLaunchDate: null,
  freeTestCreditsOnSignup: 1_000,
  creditBundles: [
    { id: "starter", credits: 500, priceCents: 499, label: "Trail Pack" },
    { id: "standard", credits: 1_100, priceCents: 999, label: "Mile Pack" },
    { id: "large", credits: 3_000, priceCents: 2_499, label: "Horizon Pack" },
    { id: "xl", credits: 6_500, priceCents: 4_999, label: "Pacific Pack" },
  ],
  scenicVisualDemoMode: false,
  useSimpleSchedule: true,
  detailedSchedule: [
    { start: "08:00", end: "12:00", kind: "walking" },
    { start: "12:00", end: "13:00", kind: "resting" },
    { start: "13:00", end: "17:00", kind: "walking" },
    { start: "17:00", end: "08:00", kind: "resting" },
  ],
};

/** mph → meters per second */
export function mphToMps(mph: number): number {
  return mph * 0.44704;
}

export function resolveEffectiveSpeedMps(
  config: GameConfig,
  environment: "sandbox" | "production",
): number {
  const base = mphToMps(config.normalWalkingSpeedMph);
  if (environment === "sandbox") {
    return base * config.sandboxSpeedMultiplier;
  }
  return base;
}

export function mergeGameConfig(
  overrides: Partial<GameConfig> | Record<string, unknown> | null | undefined,
): GameConfig {
  if (!overrides || typeof overrides !== "object") {
    return defaultGameConfig;
  }
  return {
    ...defaultGameConfig,
    ...overrides,
    factionNames: {
      ...defaultGameConfig.factionNames,
      ...(typeof overrides.factionNames === "object" &&
      overrides.factionNames !== null
        ? (overrides.factionNames as GameConfig["factionNames"])
        : {}),
    },
    paidActions: {
      ...defaultGameConfig.paidActions,
      ...(typeof (overrides as Partial<GameConfig>).paidActions === "object" &&
      (overrides as Partial<GameConfig>).paidActions !== null
        ? ((overrides as Partial<GameConfig>)
            .paidActions as GameConfig["paidActions"])
        : {}),
    },
    companionDog: {
      ...defaultGameConfig.companionDog,
      ...(typeof overrides.companionDog === "object" &&
      overrides.companionDog !== null
        ? (overrides.companionDog as CompanionDog)
        : {}),
    },
    loopPrevention: {
      ...defaultGameConfig.loopPrevention,
      ...(typeof overrides.loopPrevention === "object" &&
      overrides.loopPrevention !== null
        ? (overrides.loopPrevention as GameConfig["loopPrevention"])
        : {}),
    },
    creditBundles: Array.isArray(overrides.creditBundles)
      ? (overrides.creditBundles as CreditBundle[])
      : defaultGameConfig.creditBundles,
    detailedSchedule: Array.isArray(overrides.detailedSchedule)
      ? (overrides.detailedSchedule as RestScheduleBlock[])
      : defaultGameConfig.detailedSchedule,
  };
}
