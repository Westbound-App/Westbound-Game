/**
 * Leaderboard and journey stats from local store.
 */

import { ensureLocalState, type LocalGameState } from "@/lib/game/local-store";
import type { Faction } from "@/lib/types/domain";

export type LeaderboardEntry = {
  rank: number;
  playerId: string;
  displayName: string;
  faction: Faction;
  creditsSpent: number;
  successfulContributions: number;
};

export type LeaderboardPayload = {
  byCredits: LeaderboardEntry[];
  finishers: LeaderboardEntry[];
  drifters: LeaderboardEntry[];
  factionStats: LocalGameState["factionStats"];
  playerCount: number;
  interventionCount: number;
  totalMilesAdded: number;
};

export type JourneyPayload = {
  gameName: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  milesWalked: number;
  milesRemaining: number;
  originalRouteMiles: number;
  interventions: Array<{
    id: string;
    summary: string;
    milesAdded: number;
    winningFaction: string;
    appliedAt: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    description: string;
    eventType: string;
    occurredAt: string;
    latitude: number | null;
    longitude: number | null;
  }>;
  resolvedWindows: Array<{
    id: string;
    decisionLabel: string;
    winningTitle: string | null;
    tieBreak: string | null;
    resolvedAt: string | null;
    optionTotals: Array<{ title: string; credits: number }>;
  }>;
};

function toEntries(
  players: LocalGameState["players"],
  filter?: Faction,
): LeaderboardEntry[] {
  return Object.values(players)
    .filter((p) => (filter ? p.faction === filter : true))
    .filter((p) => p.lifetimeCreditsSpent > 0 || p.successfulContributions > 0)
    .sort((a, b) => b.lifetimeCreditsSpent - a.lifetimeCreditsSpent)
    .map((p, i) => ({
      rank: i + 1,
      playerId: p.id,
      displayName: p.displayName,
      faction: p.faction,
      creditsSpent: p.lifetimeCreditsSpent,
      successfulContributions: p.successfulContributions,
    }));
}

export async function getLeaderboard(): Promise<LeaderboardPayload> {
  const state = await ensureLocalState();
  return {
    byCredits: toEntries(state.players).slice(0, 50),
    finishers: toEntries(state.players, "finisher").slice(0, 50),
    drifters: toEntries(state.players, "drifter").slice(0, 50),
    factionStats: state.factionStats,
    playerCount: Object.keys(state.players).length,
    interventionCount: state.interventions.length,
    totalMilesAdded: state.factionStats.drifter.milesAdded,
  };
}

export async function getJourney(): Promise<JourneyPayload> {
  const state = await ensureLocalState();
  return {
    gameName: state.game.name,
    status: state.game.status,
    startedAt: state.game.startedAt,
    completedAt: state.game.completedAt,
    milesWalked: state.walker.totalDistanceWalkedMeters / 1609.344,
    milesRemaining: state.walker.projectedRemainingMeters / 1609.344,
    originalRouteMiles:
      state.walker.originalRouteDistanceMeters / 1609.344,
    interventions: state.interventions.map((i) => ({
      id: i.id,
      summary: i.publicSummary,
      milesAdded: i.milesAdded,
      winningFaction: i.winningFaction,
      appliedAt: i.appliedAt,
    })),
    events: state.events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      eventType: e.eventType,
      occurredAt: e.occurredAt,
      latitude: e.latitude,
      longitude: e.longitude,
    })),
    resolvedWindows: state.resolvedWindows.map((w) => {
      const dp = state.decisionPoints.find((d) => d.id === w.decisionPointId);
      return {
        id: w.id,
        decisionLabel: dp?.label ?? "Decision",
        winningTitle: w.resolution?.winningTitle ?? null,
        tieBreak: w.resolution?.tieBreakMethod ?? null,
        resolvedAt: w.resolvedAt,
        optionTotals: w.options.map((o) => ({
          title: o.title,
          credits: o.totalCredits,
        })),
      };
    }),
  };
}

export async function getPlayerAccount(playerId: string) {
  const state = await ensureLocalState();
  const player = state.players[playerId];
  if (!player) return null;

  const ledger = state.ledger
    .filter((l) => l.playerId === playerId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 50);

  const contributions = state.contributions
    .filter((c) => c.playerId === playerId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 50);

  return {
    player: {
      id: player.id,
      displayName: player.displayName,
      faction: player.faction,
      availableBalance: player.availableBalance,
      lifetimeCreditsAdded: player.lifetimeCreditsAdded,
      lifetimeCreditsSpent: player.lifetimeCreditsSpent,
      successfulContributions: player.successfulContributions,
      createdAt: player.createdAt,
    },
    ledger,
    contributions,
  };
}
