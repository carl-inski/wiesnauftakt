/**
 * Umgebungsvariablen lesen – mit einer Regel: Eine leere Variable ist dasselbe
 * wie eine fehlende.
 *
 * In Oberflaechen wie Vercel legt man eine Variable schnell an und laesst sie
 * leer. Mit `process.env.X ?? standard` greift der Standardwert dann NICHT,
 * weil "" nicht nullish ist – der leere String wird durchgereicht und kippt
 * irgendwo weiter hinten um. Genau das ist hier zweimal passiert
 * (NEXT_PUBLIC_SITE_URL im Build, ADMIN_SESSION_SECRET beim Anmelden).
 * Deshalb laeuft jeder Zugriff durch diese Funktion.
 */
export function env(name: string): string | undefined {
  const wert = process.env[name]?.trim();
  return wert ? wert : undefined;
}

/** Wie env(), aber mit Standardwert statt undefined. */
export function envOder(name: string, standard: string): string {
  return env(name) ?? standard;
}
