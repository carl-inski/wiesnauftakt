"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { abmelden, adminKonfiguriert, adminSchutz, anmelden, passwortPruefen } from "@/lib/admin";
import { db } from "@/lib/db";
import { STANDARD, type Einstellungen } from "@/lib/einstellungen";
import { reservierungEntscheiden, reservierungPerId } from "@/lib/reservierung";

import type { Zustand } from "@/lib/formzustand";

function alleNeuLaden() {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
}

// ---------------------------------------------------------------------------
// Anmeldung
// ---------------------------------------------------------------------------
export async function anmeldenAktion(_vorher: Zustand, formular: FormData): Promise<Zustand> {
  if (!adminKonfiguriert()) {
    return { ok: false, meldung: "ADMIN_PASSWORT ist auf dem Server nicht gesetzt." };
  }

  const passwort = String(formular.get("passwort") ?? "");
  if (!passwortPruefen(passwort)) {
    // Kleine Bremse gegen stures Durchprobieren.
    await new Promise((f) => setTimeout(f, 700));
    return { ok: false, meldung: "Passt nicht." };
  }

  await anmelden();
  redirect("/admin");
}

export async function abmeldenAktion(): Promise<void> {
  await abmelden();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Anfragen bestaetigen / ablehnen
// ---------------------------------------------------------------------------
export async function anfrageEntscheiden(formular: FormData): Promise<void> {
  await adminSchutz();

  const id = String(formular.get("id") ?? "");
  const entscheidung = String(formular.get("entscheidung") ?? "");
  const grund = String(formular.get("grund") ?? "");

  if (entscheidung !== "bestaetigt" && entscheidung !== "abgelehnt") return;

  const ergebnis = await reservierungEntscheiden(id, entscheidung, grund);
  if (!ergebnis.ok) {
    alleNeuLaden();
    return;
  }

  // Gaeste bekommen keine Mail – sie sehen den Status unter "Meine Buchung".
  if (entscheidung === "abgelehnt") {
    const reservierung = await reservierungPerId(id);
    if (reservierung) {
      // Abgelehnte Plaetze werden wieder frei – Tischnamen ggf. zuruecksetzen.
      await db().rpc("tisch_neu_bewerten", { p_tisch_id: reservierung.tischId });
    }
  }

  alleNeuLaden();
}

export async function notizSpeichern(formular: FormData): Promise<void> {
  await adminSchutz();
  const id = String(formular.get("id") ?? "");
  const notiz = String(formular.get("notiz") ?? "").trim();

  await db()
    .from("reservierungen")
    .update({ notiz_intern: notiz || null })
    .eq("id", id);

  alleNeuLaden();
}

// ---------------------------------------------------------------------------
// Tische
// ---------------------------------------------------------------------------
export async function tischSpeichern(formular: FormData): Promise<void> {
  await adminSchutz();

  const id = String(formular.get("id") ?? "");
  const status = String(formular.get("status") ?? "");
  if (!["buchbar", "gesperrt", "intern"].includes(status)) return;

  const internerTitel = String(formular.get("internerTitel") ?? "").trim();
  const oeffentlicherName = String(formular.get("oeffentlicherName") ?? "").trim();
  const maxRoh = String(formular.get("maxPersonen") ?? "").trim();
  const max = maxRoh === "" ? null : Number(maxRoh);

  await db()
    .from("tische")
    .update({
      status,
      interner_titel: internerTitel || null,
      oeffentlicher_name: oeffentlicherName || null,
      max_personen: max !== null && Number.isFinite(max) && max > 0 ? Math.floor(max) : null,
      aktualisiert_am: new Date().toISOString(),
    })
    .eq("id", id);

  alleNeuLaden();
}

/** Ein Klick, ein Tisch mehr online – der wichtigste Hebel des Abends. */
export async function tischUmschalten(formular: FormData): Promise<void> {
  await adminSchutz();

  const id = String(formular.get("id") ?? "");
  const neu = String(formular.get("neu") ?? "");
  if (!["buchbar", "gesperrt", "intern"].includes(neu)) return;

  await db()
    .from("tische")
    .update({ status: neu, aktualisiert_am: new Date().toISOString() })
    .eq("id", id);

  alleNeuLaden();
}

export async function gastVerschieben(formular: FormData): Promise<void> {
  await adminSchutz();

  const gastId = String(formular.get("gastId") ?? "");
  const tischId = String(formular.get("tischId") ?? "");
  if (!gastId || !tischId) return;

  await db().rpc("gast_verschieben", { p_gast_id: gastId, p_tisch_id: tischId });
  alleNeuLaden();
}

// ---------------------------------------------------------------------------
// Einlass
// ---------------------------------------------------------------------------
export async function einlassUmschalten(formular: FormData): Promise<void> {
  await adminSchutz();

  const gastId = String(formular.get("gastId") ?? "");
  const feld = String(formular.get("feld") ?? "");
  const an = String(formular.get("an") ?? "") === "1";

  const spalte =
    feld === "checkin" ? "eingecheckt_am" : feld === "pin" ? "pin_ausgegeben_am" : null;
  if (!spalte || !gastId) return;

  await db()
    .from("gaeste")
    .update({ [spalte]: an ? new Date().toISOString() : null })
    .eq("id", gastId);

  revalidatePath("/admin/einlass");
}

// ---------------------------------------------------------------------------
// Einstellungen
// ---------------------------------------------------------------------------
export async function einstellungenSpeichern(
  _vorher: Zustand,
  formular: FormData,
): Promise<Zustand> {
  await adminSchutz();

  const zeilen: { key: string; wert: unknown; aktualisiert_am: string }[] = [];
  const jetzt = new Date().toISOString();

  for (const schluessel of Object.keys(STANDARD) as (keyof Einstellungen)[]) {
    if (!formular.has(schluessel) && typeof STANDARD[schluessel] !== "boolean") continue;

    const roh = String(formular.get(schluessel) ?? "");
    const vorgabe = STANDARD[schluessel];
    let wert: unknown;

    if (typeof vorgabe === "boolean") {
      wert = formular.get(schluessel) === "an";
    } else if (typeof vorgabe === "number") {
      const zahl = Number(roh);
      if (!Number.isFinite(zahl) || zahl < 0) {
        return { ok: false, meldung: `„${schluessel}“ braucht eine Zahl.` };
      }
      wert = Math.floor(zahl);
    } else {
      wert = roh.trim();
    }

    zeilen.push({ key: schluessel, wert, aktualisiert_am: jetzt });
  }

  const { error } = await db().from("einstellungen").upsert(zeilen, { onConflict: "key" });
  if (error) return { ok: false, meldung: `Speichern ging schief: ${error.message}` };

  alleNeuLaden();
  return { ok: true, meldung: "Gespeichert. Wirkt sofort auf der ganzen Seite." };
}

/** Notaus: schliesst die Reservierung komplett. */
export async function reservierungUmschalten(formular: FormData): Promise<void> {
  await adminSchutz();
  const an = String(formular.get("an") ?? "") === "1";

  await db()
    .from("einstellungen")
    .upsert(
      { key: "reservierung_offen", wert: an, aktualisiert_am: new Date().toISOString() },
      { onConflict: "key" },
    );

  alleNeuLaden();
}
