import type { SaalUebersicht, TischOeffentlich } from "./tische";
import type { Einstellungen } from "./einstellungen";
import { GEOMETRIE, PLAN } from "./plan";
import { fuellstandBestimmen, type TischStatus } from "./tisch-typen";

/**
 * Beispieldaten fuer die lokale Vorschau, damit man das Layout anschauen kann,
 * bevor Supabase steht. Greift nur, wenn WIESN_DEMO=1 gesetzt ist UND keine
 * Datenbank konfiguriert ist – im Betrieb also nie.
 */
export function demoAktiv(): boolean {
  return process.env.WIESN_DEMO === "1";
}

type Vorgabe = {
  status: TischStatus;
  name?: string;
  internerTitel?: string;
  vornamen?: string[];
};

const VORGABEN: Record<string, Vorgabe> = {
  T01: { status: "intern", internerTitel: "Band" },
  T02: { status: "intern", internerTitel: "SJB-Tisch 1" },
  T03: {
    status: "buchbar",
    name: "Zeltlager-Crew",
    vornamen: ["Anna", "Ben", "Cem", "Doro", "Elias", "Franzi", "Greta",
               "Hannes", "Ida", "Jakob", "Klara", "Lenz"],
  },
  T04: {
    status: "buchbar",
    name: "Ministranten",
    vornamen: ["Marie", "Nico", "Ole", "Pia", "Quirin", "Rosa", "Simon",
               "Theo", "Uli", "Vroni"],
  },
  T05: {
    status: "buchbar",
    name: "Boazn-Fraktion",
    vornamen: ["Wolfi", "Xenia", "Yara", "Zeno", "Alois"],
  },
  T06: { status: "buchbar", name: "Gruppenstunde Mittwoch", vornamen: ["Bene", "Cilli"] },
  T07: { status: "intern", internerTitel: "SJB-Tisch 2" },
  T08: { status: "buchbar" },
  T09: { status: "gesperrt" },
  T10: { status: "gesperrt" },
  T11: { status: "gesperrt" },
  T12: { status: "intern", internerTitel: "Eltern" },
  T13: { status: "intern", internerTitel: "Alumni / Bamhackl-Boxe" },
};

export function demoSaal(e: Einstellungen): SaalUebersicht {
  const tische: TischOeffentlich[] = PLAN.tische.map((g) => {
    const v = VORGABEN[g.id] ?? { status: "gesperrt" as TischStatus };
    const vornamen = v.vornamen ?? [];
    const max = e.max_personen_pro_tisch;
    const belegt = vornamen.length;

    return {
      id: g.id,
      nummer: g.nummer,
      status: v.status,
      name: v.name ?? null,
      internerTitel: v.internerTitel ?? null,
      belegt,
      max,
      frei: Math.max(0, max - belegt),
      vornamen,
      fuellstand: fuellstandBestimmen(belegt, max, e.richtwert_personen),
      geometrie: GEOMETRIE[g.id],
    };
  });

  const buchbare = tische.filter((t) => t.status === "buchbar");
  const plaetzeGesamt = buchbare.reduce((s, t) => s + t.max, 0);
  const plaetzeBelegt = buchbare.reduce((s, t) => s + t.belegt, 0);

  return {
    tische,
    plaetzeGesamt,
    plaetzeBelegt,
    plaetzeFrei: Math.max(0, plaetzeGesamt - plaetzeBelegt),
  };
}
