"use client";

import { useEffect, useState } from "react";
import type { ControlPublicView, PlayerPublicView } from "@/lib/types/control";

const AMOUNTS = [50, 100, 250];
const METERS_PER_MILE = 1609.344;

type Props = {
  window: ControlPublicView | null;
  player: PlayerPublicView | null;
  onContribute: (optionId: string, credits: number) => Promise<string | null>;
};

function remainingSeconds(closesAt: string): number {
  return Math.max(0, Math.round((Date.parse(closesAt) - Date.now()) / 1000));
}

/** Smooth 1s countdown between polls, derived from the closing timestamp. */
function useCountdown(closesAt: string | null, initial: number): number {
  const [seconds, setSeconds] = useState(initial);
  useEffect(() => {
    if (!closesAt) return;
    const update = () => setSeconds(remainingSeconds(closesAt));
    const kickoff = setTimeout(update, 0);
    const t = setInterval(update, 1000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(t);
    };
  }, [closesAt]);
  return closesAt ? seconds : 0;
}

/**
 * The route vote. Appears only while a decision window is open — the rest
 * of the time the journey plays uninterrupted, per the product spec.
 */
export function DecisionPanel({ window, player, onContribute }: Props) {
  const [amount, setAmount] = useState(100);
  const [busyOption, setBusyOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seconds = useCountdown(
    window?.closesAt ?? null,
    window?.secondsRemaining ?? 0,
  );

  if (!window || window.status !== "open") return null;

  const totalCredits = window.options.reduce((s, o) => s + o.totalCredits, 0);

  async function contribute(optionId: string) {
    setBusyOption(optionId);
    setError(null);
    const failure = await onContribute(optionId, amount);
    if (failure) setError(failure);
    setBusyOption(null);
  }

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-24 z-10 px-4 sm:bottom-28">
      <section
        aria-label="Route decision"
        className="mx-auto w-full max-w-xl rounded-2xl border border-amber-300/25 bg-black/70 p-4 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
              The crowd is deciding
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-white">
              {window.decisionLabel}
            </h2>
          </div>
          <div
            className="rounded-full bg-amber-400/90 px-3 py-1 font-mono text-sm font-semibold text-black"
            role="timer"
            aria-live="polite"
          >
            {seconds}s
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {window.options.map((option) => {
            const share =
              totalCredits > 0 ? option.totalCredits / totalCredits : 0;
            const addedMiles =
              option.additionalDistanceMeters / METERS_PER_MILE;
            return (
              <button
                key={option.id}
                type="button"
                disabled={busyOption !== null}
                onClick={() => void contribute(option.id)}
                className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-left transition hover:border-amber-300/50 hover:bg-white/10 disabled:opacity-60"
              >
                {/* Support share fill */}
                <div
                  className="absolute inset-y-0 left-0 bg-amber-400/15 transition-all"
                  style={{ width: `${Math.round(share * 100)}%` }}
                />
                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {option.title}
                    </p>
                    <p className="text-xs text-white/60">
                      {addedMiles > 0.05
                        ? `adds ${addedMiles.toFixed(1)} scenic miles`
                        : "the direct road west"}
                      {option.contributorCount > 0
                        ? ` · ${option.contributorCount} supporter${option.contributorCount === 1 ? "" : "s"}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-amber-200">
                      {option.totalCredits}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/45">
                      {busyOption === option.id ? "sending…" : "credits"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
          <div className="flex items-center gap-1.5">
            <span>Contribute</span>
            {AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                className={`rounded-full px-2.5 py-1 font-mono ${
                  amount === a
                    ? "bg-amber-400/90 font-semibold text-black"
                    : "bg-white/10 text-white/80 hover:bg-white/15"
                }`}
              >
                {a}
              </button>
            ))}
            <span>credits, then tap a route</span>
          </div>
          {player ? (
            <span className="font-mono text-white/70">
              balance {player.availableBalance}
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="mt-2 text-xs text-red-300">{error}</p>
        ) : null}
      </section>
    </div>
  );
}
