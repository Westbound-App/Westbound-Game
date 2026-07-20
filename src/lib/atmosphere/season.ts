/**
 * Season + holiday atmosphere from real calendar and latitude.
 * Winter snow is regional — not applied identically nationwide.
 */

export type SeasonId = "spring" | "summer" | "fall" | "winter";

export type HolidayId =
  | "none"
  | "halloween"
  | "thanksgiving"
  | "holiday_lights"
  | "independence";

export type AtmosphereSnapshot = {
  season: SeasonId;
  seasonLabel: string;
  holiday: HolidayId;
  holidayLabel: string | null;
  /** Prefer seasonal hero still when true */
  seasonalSceneImage: string;
  moodLine: string;
  /** Soft snow / winter-heavy look allowed for this lat */
  winterPrecipitationLikely: boolean;
};

const SEASONAL_SCENES: Record<SeasonId, string> = {
  spring: "/media/scenes/seasonal/spring-roadside.jpg",
  summer: "/media/scenes/seasonal/summer-daytime.jpg",
  fall: "/media/scenes/seasonal/fall-small-town.jpg",
  winter: "/media/scenes/seasonal/winter-holiday.jpg",
};

/**
 * Meteorological season for Northern Hemisphere (calendar month).
 */
export function seasonFromDate(date: Date = new Date()): SeasonId {
  const m = date.getUTCMonth(); // 0–11
  if (m >= 2 && m <= 4) return "spring"; // Mar–May
  if (m >= 5 && m <= 7) return "summer"; // Jun–Aug
  if (m >= 8 && m <= 10) return "fall"; // Sep–Nov
  return "winter"; // Dec–Feb
}

export function seasonLabel(season: SeasonId): string {
  switch (season) {
    case "spring":
      return "Spring";
    case "summer":
      return "Summer";
    case "fall":
      return "Fall";
    case "winter":
      return "Winter";
  }
}

/**
 * Tasteful holiday windows (US, non-political, broad).
 * Uses local calendar date components from UTC for consistency server-side;
 * client may pass local Date.
 */
export function holidayFromDate(date: Date = new Date()): {
  holiday: HolidayId;
  holidayLabel: string | null;
} {
  const m = date.getMonth();
  const d = date.getDate();

  // Independence season: late June – early July
  if ((m === 5 && d >= 25) || (m === 6 && d <= 7)) {
    return { holiday: "independence", holidayLabel: "Fourth of July season" };
  }
  // Halloween: mid–late October
  if (m === 9 && d >= 15) {
    return { holiday: "halloween", holidayLabel: "Halloween season" };
  }
  // Thanksgiving window: Nov 15–30-ish
  if (m === 10 && d >= 15) {
    return { holiday: "thanksgiving", holidayLabel: "Thanksgiving season" };
  }
  // Holiday lights: Dec 1 – Jan 5
  if (m === 11 || (m === 0 && d <= 5)) {
    return { holiday: "holiday_lights", holidayLabel: "Holiday season" };
  }

  return { holiday: "none", holidayLabel: null };
}

/**
 * Snow / heavy winter look is more appropriate further north (and mountains later).
 * Southern latitudes stay “cool + festive” without forced deep snow.
 */
export function winterPrecipitationLikely(latitude: number): boolean {
  return latitude >= 37.5;
}

export function moodLineFor(
  season: SeasonId,
  holiday: HolidayId,
  winterSnow: boolean,
): string {
  if (holiday === "holiday_lights") {
    return winterSnow
      ? "Soft lights and quiet snow — a peaceful evening on the road."
      : "Warm lights in town — a gentle holiday evening on the road.";
  }
  if (holiday === "halloween") {
    return "Pumpkins on porches and autumn air — cozy, not scary.";
  }
  if (holiday === "thanksgiving") {
    return "Harvest colors and open doors — a welcoming stretch of road.";
  }
  if (holiday === "independence") {
    return "Flags and summer gatherings — a cheerful small-town stretch.";
  }

  switch (season) {
    case "spring":
      return "Fresh green and soft mornings — the journey feels hopeful.";
    case "summer":
      return "Long light and warm air — an easy day westbound.";
    case "fall":
      return "Gold leaves and cool air — a cozy day on the road.";
    case "winter":
      return winterSnow
        ? "Quiet winter roads — calm, bright, and steady."
        : "Cooler air and softer days — still a gentle walk west.";
  }
}

/**
 * Full atmosphere for live presentation.
 * Seasonal still is preferred for public mood; place packs can refine later.
 */
export function resolveAtmosphere(
  latitude: number,
  date: Date = new Date(),
): AtmosphereSnapshot {
  const season = seasonFromDate(date);
  const { holiday, holidayLabel } = holidayFromDate(date);
  const winterSnow =
    season === "winter" && winterPrecipitationLikely(latitude);

  // Holiday season in winter → holiday still; fall halloween can keep fall still
  let seasonalSceneImage = SEASONAL_SCENES[season];
  if (holiday === "holiday_lights") {
    seasonalSceneImage = SEASONAL_SCENES.winter;
  } else if (holiday === "halloween" || holiday === "thanksgiving") {
    seasonalSceneImage = SEASONAL_SCENES.fall;
  } else if (holiday === "independence") {
    seasonalSceneImage = SEASONAL_SCENES.summer;
  }

  return {
    season,
    seasonLabel: seasonLabel(season),
    holiday,
    holidayLabel,
    seasonalSceneImage,
    moodLine: moodLineFor(season, holiday, winterSnow),
    winterPrecipitationLikely: winterSnow,
  };
}
