"use client";

import { useEffect, useMemo, useState } from "react";

type StreetViewResponse = {
  available: boolean;
  mode: string;
  latitude: number;
  longitude: number;
  heading: number;
  mapsLink: string;
  imageUrl: string | null;
  message: string | null;
};

type Props = {
  latitude: number;
  longitude: number;
  heading: number;
};

/**
 * Road-level camera.
 * Prefers Google Static Street View when GOOGLE_MAPS_API_KEY is set.
 * Otherwise embeds a public Google Maps street panorama (no key) when possible.
 */
export function StreetViewPanel({ latitude, longitude, heading }: Props) {
  const [data, setData] = useState<StreetViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeFailed, setIframeFailed] = useState(false);

  // Round coords so we don't thrash reloads every poll
  const latQ = Math.round(latitude * 1e4) / 1e4;
  const lngQ = Math.round(longitude * 1e4) / 1e4;
  const headQ = Math.round(heading);

  useEffect(() => {
    let cancelled = false;
    setIframeFailed(false);
    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const q = new URLSearchParams({
            lat: String(latQ),
            lng: String(lngQ),
            heading: String(headQ),
          });
          const res = await fetch(`/api/streetview?${q}`, { cache: "no-store" });
          if (!res.ok) throw new Error("sv failed");
          const json = (await res.json()) as StreetViewResponse;
          if (!cancelled) setData(json);
        } catch {
          if (!cancelled) {
            setData({
              available: false,
              mode: "error",
              latitude: latQ,
              longitude: lngQ,
              heading: headQ,
              mapsLink: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latQ},${lngQ}&heading=${headQ}`,
              imageUrl: null,
              message: "Could not load street imagery.",
            });
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [latQ, lngQ, headQ]);

  const embedSrc = useMemo(() => {
    // Classic public Street View embed (works without API key in many browsers).
    // cbll = camera lat,lng; cbp = street view params (pitch, heading, ...)
    return `https://maps.google.com/maps?q=&layer=c&cbll=${latQ},${lngQ}&cbp=11,${headQ},0,0,0&hl=en&output=svembed`;
  }, [latQ, lngQ, headQ]);

  const showStatic = Boolean(data?.imageUrl);
  const showEmbed = !showStatic && !iframeFailed;

  return (
    <section
      aria-label="Road camera"
      className="overflow-hidden rounded-xl border border-[var(--color-asphalt)]/50 bg-[var(--color-map-bg)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-gold)]">
            Road camera
          </p>
          <p className="text-xs text-[var(--color-cream)]/60">
            Street-level view near the walker
          </p>
        </div>
        <span className="font-mono text-[10px] text-[var(--color-cream)]/40">
          {latQ.toFixed(4)}°, {lngQ.toFixed(4)}° · {headQ}°
        </span>
      </div>

      <div className="relative aspect-[16/10] w-full bg-[#0b1220]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-[var(--color-cream)]/50">
            Loading road view…
          </div>
        )}

        {showStatic && data?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.imageUrl}
            alt="Street View near the walker"
            className="h-full w-full object-cover"
          />
        )}

        {showEmbed && (
          <iframe
            title="Street View near the walker"
            src={embedSrc}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allow="accelerometer; gyroscope; fullscreen"
            onError={() => setIframeFailed(true)}
          />
        )}

        {!loading && !showStatic && iframeFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="max-w-sm text-sm text-[var(--color-cream)]/75">
              {data?.message ??
                "Street imagery blocked. Open Google Maps for this location."}
            </p>
            {data?.mapsLink && (
              <a
                href={data.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[var(--color-gold)]/40 px-3 py-1.5 text-xs text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10"
              >
                Open Street View in Google Maps
              </a>
            )}
          </div>
        )}

        {/* Tiny walking figure overlay so you always see "him" even on SV */}
        <div
          className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2"
          aria-hidden
        >
          <div className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--color-cream)]">
            HE IS HERE
          </div>
        </div>
      </div>
    </section>
  );
}
