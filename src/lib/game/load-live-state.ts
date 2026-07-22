import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loadLiveFromLocalEngine } from "@/lib/game/engine-service";
import type {
  ControlPublicView,
  FactionTotals,
  PlayerPublicView,
} from "@/lib/types/control";
import type {
  GamePublicView,
  RouteSegment,
  WalkerSnapshot,
} from "@/lib/types/domain";
import type {
  GameEventRow,
  GameRow,
  RouteSegmentRow,
  WalkerStateRow,
} from "@/lib/types/database";

export type LiveGamePayload = {
  source: "supabase" | "fallback";
  game: GamePublicView;
  walker: WalkerSnapshot;
  /** Compass heading along current segment (degrees). */
  heading: number;
  segments: RouteSegment[];
  events: Array<{
    id: string;
    title: string;
    description: string;
    occurredAt: string;
    eventType: string;
  }>;
  controlWindow: ControlPublicView | null;
  factionStats: {
    finisher: FactionTotals;
    drifter: FactionTotals;
  };
  player: PlayerPublicView | null;
  /** Real (or gracefully simulated) weather at the walker's location */
  weather?: import("@/lib/weather/provider").WeatherSnapshot | null;
  /** Canonical daily distance (absent on stores that predate it) */
  daily?: {
    dayNumber: number;
    milesToday: number;
    yesterdayMiles: number | null;
  } | null;
  error: string | null;
};

function emptyFactions() {
  return {
    finisher: {
      creditsSpent: 0,
      windowsWon: 0,
      milesAdded: 0,
      milesPrevented: 0,
    },
    drifter: {
      creditsSpent: 0,
      windowsWon: 0,
      milesAdded: 0,
      milesPrevented: 0,
    },
  };
}

function mapGame(row: GameRow): GamePublicView {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    environment: row.environment,
    status: row.status,
    walkerName:
      typeof row.config_json.walkerName === "string"
        ? row.config_json.walkerName
        : "The Walker",
    companionDog: {
      name:
        typeof (row.config_json.companionDog as { name?: string } | undefined)
          ?.name === "string"
          ? (row.config_json.companionDog as { name: string }).name
          : "Beacon",
      breedMix:
        typeof (row.config_json.companionDog as { breedMix?: string } | undefined)
          ?.breedMix === "string"
          ? (row.config_json.companionDog as { breedMix: string }).breedMix
          : "Bernese Mountain Dog × Siberian Husky",
      description:
        typeof (
          row.config_json.companionDog as { description?: string } | undefined
        )?.description === "string"
          ? (row.config_json.companionDog as { description: string }).description
          : "Mostly black with white markings; walks with him.",
    },
    start: {
      latitude: row.start_latitude,
      longitude: row.start_longitude,
    },
    destination: {
      latitude: row.destination_latitude,
      longitude: row.destination_longitude,
    },
    destinationRadiusMeters: row.destination_radius_meters,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    completionLocked: row.completion_locked,
    config: row.config_json,
  };
}

function mapWalker(row: WalkerStateRow): WalkerSnapshot {
  return {
    gameId: row.game_id,
    status: row.status,
    latitude: row.latitude,
    longitude: row.longitude,
    speedMps: row.current_speed_mps,
    segmentId: row.active_route_segment_id,
    distanceIntoSegmentMeters: row.distance_into_segment_meters,
    totalDistanceWalkedMeters: row.total_distance_walked_meters,
    originalRouteDistanceMeters: row.original_route_distance_meters,
    projectedRemainingMeters: row.current_projected_remaining_meters,
    movementStartedAt: row.movement_started_at,
    nextStateChangeAt: row.next_state_change_at,
    serverTimestamp: row.updated_at,
    stateVersion: Number(row.version_number),
  };
}

function mapSegment(row: RouteSegmentRow): RouteSegment {
  return {
    id: row.id,
    routeVersionId: row.route_version_id,
    segmentIndex: row.segment_index,
    start: {
      latitude: row.start_latitude,
      longitude: row.start_longitude,
    },
    end: {
      latitude: row.end_latitude,
      longitude: row.end_longitude,
    },
    distanceMeters: row.distance_meters,
    cumulativeStartMeters: row.cumulative_start_meters,
    cumulativeEndMeters: row.cumulative_end_meters,
    pedestrianAllowed: row.pedestrian_allowed,
  };
}

function mapEvent(row: GameEventRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    occurredAt: row.occurred_at,
    eventType: row.event_type,
  };
}

export async function loadLiveGameState(
  playerId?: string | null,
): Promise<LiveGamePayload> {
  const live = await loadLiveCore(playerId);
  return attachWeather(live);
}

/**
 * Attach the real (or gracefully simulated) weather snapshot for the
 * walker's location. Never fails the payload over weather.
 */
async function attachWeather(live: LiveGamePayload): Promise<LiveGamePayload> {
  try {
    const { getWeather } = await import("@/lib/weather/provider");
    const { resolveAtmosphere } = await import("@/lib/atmosphere/season");
    const { timeOfDayFromHour } = await import("@/lib/scene/presets");
    const now = new Date();
    const timeZone =
      typeof live.game.config?.gameTimezone === "string"
        ? (live.game.config.gameTimezone as string)
        : "America/New_York";
    let hour = now.getHours();
    try {
      hour =
        Number(
          new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            hour12: false,
            timeZone,
          }).format(now),
        ) % 24;
    } catch {
      // keep server-local hour
    }
    const weather = await getWeather({
      latitude: live.walker.latitude,
      longitude: live.walker.longitude,
      season: resolveAtmosphere(live.walker.latitude, now).season,
      timeOfDay: timeOfDayFromHour(hour),
      dayOfYear: Math.floor(
        (now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86_400_000,
      ),
    });
    return { ...live, weather };
  } catch {
    return live;
  }
}

async function loadLiveCore(
  playerId?: string | null,
): Promise<LiveGamePayload> {
  if (!isSupabaseConfigured()) {
    return loadLiveFromLocalEngine(playerId);
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("slug", "sandbox-portland")
      .maybeSingle();

    if (gameError || !gameData) {
      throw new Error(gameError?.message ?? "Sandbox game not found");
    }

    const gameRow = gameData as GameRow;
    const game = mapGame(gameRow);

    const { data: walkerData, error: walkerError } = await supabase
      .from("walker_state")
      .select("*")
      .eq("game_id", game.id)
      .maybeSingle();

    if (walkerError || !walkerData) {
      throw new Error(walkerError?.message ?? "Walker state not found");
    }

    const walkerRow = walkerData as WalkerStateRow;

    let segments: RouteSegment[] = [];
    if (gameRow.current_route_version_id) {
      const { data: segmentRows } = await supabase
        .from("route_segments")
        .select("*")
        .eq("route_version_id", gameRow.current_route_version_id)
        .order("segment_index", { ascending: true });

      segments = ((segmentRows ?? []) as RouteSegmentRow[]).map(mapSegment);
    }

    const { data: eventRows } = await supabase
      .from("game_events")
      .select("*")
      .eq("game_id", game.id)
      .eq("visibility", "public")
      .order("occurred_at", { ascending: false })
      .limit(10);

    const walker = mapWalker(walkerRow);
    const { headingAlongRoute } = await import("@/lib/game/position");
    return {
      source: "supabase",
      game,
      walker,
      heading: headingAlongRoute(segments, 0),
      segments,
      events: ((eventRows ?? []) as GameEventRow[]).map(mapEvent),
      controlWindow: null,
      factionStats: emptyFactions(),
      player: null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const local = await loadLiveFromLocalEngine(playerId);
    return {
      ...local,
      error: message,
    };
  }
}
