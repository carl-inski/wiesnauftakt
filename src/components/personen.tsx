"use client";

import { useCallback, useMemo, useState } from "react";

export type PersonFeld = {
  schluessel: string;
  id?: string;
  vorname: string;
  nachname: string;
  alter: string;
};

let zaehler = 0;
export function leerePerson(): PersonFeld {
  zaehler += 1;
  return { schluessel: `p${zaehler}`, vorname: "", nachname: "", alter: "" };
}

export function usePersonen(start?: PersonFeld[]) {
  const [personen, setPersonen] = useState<PersonFeld[]>(
    start && start.length > 0 ? start : [leerePerson()],
  );

  const aendern = useCallback((schluessel: string, feld: keyof PersonFeld, wert: string) => {
    setPersonen((alt) =>
      alt.map((p) => (p.schluessel === schluessel ? { ...p, [feld]: wert } : p)),
    );
  }, []);

  const hinzufuegen = useCallback(() => {
    setPersonen((alt) => [...alt, leerePerson()]);
  }, []);

  const entfernen = useCallback((schluessel: string) => {
    setPersonen((alt) => (alt.length <= 1 ? alt : alt.filter((p) => p.schluessel !== schluessel)));
  }, []);

  return { personen, aendern, hinzufuegen, entfernen };
}

/** Alle Personen, die ein plausibles Alter unter der Grenze eingetragen haben. */
export function zuJungeFinden(personen: PersonFeld[], mindestalter: number): PersonFeld[] {
  return personen.filter((p) => {
    const a = p.alter.trim();
    if (a === "") return false;
    const zahl = Number(a);
    return Number.isFinite(zahl) && zahl >= 0 && zahl < mindestalter;
  });
}

export function PersonZeile({
  person,
  index,
  mindestalter,
  entfernbar,
  onAendern,
  onEntfernen,
}: {
  person: PersonFeld;
  index: number;
  mindestalter: number;
  entfernbar: boolean;
  onAendern: (schluessel: string, feld: keyof PersonFeld, wert: string) => void;
  onEntfernen: (schluessel: string) => void;
}) {
  const alterZahl = Number(person.alter);
  const zuJung =
    person.alter.trim() !== "" &&
    Number.isFinite(alterZahl) &&
    alterZahl >= 0 &&
    alterZahl < mindestalter;

  const feldName = (feld: string) => `person.${index}.${feld}`;

  return (
    <li className="glas-tief p-3 auftauchen">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
          {index === 0 ? "Du" : `Person ${index + 1}`}
        </span>
        {entfernbar && (
          <button
            type="button"
            onClick={() => onEntfernen(person.schluessel)}
            className="rounded-full px-2 py-1 text-xs text-white/45 transition hover:bg-white/8 hover:text-rot-hell"
          >
            Entfernen
          </button>
        )}
      </div>

      {person.id && <input type="hidden" name={feldName("id")} value={person.id} />}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="sr-only" htmlFor={`${person.schluessel}-vorname`}>
            Vorname
          </label>
          <input
            id={`${person.schluessel}-vorname`}
            name={feldName("vorname")}
            className="feld"
            placeholder="Vorname"
            autoComplete={index === 0 ? "given-name" : "off"}
            required
            maxLength={60}
            value={person.vorname}
            onChange={(e) => onAendern(person.schluessel, "vorname", e.target.value)}
          />
        </div>
        <div>
          <label className="sr-only" htmlFor={`${person.schluessel}-nachname`}>
            Nachname
          </label>
          <input
            id={`${person.schluessel}-nachname`}
            name={feldName("nachname")}
            className="feld"
            placeholder="Nachname"
            autoComplete={index === 0 ? "family-name" : "off"}
            required
            maxLength={60}
            value={person.nachname}
            onChange={(e) => onAendern(person.schluessel, "nachname", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <label className="sr-only" htmlFor={`${person.schluessel}-alter`}>
          Alter in Jahren
        </label>
        <input
          id={`${person.schluessel}-alter`}
          name={feldName("alter")}
          className="feld w-24"
          placeholder="Alter"
          type="number"
          inputMode="numeric"
          min={0}
          max={120}
          required
          aria-invalid={zuJung}
          value={person.alter}
          onChange={(e) => onAendern(person.schluessel, "alter", e.target.value)}
        />
        <span className="text-xs text-white/40">Jahre</span>
      </div>

      {zuJung && (
        <p className="mt-2 rounded-lg border border-rot/35 bg-rot/10 px-3 py-2 text-xs leading-relaxed text-white/80">
          Eine Reservierung ist leider nicht möglich. Wende dich bitte privat an die
          Pfarrjugend – wir finden bestimmt eine Lösung.
        </p>
      )}
    </li>
  );
}

export function PersonenListe({
  personen,
  mindestalter,
  maxPersonen,
  aendern,
  hinzufuegen,
  entfernen,
}: {
  personen: PersonFeld[];
  mindestalter: number;
  maxPersonen: number;
  aendern: (schluessel: string, feld: keyof PersonFeld, wert: string) => void;
  hinzufuegen: () => void;
  entfernen: (schluessel: string) => void;
}) {
  const platzFrei = useMemo(() => personen.length < maxPersonen, [personen.length, maxPersonen]);

  return (
    <>
      <ul className="space-y-2.5">
        {personen.map((p, i) => (
          <PersonZeile
            key={p.schluessel}
            person={p}
            index={i}
            mindestalter={mindestalter}
            entfernbar={personen.length > 1}
            onAendern={aendern}
            onEntfernen={entfernen}
          />
        ))}
      </ul>

      {platzFrei ? (
        <button
          type="button"
          onClick={hinzufuegen}
          className="glas-knopf mt-3 w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Noch jemanden eintragen
        </button>
      ) : (
        <p className="mt-3 text-center text-sm text-white/45">
          Mehr als {maxPersonen} passen nicht an einen Tisch.
        </p>
      )}
    </>
  );
}
