import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/game/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const board = await getLeaderboard();
  return NextResponse.json(board, {
    headers: { "Cache-Control": "no-store" },
  });
}
