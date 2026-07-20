import { NextResponse } from "next/server";
import { loadLiveGameState } from "@/lib/game/load-live-state";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId");
    const live = await loadLiveGameState(playerId);
    return NextResponse.json(live, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load game";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
