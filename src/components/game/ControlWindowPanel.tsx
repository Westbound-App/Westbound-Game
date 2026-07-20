"use client";

import { useState } from "react";
import type { ControlPublicView } from "@/lib/types/control";

type Props = {
  window: ControlPublicView | null;
  playerId: string | null;
  canSpend: boolean;
  onContributed: () => void;
};

const AMOUNTS = [50, 100, 250, 500];

export function ControlWindowPanel({
  window,
  playerId,
  canSpend,
  onContributed,
}: Props) {
  const [busyOption, setBusyOption] = useState<string | null>(null);
  const [amount, setAmount] = useState(100);
  const [error, setError] = useState<string | null>(null);

  if (!window || window.status !== "open") {
    return (
      <section
        aria-label="Control window"
        className="rounded-xl border border-dashed border-[var(--color-asphalt)]/60 bg-[var(--color-navy)]/40 p-4"
      >
        <h2 className="text-sm font-semibold tracking-wide text-[var(--color-cream)]">
          Control window
        </h2>
        <p className="mt-1 text-sm text-[var(--color-cream)]/65">
          {window?.status === "resolved"
            ? window.resolution?.publicSummary ?? "Window resolved."
            : "No decision is open. When he reaches a fork, you can spend credits here."}
        </p>
      </section>
    );
  }

  async function contribute(optionId: string) {
    if (!playerId || !window) return;
    setBusyOption(optionId);
    setError(null);
    try {
      const res = await fetch(
        `/api/control-windows/${window.id}/contributions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId,
            optionId,
            credits: amount,
            idempotencyKey: `${playerId}-${window.id}-${optionId}-${Date.now()}`,
          }),
        },
      );
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "Contribution failed");
      } else {
        onContributed();
      }
    } catch {
      setError("Network error");
    } finally {
      setBusyOption(null);
    }
  }

  const maxCredits = Math.max(...window.options.map((o) => o.totalCredits), 1);

  return (
    <section
      aria-label="Active control window"
      className="rounded-xl border border-[var(--color-rust)]/50 bg-[var(--color-navy)]/60 p-4 shadow-lg"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-rust)]">
            Decision open
          </p>
          <h2 className="text-base font-semibold text-[var(--color-cream)]">
            {window.decisionLabel}
          </h2>
        </div>
        <div
          className="rounded-full bg-[var(--color-rust)] px-3 py-1 font-mono text-sm text-white"
          role="timer"
          aria-live="polite"
        >
          {window.secondsRemaining}s
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-cream)]/60">
        <span>Spend:</span>
        {AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAmount(a)}
            className={`rounded-md px-2 py-1 ${
              amount === a
                ? "bg-[var(--color-gold)] text-[var(--color-navy)]"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            {a}
          </button>
        ))}
        <span className="text-[var(--color-cream)]/40">credits</span>
      </div>

      {!canSpend && (
        <p className="mt-2 text-xs text-[var(--color-tan)]">
          Join and pick a side to spend credits.
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-[var(--color-rust)]" role="alert">
          {error}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {window.options.map((opt) => {
          const pct = Math.round((opt.totalCredits / maxCredits) * 100);
          const isDetour =
            opt.optionType === "northern_detour" ||
            opt.optionType === "southern_detour";
          return (
            <li
              key={opt.id}
              className="overflow-hidden rounded-lg border border-white/10 bg-black/25"
            >
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--color-cream)]">
                      {opt.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-cream)]/60">
                      {opt.description}
                      {opt.landmarkLabel ? ` · ${opt.landmarkLabel}` : ""}
                      {isDetour
                        ? ` · +~${(opt.additionalDistanceMeters / 1609.344).toFixed(1)} mi`
                        : ""}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-tan)]">
                      {opt.factionAffinity}s · {opt.contributorCount}{" "}
                      contributors
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-[var(--color-gold)]">
                      {opt.totalCredits.toLocaleString()}
                    </p>
                    <button
                      type="button"
                      disabled={!canSpend || busyOption !== null}
                      onClick={() => void contribute(opt.id)}
                      className="mt-1 rounded-md bg-white/10 px-2 py-1 text-xs text-[var(--color-cream)] hover:bg-white/20 disabled:opacity-40"
                    >
                      {busyOption === opt.id ? "…" : `+${amount}`}
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${
                      isDetour
                        ? "bg-[var(--color-rust)]"
                        : "bg-[var(--color-forest)]"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
