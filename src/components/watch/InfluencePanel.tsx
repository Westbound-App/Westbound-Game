"use client";

import { useState } from "react";
import type { ControlPublicView, PlayerPublicView } from "@/lib/types/control";

type Props = {
  open: boolean;
  onClose: () => void;
  window: ControlPublicView | null;
  player: PlayerPublicView | null;
  onGiftRest: () => Promise<string | null>;
};

/**
 * The single "Influence the Journey" surface (LIVE_JOURNEY_VISION §3):
 * a calm preview of the few safe, kind ways viewers can take part.
 */
export function InfluencePanel({
  open,
  onClose,
  window,
  player,
  onGiftRest,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (!open) return null;

  async function giftRest() {
    setBusy(true);
    setNote(null);
    const failure = await onGiftRest();
    setNote(failure ?? "They're settling in for a break ❤");
    setBusy(false);
  }

  const voteOpen = window?.status === "open";

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Influence the journey"
        className="relative m-3 w-full max-w-md rounded-2xl border border-white/15 bg-[#10151c]/95 p-5 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
              Influence the journey
            </p>
            <p className="mt-1 text-sm text-white/70">
              Watching is always free. Influence is optional, gentle, and
              never puts them in harm&apos;s way.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/20"
          >
            close
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-sm font-medium text-white">Steer the route</p>
            <p className="mt-0.5 text-xs text-white/60">
              {voteOpen
                ? "A route decision is open right now — close this panel and the vote is on screen. Credits choose the road."
                : "When they reach a fork, a decision opens for everyone. Keep them west, or send them the scenic way."}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">
                  Gift them a rest
                </p>
                <p className="mt-0.5 text-xs text-white/60">
                  A 30-minute break by the roadside — Beacon usually finds
                  the shade first.
                </p>
              </div>
              <button
                onClick={() => void giftRest()}
                disabled={busy}
                className="shrink-0 rounded-full bg-amber-400/90 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 disabled:opacity-60"
              >
                {busy ? "sending…" : "200 credits"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-3">
            <p className="text-sm font-medium text-white/80">
              Send them somewhere
            </p>
            <p className="mt-0.5 text-xs text-white/50">
              Choose a town anywhere in America and they&apos;ll walk there
              before turning west again. Arriving with the influence update.
            </p>
          </div>
        </div>

        {note ? <p className="mt-3 text-xs text-amber-200">{note}</p> : null}

        <p className="mt-3 text-[11px] text-white/40">
          Free test credits during the preview
          {player ? ` · balance ${player.availableBalance}` : ""}.
        </p>
      </section>
    </div>
  );
}
