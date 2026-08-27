"use client";

import { useState } from "react";
import { tischSpeichern, tischUmschalten } from "@/app/admin/aktionen";

type Eigenschaften = {
  id: string;
  nummer: number;
  status: "buchbar" | "gesperrt" | "intern";
  name: string | null;
  internerTitel: string | null;
  belegt: number;
  max: number;
  maxEigen: number | null;
  vornamen: string[];
};

const STATUSNAME = {
  buchbar: "online buchbar",
  gesperrt: "freie Platzwahl",
  intern: "fest vergeben",
};

const STATUSSTIL = {
  buchbar: "bg-gruen/15 text-gruen-hell ring-gruen/30",
  gesperrt: "bg-white/8 text-white/55 ring-white/15",
  intern: "bg-gelb/15 text-gelb ring-gelb/30",
};

export function TischZeile(t: Eigenschaften) {
  const [offen, setOffen] = useState(false);

  return (
    <article className="glas p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tabular-nums">Tisch {t.nummer}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUSSTIL[t.status]}`}
            >
              {STATUSNAME[t.status]}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-white/60">
            {t.status === "intern"
              ? (t.internerTitel ?? "ohne Bezeichnung")
              : (t.name ?? "kein Tischname vergeben")}
          </p>
          {t.belegt > 0 && (
            <p className="mt-1 text-xs text-white/40">
              {t.belegt}/{t.max} · {t.vornamen.join(", ")}
            </p>
          )}
        </div>

        {/* Der eine Klick, um den es geht */}
        <div className="flex shrink-0 gap-2">
          {t.status !== "buchbar" ? (
            <form action={tischUmschalten}>
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="neu" value="buchbar" />
              <button className="rounded-full bg-gruen px-4 py-2 text-sm font-semibold text-white transition hover:bg-gruen/85">
                Freischalten
              </button>
            </form>
          ) : (
            <form action={tischUmschalten}>
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="neu" value="gesperrt" />
              <button
                disabled={t.belegt > 0}
                title={t.belegt > 0 ? "Erst leerräumen – hier sitzen schon Leute." : undefined}
                className="glas-knopf rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Auf freie Platzwahl
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => setOffen((o) => !o)}
            aria-expanded={offen}
            className="glas-knopf rounded-full px-4 py-2 text-sm font-semibold text-white"
          >
            {offen ? "Zu" : "Mehr"}
          </button>
        </div>
      </div>

      {offen && (
        <form action={tischSpeichern} className="mt-4 space-y-3 border-t border-white/8 pt-4">
          <input type="hidden" name="id" value={t.id} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/50" htmlFor={`status-${t.id}`}>
                Status
              </label>
              <select
                id={`status-${t.id}`}
                name="status"
                defaultValue={t.status}
                className="feld"
              >
                <option value="buchbar">online buchbar</option>
                <option value="gesperrt">freie Platzwahl (im Plan, nicht reservierbar)</option>
                <option value="intern">fest vergeben</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50" htmlFor={`max-${t.id}`}>
                Max. Personen (leer = globaler Wert)
              </label>
              <input
                id={`max-${t.id}`}
                name="maxPersonen"
                type="number"
                min={1}
                max={40}
                defaultValue={t.maxEigen ?? ""}
                placeholder={String(t.max)}
                className="feld"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50" htmlFor={`intern-${t.id}`}>
                Interne Bezeichnung (Eltern, Band, Alumni …)
              </label>
              <input
                id={`intern-${t.id}`}
                name="internerTitel"
                defaultValue={t.internerTitel ?? ""}
                maxLength={60}
                className="feld"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50" htmlFor={`name-${t.id}`}>
                Öffentlicher Tischname
              </label>
              <input
                id={`name-${t.id}`}
                name="oeffentlicherName"
                defaultValue={t.name ?? ""}
                maxLength={40}
                className="feld"
              />
            </div>
          </div>

          <button className="w-full rounded-full bg-rot px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rot/85 sm:w-auto">
            Tisch speichern
          </button>
        </form>
      )}
    </article>
  );
}
