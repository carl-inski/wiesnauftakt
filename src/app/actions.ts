"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, dbKonfiguriert } from "@/lib/db";
import { einstellungenLaden } from "@/lib/einstellungen";
import { onboardingMerken, tokenMerken, tokenVergessen } from "@/lib/eigene-buchungen";
import { fehlerText } from "@/lib/fehlertexte";
import {
  mailAnfrageEingegangen,
  mailLinkErneut,
} from "@/lib/mail";
import {
  gaesteSetzen,
  reservierungAnlegen,
  reservierungPerToken,
  reservierungStornieren,
  reservierungenPerEmail,
} from "@/lib/reservierung";
import {
  ersterFehler,
  gaesteSchema,
  personenAusFormular,
  reservierungSchema,
  emailSchema,
} from "@/lib/validierung";

import type { Zustand } from "@/lib/formzustand";

// ---------------------------------------------------------------------------
// Neue Reservierung
// ---------------------------------------------------------------------------
export async function reservierungAbsenden(
  _vorher: Zustand,
  formular: FormData,
): Promise<Zustand> {
  if (!dbKonfiguriert()) {
    return { ok: false, meldung: "Die Seite ist noch nicht mit der Datenbank verbunden." };
  }

  const geprueft = reservierungSchema.safeParse({
    tischId: String(formular.get("tischId") ?? ""),
    tischName: String(formular.get("tischName") ?? ""),
    email: String(formular.get("email") ?? ""),
    telefon: String(formular.get("telefon") ?? ""),
    personen: personenAusFormular(formular),
    verstanden: String(formular.get("verstanden") ?? ""),
  });

  if (!geprueft.success) {
    return { ok: false, meldung: ersterFehler(geprueft.error) };
  }

  const e = await einstellungenLaden();
  const zuJung = geprueft.data.personen.find((p) => p.alter_jahre < e.mindestalter);
  if (zuJung) {
    return { ok: false, meldung: fehlerText("MINDESTALTER", [String(e.mindestalter)]) };
  }

  const ergebnis = await reservierungAnlegen({
    tischId: geprueft.data.tischId,
    tischName: geprueft.data.tischName || undefined,
    email: geprueft.data.email,
    telefon: geprueft.data.telefon || undefined,
    personen: geprueft.data.personen,
  });

  if (!ergebnis.ok) {
    return { ok: false, meldung: fehlerText(ergebnis.code, ergebnis.args) };
  }

  // Zuerst merken, dann mailen: Der Browser ist der verlaesslichere Weg
  // zurueck zur eigenen Reservierung, die Mail nur die Zugabe.
  await tokenMerken(ergebnis.token);

  const reservierung = await reservierungPerToken(ergebnis.token);
  if (reservierung) await mailAnfrageEingegangen(reservierung);

  revalidatePath("/");
  revalidatePath("/meine-buchung");
  redirect(`/reservierung/${ergebnis.token}?neu=1`);
}

// ---------------------------------------------------------------------------
// Gaesteliste einer bestehenden Reservierung anpassen
// ---------------------------------------------------------------------------
export async function gaesteAktualisieren(
  _vorher: Zustand,
  formular: FormData,
): Promise<Zustand> {
  const token = String(formular.get("token") ?? "");
  const reservierung = await reservierungPerToken(token);
  if (!reservierung) return { ok: false, meldung: "Diese Reservierung finden wir nicht." };

  const geprueft = gaesteSchema.safeParse({ personen: personenAusFormular(formular) });
  if (!geprueft.success) return { ok: false, meldung: ersterFehler(geprueft.error) };

  const e = await einstellungenLaden();
  if (geprueft.data.personen.some((p) => p.alter_jahre < e.mindestalter)) {
    return { ok: false, meldung: fehlerText("MINDESTALTER", [String(e.mindestalter)]) };
  }

  const ergebnis = await gaesteSetzen(reservierung.id, geprueft.data.personen);
  if (!ergebnis.ok) return { ok: false, meldung: fehlerText(ergebnis.code, ergebnis.args) };

  revalidatePath("/");
  revalidatePath(`/reservierung/${token}`);
  return { ok: true, meldung: "Gespeichert." };
}

// ---------------------------------------------------------------------------
// Absagen
// ---------------------------------------------------------------------------
export async function reservierungAbsagen(formular: FormData): Promise<void> {
  const token = String(formular.get("token") ?? "");
  const reservierung = await reservierungPerToken(token);
  if (!reservierung) return;

  await reservierungStornieren(reservierung.id, reservierung.tischId);
  await tokenVergessen(token);
  revalidatePath("/");
  revalidatePath("/meine-buchung");
  redirect(`/reservierung/${token}?abgesagt=1`);
}

// ---------------------------------------------------------------------------
// Link erneut zuschicken
// ---------------------------------------------------------------------------
export async function linkAnfordern(
  _vorher: Zustand,
  formular: FormData,
): Promise<Zustand> {
  const geprueft = emailSchema.safeParse(String(formular.get("email") ?? ""));
  if (!geprueft.success) return { ok: false, meldung: ersterFehler(geprueft.error) };

  const email = geprueft.data;

  // Bewusst immer dieselbe Antwort: Wer hier Adressen durchprobiert, soll nicht
  // herausfinden koennen, wer angemeldet ist.
  const antwort: Zustand = {
    ok: true,
    meldung:
      "Passt. Wenn es zu dieser Adresse eine Reservierung gibt, ist die Mail unterwegs. Schau auch kurz im Spam nach.",
  };

  if (!dbKonfiguriert()) return antwort;

  // Einfache Bremse gegen Massenversand an fremde Adressen.
  const seit = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await db()
    .from("mail_log")
    .select("id", { count: "exact", head: true })
    .eq("empfaenger", email)
    .eq("art", "link_erneut")
    .gte("gesendet_am", seit);

  if ((count ?? 0) >= 3) return antwort;

  const treffer = await reservierungenPerEmail(email);
  if (treffer.length > 0) await mailLinkErneut(email, treffer);

  return antwort;
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------
export async function onboardingAbschliessen(): Promise<void> {
  await onboardingMerken();
}
