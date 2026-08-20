"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { dbKonfiguriert } from "@/lib/db";
import { einstellungenLaden } from "@/lib/einstellungen";
import { onboardingMerken, tokenMerken, tokenVergessen } from "@/lib/eigene-buchungen";
import { fehlerText } from "@/lib/fehlertexte";
import { mailNeueAnfrage } from "@/lib/mail";
import {
  gaesteSetzen,
  reservierungAnlegen,
  reservierungPerToken,
  reservierungStornieren,
} from "@/lib/reservierung";
import {
  ersterFehler,
  gaesteSchema,
  personenAusFormular,
  reservierungSchema,
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
    telefon: geprueft.data.telefon || undefined,
    personen: geprueft.data.personen,
  });

  if (!ergebnis.ok) {
    return { ok: false, meldung: fehlerText(ergebnis.code, ergebnis.args) };
  }

  // Zuerst merken, dann mailen: Der Browser ist der verlaesslichere Weg
  // zurueck zur eigenen Reservierung, die Mail nur die Zugabe.
  await tokenMerken(ergebnis.token);

  // Die Benachrichtigung geht ans Orgateam, nicht an die buchende Person.
  const reservierung = await reservierungPerToken(ergebnis.token);
  if (reservierung) await mailNeueAnfrage(reservierung);

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
// Onboarding
// ---------------------------------------------------------------------------
export async function onboardingAbschliessen(): Promise<void> {
  await onboardingMerken();
}
