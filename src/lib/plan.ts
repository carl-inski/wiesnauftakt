import planDaten from "@data/tische.json";

export type TischGeometrie = {
  id: string;
  nummer: number;
  reihe: string;
  spalte: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  mitte: { x: number; y: number };
};

/**
 * Der Saalplan kommt aus data/tische.json und wird ueber die statische Huelle
 * public/saalplan-raum.svg gelegt. Weder Farbe noch Klickverhalten stecken im
 * SVG – die kommen ausschliesslich aus der Datenbank.
 */
export const PLAN = {
  viewBox: planDaten.viewBox,
  huelle: planDaten.huelle,
  tische: planDaten.tische as TischGeometrie[],
};

export const GEOMETRIE: Record<string, TischGeometrie> = Object.fromEntries(
  PLAN.tische.map((t) => [t.id, t]),
);
