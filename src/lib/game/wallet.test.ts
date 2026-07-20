import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { creditPromotional, debitCredits } from "@/lib/game/wallet";
import type { LocalPlayer } from "@/lib/types/control";

function player(balance: number): LocalPlayer {
  return {
    id: "p1",
    displayName: "Test",
    faction: "neutral",
    availableBalance: balance,
    lifetimeCreditsAdded: balance,
    lifetimeCreditsSpent: 0,
    successfulContributions: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("wallet", () => {
  it("prevents overspend", () => {
    const result = debitCredits({
      player: player(50),
      amount: 100,
      idempotencyKey: "k1",
      existingKeys: new Set(),
      nowIso: "2026-01-01T00:00:01.000Z",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "insufficient");
  });

  it("deducts atomically on success", () => {
    const result = debitCredits({
      player: player(200),
      amount: 75,
      idempotencyKey: "k2",
      existingKeys: new Set(),
      nowIso: "2026-01-01T00:00:01.000Z",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.player.availableBalance, 125);
      assert.equal(result.player.lifetimeCreditsSpent, 75);
      assert.equal(result.entry.balanceAfter, 125);
    }
  });

  it("rejects duplicate idempotency keys", () => {
    const result = debitCredits({
      player: player(200),
      amount: 10,
      idempotencyKey: "dup",
      existingKeys: new Set(["dup"]),
      nowIso: "2026-01-01T00:00:01.000Z",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "duplicate");
  });

  it("grants promotional credits once", () => {
    const first = creditPromotional({
      player: player(0),
      amount: 1000,
      idempotencyKey: "signup-p1",
      existingKeys: new Set(),
      nowIso: "2026-01-01T00:00:01.000Z",
    });
    assert.equal(first.ok, true);
    if (first.ok) assert.equal(first.player.availableBalance, 1000);

    const second = creditPromotional({
      player: first.ok ? first.player : player(1000),
      amount: 1000,
      idempotencyKey: "signup-p1",
      existingKeys: new Set(["signup-p1"]),
      nowIso: "2026-01-01T00:00:02.000Z",
    });
    assert.equal(second.ok, false);
  });
});
