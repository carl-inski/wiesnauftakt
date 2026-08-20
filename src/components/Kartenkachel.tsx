"use client";

import { useState } from "react";

/**
 * Karte auf Knopfdruck.
 *
 * Ein Google-Maps-Einbettung laedt beim Seitenaufruf Skripte und setzt Cookies
 * von Google. Da die Seite ohne Tracking auskommen soll, wird die Karte erst
 * nach einem Klick geladen – bis dahin steht hier nur die Adresse. Das ist auf
 * deutschen Seiten die uebliche Loesung und kostet genau einen Fingertipp.
 */
export function Kartenkachel({
  ortName,
  adresse,
  mapsLink,
}: {
  ortName: string;
  adresse: string;
  mapsLink: string;
}) {
  const [geladen, setGeladen] = useState(false);

  // Die Karte selbst laeuft ueber die Adresse, weil ein Kurzlink im Rahmen
  // nicht funktioniert. Der Knopf unten nimmt den gepflegten Link, falls einer
  // hinterlegt ist.
  const suche = encodeURIComponent(adresse || ortName);
  const einbettung = `https://www.google.com/maps?q=${suche}&output=embed`;
  const extern = mapsLink.trim() || `https://www.google.com/maps/search/?api=1&query=${suche}`;

  return (
    <div className="glas overflow-hidden">
      <div className="p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
          So findest du uns
        </p>
        <p className="mt-1.5 text-base font-semibold">{ortName}</p>
        <p className="text-sm text-white/60">{adresse}</p>
      </div>

      <div className="relative aspect-[4/3] w-full border-t border-white/8 bg-nacht-hoch">
        {geladen ? (
          <iframe
            title={`Karte: ${ortName}`}
            src={einbettung}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setGeladen(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center transition hover:bg-white/[0.04]"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-9 w-9 text-white/45">
              <path
                d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"
                stroke="currentColor"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="10" r="2.5" stroke="currentColor" />
            </svg>
            <span className="text-sm font-semibold">Karte laden</span>
            <span className="max-w-xs text-xs leading-relaxed text-white/45">
              Erst beim Antippen wird die Karte von Google geladen — vorher geht
              nichts an Google raus.
            </span>
          </button>
        )}
      </div>

      <div className="border-t border-white/8 p-3">
        <a
          href={extern}
          target="_blank"
          rel="noreferrer noopener"
          className="knopf-gross-leise"
        >
          In Google Maps öffnen
        </a>
      </div>
    </div>
  );
}
