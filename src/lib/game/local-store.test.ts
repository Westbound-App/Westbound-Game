import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { firstWritableDir } from "@/lib/game/local-store";

// A regular file used as a path component makes mkdir fail with ENOTDIR —
// a real, root-proof stand-in for the read-only project dir on serverless
// hosts (e.g. Netlify's /var/task).
const blockerFile = path.join(os.tmpdir(), `wb-blocker-${process.pid}`);
const unwritableA = path.join(blockerFile, ".data");
const unwritableB = path.join(blockerFile, "deeper", "westbound-data");
const writable = path.join(os.tmpdir(), `wb-writable-${process.pid}`);

describe("firstWritableDir (read-only filesystem fallback)", () => {
  before(async () => {
    await fs.writeFile(blockerFile, "not a directory", "utf8");
  });

  after(async () => {
    await fs.rm(blockerFile, { force: true });
    await fs.rm(writable, { recursive: true, force: true });
  });

  it("skips an unwritable project dir and uses the temp fallback", async () => {
    const dir = await firstWritableDir([unwritableA, writable]);
    assert.equal(dir, writable);
  });

  it("returns null when every candidate is unwritable (memory-only mode)", async () => {
    const dir = await firstWritableDir([unwritableA, unwritableB]);
    assert.equal(dir, null);
  });

  it("prefers the first candidate when it is writable", async () => {
    const dir = await firstWritableDir([writable, unwritableA]);
    assert.equal(dir, writable);
  });
});
