"use client";

import type { LiveGamePayload } from "@/lib/game/load-live-state";

type Props = {
  open: boolean;
  onClose: () => void;
  events: LiveGamePayload["events"];
};

function timeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** Quiet log of meaningful recent moments — never a chat feed. */
export function MomentsDrawer({ open, onClose, events }: Props) {
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
        aria-label="Recent moments"
        className="relative m-3 flex max-h-[70vh] w-full max-w-md flex-col rounded-2xl border border-white/15 bg-[#10151c]/95 p-5 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
            Recent moments
          </p>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/20"
          >
            close
          </button>
        </div>

        <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
          {events.length === 0 ? (
            <p className="text-sm text-white/55">
              A quiet stretch of road — nothing but footsteps lately.
            </p>
          ) : (
            events.slice(0, 20).map((event) => (
              <div key={event.id} className="border-l-2 border-white/15 pl-3">
                <p className="text-sm font-medium text-white/90">
                  {event.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/55">
                  {event.description}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">
                  {timeAgo(event.occurredAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
