/**
 * Living-scene visual presets: time-of-day lighting rigs + biome palettes.
 * Pure data + tiny deterministic helpers — no three.js imports here so the
 * module stays testable and server-safe.
 */

import type { SceneBiome } from "@/lib/places/types";
import type { SeasonId } from "@/lib/atmosphere/season";

export type TimeOfDayId = "day" | "golden_hour" | "dusk" | "night";

export type LightingPreset = {
  id: TimeOfDayId;
  /** Sky gradient stops */
  skyTop: string;
  skyHorizon: string;
  skyBottom: string;
  /** Fog matches horizon for seamless depth falloff */
  fogColor: string;
  fogNear: number;
  fogFar: number;
  sunColor: string;
  sunIntensity: number;
  /** Sun position (also drives the visible sun disc) */
  sunPosition: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  ambientIntensity: number;
  /** Emissive strength for house windows (0 day → 1 night) */
  windowGlow: number;
  showStars: boolean;
  sunDiscColor: string;
  sunDiscSize: number;
};

export const LIGHTING: Record<TimeOfDayId, LightingPreset> = {
  day: {
    id: "day",
    skyTop: "#5f97cf",
    skyHorizon: "#cfe3ee",
    skyBottom: "#e6eef2",
    fogColor: "#cfe3ee",
    fogNear: 40,
    fogFar: 165,
    sunColor: "#fff2dc",
    sunIntensity: 2.4,
    sunPosition: [-24, 38, -30],
    hemiSky: "#bcd8ee",
    hemiGround: "#4a5a42",
    hemiIntensity: 0.6,
    ambientIntensity: 0.22,
    windowGlow: 0.05,
    showStars: false,
    sunDiscColor: "#fff7e6",
    sunDiscSize: 4,
  },
  golden_hour: {
    id: "golden_hour",
    skyTop: "#3d5a87",
    skyHorizon: "#f0a95f",
    skyBottom: "#f6c98a",
    fogColor: "#eaa768",
    fogNear: 26,
    fogFar: 140,
    sunColor: "#ffb066",
    sunIntensity: 2.6,
    sunPosition: [-34, 10, -46],
    hemiSky: "#ffd9a8",
    hemiGround: "#3e4a38",
    hemiIntensity: 0.55,
    ambientIntensity: 0.24,
    windowGlow: 0.35,
    showStars: false,
    sunDiscColor: "#ffd9a0",
    sunDiscSize: 6,
  },
  dusk: {
    id: "dusk",
    skyTop: "#2a3357",
    skyHorizon: "#c96f6a",
    skyBottom: "#8d5a74",
    fogColor: "#8d5a74",
    fogNear: 22,
    fogFar: 120,
    sunColor: "#e08a6a",
    sunIntensity: 1.2,
    sunPosition: [-40, 4, -50],
    hemiSky: "#7a6f96",
    hemiGround: "#2e3630",
    hemiIntensity: 0.42,
    ambientIntensity: 0.16,
    windowGlow: 0.8,
    showStars: true,
    sunDiscColor: "#f2a37c",
    sunDiscSize: 7,
  },
  night: {
    id: "night",
    skyTop: "#0b1226",
    skyHorizon: "#1d2c4b",
    skyBottom: "#131c33",
    fogColor: "#16223c",
    fogNear: 18,
    fogFar: 105,
    sunColor: "#8ea6cf",
    sunIntensity: 0.55,
    sunPosition: [26, 30, -34],
    hemiSky: "#25355c",
    hemiGround: "#10161c",
    hemiIntensity: 0.35,
    ambientIntensity: 0.12,
    windowGlow: 1,
    showStars: true,
    sunDiscColor: "#e8eefc",
    sunDiscSize: 3.2,
  },
};

export type BiomePalette = {
  ground: string;
  groundEdge: string;
  hills: string;
  treeline: string;
  road: string;
  roadLine: string;
  conifer: [string, string];
  deciduous: [string, string];
  trunk: string;
  /** 0–1: how often a tile spawns a house */
  houseDensity: number;
  /** 0–1: overall tree density */
  treeDensity: number;
};

const NEW_ENGLAND: BiomePalette = {
  ground: "#4c5b3f",
  groundEdge: "#5a6a49",
  hills: "#55685f",
  treeline: "#33473a",
  road: "#3a3f46",
  roadLine: "#e6d9a3",
  conifer: ["#2e4a33", "#3e5c3a"],
  deciduous: ["#4c6b3a", "#5e7c42"],
  trunk: "#4a3527",
  houseDensity: 0.35,
  treeDensity: 0.9,
};

const PLAINS: BiomePalette = {
  ground: "#6a6f43",
  groundEdge: "#7a7d4c",
  hills: "#6f7458",
  treeline: "#4e5a40",
  road: "#41454b",
  roadLine: "#e6d9a3",
  conifer: ["#3c5238", "#47603f"],
  deciduous: ["#5b7040", "#6d8148"],
  trunk: "#54402e",
  houseDensity: 0.14,
  treeDensity: 0.3,
};

const CANYON: BiomePalette = {
  ground: "#a3714c",
  groundEdge: "#b07e55",
  hills: "#9c5f43",
  treeline: "#6e5a3c",
  road: "#4a4440",
  roadLine: "#e6d9a3",
  conifer: ["#4f5c38", "#5a6840"],
  deciduous: ["#7a7444", "#8a7f4a"],
  trunk: "#5e4530",
  houseDensity: 0.05,
  treeDensity: 0.22,
};

export const BIOME_PALETTES: Record<SceneBiome, BiomePalette> = {
  new_england_town: NEW_ENGLAND,
  northeast_city: { ...NEW_ENGLAND, houseDensity: 0.7, treeDensity: 0.5 },
  midwest_industrial: { ...NEW_ENGLAND, ground: "#57603f", houseDensity: 0.45 },
  great_plains: PLAINS,
  southwest_canyon: CANYON,
  pacific_coast: { ...NEW_ENGLAND, ground: "#4d5f45", hills: "#4f6660" },
  generic_highway: { ...NEW_ENGLAND, houseDensity: 0.18 },
};

/** Fall repaint applied on top of the biome palette. */
export function seasonalize(p: BiomePalette, season: SeasonId): BiomePalette {
  if (season === "fall") {
    return {
      ...p,
      deciduous: ["#c97b2f", "#b5542e"],
      ground: "#5d5a38",
      groundEdge: "#6d6640",
    };
  }
  if (season === "winter") {
    return {
      ...p,
      deciduous: ["#7a6a55", "#6d6052"],
      ground: "#5a6055",
      groundEdge: "#67705f",
    };
  }
  if (season === "spring") {
    return { ...p, deciduous: ["#5f8a44", "#74a04e"] };
  }
  return p;
}

/** Pick time of day from a local hour (dev override via ?tod=). */
export function timeOfDayFromHour(hour: number): TimeOfDayId {
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "golden_hour";
  if (hour >= 20 && hour < 21.5) return "dusk";
  if (hour >= 5 && hour < 8) return "golden_hour";
  return "night";
}

/** Deterministic 0–1 hash from an integer seed (mulberry32 single step). */
export function hash01(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** n deterministic values in [0,1) for a tile. */
export function tileRandoms(tileIndex: number, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    out.push(hash01(tileIndex * 97 + i * 13));
  }
  return out;
}
