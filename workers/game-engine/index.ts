/**
 * WESTBOUND game-engine worker.
 *
 * Ticks the local sandbox store on an interval. Progress is also computed
 * on live API reads, so the walker still advances if this process dies —
 * the worker mainly keeps state finalized and healthy for diagnostics.
 *
 * Usage: npm run worker
 */

import { runLocalTick } from "../../src/lib/game/engine-service";
import { getLocalStatePath } from "../../src/lib/game/local-store";

const INTERVAL_MS = Number(process.env.WORKER_TICK_MS ?? 2000);

async function tickOnce(): Promise<void> {
  const { state, metersAdvanced } = await runLocalTick();
  const miles = (state.walker.totalDistanceWalkedMeters / 1609.344).toFixed(3);
  console.log(
    `[worker] v${state.walker.versionNumber} ${state.walker.status} ` +
      `+${metersAdvanced.toFixed(1)}m total=${miles}mi ` +
      `lat=${state.walker.latitude.toFixed(5)} lon=${state.walker.longitude.toFixed(5)} ` +
      `game=${state.game.status}`,
  );
}

async function main(): Promise<void> {
  console.log(`[worker] WESTBOUND game engine starting`);
  console.log(`[worker] store: ${getLocalStatePath()}`);
  console.log(`[worker] interval: ${INTERVAL_MS}ms`);

  while (true) {
    try {
      await tickOnce();
    } catch (err) {
      console.error("[worker] tick error", err);
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

main().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});
