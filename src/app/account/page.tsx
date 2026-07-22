"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";

const PLAYER_KEY = "westbound_player_id";

type AccountData = {
  player: {
    id: string;
    displayName: string;
    faction: string;
    availableBalance: number;
    lifetimeCreditsAdded: number;
    lifetimeCreditsSpent: number;
    successfulContributions: number;
    createdAt: string;
  };
  ledger: Array<{
    id: string;
    transactionType: string;
    amount: number;
    balanceAfter: number;
    createdAt: string;
  }>;
  contributions: Array<{
    id: string;
    credits: number;
    controlWindowId: string;
    createdAt: string;
  }>;
};

export default function AccountPage() {
  const [data, setData] = useState<AccountData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const kickoff = setTimeout(() => {
      const playerId = localStorage.getItem(PLAYER_KEY);
      if (!playerId) {
        setError("No local player yet. Join from the live page first.");
        setLoading(false);
        return;
      }

      void (async () => {
        try {
          // Ensure joined
          await fetch("/api/player/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId }),
          });
          const res = await fetch(
            `/api/player/account?playerId=${encodeURIComponent(playerId)}`,
            { cache: "no-store" },
          );
          if (!res.ok) throw new Error("Could not load account");
          setData((await res.json()) as AccountData);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed");
        } finally {
          setLoading(false);
        }
      })();
    }, 0);
    return () => clearTimeout(kickoff);
  }, []);

  return (
    <SiteShell>
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="text-sm text-[var(--color-tan)] hover:text-[var(--color-gold)]"
      >
        ← Live show
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-[var(--color-cream)]">
        Account & wallet
      </h1>
      <p className="mt-2 text-sm text-[var(--color-cream)]/65">
        Free test credits only. No real money in this build.
      </p>

      {loading && (
        <p className="mt-8 text-sm text-[var(--color-cream)]/50">Loading…</p>
      )}
      {error && (
        <p className="mt-8 text-sm text-[var(--color-rust)]" role="alert">
          {error}
        </p>
      )}

      {data && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Stat label="Name" value={data.player.displayName} />
            <Stat label="Faction" value={data.player.faction} />
            <Stat
              label="Balance"
              value={data.player.availableBalance.toLocaleString()}
            />
            <Stat
              label="Lifetime spent"
              value={data.player.lifetimeCreditsSpent.toLocaleString()}
            />
          </div>

          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold)]">
              Ledger
            </h2>
            {data.ledger.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-cream)]/50">
                No transactions yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.ledger.map((row) => (
                  <li
                    key={row.id}
                    className="flex justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="text-[var(--color-cream)]">
                        {row.transactionType.replaceAll("_", " ")}
                      </p>
                      <time className="text-xs text-[var(--color-cream)]/45">
                        {new Date(row.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <div className="text-right font-mono">
                      <p
                        className={
                          row.amount >= 0
                            ? "text-[var(--color-forest)]"
                            : "text-[var(--color-rust)]"
                        }
                      >
                        {row.amount >= 0 ? "+" : ""}
                        {row.amount}
                      </p>
                      <p className="text-xs text-[var(--color-cream)]/45">
                        bal {row.balanceAfter}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold)]">
              Contributions
            </h2>
            {data.contributions.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-cream)]/50">
                You have not spent on a control window yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.contributions.map((c) => (
                  <li
                    key={c.id}
                    className="flex justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <time className="text-[var(--color-cream)]/70">
                      {new Date(c.createdAt).toLocaleString()}
                    </time>
                    <span className="font-mono text-[var(--color-gold)]">
                      −{c.credits}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
    </SiteShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-cream)]/50">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium capitalize text-[var(--color-cream)]">
        {value}
      </p>
    </div>
  );
}
