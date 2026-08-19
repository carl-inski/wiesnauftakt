"use client";

import { useMemo, useState } from "react";
import { einlassUmschalten } from "@/app/admin/aktionen";

export type EinlassGast = {
  id: string;
  vorname: string;
  nachname: string;
  alterJahre: number;
  tischNummer: number;
  tischName: string | null;
  status: string;
  eingecheckt: boolean;
  pin: boolean;
};

/**
 * Für den Abend am Einlass: Name tippen, Person antippen, zwei Haken. Damit
 * sind Ausweiskontrolle, Zählung und Pin-Ausgabe eine Handlung statt drei
 * Zettel.
 */
export function EinlassListe({
  gaeste,
  mindestalter,
}: {
  gaeste: EinlassGast[];
  mindestalter: number;
}) {
  const [suche, setSuche] = useState("");
  const [nurOffene, setNurOffene] = useState(false);

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();
    return gaeste.filter((g) => {
      if (nurOffene && g.eingecheckt) return false;
      if (!begriff) return true;
      return (
        `${g.vorname} ${g.nachname}`.toLowerCase().includes(begriff) ||
        `${g.nachname} ${g.vorname}`.toLowerCase().includes(begriff) ||
        String(g.tischNummer) === begriff ||
        (g.tischName ?? "").toLowerCase().includes(begriff)
      );
    });
  }, [gaeste, suche, nurOffene]);

  const da = gaeste.filter((g) => g.eingecheckt).length;
  const pins = gaeste.filter((g) => g.pin).length;

  return (
    <>
      <div className="glas-leiste sticky top-[6.5rem] z-20 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="einlass-suche">
            Name suchen
          </label>
          <input
            id="einlass-suche"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Name tippen …"
            autoComplete="off"
            className="feld min-w-0 flex-1 text-base"
          />
          {suche && (
            <button
              type="button"
              onClick={() => setSuche("")}
              className="glas-knopf shrink-0 rounded-xl px-4 text-sm font-semibold"
            >
              ×
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setNurOffene((n) => !n)}
            className={`rounded-full px-3 py-1 text-xs ring-1 ring-inset transition ${
              nurOffene
                ? "bg-gelb/20 text-gelb ring-gelb/40"
                : "text-white/50 ring-white/12"
            }`}
          >
            {nurOffene ? "Nur noch nicht da" : "Alle anzeigen"}
          </button>
          <p className="text-xs tabular-nums text-white/50">
            <span className="font-semibold text-gruen-hell">{da}</span> da ·{" "}
            <span className="font-semibold text-gelb">{pins}</span> Pins · {gaeste.length}{" "}
            gesamt
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {gefiltert.length === 0 && (
          <li className="glas p-6 text-center text-sm text-white/45">
            Niemand gefunden. Steht die Person vielleicht unter einem anderen Namen auf der
            Liste?
          </li>
        )}

        {gefiltert.map((g) => (
          <li
            key={g.id}
            className={`glas p-3 transition ${g.eingecheckt ? "border-gruen/35 bg-gruen/8" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {g.vorname} {g.nachname}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/50">
                  Tisch {g.tischNummer}
                  {g.tischName && ` · ${g.tischName}`}
                  {g.status !== "bestaetigt" && (
                    <span className="text-gelb"> · nur angefragt</span>
                  )}
                  {g.alterJahre < mindestalter && (
                    <span className="font-semibold text-rot-hell">
                      {" "}· {g.alterJahre} Jahre – Ausweis!
                    </span>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 gap-1.5">
                <form action={einlassUmschalten}>
                  <input type="hidden" name="gastId" value={g.id} />
                  <input type="hidden" name="feld" value="checkin" />
                  <input type="hidden" name="an" value={g.eingecheckt ? "0" : "1"} />
                  <button
                    className={`min-w-[3.5rem] rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                      g.eingecheckt
                        ? "bg-gruen text-white"
                        : "glas-knopf text-white/70"
                    }`}
                  >
                    {g.eingecheckt ? "✓ da" : "Da"}
                  </button>
                </form>

                <form action={einlassUmschalten}>
                  <input type="hidden" name="gastId" value={g.id} />
                  <input type="hidden" name="feld" value="pin" />
                  <input type="hidden" name="an" value={g.pin ? "0" : "1"} />
                  <button
                    className={`min-w-[3.5rem] rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                      g.pin ? "bg-gelb text-nacht" : "glas-knopf text-white/70"
                    }`}
                  >
                    {g.pin ? "✓ Pin" : "Pin"}
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
