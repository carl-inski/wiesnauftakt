import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Buchungsformular } from "@/components/Buchungsformular";
import { Hinweis } from "@/components/Hinweis";
import { Saalplan } from "@/components/Saalplan";
import { buchungOffen, einstellungenLaden } from "@/lib/einstellungen";
import { datumLang } from "@/lib/format";
import { PLAN } from "@/lib/plan";
import { saalLaden, tischLaden } from "@/lib/tische";
import { FUELLSTAND_TEXT } from "@/lib/tisch-typen";
import { mailAktiv } from "@/lib/mail";

export const dynamic = "force-dynamic";

type Eigenschaften = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Eigenschaften): Promise<Metadata> {
  const { id } = await params;
  const tisch = await tischLaden(id);
  if (!tisch) return { title: "Tisch nicht gefunden" };

  const titel = tisch.name
    ? `${tisch.name} – Tisch ${tisch.nummer}`
    : `Tisch ${tisch.nummer}`;

  const beschreibung =
    tisch.status !== "buchbar"
      ? "Dieser Tisch ist nicht buchbar."
      : tisch.frei === 0
        ? "Dieser Tisch ist voll."
        : tisch.belegt === 0
          ? `Noch keiner da – ${tisch.max} Plätze frei. Eröffne den Tisch für deine Leute.`
          : `${tisch.belegt} von ${tisch.max} Plätzen belegt, noch ${tisch.frei} frei. Setz dich dazu!`;

  return {
    title: titel,
    description: beschreibung,
    openGraph: { title: `${titel} · Wiesnauftakt`, description: beschreibung },
  };
}

export default async function Tischseite({ params }: Eigenschaften) {
  const { id } = await params;
  const [e, saal] = await Promise.all([einstellungenLaden(), saalLaden()]);
  const tisch = saal.tische.find((t) => t.id === id.toUpperCase());

  if (!tisch) notFound();

  const offen = buchungOffen(e);
  const eroeffnen = tisch.belegt === 0;
  const buchbar = tisch.status === "buchbar" && tisch.frei > 0 && offen;

  return (
    <main id="inhalt" className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <Link
        href="/#tische"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white"
      >
        <span aria-hidden>←</span> Zurück zum Saalplan
      </Link>

      <header className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gelb">
          Tisch {tisch.nummer}
        </p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">
          {tisch.status === "intern"
            ? (tisch.internerTitel ?? "Fest vergeben")
            : (tisch.name ?? "Noch frei")}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {datumLang(e.event_datum)} · Einlass ab {e.einlass_zeit} Uhr · {e.ort_name}
        </p>
      </header>

      <div className="mt-6 grid gap-5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-start">
        <div className="glas mx-auto w-56 p-2 sm:w-full sm:p-3">
          <Saalplan
            tische={saal.tische}
            viewBox={PLAN.viewBox}
            huelle={PLAN.huelle}
            ausgewaehlt={tisch.id}
            klein
          />
          <p className="mt-2 text-center text-xs text-white/40">Da sitzt ihr</p>
        </div>

        <div className="glas p-4 sm:p-5">
          {tisch.status === "buchbar" ? (
            <>
              <p className="text-lg font-semibold">
                {tisch.belegt} von {tisch.max} Plätzen belegt
              </p>
              <p className="mt-1 text-sm text-white/60">
                {tisch.belegt === 0
                  ? "Noch keiner da. Du machst den Anfang."
                  : FUELLSTAND_TEXT[tisch.fuellstand]}
                {tisch.frei > 0 && tisch.belegt > 0 && (
                  <> · noch {tisch.frei} {tisch.frei === 1 ? "Platz" : "Plätze"} frei</>
                )}
              </p>

              {tisch.vornamen.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-white/40">
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
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">Hier geht nichts</p>
              <p className="mt-1 text-sm text-white/60">
                {tisch.status === "intern"
                  ? "Dieser Tisch ist fest vergeben."
                  : "Diesen Tisch haben wir noch nicht freigeschaltet."}
              </p>
            </>
          )}
        </div>
      </div>

      <section className="mt-8">
        {buchbar ? (
          <>
            <h2 className="mb-1 text-2xl font-bold">
              {eroeffnen ? "Tisch eröffnen" : "Dazusetzen"}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-white/60">
              {eroeffnen
                ? `Gib dem Tisch einen Namen, trag dich ein und nimm gleich mit, wer schon zugesagt hat. Bis zu ${tisch.max} Leute passen drauf.`
                : `Der Tisch heißt ${tisch.name ? `„${tisch.name}“` : "noch nicht"} – der Name bleibt, wie ihn die erste Person vergeben hat. Trag einfach dich und deine Leute ein.`}
            </p>

            <div className="glas p-4 sm:p-6">
              <Buchungsformular
                tischId={tisch.id}
                freiePlaetze={tisch.frei}
                mindestalter={e.mindestalter}
                eroeffnen={eroeffnen}
                verfallZeit={e.verfall_zeit}
                mailAktiv={mailAktiv()}
              />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {!offen ? (
              <Hinweis ton="rot" titel="Die Reservierung ist zu">
                {e.reservierung_offen
                  ? "Der Buchungsschluss ist durch. Meld dich direkt bei uns, vielleicht geht noch was."
                  : "Gerade nehmen wir keine Reservierungen an."}
              </Hinweis>
            ) : tisch.status !== "buchbar" ? (
              <Hinweis ton="neutral" titel="Nicht buchbar">
                {tisch.status === "intern"
                  ? "Diesen Tisch haben wir fest vergeben – er steht nur zur Orientierung im Plan."
                  : "Diesen Tisch schalten wir vielleicht noch frei, wenn die Nachfrage da ist."}
              </Hinweis>
            ) : (
              <Hinweis ton="rot" titel="Der Tisch ist voll">
                Hier passt niemand mehr dazu. Auf dem Saalplan sind aber noch andere
                Tische offen.
              </Hinweis>
            )}

            <Link
              href="/#tische"
              className="glas-knopf inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white"
            >
              Anderen Tisch suchen
            </Link>
          </div>
        )}
      </section>

      {mailAktiv() && (
        <p className="mt-10 text-center text-sm text-white/40">
          Schon reserviert und den Link verlegt?{" "}
          <Link href="/link" className="text-gelb underline underline-offset-4">
            Nochmal zuschicken lassen
          </Link>
        </p>
      )}
    </main>
  );
}
