/**
 * Deterministic control-window resolution.
 * Never uses randomness when money/credits are involved.
 */

import type {
  ControlOptionState,
  ControlResolution,
  ControlWindowState,
} from "@/lib/types/control";
import type { Faction } from "@/lib/types/domain";

export type ResolveOutcome = {
  resolution: ControlResolution;
  winningOption: ControlOptionState;
};

/**
 * Tie-break sequence:
 * 1. Higher total credits
 * 2. Higher unique contributors
 * 3. Earlier time reaching the final tied total (lastLeadAt)
 * 4. Default route option
 */
export function resolveControlWindow(
  window: ControlWindowState,
): ResolveOutcome {
  const options = window.options.filter((o) => o.totalCredits >= 0);
  if (options.length === 0) {
    throw new Error("No options to resolve");
  }

  let method: ControlResolution["tieBreakMethod"] = "higher_credits";
  let candidates = [...options];

  const maxCredits = Math.max(...candidates.map((o) => o.totalCredits));
  candidates = candidates.filter((o) => o.totalCredits === maxCredits);

  if (candidates.length > 1) {
    method = "higher_contributors";
    const maxContributors = Math.max(
      ...candidates.map((o) => o.contributorCount),
    );
    candidates = candidates.filter(
      (o) => o.contributorCount === maxContributors,
    );
  }

  if (candidates.length > 1) {
    method = "earlier_lead";
    candidates = [...candidates].sort((a, b) => {
      const at = a.lastLeadAt ? Date.parse(a.lastLeadAt) : Number.POSITIVE_INFINITY;
      const bt = b.lastLeadAt ? Date.parse(b.lastLeadAt) : Number.POSITIVE_INFINITY;
      return at - bt;
    });
    const earliest = candidates[0]?.lastLeadAt;
    if (earliest) {
      candidates = candidates.filter((o) => o.lastLeadAt === earliest);
    }
  }

  if (candidates.length > 1) {
    method = "default_route";
    const def = candidates.find((o) => o.isDefault) ?? candidates[0]!;
    candidates = [def];
  }

  const winningOption = candidates[0]!;
  const totalCreditsByOption: Record<string, number> = {};
  const contributorCountByOption: Record<string, number> = {};
  for (const o of options) {
    totalCreditsByOption[o.id] = o.totalCredits;
    contributorCountByOption[o.id] = o.contributorCount;
  }

  const milesAdded = winningOption.additionalDistanceMeters / 1609.344;
  const winningFaction: Faction =
    winningOption.factionAffinity === "neutral"
      ? "finisher"
      : winningOption.factionAffinity;

  const publicSummary =
    winningOption.optionType === "support_route" ||
    winningOption.optionType === "route_shield"
      ? `${winningOption.title} won with ${winningOption.totalCredits} credits. The recommended route holds.`
      : `${winningOption.title} won with ${winningOption.totalCredits} credits. About ${milesAdded.toFixed(2)} miles added.`;

  return {
    winningOption,
    resolution: {
      winningOptionId: winningOption.id,
      winningOptionType: winningOption.optionType,
      winningTitle: winningOption.title,
      winningFaction,
      totalCreditsByOption,
      contributorCountByOption,
      tieBreakMethod: method,
      milesAdded,
      publicSummary,
    },
  };
}

export function applyContributionToOption(
  option: ControlOptionState,
  playerId: string,
  credits: number,
  nowIso: string,
): ControlOptionState {
  const already = option.contributorIds.includes(playerId);
  const nextCredits = option.totalCredits + credits;
  return {
    ...option,
    totalCredits: nextCredits,
    contributorCount: already
      ? option.contributorCount
      : option.contributorCount + 1,
    contributorIds: already
      ? option.contributorIds
      : [...option.contributorIds, playerId],
    lastLeadAt: nowIso,
  };
}
