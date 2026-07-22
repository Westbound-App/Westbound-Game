/**
 * Shared engine service: load → tick → control windows → persist.
 */

import { randomUUID } from "node:crypto";
import { mergeGameConfig } from "@/lib/config/game-config";
import {
  applyContributionToOption,
  resolveControlWindow,
} from "@/lib/game/control-resolve";
import { createControlWindow } from "@/lib/game/control-window-factory";
import {
  applyWinningRoute,
  rebuildThroughWaypoint,
  remainingCoordinatesFromProgress,
} from "@/lib/game/detour";
import { restResumeAnchorMs } from "@/lib/game/schedule";
import { haversineMeters } from "@/lib/routing/mock-provider";
import {
  ensureLocalState,
  resetLocalSandbox,
  saveLocalState,
  toEngineGameMeta,
  type LocalGameEvent,
  type LocalGameState,
} from "@/lib/game/local-store";
import { headingAlongRoute } from "@/lib/game/position";
import { tickWalker } from "@/lib/game/tick";
import { creditPromotional, debitCredits } from "@/lib/game/wallet";
import type { LiveGamePayload } from "@/lib/game/load-live-state";
import type {
  ControlPublicView,
  LocalPlayer,
  PlayerPublicView,
} from "@/lib/types/control";
import type { Faction, WalkerSnapshot } from "@/lib/types/domain";

export type WorkerHealth = {
  lastTickAt: string | null;
  tickCount: number;
  lastError: string | null;
  store: "local" | "supabase";
  stateVersion: number;
  walkerStatus: string;
  gameStatus: string;
  activeWindow: string | null;
};

function pushEvent(
  state: LocalGameState,
  event: Omit<LocalGameEvent, "id"> & { id?: string },
): void {
  const row: LocalGameEvent = {
    id: event.id ?? `evt-${state.walker.versionNumber}-${event.eventType}-${Date.now()}`,
    eventType: event.eventType,
    title: event.title,
    description: event.description,
    latitude: event.latitude,
    longitude: event.longitude,
    occurredAt: event.occurredAt,
  };
  state.events = [row, ...state.events].slice(0, 80);
}

function walkerToSnapshot(
  gameId: string,
  walker: LocalGameState["walker"],
  segments: LocalGameState["segments"],
  nowIso: string,
): WalkerSnapshot {
  const segment = segments[walker.segmentIndex] ?? null;
  return {
    gameId,
    status: walker.status,
    latitude: walker.latitude,
    longitude: walker.longitude,
    speedMps: walker.currentSpeedMps,
    segmentId: segment?.id ?? null,
    distanceIntoSegmentMeters: walker.distanceIntoSegmentMeters,
    totalDistanceWalkedMeters: walker.totalDistanceWalkedMeters,
    originalRouteDistanceMeters: walker.originalRouteDistanceMeters,
    projectedRemainingMeters: walker.projectedRemainingMeters,
    movementStartedAt: walker.movementStartedAt,
    nextStateChangeAt: walker.nextStateChangeAt,
    serverTimestamp: nowIso,
    stateVersion: walker.versionNumber,
  };
}

function controlPublicView(
  state: LocalGameState,
  nowMs: number,
): ControlPublicView | null {
  const w = state.activeControlWindow;
  if (!w) return null;
  const dp = state.decisionPoints.find((d) => d.id === w.decisionPointId);
  const remaining = Math.max(
    0,
    Math.ceil((Date.parse(w.closesAt) - nowMs) / 1000),
  );
  return {
    id: w.id,
    status: w.status,
    opensAt: w.opensAt,
    closesAt: w.closesAt,
    secondsRemaining: remaining,
    decisionLabel: dp?.label ?? "Decision",
    options: w.options.map((o) => ({
      id: o.id,
      optionType: o.optionType,
      title: o.title,
      description: o.description,
      factionAffinity: o.factionAffinity,
      additionalDistanceMeters: o.additionalDistanceMeters,
      estimatedAdditionalMinutes: o.estimatedAdditionalMinutes,
      landmarkLabel: o.landmarkLabel,
      totalCredits: o.totalCredits,
      contributorCount: o.contributorCount,
      isDefault: o.isDefault,
    })),
    resolution: w.resolution,
  };
}

