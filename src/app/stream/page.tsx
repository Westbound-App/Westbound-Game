import type { Metadata } from "next";
import { StreamClient } from "@/components/stream/StreamClient";

export const metadata: Metadata = {
  title: "WESTBOUND — Stream",
  description: "Capture surface for live streaming the WESTBOUND journey.",
  robots: { index: false },
};

/**
 * /stream — minimal presentation for capture software (OBS → TikTok /
 * YouTube). Horizontal by default; ?layout=vertical for 9:16.
 */
export default function StreamPage() {
  return <StreamClient />;
}
