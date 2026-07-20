import { NextResponse } from "next/server";
import { getLocalWorkerHealth } from "@/lib/game/engine-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getLocalWorkerHealth();
  return NextResponse.json({
    ok: true,
    ...health,
    phase: "B",
  });
}
