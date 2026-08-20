"use client";

import { useEffect, useRef } from "react";

/**
 * Bottom Sheet nach dem Vorbild aus den Referenzscreenshots: Griff oben,
 * Schliesskreuz rechts, grosse Aktion unten. Auf dem Handy kommt der Inhalt
 * damit dorthin, wo der Daumen ist.
 */
export function Sheet({
  offen,
  onSchliessen,
  titel,
  children,
}: {
  offen: boolean;
  onSchliessen: () => void;
  titel: string;
  children: React.ReactNode;
}) {
  const feld = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!offen) return;

    function beiTaste(e: KeyboardEvent) {
      if (e.key === "Escape") onSchliessen();
    }
    document.addEventListener("keydown", beiTaste);

    // Hintergrund festhalten, solange das Sheet oben liegt.
    const vorher = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    feld.current?.focus();

    return () => {
      document.removeEventListener("keydown", beiTaste);
      document.body.style.overflow = vorher;
    };
  }, [offen, onSchliessen]);

  if (!offen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Schließen"
        onClick={onSchliessen}
        className="absolute inset-0 h-full w-full cursor-default bg-nacht-tief/70 backdrop-blur-sm sheet-grund"
      />

      <div
        ref={feld}
        role="dialog"
        aria-modal="true"
        aria-label={titel}
        tabIndex={-1}
        className="sheet absolute inset-x-0 bottom-0 mx-auto max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 outline-none"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-white/25" aria-hidden />

        <button
          type="button"
          onClick={onSchliessen}
          aria-label="Schließen"
          className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/16 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" strokeWidth={2.2}>
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" />
          </svg>
        </button>

        {children}
      </div>
    </div>
  );
}
