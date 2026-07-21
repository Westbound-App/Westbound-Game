import { NextResponse } from "next/server";
import { loadLiveGameState } from "@/lib/game/load-live-state";
import { resolveAtmosphere } from "@/lib/atmosphere/season";
import { resolvePlace } from "@/lib/places/resolve-scene";
import { timeOfDayFromHour } from "@/lib/scene/presets";

export const dynamic = "force-dynamic";

/**
 * Renderer snapshot — the contract between the authoritative game backend
 * and any renderer or media pipeline (AI scene-generation tooling now; a
 * game-engine scene later would poll the same endpoint).
 *
 * Versioned so renderer and backend can evolve independently. Everything a
 * scene needs to stage itself is here; the renderer must never invent or
 * mutate official state.
 */
const SCHEMA_VERSION = 1;

export async function GET() {
  try {
    const live = await loadLiveGameState(null);
    const coord = {
      latitude: live.walker.latitude,
      longitude: live.walker.longitude,
    };
    const place = resolvePlace(coord);
    const atmosphere = resolveAtmosphere(coord.latitude);
    const now = new Date();

    return NextResponse.json(
      {
        schemaVersion: SCHEMA_VERSION,
        serverTimestamp: now.toISOString(),
        game: {
          id: live.game.id,
          status: live.game.status,
          walkerName: live.game.walkerName,
          dogName: live.game.companionDog?.name ?? "Beacon",
        },
        walker: {
          status: live.walker.status,
          latitude: live.walker.latitude,
          longitude: live.walker.longitude,
          headingDegrees: live.heading,
          speedMps: live.walker.speedMps,
          totalDistanceWalkedMeters: live.walker.totalDistanceWalkedMeters,
          projectedRemainingMeters: live.walker.projectedRemainingMeters,
          stateVersion: live.walker.stateVersion,
        },
        beacon: {
          // Companion state is presentation-driven; renderer picks natural
          // behavior within these bounds. Dedicated state lands with the
          // Supabase port.
          name: live.game.companionDog?.name ?? "Beacon",
          suggestedBehaviors: [
            "walking_beside",
            "trotting_ahead",
            "sniffing",
            "looking_back",
          ],
        },
        environment: {
          season: atmosphere.season,
          holiday: atmosphere.holiday,
          timeOfDay: timeOfDayFromHour(now.getHours() + now.getMinutes() / 60),
          biome: place.biome,
          settlementLabel: place.locationLine,
          landmark: place.landmark
            ? { name: place.landmark.name, headline: place.landmark.headline }
            : null,
          winterPrecipitationLikely: atmosphere.winterPrecipitationLikely,
          isSimulated: true,
        },
        controlWindow: live.controlWindow
          ? {
              status: live.controlWindow.status,
              closesAt: live.controlWindow.closesAt,
            }
          : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to build renderer snapshot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
