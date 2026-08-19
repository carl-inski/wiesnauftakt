"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { reservierungAbsenden } from "@/app/actions";
import { LEER } from "@/lib/formzustand";
import { Hinweis } from "./Hinweis";
import { PersonenListe, usePersonen, zuJungeFinden } from "./personen";

function Absendeknopf({ gesperrt }: { gesperrt: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={gesperrt || pending}
      className="w-full rounded-full bg-rot px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-rot/25 transition hover:bg-rot/85 active:scale-[0.99] disabled:pointer-events-none disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
    >
      {pending ? "Wird abgeschickt …" : "Anfrage abschicken"}
    </button>
  );
}

export function Buchungsformular({
  tischId,
  freiePlaetze,
  mindestalter,
  eroeffnen,
  verfallZeit,
}: {
  tischId: string;
  freiePlaetze: number;
  mindestalter: number;
  eroeffnen: boolean;
  verfallZeit: string;
}) {
  const [zustand, absenden] = useActionState(reservierungAbsenden, LEER);
  const { personen, aendern, hinzufuegen, entfernen } = usePersonen();

  const zuJunge = zuJungeFinden(personen, mindestalter);
  const gesperrt = zuJunge.length > 0;

  return (
    <form action={absenden} className="space-y-6">
      <input type="hidden" name="tischId" value={tischId} />

      {eroeffnen && (
        <div>
          <label
            htmlFor="tischName"
            className="mb-1.5 block text-sm font-semibold text-white/80"
          >
            Wie soll euer Tisch heißen?
          </label>
          <input
            id="tischName"
            name="tischName"
            className="feld"
            placeholder="z. B. Zeltlager-Crew"
            maxLength={40}
            required
          />
          <p className="mt-1.5 text-xs text-white/45">
            Den Namen sehen alle auf dem Plan. So finden euch die anderen wieder.
          </p>
        </div>
      )}

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-white/80">
          Wer kommt mit?
        </legend>
        <p className="mb-3 text-xs text-white/45">
          Trag dich selbst zuerst ein. Weitere Leute kannst du auch später noch
          nachtragen – dafür kriegst du einen Link.
        </p>

        <PersonenListe
          personen={personen}
          mindestalter={mindestalter}
          maxPersonen={freiePlaetze}
          aendern={aendern}
          hinzufuegen={hinzufuegen}
          entfernen={entfernen}
        />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1.5 text-sm font-semibold text-white/80">
          Wie erreichen wir dich?
        </legend>

        <div>
          <label htmlFor="email" className="sr-only">
            E-Mail-Adresse
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="feld"
            placeholder="E-Mail-Adresse"
            required
            maxLength={160}
          />
          <p className="mt-1.5 text-xs text-white/45">
            Hierhin geht dein Verwaltungslink und später die Bestätigung.
          </p>
        </div>

        <div>
          <label htmlFor="telefon" className="sr-only">
            Handynummer, freiwillig
          </label>
          <input
            id="telefon"
            name="telefon"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="feld"
            placeholder="Handynummer (freiwillig)"
            maxLength={40}
          />
          <p className="mt-1.5 text-xs text-white/45">
            Nur falls am Abend was ist. Wir schreiben dir nicht einfach so.
          </p>
        </div>
      </fieldset>

      <Hinweis ton="gelb" titel="Bevor du abschickst">
        Das hier ist eine <strong>Anfrage</strong>, noch keine Zusage. Wir bestätigen sie
        von Hand und melden uns per Mail. Eure Plätze sind ab jetzt trotzdem vorgemerkt,
        damit euch keiner dazwischenfunkt. Am Abend halten wir den Tisch bis{" "}
        {verfallZeit} Uhr frei.
      </Hinweis>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-white/75">
        <input
          type="checkbox"
          name="verstanden"
          value="ja"
          required
          className="mt-0.5 h-5 w-5 shrink-0 accent-rot"
        />
        <span>
          Passt, verstanden: Ich melde uns verbindlich an und warte auf eure Bestätigung.
        </span>
      </label>

      {gesperrt && (
        <Hinweis ton="rot" titel="Das geht so leider nicht">
          Für {zuJunge.length === 1 ? "eine der Personen" : "einige der Personen"} liegt
          das Alter unter {mindestalter}. Eine Reservierung ist dann über die Seite nicht
          möglich – wende dich bitte privat an die Pfarrjugend, wir klären das persönlich.
        </Hinweis>
      )}

      {zustand.meldung && !zustand.ok && (
        <Hinweis ton="rot" titel="Da klemmt was">
          {zustand.meldung}
        </Hinweis>
      )}

      <Absendeknopf gesperrt={gesperrt} />

      <p className="text-center text-xs leading-relaxed text-white/35">
        Nachname, Alter und deine Kontaktdaten sehen nur wir. Auf dem Saalplan stehen
        ausschließlich Tischname und Vornamen.
      </p>
    </form>
  );
}
