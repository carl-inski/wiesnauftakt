import "server-only";
import { cache } from "react";
import { db, dbKonfiguriert } from "./db";

export type Einstellungen = {
  event_datum: string;
  einlass_zeit: string;
  verfall_zeit: string;
  buchungsschluss: string;
  max_personen_pro_tisch: number;
  richtwert_personen: number;
  mindestalter: number;
  gesamt_obergrenze: number;
  reservierung_offen: boolean;
  ort_name: string;
  ort_adresse: string;
  kontakt_email: string;
  hinweis_startseite: string;
};

/**
 * Fallbacks. Sie greifen nur, solange die Datenbank noch nicht steht – im
 * Betrieb kommt jeder Wert aus der Tabelle `einstellungen` und ist im Admin
 * aenderbar, ohne dass jemand deployen muss.
 */
export const STANDARD: Einstellungen = {
  event_datum: "2026-09-18",
  einlass_zeit: "18:30",
  verfall_zeit: "19:45",
  buchungsschluss: "2026-09-15T23:59:00+02:00",
  max_personen_pro_tisch: 12,
  richtwert_personen: 10,
  mindestalter: 16,
  gesamt_obergrenze: 130,
  reservierung_offen: true,
  ort_name: "Jugendheim SJB Haidhausen",
  ort_adresse: "München",
  kontakt_email: "wiesnauftakt@pfarrjugend-sjb.de",
  hinweis_startseite: "",
};

export const EINSTELLUNG_BESCHRIFTUNG: Record<keyof Einstellungen, string> = {
  event_datum: "Datum der Veranstaltung",
  einlass_zeit: "Einlass ab",
  verfall_zeit: "Tische werden freigehalten bis",
  buchungsschluss: "Buchungsschluss",
  max_personen_pro_tisch: "Maximale Personen pro Tisch",
  richtwert_personen: "Richtwert für einen gut belegten Tisch",
  mindestalter: "Mindestalter",
  gesamt_obergrenze: "Personenobergrenze gesamt",
  reservierung_offen: "Reservierung geöffnet",
  ort_name: "Ort",
  ort_adresse: "Adresse",
  kontakt_email: "Kontaktadresse",
  hinweis_startseite: "Hinweisbanner auf der Startseite",
};

/** Pro Request einmal laden – Aenderungen im Admin wirken sofort. */
export const einstellungenLaden = cache(async (): Promise<Einstellungen> => {
  if (!dbKonfiguriert()) return { ...STANDARD };

  const { data, error } = await db().from("einstellungen").select("key, wert");
  if (error || !data) return { ...STANDARD };

  const werte = { ...STANDARD } as Record<string, unknown>;
  for (const zeile of data as { key: string; wert: unknown }[]) {
    if (zeile.key in STANDARD) werte[zeile.key] = zeile.wert;
  }
  return werte as Einstellungen;
});

/** Zeitpunkt des Einlasses als echtes Datum, in Europe/Berlin gedacht. */
export function einlassZeitpunkt(e: Einstellungen): Date {
  return new Date(`${e.event_datum}T${e.einlass_zeit}:00+02:00`);
}

export function buchungsschlussZeitpunkt(e: Einstellungen): Date {
  return new Date(e.buchungsschluss);
}

export function buchungOffen(e: Einstellungen, jetzt = new Date()): boolean {
  return e.reservierung_offen && jetzt <= buchungsschlussZeitpunkt(e);
}
