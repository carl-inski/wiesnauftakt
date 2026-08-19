/** Begriffe rund um Tische, die auch im Browser gebraucht werden. */

export type TischStatus = "buchbar" | "gesperrt" | "intern";
export type Fuellstand = "leer" | "fuellt_sich" | "gut_belegt" | "voll";

export const FUELLSTAND_TEXT: Record<Fuellstand, string> = {
  leer: "noch frei",
  fuellt_sich: "füllt sich noch, Plätze frei",
  gut_belegt: "gut belegt",
  voll: "voll",
};

/**
 * Der Richtwert ist bewusst keine Buchungshuerde: Ein Tisch mit drei Namen ist
 * voellig in Ordnung, er sieht nur anders aus als einer mit elf.
 */
export function fuellstandBestimmen(
  belegt: number,
  max: number,
  richtwert: number,
): Fuellstand {
  if (belegt >= max) return "voll";
  if (belegt === 0) return "leer";
  if (belegt >= richtwert) return "gut_belegt";
  return "fuellt_sich";
}
