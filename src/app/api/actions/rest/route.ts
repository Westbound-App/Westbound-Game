import { NextResponse } from "next/server";
import { z } from "zod";
import { purchaseRestBreak } from "@/lib/game/engine-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  playerId: z.string().min(8).max(80),
  idempotencyKey: z.string().min(8).max(120),
});

/** Buy the pair a rest break — the only way the walk ever pauses. */
export async function POST(request: Request) {
  try {
    const body = bodySchema.parse((await request.json()) as unknown);
    const result = await purchaseRestBreak(body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
