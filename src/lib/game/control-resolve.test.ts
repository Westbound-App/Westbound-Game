import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyContributionToOption,
  resolveControlWindow,
} from "@/lib/game/control-resolve";
import type { ControlOptionState, ControlWindowState } from "@/lib/types/control";

function opt(
  partial: Partial<ControlOptionState> & Pick<ControlOptionState, "id" | "title">,
): ControlOptionState {
  return {
    optionType: "support_route",
    description: "",
    factionAffinity: "finisher",
    additionalDistanceMeters: 0,
    estimatedAdditionalMinutes: 0,
    landmarkLabel: null,
    totalCredits: 0,
    contributorCount: 0,
    contributorIds: [],
    lastLeadAt: null,
    isDefault: false,
    ...partial,
  };
}

function window(options: ControlOptionState[]): ControlWindowState {
  return {
    id: "w1",
    gameId: "g1",
    status: "open",
    opensAt: "2026-01-01T00:00:00.000Z",
    closesAt: "2026-01-01T00:01:00.000Z",
    resolvedAt: null,
    winningOptionId: null,
    decisionPointId: "dp1",
    holdLatitude: 0,
    holdLongitude: 0,
    holdSegmentIndex: 0,
    holdDistanceIntoSegmentMeters: 0,
    holdTotalDistanceMeters: 0,
    options,
    resolution: null,
  };
}

describe("resolveControlWindow", () => {
  it("picks higher credits", () => {
    const result = resolveControlWindow(
      window([
        opt({ id: "a", title: "A", totalCredits: 100, isDefault: true }),
        opt({
          id: "b",
          title: "B",
          totalCredits: 250,
          optionType: "northern_detour",
          factionAffinity: "drifter",
        }),
      ]),
    );
    assert.equal(result.winningOption.id, "b");
    assert.equal(result.resolution.tieBreakMethod, "higher_credits");
  });

  it("breaks credit ties with contributor count", () => {
    const result = resolveControlWindow(
      window([
        opt({
          id: "a",
          title: "A",
          totalCredits: 100,
          contributorCount: 1,
          isDefault: true,
        }),
        opt({
          id: "b",
          title: "B",
          totalCredits: 100,
          contributorCount: 3,
          optionType: "southern_detour",
          factionAffinity: "drifter",
        }),
      ]),
    );
    assert.equal(result.winningOption.id, "b");
    assert.equal(result.resolution.tieBreakMethod, "higher_contributors");
  });

  it("falls back to default route", () => {
    const result = resolveControlWindow(
      window([
        opt({
          id: "a",
          title: "Support",
          totalCredits: 50,
          contributorCount: 1,
          lastLeadAt: "2026-01-01T00:00:30.000Z",
          isDefault: true,
        }),
        opt({
          id: "b",
          title: "North",
          totalCredits: 50,
          contributorCount: 1,
          lastLeadAt: "2026-01-01T00:00:30.000Z",
          optionType: "northern_detour",
          factionAffinity: "drifter",
          isDefault: false,
        }),
      ]),
    );
    assert.equal(result.winningOption.id, "a");
    assert.equal(result.resolution.tieBreakMethod, "default_route");
  });
});

describe("applyContributionToOption", () => {
  it("increments credits and unique contributors once", () => {
    let o = opt({ id: "a", title: "A" });
    o = applyContributionToOption(o, "p1", 100, "2026-01-01T00:00:01.000Z");
    o = applyContributionToOption(o, "p1", 50, "2026-01-01T00:00:02.000Z");
    assert.equal(o.totalCredits, 150);
    assert.equal(o.contributorCount, 1);
  });
});
