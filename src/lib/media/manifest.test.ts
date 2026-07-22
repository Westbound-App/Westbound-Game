import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveSceneMedia,
  type SceneMediaEntry,
} from "@/lib/media/manifest";

function entry(partial: Partial<SceneMediaEntry> & { id: string }): SceneMediaEntry {
  return {
    kind: "image",
    url: `/${partial.id}.jpg`,
    biome: "any",
    season: "any",
    timeOfDay: "any",
    context: "any",
    landmarkId: null,
    source: "stock_placeholder",
    label: null,
    ...partial,
  };
}

const entries: SceneMediaEntry[] = [
  entry({ id: "generic" }),
  entry({ id: "biome-still", biome: "new_england_town" }),
  entry({
    id: "biome-season-video",
    kind: "video",
    url: "/c.mp4",
    biome: "new_england_town",
    season: "summer",
    context: "walking",
    source: "generated_locked",
  }),
  entry({
    id: "landmark-derby",
    biome: "midwest_industrial",
    landmarkId: "derby-downs",
    source: "generated_locked",
  }),
  entry({
    id: "campsite-night",
    biome: "new_england_town",
    season: "summer",
    timeOfDay: "night",
    context: "resting",
    source: "generated_locked",
  }),
];

describe("resolveSceneMedia", () => {
  it("prefers the most specific biome+season match", () => {
    const hit = resolveSceneMedia(
      {
        biome: "new_england_town",
        season: "summer",
        timeOfDay: "day",
        context: "walking",
      },
      entries,
    );
    assert.equal(hit?.id, "biome-season-video");
  });

  it("falls back to biome, then generic", () => {
    const biomeHit = resolveSceneMedia(
      {
        biome: "new_england_town",
        season: "winter",
        timeOfDay: "day",
        context: "walking",
      },
      entries,
    );
    assert.equal(biomeHit?.id, "biome-still");

    const genericHit = resolveSceneMedia(
      {
        biome: "great_plains",
        season: "winter",
        timeOfDay: "night",
        context: "walking",
      },
      entries,
    );
    assert.equal(genericHit?.id, "generic");
  });

  it("prefers canon characters over placeholders even across contexts", () => {
    const hit = resolveSceneMedia(
      {
        biome: "new_england_town",
        season: "summer",
        timeOfDay: "day",
        context: "resting",
      },
      entries,
    );
    // No canon resting scene exists yet: the character-locked walking scene
    // (right characters) must beat placeholder scenery (wrong characters)
    assert.equal(hit?.id, "biome-season-video");
  });

  it("serves the resting night scene after dark", () => {
    const hit = resolveSceneMedia(
      {
        biome: "new_england_town",
        season: "summer",
        timeOfDay: "night",
        context: "resting",
      },
      entries,
    );
    assert.equal(hit?.id, "campsite-night");
  });

  it("landmark entries win at the landmark and never leak elsewhere", () => {
    const atLandmark = resolveSceneMedia(
      {
        biome: "midwest_industrial",
        season: "fall",
        timeOfDay: "golden_hour",
        context: "walking",
        landmarkId: "derby-downs",
      },
      entries,
    );
    assert.equal(atLandmark?.id, "landmark-derby");

    const elsewhere = resolveSceneMedia(
      {
        biome: "midwest_industrial",
        season: "fall",
        timeOfDay: "day",
        context: "walking",
      },
      entries,
    );
    assert.equal(elsewhere?.id, "generic");
  });

  it("rotates among equally specific variants on the time bucket", () => {
    const variants = [
      entry({ id: "var-a", biome: "great_plains", context: "walking" }),
      entry({ id: "var-b", biome: "great_plains", context: "walking" }),
    ];
    const query = {
      biome: "great_plains" as const,
      season: "summer" as const,
      timeOfDay: "day" as const,
      context: "walking" as const,
    };
    const first = resolveSceneMedia(query, variants, 0);
    const second = resolveSceneMedia(query, variants, 5 * 60 * 1000);
    const third = resolveSceneMedia(query, variants, 10 * 60 * 1000);
    assert.equal(first?.id, "var-a");
    assert.equal(second?.id, "var-b");
    assert.equal(third?.id, "var-a");
  });

  it("returns null when nothing matches", () => {
    const hit = resolveSceneMedia(
      {
        biome: "pacific_coast",
        season: "summer",
        timeOfDay: "day",
        context: "walking",
      },
      [entries[3]],
    );
    assert.equal(hit, null);
  });
});
