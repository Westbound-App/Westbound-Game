import { NextResponse } from "next/server";
import { resetLocalSandbox } from "@/lib/game/local-store";
import { loadLiveFromLocalEngine } from "@/lib/game/engine-service";

export const dynamic = "force-dynamic";

/**
 * Sandbox-only reset. Production games must never expose this.
 */
export async function POST() {
  await resetLocalSandbox();
  const live = await loadLiveFromLocalEngine();
  return NextResponse.json({
    ok: true,
    message: "Sandbox reset",
    walker: live.walker,
  });
}
