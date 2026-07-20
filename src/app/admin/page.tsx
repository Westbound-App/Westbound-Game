import Link from "next/link";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { SiteShell } from "@/components/layout/SiteShell";
import { loadLiveGameState } from "@/lib/game/load-live-state";

export const dynamic = "force-dynamic";

export default async function AdminDiagnosticsPage() {
  const live = await loadLiveGameState();

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-2 flex flex-wrap gap-3 text-sm">
          <Link
            href="/"
            className="text-[var(--color-tan)] hover:text-[var(--color-gold)]"
          >
            ← Public live show
          </Link>
          <Link
            href="/admin/game-debug"
            className="text-[var(--color-tan)] hover:text-[var(--color-gold)]"
          >
            Game debug dashboard →
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-[var(--color-cream)] sm:text-3xl">
          Admin diagnostics
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-cream)]/65">
          Worker health, force tick, force control window, sandbox reset. The
          public entertainment view is separate from this control room.
        </p>

        <div className="mt-8">
          <AdminPanel initial={live} />
        </div>
      </div>
    </SiteShell>
  );
}
