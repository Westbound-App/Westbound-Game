import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveSceneMedia,
  type SceneMediaEntry,
} from "@/lib/media/manifest";

const entries: SceneMediaEntry[] = [
  {
    id: "generic",
    kind: "image",
    url: "/a.jpg",
    biome: "any",
    season: "any",
    timeOfDay: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: null,
  },
  {
    id: "biome-still",
    kind: "image",
    url: "/b.jpg",
    biome: "new_england_town",
    season: "any",
    timeOfDay: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: null,
  },
  {
    id: "biome-season-video",
    kind: "video",
    url: "/c.mp4",
    biome: "new_england_town",
    season: "summer",
    timeOfDay: "any",
    landmarkId: null,
    source: "generated_locked",
    label: null,
  },
  {
    id: "landmark-derby",
    kind: "image",
    url: "/derby.jpg",
    biome: "midwest_industrial",
    season: "any",
    timeOfDay: "any",
    landmarkId: "derby-downs",
    source: "generated_locked",
    label: null,
  },
];

describe("resolveSceneMedia", () => {
  it("prefers the most specific biome+season match", () => {
    const hit = resolveSceneMedia(
      { biome: "new_england_town", season: "summer", timeOfDay: "day" },
      entries,
    );
    assert.equal(hit?.id, "biome-season-video");
  });

  it("falls back to biome, then generic", () => {
    const biomeHit = resolveSceneMedia(
      { biome: "new_england_town", season: "winter", timeOfDay: "day" },
      entries,
    );
    assert.equal(biomeHit?.id, "biome-still");

    const genericHit = resolveSceneMedia(
      { biome: "great_plains", season: "winter", timeOfDay: "night" },
      entries,
    );
    assert.equal(genericHit?.id, "generic");
  });

  it("landmark entries win when the walker is at the landmark", () => {
    const hit = resolveSceneMedia(
      {
        biome: "midwest_industrial",
        season: "fall",
        timeOfDay: "golden_hour",
        landmarkId: "derby-downs",
      },
      entries,
    );
    assert.equal(hit?.id, "landmark-derby");
  });

  it("never serves a landmark entry away from its landmark", () => {
    const hit = resolveSceneMedia(
      { biome: "midwest_industrial", season: "fall", timeOfDay: "day" },
      entries,
    );
    assert.equal(hit?.id, "generic");
  });

  it("returns null when nothing matches", () => {
    const hit = resolveSceneMedia(
      { biome: "pacific_coast", season: "summer", timeOfDay: "day" },
      [entries[3]],
    );
    assert.equal(hit, null);
  });
});
