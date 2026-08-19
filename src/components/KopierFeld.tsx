"use client";

import { useEffect, useState } from "react";

/**
 * Viele lesen ihre Mails nicht zuverlaessig und schicken sich den Link lieber
 * selbst per WhatsApp. Deshalb steht er hier zum Kopieren und, wo der Browser
 * es kann, direkt zum Teilen.
 */
export function KopierFeld({
  wert,
  beschriftung,
  hinweis,
  teilenTitel,
  betont = false,
}: {
  wert: string;
  beschriftung: string;
  hinweis?: string;
  teilenTitel?: string;
  betont?: boolean;
}) {
  const [kopiert, setKopiert] = useState(false);
  const [kannTeilen, setKannTeilen] = useState(false);

  useEffect(() => {
    setKannTeilen(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!kopiert) return;
    const uhr = window.setTimeout(() => setKopiert(false), 2200);
    return () => window.clearTimeout(uhr);
  }, [kopiert]);

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(wert);
      setKopiert(true);
    } catch {
      // Ohne Clipboard-Rechte bleibt das Markieren von Hand – das Feld ist
      // dafuer auswaehlbar.
      const feld = document.getElementById(`kopie-${beschriftung}`) as HTMLInputElement | null;
      feld?.select();
    }
  }

  async function teilen() {
    try {
      await navigator.share({ title: teilenTitel ?? beschriftung, url: wert });
    } catch {
      /* Abgebrochen – nichts zu tun. */
    }
  }

  return (
    <div className={betont ? "glas p-4" : ""}>
      <p className="text-xs font-semibold uppercase tracking-widest text-white/45">
        {beschriftung}
      </p>

      <div className="mt-2 flex gap-2">
        <input
          id={`kopie-${beschriftung}`}
          readOnly
          value={wert}
          onFocus={(e) => e.currentTarget.select()}
          className="feld min-w-0 flex-1 font-mono text-xs sm:text-sm"
          aria-label={beschriftung}
        />
        <button
          type="button"
          onClick={kopieren}
          className={`shrink-0 rounded-xl px-4 text-sm font-semibold transition ${
            kopiert ? "bg-gruen text-white" : "glas-knopf text-white"
          }`}
        >
          {kopiert ? "Kopiert" : "Kopieren"}
        </button>
      </div>

      {kannTeilen && (
        <button
          type="button"
          onClick={teilen}
          className="glas-knopf mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
        >
          Teilen
        </button>
      )}

      {hinweis && <p className="mt-2 text-xs leading-relaxed text-white/45">{hinweis}</p>}
    </div>
  );
}
