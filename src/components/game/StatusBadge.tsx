import type { WalkerStatus } from "@/lib/types/domain";

const labels: Record<WalkerStatus, string> = {
  not_started: "Not started",
  walking: "Walking",
  approaching_decision: "Approaching decision",
  decision_window_open: "Decision open",
  rerouting: "Rerouting",
  resting: "Resting",
  paused_by_admin: "Paused",
  temporarily_blocked: "Blocked",
  completed: "Completed",
};

const tones: Record<WalkerStatus, string> = {
  not_started: "bg-[var(--color-asphalt)] text-[var(--color-cream)]",
  walking: "bg-[var(--color-forest)] text-[var(--color-cream)]",
  approaching_decision: "bg-[var(--color-gold)]/20 text-[var(--color-gold)]",
  decision_window_open: "bg-[var(--color-rust)] text-[var(--color-cream)]",
  rerouting: "bg-[var(--color-tan)]/30 text-[var(--color-tan)]",
  resting: "bg-[var(--color-navy)] text-[var(--color-cream)] ring-1 ring-white/20",
  paused_by_admin: "bg-[var(--color-asphalt)] text-[var(--color-cream)]",
  temporarily_blocked: "bg-[var(--color-rust)]/80 text-[var(--color-cream)]",
  completed: "bg-[var(--color-gold)] text-[var(--color-navy)]",
};

type Props = {
  status: WalkerStatus;
};

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-wide ${tones[status]}`}
      role="status"
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current opacity-90"
        aria-hidden
      />
      {labels[status]}
    </span>
  );
}
