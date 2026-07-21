"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { LiveGamePayload } from "@/lib/game/load-live-state";
import { resolveAtmosphere, type SeasonId } from "@/lib/atmosphere/season";
import { dayNumber, resolveLocationPresentation } from "@/lib/game/location-label";
import type { SceneBiome } from "@/lib/places/types";
import { timeOfDayFromHour, type TimeOfDayId } from "@/lib/scene/presets";
import {
  makeParamReader,
  readReducedMotion,
  serverFalse,
  serverNull,
  staticSubscribe,
  subscribeReducedMotion,
} from "@/lib/client/prefs";
import {
  resolveSceneMedia,
  SCENE_MEDIA,
  type SceneMediaEntry,
} from "@/lib/media/manifest";

const METERS_PER_MILE = 1609.344;
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

/** One full-bleed media layer: video loop, or still with slow Ken Burns.
 *  Fades in via CSS on mount, covering the previous layer beneath it.
 *  A video that cannot load or decode falls back to the best still. */
function MediaLayer({
  entry,
  fallbackImageUrl,
  reduceMotion,
}: {
  entry: SceneMediaEntry;
  fallbackImageUrl: string | null;
  reduceMotion: boolean;
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const motionClass = reduceMotion ? "" : "wb-kenburns";
  const showVideo = entry.kind === "video" && !videoFailed;
  const imageUrl =
    entry.kind === "image" ? entry.url : (fallbackImageUrl ?? entry.url);

  return (
    <div className={`absolute inset-0 ${reduceMotion ? "" : "wb-fadein"}`}>
      {showVideo ? (
        <video
          className="h-full w-full object-cover"
          src={entry.url}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={`h-full w-full object-cover ${motionClass}`}
          src={imageUrl}
          alt=""
        />
      )}
    </div>
  );
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
  const [layers, setLayers] = useState<
    Array<{ entry: SceneMediaEntry; fading: boolean }>
  >([]);

  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    serverFalse,
  );
  const todParam = useSyncExternalStore(staticSubscribe, readTod, serverNull);
  const biomeParam = useSyncExternalStore(staticSubscribe, readBiome, serverNull);
  const seasonParam = useSyncExternalStore(staticSubscribe, readSeason, serverNull);

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

    const biome =
      biomeParam && BIOME_VALUES.includes(biomeParam as SceneBiome)
        ? (biomeParam as SceneBiome)
        : place.biome;
    const season =
      seasonParam && SEASON_VALUES.includes(seasonParam as SeasonId)
        ? (seasonParam as SeasonId)
        : atmosphere.season;
    const timeOfDay =
      todParam && TOD_VALUES.includes(todParam as TimeOfDayId)
        ? (todParam as TimeOfDayId)
        : timeOfDayFromHour(hour);

    const mediaQuery = {
      biome,
      season,
      timeOfDay,
      landmarkId: place.landmark?.id ?? null,
    };
    return {
      media: resolveSceneMedia(mediaQuery),
      fallbackImage: resolveSceneMedia(
        mediaQuery,
        SCENE_MEDIA.filter((e) => e.kind === "image"),
      ),
      locationLine: place.locationLine,
      moodLine: atmosphere.moodLine,
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
      dogName: live.game.companionDog?.name ?? "Beacon",
    };
    // clockTick re-derives time-of-day on a timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, todParam, biomeParam, seasonParam, clockTick]);

  // Crossfade: adjust layers during render when the resolved entry changes
  // (the new layer fades in over the old via CSS), then prune covered layers.
  const nextMedia = view?.media ?? null;
  const topLayer = layers.length ? layers[layers.length - 1] : null;
  if (nextMedia && (!topLayer || topLayer.entry.id !== nextMedia.id)) {
    setLayers([
      ...layers.slice(-1).map((l) => ({ ...l, fading: true })),
      { entry: nextMedia, fading: false },
    ]);
  }

  useEffect(() => {
    if (!layers.some((l) => l.fading)) return;
    const prune = setTimeout(() => {
      setLayers((prev) => prev.filter((l) => !l.fading));
    }, 1900);
    return () => clearTimeout(prune);
  }, [layers]);

  const placeholderLabel = view?.media?.label ?? null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <style>{`
        @keyframes wb-kb {
          from { transform: scale(1.03) translate(0.5%, 0.3%); }
          to { transform: scale(1.11) translate(-1.2%, -0.8%); }
        }
        .wb-kenburns { animation: wb-kb 55s ease-in-out infinite alternate; }
        @keyframes wb-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .wb-fadein { animation: wb-fade 1.6s ease forwards; }
      `}</style>

      {layers.map((layer) => (
        <MediaLayer
          key={layer.entry.id}
          entry={layer.entry}
          fallbackImageUrl={view?.fallbackImage?.url ?? null}
          reduceMotion={reduceMotion}
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
      ) : null}

      {reconnecting ? (
        <div className="absolute right-4 top-16 rounded-full bg-black/60 px-3 py-1 text-[11px] text-amber-200">
          reconnecting…
        </div>
      ) : null}

      {placeholderLabel ? (
        <div className="absolute bottom-1.5 right-2 text-[10px] tracking-wide text-white/35">
          {placeholderLabel}
        </div>
      ) : null}
    </div>
  );
}
