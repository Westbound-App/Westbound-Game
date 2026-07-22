import type { Coordinate, Faction } from "@/lib/types/domain";

export type ControlOptionType =
  | "support_route"
  | "northern_detour"
  | "southern_detour"
  | "route_shield";

export type ControlWindowStatus =
  | "open"
  | "locked"
  | "resolved"
  | "cancelled";

export type ControlOptionState = {
  id: string;
  optionType: ControlOptionType;
  title: string;
  description: string;
  factionAffinity: Faction;
  additionalDistanceMeters: number;
  estimatedAdditionalMinutes: number;
  landmarkLabel: string | null;
  totalCredits: number;
  contributorCount: number;
  contributorIds: string[];
  /** Wall time when this option last took the lead (for tie-break). */
  lastLeadAt: string | null;
  isDefault: boolean;
};

export type ControlWindowState = {
  id: string;
  gameId: string;
  status: ControlWindowStatus;
  opensAt: string;
  closesAt: string;
  resolvedAt: string | null;
  winningOptionId: string | null;
  decisionPointId: string;
  holdLatitude: number;
  holdLongitude: number;
  holdSegmentIndex: number;
  holdDistanceIntoSegmentMeters: number;
  holdTotalDistanceMeters: number;
  options: ControlOptionState[];
  resolution: ControlResolution | null;
};

export type ControlResolution = {
  winningOptionId: string;
  winningOptionType: ControlOptionType;
  winningTitle: string;
  winningFaction: Faction;
  totalCreditsByOption: Record<string, number>;
  contributorCountByOption: Record<string, number>;
  tieBreakMethod:
    | "higher_credits"
    | "higher_contributors"
    | "earlier_lead"
    | "default_route";
  milesAdded: number;
  publicSummary: string;
};

export type ContributionRecord = {
  id: string;
  playerId: string;
  controlWindowId: string;
  controlOptionId: string;
  credits: number;
  idempotencyKey: string;
  createdAt: string;
};

export type LocalPlayer = {
  id: string;
  displayName: string;
  faction: Faction;
  availableBalance: number;
  lifetimeCreditsAdded: number;
  lifetimeCreditsSpent: number;
  successfulContributions: number;
  createdAt: string;
  updatedAt: string;
};

export type WalletLedgerEntry = {
  id: string;
  playerId: string;
  transactionType:
    | "promotional_credit"
    | "control_contribution"
    | "refund"
    | "admin_adjustment";
  amount: number;
  balanceAfter: number;
  idempotencyKey: string;
  relatedControlWindowId: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type DecisionPointPlan = {
  id: string;
  /** Cumulative meters along original route where window should open. */
  triggerCumulativeMeters: number;
  label: string;
  resolved: boolean;
};

/** Paid direct actions — rest gifts and waypoint sends outside vote windows */
export type DirectActionType = "rest_break" | "waypoint_send";

export type DirectActionRecord = {
  id: string;
  type: DirectActionType;
  playerId: string;
  credits: number;
  label: string;
  waypoint: Coordinate | null;
  createdAt: string;
};

export type InterventionRecord = {
  id: string;
  controlWindowId: string;
  winningOptionId: string;
  milesAdded: number;
  winningFaction: Faction;
  appliedAt: string;
  publicSummary: string;
};

export type FactionTotals = {
  creditsSpent: number;
  windowsWon: number;
  milesAdded: number;
  milesPrevented: number;
};

export type ControlPublicView = {
  id: string;
  status: ControlWindowStatus;
  opensAt: string;
  closesAt: string;
  secondsRemaining: number;
  decisionLabel: string;
  options: Array<{
    id: string;
    optionType: ControlOptionType;
    title: string;
    description: string;
    factionAffinity: Faction;
    additionalDistanceMeters: number;
    estimatedAdditionalMinutes: number;
    landmarkLabel: string | null;
    totalCredits: number;
    contributorCount: number;
    isDefault: boolean;
  }>;
  resolution: ControlResolution | null;
};

export type PlayerPublicView = {
  id: string;
  displayName: string;
  faction: Faction;
  availableBalance: number;
  lifetimeCreditsSpent: number;
};

export type DetourWaypoint = Coordinate & { label?: string };
