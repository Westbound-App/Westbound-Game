import { NextResponse } from "next/server";
import { getPlayerAccount } from "@/lib/game/stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const playerId = new URL(request.url).searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json({ error: "playerId required" }, { status: 400 });
  }
  const account = await getPlayerAccount(playerId);
  if (!account) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
  return NextResponse.json(account, {
    headers: { "Cache-Control": "no-store" },
  });
}
