import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Erfolgsanimation } from "@/components/Erfolgsanimation";
import { Gaesteverwaltung } from "@/components/Gaesteverwaltung";
import { Hinweis } from "@/components/Hinweis";
import { KopierFeld } from "@/components/KopierFeld";
import { NachObenSpringen } from "@/components/NachObenSpringen";
import { einstellungenLaden } from "@/lib/einstellungen";
import { aufzaehlung, datumLang, zeitpunktKurz } from "@/lib/format";
import { reservierungPerToken } from "@/lib/reservierung";
import { tischLaden } from "@/lib/tische";
import { tischUrl, verwaltungsUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deine Reservierung",
  robots: { index: false, follow: false },
};

type Eigenschaften = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ neu?: string; abgesagt?: string }>;
};

const STATUSTEXT = {
  angefragt: { titel: "Angefragt", ton: "gelb" as const },
  bestaetigt: { titel: "Bestätigt", ton: "gruen" as const },
  abgelehnt: { titel: "Abgelehnt", ton: "rot" as const },
  storniert: { titel: "Abgesagt", ton: "neutral" as const },
};

export default async function Verwaltungsseite({ params, searchParams }: Eigenschaften) {
  const { token } = await params;
  const { neu, abgesagt } = await searchParams;

  const [e, reservierung] = await Promise.all([
    einstellungenLaden(),
    reservierungPerToken(token),
  ]);

  if (!reservierung) notFound();

  const tisch = await tischLaden(reservierung.tischId);
  const status = STATUSTEXT[reservierung.status];
  const aenderbar = reservierung.status === "angefragt" || reservierung.status === "bestaetigt";

  // Freie Plaetze aus Sicht dieser Reservierung: eigene Leute plus was am Tisch
  // noch uebrig ist.
  const maxPersonen = tisch
    ? reservierung.personen.length + tisch.frei
    : e.max_personen_pro_tisch;

  // Solange nichts entschieden ist, traegt der Tisch noch keinen oeffentlichen
  // Namen – dann zeigen wir dieser Gruppe ihren eigenen Wunsch.
  const angezeigterName = reservierung.tischName ?? reservierung.tischNameWunsch;
  const tischTitel = angezeigterName
    ? `„${angezeigterName}“`
    : `Tisch ${reservierung.tischNummer}`;

  return (
    <main id="inhalt" className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white"
      >
        <span aria-hidden>←</span> Zur Startseite
      </Link>

      {/* --------------------------------------------------- Frisch abgeschickt */}
      {neu === "1" && reservierung.status === "angefragt" && (
        <section className="glas mt-5 border-gruen/30 bg-gruen/8 p-5 auftauchen sm:p-6">
          <NachObenSpringen />
          <Erfolgsanimation />
          <h1 className="marke mt-4 text-center text-4xl sm:text-5xl">
            Passt, {reservierung.personen[0]?.vorname}!
          </h1>
          <p className="mt-2 text-center text-base font-medium text-gruen-hell">
            Deine Anfrage ist da.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Angefragt: {tischTitel} für{" "}
            {reservierung.personen.length === 1
              ? "eine Person"
              : `${reservierung.personen.length} Personen`}
            : {aufzaehlung(reservierung.personen.map((p) => p.vorname))}.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Gespeichert in diesem Browser — du findest sie jederzeit unter{" "}
            <Link href="/meine-buchung" className="text-gelb underline underline-offset-4">
              Meine Buchung
            </Link>
            .
          </p>
        </section>
      )}

      {abgesagt === "1" && (
        <div className="mt-5">
          <Hinweis ton="neutral" titel="Reservierung abgesagt">
            Alles klar, wir haben eure Plätze wieder freigegeben. Schade – aber vielleicht
            beim nächsten Mal.
          </Hinweis>
        </div>
      )}

      {/* -------------------------------------------------------------- Kopf */}
      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
              status.ton === "gruen"
                ? "bg-gruen/15 text-gruen-hell ring-gruen/30"
                : status.ton === "gelb"
                  ? "bg-gelb/15 text-gelb ring-gelb/30"
                  : status.ton === "rot"
                    ? "bg-rot/15 text-rot-hell ring-rot/30"
                    : "bg-white/8 text-white/60 ring-white/15"
            }`}
          >
            {status.titel}
          </span>
          <span className="text-xs text-white/40">
            angefragt am {zeitpunktKurz(reservierung.erstelltAm)} Uhr
          </span>
        </div>

        <h2 className="mt-3 text-3xl font-bold tracking-tight">{tischTitel}</h2>
        <p className="mt-1.5 text-sm text-white/60">
          Tisch {reservierung.tischNummer} · {datumLang(e.event_datum)} · Einlass ab{" "}
          {e.einlass_zeit} Uhr · {e.ort_name}
        </p>
      </header>

      {/* ----------------------------------------------------------- Status */}
      <section className="mt-6 space-y-4">
        {reservierung.status === "angefragt" && (
          <Hinweis ton="gelb" titel="Noch keine Zusage">
            An einem Tisch dürfen sich mehrere Gruppen melden. Wir schauen uns alle
            Anfragen an und entscheiden von Hand — bis dahin ist der Tisch noch nicht
            vergeben. Sobald es steht, findet ihr hier ein grünes „Bestätigt“.
          </Hinweis>
        )}

        {reservierung.status === "bestaetigt" && (
          <Hinweis ton="gruen" titel="Bestätigt – ihr seid dabei">
            Euer Tisch steht. Wir halten ihn bis {e.verfall_zeit} Uhr frei. Jede Person auf
            der Liste bekommt am Einlass ihren SJB-Trachtenpin.
          </Hinweis>
        )}

        {reservierung.status === "abgelehnt" && (
          <Hinweis ton="rot" titel="Diese Anfrage konnten wir nicht bestätigen">
            {reservierung.ablehnungGrund ? (
              <>
                <span className="text-white">{reservierung.ablehnungGrund}</span>
                <br />
              </>
            ) : null}
            Wenn du glaubst, dass da was schiefgelaufen ist, meld dich bei uns:{" "}
            <a href={`mailto:${e.kontakt_email}`} className="text-gelb underline underline-offset-4">
              {e.kontakt_email}
            </a>
          </Hinweis>
        )}

        {reservierung.status === "storniert" && (
          <Hinweis ton="neutral" titel="Abgesagt">
            Diese Reservierung ist storniert. Wenn ihr doch kommen wollt:{" "}
            <Link href="/#tische" className="text-gelb underline underline-offset-4">
              einfach neu reservieren
            </Link>
            .
          </Hinweis>
        )}
      </section>

      {/* ------------------------------------------------------------ Links */}
      {aenderbar && (
        <section className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold">Deine Links</h3>

          <KopierFeld
            betont
            beschriftung="Dein persönlicher Link"
            wert={verwaltungsUrl(reservierung.token)}
            teilenTitel="Meine Wiesnauftakt-Reservierung"
            hinweis="Damit kommst du jederzeit wieder hierher. Schick ihn dir am besten selbst – dann findest du ihn auch, wenn die Mail untergeht."
          />

          <KopierFeld
            betont
            beschriftung="Link für die Gruppe"
            wert={tischUrl(reservierung.tischId)}
            teilenTitel={`${tischTitel} beim Wiesnauftakt`}
            hinweis="Ab damit in den Gruppenchat. Wer draufklickt, landet direkt auf eurem Tisch und kann sich dazusetzen."
          />
        </section>
      )}

      {/* ------------------------------------------------------------ Gäste */}
      <section className="mt-8">
        <h3 className="text-lg font-semibold">
          {aenderbar ? "Wer kommt mit?" : "Eingetragene Personen"}
        </h3>

        {aenderbar ? (
          <>
            <p className="mb-4 mt-1 text-sm leading-relaxed text-white/55">
              Namen nachtragen, korrigieren oder jemanden rausnehmen – alles jederzeit.
              {tisch && tisch.frei > 0 && (
                <> An eurem Tisch sind noch {tisch.frei} {tisch.frei === 1 ? "Platz" : "Plätze"} frei.</>
              )}
            </p>
            <div className="glas p-4 sm:p-5">
              <Gaesteverwaltung
                token={reservierung.token}
                mindestalter={e.mindestalter}
                maxPersonen={maxPersonen}
                start={reservierung.personen.map((p) => ({
                  schluessel: p.id,
                  id: p.id,
                  vorname: p.vorname,
                  nachname: p.nachname,
                  alter: String(p.alterJahre),
                }))}
              />
            </div>
          </>
        ) : (
          <ul className="glas mt-3 divide-y divide-white/8 p-1">
            {reservierung.personen.map((p) => (
              <li key={p.id} className="px-3 py-2.5 text-sm text-white/70">
                {p.vorname} {p.nachname}
              </li>
            ))}
          </ul>
        )}
      </section>

      {aenderbar && (
        <section className="mt-8">
          <Hinweis ton="rot" titel={`Tische halten wir bis ${e.verfall_zeit} Uhr frei`}>
            Wer bis {e.verfall_zeit} Uhr nicht da ist, verliert den Tisch. Wenn es später
            wird, schreib uns kurz – dann finden wir eine Lösung.
          </Hinweis>
        </section>
      )}

      <p className="mt-10 text-center text-sm text-white/40">
        Fragen?{" "}
        <a href={`mailto:${e.kontakt_email}`} className="text-gelb underline underline-offset-4">
          {e.kontakt_email}
        </a>
      </p>
    </main>
  );
}
