"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LiveGamePayload } from "@/lib/game/load-live-state";
import { softControlOptionCopy, IDLE_WATCH_LINE } from "@/lib/atmosphere/copy";
import { resolveAtmosphere } from "@/lib/atmosphere/season";
import {
  dayNumber,
  resolveLocationPresentation,
  simulatedViewerCount,
} from "@/lib/game/location-label";
import type { Faction } from "@/lib/types/domain";

const PLAYER_KEY = "westbound_player_id";
const FALLBACK_SCENE = "/media/scenes/seasonal/summer-daytime.jpg";

type Props = {
  initial: LiveGamePayload;
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

function statusLabel(status: string): string {
  switch (status) {
    case "walking":
      return "Walking";
    case "resting":
      return "Resting";
    case "decision_window_open":
      return "Decision open";
    case "completed":
      return "Destination reached";
    case "paused_by_admin":
      return "Paused";
    default:
      return status.replaceAll("_", " ");
  }
}

function safeLive(input: LiveGamePayload): LiveGamePayload {
  return {
    ...input,
    game: {
      ...input.game,
      companionDog: input.game.companionDog ?? {
        name: "Beacon",
        breedMix: "Bernese Mountain Dog × Siberian Husky",
        description: "Walks with him.",
      },
    },
    walker: input.walker,
    heading: input.heading ?? 270,
    segments: input.segments ?? [],
    events: input.events ?? [],
    controlWindow: input.controlWindow ?? null,
    factionStats: input.factionStats ?? {
      finisher: {
        creditsSpent: 0,
        windowsWon: 0,
        milesAdded: 0,
        milesPrevented: 0,
      },
      drifter: {
        creditsSpent: 0,
        windowsWon: 0,
        milesAdded: 0,
        milesPrevented: 0,
      },
    },
    player: input.player ?? null,
    error: input.error ?? null,
  };
}

/**
 * Public live show.
 * Scene stills switch by place pack (landmark / region) as he travels.
 */
export function CinematicLive({ initial }: Props) {
  const [live, setLive] = useState(() => safeLive(initial));
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [uiHidden, setUiHidden] = useState(false);
  const [busyOption, setBusyOption] = useState<string | null>(null);
  const [spendAmount] = useState(100);
  const [toast, setToast] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  /** Always keep last good scene URL so we never blank to black during swaps/HMR. */
  const [displayScene, setDisplayScene] = useState(FALLBACK_SCENE);
  const [feedDown, setFeedDown] = useState(false);

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId());
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const q = playerId ? `?playerId=${encodeURIComponent(playerId)}` : "";
      const res = await fetch(`/api/game/live${q}`, { cache: "no-store" });
      if (!res.ok) {
        setFeedDown(true);
        return;
      }
      const data = (await res.json()) as LiveGamePayload;
      setLive(safeLive(data));
      setFeedDown(false);
    } catch {
      setFeedDown(true);
      /* keep last frame / last live snapshot */
    }
  }, [playerId]);

  useEffect(() => {
    if (!playerId) return;
    void fetch("/api/player/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    }).then(() => fetchLive());
  }, [playerId, fetchLive]);

  useEffect(() => {
    const id = window.setInterval(() => void fetchLive(), 2000);
    return () => window.clearInterval(id);
  }, [fetchLive]);

  // When tab becomes visible again (after edits / sleep), pull state immediately
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchLive();
      }
    };
    const onOnline = () => void fetchLive();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onVisible);
    };
  }, [fetchLive]);

  const walker = live.walker;
  const dog = live.game.companionDog ?? {
    name: "Beacon",
    breedMix: "Bernese Mountain Dog × Siberian Husky",
    description: "Walks with him.",
  };
  const milesWalked = walker.totalDistanceWalkedMeters / 1609.344;
  const milesLeft = walker.projectedRemainingMeters / 1609.344;
  const day = dayNumber(live.game.startedAt);

  const progress01 =
    walker.originalRouteDistanceMeters > 0
      ? Math.min(
          1,
          walker.totalDistanceWalkedMeters / walker.originalRouteDistanceMeters,
        )
      : 0;

  const scenicDemo =
    live.game.environment === "sandbox" &&
    live.game.config?.scenicVisualDemoMode === true;

  const place = useMemo(
    () =>
      resolveLocationPresentation(
        {
          latitude: walker.latitude,
          longitude: walker.longitude,
        },
        scenicDemo ? { scenicDemoProgress: progress01 } : undefined,
      ),
    [walker.latitude, walker.longitude, scenicDemo, progress01],
  );

  const atmosphere = useMemo(
    () => resolveAtmosphere(walker.latitude, new Date()),
    [walker.latitude],
  );

  // Seasonal mood is primary; landmark packs refine when scenic demo hits a place
  const sceneSrc =
    place.matchReason === "landmark"
      ? place.sceneImage || atmosphere.seasonalSceneImage
      : atmosphere.seasonalSceneImage || place.sceneImage || FALLBACK_SCENE;

  // Preload next scene, then swap — never hide the current image first (avoids black screen)
  useEffect(() => {
    if (!sceneSrc || sceneSrc === displayScene) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setDisplayScene(sceneSrc);
        setImgFailed(false);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        // Keep previous displayScene; only fall back if we have nothing
        setImgFailed(false);
      }
    };
    img.src = sceneSrc;
    return () => {
      cancelled = true;
    };
  }, [sceneSrc, displayScene]);

  const viewers = useMemo(
    () => simulatedViewerCount(walker.stateVersion),
    [walker.stateVersion],
  );

  const windowOpen =
    live.controlWindow?.status === "open" &&
    (live.controlWindow.secondsRemaining ?? 0) > 0;

  const publicOptions = (live.controlWindow?.options ?? []).filter((o) =>
    ["support_route", "northern_detour", "southern_detour"].includes(
      o.optionType,
    ),
  );

  async function ensurePlayer() {
    if (!playerId) return null;
    await fetch("/api/player/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    return playerId;
  }

  async function setFaction(faction: Faction) {
    const id = await ensurePlayer();
    if (!id) return;
    await fetch("/api/player/faction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: id, faction }),
    });
    await fetchLive();
  }

  async function contribute(optionId: string) {
    const id = await ensurePlayer();
    if (!id || !live.controlWindow) return;
    setBusyOption(optionId);
    try {
      const opt = live.controlWindow.options.find((o) => o.id === optionId);
      if (opt && live.player?.faction === "neutral") {
        await setFaction(
          opt.factionAffinity === "drifter" ? "drifter" : "finisher",
        );
      }
      const res = await fetch(
        `/api/control-windows/${live.controlWindow.id}/contributions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: id,
            optionId,
            credits: spendAmount,
            idempotencyKey: `${id}-${live.controlWindow.id}-${optionId}-${Date.now()}`,
          }),
        },
      );
      const data = (await res.json()) as { ok: boolean; error?: string };
      setToast(
        data.ok
          ? `You guided the path (+${spendAmount} credits)`
          : data.error ?? "Could not guide right now",
      );
      await fetchLive();
    } finally {
      setBusyOption(null);
      window.setTimeout(() => setToast(null), 2500);
    }
  }

  async function restartSandbox() {
    await fetch("/api/admin/reset-sandbox", { method: "POST" });
    await fetchLive();
    setToast("Journey restarted");
    window.setTimeout(() => setToast(null), 2000);
  }

  return (
    <div
      className="relative h-[100dvh] min-h-[100vh] w-full overflow-hidden text-white"
      style={{
        // Ultimate fallback if image fails: sky/road gradient (never pure black)
        background:
          "linear-gradient(180deg, #6b8cae 0%, #c4a574 45%, #3d4a38 46%, #2a3328 100%)",
      }}
    >
      {/* ── Location-aware scene layer (always visible — never opacity-0) ── */}
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayScene}
          alt={`${place.locationLine} — ${dog.name} and the walker`}
          className="absolute inset-0 h-full w-full object-cover opacity-100"
          style={{
            animation: "wb-kenburns 22s ease-in-out infinite alternate",
            transformOrigin: "55% 45%",
          }}
          onError={() => {
            if (displayScene !== FALLBACK_SCENE) {
              setDisplayScene(FALLBACK_SCENE);
            } else {
              setImgFailed(true);
            }
          }}
          draggable={false}
        />

        {imgFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-700 via-amber-200/40 to-stone-800">
            <div className="rounded-2xl bg-black/50 px-6 py-4 text-center backdrop-blur">
              <p className="text-lg font-semibold">WESTBOUND</p>
              <p className="mt-1 text-sm text-white/70">
                He and {dog.name} are walking west
              </p>
            </div>
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 22%, transparent 62%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      </div>

      {feedDown && (
        <div
          role="status"
          className="absolute left-1/2 top-14 z-40 -translate-x-1/2 rounded-full bg-amber-900/90 px-4 py-2 text-xs text-amber-50 shadow-lg ring-1 ring-amber-400/40"
        >
          Reconnecting to live state… Refresh if this stays.
        </div>
      )}

      {/* ── Top bar (always high contrast) ── */}
      {!uiHidden && (
        <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 sm:p-5">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase shadow-lg">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
            <span className="text-sm font-bold tracking-[0.2em] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-base">
              WESTBOUND
            </span>
            <span className="hidden text-xs text-white drop-shadow sm:inline">
              {viewers.toLocaleString()} watching
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMapOpen((v) => !v)}
              className="rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium shadow-lg ring-1 ring-white/25 backdrop-blur-md"
            >
              {mapOpen ? "Hide map" : "Map"}
            </button>
            <button
              type="button"
              onClick={() => setUiHidden(true)}
              className="rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium shadow-lg ring-1 ring-white/25 backdrop-blur-md"
            >
              Watch only
            </button>
            <Link
              href="/admin/game-debug"
              className="hidden rounded-lg bg-black/70 px-3 py-1.5 text-xs text-white/70 ring-1 ring-white/20 sm:inline"
            >
              Debug
            </Link>
          </div>
        </header>
      )}

      {uiHidden && (
        <button
          type="button"
          onClick={() => setUiHidden(false)}
          className="absolute right-3 top-3 z-40 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-medium shadow-lg ring-1 ring-white/30"
        >
          Show UI
        </button>
      )}

      {!uiHidden && mapOpen && (
        <aside className="absolute right-3 top-14 z-30 w-44 overflow-hidden rounded-xl bg-black/80 p-2 shadow-xl ring-1 ring-white/25 backdrop-blur-md sm:right-5 sm:top-16 sm:w-56">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-white/50">
            Journey map
          </p>
          <MiniMap
            segments={live.segments}
            walker={{
              latitude: walker.latitude,
              longitude: walker.longitude,
            }}
            start={live.game.start}
            destination={live.game.destination}
          />
        </aside>
      )}

      {/* ── Bottom overlays ── */}
      {!uiHidden && (
        <footer className="absolute inset-x-0 bottom-0 z-30 p-3 sm:p-5">
          <div className="mx-auto max-w-4xl space-y-3">
            <div className="rounded-2xl bg-black/70 px-4 py-3 shadow-2xl ring-1 ring-white/20 backdrop-blur-md sm:px-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold tracking-tight sm:text-xl">
                    {place.locationLine}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-100/90">
                    {atmosphere.moodLine}
                    {atmosphere.holidayLabel
                      ? ` · ${atmosphere.holidayLabel}`
                      : ` · ${atmosphere.seasonLabel}`}
                  </p>
                  {place.landmark && (
                    <p className="mt-0.5 text-xs text-white/70">
                      {place.landmark.blurb}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-white/80">
                    Day {day} · {milesWalked.toFixed(1)} miles walked ·{" "}
                    {statusLabel(walker.status)}
                  </p>
                  <p className="mt-0.5 text-xs text-white/55">
                    With{" "}
                    <span className="font-medium text-amber-200">
                      {dog.name}
                    </span>
                    {" · "}
                    {dog.breedMix}
                  </p>
                </div>
                <div className="text-right text-sm text-white/80">
                  <p>
                    <span className="text-white/50">Left </span>
                    {milesLeft.toFixed(1)} mi
                  </p>
                  <p className="text-xs text-white/45">Pacific destination</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      walker.originalRouteDistanceMeters > 0
                        ? (walker.totalDistanceWalkedMeters /
                            walker.originalRouteDistanceMeters) *
                            100
                        : 0,
                    )}%`,
                  }}
                />
              </div>
            </div>

            {windowOpen && live.controlWindow && (
              <div className="rounded-2xl bg-black/75 p-3 shadow-2xl ring-1 ring-amber-400/50 backdrop-blur-md sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold tracking-[0.15em] text-amber-200 uppercase">
                    A gentle choice · {live.controlWindow.decisionLabel}
                  </p>
                  <p className="font-mono text-sm text-amber-100">
                    {String(live.controlWindow.secondsRemaining).padStart(
                      2,
                      "0",
                    )}
                    s
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {publicOptions.map((opt) => {
                    const soft = softControlOptionCopy(opt.optionType);
                    const isSupport = opt.optionType === "support_route";
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={busyOption !== null}
                        onClick={() => void contribute(opt.id)}
                        className={`rounded-xl px-3 py-3 text-left transition ring-1 ${
                          isSupport
                            ? "bg-emerald-950/75 ring-emerald-300/40 hover:bg-emerald-900/75"
                            : "bg-sky-950/75 ring-sky-300/35 hover:bg-sky-900/75"
                        } disabled:opacity-50`}
                      >
                        <p className="text-sm font-semibold">{soft.title}</p>
                        <p className="mt-0.5 text-[11px] text-white/55">
                          {soft.description}
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          {opt.totalCredits.toLocaleString()} credits ·{" "}
                          {opt.contributorCount}{" "}
                          {opt.contributorCount === 1 ? "friend" : "friends"}
                        </p>
                        <p className="mt-2 text-[11px] text-white/45">
                          {busyOption === opt.id
                            ? "Guiding…"
                            : `Tap · ${spendAmount} credits`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!windowOpen && walker.status !== "completed" && (
              <p className="text-center text-xs font-medium text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {IDLE_WATCH_LINE}{" "}
                <Link href="/how-it-works" className="text-amber-200 underline">
                  How it works
                </Link>
              </p>
            )}

            {walker.status === "completed" && (
              <div className="rounded-2xl bg-black/75 p-4 text-center ring-1 ring-amber-400/40 backdrop-blur-md">
                <p className="font-medium">Sandbox destination reached</p>
                <button
                  type="button"
                  onClick={() => void restartSandbox()}
                  className="mt-3 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black"
                >
                  Walk again
                </button>
              </div>
            )}
          </div>
        </footer>
      )}

      {toast && (
        <div
          role="status"
          className="absolute bottom-1/3 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/85 px-4 py-2 text-sm shadow-lg ring-1 ring-white/25"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function MiniMap({
  segments,
  walker,
  start,
  destination,
}: {
  segments: LiveGamePayload["segments"];
  walker: { latitude: number; longitude: number };
  start: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
}) {
  const points = segments.length
    ? [segments[0]!.start, ...segments.map((s) => s.end)]
    : [start, destination];

  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  const minLat = Math.min(...lats, walker.latitude);
  const maxLat = Math.max(...lats, walker.latitude);
  const minLon = Math.min(...lons, walker.longitude);
  const maxLon = Math.max(...lons, walker.longitude);
  const pad = 0.002;
  const latSpan = Math.max(maxLat - minLat, 0.002) + pad * 2;
  const lonSpan = Math.max(maxLon - minLon, 0.002) + pad * 2;

  const project = (lat: number, lon: number) => ({
    x: ((lon - (minLon - pad)) / lonSpan) * 100,
    y: (1 - (lat - (minLat - pad)) / latSpan) * 100,
  });

  const path = points
    .map((p, i) => {
      const { x, y } = project(p.latitude, p.longitude);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const w = project(walker.latitude, walker.longitude);

  return (
    <svg viewBox="0 0 100 70" className="h-28 w-full rounded-lg bg-[#0f1624]">
      <path
        d={path}
        fill="none"
        stroke="#c4a574"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx={w.x} cy={w.y} r="2.5" fill="#ef4444" />
    </svg>
  );
}
