import { NextResponse } from "next/server";
import { forceOpenControlWindow } from "@/lib/game/engine-service";

export const dynamic = "force-dynamic";

export async function POST() {
  const window = await forceOpenControlWindow();
  return NextResponse.json({
    ok: Boolean(window),
    window,
  });
}
