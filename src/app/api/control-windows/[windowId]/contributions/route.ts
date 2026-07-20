import { NextResponse } from "next/server";
import { z } from "zod";
import { contributeToOption } from "@/lib/game/engine-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  playerId: z.string().min(8).max(80),
  optionId: z.string().min(1),
  credits: z.number().int().positive(),
  idempotencyKey: z.string().min(8).max(120),
});

type Params = { params: Promise<{ windowId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { windowId } = await params;
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);

    const result = await contributeToOption({
      playerId: body.playerId,
      windowId,
      optionId: body.optionId,
      credits: body.credits,
      idempotencyKey: body.idempotencyKey,
    });

    if (!result.ok) {
      const status =
        result.code === "insufficient"
          ? 402
          : result.code === "window_closed" || result.code === "stale_window"
            ? 409
            : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Contribution failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
