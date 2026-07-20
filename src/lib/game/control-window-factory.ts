import { randomUUID } from "node:crypto";
import type { GameConfig } from "@/lib/config/game-config";
import type {
  ControlOptionState,
  ControlWindowState,
  DecisionPointPlan,
} from "@/lib/types/control";
import type { Coordinate } from "@/lib/types/domain";

export function buildDecisionPoints(
  totalRouteMeters: number,
): DecisionPointPlan[] {
  const first = Math.max(400, totalRouteMeters * 0.28);
  const second = Math.max(first + 600, totalRouteMeters * 0.58);
  const points: DecisionPointPlan[] = [
    {
      id: "dp-1",
      triggerCumulativeMeters: first,
      label: "A friendly fork in the road",
      resolved: false,
    },
  ];
  if (second < totalRouteMeters - 200) {
    points.push({
      id: "dp-2",
      triggerCumulativeMeters: second,
      label: "Another gentle choice",
      resolved: false,
    });
  }
  return points;
}

export function createControlWindow(params: {
  gameId: string;
  decisionPoint: DecisionPointPlan;
  hold: Coordinate;
  holdSegmentIndex: number;
  holdDistanceIntoSegmentMeters: number;
  holdTotalDistanceMeters: number;
  config: GameConfig;
  nowMs: number;
}): ControlWindowState {
  const { gameId, decisionPoint, hold, config, nowMs } = params;
  const opensAt = new Date(nowMs).toISOString();
  const closesAt = new Date(
    nowMs + config.decisionWindowDurationSeconds * 1000,
  ).toISOString();

  const options: ControlOptionState[] = [
    {
      id: randomUUID(),
      optionType: "support_route",
      title: "Keep him west",
      description: "Support the friendly westbound path.",
      factionAffinity: "finisher",
      additionalDistanceMeters: 0,
      estimatedAdditionalMinutes: 0,
      landmarkLabel: null,
      totalCredits: 0,
      contributorCount: 0,
      contributorIds: [],
      lastLeadAt: null,
      isDefault: true,
    },
    {
      id: randomUUID(),
      optionType: "northern_detour",
      title: "Guide him north",
      description: "A scenic nudge on a longer northern road.",
      factionAffinity: "drifter",
      additionalDistanceMeters: 1200,
      estimatedAdditionalMinutes: 18,
      landmarkLabel: "Mill Creek overlook",
      totalCredits: 0,
      contributorCount: 0,
      contributorIds: [],
      lastLeadAt: null,
      isDefault: false,
    },
    {
      id: randomUUID(),
      optionType: "southern_detour",
      title: "Nudge him south",
      description: "Send him on a gentler southern detour.",
      factionAffinity: "drifter",
      additionalDistanceMeters: 950,
      estimatedAdditionalMinutes: 14,
      landmarkLabel: "Harbor Loop",
      totalCredits: 0,
      contributorCount: 0,
      contributorIds: [],
      lastLeadAt: null,
      isDefault: false,
    },
    {
      id: randomUUID(),
      optionType: "route_shield",
      title: "Shield his route",
      description: "Help protect the recommended westbound way.",
      factionAffinity: "finisher",
      additionalDistanceMeters: 0,
      estimatedAdditionalMinutes: 0,
      landmarkLabel: null,
      totalCredits: 0,
      contributorCount: 0,
      contributorIds: [],
      lastLeadAt: null,
      isDefault: false,
    },
  ];

  return {
    id: randomUUID(),
    gameId,
    status: "open",
    opensAt,
    closesAt,
    resolvedAt: null,
    winningOptionId: null,
    decisionPointId: decisionPoint.id,
    holdLatitude: hold.latitude,
    holdLongitude: hold.longitude,
    holdSegmentIndex: params.holdSegmentIndex,
    holdDistanceIntoSegmentMeters: params.holdDistanceIntoSegmentMeters,
    holdTotalDistanceMeters: params.holdTotalDistanceMeters,
    options,
    resolution: null,
  };
}
