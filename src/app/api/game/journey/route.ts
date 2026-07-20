import { NextResponse } from "next/server";
import { getJourney } from "@/lib/game/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const journey = await getJourney();
  return NextResponse.json(journey, {
    headers: { "Cache-Control": "no-store" },
  });
}