function maybeOpenControlWindow(
  state: LocalGameState,
  config: ReturnType<typeof mergeGameConfig>,
  nowMs: number,
): void {
  if (state.activeControlWindow) return;
  if (state.game.status !== "active") return;
  if (
    state.walker.status === "completed" ||
    state.walker.status === "paused_by_admin" ||
    state.walker.status === "resting"
  ) {
    return;
  }

  const walked = state.walker.totalDistanceWalkedMeters;
  const next = state.decisionPoints.find(
    (d) => !d.resolved && walked >= d.triggerCumulativeMeters,
  );
  if (!next) return;

  const hold = {
    latitude: state.walker.latitude,
    longitude: state.walker.longitude,
  };

  const window = createControlWindow({
    gameId: state.game.id,
    decisionPoint: next,
    hold,
    holdSegmentIndex: state.walker.segmentIndex,
    holdDistanceIntoSegmentMeters: state.walker.distanceIntoSegmentMeters,
    holdTotalDistanceMeters: state.walker.totalDistanceWalkedMeters,
    config,
    nowMs,
  });

  state.activeControlWindow = window;
  state.walker = {
    ...state.walker,
    status: "decision_window_open",
    currentSpeedMps: 0,
    movementStartedAt: null,
    nextStateChangeAt: window.closesAt,
    versionNumber: state.walker.versionNumber + 1,
  };

  const nowIso = new Date(nowMs).toISOString();
  pushEvent(state, {
    eventType: "control_window_opened",
    title: `Control window: ${next.label}`,
    description: `A gentle choice is open for ${config.decisionWindowDurationSeconds}s. Finishers can support the westbound path; Pathfinders may suggest a scenic detour.`,
    latitude: hold.latitude,
    longitude: hold.longitude,
    occurredAt: nowIso,
  });
}

function finalizeResolution(state: LocalGameState, nowMs: number): void {
  const window = state.activeControlWindow;
  if (!window || window.status !== "open") return;
  if (nowMs < Date.parse(window.closesAt)) return;

  const config = mergeGameConfig(state.game.config);

  // Route shield: fold weighted credits into support for resolution display
  const support = window.options.find((o) => o.optionType === "support_route");
  const shield = window.options.find((o) => o.optionType === "route_shield");
  if (support && shield && shield.totalCredits > 0) {
    const bonus = Math.floor(
      shield.totalCredits * (config.routeProtectionStrength - 1),
    );
    support.totalCredits += shield.totalCredits + bonus;
    for (const id of shield.contributorIds) {
      if (!support.contributorIds.includes(id)) {
        support.contributorIds.push(id);
        support.contributorCount += 1;
      }
    }
    if (!support.lastLeadAt || (shield.lastLeadAt && shield.lastLeadAt < support.lastLeadAt)) {
      support.lastLeadAt = shield.lastLeadAt ?? support.lastLeadAt;
    }
    // Zero shield so it can't independently win after fold
    shield.totalCredits = 0;
  }

  window.status = "locked";
  const { resolution, winningOption } = resolveControlWindow(window);
  window.status = "resolved";
  window.resolvedAt = new Date(nowMs).toISOString();
  window.winningOptionId = winningOption.id;
  window.resolution = resolution;

  // Mark decision point resolved
  state.decisionPoints = state.decisionPoints.map((d) =>
    d.id === window.decisionPointId ? { ...d, resolved: true } : d,
  );

  const hold = {
    latitude: window.holdLatitude,
    longitude: window.holdLongitude,
  };

  const remaining = remainingCoordinatesFromProgress(
    state.segments,
    window.holdSegmentIndex,
  );

  const routeVersionId = `route-${state.walker.versionNumber + 1}`;
  const applied = applyWinningRoute({
    optionType: winningOption.optionType,
    hold,
    destination: state.game.destination,
    remainingCoordinates: remaining,
    routeVersionId,
  });

  // Miles already walked stay; remaining path replaced
  const walked = window.holdTotalDistanceMeters;
  const newRemaining = applied.totalDistanceMeters;
  const newOriginal =
    winningOption.optionType === "northern_detour" ||
    winningOption.optionType === "southern_detour"
      ? state.walker.originalRouteDistanceMeters +
        applied.milesAdded * 1609.344
      : state.walker.originalRouteDistanceMeters;

  state.segments = applied.segments;
  state.walker = {
    ...state.walker,
    status: "walking",
    latitude: hold.latitude,
    longitude: hold.longitude,
    segmentIndex: 0,
    distanceIntoSegmentMeters: 0,
    totalDistanceWalkedMeters: walked,
    originalRouteDistanceMeters: newOriginal,
    projectedRemainingMeters: newRemaining,
    currentSpeedMps: 0,
    movementStartedAt: new Date(nowMs).toISOString(),
    nextStateChangeAt: null,
    versionNumber: state.walker.versionNumber + 1,
  };

  const faction = resolution.winningFaction;
  if (faction === "finisher" || faction === "drifter") {
    state.factionStats[faction].windowsWon += 1;
    if (resolution.milesAdded > 0) {
      state.factionStats.drifter.milesAdded += resolution.milesAdded;
    } else {
      state.factionStats.finisher.milesPrevented += 0.5;
    }
  }

  state.interventions.unshift({
    id: randomUUID(),
    controlWindowId: window.id,
    winningOptionId: winningOption.id,
    milesAdded: resolution.milesAdded,
    winningFaction: resolution.winningFaction,
    appliedAt: window.resolvedAt,
    publicSummary: resolution.publicSummary,
  });

  pushEvent(state, {
    eventType: "control_window_resolved",
    title: resolution.winningTitle,
    description: `${resolution.publicSummary} (tie-break: ${resolution.tieBreakMethod.replaceAll("_", " ")})`,
    latitude: hold.latitude,
    longitude: hold.longitude,
    occurredAt: window.resolvedAt,
  });

  state.resolvedWindows = [window, ...state.resolvedWindows].slice(0, 20);
  state.activeControlWindow = null;
}

