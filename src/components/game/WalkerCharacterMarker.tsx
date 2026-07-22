"use client";

/**
 * HTML marker content: a small walking figure for the map.
 * Status drives idle vs walk animation.
 */
export function createWalkerMarkerElement(
  status: string,
  heading: number,
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "westbound-walker-marker";
  el.style.cssText = `
    width: 48px;
    height: 56px;
    margin-left: -24px;
    margin-top: -50px;
    pointer-events: auto;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.55));
  `;
  el.innerHTML = walkerSvgHtml(status, heading);
  return el;
}

export function updateWalkerMarkerElement(
  el: HTMLElement,
  status: string,
  heading: number,
): void {
  el.innerHTML = walkerSvgHtml(status, heading);
}

function walkerSvgHtml(status: string, heading: number): string {
  const walking =
    status === "walking" || status === "approaching_decision";
  const resting = status === "resting" || status === "completed";
  // SVG faces "up" (north); rotate by heading so he faces travel direction
  return `
    <style>
      @keyframes wb-walk-bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      @keyframes wb-leg {
        0%, 100% { transform: rotate(-22deg); }
        50% { transform: rotate(22deg); }
      }
      @keyframes wb-leg2 {
        0%, 100% { transform: rotate(22deg); }
        50% { transform: rotate(-22deg); }
      }
      .wb-bob { animation: wb-walk-bob 0.45s ease-in-out infinite; }
      .wb-leg-l { transform-origin: 20px 34px; animation: wb-leg 0.45s ease-in-out infinite; }
      .wb-leg-r { transform-origin: 28px 34px; animation: wb-leg2 0.45s ease-in-out infinite; }
      .wb-paused .wb-bob, .wb-paused .wb-leg-l, .wb-paused .wb-leg-r { animation: none; }
    </style>
    <div class="${walking ? "" : "wb-paused"}" style="transform: rotate(${heading}deg); transform-origin: 24px 40px;">
      <svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="24" cy="52" rx="10" ry="3" fill="rgba(0,0,0,0.35)"/>
        <g class="wb-bob">
          <!-- pack -->
          <rect x="17" y="20" width="14" height="12" rx="2" fill="#3a3f47"/>
          <!-- body -->
          <rect x="18" y="18" width="12" height="16" rx="3" fill="#b54a32"/>
          <!-- head -->
          <circle cx="24" cy="12" r="6" fill="#e8c4a0"/>
          <!-- hat / hair -->
          <path d="M18 11 Q24 5 30 11" fill="#2a2118"/>
          <!-- arms -->
          <rect x="12" y="20" width="5" height="12" rx="2" fill="#c4a574"/>
          <rect x="31" y="20" width="5" height="12" rx="2" fill="#c4a574"/>
          <!-- legs -->
          <rect class="wb-leg-l" x="18" y="34" width="5" height="14" rx="2" fill="#1e293b"/>
          <rect class="wb-leg-r" x="25" y="34" width="5" height="14" rx="2" fill="#1e293b"/>
        </g>
        ${
          resting
            ? `<text x="24" y="8" text-anchor="middle" font-size="8" fill="#d4a24c">z</text>`
            : ""
        }
      </svg>
    </div>
    <div style="
      position:absolute; left:50%; top:52px; transform:translateX(-50%);
      background:rgba(11,18,32,0.85); color:#f4efe6; font:600 9px system-ui;
      padding:2px 6px; border-radius:999px; white-space:nowrap; letter-spacing:0.04em;
    ">THE WALKER</div>
  `;
}
