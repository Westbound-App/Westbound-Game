import { CinematicLive } from "@/components/live/CinematicLive";
import { loadLiveGameState } from "@/lib/game/load-live-state";
import { getFallbackGameView, getFallbackWalkerSnapshot, getFallbackSegments, getFallbackEvents } from "@/lib/game/sandbox-fallback";
import type { LiveGamePayload } from "@/lib/game/load-live-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function emergencyFallback(): LiveGamePayload {
  return {
    source: "fallback",
    game: getFallbackGameView(),
    walker: getFallbackWalkerSnapshot(),
    heading: 270,
    segments: getFallbackSegments(),
    events: getFallbackEvents(),
    controlWindow: null,
    factionStats: {
      finisher: {
        creditsSpent: 0,
        windowsWon: 0,
        milesAdded: 0,
        milesPrevented: 0,
      },
      drifter: {
        creditsSpent: 0,
        windowsWon: 0,
        milesAdded: 0,
        milesPrevented: 0,
      },
    },
    player: null,
    error: null,
  };
}

/**
 * Public live show — always renders a feed on refresh.
 * If state load throws, we still show cinematic UI with safe defaults.
 */
export default async function PublicLivePage() {
  let live: LiveGamePayload;
  try {
    live = await loadLiveGameState();
  } catch {
    live = emergencyFallback();
  }

  return <CinematicLive initial={live} />;
}
