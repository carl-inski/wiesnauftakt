"use client";

import { useState } from "react";
import { onboardingAbschliessen } from "@/app/actions";
import { Logo } from "./Logo";
import { Trachtenpin } from "./Trachtenpin";

/**
 * Zwei Schritte beim ersten Besuch: erst worum es geht, dann warum man
 * reserviert. Die Navigation bleibt so lange weg – wer zum ersten Mal aus
 * einem Gruppenchat hier landet, soll genau eine Sache vor sich haben.
 */

type Kachel = {
  titel: string;
  text: string;
  farbe: string;
  rand: string;
  symbol: React.ReactNode;
};

const KACHELN: Kachel[] = [
  {
    titel: "Fester Sitzplatz",
    text: "Kein Herumstehen, kein Platzsuchen. Dein Platz am Biertisch steht fest.",
    farbe: "text-gruen-hell",
    rand: "border-gruen/30 bg-gruen/10",
    symbol: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} className="h-6 w-6">
        <path d="M4 10h16v3.5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" stroke="currentColor" />
        <path d="M7 16.5V20M17 16.5V20M6 10V7.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2V10" stroke="currentColor" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    titel: "Trachtenpin für jeden",
    text: "Jede angemeldete Person bekommt am Einlass ihren SJB-Trachtenpin. Einer pro Person, nicht pro Tisch.",
    farbe: "text-gelb",
    rand: "border-gelb/30 bg-gelb/10",
    symbol: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} className="h-6 w-6">
        <path d="m12 3.5 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.2l5.4-.8z" stroke="currentColor" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    titel: "Aber: pünktlich sein",
    text: "",
    farbe: "text-rot-hell",
    rand: "border-rot/35 bg-rot/10",
    symbol: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} className="h-6 w-6">
        <circle cx="12" cy="12.5" r="8" stroke="currentColor" />
        <path d="M12 8.5v4.2l2.6 1.6M9 3.2h6" stroke="currentColor" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function Onboarding({
  verfallZeit,
  datumText,
  einlassZeit,
  onFertig,
}: {
  verfallZeit: string;
  datumText: string;
  einlassZeit: string;
  onFertig: () => void;
}) {
  const [schritt, setSchritt] = useState<1 | 2>(1);

  function abschliessen() {
    // Das Cookie darf ruhig im Hintergrund gesetzt werden – die Ansicht
    // wechselt sofort, damit sich nichts hakelig anfuehlt.
    void onboardingAbschliessen();
    onFertig();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-nacht">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(38rem 30rem at 50% 8%, rgba(228,50,43,0.20), transparent 62%)," +
            "radial-gradient(32rem 26rem at 85% 30%, rgba(255,198,30,0.14), transparent 60%)," +
            "radial-gradient(34rem 28rem at 12% 78%, rgba(27,161,73,0.13), transparent 62%)",
        }}
      />

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
        {schritt === 1 ? (
          <div key="s1" className="auftauchen flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <Logo
                variante="bildmarke"
                className="h-56 w-56 sm:h-72 sm:w-72"
                alt=""
              />
              <h1 className="marke mt-7 text-6xl sm:text-7xl">Wiesnauftakt</h1>
              <p className="mt-2.5 text-sm font-semibold uppercase tracking-[0.3em] text-gelb">
                Pfarrjugend SJB
              </p>
              <p className="mt-6 text-base leading-relaxed text-white/60">
                {datumText}
                <br />
                Einlass ab {einlassZeit} Uhr
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSchritt(2)}
              className="knopf-gross"
            >
              Jetzt reservieren
            </button>
          </div>
        ) : (
          <div key="s2" className="auftauchen flex flex-1 flex-col">
            <div className="flex-1 pt-4">
              <h2 className="marke text-5xl sm:text-6xl">
                Warum überhaupt
                <br />
                reservieren?
              </h2>

              <ul className="mt-8 space-y-3">
                {KACHELN.map((k) => (
                  <li
                    key={k.titel}
                    className={`relative overflow-hidden rounded-2xl border p-4 ${k.rand}`}
                  >
                    {k.titel === "Trachtenpin für jeden" && <Trachtenpin />}
                    <div className="relative flex gap-3.5">
                      {k.titel !== "Trachtenpin für jeden" && (
                        <span className={`mt-0.5 shrink-0 ${k.farbe}`}>{k.symbol}</span>
                      )}
                      <div className={k.titel === "Trachtenpin für jeden" ? "pr-24 sm:pr-28" : ""}>
                        <p className={`text-base font-semibold ${k.farbe}`}>{k.titel}</p>
                        <p className="mt-1 text-sm leading-relaxed text-white/70">
                          {k.titel === "Aber: pünktlich sein" ? (
                            <>
                              Wir halten euren Tisch bis <strong>{verfallZeit} Uhr</strong>{" "}
                              frei. Danach verfällt die Reservierung und ein fester Platz
                              ist nicht mehr garantiert.
                            </>
                          ) : (
                            k.text
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 space-y-2">
              <button type="button" onClick={abschliessen} className="knopf-gross">
                Passt, zur Festhalle
              </button>
              <button
                type="button"
                onClick={() => setSchritt(1)}
                className="w-full rounded-full py-3 text-sm text-white/45 transition hover:text-white"
              >
                Zurück
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-1.5" aria-hidden>
          {[1, 2].map((n) => (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                schritt === n ? "w-6 bg-white/70" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
