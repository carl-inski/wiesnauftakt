import "server-only";
import { cache } from "react";
import { db, dbKonfiguriert } from "./db";
import { demoAktiv, demoSaal } from "./demo";
import { einstellungenLaden, type Einstellungen } from "./einstellungen";
import { GEOMETRIE, PLAN, type TischGeometrie } from "./plan";
import { fuellstandBestimmen, type Fuellstand, type TischStatus } from "./tisch-typen";

export { FUELLSTAND_TEXT, fuellstandBestimmen } from "./tisch-typen";
export type { Fuellstand, TischStatus } from "./tisch-typen";

/**
 * Was ein beliebiger Gast im Browser sehen darf: Tischname, Belegungszahl und
 * die Vornamen. Nachname, Alter, E-Mail und Telefon tauchen in diesem Typ
 * bewusst nicht auf – so kann man sie auch nicht versehentlich durchreichen.
 */
export type TischOeffentlich = {
  id: string;
  nummer: number;
  status: TischStatus;
  name: string | null;
  internerTitel: string | null;
  belegt: number;
  max: number;
  frei: number;
  vornamen: string[];
  fuellstand: Fuellstand;
  geometrie: TischGeometrie;
};

export type SaalUebersicht = {
  tische: TischOeffentlich[];
  plaetzeGesamt: number;
  plaetzeBelegt: number;
  plaetzeFrei: number;
};

type TischZeile = {
  id: string;
  nummer: number;
  status: TischStatus;
  oeffentlicher_name: string | null;
  interner_titel: string | null;
  max_personen: number | null;
};

/** Leerer Saal aus reiner Plangeometrie – greift, solange keine DB verbunden ist. */
function saalOhneDaten(e: Einstellungen): SaalUebersicht {
  const tische = PLAN.tische.map((g) => ({
    id: g.id,
    nummer: g.nummer,
    status: "gesperrt" as TischStatus,
    name: null,
    internerTitel: null,
    belegt: 0,
    max: e.max_personen_pro_tisch,
    frei: e.max_personen_pro_tisch,
    vornamen: [],
    fuellstand: "leer" as Fuellstand,
    geometrie: g,
  }));
  return { tische, plaetzeGesamt: 0, plaetzeBelegt: 0, plaetzeFrei: 0 };
}

export const saalLaden = cache(async (): Promise<SaalUebersicht> => {
  const e = await einstellungenLaden();
  if (!dbKonfiguriert()) return demoAktiv() ? demoSaal(e) : saalOhneDaten(e);

  const [tischAntwort, gastAntwort] = await Promise.all([
    db()
      .from("tische")
      .select("id, nummer, status, oeffentlicher_name, interner_titel, max_personen")
      .order("nummer"),
    // Nur Vorname und Tisch verlassen die Datenbank – mehr braucht die
    // oeffentliche Ansicht nicht.
    //
    // Und nur Bestaetigte: Offene Anfragen sind Angebote, ueber die das
    // Orgateam noch entscheidet. Wer wo sitzt, steht erst mit der Zusage fest –
    // vorher darf davon im Browser nichts auftauchen.
    db()
      .from("gaeste")
      .select("tisch_id, vorname, erstellt_am, reservierungen!inner(status)")
      .eq("reservierungen.status", "bestaetigt")
      // Nach Eintragezeitpunkt: so stehen die Vornamen in der Reihenfolge da,
      // in der sich die Leute angemeldet haben – und nicht nach Position
      // innerhalb der jeweiligen Reservierung durcheinander.
      .order("erstellt_am"),
  ]);

  if (tischAntwort.error || !tischAntwort.data) return saalOhneDaten(e);

  const gaeste = (gastAntwort.data ?? []) as unknown as {
    tisch_id: string;
    vorname: string;
  }[];

  const proTisch = new Map<string, string[]>();
  for (const g of gaeste) {
    const liste = proTisch.get(g.tisch_id) ?? [];
    liste.push(g.vorname);
    proTisch.set(g.tisch_id, liste);
  }

  const tische: TischOeffentlich[] = (tischAntwort.data as TischZeile[])
    .filter((t) => GEOMETRIE[t.id])
    .map((t) => {
      const vornamen = proTisch.get(t.id) ?? [];
      const max = t.max_personen ?? e.max_personen_pro_tisch;
      const belegt = vornamen.length;
      return {
        id: t.id,
        nummer: t.nummer,
        status: t.status,
        name: t.oeffentlicher_name,
        internerTitel: t.interner_titel,
        belegt,
        max,
        frei: Math.max(0, max - belegt),
        vornamen,
        fuellstand: fuellstandBestimmen(belegt, max, e.richtwert_personen),
        geometrie: GEOMETRIE[t.id],
      };
    });

  // Der Balken oben zaehlt ehrlich: nur was online buchbar ist, zaehlt als Platz.
  const buchbare = tische.filter((t) => t.status === "buchbar");
  const plaetzeGesamt = buchbare.reduce((s, t) => s + t.max, 0);
  const plaetzeBelegt = buchbare.reduce((s, t) => s + t.belegt, 0);

  return {
    tische,
    plaetzeGesamt,
    plaetzeBelegt,
    plaetzeFrei: Math.max(0, plaetzeGesamt - plaetzeBelegt),
  };
});

export async function tischLaden(id: string): Promise<TischOeffentlich | null> {
  const saal = await saalLaden();
  return saal.tische.find((t) => t.id === id.toUpperCase()) ?? null;
}

/**
 * Personen im ganzen Saal. `bestaetigt` sind die, die tatsaechlich einen Platz
 * haben; `gesamt` nimmt die offenen Anfragen dazu – fuer das Orgateam die
 * Vorschau, wie viele Leute noch entschieden werden wollen.
 */
export async function personenGesamt(): Promise<{ gesamt: number; bestaetigt: number }> {
  if (!dbKonfiguriert()) return { gesamt: 0, bestaetigt: 0 };
  const { data } = await db()
    .from("gaeste")
    .select("id, reservierungen!inner(status)")
    .in("reservierungen.status", ["angefragt", "bestaetigt"]);

  const zeilen = (data ?? []) as unknown as { reservierungen: { status: string } }[];
  return {
    gesamt: zeilen.length,
    bestaetigt: zeilen.filter((z) => z.reservierungen?.status === "bestaetigt").length,
  };
}
