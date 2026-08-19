import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Zugang fuer zwei bis drei Leute. Ein gemeinsames Passwort reicht dafuer und
 * spart eine Nutzerverwaltung, die niemand pflegen will. Das Passwort selbst
 * landet nie in einem Cookie – im Cookie steht nur eine signierte Ablaufzeit.
 */

const COOKIE = "wa_admin";
const LAUFZEIT_MS = 12 * 60 * 60 * 1000;

function geheimnis(): string {
  const s = process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORT;
  if (!s) throw new Error("ADMIN_PASSWORT fehlt. Siehe .env.example.");
  return s;
}

export function adminKonfiguriert(): boolean {
  return Boolean(process.env.ADMIN_PASSWORT);
}

function signieren(nutzlast: string): string {
  return createHmac("sha256", geheimnis()).update(nutzlast).digest("base64url");
}

function gleich(a: string, b: string): boolean {
  const pa = Buffer.from(a);
  const pb = Buffer.from(b);
  if (pa.length !== pb.length) return false;
  return timingSafeEqual(pa, pb);
}

export function passwortPruefen(eingabe: string): boolean {
  const soll = process.env.ADMIN_PASSWORT;
  if (!soll) return false;
  // Auf gleiche Laenge bringen, damit der Vergleich nicht ueber die Laenge plaudert.
  return gleich(
    createHmac("sha256", "vergleich").update(eingabe).digest("hex"),
    createHmac("sha256", "vergleich").update(soll).digest("hex"),
  );
}

export async function anmelden(): Promise<void> {
  const ablauf = String(Date.now() + LAUFZEIT_MS);
  const keks = await cookies();
  keks.set(COOKIE, `${ablauf}.${signieren(ablauf)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LAUFZEIT_MS / 1000,
  });
}

export async function abmelden(): Promise<void> {
  const keks = await cookies();
  keks.delete(COOKIE);
}

export async function angemeldet(): Promise<boolean> {
  if (!adminKonfiguriert()) return false;
  const wert = (await cookies()).get(COOKIE)?.value;
  if (!wert) return false;

  const [ablauf, unterschrift] = wert.split(".");
  if (!ablauf || !unterschrift) return false;
  if (!gleich(unterschrift, signieren(ablauf))) return false;
  return Number(ablauf) > Date.now();
}

/** In jeder Adminseite und jeder Adminaktion die erste Zeile. */
export async function adminSchutz(): Promise<void> {
  if (!(await angemeldet())) redirect("/admin/login");
}
