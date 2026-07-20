import type { WalkerSnapshot } from "@/lib/types/domain";

function formatMiles(meters: number): string {
  return (meters / 1609.344).toFixed(2);
}

function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`;
}

type Props = {
  walker: WalkerSnapshot;
  walkerName: string;
};

export function WalkerStats({ walker, walkerName }: Props) {
  const progress =
    walker.originalRouteDistanceMeters > 0
      ? Math.min(
          100,
          (walker.totalDistanceWalkedMeters /
            walker.originalRouteDistanceMeters) *
            100,
        )
      : 0;

  return (
    <section
      aria-label="Walker statistics"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <Stat label="Walker" value={walkerName} />
      <Stat
        label="Location"
        value={formatCoords(walker.latitude, walker.longitude)}
      />
      <Stat
        label="Miles walked"
        value={formatMiles(walker.totalDistanceWalkedMeters)}
      />
      <Stat
        label="Miles remaining"
        value={formatMiles(walker.projectedRemainingMeters)}
      />
      <div className="col-span-2 sm:col-span-4">
        <div className="mb-1 flex justify-between text-xs text-[var(--color-cream)]/60">
          <span>Route progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Route progress"
        >
          <div
            className="h-full rounded-full bg-[var(--color-gold)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <Stat label="State version" value={String(walker.stateVersion)} />
      <Stat
        label="Speed (m/s)"
        value={walker.speedMps.toFixed(2)}
      />
      <Stat
        label="Server time"
        value={new Date(walker.serverTimestamp).toLocaleString()}
        className="col-span-2"
      />
    </section>
  );
}

function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-white/5 px-3 py-2 ${className}`}
    >
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-cream)]/50">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-[var(--color-cream)]">
        {value}
      </p>
    </div>
  );
}
