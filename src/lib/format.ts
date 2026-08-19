const WOCHENTAGE = [
  "Sonntag", "Montag", "Dienstag", "Mittwoch",
  "Donnerstag", "Freitag", "Samstag",
];
const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

/** Feste Zeitzone: der Abend findet in München statt, egal wo der Server steht. */
const BERLIN = "Europe/Berlin";

function teile(datum: Date) {
  const f = new Intl.DateTimeFormat("de-DE", {
    timeZone: BERLIN,
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const map = new Map(f.formatToParts(datum).map((p) => [p.type, p.value]));
  return map;
}

export function datumLang(iso: string): string {
  const d = new Date(`${iso}T12:00:00+02:00`);
  const t = teile(d);
  const wochentag = new Intl.DateTimeFormat("de-DE", {
    timeZone: BERLIN,
    weekday: "long",
  }).format(d);
  const monat = MONATE[Number(t.get("month")) - 1];
  return `${wochentag}, ${t.get("day")}. ${monat} ${t.get("year")}`;
}

export function datumKurz(iso: string): string {
  const d = new Date(`${iso}T12:00:00+02:00`);
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: BERLIN,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(d);
}

export function zeitpunktKurz(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: BERLIN,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function personen(anzahl: number): string {
  return anzahl === 1 ? "1 Person" : `${anzahl} Personen`;
}

export function platz(anzahl: number): string {
  return anzahl === 1 ? "1 Platz" : `${anzahl} Plätze`;
}

export function tage(anzahl: number): string {
  return anzahl === 1 ? "1 Tag" : `${anzahl} Tage`;
}

/** Namensliste als "Anna, Ben und Cem". */
export function aufzaehlung(namen: string[]): string {
  if (namen.length === 0) return "";
  if (namen.length === 1) return namen[0];
  return `${namen.slice(0, -1).join(", ")} und ${namen[namen.length - 1]}`;
}

export { WOCHENTAGE, MONATE, BERLIN };
