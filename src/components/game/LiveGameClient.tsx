"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ControlWindowPanel } from "@/components/game/ControlWindowPanel";
import { EventFeed } from "@/components/game/EventFeed";
import { FactionBattle } from "@/components/game/FactionBattle";
import { LiveMap } from "@/components/game/LiveMap";
import { PlayerBar } from "@/components/game/PlayerBar";
import { StatusBadge } from "@/components/game/StatusBadge";
import { StreetViewPanel } from "@/components/game/StreetViewPanel";
import { WalkerStage } from "@/components/game/WalkerStage";
import { WalkerStats } from "@/components/game/WalkerStats";
import type { LiveGamePayload } from "@/lib/game/load-live-state";
import type { Faction } from "@/lib/types/domain";

const PLAYER_KEY = "westbound_player_id";

type Props = {
  initial: LiveGamePayload;
  pollIntervalMs?: number;
};

function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(PLAYER_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(PLAYER_KEY, id);
  }
  return id;
}

export function LiveGameClient({ initial, pollIntervalMs = 1500 }: Props) {
  const [live, setLive] = useState(initial);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [connected, setConnected] = useState(true);
  const [lastFetchError, setLastFetchError] = useState<string | null>(null);

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId());
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const q = playerId ? `?playerId=${encodeURIComponent(playerId)}` : "";
      const res = await fetch(`/api/game/live${q}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as LiveGamePayload;
      setLive(data);
      setConnected(true);
      setLastFetchError(null);
    } catch (err) {
      setConnected(false);
      setLastFetchError(err instanceof Error ? err.message : "fetch failed");
    }
  }, [playerId]);

  useEffect(() => {
    if (!playerId) return;
    void (async () => {
      try {
        await fetch("/api/player/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });
        await fetchLive();
      } catch {
        /* ignore */
      }
    })();
  }, [playerId, fetchLive]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchLive();
    }, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [fetchLive, pollIntervalMs]);

  const displayWalker = live.walker;
  const isCompleted = displayWalker.status === "completed";

  const milesWalked = useMemo(
    () => displayWalker.totalDistanceWalkedMeters / 1609.344,
    [displayWalker.totalDistanceWalkedMeters],
  );

  async function handleJoin() {
    if (!playerId) return;
    setJoining(true);
    try {
      await fetch("/api/player/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      await fetchLive();
    } finally {
      setJoining(false);
    }
  }

  async function handleFaction(faction: Faction) {
    if (!playerId) return;
    await fetch("/api/player/faction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, faction }),
    });
    await fetchLive();
  }

  async function handleRestartWalk() {
    setResetting(true);
    try {
      await fetch("/api/admin/reset-sandbox", { method: "POST" });
      await fetchLive();
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--color-gold)]">
          Live game
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-cream)] sm:text-4xl">
          He is walking west
        </h1>
        <p className="mt-3 text-base text-[var(--color-cream)]/75 sm:text-lg">
          Watch the man on the road. When a control window opens, push him
          west—or the wrong way.
        </p>
      </div>

      {isCompleted && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-[var(--color-gold)]/50 bg-[var(--color-gold)]/15 px-4 py-4"
        >
          <p className="font-medium text-[var(--color-cream)]">
            He finished this sandbox loop.
          </p>
          <p className="mt-1 text-sm text-[var(--color-cream)]/70">
            It will auto-restart in a few seconds so you can watch him walk
            again—or restart now.
          </p>
          <button
            type="button"
            disabled={resetting}
            onClick={() => void handleRestartWalk()}
            className="mt-3 rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-semibold text-[var(--color-navy)] disabled:opacity-50"
          >
            {resetting ? "Restarting…" : "Start walking again"}
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={displayWalker.status} />
        <span className="text-sm text-[var(--color-cream)]/60">
          {live.game.name}
        </span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-tan)]">
          {live.game.environment} · v{displayWalker.stateVersion}
        </span>
        {connected ? (
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-forest)]">
            Live · {milesWalked.toFixed(3)} mi
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-rust)]">
            Offline {lastFetchError}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-4">
          {/* Character first — this is what people came to see */}
          <WalkerStage
            status={displayWalker.status}
            walkerName={live.game.walkerName}
            milesWalked={milesWalked}
            heading={live.heading ?? 270}
            locationLabel={`${displayWalker.latitude.toFixed(4)}°, ${displayWalker.longitude.toFixed(4)}°`}
          />

          <LiveMap
            start={live.game.start}
            destination={live.game.destination}
            walker={{
              latitude: displayWalker.latitude,
              longitude: displayWalker.longitude,
            }}
            segments={live.segments}
            status={displayWalker.status}
            heading={live.heading ?? 270}
          />

          <StreetViewPanel
            latitude={displayWalker.latitude}
            longitude={displayWalker.longitude}
            heading={live.heading ?? 270}
          />

          <WalkerStats
            walker={displayWalker}
            walkerName={live.game.walkerName}
          />
        </div>

        <div className="space-y-4">
          <PlayerBar
            player={live.player}
            joining={joining}
            onJoin={() => void handleJoin()}
            onFaction={(f) => void handleFaction(f)}
          />

          <ControlWindowPanel
            window={live.controlWindow}
            playerId={playerId}
            canSpend={Boolean(live.player)}
            onContributed={() => void fetchLive()}
          />

          <FactionBattle
            finisher={live.factionStats.finisher}
            drifter={live.factionStats.drifter}
          />

          <section aria-labelledby="events-heading">
            <h2
              id="events-heading"
              className="mb-3 text-sm font-semibold tracking-wide text-[var(--color-cream)]"
            >
              Journey feed
            </h2>
            <EventFeed events={live.events} />
          </section>
        </div>
      </div>
    </div>
  );
}
