"use client";

import { useCallback, useState } from "react";
import { PlanLegende, Saalplan, type PlanTisch } from "./Saalplan";
import { Tischkarte } from "./Tischkarte";

/**
 * Plan und Liste sind zwei Ansichten derselben Auswahl. Auf dem Handy bleibt
 * der Plan zur Orientierung oben stehen, angetippt wird meist trotzdem in der
 * Liste – dort steht mehr als in ein 57 px breites Rechteck passt.
 */
export function Tischwahl({
  tische,
  viewBox,
  huelle,
  buchungOffen,
  vorauswahl,
}: {
  tische: PlanTisch[];
  viewBox: string;
  huelle: string;
  buchungOffen: boolean;
  vorauswahl?: string | null;
}) {
  const [gewaehlt, setGewaehlt] = useState<string | null>(vorauswahl ?? null);

  const waehlen = useCallback((id: string) => {
    setGewaehlt(id);
    const karte = document.getElementById(`karte-${id}`);
    karte?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
  }, []);

  const buchbare = tische.filter((t) => t.status === "buchbar");
  const uebrige = tische.filter((t) => t.status !== "buchbar");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,8fr)] lg:gap-8">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="glas overflow-hidden p-3 sm:p-4">
          <div className="mx-auto max-h-[58vh] w-full max-w-md lg:max-h-[70vh]">
            <Saalplan
              tische={tische}
              viewBox={viewBox}
              huelle={huelle}
              ausgewaehlt={gewaehlt}
              onAuswahl={waehlen}
            />
          </div>
        </div>
        <div className="mt-3 px-1">
          <PlanLegende />
        </div>
      </div>

      <div>
        {buchbare.length === 0 ? (
          <div className="glas p-5 text-white/65">
            <p className="font-semibold text-white">Gerade ist kein Tisch offen.</p>
            <p className="mt-1 text-sm">
              Wir schalten nach und nach weitere Tische frei. Schau später nochmal rein.
            </p>
          </div>
        ) : (
          <>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/45">
              Freigeschaltete Tische
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {buchbare.map((t) => (
                <Tischkarte
                  key={t.id}
                  tisch={t}
                  gewaehlt={gewaehlt === t.id}
                  onWaehlen={() => waehlen(t.id)}
                  buchungOffen={buchungOffen}
                />
              ))}
            </div>
          </>
        )}

        {uebrige.length > 0 && (
          <details className="glas-tief mt-5 p-4">
            <summary className="cursor-pointer text-sm font-medium text-white/60 marker:text-white/30">
              Die übrigen {uebrige.length} Tische im Saal
            </summary>
            <ul className="mt-3 space-y-2 text-sm text-white/50">
              {uebrige.map((t) => (
                <li key={t.id} className="flex items-baseline justify-between gap-3">
                  <span>Tisch {t.nummer}</span>
                  <span className="text-right text-white/40">
                    {t.status === "intern"
                      ? (t.internerTitel ?? "fest vergeben")
                      : "noch nicht freigeschaltet"}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
