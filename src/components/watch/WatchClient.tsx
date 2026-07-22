"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { LiveGamePayload } from "@/lib/game/load-live-state";
import type { SeasonId } from "@/lib/atmosphere/season";
import type { SceneBiome } from "@/lib/places/types";
import type { TimeOfDayId } from "@/lib/scene/presets";
import {
  makeParamReader,
  readReducedMotion,
  serverFalse,
  serverNull,
  staticSubscribe,
  subscribeReducedMotion,
} from "@/lib/client/prefs";
import { deriveSceneView } from "@/lib/media/scene-view";
import {
  MediaLayer,
  SCENE_STYLE,
  useSceneLayers,
} from "@/components/watch/MediaLayer";
import { DecisionPanel } from "@/components/watch/DecisionPanel";

const TOD_VALUES: TimeOfDayId[] = ["day", "golden_hour", "dusk", "night"];
const SEASON_VALUES: SeasonId[] = ["spring", "summer", "fall", "winter"];
const BIOME_VALUES: SceneBiome[] = [
  "new_england_town",
  "northeast_city",
  "midwest_industrial",
  "great_plains",
  "southwest_canyon",
  "pacific_coast",
  "generic_highway",
];

const readTod = makeParamReader("tod");
const readBiome = makeParamReader("biome");
const readSeason = makeParamReader("season");

/** Stable anonymous player identity, shared with the classic page. */
let cachedPlayerId: string | null = null;
function readPlayerId(): string | null {
  if (cachedPlayerId) return cachedPlayerId;
  try {
    let id = localStorage.getItem("westbound_player_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("westbound_player_id", id);
    }
    cachedPlayerId = id;
    return id;
  } catch {
    return null;
  }
}

function newIdempotencyKey(...parts: string[]): string {
  return `${parts.join("-")}-${Date.now()}`;
}

/**
 * /watch — slow-TV photoreal presentation. Resolves scene media from the
 * walker's authoritative state; media upgrades from placeholders to
 * character-locked generations without touching this component.
 * Review overrides: ?tod=night&biome=great_plains&season=fall
 */
export function WatchClient() {
  const [live, setLive] = useState<LiveGamePayload | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [clockTick, setClockTick] = useState(0);

  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    serverFalse,
  );
  const todParam = useSyncExternalStore(staticSubscribe, readTod, serverNull);
  const biomeParam = useSyncExternalStore(staticSubscribe, readBiome, serverNull);
  const seasonParam = useSyncExternalStore(staticSubscribe, readSeason, serverNull);
  const playerId = useSyncExternalStore(staticSubscribe, readPlayerId, serverNull);
  const joined = useRef(false);

  const fetchLive = useCallback(async () => {
    try {
      const q = playerId ? `?playerId=${encodeURIComponent(playerId)}` : "";
      const res = await fetch(`/api/game/live${q}`, { cache: "no-store" });
      if (!res.ok) {
        setReconnecting(true);
        return;
      }
      const data = (await res.json()) as LiveGamePayload;
      setLive(data);
      setReconnecting(false);
    } catch {
      setReconnecting(true);
    }
  }, [playerId]);

  useEffect(() => {
    const kickoff = setTimeout(async () => {
      // Register the anonymous player once so a wallet exists for votes
      if (playerId && !joined.current) {
        joined.current = true;
        try {
          await fetch("/api/player/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId }),
          });
        } catch {
          // Watching works without a wallet; contributing will surface errors
        }
      }
      void fetchLive();
    }, 0);
    const poll = setInterval(() => void fetchLive(), 5000);
    // Re-derive time-of-day + scene rotation every few minutes
    const clock = setInterval(() => setClockTick((n) => n + 1), 5 * 60 * 1000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [fetchLive, playerId]);

  const windowId = live?.controlWindow?.id ?? null;
  const contribute = useCallback(
    async (optionId: string, credits: number): Promise<string | null> => {
      if (!playerId || !windowId) return "No player session yet — try again";
      try {
        const res = await fetch(`/api/control-windows/${windowId}/contributions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId,
            optionId,
            credits,
            idempotencyKey: newIdempotencyKey(playerId, windowId, optionId),
          }),
        });
        const data = (await res.json()) as { ok: boolean; error?: string };
        if (!data.ok) return data.error ?? "Contribution failed";
        void fetchLive();
        return null;
      } catch {
        return "Network error — contribution not sent";
      }
    },
    [playerId, windowId, fetchLive],
  );

  const view = useMemo(() => {
    if (!live) return null;
    return deriveSceneView(live, new Date(), {
      timeOfDay:
        todParam && TOD_VALUES.includes(todParam as TimeOfDayId)
          ? (todParam as TimeOfDayId)
          : null,
      biome:
        biomeParam && BIOME_VALUES.includes(biomeParam as SceneBiome)
          ? (biomeParam as SceneBiome)
          : null,
      season:
        seasonParam && SEASON_VALUES.includes(seasonParam as SeasonId)
          ? (seasonParam as SeasonId)
          : null,
    });
    // clockTick re-derives time-of-day + rotation on a timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, todParam, biomeParam, seasonParam, clockTick]);

  const layers = useSceneLayers(view?.media ?? null);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <style>{SCENE_STYLE}</style>

      {layers.map((layer) => (
        <MediaLayer
          key={layer.entry.id}
          entry={layer.entry}
          fallbackImageUrl={view?.fallbackImage?.url ?? null}
          reduceMotion={reduceMotion}
          grade={view?.grade ?? "none"}
        />
      ))}

      {!view ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#101820]">
          <p className="animate-pulse text-sm tracking-[0.3em] text-white/60">
            FINDING THE ROAD…
          </p>
        </div>
      ) : null}

      {/* Top overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 via-black/25 to-transparent px-5 pb-10 pt-4 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-[0.28em] text-white">
              WESTBOUND
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              LIVE
            </span>
          </div>
          {view ? (
            <div className="text-right">
              <p className="text-sm font-medium text-white/95 sm:text-base">
                {view.locationLine}
              </p>
              <p className="text-[11px] uppercase tracking-widest text-white/60">
                {view.status}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom overlay */}
      {view ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-5 pb-5 pt-14 sm:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            <div className="flex items-end justify-between text-white">
              <p className="text-sm font-medium sm:text-base">
                Day {view.day}
                <span className="text-white/60"> · with {view.dogName}</span>
              </p>
              <p className="text-xs text-white/75 sm:text-sm">
                {view.milesWalked.toFixed(1)} mi walked ·{" "}
                {view.milesRemaining.toFixed(1)} to the Pacific
              </p>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-amber-400/90"
                style={{ width: `${Math.min(100, view.progress * 100)}%` }}
              />
            </div>
            <p className="text-xs italic text-white/55">{view.moodLine}</p>
          </div>
        </div>
      ) : null}

      <DecisionPanel
        window={live?.controlWindow ?? null}
        player={live?.player ?? null}
        onContribute={contribute}
      />

      {reconnecting ? (
        <div className="absolute right-4 top-16 rounded-full bg-black/60 px-3 py-1 text-[11px] text-amber-200">
          reconnecting…
        </div>
      ) : null}

      {view?.media?.label ? (
        <div className="absolute bottom-1.5 right-2 text-[10px] tracking-wide text-white/35">
          {view.media.label}
        </div>
      ) : null}
    </div>
  );
}
