import { NextResponse } from "next/server";
import { z } from "zod";
import { registerOrGetPlayer } from "@/lib/game/engine-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  playerId: z.string().min(8).max(80),
  displayName: z.string().min(1).max(32).optional(),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);
    const player = await registerOrGetPlayer(body);
    return NextResponse.json({
      ok: true,
      player: {
        id: player.id,
        displayName: player.displayName,
        faction: player.faction,
        availableBalance: player.availableBalance,
        lifetimeCreditsSpent: player.lifetimeCreditsSpent,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Join failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
