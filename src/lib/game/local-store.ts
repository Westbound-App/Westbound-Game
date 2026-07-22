/**
 * File-backed local game store for sandbox when Supabase is not configured.
 * Persists across Next.js restarts and browser closes.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  defaultGameConfig,
  mergeGameConfig,
  resolveEffectiveSpeedMps,
} from "@/lib/config/game-config";
import { buildDecisionPoints } from "@/lib/game/control-window-factory";
import {
  getFallbackEvents,
  getFallbackGameView,
  getFallbackSegments,
  SANDBOX_GAME_ID,
} from "@/lib/game/sandbox-fallback";
import type { EngineGameMeta, EngineWalkerState } from "@/lib/game/tick";
import type {
  ContributionRecord,
  ControlWindowState,
  DecisionPointPlan,
  DirectActionRecord,
  FactionTotals,
  InterventionRecord,
  LocalPlayer,
  WalletLedgerEntry,
} from "@/lib/types/control";
import type { GamePublicView, RouteSegment } from "@/lib/types/domain";

export type LocalGameEvent = {
  id: string;
  eventType: string;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  occurredAt: string;
};

export type LocalGameState = {
  schemaVersion: number;
  game: GamePublicView;
  walker: EngineWalkerState;
  segments: RouteSegment[];
  /** Original baseline segments for miles-added comparison. */
  originalSegments: RouteSegment[];
  events: LocalGameEvent[];
  decisionPoints: DecisionPointPlan[];
  activeControlWindow: ControlWindowState | null;
  resolvedWindows: ControlWindowState[];
  contributions: ContributionRecord[];
  interventions: InterventionRecord[];
  /** Wall-clock ISO until which a paid rest holds the walk, if any */
  paidRestUntil: string | null;
  directActions: DirectActionRecord[];
  players: Record<string, LocalPlayer>;
  ledger: WalletLedgerEntry[];
  factionStats: {
    finisher: FactionTotals;
    drifter: FactionTotals;
  };
  worker: {
    lastTickAt: string | null;
    tickCount: number;
    lastError: string | null;
  };
};

const SCHEMA_VERSION = 3;

/**
 * Storage resolution: prefer the project .data dir (dev), fall back to the
 * OS temp dir (serverless hosts mount the project read-only), fall back to
 * memory only. Persistence is best-effort — the game API must never crash
 * because a filesystem is read-only.
 */
const CANDIDATE_DIRS = [
  path.join(process.cwd(), ".data"),
  path.join(os.tmpdir(), "westbound-data"),
];

let resolvedDir: string | null | undefined;
let memoryState: LocalGameState | null = null;

/** First candidate directory that can actually be created. Exported for tests. */
export async function firstWritableDir(
  candidates: string[],
): Promise<string | null> {
  for (const dir of candidates) {
    try {
      await fs.mkdir(dir, { recursive: true });
      return dir;
    } catch {
      // Read-only or forbidden — try the next candidate.
    }
  }
  return null;
}

async function resolveDataDir(): Promise<string | null> {
  if (resolvedDir !== undefined) return resolvedDir;
  resolvedDir = await firstWritableDir(CANDIDATE_DIRS);
  return resolvedDir;
}

async function stateFilePath(): Promise<string | null> {
  const dir = await resolveDataDir();
  return dir ? path.join(dir, "local-game.json") : null;
}

function emptyFaction(): FactionTotals {
  return {
    creditsSpent: 0,
    windowsWon: 0,
    milesAdded: 0,
    milesPrevented: 0,
  };
}

function createInitialState(now = new Date()): LocalGameState {
  const game = getFallbackGameView();
  game.startedAt = now.toISOString();
  game.config = {
    ...game.config,
    // Slow enough to watch the character walk streets (~several minutes)
    sandboxSpeedMultiplier: 4,
    decisionWindowDurationSeconds: 45,
    // Preview NYC / Akron / Canyon packs as he progresses (visual QA only)
    scenicVisualDemoMode: true,
    companionDog: {
      name: "Beacon",
      breedMix: "Bernese Mountain Dog × Siberian Husky",
      description:
        "Mostly black with white chest, paws, and muzzle; a little chunky like a Bernese, with a playful husky face. Walks with him and around him.",
    },
  };
  game.companionDog = {
    name: "Beacon",
    breedMix: "Bernese Mountain Dog × Siberian Husky",
    description:
      "Mostly black with white chest, paws, and muzzle; a little chunky like a Bernese, with a playful husky face. Walks with him and around him.",
  };

  const segments = getFallbackSegments();
  const config = mergeGameConfig(game.config);
  const speed = resolveEffectiveSpeedMps(config, "sandbox");
  const total = segments.reduce((s, seg) => s + seg.distanceMeters, 0);

  const walker: EngineWalkerState = {
    status: "walking",
    latitude: game.start.latitude,
    longitude: game.start.longitude,
    segmentIndex: 0,
    distanceIntoSegmentMeters: 0,
    totalDistanceWalkedMeters: 0,
    originalRouteDistanceMeters: total,
    projectedRemainingMeters: total,
    currentSpeedMps: speed,
    movementStartedAt: now.toISOString(),
    nextStateChangeAt: null,
    versionNumber: 1,
  };

  const seedEvents = getFallbackEvents().map((e) => ({
    id: e.id,
    eventType: e.eventType,
    title: e.title,
    description:
      "Local sandbox engine is running. Progress continues even if you close the browser. Control windows open at route forks.",
    latitude: game.start.latitude,
    longitude: game.start.longitude,
    occurredAt: e.occurredAt,
  }));

  return {
    schemaVersion: SCHEMA_VERSION,
    game,
    walker,
    segments,
    originalSegments: segments.map((s) => ({ ...s })),
    events: seedEvents,
    decisionPoints: buildDecisionPoints(total),
    activeControlWindow: null,
    resolvedWindows: [],
    contributions: [],
    interventions: [],
    paidRestUntil: null,
    directActions: [],
    players: {},
    ledger: [],
    factionStats: {
      finisher: emptyFaction(),
      drifter: emptyFaction(),
    },
    worker: {
      lastTickAt: null,
      tickCount: 0,
      lastError: null,
    },
  };
}

