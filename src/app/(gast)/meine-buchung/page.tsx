import type { Metadata } from "next";
import Link from "next/link";
import { Hinweis } from "@/components/Hinweis";
import { KopierFeld } from "@/components/KopierFeld";
import { eigeneBuchungen } from "@/lib/eigene-buchungen";
import { einstellungenLaden } from "@/lib/einstellungen";
import { aufzaehlung, zeitpunktKurz } from "@/lib/format";
import { tischUrl, verwaltungsUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meine Buchung",
  robots: { index: false, follow: false },
};

const STATUS = {
  angefragt: { text: "Angefragt", stil: "bg-gelb/15 text-gelb ring-gelb/30" },
  bestaetigt: { text: "Bestätigt", stil: "bg-gruen/15 text-gruen-hell ring-gruen/30" },
  abgelehnt: { text: "Abgelehnt", stil: "bg-rot/15 text-rot-hell ring-rot/30" },
  storniert: { text: "Abgesagt", stil: "bg-white/8 text-white/55 ring-white/15" },
};

export default async function MeineBuchungSeite() {
  const [e, buchungen] = await Promise.all([einstellungenLaden(), eigeneBuchungen()]);

  return (
    <main id="inhalt" className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 sm:pt-6">
      <h1 className="marke text-4xl sm:text-5xl">Meine Buchung</h1>

      {buchungen.length === 0 ? (
        <>
          <p className="mt-1.5 text-sm leading-relaxed text-white/55">
            In diesem Browser ist noch keine Reservierung gespeichert.
          </p>

          <div className="glas mt-6 p-6 text-center">
            <p className="text-base font-semibold">Noch nichts reserviert</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/60">
              Such dir in der Festhalle einen Tisch aus. Sobald du reserviert hast, findest du
              hier deine Buchung und den Link für die Gruppe.
            </p>
            <Link href="/" className="knopf-gross mt-6">
              Zur Festhalle
            </Link>
          </div>

          <div className="mt-5">
            <Hinweis ton="neutral" titel="Schon reserviert, aber hier ist nichts?">
              Dann warst du vermutlich in einem anderen Browser unterwegs — oder der
              Verlauf wurde gelöscht. Öffne einfach deinen persönlichen Link, dann steht
              die Buchung auch hier wieder. Findest du ihn nicht mehr, meld dich kurz
              bei uns.
            </Hinweis>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm leading-relaxed text-white/55">
            {buchungen.length === 1
              ? "In diesem Browser gespeichert."
              : `${buchungen.length} Reservierungen in diesem Browser gespeichert.`}
          </p>

          <div className="mt-5 space-y-5">
            {buchungen.map((r) => {
              const status = STATUS[r.status];
              const titel = r.tischName ?? `Tisch ${r.tischNummer}`;
              const aenderbar = r.status === "angefragt" || r.status === "bestaetigt";

              return (
                <article key={r.id} className="glas p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${status.stil}`}
                    >
                      {status.text}
                    </span>
                    <span className="text-xs text-white/40">
                      Tisch {r.tischNummer} · {zeitpunktKurz(r.erstelltAm)} Uhr
                    </span>
                  </div>

                  <h2 className="mt-2.5 text-xl font-bold tracking-tight">{titel}</h2>
                  <p className="mt-1 text-sm text-white/60">
                    {r.personen.length === 1 ? "1 Person" : `${r.personen.length} Personen`}
                    : {aufzaehlung(r.personen.map((p) => p.vorname))}
                  </p>

                  {r.status === "angefragt" && (
                    <div className="mt-4">
                      <Hinweis ton="gelb" titel="Noch keine Zusage">
                        Wir bestätigen jede Anfrage von Hand. Sobald das passiert ist,
                        steht hier „Bestätigt“. Eure Plätze sind aber schon vorgemerkt.
                      </Hinweis>
                    </div>
                  )}

                  {r.status === "bestaetigt" && (
                    <div className="mt-4">
                      <Hinweis ton="gruen" titel="Ihr seid dabei">
                        Euer Tisch steht. Wir halten ihn bis {e.verfall_zeit} Uhr frei.
                      </Hinweis>
                    </div>
                  )}

                  {r.status === "abgelehnt" && r.ablehnungGrund && (
                    <div className="mt-4">
                      <Hinweis ton="rot" titel="Nicht bestätigt">
                        {r.ablehnungGrund}
                      </Hinweis>
                    </div>
                  )}

                  {aenderbar && (
                    <div className="mt-5 space-y-4">
                      <KopierFeld
                        beschriftung="Link für die Gruppe"
                        wert={tischUrl(r.tischId)}
                        teilenTitel={`${titel} beim Wiesnauftakt`}
                        hinweis="Ab damit in den Gruppenchat — wer draufklickt, landet direkt auf eurem Tisch."
                      />
                      <KopierFeld
                        beschriftung="Dein persönlicher Link"
                        wert={verwaltungsUrl(r.token)}
                        teilenTitel="Meine Wiesnauftakt-Reservierung"
                        hinweis="Damit kommst du auch von einem anderen Handy an deine Buchung."
                      />

                      <Link
                        href={`/reservierung/${r.token}`}
                        className="knopf-gross-leise"
                      >
                        Namen ändern oder absagen
                      </Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-white/35">
            Gespeichert wird nur in diesem Browser. Wenn du den Verlauf löschst, brauchst
            du deinen persönlichen Link — schick ihn dir am besten selbst.
          </p>
        </>
      )}
    </main>
  );
}
