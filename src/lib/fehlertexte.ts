import type { DbFehler } from "./db";

/**
 * Fehlermeldungen sind hier absichtlich ganze Saetze mit einem Vorschlag, was
 * jetzt zu tun ist. "Konflikt beim Speichern" hilft niemandem um 22 Uhr im
 * Gruppenchat.
 */
export function fehlerText(code: DbFehler, args: string[] = []): string {
  switch (code) {
    case "TISCH_VOLL": {
      const frei = Number(args[1] ?? args[0]);
      if (Number.isFinite(frei) && frei > 0) {
        return `Da war gerade jemand schneller. An diesem Tisch sind nur noch ${frei === 1 ? "1 Platz" : `${frei} Plätze`} frei – nimm ein paar Leute raus oder such dir einen anderen Tisch.`;
      }
      return "Da war gerade jemand schneller – dieser Tisch ist inzwischen voll. Such dir bitte einen anderen aus, es sind noch welche frei.";
    }
    case "TISCH_NICHT_BUCHBAR":
      return "Dieser Tisch ist gerade nicht buchbar. Vielleicht haben wir ihn eben zugemacht – schau nochmal auf den Plan.";
    case "TISCH_UNBEKANNT":
      return "Diesen Tisch kennen wir nicht. Geh nochmal über den Saalplan.";
    case "MINDESTALTER":
      return `Eine Reservierung ist leider nicht möglich. Wende dich bitte privat an die Pfarrjugend – ab ${args[0] ?? 16} Jahren geht es über die Seite.`;
    case "GESAMT_OBERGRENZE": {
      const rest = Number(args[0]);
      if (Number.isFinite(rest) && rest > 0) {
        return `So viele Leute passen nicht mehr rein – es sind nur noch ${rest === 1 ? "1 Platz" : `${rest} Plätze`} im Saal frei.`;
      }
      return "Der Saal ist voll. Mehr Leute dürfen wir nicht reinlassen.";
    }
    case "BUCHUNGSSCHLUSS":
      return "Der Buchungsschluss ist durch. Meld dich direkt bei uns, vielleicht geht noch was.";
    case "RESERVIERUNG_GESCHLOSSEN":
      return "Wir nehmen gerade keine Reservierungen an.";
    case "KEINE_PERSONEN":
      return "Trag bitte mindestens eine Person ein.";
    case "RESERVIERUNG_UNBEKANNT":
      return "Diese Reservierung finden wir nicht. Stimmt der Link noch?";
    case "RESERVIERUNG_NICHT_AENDERBAR":
      return "Diese Reservierung lässt sich nicht mehr ändern.";
    case "GAST_UNBEKANNT":
      return "Eine der Personen gehört nicht zu dieser Reservierung. Lade die Seite bitte neu.";
    default:
      return "Da ist bei uns etwas schiefgegangen. Probier es nochmal – wenn es wieder klemmt, meld dich bei uns.";
  }
}