function migrateState(raw: LocalGameState): LocalGameState {
  const base = createInitialState();
  const merged: LocalGameState = {
    ...base,
    ...raw,
    schemaVersion: SCHEMA_VERSION,
    game: {
      ...base.game,
      ...raw.game,
      companionDog: raw.game?.companionDog ?? base.game.companionDog,
    },
    originalSegments: raw.originalSegments?.length
      ? raw.originalSegments
      : raw.segments ?? base.segments,
    decisionPoints: raw.decisionPoints?.length
      ? raw.decisionPoints
      : buildDecisionPoints(
          (raw.segments ?? base.segments).reduce(
            (s, seg) => s + seg.distanceMeters,
            0,
          ),
        ),
    activeControlWindow: raw.activeControlWindow ?? null,
    resolvedWindows: raw.resolvedWindows ?? [],
    contributions: raw.contributions ?? [],
    interventions: raw.interventions ?? [],
    paidRestUntil: raw.paidRestUntil ?? null,
    directActions: raw.directActions ?? [],
    players: raw.players ?? {},
    ledger: raw.ledger ?? [],
    factionStats: raw.factionStats ?? base.factionStats,
    worker: raw.worker ?? base.worker,
  };
  return merged;
}

export async function ensureLocalState(): Promise<LocalGameState> {
  const file = await stateFilePath();
  if (file) {
    try {
      const raw = await fs.readFile(file, "utf8");
      const parsed = JSON.parse(raw) as LocalGameState;
      if (!parsed.walker || !parsed.segments?.length) {
        throw new Error("Invalid local state");
      }
      if (
        parsed.schemaVersion !== SCHEMA_VERSION ||
        !parsed.players ||
        !parsed.decisionPoints
      ) {
        const migrated = migrateState(parsed);
        await saveLocalState(migrated);
        return migrated;
      }
      memoryState = parsed;
      return parsed;
    } catch {
      // Missing or corrupt file — fall through to memory / fresh state.
    }
  }
  if (memoryState) return memoryState;
  const initial = createInitialState();
  await saveLocalState(initial);
  return initial;
}

export async function saveLocalState(state: LocalGameState): Promise<void> {
  // Memory is the source of truth within a warm process; disk is best-effort
  // durability for restarts. Never throw from persistence.
  memoryState = state;
  const file = await stateFilePath();
  if (!file) return;
  try {
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
    await fs.rename(tmp, file);
  } catch {
    // Read-only filesystem — keep serving from memory.
    resolvedDir = null;
  }
}

export function toEngineGameMeta(state: LocalGameState): EngineGameMeta {
  return {
    environment: state.game.environment,
    destination: state.game.destination,
    destinationRadiusMeters: state.game.destinationRadiusMeters,
    completionLocked: state.game.completionLocked,
    gameStatus: state.game.status,
    startedAt: state.game.startedAt ?? new Date().toISOString(),
  };
}

export function getLocalConfig() {
  return mergeGameConfig(defaultGameConfig);
}

/** Reset sandbox for local testing. Keeps players/wallets. */
export async function resetLocalSandbox(opts?: {
  wipePlayers?: boolean;
}): Promise<LocalGameState> {
  const prev = await ensureLocalState().catch(() => null);
  const initial = createInitialState();
  if (prev && !opts?.wipePlayers) {
    initial.players = prev.players;
    initial.ledger = prev.ledger;
  }
  await saveLocalState(initial);
  return initial;
}

export function getLocalStatePath(): string {
  if (resolvedDir === null) return "(in-memory only — read-only filesystem)";
  const dir = resolvedDir ?? CANDIDATE_DIRS[0];
  return path.join(dir, "local-game.json");
}

export { SANDBOX_GAME_ID };
