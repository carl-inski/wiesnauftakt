import Link from "next/link";
import { Hinweis } from "@/components/Hinweis";
import { NotausSchalter } from "@/components/admin/NotausSchalter";
import { dbKonfiguriert } from "@/lib/db";
import { buchungsschlussZeitpunkt, einstellungenLaden } from "@/lib/einstellungen";
import { datumLang, zeitpunktKurz } from "@/lib/format";
import { alleReservierungen } from "@/lib/reservierung";
import { personenGesamt, saalLaden } from "@/lib/tische";

export const dynamic = "force-dynamic";

function Zahl({
  wert,
  von,
  beschriftung,
  ton = "neutral",
}: {
  wert: number | string;
  von?: number;
  beschriftung: string;
  ton?: "neutral" | "gelb" | "gruen" | "rot";
}) {
  const farbe = {
    neutral: "text-white",
    gelb: "text-gelb",
    gruen: "text-gruen-hell",
    rot: "text-rot-hell",
  }[ton];

  return (
    <div className="glas p-4">
      <p className={`text-3xl font-bold tabular-nums ${farbe}`}>
        {wert}
        {von !== undefined && <span className="text-lg text-white/35"> / {von}</span>}
      </p>
      <p className="mt-1 text-xs leading-snug text-white/50">{beschriftung}</p>
    </div>
  );
}

export default async function Uebersicht() {
  if (!dbKonfiguriert()) {
    return (
      <Hinweis ton="rot" titel="Keine Datenbank verbunden">
        Setz <code>SUPABASE_URL</code> und <code>SUPABASE_SERVICE_ROLE_KEY</code> in den
        Umgebungsvariablen. Siehe <code>.env.example</code>.
      </Hinweis>
    );
  }

  const [e, saal, zaehler, offeneAnfragen] = await Promise.all([
    einstellungenLaden(),
    saalLaden(),
    personenGesamt(),
    alleReservierungen(["angefragt"]),
  ]);

  const buchbar = saal.tische.filter((t) => t.status === "buchbar").length;
  const schluss = buchungsschlussZeitpunkt(e);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Übersicht</h1>
      <p className="mt-1 text-sm text-white/50">
        {datumLang(e.event_datum)} · Einlass ab {e.einlass_zeit} Uhr
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Zahl
          wert={zaehler.bestaetigt}
          von={e.gesamt_obergrenze}
          beschriftung="bestätigte Personen von der Obergrenze"
          ton={
            zaehler.bestaetigt >= e.gesamt_obergrenze
              ? "rot"
              : zaehler.bestaetigt >= e.gesamt_obergrenze * 0.8
                ? "gelb"
                : "gruen"
          }
        />
        <Zahl
          wert={offeneAnfragen.length}
          beschriftung="Anfragen warten auf eine Entscheidung"
          ton={offeneAnfragen.length > 0 ? "gelb" : "neutral"}
        />
        <Zahl wert={zaehler.gesamt} beschriftung="Personen inkl. noch offener Anfragen" />
        <Zahl
          wert={`${saal.plaetzeBelegt}/${saal.plaetzeGesamt}`}
          beschriftung={`Plätze auf den ${buchbar} freigeschalteten Tischen`}
        />
      </div>

      {offeneAnfragen.length > 0 && (
        <div className="mt-6">
          <Hinweis ton="gelb" titel={`${offeneAnfragen.length} offene ${offeneAnfragen.length === 1 ? "Anfrage" : "Anfragen"}`}>
            Älteste vom {zeitpunktKurz(offeneAnfragen[0].erstelltAm)} Uhr.{" "}
            <Link href="/admin/anfragen" className="text-gelb underline underline-offset-4">
              Jetzt durchgehen
            </Link>
          </Hinweis>
        </div>
      )}

      {saal.plaetzeFrei <= 6 && saal.plaetzeGesamt > 0 && (
        <div className="mt-4">
          <Hinweis ton="orange" titel="Es wird eng">
            Nur noch {saal.plaetzeFrei} freie Plätze online.{" "}
            <Link href="/admin/tische" className="text-gelb underline underline-offset-4">
              Tisch nachlegen
            </Link>
          </Hinweis>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Schnellzugriff</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ["/admin/anfragen", "Anfragen entscheiden", "Bestätigen oder ablehnen, beides schickt eine Mail."],
            ["/admin/tische", "Tische freischalten", "Der Hebel, wenn die Nachfrage da ist."],
            ["/admin/gaeste", "Gästeliste", "Suchen, Minderjährige filtern, exportieren."],
            ["/admin/einlass", "Einlassansicht", "Für den Abend: Name antippen, Haken setzen."],
          ].map(([pfad, titel, text]) => (
            <Link key={pfad} href={pfad} className="glas p-4 transition hover:bg-white/[0.09]">
              <p className="font-semibold">{titel}</p>
              <p className="mt-1 text-sm text-white/55">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Reservierung</h2>
        <p className="mt-1 text-sm text-white/50">
          Buchungsschluss: {zeitpunktKurz(schluss.toISOString())} Uhr
        </p>
        <div className="mt-3">
          <NotausSchalter offen={e.reservierung_offen} />
        </div>
      </section>
    </>
  );
}
