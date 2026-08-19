"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { gaesteAktualisieren, reservierungAbsagen } from "@/app/actions";
import { LEER } from "@/lib/formzustand";
import { Hinweis } from "./Hinweis";
import { PersonenListe, usePersonen, zuJungeFinden, type PersonFeld } from "./personen";

function Speicherknopf({ gesperrt }: { gesperrt: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={gesperrt || pending}
      className="w-full rounded-full bg-rot px-6 py-3.5 text-base font-semibold text-white transition hover:bg-rot/85 active:scale-[0.99] disabled:pointer-events-none disabled:bg-white/10 disabled:text-white/40"
    >
      {pending ? "Wird gespeichert …" : "Änderungen speichern"}
    </button>
  );
}

function Absageknopf() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full border border-rot/40 px-6 py-3 text-sm font-semibold text-rot-hell transition hover:bg-rot/12 disabled:opacity-50"
    >
      {pending ? "Wird abgesagt …" : "Ja, komplett absagen"}
    </button>
  );
}

export function Gaesteverwaltung({
  token,
  start,
  mindestalter,
  maxPersonen,
}: {
  token: string;
  start: PersonFeld[];
  mindestalter: number;
  maxPersonen: number;
}) {
  const [zustand, speichern] = useActionState(gaesteAktualisieren, LEER);
  const { personen, aendern, hinzufuegen, entfernen } = usePersonen(start);
  const [absageOffen, setAbsageOffen] = useState(false);

  const zuJunge = zuJungeFinden(personen, mindestalter);

  return (
    <>
      <form action={speichern} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <PersonenListe
          personen={personen}
          mindestalter={mindestalter}
          maxPersonen={maxPersonen}
          aendern={aendern}
          hinzufuegen={hinzufuegen}
          entfernen={entfernen}
        />

        {zuJunge.length > 0 && (
          <Hinweis ton="rot" titel="Das geht so leider nicht">
            Für {zuJunge.length === 1 ? "eine Person" : `${zuJunge.length} Personen`} liegt
            das Alter unter {mindestalter}. Wende dich bitte privat an die Pfarrjugend.
          </Hinweis>
        )}

        {zustand.meldung && (
          <Hinweis ton={zustand.ok ? "gruen" : "rot"} titel={zustand.ok ? "Passt" : "Da klemmt was"}>
            {zustand.meldung}
          </Hinweis>
        )}

        <Speicherknopf gesperrt={zuJunge.length > 0} />
      </form>

      <div className="mt-8 border-t border-white/8 pt-6">
        {!absageOffen ? (
          <button
            type="button"
            onClick={() => setAbsageOffen(true)}
            className="text-sm text-white/45 underline underline-offset-4 transition hover:text-rot-hell"
          >
            Wir können doch nicht – Reservierung absagen
          </button>
        ) : (
          <div className="space-y-3">
            <Hinweis ton="rot" titel="Wirklich absagen?">
              Damit werden alle Plätze wieder frei. Rückgängig machen können wir das
              nicht – du müsstest dann neu reservieren.
            </Hinweis>
            <form action={reservierungAbsagen}>
              <input type="hidden" name="token" value={token} />
              <Absageknopf />
            </form>
            <button
              type="button"
              onClick={() => setAbsageOffen(false)}
              className="w-full rounded-full px-6 py-2.5 text-sm text-white/50 transition hover:text-white"
            >
              Doch nicht
            </button>
          </div>
        )}
      </div>
    </>
  );
}