/**
 * Run one authoritative tick against the local sandbox store.
 */
export async function runLocalTick(nowMs: number = Date.now()): Promise<{
  state: LocalGameState;
  metersAdvanced: number;
}> {
  let state = await ensureLocalState();

  // Sandbox demo loop: after completion, auto-restart so visitors always see walking.
  if (
    state.game.environment === "sandbox" &&
    (state.walker.status === "completed" || state.game.status === "completed")
  ) {
    const completedAt = state.game.completedAt
      ? Date.parse(state.game.completedAt)
      : 0;
    // Brief pause on finish screen, then restart (keep wallets)
    if (!completedAt || nowMs - completedAt > 8_000) {
      state = await resetLocalSandbox({ wipePlayers: false });
      // Fresh tick on new run
    }
  }

  const config = mergeGameConfig(state.game.config);
  const nowIso = new Date(nowMs).toISOString();

  // Resolve expired windows before movement
  if (state.activeControlWindow?.status === "open") {
    finalizeResolution(state, nowMs);
  }

  // Paid rest is the ONLY way the walk pauses. While it holds: no movement,
  // and the anchor rides forward so rest time never counts as walking time.
  const restUntilMs = state.paidRestUntil ? Date.parse(state.paidRestUntil) : null;
  if (restUntilMs && nowMs < restUntilMs) {
    if (state.walker.status !== "resting") {
      state.walker.status = "resting";
      state.walker.versionNumber += 1;
    }
    state.walker.currentSpeedMps = 0;
    state.walker.movementStartedAt = nowIso;
    state.worker = {
      lastTickAt: nowIso,
      tickCount: state.worker.tickCount + 1,
      lastError: null,
    };
    await saveLocalState(state);
    return { state, metersAdvanced: 0 };
  }
  if (restUntilMs && nowMs >= restUntilMs) {
    state.paidRestUntil = null;
    if (state.walker.status === "resting") {
      state.walker.status = "walking";
      const prevAnchor = state.walker.movementStartedAt
        ? Date.parse(state.walker.movementStartedAt)
        : nowMs;
      state.walker.movementStartedAt = new Date(
        restResumeAnchorMs(prevAnchor, nowMs, restUntilMs),
      ).toISOString();
      state.walker.versionNumber += 1;
      pushEvent(state, {
        eventType: "rest_over",
        title: "Back on the road",
        description: "Break's over — westbound again.",
        latitude: state.walker.latitude,
        longitude: state.walker.longitude,
        occurredAt: nowIso,
      });
    }
  }

  const result = tickWalker({
    nowMs,
    walker: state.walker,
    game: toEngineGameMeta(state),
    segments: state.segments,
    config,
  });

  const metersAdvanced = result.metersAdvanced;

  if (result.dirty) {
    state.walker = result.walker;
    state.game.status = result.gameStatus;
    state.game.completionLocked = result.completionLocked;
    if (result.gameStatus === "completed" && !state.game.completedAt) {
      state.game.completedAt = nowIso;
    }
    for (const event of result.events) {
      pushEvent(state, {
        eventType: event.eventType,
        title: event.title,
        description: event.description,
        latitude: event.latitude,
        longitude: event.longitude,
        occurredAt: nowIso,
      });
    }
  }

  // Open new window if we hit a decision trigger (and none active)
  maybeOpenControlWindow(state, config, nowMs);

  state.worker = {
    lastTickAt: nowIso,
    tickCount: state.worker.tickCount + 1,
    lastError: null,
  };

  await saveLocalState(state);
  return { state, metersAdvanced };
}

