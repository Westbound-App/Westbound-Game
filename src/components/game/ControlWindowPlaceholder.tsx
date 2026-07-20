export function ControlWindowPlaceholder() {
  return (
    <section
      aria-label="Control window"
      className="rounded-xl border border-dashed border-[var(--color-asphalt)]/60 bg-[var(--color-navy)]/40 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-[var(--color-cream)]">
            Control window
          </h2>
          <p className="mt-1 text-sm text-[var(--color-cream)]/65">
            No decision point is open. When the walker approaches an eligible
            intersection, Finishers and Drifters will spend credits here.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--color-tan)]">
          Phase B+
        </span>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          "Support route",
          "Northern detour",
          "Southern detour",
          "Route shield",
        ].map((label) => (
          <li
            key={label}
            className="rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm text-[var(--color-cream)]/40"
          >
            {label}
            <span className="mt-1 block text-xs">Unavailable — not built yet</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
