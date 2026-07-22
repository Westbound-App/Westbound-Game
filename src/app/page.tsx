import type { Metadata } from "next";
import { WatchClient } from "@/components/watch/WatchClient";

export const metadata: Metadata = {
  title: "WESTBOUND — A man and his dog are walking across America",
  description:
    "Watch the live journey west. Help keep them on course, or send them on a scenic detour. When they reach the Pacific, it ends forever.",
};

/**
 * Home — the live journey. The previous dashboard-style page is preserved
 * at /classic while the new experience settles in.
 */
export default function HomePage() {
  return <WatchClient />;
}
