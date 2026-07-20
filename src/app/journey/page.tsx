import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { getJourney } from "@/lib/game/stats";

export const dynamic = "force-dynamic";

export default async function JourneyPage() {
  const journey = await getJourney();

  return (
    <SiteShell>
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="text-sm text-[var(--color-tan)] hover:text-[var(--color-gold)]"
      >
        ← Live show
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-[var(--color-cream)]">
        Journey
      </h1>
      <p className="mt-2 text-[var(--color-cream)]/65">
        The permanent record of this shared walk — every rest, fork, and
        intervention.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Status" value={journey.status} />
        <Stat label="Miles walked" value={journey.milesWalked.toFixed(2)} />
        <Stat label="Miles left" value={journey.milesRemaining.toFixed(2)} />
        <Stat
          label="Interventions"
          value={String(journey.interventions.length)}
        />
      </div>

      {journey.interventions.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold)]">
            Route changes
          </h2>
          <ol className="mt-4 space-y-3">
            {journey.interventions.map((i) => (
              <li
                key={i.id}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium text-[var(--color-cream)]">
                    {i.summary}
                  </p>
                  <time className="text-xs text-[var(--color-cream)]/45">
                    {new Date(i.appliedAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wider text-[var(--color-tan)]">
                  {i.winningFaction}
                  {i.milesAdded > 0
                    ? ` · +${i.milesAdded.toFixed(2)} mi`
                    : " · route held"}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {journey.resolvedWindows.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold)]">
            Resolved control windows
          </h2>
          <ul className="mt-4 space-y-3">
            {journey.resolvedWindows.map((w) => (
              <li
                key={w.id}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <p className="font-medium text-[var(--color-cream)]">
                  {w.decisionLabel}
                  {w.winningTitle ? ` → ${w.winningTitle}` : ""}
                </p>
                <p className="mt-1 text-xs text-[var(--color-cream)]/50">
                  {w.optionTotals
                    .map((o) => `${o.title}: ${o.credits}`)
                    .join(" · ")}
                </p>
                {w.tieBreak && (
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-tan)]">
                    Tie-break: {w.tieBreak.replaceAll("_", " ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold)]">
          Full timeline
        </h2>
        {journey.events.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-cream)]/55">
            No events yet.
          </p>
        ) : (
          <ol className="relative mt-6 space-y-0 border-l border-[var(--color-tan)]/30 pl-6">
            {journey.events.map((e) => (
              <li key={e.id} className="relative pb-6">
                <span
                  className="absolute -left-[1.55rem] top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-gold)]"
                  aria-hidden
                />
                <time className="text-xs text-[var(--color-cream)]/45">
                  {new Date(e.occurredAt).toLocaleString()}
                </time>
                <h3 className="mt-0.5 font-medium text-[var(--color-cream)]">
                  {e.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-cream)]/65">
                  {e.description}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-tan)]">
                  {e.eventType.replaceAll("_", " ")}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
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
      <p className="mt-0.5 truncate text-sm font-medium text-[var(--color-cream)]">
        {value}
      </p>
    </div>
  );
}
