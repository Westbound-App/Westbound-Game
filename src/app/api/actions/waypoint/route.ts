import { NextResponse } from "next/server";
import { z } from "zod";
import { purchaseWaypointSend } from "@/lib/game/engine-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  playerId: z.string().min(8).max(80),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  label: z.string().min(1).max(60).optional(),
  idempotencyKey: z.string().min(8).max(120),
});

/**
 * Send them to a chosen waypoint (walk there, then the route recalculates
 * onward to the final destination).
 */
export async function POST(request: Request) {
  try {
    const body = bodySchema.parse((await request.json()) as unknown);
    const result = await purchaseWaypointSend(body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
