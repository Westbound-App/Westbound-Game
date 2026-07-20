import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";

export default function HowItWorksPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="text-sm text-[var(--color-tan)] hover:text-[var(--color-gold)]"
        >
          ← Live show
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--color-cream)]">
          How it works
        </h1>
        <p className="mt-4 text-[var(--color-cream)]/80">
          A kind man and his dog, Beacon, are walking west across America.
          Everyone watches the same gentle journey, on the same clock. The world
          is warm, seasonal, and welcoming—made to feel calm, not stressful.
        </p>
        <ol className="mt-8 space-y-6">
          <Step
            n="1"
            title="They walk"
            body="At a human pace, on good roads and trails, with rest along the way. He waves, smiles, and enjoys the view. Beacon trots with him. Progress continues even when nobody is watching."
          />
          <Step
            n="2"
            title="You can help—or gently guide"
            body="Finishers support the westbound path. Pathfinders suggest scenic detours. Watchers simply enjoy the walk. Nobody is attacking him—the tone stays playful and kind."
          />
          <Step
            n="3"
            title="Choices at friendly forks"
            body="When a fork appears, a short window opens. Spend free test credits to keep him west, guide him north, or nudge him south. Outcomes are fair and clear."
          />
          <Step
            n="4"
            title="Seasons and holidays"
            body="The road changes with the calendar and the region—spring blossoms, summer light, fall leaves, winter lights (and snow where it belongs). Holidays stay tasteful and family-friendly."
          />
          <Step
            n="5"
            title="If he reaches the Pacific"
            body="The live journey ends forever and becomes a permanent story. No reset of the real crossing—only sandbox tests may restart."
          />
        </ol>
        <p className="mt-10 text-sm text-[var(--color-cream)]/55">
          WESTBOUND is meant to feel wholesome, peaceful, and safe enough to
          leave on in the background—or watch with family.
        </p>
      </div>
    </SiteShell>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)]/15 text-sm font-semibold text-[var(--color-gold)]">
        {n}
      </span>
      <div>
        <h2 className="font-semibold text-[var(--color-cream)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--color-cream)]/70">{body}</p>
      </div>
    </li>
  );
}
