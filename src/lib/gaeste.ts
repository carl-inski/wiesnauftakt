import "server-only";
import { db, dbKonfiguriert } from "./db";
import type { ReservierungStatus } from "./reservierung";

export type GastZeile = {
  id: string;
  vorname: string;
  nachname: string;
  alterJahre: number;
  tischId: string;
  tischNummer: number;
  tischName: string | null;
  reservierungId: string;
  status: ReservierungStatus;
  email: string;
  telefon: string | null;
  eingechecktAm: string | null;
  pinAusgegebenAm: string | null;
};

type RohZeile = {
  id: string;
  vorname: string;
  nachname: string;
  alter_jahre: number;
  tisch_id: string;
  reservierung_id: string;
  eingecheckt_am: string | null;
  pin_ausgegeben_am: string | null;
  tische: { nummer: number; oeffentlicher_name: string | null } | null;
  reservierungen: {
    status: ReservierungStatus;
    kontakt_email: string;
    kontakt_telefon: string | null;
  } | null;
};

/**
 * Vollstaendige Gaesteliste fuer den Orgabereich. Diese Daten verlassen den
 * Server nur in Adminseiten, die hinter adminSchutz() liegen.
 */
export async function gaesteListe(
  status: ReservierungStatus[] = ["angefragt", "bestaetigt"],
): Promise<GastZeile[]> {
  if (!dbKonfiguriert()) return [];

  const { data, error } = await db()
    .from("gaeste")
    .select(
      `id, vorname, nachname, alter_jahre, tisch_id, reservierung_id,
       eingecheckt_am, pin_ausgegeben_am,
       tische ( nummer, oeffentlicher_name ),
       reservierungen!inner ( status, kontakt_email, kontakt_telefon )`,
    )
    .in("reservierungen.status", status)
    .order("nachname");

  if (error || !data) return [];

  return (data as unknown as RohZeile[])
    .map((z) => ({
      id: z.id,
      vorname: z.vorname,
      nachname: z.nachname,
      alterJahre: z.alter_jahre,
      tischId: z.tisch_id,
      tischNummer: z.tische?.nummer ?? 0,
      tischName: z.tische?.oeffentlicher_name ?? null,
      reservierungId: z.reservierung_id,
      status: z.reservierungen?.status ?? "angefragt",
      email: z.reservierungen?.kontakt_email ?? "",
      telefon: z.reservierungen?.kontakt_telefon ?? null,
      eingechecktAm: z.eingecheckt_am,
      pinAusgegebenAm: z.pin_ausgegeben_am,
    }))
    .sort((a, b) =>
      `${a.nachname}${a.vorname}`.localeCompare(`${b.nachname}${b.vorname}`, "de"),
    );
}

export function gaesteFiltern(
  gaeste: GastZeile[],
  suche: string,
  nurMinderjaehrig: boolean,
  mindestalter: number,
): GastZeile[] {
  const begriff = suche.trim().toLowerCase();

  return gaeste.filter((g) => {
    if (nurMinderjaehrig && g.alterJahre >= mindestalter) return false;
    if (!begriff) return true;
    return (
      `${g.vorname} ${g.nachname}`.toLowerCase().includes(begriff) ||
      (g.tischName ?? "").toLowerCase().includes(begriff) ||
      String(g.tischNummer) === begriff ||
      g.email.toLowerCase().includes(begriff)
    );
  });
}

/** Semikolon und BOM, damit Excel auf Deutsch die Spalten trifft. */
export function alsCsv(gaeste: GastZeile[]): string {
  const kopf = [
    "Nachname", "Vorname", "Alter", "Tisch", "Tischname", "Status",
    "E-Mail", "Telefon", "Eingecheckt", "Pin ausgegeben",
  ];

  const feld = (wert: string | number | null) => {
    const text = wert === null ? "" : String(wert);
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const zeilen = gaeste.map((g) =>
    [
      g.nachname, g.vorname, g.alterJahre, g.tischNummer, g.tischName ?? "",
      g.status, g.email, g.telefon ?? "",
      g.eingechecktAm ? "ja" : "nein",
      g.pinAusgegebenAm ? "ja" : "nein",
    ]
      .map(feld)
      .join(";"),
  );

  return `﻿${[kopf.join(";"), ...zeilen].join("\r\n")}\r\n`;
}
