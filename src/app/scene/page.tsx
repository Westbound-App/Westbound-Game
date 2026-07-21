import type { Metadata } from "next";
import { SceneClient } from "@/components/scene/SceneClient";

export const metadata: Metadata = {
  title: "WESTBOUND — Living scene prototype",
  description:
    "Stylized real-time renderer prototype for the WESTBOUND live journey.",
};

/**
 * /scene — living-renderer prototype route.
 * Kept separate from the current public page while the art direction is
 * reviewed; promoted to /live once approved.
 */
export default function ScenePage() {
  return <SceneClient />;
}
