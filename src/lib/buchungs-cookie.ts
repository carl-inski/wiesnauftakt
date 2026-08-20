/**
 * Gemeinsame Definitionen fuer das Buchungs-Cookie.
 *
 * Liegt bewusst ohne "server-only" hier, weil auch die Middleware darauf
 * zugreift – und die laeuft in einer anderen Umgebung als die Serverseiten.
 */

export const BUCHUNGS_COOKIE = "wa_buchungen";
export const ONBOARDING_COOKIE = "wa_start";

/** Mehr als eine Handvoll Reservierungen legt niemand an. */
export const MAX_TOKENS = 6;

/** Bis gut nach dem Fest – danach braucht es das Cookie nicht mehr. */
export const COOKIE_LAUFZEIT = 60 * 60 * 24 * 400;

/** Tokens sind base64url, enthalten also nie einen Punkt. */
const TRENNER = ".";

export function tokensParsen(wert: string | undefined): string[] {
  if (!wert) return [];
  return wert
    .split(TRENNER)
    .map((t) => t.trim())
    .filter((t) => /^[A-Za-z0-9_-]{20,120}$/.test(t))
    .slice(0, MAX_TOKENS);
}

export function tokensSchreiben(tokens: string[]): string {
  return [...new Set(tokens)].slice(0, MAX_TOKENS).join(TRENNER);
}

export const COOKIE_OPTIONEN = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: COOKIE_LAUFZEIT,
} as const;