export async function loadLiveFromLocalEngine(
  playerId?: string | null,
): Promise<LiveGamePayload> {
  const { state } = await runLocalTick();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  let player: PlayerPublicView | null = null;
  if (playerId && state.players[playerId]) {
    const p = state.players[playerId]!;
    player = {
      id: p.id,
      displayName: p.displayName,
      faction: p.faction,
      availableBalance: p.availableBalance,
      lifetimeCreditsSpent: p.lifetimeCreditsSpent,
    };
  }

  return {
    source: "fallback",
    game: state.game,
    walker: walkerToSnapshot(
      state.game.id,
      state.walker,
      state.segments,
      nowIso,
    ),
    heading: headingAlongRoute(state.segments, state.walker.segmentIndex),
    segments: state.segments,
    events: state.events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      occurredAt: e.occurredAt,
      eventType: e.eventType,
    })),
    controlWindow: controlPublicView(state, nowMs),
    factionStats: state.factionStats,
    player,
    error: null,
  };
}

export async function getLocalWorkerHealth(): Promise<WorkerHealth> {
  const state = await ensureLocalState();
  return {
    lastTickAt: state.worker.lastTickAt,
    tickCount: state.worker.tickCount,
    lastError: state.worker.lastError,
    store: "local",
    stateVersion: state.walker.versionNumber,
    walkerStatus: state.walker.status,
    gameStatus: state.game.status,
    activeWindow: state.activeControlWindow?.id ?? null,
  };
}

