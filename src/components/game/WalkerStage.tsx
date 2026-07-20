"use client";

type Props = {
  status: string;
  walkerName: string;
  milesWalked: number;
  heading: number;
  locationLabel: string;
};

/**
 * Always-visible character stage so the product shows a man walking,
 * not only a map pin. Complements map + street camera.
 */
export function WalkerStage({
  status,
  walkerName,
  milesWalked,
  heading,
  locationLabel,
}: Props) {
  const walking =
    status === "walking" || status === "approaching_decision";
  const resting = status === "resting";
  const completed = status === "completed";
  const decision = status === "decision_window_open";

  const caption = completed
    ? "He made it. Sandbox restarts so you can watch again."
    : decision
      ? "He stopped at a fork. The crowd decides next."
      : resting
        ? "He is resting. Movement resumes on schedule."
        : walking
          ? "He is walking west on real roads."
          : `Status: ${status.replaceAll("_", " ")}`;

  // Flip figure when heading is easterly so silhouette faces travel dir roughly
  const faceLeft = heading > 90 && heading < 270;

  return (
    <section
      aria-label="Walker stage"
      className="relative overflow-hidden rounded-xl border border-[var(--color-asphalt)]/50"
      style={{
        background:
          "linear-gradient(180deg, #87a4c4 0%, #c4b896 42%, #6b7a5a 43%, #4a5540 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%)",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[#3a3f47]">
        <div
          className={`absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 ${
            walking ? "wb-road-scroll" : ""
          }`}
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #d4a24c 0 28px, transparent 28px 56px)",
            backgroundSize: "56px 4px",
            opacity: 0.85,
          }}
        />
      </div>

      <div
        className="absolute bottom-[36%] left-0 right-0 h-16 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at 30% 100%, #2f4a3a 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, #3d5c4a 0%, transparent 55%)",
        }}
      />

      <div className="relative flex min-h-[200px] flex-col items-center justify-end px-4 pb-8 pt-6 sm:min-h-[240px]">
        <div
          className={walking ? "wb-stage-bob" : undefined}
          style={{ transform: faceLeft ? "scaleX(-1)" : undefined }}
        >
          <svg
            width="120"
            height="160"
            viewBox="0 0 80 110"
            className="drop-shadow-lg"
            aria-hidden
          >
            <ellipse cx="40" cy="104" rx="18" ry="5" fill="rgba(0,0,0,0.35)" />
            <rect x="28" y="38" width="24" height="22" rx="3" fill="#2a3038" />
            <rect x="30" y="34" width="20" height="28" rx="4" fill="#b54a32" />
            <circle cx="40" cy="22" r="11" fill="#e8c4a0" />
            <path d="M28 20 Q40 8 52 20" fill="#2a2118" />
            <rect x="18" y="38" width="9" height="24" rx="3" fill="#c4a574" />
            <rect x="53" y="38" width="9" height="24" rx="3" fill="#c4a574" />
            <rect
              className={walking ? "wb-leg-stage-l" : undefined}
              x="32"
              y="62"
              width="8"
              height="28"
              rx="3"
              fill="#1e293b"
            />
            <rect
              className={walking ? "wb-leg-stage-r" : undefined}
              x="40"
              y="62"
              width="8"
              height="28"
              rx="3"
              fill="#1e293b"
            />
            <rect x="30" y="88" width="12" height="5" rx="2" fill="#1a1510" />
            <rect x="40" y="88" width="12" height="5" rx="2" fill="#1a1510" />
          </svg>
        </div>

        <div className="mt-2 rounded-full bg-black/45 px-4 py-1.5 text-center backdrop-blur-sm">
          <p className="text-sm font-semibold tracking-wide text-[var(--color-cream)]">
            {walkerName}
          </p>
          <p className="text-xs text-[var(--color-tan)]">{caption}</p>
          <p className="mt-0.5 font-mono text-[10px] text-[var(--color-cream)]/50">
            {milesWalked.toFixed(2)} mi · {locationLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
