import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapWmoCode } from "@/lib/weather/provider";

describe("mapWmoCode", () => {
  it("maps the common WMO codes to gentle types", () => {
    assert.equal(mapWmoCode(0).type, "clear");
    assert.equal(mapWmoCode(2).type, "clear");
    assert.equal(mapWmoCode(3).type, "cloudy");
    assert.equal(mapWmoCode(45).type, "fog");
    assert.equal(mapWmoCode(53).type, "rain");
    assert.equal(mapWmoCode(63).type, "rain");
    assert.equal(mapWmoCode(73).type, "snow");
    assert.equal(mapWmoCode(81).type, "rain");
    assert.equal(mapWmoCode(86).type, "snow");
    assert.equal(mapWmoCode(95).type, "rain");
  });

  it("never returns a frightening phrase", () => {
    for (const code of [0, 1, 3, 45, 51, 61, 71, 80, 85, 95, 99, 42]) {
      const { phrase } = mapWmoCode(code);
      assert.ok(phrase.length > 0);
      for (const banned of ["danger", "severe", "warning", "deadly"]) {
        assert.ok(!phrase.toLowerCase().includes(banned));
      }
    }
  });
});
