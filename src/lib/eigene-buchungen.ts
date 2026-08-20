import "server-only";
import { cookies } from "next/headers";
import {
  BUCHUNGS_COOKIE,
  COOKIE_OPTIONEN,
  ONBOARDING_COOKIE,
  tokensParsen,
  tokensSchreiben,
} from "./buchungs-cookie";
import { reservierungPerToken, type Reservierung } from "./reservierung";

/**
 * "Meine Buchung" ohne Konto: Der Browser merkt sich die Verwaltungstokens.
 * Das ersetzt keinen Verwaltungslink – wer das Handy wechselt oder den
 * Verlauf loescht, braucht ihn weiterhin – aber es nimmt der Mail die Rolle
 * als einziger Rettungsanker.
 */

export async function eigeneTokens(): Promise<string[]> {
  const wert = (await cookies()).get(BUCHUNGS_COOKIE)?.value;
  return tokensParsen(wert);
}

export async function tokenMerken(token: string): Promise<void> {
  const keks = await cookies();
  const bisher = tokensParsen(keks.get(BUCHUNGS_COOKIE)?.value);
  // Neuestes zuerst, damit bei vollem Cookie das aelteste herausfaellt.
  keks.set(BUCHUNGS_COOKIE, tokensSchreiben([token, ...bisher]), {
    ...COOKIE_OPTIONEN,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function tokenVergessen(token: string): Promise<void> {
  const keks = await cookies();
  const bisher = tokensParsen(keks.get(BUCHUNGS_COOKIE)?.value);
  keks.set(BUCHUNGS_COOKIE, tokensSchreiben(bisher.filter((t) => t !== token)), {
    ...COOKIE_OPTIONEN,
    secure: process.env.NODE_ENV === "production",
  });
}

/** Die im Browser gemerkten Reservierungen, ohne die verschwundenen. */
export async function eigeneBuchungen(): Promise<Reservierung[]> {
  const tokens = await eigeneTokens();
  if (tokens.length === 0) return [];

  const gefunden = await Promise.all(tokens.map((t) => reservierungPerToken(t)));
  return gefunden.filter((r): r is Reservierung => r !== null);
}

export async function onboardingFertig(): Promise<boolean> {
  return (await cookies()).get(ONBOARDING_COOKIE)?.value === "1";
}

export async function onboardingMerken(): Promise<void> {
  const keks = await cookies();
  keks.set(ONBOARDING_COOKIE, "1", {
    ...COOKIE_OPTIONEN,
    secure: process.env.NODE_ENV === "production",
  });
}
