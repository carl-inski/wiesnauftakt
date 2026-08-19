import Link from "next/link";
import { Belegungsbalken } from "@/components/Belegungsbalken";
import { Countdown } from "@/components/Countdown";
import { Hinweis } from "@/components/Hinweis";
import { Logo } from "@/components/Logo";
import { Tischwahl } from "@/components/Tischwahl";
import { buchungOffen, einlassZeitpunkt, einstellungenLaden } from "@/lib/einstellungen";
import { datumLang, datumKurz } from "@/lib/format";
import { PLAN } from "@/lib/plan";
import { saalLaden } from "@/lib/tische";

export const dynamic = "force-dynamic";

export default async function Startseite() {
  const [e, saal] = await Promise.all([einstellungenLaden(), saalLaden()]);
  const offen = buchungOffen(e);
  const einlass = einlassZeitpunkt(e);

  return (
    <>
      {/* Belegung ganz oben – bleibt beim Scrollen stehen */}
      <header className="glas-leiste sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6">
          <Belegungsbalken gesamt={saal.plaetzeGesamt} belegt={saal.plaetzeBelegt} kompakt />
        </div>
      </header>

      <main id="inhalt" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* ------------------------------------------------------------- Hero */}
        <section className="pt-10 text-center sm:pt-16">
          <Logo variante="bildmarke" className="mx-auto h-28 w-28 sm:h-36 sm:w-36" alt="" />

          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
            Wiesnauftakt
          </h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.3em] text-gelb sm:text-base">
            Pfarrjugend SJB
          </p>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            {datumLang(e.event_datum)} · Einlass ab {e.einlass_zeit} Uhr
            <br />
            {e.ort_name}, {e.ort_adresse}
          </p>

          <p className="mt-5 text-lg sm:text-xl">
            <Countdown zielIso={einlass.toISOString()} />
            <span className="text-white/45"> bis zum ersten Maß</span>
          </p>

          {e.hinweis_startseite.trim() !== "" && (
            <div className="mx-auto mt-8 max-w-xl text-left">
              <Hinweis ton="gelb">{e.hinweis_startseite}</Hinweis>
            </div>
          )}

          {offen ? (
            <a
              href="#tische"
              className="mt-9 inline-flex items-center justify-center rounded-full bg-rot px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-rot/25 transition hover:bg-rot/85 active:scale-[0.98]"
            >
              Tisch reservieren
            </a>
          ) : (
            <div className="mx-auto mt-9 max-w-xl text-left">
              <Hinweis ton="rot" titel="Die Reservierung ist zu">
                {e.reservierung_offen
                  ? `Der Buchungsschluss war am ${datumKurz(e.buchungsschluss.slice(0, 10))}. Kurzentschlossene fragen am besten direkt bei uns nach.`
                  : "Gerade nehmen wir keine Reservierungen an. Bei Fragen meld dich direkt bei uns."}
              </Hinweis>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------- Was du kriegst */}
        <section className="mt-16 grid gap-4 sm:mt-20 sm:grid-cols-3">
          {[
            {
              titel: "Fester Sitzplatz",
              text: "Kein Herumstehen, kein Platzsuchen. Dein Platz am Biertisch steht fest.",
              farbe: "text-gruen-hell",
            },
            {
              titel: "Trachtenpin für jeden",
              text: "Jede angemeldete Person bekommt am Einlass einen exklusiven SJB-Trachtenpin. Einer pro Person, nicht einer pro Tisch.",
              farbe: "text-gelb",
            },
            {
              titel: "Wir wissen, wer kommt",
              text: "Damit wir genug Brezn, Bier und Sitzgelegenheiten da haben. Deshalb bitte verbindlich anmelden.",
              farbe: "text-orange-hell",
            },
          ].map((k) => (
            <div key={k.titel} className="glas p-5">
              <p className={`text-base font-semibold ${k.farbe}`}>{k.titel}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{k.text}</p>
            </div>
          ))}
        </section>

        {/* --------------------------------------------------------- So läuft es */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold sm:text-3xl">So läuft&rsquo;s</h2>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              [
                "Tisch aussuchen",
                "Einen freien Tisch eröffnen und ihm einen Namen geben – oder dich an einen angefangenen Tisch dazusetzen.",
              ],
              [
                "Leute eintragen",
                "Dich selbst und alle, die mitkommen. Nachtragen geht später jederzeit über deinen Link.",
              ],
              [
                "Auf unser Okay warten",
                "Wir schauen jede Anfrage an und bestätigen sie von Hand. Die zweite Mail ist die, die zählt.",
              ],
            ].map(([titel, text], i) => (
              <li key={titel} className="glas-tief p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rot text-sm font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-3 font-semibold">{titel}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ------------------------------------------------------------ Tische */}
        <section id="tische" className="mt-16 scroll-mt-20">
          <div className="mb-6">
            <h2 className="text-2xl font-bold sm:text-3xl">Der Saal</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              Tipp einen grünen Tisch an. Voll ist ein Tisch bei{" "}
              {e.max_personen_pro_tisch} Personen – ab {e.richtwert_personen} gilt er als gut
              belegt, aber ihr müsst nicht sofort {e.richtwert_personen} Namen haben.
            </p>
          </div>

          <Tischwahl
            tische={saal.tische}
            viewBox={PLAN.viewBox}
            huelle={PLAN.huelle}
            buchungOffen={offen}
          />
        </section>

        {/* ---------------------------------------------------------- Hinweise */}
        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          <Hinweis ton="gelb" titel="Eine Anfrage ist noch keine Zusage">
            Wenn du das Formular abschickst, ist dein Platz erst mal vorgemerkt. Wir
            bestätigen jede Reservierung von Hand und schicken dir dann eine zweite Mail.
            Erst die ist die Zusage.
          </Hinweis>

          <Hinweis ton="rot" titel={`Tische halten wir bis ${e.verfall_zeit} Uhr frei`}>
            Wer bis {e.verfall_zeit} Uhr nicht da ist, verliert den Tisch – dann geben wir
            ihn weiter. Wenn es später wird, sag uns kurz Bescheid, dann finden wir was.
          </Hinweis>

          <Hinweis ton="neutral" titel={`Ab ${e.mindestalter} Jahren`}>
            Eine Reservierung über die Seite geht erst ab {e.mindestalter}. Bist du jünger
            oder kommt jemand jüngeres mit: Wend dich bitte privat an die Pfarrjugend, das
            klären wir persönlich.
          </Hinweis>

          <Hinweis ton="neutral" titel="Link verlegt?">
            <Link href="/link" className="text-gelb underline underline-offset-4">
              Hier schicken wir dir deine Reservierung nochmal zu.
            </Link>{" "}
            E-Mail eingeben genügt.
          </Hinweis>
        </section>
      </main>

      <footer className="border-t border-white/8 px-4 py-10 text-center text-sm text-white/40 sm:px-6">
        <p>Pfarrjugend SJB · Wiesnauftakt {new Date(e.event_datum).getFullYear()}</p>
        <p className="mt-1.5">
          Fragen?{" "}
          <a href={`mailto:${e.kontakt_email}`} className="text-white/60 underline underline-offset-4">
            {e.kontakt_email}
          </a>
        </p>
        <p className="mt-4 text-xs text-white/25">
          Kein Tracking, keine Cookies außer dem, was fürs Anmelden im Orgabereich nötig ist.
        </p>
      </footer>
    </>
  );
}
