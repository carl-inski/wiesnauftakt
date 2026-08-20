"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { anfrageEntscheiden, notizSpeichern } from "@/app/admin/aktionen";

type Person = {
  id: string;
  vorname: string;
  nachname: string;
  alterJahre: number;
};

function Knopf({
  kind,
  farbe,
}: {
  kind: React.ReactNode;
  farbe: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${farbe}`}
    >
      {pending ? "Moment …" : kind}
    </button>
  );
}

export function AnfrageKarte({
  id,
  tischNummer,
  tischName,
  email,
  telefon,
  erstelltAm,
  personen,
  notiz,
  mindestalter,
  status,
}: {
  id: string;
  tischNummer: number;
  tischName: string | null;
  email: string | null;
  telefon: string | null;
  erstelltAm: string;
  personen: Person[];
  notiz: string | null;
  mindestalter: number;
  status: string;
}) {
  const [ablehnen, setAblehnen] = useState(false);
  const minderjaehrige = personen.filter((p) => p.alterJahre < mindestalter);

  return (
    <article className="glas p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
            Tisch {tischNummer}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold">{tischName ?? "ohne Namen"}</h3>
          <p className="mt-1 text-xs text-white/45">
            {erstelltAm} · {personen.length === 1 ? "1 Person" : `${personen.length} Personen`}
          </p>
        </div>
        {status !== "angefragt" && (
          <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-white/60 ring-1 ring-inset ring-white/15">
            {status}
          </span>
        )}
      </header>

      <ul className="mt-3 divide-y divide-white/8 rounded-xl bg-white/[0.03]">
        {personen.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span>
              {p.vorname} {p.nachname}
            </span>
            <span
              className={`tabular-nums ${
                p.alterJahre < mindestalter ? "font-semibold text-rot-hell" : "text-white/45"
              }`}
            >
              {p.alterJahre} J.
            </span>
          </li>
        ))}
      </ul>

      {minderjaehrige.length > 0 && (
        <p className="mt-2 rounded-lg border border-rot/35 bg-rot/10 px-3 py-2 text-xs text-white/80">
          {minderjaehrige.length === 1 ? "Eine Person ist" : `${minderjaehrige.length} Personen sind`}{" "}
          unter {mindestalter} – das hätte die Seite eigentlich abgefangen. Bitte prüfen.
        </p>
      )}

      <p className="mt-3 text-sm text-white/55">
        {telefon ? (
          <a href={`tel:${telefon}`} className="underline underline-offset-4 hover:text-white">
            {telefon}
          </a>
        ) : (
          <span className="text-white/35">Keine Handynummer angegeben</span>
        )}
        {email && (
          <>
            {" · "}
            <a href={`mailto:${email}`} className="underline underline-offset-4 hover:text-white">
              {email}
            </a>
          </>
        )}
      </p>

      <form action={notizSpeichern} className="mt-3 flex gap-2">
        <input type="hidden" name="id" value={id} />
        <input
          name="notiz"
          defaultValue={notiz ?? ""}
          placeholder="Interne Notiz"
          className="feld flex-1 text-sm"
          maxLength={300}
        />
        <button className="glas-knopf shrink-0 rounded-xl px-4 text-sm font-semibold">
          Merken
        </button>
      </form>

      {status === "angefragt" && (
        <div className="mt-4 border-t border-white/8 pt-4">
          {!ablehnen ? (
            <div className="flex flex-wrap gap-2">
              <form action={anfrageEntscheiden}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="entscheidung" value="bestaetigt" />
                <Knopf kind="Bestätigen" farbe="bg-gruen text-white hover:bg-gruen/85" />
              </form>
              <button
                type="button"
                onClick={() => setAblehnen(true)}
                className="rounded-full border border-rot/40 px-5 py-2.5 text-sm font-semibold text-rot-hell transition hover:bg-rot/12"
              >
                Ablehnen
              </button>
            </div>
          ) : (
            <form action={anfrageEntscheiden} className="space-y-2">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="entscheidung" value="abgelehnt" />
              <label htmlFor={`grund-${id}`} className="block text-sm text-white/70">
                Was sollen wir zurückschreiben? Steht so in der Mail.
              </label>
              <textarea
                id={`grund-${id}`}
                name="grund"
                rows={3}
                maxLength={500}
                className="feld text-sm"
                placeholder="z. B. Die Festhalle ist leider voll – meld dich gern, falls jemand abspringt."
              />
              <div className="flex flex-wrap gap-2">
                <Knopf kind="Ablehnen und Mail schicken" farbe="bg-rot text-white hover:bg-rot/85" />
                <button
                  type="button"
                  onClick={() => setAblehnen(false)}
                  className="glas-knopf rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
