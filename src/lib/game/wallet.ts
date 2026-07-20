/**
 * Atomic wallet helpers for the local store.
 * Mirrors the rules that Supabase RPCs will enforce later.
 */

import type { LocalPlayer, WalletLedgerEntry } from "@/lib/types/control";

export type WalletOpResult =
  | { ok: true; player: LocalPlayer; entry: WalletLedgerEntry }
  | { ok: false; error: string; code: "insufficient" | "duplicate" | "invalid" };

export function debitCredits(params: {
  player: LocalPlayer;
  amount: number;
  idempotencyKey: string;
  existingKeys: Set<string>;
  nowIso: string;
  relatedControlWindowId?: string | null;
  metadata?: Record<string, unknown>;
}): WalletOpResult {
  const { player, amount, idempotencyKey, existingKeys, nowIso } = params;

  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be a positive integer", code: "invalid" };
  }

  if (existingKeys.has(idempotencyKey)) {
    return { ok: false, error: "Duplicate idempotency key", code: "duplicate" };
  }

  if (player.availableBalance < amount) {
    return {
      ok: false,
      error: "Insufficient credits",
      code: "insufficient",
    };
  }

  const balanceAfter = player.availableBalance - amount;
  const updated: LocalPlayer = {
    ...player,
    availableBalance: balanceAfter,
    lifetimeCreditsSpent: player.lifetimeCreditsSpent + amount,
    successfulContributions: player.successfulContributions + 1,
    updatedAt: nowIso,
  };

  const entry: WalletLedgerEntry = {
    id: `tx-${idempotencyKey}`,
    playerId: player.id,
    transactionType: "control_contribution",
    amount: -amount,
    balanceAfter,
    idempotencyKey,
    relatedControlWindowId: params.relatedControlWindowId ?? null,
    createdAt: nowIso,
    metadata: params.metadata ?? {},
  };

  return { ok: true, player: updated, entry };
}

export function creditPromotional(params: {
  player: LocalPlayer;
  amount: number;
  idempotencyKey: string;
  existingKeys: Set<string>;
  nowIso: string;
}): WalletOpResult {
  const { player, amount, idempotencyKey, existingKeys, nowIso } = params;

  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be a positive integer", code: "invalid" };
  }

  if (existingKeys.has(idempotencyKey)) {
    return { ok: false, error: "Already claimed", code: "duplicate" };
  }

  const balanceAfter = player.availableBalance + amount;
  const updated: LocalPlayer = {
    ...player,
    availableBalance: balanceAfter,
    lifetimeCreditsAdded: player.lifetimeCreditsAdded + amount,
    updatedAt: nowIso,
  };

  const entry: WalletLedgerEntry = {
    id: `tx-${idempotencyKey}`,
    playerId: player.id,
    transactionType: "promotional_credit",
    amount,
    balanceAfter,
    idempotencyKey,
    relatedControlWindowId: null,
    createdAt: nowIso,
    metadata: { reason: "free_test_credits" },
  };

  return { ok: true, player: updated, entry };
}
