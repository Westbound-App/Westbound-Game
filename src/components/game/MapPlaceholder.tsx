import type { Coordinate, RouteSegment } from "@/lib/types/domain";

type Props = {
  start: Coordinate;
  destination: Coordinate;
  walker: Coordinate;
  segments: RouteSegment[];
};

/**
 * Phase A map placeholder.
 * Visual route sketch only — not a cartographic map provider.
 */
export function MapPlaceholder({
  start,
  destination,
  walker,
  segments,
}: Props) {
  const points = segments.length
    ? [
        segments[0]!.start,
        ...segments.map((s) => s.end),
      ]
    : [start, destination];

  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const pad = 0.02;
  const latSpan = Math.max(maxLat - minLat, 0.01) + pad * 2;
  const lonSpan = Math.max(maxLon - minLon, 0.01) + pad * 2;

  const project = (c: Coordinate) => {
    const x = ((c.longitude - (minLon - pad)) / lonSpan) * 100;
    const y = (1 - (c.latitude - (minLat - pad)) / latSpan) * 100;
    return { x, y };
  };

  const pathD = points
    .map((p, i) => {
      const { x, y } = project(p);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const w = project(walker);
  const s = project(start);
  const d = project(destination);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[var(--color-asphalt)]/50 bg-[var(--color-map-bg)] shadow-inner"
      role="img"
      aria-label={`Map placeholder. Walker near ${walker.latitude.toFixed(4)}, ${walker.longitude.toFixed(4)}.`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />
      <svg
        viewBox="0 0 100 100"
        className="h-64 w-full sm:h-80"
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-tan)"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <circle cx={s.x} cy={s.y} r="1.4" fill="var(--color-forest)" />
        <circle cx={d.x} cy={d.y} r="1.4" fill="var(--color-gold)" />
        <circle
          cx={w.x}
          cy={w.y}
          r="2"
          fill="var(--color-rust)"
          stroke="var(--color-cream)"
          strokeWidth="0.5"
        />
      </svg>
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-[var(--color-cream)]/80 sm:text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-forest)]" /> Start
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-rust)]" /> Walker
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-gold)]" /> Destination
        </span>
        <span className="ml-auto text-[var(--color-tan)]">Map placeholder</span>
      </div>
    </div>
  );
}
