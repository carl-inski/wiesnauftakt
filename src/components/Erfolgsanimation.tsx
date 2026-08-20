"use client";

/**
 * Kurzer visueller Beleg, dass die Anfrage durch ist. Der Haken zeichnet sich
 * einmal, danach steht er still – bewusst ohne Dauerschleife, und unter
 * prefers-reduced-motion steht er sofort da.
 */
export function Erfolgsanimation() {
  return (
    <div className="flex justify-center" aria-hidden>
      <svg viewBox="0 0 120 120" className="h-24 w-24">
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="var(--color-gruen)"
          strokeOpacity="0.22"
          strokeWidth="6"
        />
        <circle
          className="erfolg-ring"
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="var(--color-gruen)"
          strokeWidth="6"
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <path
          className="erfolg-haken"
          d="M38 61.5 L53 76 L83 46"
          fill="none"
          stroke="var(--color-gruen-hell)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
