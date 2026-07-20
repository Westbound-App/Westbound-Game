import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "westbound-web",
    phase: "B",
    timestamp: new Date().toISOString(),
    worker: {
      status: "local-engine",
      note: "Ticks on /api/game/live reads; optional npm run worker",
    },
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  });
}
