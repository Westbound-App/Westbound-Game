"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { LiveGamePayload } from "@/lib/game/load-live-state";
import { resolveAtmosphere } from "@/lib/atmosphere/season";
import { dayNumber, resolveLocationPresentation } from "@/lib/game/location-label";
import type { SceneBiome } from "@/lib/places/types";
import {
  timeOfDayFromHour,
  type TimeOfDayId,
} from "@/lib/scene/presets";
import {
  makeParamReader,
  readReducedMotion,
  serverFalse,
  serverNull,
  staticSubscribe,
  subscribeReducedMotion,
} from "@/lib/client/prefs";

const LivingScene = dynamic(
  () => import("@/components/scene/LivingScene").then((m) => m.LivingScene),
  {
    ssr: false,
    loading: () => <SceneLoading />,
  },
);

const METERS_PER_MILE = 1609.344;
const TOD_VALUES: TimeOfDayId[] = ["day", "golden_hour", "dusk", "night"];
const BIOME_VALUES: SceneBiome[] = [
  "new_england_town",
  "northeast_city",
  "midwest_industrial",
  "great_plains",
  "southwest_canyon",
  "pacific_coast",
  "generic_highway",
];

function SceneLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#101820]">
      <p className="animate-pulse text-sm tracking-[0.3em] text-white/60">
        FINDING THE ROAD…
      </p>
    </div>
  );
}

const readTod = makeParamReader("tod");
const readBiome = makeParamReader("biome");

function statusLabel(status: string): string {
  switch (status) {
    case "walking":
      return "Walking west";
    case "approaching_decision":
      return "Coming up on a choice";
    case "decision_window_open":
      return "The crowd is deciding";
    case "resting":
      return "Resting";
    case "weather_rest":
      return "Waiting out the weather";
    case "completed":
      return "Journey complete";
    default:
      return status.replaceAll("_", " ");
  }
}

/**
 * Full-screen living-scene prototype: the future public /live presentation.
 * Renders authoritative backend state through the stylized 3D renderer.
 * Dev overrides (screenshots / art review): ?tod=night&biome=great_plains
 */
export function SceneClient() {
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
  const todOverride =
    todParam && TOD_VALUES.includes(todParam as TimeOfDayId)
      ? (todParam as TimeOfDayId)
      : null;
  const biomeOverride =
    biomeParam && BIOME_VALUES.includes(biomeParam as SceneBiome)
      ? (biomeParam as SceneBiome)
      : null;

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/game/live", { cache: "no-store" });
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
  }, []);

  useEffect(() => {
    const kickoff = setTimeout(() => void fetchLive(), 0);
    const poll = setInterval(() => void fetchLive(), 5000);
    // Re-evaluate time-of-day every few minutes so dusk arrives on its own
    const clock = setInterval(() => setClockTick((n) => n + 1), 5 * 60 * 1000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [fetchLive]);

  const view = useMemo(() => {
    if (!live) return null;
    const coord = {
      latitude: live.walker.latitude,
      longitude: live.walker.longitude,
    };
    const place = resolveLocationPresentation(coord);
    const atmosphere = resolveAtmosphere(coord.latitude);
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const walking =
      live.walker.status === "walking" ||
      live.walker.status === "approaching_decision";
    return {
      locationLine: place.locationLine,
      biome: biomeOverride ?? place.biome,
      season: atmosphere.season,
      moodLine: atmosphere.moodLine,
      timeOfDay: todOverride ?? timeOfDayFromHour(hour),
      walking,
      status: statusLabel(live.walker.status),
      day: dayNumber(live.game.startedAt),
      milesWalked: live.walker.totalDistanceWalkedMeters / METERS_PER_MILE,
      milesRemaining: live.walker.projectedRemainingMeters / METERS_PER_MILE,
      progress:
        live.walker.totalDistanceWalkedMeters /
        Math.max(
          1,
          live.walker.totalDistanceWalkedMeters +
            live.walker.projectedRemainingMeters,
        ),
      speedMps: live.walker.speedMps,
      journeyMeters: live.walker.totalDistanceWalkedMeters,
      walkerName: live.game.walkerName,
      dogName: live.game.companionDog?.name ?? "Beacon",
    };
    // clockTick intentionally re-derives time-of-day on a timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, todOverride, biomeOverride, clockTick]);

  if (!view) {
    return (
      <div className="relative h-dvh w-full overflow-hidden bg-black">
        <SceneLoading />
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <LivingScene
        timeOfDay={view.timeOfDay}
        biome={view.biome}
        season={view.season}
        speedMps={view.speedMps}
        walking={view.walking}
        resting={!view.walking}
        journeyMeters={view.journeyMeters}
        reduceMotion={reduceMotion}
      />

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
          <div className="text-right">
            <p className="text-sm font-medium text-white/95 sm:text-base">
              {view.locationLine}
            </p>
            <p className="text-[11px] uppercase tracking-widest text-white/60">
              {view.status}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-5 pb-5 pt-14 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <div className="flex items-end justify-between text-white">
            <p className="text-sm font-medium sm:text-base">
              Day {view.day}
              <span className="text-white/60"> · with {view.dogName}</span>
            </p>
            <p className="text-xs text-white/75 sm:text-sm">
              {view.milesWalked.toFixed(1)} mi walked ·{" "}
              {Math.max(0, view.milesRemaining).toFixed(1)} to the Pacific
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

      {reconnecting ? (
        <div className="absolute right-4 top-16 rounded-full bg-black/60 px-3 py-1 text-[11px] text-amber-200">
          reconnecting…
        </div>
      ) : null}

      {/* Honest dev-source label — replaced when a real renderer stream lands */}
      <div className="absolute bottom-1.5 right-2 text-[10px] tracking-wide text-white/35">
        renderer prototype · dev source
      </div>
    </div>
  );
}
