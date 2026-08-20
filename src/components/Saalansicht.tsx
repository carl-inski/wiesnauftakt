"use client";

import Link from "next/link";
import { useState } from "react";
import { Saalplan, type PlanTisch } from "./Saalplan";
import { Sheet } from "./Sheet";

/**
 * Die Hauptansicht: nur der Saalplan. Ein Tipp auf einen freien Tisch oeffnet
 * ein Sheet mit allem, was zur Entscheidung noetig ist – mehr Text passt in
 * ein 57 px breites Rechteck ohnehin nicht.
 */
export function Saalansicht({
  tische,
  viewBox,
  huelle,
  buchungOffen,
}: {
  tische: PlanTisch[];
  viewBox: string;
  huelle: string;
  buchungOffen: boolean;
}) {
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const tisch = tische.find((t) => t.id === gewaehlt) ?? null;

  const leer = tisch ? tisch.belegt === 0 : false;
  const voll = tisch ? tisch.frei === 0 : false;

  return (
    <>
      <div className="glas overflow-hidden p-2.5 sm:p-4">
        <div className="mx-auto w-full max-w-md">
          <Saalplan
            tische={tische}
            viewBox={viewBox}
            huelle={huelle}
            ausgewaehlt={gewaehlt}
            onAuswahl={setGewaehlt}
          />
        </div>
      </div>


      <Sheet
        offen={tisch !== null}
        onSchliessen={() => setGewaehlt(null)}
        titel={tisch ? `Tisch ${tisch.nummer}` : ""}
      >
        {tisch && (
          <div className="pb-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                voll
                  ? "bg-rot/15 text-rot-hell ring-rot/30"
                  : tisch.fuellstand === "gut_belegt"
                    ? "bg-orange/15 text-orange-hell ring-orange/30"
                    : "bg-gruen/15 text-gruen-hell ring-gruen/30"
              }`}
            >
              Tisch {tisch.nummer} · {tisch.belegt}/{tisch.max}
            </span>

            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              {tisch.name ?? "Noch frei"}
            </h2>

            <p className="mt-1.5 text-sm leading-relaxed text-white/60">
              {leer
                ? "Hier sitzt noch keiner. Du machst den Anfang und gibst dem Tisch einen Namen."
                : voll
                  ? "Dieser Tisch ist voll — such dir bitte einen anderen aus."
                  : `${tisch.fuellstand === "gut_belegt" ? "Gut belegt" : "Füllt sich"} · noch ${
                      tisch.frei
                    } ${tisch.frei === 1 ? "Platz" : "Plätze"} frei`}
            </p>

            {tisch.vornamen.length > 0 && (
              <>
                <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-white/40">
                  Schon dabei
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {tisch.vornamen.map((name, i) => (
                    <li
                      key={`${name}-${i}`}
                      className="rounded-full bg-white/8 px-3 py-1 text-sm text-white/75 ring-1 ring-inset ring-white/10"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-6">
              {!buchungOffen ? (
                <p className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-center text-sm text-white/55">
                  Die Reservierung ist geschlossen.
                </p>
              ) : voll ? (
                <button type="button" onClick={() => setGewaehlt(null)} className="knopf-gross-leise">
                  Anderen Tisch suchen
                </button>
              ) : (
                <Link href={`/tisch/${tisch.id}`} className="knopf-gross">
                  {leer ? "Tisch eröffnen" : "Hier dazusetzen"}
                </Link>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
