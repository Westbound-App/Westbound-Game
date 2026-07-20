import { LiveGameClient } from "@/components/game/LiveGameClient";
import { SiteShell } from "@/components/layout/SiteShell";
import { loadLiveGameState } from "@/lib/game/load-live-state";

export const dynamic = "force-dynamic";

/**
 * Internal engineering / location-debug view.
 * Not the public entertainment experience.
 */
export default async function GameDebugPage() {
  const live = await loadLiveGameState();

  return (
    <SiteShell>
      <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-100">
        <strong>Internal debug view</strong> — coordinates, map, Street View
        reference, and full dashboard. Public show is at{" "}
        <a href="/" className="underline">
          /
        </a>
        .
      </div>
      <LiveGameClient initial={live} />
    </SiteShell>
  );
}
