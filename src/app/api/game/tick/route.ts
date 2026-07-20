import { NextResponse } from "next/server";
import { runLocalTick } from "@/lib/game/engine-service";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * Manual / worker tick endpoint for the local engine.
 * Supabase-backed ticking arrives when service-role writer is enabled.
 */
export async function POST() {
  try {
    if (isSupabaseConfigured()) {
      // Prefer local tick until Supabase writer is implemented.
      // Future: runSupabaseTick() with service role.
    }

    const { state, metersAdvanced } = await runLocalTick();
    return NextResponse.json({
      ok: true,
      metersAdvanced,
      version: state.walker.versionNumber,
      status: state.walker.status,
      gameStatus: state.game.status,
      latitude: state.walker.latitude,
      longitude: state.walker.longitude,
      totalDistanceWalkedMeters: state.walker.totalDistanceWalkedMeters,
      tickCount: state.worker.tickCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tick failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
