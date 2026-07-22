"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { LiveGamePayload } from "@/lib/game/load-live-state";
import {
  makeParamReader,
  serverNull,
  staticSubscribe,
} from "@/lib/client/prefs";
import { deriveSceneView } from "@/lib/media/scene-view";
import {
  MediaLayer,
  SCENE_STYLE,
  useSceneLayers,
} from "@/components/watch/MediaLayer";

const readLayout = makeParamReader("layout");

/**
 * /stream — capture surface for OBS / TikTok Live / YouTube Live.
 * Minimal overlays, no interactive controls, safe margins for platform UI.
 * ?layout=vertical for 9:16 phone streams; default is 16:9.
 */
export function StreamClient() {
  const [live, setLive] = useState<LiveGamePayload | null>(null);
  const [clockTick, setClockTick] = useState(0);
  const layoutParam = useSyncExternalStore(staticSubscribe, readLayout, serverNull);
  const vertical = layoutParam === "vertical";

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/game/live", { cache: "no-store" });
      if (!res.ok) return;
      setLive((await res.json()) as LiveGamePayload);
    } catch {
      // keep the last good frame on capture surfaces — no error chrome
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
    return deriveSceneView(live, new Date());
    // clockTick re-derives time-of-day + rotation on a timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, clockTick]);

  const layers = useSceneLayers(view?.media ?? null);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <style>{SCENE_STYLE}</style>

      {layers.map((layer) => (
        <MediaLayer
          key={layer.entry.id}
          entry={layer.entry}
          fallbackImageUrl={view?.fallbackImage?.url ?? null}
          reduceMotion={false}
          grade={view?.grade ?? "none"}
        />
      ))}

      {/* Header — kept tight so platform chrome never covers it */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent ${
          vertical ? "px-6 pb-16 pt-14" : "px-8 pb-12 pt-5"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`font-semibold tracking-[0.28em] text-white ${
              vertical ? "text-xl" : "text-lg"
            }`}
          >
            WESTBOUND
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            LIVE
          </span>
        </div>
      </div>

      {/* Journey strip — bottom-safe for vertical platform UI */}
      {view ? (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent ${
            vertical ? "px-6 pb-24 pt-20" : "px-8 pb-6 pt-14"
          }`}
        >
          <div className="flex flex-col gap-2">
            <p
              className={`font-medium text-white ${
                vertical ? "text-lg" : "text-base"
              }`}
            >
              {view.locationLine}
            </p>
            <p
              className={`text-white/85 ${vertical ? "text-base" : "text-sm"}`}
            >
              Day {view.day} · {view.milesWalked.toFixed(0)} miles walked ·{" "}
              {view.status}
            </p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-amber-400/90"
                style={{ width: `${Math.min(100, view.progress * 100)}%` }}
              />
            </div>
            <p
              className={`tracking-wide text-white/60 ${
                vertical ? "text-sm" : "text-xs"
              }`}
            >
              A man and his dog {view.dogName}, walking across America — help
              guide them west
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
