import type { Metadata } from "next";
import { WatchClient } from "@/components/watch/WatchClient";

export const metadata: Metadata = {
  title: "WESTBOUND — Watch the journey",
  description:
    "A kind man and his dog Beacon are walking west across America. Watch the live journey.",
};

/**
 * /watch — photoreal slow-TV presentation (AI media pipeline).
 * Candidate to replace the public home experience once character-locked
 * scenes land.
 */
export default function WatchPage() {
  return <WatchClient />;
}
