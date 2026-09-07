import type { Metadata } from "next";
import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { Hinweis } from "@/components/Hinweis";
import { Kartenkachel } from "@/components/Kartenkachel";
import { Logo } from "@/components/Logo";
import { TRACHTENPIN_PLATZ, Trachtenpin } from "@/components/Trachtenpin";
import { buchungsschlussZeitpunkt, einlassZeitpunkt, einstellungenLaden } from "@/lib/einstellungen";
import { datumLang, zeitpunktKurz } from "@/lib/format";
import { mailAktiv } from "@/lib/mail";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Infos",
  description: "Alles zum Wiesnauftakt der Pfarrjugend SJB.",
};

function Zeile({ was, wert }: { was: string; wert: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/8 py-3 last:border-0">
      <dt className="shrink-0 text-sm text-white/45">{was}</dt>
      <dd className="text-right text-sm font-medium">{wert}</dd>
    </div>
  );
}

export default async function InfoSeite() {
  const e = await einstellungenLaden();

  return (
    <main id="inhalt" className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="text-center">
        <Logo variante="bildmarke" className="mx-auto h-44 w-44 sm:h-52 sm:w-52" alt="" />
        <h1 className="marke mt-4 text-5xl">Wiesnauftakt</h1>
        <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-gelb">
          Pfarrjugend SJB
        </p>
        <p className="mt-4 text-base">
          <Countdown zielIso={einlassZeitpunkt(e).toISOString()} />
        </p>
      </div>

      <section className="glas mt-7 px-4 py-1 sm:px-5">
        <dl>
          <Zeile was="Wann" wert={datumLang(e.event_datum)} />
          <Zeile was="Einlass" wert={`ab ${e.einlass_zeit} Uhr`} />
          <Zeile was="Wo" wert={`${e.ort_name}, ${e.ort_adresse}`} />
          <Zeile was="Tische frei bis" wert={`${e.verfall_zeit} Uhr`} />
          <Zeile was="Pro Tisch" wert={`max. ${e.max_personen_pro_tisch} Personen`} />
          <Zeile was="Ab" wert={`${e.mindestalter} Jahren`} />
          <Zeile
            was="Buchungsschluss"
            wert={`${zeitpunktKurz(buchungsschlussZeitpunkt(e).toISOString())} Uhr`}
          />
        </dl>
      </section>

      <section className="mt-5">
        <Kartenkachel ortName={e.ort_name} adresse={e.ort_adresse} mapsLink={e.maps_link} />
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-semibold">So läuft&rsquo;s</h2>
        <ol className="mt-3 space-y-2.5">
          {[
            ["Tisch aussuchen", "Einen freien Tisch eröffnen und ihm einen Namen geben — oder dich an einen angefangenen Tisch dazusetzen."],
            ["Leute eintragen", "Dich selbst und alle, die mitkommen. Nachtragen geht später jederzeit."],
            ["Auf unser Okay warten", "Am selben Tisch dürfen mehrere anfragen. Wir schauen uns alle an und entscheiden von Hand."],
          ].map(([titel, text], i) => (
            <li key={titel} className="glas-tief flex gap-3.5 p-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rot text-sm font-bold">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold">{titel}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-7 space-y-3">
        <Hinweis ton="gelb" titel="Eine Anfrage ist noch keine Zusage">
          An einem Tisch dürfen sich mehrere Gruppen melden. Wir schauen uns alle an
          und entscheiden von Hand — erst dann ist der Tisch vergeben und unter
          „Meine Buchung“ steht ein grünes „Bestätigt“.
        </Hinweis>

        <Hinweis ton="rot" titel={`Tische halten wir bis ${e.verfall_zeit} Uhr frei`}>
          Wer bis {e.verfall_zeit} Uhr nicht da ist, verliert den Tisch — danach ist ein
          fester Platz nicht mehr garantiert. Wenn es später wird, sag uns kurz Bescheid.
        </Hinweis>

        <Hinweis
          ton="gruen"
          titel="Ein Trachtenpin pro Person"
          bild={<Trachtenpin />}
          bildPlatz={TRACHTENPIN_PLATZ}
        >
          Am Einlass gibt es für jede angemeldete Person einen SJB-Trachtenpin — einer
          pro Person, nicht einer pro Tisch. Die Pins sind bestellt, und es haben
          deutlich mehr Leute reserviert als geplant: ganz garantieren können wir sie
          deshalb nicht.
        </Hinweis>

        <Hinweis ton="neutral" titel={`Ab ${e.mindestalter} Jahren`}>
          Eine Reservierung über die Seite geht erst ab {e.mindestalter}. Bist du jünger
          oder kommt jemand Jüngeres mit: Wend dich bitte privat an die Pfarrjugend, das
          klären wir persönlich.
        </Hinweis>

        {mailAktiv() && (
          <Hinweis ton="neutral" titel="Link verlegt?">
            <Link href="/link" className="text-gelb underline underline-offset-4">
              Hier schicken wir dir deine Reservierung nochmal zu.
            </Link>
          </Hinweis>
        )}
      </section>

    </main>
  );
}