export async function registerOrGetPlayer(params: {
  playerId: string;
  displayName?: string;
}): Promise<LocalPlayer> {
  const state = await ensureLocalState();
  const nowIso = new Date().toISOString();
  const existing = state.players[params.playerId];
  if (existing) return existing;

  const config = mergeGameConfig(state.game.config);
  const player: LocalPlayer = {
    id: params.playerId,
    displayName: params.displayName?.trim() || `Player-${params.playerId.slice(0, 6)}`,
    faction: "neutral",
    availableBalance: 0,
    lifetimeCreditsAdded: 0,
    lifetimeCreditsSpent: 0,
    successfulContributions: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Grant free test credits on first registration
  const keys = new Set(state.ledger.map((l) => l.idempotencyKey));
  const grant = creditPromotional({
    player,
    amount: config.freeTestCreditsOnSignup,
    idempotencyKey: `signup-${player.id}`,
    existingKeys: keys,
    nowIso,
  });
  if (grant.ok) {
    state.players[player.id] = grant.player;
    state.ledger.push(grant.entry);
  } else {
    state.players[player.id] = player;
  }

  await saveLocalState(state);
  return state.players[player.id]!;
}

export async function setPlayerFaction(params: {
  playerId: string;
  faction: Faction;
}): Promise<LocalPlayer> {
  await ensureLocalState();
  await runLocalTick(); // refresh
  const fresh = await ensureLocalState();
  const player = fresh.players[params.playerId];
  if (!player) {
    throw new Error("Player not found — join first");
  }

  // Block faction change mid-window after contributing
  if (fresh.activeControlWindow?.status === "open") {
    const contributed = fresh.contributions.some(
      (c) =>
        c.playerId === params.playerId &&
        c.controlWindowId === fresh.activeControlWindow?.id,
    );
    if (contributed) {
      throw new Error("Cannot change faction after contributing this window");
    }
  }

  player.faction = params.faction;
  player.updatedAt = new Date().toISOString();
  fresh.players[params.playerId] = player;
  await saveLocalState(fresh);
  return player;
}

export type ContributeResult =
  | {
      ok: true;
      balance: number;
      window: ControlPublicView;
    }
  | { ok: false; error: string; code: string };

export async function contributeToOption(params: {
  playerId: string;
  windowId: string;
  optionId: string;
  credits: number;
  idempotencyKey: string;
}): Promise<ContributeResult> {
  // Serialize via load-modify-save (single Node process)
  await runLocalTick();
  const state = await ensureLocalState();
  const config = mergeGameConfig(state.game.config);
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const window = state.activeControlWindow;
  if (!window || window.id !== params.windowId) {
    return { ok: false, error: "Control window not active", code: "stale_window" };
  }
  if (window.status !== "open" || nowMs >= Date.parse(window.closesAt)) {
    finalizeResolution(state, nowMs);
    await saveLocalState(state);
    return { ok: false, error: "Control window closed", code: "window_closed" };
  }

  const player = state.players[params.playerId];
  if (!player) {
    return { ok: false, error: "Join the game first", code: "no_player" };
  }

  if (
    params.credits < config.contributionMinimumCredits ||
    params.credits > config.contributionMaximumCredits
  ) {
    return {
      ok: false,
      error: `Credits must be between ${config.contributionMinimumCredits} and ${config.contributionMaximumCredits}`,
      code: "invalid_amount",
    };
  }

  const option = window.options.find((o) => o.id === params.optionId);
  if (!option) {
    return { ok: false, error: "Invalid option", code: "invalid_option" };
  }

  // Idempotent replay
  const existing = state.contributions.find(
    (c) =>
      c.playerId === params.playerId &&
      c.idempotencyKey === params.idempotencyKey,
  );
  if (existing) {
    return {
      ok: true,
      balance: player.availableBalance,
      window: controlPublicView(state, nowMs)!,
    };
  }

  const keys = new Set(state.ledger.map((l) => l.idempotencyKey));
  const debit = debitCredits({
    player,
    amount: params.credits,
    idempotencyKey: params.idempotencyKey,
    existingKeys: keys,
    nowIso,
    relatedControlWindowId: window.id,
    metadata: { optionId: option.id },
  });

  if (!debit.ok) {
    return { ok: false, error: debit.error, code: debit.code };
  }

  state.players[params.playerId] = debit.player;
  state.ledger.push(debit.entry);

  const beforeLead = window.options.reduce(
    (best, o) => (o.totalCredits > best.totalCredits ? o : best),
    window.options[0]!,
  );

  const updatedOption = applyContributionToOption(
    option,
    params.playerId,
    params.credits,
    nowIso,
  );
  window.options = window.options.map((o) =>
    o.id === option.id ? updatedOption : o,
  );

  // Update lastLeadAt only if this option takes sole lead
  const newLead = window.options.reduce(
    (best, o) => (o.totalCredits > best.totalCredits ? o : best),
    window.options[0]!,
  );
  if (
    newLead.id === updatedOption.id &&
    newLead.totalCredits > beforeLead.totalCredits
  ) {
    window.options = window.options.map((o) =>
      o.id === newLead.id ? { ...o, lastLeadAt: nowIso } : o,
    );
  }

  state.contributions.push({
    id: randomUUID(),
    playerId: params.playerId,
    controlWindowId: window.id,
    controlOptionId: option.id,
    credits: params.credits,
    idempotencyKey: params.idempotencyKey,
    createdAt: nowIso,
  });

  const spentFaction = debit.player.faction;
  if (spentFaction === "finisher" || spentFaction === "drifter") {
    state.factionStats[spentFaction].creditsSpent += params.credits;
  } else if (
    option.factionAffinity === "finisher" ||
    option.factionAffinity === "drifter"
  ) {
    state.factionStats[option.factionAffinity].creditsSpent += params.credits;
  }

  state.activeControlWindow = window;
  await saveLocalState(state);

  return {
    ok: true,
    balance: debit.player.availableBalance,
    window: controlPublicView(state, nowMs)!,
  };
}

/** Admin helper: open a test window immediately. */
export async function forceOpenControlWindow(): Promise<ControlPublicView | null> {
  const state = await ensureLocalState();
  if (state.activeControlWindow) {
    return controlPublicView(state, Date.now());
  }
  const config = mergeGameConfig(state.game.config);
  const pending = state.decisionPoints.find((d) => !d.resolved);
  if (!pending) {
    // Re-arm a synthetic point
    state.decisionPoints.push({
      id: `dp-force-${Date.now()}`,
      triggerCumulativeMeters: state.walker.totalDistanceWalkedMeters,
      label: "Admin test fork",
      resolved: false,
    });
  }
  // Force trigger by setting walked past next point
  const next = state.decisionPoints.find((d) => !d.resolved)!;
  next.triggerCumulativeMeters = Math.min(
    next.triggerCumulativeMeters,
    state.walker.totalDistanceWalkedMeters,
  );
  maybeOpenControlWindow(state, config, Date.now());
  await saveLocalState(state);
  return controlPublicView(state, Date.now());
}

/** Result envelope shared by paid direct actions. */
type PaidActionFailure = { ok: false; error: string };

function paidActionGuards(
  state: LocalGameState,
  playerId: string,
): PaidActionFailure | { ok: true; player: LocalPlayer } {
  if (state.game.status === "completed" || state.game.completionLocked) {
    return { ok: false, error: "The journey is complete — it cannot change." };
  }
  const player = state.players[playerId];
  if (!player) {
    return { ok: false, error: "No player found — join from the live page first." };
  }
  return { ok: true, player };
}

/**
 * Paid rest: he never stops walking on his own — supporters buy him and
 * Beacon a break. Stacks: a second purchase extends the current rest.
 */
export async function purchaseRestBreak(params: {
  playerId: string;
  idempotencyKey: string;
}): Promise<
  | { ok: true; restUntil: string; balance: number }
  | PaidActionFailure
> {
  const state = await ensureLocalState();
  const guard = paidActionGuards(state, params.playerId);
  if (!guard.ok) return guard;

  const config = mergeGameConfig(state.game.config);
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const keys = new Set(state.ledger.map((l) => l.idempotencyKey));
  const debit = debitCredits({
    player: guard.player,
    amount: config.paidActions.restBreakCredits,
    idempotencyKey: params.idempotencyKey,
    existingKeys: keys,
    nowIso,
    metadata: { action: "rest_break" },
  });
  if (!debit.ok) return { ok: false, error: debit.error };
  state.ledger.push(debit.entry);
  state.players[guard.player.id] = debit.player;

  const baseMs = state.paidRestUntil
    ? Math.max(nowMs, Date.parse(state.paidRestUntil))
    : nowMs;
  const restUntil = new Date(
    baseMs + config.paidActions.restBreakRealMinutes * 60_000,
  ).toISOString();
  state.paidRestUntil = restUntil;
  state.directActions.unshift({
    id: `act-rest-${nowMs}`,
    type: "rest_break",
    playerId: guard.player.id,
    credits: config.paidActions.restBreakCredits,
    label: `${config.paidActions.restBreakRealMinutes}-minute rest`,
    waypoint: null,
    createdAt: nowIso,
  });
  pushEvent(state, {
    eventType: "paid_rest",
    title: "A kind supporter bought them a rest",
    description: `${guard.player.displayName} gave ${config.walkerName} and ${config.companionDog.name} a ${config.paidActions.restBreakRealMinutes}-minute break.`,
    latitude: state.walker.latitude,
    longitude: state.walker.longitude,
    occurredAt: nowIso,
  });
  await saveLocalState(state);
  return { ok: true, restUntil, balance: debit.player.availableBalance };
}

/**
 * Paid waypoint send: walk to any chosen point (within the configured
 * range), then the route recalculates onward to the final destination.
 */
export async function purchaseWaypointSend(params: {
  playerId: string;
  latitude: number;
  longitude: number;
  label?: string;
  idempotencyKey: string;
}): Promise<
  | {
      ok: true;
      addedMiles: number;
      remainingMiles: number;
      balance: number;
    }
  | PaidActionFailure
> {
  const state = await ensureLocalState();
  const guard = paidActionGuards(state, params.playerId);
  if (!guard.ok) return guard;
  if (state.activeControlWindow?.status === "open") {
    return {
      ok: false,
      error: "A route vote is in progress — try again after it closes.",
    };
  }

  const config = mergeGameConfig(state.game.config);
  const current = {
    latitude: state.walker.latitude,
    longitude: state.walker.longitude,
  };
  const waypoint = { latitude: params.latitude, longitude: params.longitude };
  const legMiles = haversineMeters(current, waypoint) / 1609.344;
  if (legMiles < 0.02) {
    return { ok: false, error: "They are already there — pick somewhere farther." };
  }
  if (legMiles > config.paidActions.waypointMaxDetourMiles) {
    return {
      ok: false,
      error: `That's ${Math.round(legMiles)} miles away — the limit is ${config.paidActions.waypointMaxDetourMiles}.`,
    };
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const keys = new Set(state.ledger.map((l) => l.idempotencyKey));
  const debit = debitCredits({
    player: guard.player,
    amount: config.paidActions.waypointCredits,
    idempotencyKey: params.idempotencyKey,
    existingKeys: keys,
    nowIso,
    metadata: { action: "waypoint_send", label: params.label ?? null },
  });
  if (!debit.ok) return { ok: false, error: debit.error };
  state.ledger.push(debit.entry);
  state.players[guard.player.id] = debit.player;

  const previousRemainingMeters = state.walker.projectedRemainingMeters;
  const routeVersionId = `rv-wp-${nowMs}`;
  const { segments, totalDistanceMeters } = rebuildThroughWaypoint({
    current,
    waypoint,
    destination: state.game.destination,
    routeVersionId,
  });

  state.segments = segments;
  state.walker.segmentIndex = 0;
  state.walker.distanceIntoSegmentMeters = 0;
  state.walker.projectedRemainingMeters = totalDistanceMeters;
  // The tick derives remaining from total route length minus miles walked —
  // the rebuilt route's length is what's ahead plus what's already behind.
  state.walker.originalRouteDistanceMeters =
    state.walker.totalDistanceWalkedMeters + totalDistanceMeters;
  state.walker.movementStartedAt = nowIso;
  state.walker.versionNumber += 1;

  const label =
    params.label?.trim() ||
    `${waypoint.latitude.toFixed(3)}, ${waypoint.longitude.toFixed(3)}`;
  const addedMiles = Math.max(
    0,
    (totalDistanceMeters - previousRemainingMeters) / 1609.344,
  );
  state.directActions.unshift({
    id: `act-wp-${nowMs}`,
    type: "waypoint_send",
    playerId: guard.player.id,
    credits: config.paidActions.waypointCredits,
    label,
    waypoint,
    createdAt: nowIso,
  });
  pushEvent(state, {
    eventType: "waypoint_send",
    title: "Detour purchased",
    description: `${guard.player.displayName} is sending them to ${label} — about ${addedMiles.toFixed(1)} extra miles before the Pacific. Route recalculated.`,
    latitude: current.latitude,
    longitude: current.longitude,
    occurredAt: nowIso,
  });
  await saveLocalState(state);
  return {
    ok: true,
    addedMiles,
    remainingMiles: totalDistanceMeters / 1609.344,
    balance: debit.player.availableBalance,
  };
}
