/**
 * Real weather for the walker's canonical location (vision §7, Phase 2).
 *
 * Uses Open-Meteo (free, keyless) server-side with a short in-memory cache,
 * and degrades gracefully to the deterministic mock so the feed never
 * breaks when the network does. Weather stays gentle in presentation —
 * data may be real, but the tone never turns frightening.
 */

import type { SeasonId } from "@/lib/atmosphere/season";
import type { TimeOfDayId } from "@/lib/scene/presets";
import { mockWeather } from "@/lib/presentation/mock-adapters";

export type WeatherType = "clear" | "cloudy" | "fog" | "rain" | "snow";

export type WeatherSnapshot = {
  tempF: number;
  weatherType: WeatherType;
  /** Gentle human line, e.g. "63°F · light rain on the road" */
  line: string;
  isSimulated: boolean;
  fetchedAt: string;
};

/** Map WMO weather codes (Open-Meteo `weather_code`) to our gentle types. */
export function mapWmoCode(code: number): { type: WeatherType; phrase: string } {
  if (code === 0) return { type: "clear", phrase: "clear skies" };
  if (code === 1 || code === 2) return { type: "clear", phrase: "a few clouds" };
  if (code === 3) return { type: "cloudy", phrase: "soft overcast" };
  if (code === 45 || code === 48) return { type: "fog", phrase: "fog on the road" };
  if (code >= 51 && code <= 57) return { type: "rain", phrase: "a light drizzle" };
  if (code >= 61 && code <= 67) return { type: "rain", phrase: "steady rain" };
  if (code >= 71 && code <= 77) return { type: "snow", phrase: "snow falling softly" };
  if (code >= 80 && code <= 82) return { type: "rain", phrase: "passing showers" };
  if (code === 85 || code === 86) return { type: "snow", phrase: "snow showers" };
  if (code >= 95) return { type: "rain", phrase: "a storm passing nearby" };
  return { type: "cloudy", phrase: "changing skies" };
}

type CacheEntry = { at: number; snap: WeatherSnapshot };
const cache = new Map<string, CacheEntry>();
const REAL_TTL_MS = 15 * 60_000;
const FALLBACK_TTL_MS = 2 * 60_000;

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(1)},${longitude.toFixed(1)}`;
}

export async function getWeather(params: {
  latitude: number;
  longitude: number;
  season: SeasonId;
  timeOfDay: TimeOfDayId;
  dayOfYear: number;
}): Promise<WeatherSnapshot> {
  const key = cacheKey(params.latitude, params.longitude);
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && now - hit.at < (hit.snap.isSimulated ? FALLBACK_TTL_MS : REAL_TTL_MS)) {
    return hit.snap;
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${params.latitude.toFixed(4)}` +
      `&longitude=${params.longitude.toFixed(4)}` +
      `&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) throw new Error(`weather http ${res.status}`);
    const data = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const tempRaw = data.current?.temperature_2m;
    const code = data.current?.weather_code;
    if (typeof tempRaw !== "number" || typeof code !== "number") {
      throw new Error("weather payload missing fields");
    }
    const tempF = Math.round(tempRaw);
    const mapped = mapWmoCode(code);
    const snap: WeatherSnapshot = {
      tempF,
      weatherType: mapped.type,
      line: `${tempF}°F · ${mapped.phrase}`,
      isSimulated: false,
      fetchedAt: new Date(now).toISOString(),
    };
    cache.set(key, { at: now, snap });
    return snap;
  } catch {
    const mock = mockWeather(
      params.season,
      params.timeOfDay,
      params.latitude,
      params.dayOfYear,
    );
    const snap: WeatherSnapshot = {
      tempF: mock.tempF,
      weatherType: "clear",
      line: mock.line,
      isSimulated: true,
      fetchedAt: new Date(now).toISOString(),
    };
    cache.set(key, { at: now, snap });
    return snap;
  }
}
