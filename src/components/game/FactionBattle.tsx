import type { FactionTotals } from "@/lib/types/control";

type Props = {
  finisher: FactionTotals;
  drifter: FactionTotals;
};

export function FactionBattle({ finisher, drifter }: Props) {
  const total = finisher.creditsSpent + drifter.creditsSpent;
  const finisherPct = total > 0 ? (finisher.creditsSpent / total) * 100 : 50;

  return (
    <section
      aria-label="Faction battle"
      className="rounded-xl border border-white/10 bg-white/5 p-4"
    >
      <h2 className="text-sm font-semibold text-[var(--color-cream)]">
        Faction battle
      </h2>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="bg-[var(--color-forest)] transition-all"
          style={{ width: `${finisherPct}%` }}
          title="Finishers"
        />
        <div
          className="bg-[var(--color-rust)] transition-all"
          style={{ width: `${100 - finisherPct}%` }}
          title="Pathfinders"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-medium text-[var(--color-forest)]">Finishers</p>
          <p className="text-[var(--color-cream)]/70">
            {finisher.creditsSpent.toLocaleString()} credits
          </p>
          <p className="text-[var(--color-cream)]/50">
            {finisher.windowsWon} windows · {finisher.milesPrevented.toFixed(1)}{" "}
            mi held
          </p>
        </div>
        <div className="text-right">
          <p className="font-medium text-[var(--color-rust)]">Pathfinders</p>
          <p className="text-[var(--color-cream)]/70">
            {drifter.creditsSpent.toLocaleString()} credits
          </p>
          <p className="text-[var(--color-cream)]/50">
            {drifter.windowsWon} windows · +{drifter.milesAdded.toFixed(1)} mi
          </p>
        </div>
      </div>
    </section>
  );
}
