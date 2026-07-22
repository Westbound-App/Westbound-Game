"use client";

import { useEffect, useRef, useState } from "react";
import type { SceneGrade } from "@/lib/media/scene-view";
import type { SceneMediaEntry } from "@/lib/media/manifest";

/** Seconds of overlap when a loop hands off to its twin. */
const LOOP_FADE_S = 0.6;

/**
 * Seamless looping video: two players of the same clip alternate, the next
 * one fading in just before the current one ends, so AI-generated clips
 * never visibly "pop" at the loop point. Reduced motion (or metadata
 * failure) falls back to the browser's native hard loop.
 */
function LoopingVideo({
  src,
  filter,
  simple,
  onFailed,
}: {
  src: string;
  filter?: string;
  simple: boolean;
  onFailed: () => void;
}) {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState<0 | 1>(0);

  useEffect(() => {
    if (simple) return;
    const current = active === 0 ? refA.current : refB.current;
    const next = active === 0 ? refB.current : refA.current;
    if (!current || !next) return;

    const onTime = () => {
      if (!current.duration || Number.isNaN(current.duration)) return;
      if (current.duration - current.currentTime <= LOOP_FADE_S) {
        next.currentTime = 0;
        void next.play().catch(() => undefined);
        setActive((a) => (a === 0 ? 1 : 0));
      }
    };
    current.addEventListener("timeupdate", onTime);
    return () => current.removeEventListener("timeupdate", onTime);
  }, [active, simple]);

  if (simple) {
    return (
      <video
        className="h-full w-full object-cover"
        style={filter ? { filter } : undefined}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        onError={onFailed}
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      {[refA, refB].map((ref, i) => (
        <video
          key={i}
          ref={ref}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          style={{
            ...(filter ? { filter } : {}),
            opacity: active === i ? 1 : 0,
          }}
          src={src}
          autoPlay={i === 0}
          muted
          playsInline
          preload="auto"
          onError={i === 0 ? onFailed : undefined}
        />
      ))}
    </div>
  );
}

/** Keyframes shared by every surface that renders scene media. */
export const SCENE_STYLE = `
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
`;

const GRADE_FILTER: Record<SceneGrade, string | undefined> = {
  none: undefined,
  dusk: "brightness(0.82) saturate(0.88)",
  night: "brightness(0.55) saturate(0.7)",
};

const GRADE_TINT: Record<SceneGrade, string | null> = {
  none: null,
  dusk: "rgba(90, 62, 92, 0.18)",
  night: "rgba(16, 28, 58, 0.42)",
};

type Layer = { entry: SceneMediaEntry; fading: boolean };

/**
 * Crossfade layer stack: adjusts state during render when the resolved
 * entry changes (the new layer fades in over the old via CSS), then prunes
 * covered layers shortly after.
 */
export function useSceneLayers(entry: SceneMediaEntry | null): Layer[] {
  const [layers, setLayers] = useState<Layer[]>([]);

  const top = layers.length ? layers[layers.length - 1] : null;
  if (entry && (!top || top.entry.id !== entry.id)) {
    setLayers([
      ...layers.slice(-1).map((l) => ({ ...l, fading: true })),
      { entry, fading: false },
    ]);
  }

  useEffect(() => {
    if (!layers.some((l) => l.fading)) return;
    const prune = setTimeout(() => {
      setLayers((prev) => prev.filter((l) => !l.fading));
    }, 1900);
    return () => clearTimeout(prune);
  }, [layers]);

  return layers;
}

/** One full-bleed media layer: video loop, or still with slow Ken Burns.
 *  Fades in via CSS on mount, covering the previous layer beneath it.
 *  A video that cannot load or decode falls back to the best still.
 *  Time-generic assets get an after-dark grade so day shots feel right
 *  at dusk and night; real night assets pass through untouched. */
export function MediaLayer({
  entry,
  fallbackImageUrl,
  reduceMotion,
  grade,
}: {
  entry: SceneMediaEntry;
  fallbackImageUrl: string | null;
  reduceMotion: boolean;
  grade: SceneGrade;
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const motionClass = reduceMotion ? "" : "wb-kenburns";
  const showVideo = entry.kind === "video" && !videoFailed;
  const imageUrl =
    entry.kind === "image" ? entry.url : (fallbackImageUrl ?? entry.url);
  const filter = GRADE_FILTER[grade];
  const tint = GRADE_TINT[grade];

  return (
    <div className={`absolute inset-0 ${reduceMotion ? "" : "wb-fadein"}`}>
      {showVideo ? (
        <LoopingVideo
          src={entry.url}
          filter={filter}
          simple={reduceMotion}
          onFailed={() => setVideoFailed(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={`h-full w-full object-cover ${motionClass}`}
          style={filter ? { filter } : undefined}
          src={imageUrl}
          alt=""
        />
      )}
      {tint ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: tint }}
        />
      ) : null}
    </div>
  );
}
