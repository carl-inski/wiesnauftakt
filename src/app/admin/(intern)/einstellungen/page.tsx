import { Hinweis } from "@/components/Hinweis";
import { EinstellungenFormular } from "@/components/admin/EinstellungenFormular";
import { einstellungenLaden } from "@/lib/einstellungen";

export const dynamic = "force-dynamic";

export default async function EinstellungenSeite() {
  const e = await einstellungenLaden();

  const felder = [
    {
      schluessel: "event_datum",
      beschriftung: "Datum",
      wert: e.event_datum,
      typ: "date" as const,
      hilfe: "Bezugspunkt für Countdown und Kalendereintrag.",
    },
    {
      schluessel: "einlass_zeit",
      beschriftung: "Einlass ab",
      wert: e.einlass_zeit,
      typ: "time" as const,
      hilfe: "Steht auf der Seite und in beiden Mails.",
    },
    {
      schluessel: "verfall_zeit",
      beschriftung: "Tische frei bis",
      wert: e.verfall_zeit,
      typ: "time" as const,
      hilfe: "Ab hier verfallen reservierte Tische. Reine Kommunikation – die Seite tut nichts automatisch.",
    },
    {
      schluessel: "buchungsschluss",
      beschriftung: "Buchungsschluss",
      wert: e.buchungsschluss,
      hilfe: "Ganzes Datum mit Uhrzeit und Zeitzone, z. B. 2026-09-15T23:59:00+02:00. Danach nimmt der Server keine Anfragen mehr an.",
    },
    {
      schluessel: "gesamt_obergrenze",
      beschriftung: "Personenobergrenze gesamt",
      wert: e.gesamt_obergrenze,
      typ: "number" as const,
      hilfe: "Harte Grenze für den ganzen Saal. Wird beim Absenden serverseitig geprüft.",
    },
    {
      schluessel: "max_personen_pro_tisch",
      beschriftung: "Max. Personen pro Tisch",
      wert: e.max_personen_pro_tisch,
      typ: "number" as const,
      hilfe: "Gilt für alle Tische ohne eigenen Wert.",
    },
    {
      schluessel: "richtwert_personen",
      beschriftung: "Richtwert pro Tisch",
      wert: e.richtwert_personen,
      typ: "number" as const,
      hilfe: "Ab hier gilt ein Tisch als gut belegt. Keine Buchungshürde – nur Farbe und Text.",
    },
    {
      schluessel: "mindestalter",
      beschriftung: "Mindestalter",
      wert: e.mindestalter,
      typ: "number" as const,
      hilfe: "Darunter ist keine Reservierung über die Seite möglich.",
    },
    {
      schluessel: "ort_name",
      beschriftung: "Ort",
      wert: e.ort_name,
    },
    {
      schluessel: "ort_adresse",
      beschriftung: "Adresse",
      wert: e.ort_adresse,
      hilfe: "Landet im Kalendereintrag der Bestätigungsmail.",
    },
    {
      schluessel: "kontakt_email",
      beschriftung: "Kontaktadresse",
      wert: e.kontakt_email,
      hilfe: "Steht im Footer und in der Absagemail.",
    },
    {
      schluessel: "hinweis_startseite",
      beschriftung: "Hinweisbanner",
      wert: e.hinweis_startseite,
      hilfe: "Leer lassen = kein Banner. Sonst erscheint der Text gelb hervorgehoben oben auf der Startseite.",
    },
    {
      schluessel: "reservierung_offen",
      beschriftung: "Reservierung geöffnet",
      wert: e.reservierung_offen,
      hilfe: "Dasselbe wie der Notaus auf der Übersicht.",
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
      <p className="mt-1 text-sm text-white/50">
        Alles hier wirkt sofort auf der ganzen Seite. Kein Deploy nötig.
      </p>

      <div className="mt-4">
        <Hinweis ton="neutral">
          Wie viele Tische online sind, stellst du nicht hier ein, sondern direkt bei den{" "}
          <a href="/admin/tische" className="text-gelb underline underline-offset-4">
            Tischen
          </a>{" "}
          – jeder einzeln.
        </Hinweis>
      </div>

      <div className="mt-5">
        <EinstellungenFormular felder={felder} />
      </div>
    </>
  );
}
