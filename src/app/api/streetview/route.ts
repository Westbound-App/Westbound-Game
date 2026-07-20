import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  heading: z.coerce.number().min(0).max(360).optional().default(270),
  pitch: z.coerce.number().min(-90).max(90).optional().default(0),
  fov: z.coerce.number().min(10).max(120).optional().default(90),
});

/**
 * Proxies Street View metadata / image URL construction.
 * Never exposes the Google key to the browser (server-only).
 *
 * Without GOOGLE_MAPS_API_KEY: returns a fallback payload with Google Maps links.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
    heading: url.searchParams.get("heading") ?? undefined,
    pitch: url.searchParams.get("pitch") ?? undefined,
    fov: url.searchParams.get("fov") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const { lat, lng, heading, pitch, fov } = parsed.data;
  const key = process.env.GOOGLE_MAPS_API_KEY;

  const mapsLink = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&heading=${heading}&pitch=${pitch}`;

  if (!key) {
    return NextResponse.json({
      available: false,
      mode: "fallback",
      latitude: lat,
      longitude: lng,
      heading,
      mapsLink,
      message:
        "Add GOOGLE_MAPS_API_KEY to .env.local to enable live Street View imagery.",
      // Open embed does not need key for generic maps, but Street View embed does.
      imageUrl: null,
    });
  }

  // Metadata check — avoid broken images when no coverage
  const metaUrl = new URL(
    "https://maps.googleapis.com/maps/api/streetview/metadata",
  );
  metaUrl.searchParams.set("location", `${lat},${lng}`);
  metaUrl.searchParams.set("key", key);
  metaUrl.searchParams.set("source", "outdoor");

  try {
    const metaRes = await fetch(metaUrl.toString(), {
      next: { revalidate: 300 },
    });
    const meta = (await metaRes.json()) as {
      status: string;
      pano_id?: string;
      location?: { lat: number; lng: number };
    };

    if (meta.status !== "OK") {
      return NextResponse.json({
        available: false,
        mode: "no_coverage",
        latitude: lat,
        longitude: lng,
        heading,
        mapsLink,
        message: "No Street View coverage near this point.",
        imageUrl: null,
      });
    }

    const image = new URL(
      "https://maps.googleapis.com/maps/api/streetview",
    );
    image.searchParams.set("size", "640x400");
    image.searchParams.set("location", `${lat},${lng}`);
    image.searchParams.set("heading", String(heading));
    image.searchParams.set("pitch", String(pitch));
    image.searchParams.set("fov", String(fov));
    image.searchParams.set("source", "outdoor");
    image.searchParams.set("key", key);
    if (meta.pano_id) {
      image.searchParams.set("pano", meta.pano_id);
    }

    return NextResponse.json({
      available: true,
      mode: "streetview",
      latitude: meta.location?.lat ?? lat,
      longitude: meta.location?.lng ?? lng,
      heading,
      mapsLink,
      imageUrl: image.toString(),
      message: null,
    });
  } catch {
    return NextResponse.json({
      available: false,
      mode: "error",
      latitude: lat,
      longitude: lng,
      heading,
      mapsLink,
      message: "Street View lookup failed.",
      imageUrl: null,
    });
  }
}
