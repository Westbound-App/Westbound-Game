"use client";

import type { Faction } from "@/lib/types/domain";
import type { PlayerPublicView } from "@/lib/types/control";

type Props = {
  player: PlayerPublicView | null;
  joining: boolean;
  onJoin: () => void;
  onFaction: (faction: Faction) => void;
};

export function PlayerBar({ player, joining, onJoin, onFaction }: Props) {
  if (!player) {
    return (
      <div className="rounded-xl border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 p-4">
        <p className="text-sm text-[var(--color-cream)]">
          Join to receive free test credits and influence the walker when a
          control window opens.
        </p>
        <button
          type="button"
          disabled={joining}
          onClick={onJoin}
          className="mt-3 rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-semibold text-[var(--color-navy)] disabled:opacity-50"
        >
          {joining ? "Joining…" : "Join with free credits"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-cream)]/50">
            You
          </p>
          <p className="font-medium text-[var(--color-cream)]">
            {player.displayName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-cream)]/50">
            Credits
          </p>
          <p className="font-mono text-lg text-[var(--color-gold)]">
            {player.availableBalance.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["finisher", "Finishers"],
            ["drifter", "Pathfinders"],
            ["neutral", "Watchers"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onFaction(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              player.faction === id
                ? id === "finisher"
                  ? "bg-[var(--color-forest)] text-white"
                  : id === "drifter"
                    ? "bg-[var(--color-rust)] text-white"
                    : "bg-white/20 text-white"
                : "bg-white/5 text-[var(--color-cream)]/70 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
