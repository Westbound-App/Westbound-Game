"use client";

import { useCallback, useEffect, useState } from "react";
import type { LiveGamePayload } from "@/lib/game/load-live-state";
import { StatusBadge } from "@/components/game/StatusBadge";

type WorkerHealth = {
  ok: boolean;
  lastTickAt: string | null;
  tickCount: number;
  lastError: string | null;
  store: string;
  stateVersion: number;
  walkerStatus: string;
  gameStatus: string;
};

type Props = {
  initial: LiveGamePayload;
};

export function AdminPanel({ initial }: Props) {
  const [live, setLive] = useState(initial);
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [liveRes, healthRes] = await Promise.all([
      fetch("/api/game/live", { cache: "no-store" }),
      fetch("/api/admin/worker-health", { cache: "no-store" }),
    ]);
    if (liveRes.ok) {
      setLive((await liveRes.json()) as LiveGamePayload);
    }
    if (healthRes.ok) {
      setHealth((await healthRes.json()) as WorkerHealth);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh();
    }, 3000);
    void refresh();
    return () => window.clearInterval(id);
  }, [refresh]);

  async function forceTick() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/game/tick", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      setMessage(data.ok ? "Tick applied" : data.error ?? "Tick failed");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function resetSandbox() {
    if (!window.confirm("Reset the sandbox walker to the start?")) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/reset-sandbox", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; message?: string };
      setMessage(data.message ?? (data.ok ? "Reset" : "Failed"));
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function forceWindow() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/force-window", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; window?: { id: string } };
      setMessage(
        data.ok
          ? `Control window opened (${data.window?.id?.slice(0, 8) ?? "ok"})`
          : "Could not open window",
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const diagnostics = [
    { label: "Game ID", value: live.game.id },
    { label: "Slug", value: live.game.slug },
    { label: "Environment", value: live.game.environment },
    { label: "Game status", value: live.game.status },
    {
      label: "Completion locked",
      value: live.game.completionLocked ? "yes" : "no",
    },
    { label: "Walker status", value: live.walker.status },
    { label: "State version", value: String(live.walker.stateVersion) },
    {
      label: "Miles walked",
      value: (live.walker.totalDistanceWalkedMeters / 1609.344).toFixed(4),
    },
    {
      label: "Miles remaining",
      value: (live.walker.projectedRemainingMeters / 1609.344).toFixed(4),
    },
    {
      label: "Coordinates",
      value: `${live.walker.latitude.toFixed(5)}, ${live.walker.longitude.toFixed(5)}`,
    },
    { label: "Data source", value: live.source },
    { label: "Route segments", value: String(live.segments.length) },
    {
      label: "Active control window",
      value: live.controlWindow
        ? `${live.controlWindow.status} · ${live.controlWindow.secondsRemaining}s`
        : "none",
    },
    {
      label: "Finisher credits",
      value: String(live.factionStats?.finisher.creditsSpent ?? 0),
    },
    {
      label: "Drifter credits",
      value: String(live.factionStats?.drifter.creditsSpent ?? 0),
    },

    {
      label: "Worker last tick",
      value: health?.lastTickAt ?? "—",
    },
    { label: "Worker tick count", value: String(health?.tickCount ?? 0) },
    { label: "Worker store", value: health?.store ?? "—" },
    { label: "Worker last error", value: health?.lastError ?? "none" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={live.walker.status} />
        <span className="text-sm text-[var(--color-cream)]/60">
          {live.game.name}
        </span>
      </div>

      {message && (
        <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void forceTick()}
          className="rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-navy)] disabled:opacity-50"
        >
          Force tick
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void forceWindow()}
          className="rounded-lg border border-[var(--color-gold)]/50 px-4 py-2 text-sm text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 disabled:opacity-50"
        >
          Force control window
        </button>
        <button
          type="button"
          disabled={busy || live.game.environment !== "sandbox"}
          onClick={() => void resetSandbox()}
          className="rounded-lg border border-[var(--color-rust)]/60 px-4 py-2 text-sm text-[var(--color-cream)] hover:bg-[var(--color-rust)]/20 disabled:opacity-50"
        >
          Reset sandbox
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh()}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-[var(--color-cream)]/80 hover:bg-white/5"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Game and worker diagnostics</caption>
          <tbody>
            {diagnostics.map((row) => (
              <tr
                key={row.label}
                className="border-b border-white/5 odd:bg-white/[0.03]"
              >
                <th
                  scope="row"
                  className="px-4 py-2.5 font-medium text-[var(--color-cream)]/70"
                >
                  {row.label}
                </th>
                <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-cream)] sm:text-sm">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
