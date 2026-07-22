"use client";

import dynamic from "next/dynamic";
import type { LiveGamePayload } from "@/lib/game/load-live-state";

const LiveMap = dynamic(
  () => import("@/components/game/LiveMap").then((m) => m.LiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs tracking-widest text-white/50">
        LOADING MAP…
      </div>
    ),
  },
);

type Props = {
  open: boolean;
  onClose: () => void;
  live: LiveGamePayload;
};

/** Collapsible route map — approximate position, per the privacy rules. */
export function MapSheet({ open, onClose, live }: Props) {
  if (!open) return null;

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
        aria-label="Journey map"
        className="relative m-3 flex h-[62vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#10151c]/95 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
            The journey so far
          </p>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/20"
          >
            close
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <LiveMap
            start={live.game.start}
            destination={live.game.destination}
            walker={{
              latitude: live.walker.latitude,
              longitude: live.walker.longitude,
            }}
            segments={live.segments}
            status={live.walker.status}
            heading={live.heading}
          />
        </div>
        <p className="px-4 py-2 text-[10px] text-white/40">
          Approximate position along the route.
        </p>
      </section>
    </div>
  );
}
