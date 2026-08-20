import "server-only";
import { randomBytes } from "node:crypto";
import { db, dbKonfiguriert, fehlerLesen, type DbFehler } from "./db";
import type { PersonEingabe } from "./validierung";

export type ReservierungStatus = "angefragt" | "bestaetigt" | "abgelehnt" | "storniert";

export type Person = {
  id: string;
  vorname: string;
  nachname: string;
  alterJahre: number;
  istKontakt: boolean;
  tischId: string;
  eingechecktAm: string | null;
  pinAusgegebenAm: string | null;
};

export type Reservierung = {
  id: string;
  token: string;
  status: ReservierungStatus;
  tischId: string;
  tischNummer: number;
  tischName: string | null;
  email: string | null;
  telefon: string | null;
  ablehnungGrund: string | null;
  notizIntern: string | null;
  erstelltAm: string;
  entschiedenAm: string | null;
  personen: Person[];
};

export function tokenErzeugen(): string {
  // 32 Byte Zufall, base64url – lang genug, dass Raten aussichtslos ist.
  return randomBytes(32).toString("base64url");
}

type RohZeile = {
  id: string;
  token: string;
  status: ReservierungStatus;
  tisch_id: string;
  kontakt_email: string | null;
  kontakt_telefon: string | null;
  ablehnung_grund: string | null;
  notiz_intern: string | null;
  erstellt_am: string;
  entschieden_am: string | null;
  tische: { nummer: number; oeffentlicher_name: string | null } | null;
  gaeste: {
    id: string;
    vorname: string;
    nachname: string;
    alter_jahre: number;
    ist_kontakt: boolean;
    tisch_id: string;
    position: number;
    eingecheckt_am: string | null;
    pin_ausgegeben_am: string | null;
  }[];
};

const AUSWAHL = `
  id, token, status, tisch_id, kontakt_email, kontakt_telefon, ablehnung_grund,
  notiz_intern, erstellt_am, entschieden_am,
  tische ( nummer, oeffentlicher_name ),
  gaeste ( id, vorname, nachname, alter_jahre, ist_kontakt, tisch_id, position,
           eingecheckt_am, pin_ausgegeben_am )
`;

function abbilden(zeile: RohZeile): Reservierung {
  return {
    id: zeile.id,
    token: zeile.token,
    status: zeile.status,
    tischId: zeile.tisch_id,
    tischNummer: zeile.tische?.nummer ?? 0,
    tischName: zeile.tische?.oeffentlicher_name ?? null,
    email: zeile.kontakt_email,
    telefon: zeile.kontakt_telefon,
    ablehnungGrund: zeile.ablehnung_grund,
    notizIntern: zeile.notiz_intern,
    erstelltAm: zeile.erstellt_am,
    entschiedenAm: zeile.entschieden_am,
    personen: [...zeile.gaeste]
      .sort((a, b) => a.position - b.position)
      .map((g) => ({
        id: g.id,
        vorname: g.vorname,
        nachname: g.nachname,
        alterJahre: g.alter_jahre,
        istKontakt: g.ist_kontakt,
        tischId: g.tisch_id,
        eingechecktAm: g.eingecheckt_am,
        pinAusgegebenAm: g.pin_ausgegeben_am,
      })),
  };
}

export async function reservierungPerToken(token: string): Promise<Reservierung | null> {
  if (!dbKonfiguriert() || !token) return null;
  const { data, error } = await db()
    .from("reservierungen")
    .select(AUSWAHL)
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  return abbilden(data as unknown as RohZeile);
}

export async function reservierungPerId(id: string): Promise<Reservierung | null> {
  if (!dbKonfiguriert()) return null;
  const { data, error } = await db()
    .from("reservierungen")
    .select(AUSWAHL)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return abbilden(data as unknown as RohZeile);
}

export async function alleReservierungen(
  status?: ReservierungStatus[],
): Promise<Reservierung[]> {
  if (!dbKonfiguriert()) return [];
  let abfrage = db().from("reservierungen").select(AUSWAHL);
  if (status?.length) abfrage = abfrage.in("status", status);
  const { data, error } = await abfrage.order("erstellt_am", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as RohZeile[]).map(abbilden);
}

export type AnlegenErgebnis =
  | { ok: true; token: string; reservierungId: string }
  | { ok: false; code: DbFehler; args: string[] };

export async function reservierungAnlegen(eingabe: {
  tischId: string;
  tischName?: string;
  telefon?: string;
  personen: PersonEingabe[];
}): Promise<AnlegenErgebnis> {
  const token = tokenErzeugen();

  const { error } = await db().rpc("reservierung_anlegen", {
    p_tisch_id: eingabe.tischId,
    p_tisch_name: eingabe.tischName?.trim() || null,
    p_token: token,
    p_email: null,
    p_telefon: eingabe.telefon?.trim() || null,
    p_personen: eingabe.personen.map((p) => ({
      vorname: p.vorname,
      nachname: p.nachname,
      alter_jahre: p.alter_jahre,
    })),
  });

  if (error) {
    const { code, args } = fehlerLesen(error.message);
    return { ok: false, code, args };
  }

  const angelegt = await reservierungPerToken(token);
  return angelegt
    ? { ok: true, token, reservierungId: angelegt.id }
    : { ok: false, code: "UNBEKANNT", args: [] };
}

export type GaesteErgebnis = { ok: true } | { ok: false; code: DbFehler; args: string[] };

export async function gaesteSetzen(
  reservierungId: string,
  personen: PersonEingabe[],
): Promise<GaesteErgebnis> {
  const { error } = await db().rpc("reservierung_gaeste_setzen", {
    p_reservierung_id: reservierungId,
    p_personen: personen.map((p) => ({
      ...(p.id ? { id: p.id } : {}),
      vorname: p.vorname,
      nachname: p.nachname,
      alter_jahre: p.alter_jahre,
    })),
  });
  if (error) {
    const { code, args } = fehlerLesen(error.message);
    return { ok: false, code, args };
  }
  return { ok: true };
}

export async function reservierungStornieren(id: string, tischId: string): Promise<void> {
  await db()
    .from("reservierungen")
    .update({ status: "storniert", aktualisiert_am: new Date().toISOString() })
    .eq("id", id);
  await db().rpc("tisch_neu_bewerten", { p_tisch_id: tischId });
}

export async function reservierungEntscheiden(
  id: string,
  status: "bestaetigt" | "abgelehnt",
  grund?: string,
): Promise<{ ok: boolean; fehler?: string }> {
  const { error } = await db()
    .from("reservierungen")
    .update({
      status,
      ablehnung_grund: status === "abgelehnt" ? grund?.trim() || null : null,
      entschieden_am: new Date().toISOString(),
      aktualisiert_am: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, fehler: error.message };
  return { ok: true };
}
