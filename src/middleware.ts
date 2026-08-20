import { NextResponse, type NextRequest } from "next/server";
import {
  BUCHUNGS_COOKIE,
  COOKIE_OPTIONEN,
  tokensParsen,
  tokensSchreiben,
} from "@/lib/buchungs-cookie";

/**
 * Wer einen Verwaltungslink oeffnet – etwa weil er ihn sich selbst per
 * WhatsApp geschickt hat – soll die Reservierung danach unter "Meine Buchung"
 * wiederfinden, ohne den Link nochmal zu brauchen.
 *
 * Serverseiten duerfen keine Cookies setzen, die Middleware schon.
 */
export function middleware(anfrage: NextRequest) {
  const antwort = NextResponse.next();

  const treffer = anfrage.nextUrl.pathname.match(/^\/reservierung\/([A-Za-z0-9_-]{20,120})$/);
  if (!treffer) return antwort;

  const token = treffer[1];
  const bisher = tokensParsen(anfrage.cookies.get(BUCHUNGS_COOKIE)?.value);
  if (bisher[0] === token) return antwort;

  antwort.cookies.set(BUCHUNGS_COOKIE, tokensSchreiben([token, ...bisher]), {
    ...COOKIE_OPTIONEN,
    secure: process.env.NODE_ENV === "production",
  });
  return antwort;
}

export const config = {
  matcher: "/reservierung/:token",
};
