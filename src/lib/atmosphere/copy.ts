/**
 * Wholesome public copy — playful influence, never malice.
 */

export type SoftOptionCopy = {
  title: string;
  description: string;
};

/** Map engine option types to gentle public labels. */
export function softControlOptionCopy(optionType: string): SoftOptionCopy {
  switch (optionType) {
    case "support_route":
      return {
        title: "Keep him west",
        description: "Support the friendly westbound path.",
      };
    case "northern_detour":
      return {
        title: "Guide him north",
        description: "A scenic nudge on a longer northern road.",
      };
    case "southern_detour":
      return {
        title: "Nudge him south",
        description: "Send him on a gentler southern detour.",
      };
    case "route_shield":
      return {
        title: "Shield his route",
        description: "Help protect the recommended westbound way.",
      };
    default:
      return {
        title: "Influence the path",
        description: "Guide the journey with care.",
      };
  }
}

export const FACTION_SOFT = {
  finisher: {
    name: "Finishers",
    blurb: "Help him stay on the kind westbound path.",
  },
  drifter: {
    name: "Pathfinders",
    /** Public-facing alias; internal id may remain drifter */
    blurb: "Suggest scenic detours and playful detours along the way.",
  },
  neutral: {
    name: "Watchers",
    blurb: "Just enjoy the walk.",
  },
} as const;

export const PREMISE_SOFT =
  "A kind man and his dog are walking west across America. You can help keep him on course—or gently guide him on a scenic detour. If he reaches the Pacific, the journey ends forever.";

export const IDLE_WATCH_LINE =
  "He and his dog keep walking west—calm, steady, and glad to be on the road. When a fork appears, you can support his path or suggest a scenic detour.";
