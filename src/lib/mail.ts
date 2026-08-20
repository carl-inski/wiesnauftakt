import "server-only";
import { Resend } from "resend";
import { db, dbKonfiguriert } from "./db";
import { einstellungenLaden } from "./einstellungen";
import { env, envOder } from "./env";
import { datumLang, zeitpunktKurz } from "./format";
import type { Reservierung } from "./reservierung";
import { basisUrl } from "./urls";

/**
 * Mail geht nur noch in eine Richtung: an das Orgateam, wenn eine neue Anfrage
 * eintrudelt. Gaeste bekommen keine Mail – sie geben auch keine Adresse mehr an.
 * Ihren Weg zurueck zur Reservierung kennen der Browser und der persoenliche
 * Link.
 *
 * Faellt der Versand aus, bricht deswegen nichts ab: Die Reservierung steht in
 * der Datenbank und im Orgabereich, die Mail ist nur die Benachrichtigung.
 */

const ABSENDER = envOder("MAIL_ABSENDER", "Wiesnauftakt <onboarding@resend.dev>");
const EMPFAENGER = envOder("ADMIN_MAIL_EMPFAENGER", "carldob.acc@gmail.com");

const FARBE = {
  flaeche: "#1a1d24",
  kante: "#2c313c",
  text: "#ffffff",
  gedimmt: "#a8adb8",
  rot: "#e4322b",
  gelb: "#ffc61e",
};

export function mailAktiv(): boolean {
  return env("RESEND_API_KEY") !== undefined;
}

function resend(): Resend | null {
  const key = env("RESEND_API_KEY");
  return key ? new Resend(key) : null;
}

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function senden(opts: {
  an: string;
  betreff: string;
  html: string;
  text: string;
  art: string;
  reservierungId?: string;
}): Promise<boolean> {
  const klient = resend();
  let erfolgreich = false;
  let fehler: string | null = null;

  if (!klient) {
    fehler = "RESEND_API_KEY nicht gesetzt";
    console.warn(`[mail] ${opts.art} an ${opts.an} nicht versendet: ${fehler}`);
  } else {
    try {
      const antwort = await klient.emails.send({
        from: ABSENDER,
        to: opts.an,
        subject: opts.betreff,
        html: opts.html,
        text: opts.text,
      });
      if (antwort.error) fehler = antwort.error.message;
      else erfolgreich = true;
    } catch (e) {
      fehler = e instanceof Error ? e.message : String(e);
    }
  }

  if (fehler) console.error(`[mail] ${opts.art}: ${fehler}`);

  if (dbKonfiguriert()) {
    await db()
      .from("mail_log")
      .insert({
        empfaenger: opts.an,
        art: opts.art,
        reservierung_id: opts.reservierungId ?? null,
        erfolgreich,
        fehler,
      })
      .then(undefined, () => undefined);
  }

  return erfolgreich;
}

/** Benachrichtigung ans Orgateam: Es liegt eine neue Anfrage vor. */
export async function mailNeueAnfrage(r: Reservierung): Promise<boolean> {
  const e = await einstellungenLaden();
  const tischTitel = r.tischName
    ? `„${r.tischName}“ (Tisch ${r.tischNummer})`
    : `Tisch ${r.tischNummer}`;

  const personen = r.personen
    .map((p) => `${p.vorname} ${p.nachname} (${p.alterJahre})`)
    .join(", ");

  const adminUrl = `${basisUrl()}/admin/anfragen`;

  const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#101217;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${FARBE.flaeche};border:1px solid ${FARBE.kante};border-radius:16px;">
<tr><td style="padding:24px;color:${FARBE.text};font-size:15px;line-height:1.6;">
  <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${FARBE.gelb};font-weight:700;">Neue Anfrage</div>
  <h1 style="margin:8px 0 4px 0;font-size:21px;">${escape(tischTitel)}</h1>
  <p style="margin:0 0 18px 0;color:${FARBE.gedimmt};font-size:14px;">
    ${r.personen.length === 1 ? "1 Person" : `${r.personen.length} Personen`} ·
    ${escape(zeitpunktKurz(r.erstelltAm))} Uhr
  </p>

  <div style="padding:14px 16px;background:rgba(255,255,255,0.05);border:1px solid ${FARBE.kante};border-radius:12px;font-size:14px;">
    ${escape(personen)}
  </div>

  ${
    r.telefon
      ? `<p style="margin:14px 0 0 0;font-size:14px;">Handy: <a href="tel:${escape(r.telefon)}" style="color:${FARBE.gelb};">${escape(r.telefon)}</a></p>`
      : `<p style="margin:14px 0 0 0;font-size:14px;color:${FARBE.gedimmt};">Keine Handynummer angegeben.</p>`
  }

  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px 0;"><tr>
  <td style="border-radius:999px;background:${FARBE.rot};">
    <a href="${escape(adminUrl)}" style="display:inline-block;padding:12px 24px;font-weight:700;font-size:15px;color:#fff;text-decoration:none;border-radius:999px;">Im Orgabereich ansehen</a>
  </td></tr></table>

  <p style="margin:18px 0 0 0;font-size:12px;color:${FARBE.gedimmt};">
    ${escape(datumLang(e.event_datum))} · Einlass ab ${escape(e.einlass_zeit)} Uhr
  </p>
</td></tr></table>
</td></tr></table></body></html>`;

  const text = `Neue Anfrage – ${tischTitel}

${r.personen.length === 1 ? "1 Person" : `${r.personen.length} Personen`}: ${personen}
Eingegangen: ${zeitpunktKurz(r.erstelltAm)} Uhr
Handy: ${r.telefon ?? "nicht angegeben"}

Im Orgabereich ansehen:
${adminUrl}`;

  return senden({
    an: EMPFAENGER,
    betreff: `Neue Anfrage: ${tischTitel} (${r.personen.length})`,
    html,
    text,
    art: "neue_anfrage",
    reservierungId: r.id,
  });
}

export { basisUrl };
