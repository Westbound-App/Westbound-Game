import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { getLeaderboard } from "@/lib/game/stats";

export const dynamic = "force-dynamic";

export default async function LeaderboardsPage() {
  const board = await getLeaderboard();

  return (
    <SiteShell>
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="text-sm text-[var(--color-tan)] hover:text-[var(--color-gold)]"
      >
        ← Live show
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-[var(--color-cream)]">
        Leaderboards
      </h1>
      <p className="mt-2 text-[var(--color-cream)]/65">
        Who shaped the journey — free test credits only. No cash prizes.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Players" value={String(board.playerCount)} />
        <Stat
          label="Interventions"
          value={String(board.interventionCount)}
        />
        <Stat
          label="Miles added"
          value={board.totalMilesAdded.toFixed(2)}
        />
        <Stat
          label="Windows won (F/D)"
          value={`${board.factionStats.finisher.windowsWon}/${board.factionStats.drifter.windowsWon}`}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <FactionCard
          name="Finishers"
          tone="forest"
          stats={board.factionStats.finisher}
        />
        <FactionCard
          name="Pathfinders"
          tone="rust"
          stats={board.factionStats.drifter}
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <Board title="Most credits spent" rows={board.byCredits} />
        <Board title="Finishers" rows={board.finishers} />
        <Board title="Pathfinders" rows={board.drifters} />
      </div>
    </div>
    </SiteShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-cream)]/50">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-[var(--color-cream)]">
        {value}
      </p>
    </div>
  );
}

function FactionCard({
  name,
  tone,
  stats,
}: {
  name: string;
  tone: "forest" | "rust";
  stats: {
    creditsSpent: number;
    windowsWon: number;
    milesAdded: number;
    milesPrevented: number;
  };
}) {
  const color =
    tone === "forest" ? "text-[var(--color-forest)]" : "text-[var(--color-rust)]";
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h2 className={`font-semibold ${color}`}>{name}</h2>
      <ul className="mt-2 space-y-1 text-sm text-[var(--color-cream)]/70">
        <li>{stats.creditsSpent.toLocaleString()} credits spent</li>
        <li>{stats.windowsWon} windows won</li>
        <li>
          {tone === "rust"
            ? `+${stats.milesAdded.toFixed(2)} miles added`
            : `${stats.milesPrevented.toFixed(2)} miles held`}
        </li>
      </ul>
    </div>
  );
}

function Board({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    rank: number;
    displayName: string;
    faction: string;
    creditsSpent: number;
    successfulContributions: number;
  }>;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold)]">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-cream)]/50">
          No contributions yet. Join the live game and spend credits.
        </p>
      ) : (
        <ol className="mt-3 space-y-2">
          {rows.map((r) => (
            <li
              key={`${title}-${r.rank}-${r.displayName}`}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="font-mono text-[var(--color-tan)]">
                  #{r.rank}
                </span>
                <span className="text-[var(--color-cream)]">
                  {r.displayName}
                </span>
              </span>
              <span className="font-mono text-[var(--color-gold)]">
                {r.creditsSpent.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
