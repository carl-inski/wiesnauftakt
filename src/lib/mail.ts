import "server-only";
import { Resend } from "resend";
import { db, dbKonfiguriert } from "./db";
import { env, envOder } from "./env";
import { einlassZeitpunkt, einstellungenLaden } from "./einstellungen";
import { aufzaehlung, datumLang } from "./format";
import type { Reservierung } from "./reservierung";
import { basisUrl, tischUrl, verwaltungsUrl } from "./urls";

/**
 * Versand ueber Resend mit eigener Absenderdomain. Faellt der Versand aus,
 * bricht deswegen keine Reservierung ab – der Verwaltungslink steht ohnehin
 * direkt auf der Bestaetigungsseite zum Kopieren.
 */

const ABSENDER = envOder("MAIL_ABSENDER", "Wiesnauftakt <wiesn@pfarrjugend-sjb.de>");

function resend(): Resend | null {
  const key = env("RESEND_API_KEY");
  return key ? new Resend(key) : null;
}

export type MailArt =
  | "anfrage_eingegangen"
  | "bestaetigt"
  | "abgelehnt"
  | "link_erneut";

const FARBE = {
  hintergrund: "#101625",
  flaeche: "#1a2133",
  kante: "#2b3448",
  text: "#ffffff",
  gedimmt: "#a8b0c2",
  rot: "#E4322B",
  gelb: "#FFC61E",
  gruen: "#1BA149",
};

function huelle(titel: string, inhalt: string): string {
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(titel)}</title></head>
<body style="margin:0;padding:0;background:${FARBE.hintergrund};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FARBE.hintergrund};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${FARBE.flaeche};border:1px solid ${FARBE.kante};border-radius:18px;overflow:hidden;">
<tr><td style="padding:28px 28px 8px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${FARBE.gelb};font-weight:700;">Wiesnauftakt · Pfarrjugend SJB</div>
</td></tr>
<tr><td style="padding:8px 28px 28px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${FARBE.text};font-size:16px;line-height:1.6;">
${inhalt}
</td></tr>
</table>
<div style="max-width:560px;margin-top:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${FARBE.gedimmt};line-height:1.5;">
Diese Mail kommt von der Pfarrjugend SJB. Fragen? Einfach auf diese Mail antworten.
</div>
</td></tr></table></body></html>`;
}

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function knopf(url: string, beschriftung: string, farbe = FARBE.rot): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr>
<td style="border-radius:999px;background:${farbe};">
<a href="${escape(url)}" style="display:inline-block;padding:13px 26px;font-weight:700;font-size:15px;color:#fff;text-decoration:none;border-radius:999px;">${escape(beschriftung)}</a>
</td></tr></table>`;
}

function kasten(inhalt: string, akzent = FARBE.kante): string {
  return `<div style="margin:18px 0;padding:14px 16px;background:rgba(255,255,255,0.05);border:1px solid ${akzent};border-left:3px solid ${akzent};border-radius:12px;font-size:15px;line-height:1.55;">${inhalt}</div>`;
}

function linkZeile(url: string): string {
  return `<div style="word-break:break-all;font-size:13px;color:${FARBE.gedimmt};">${escape(url)}</div>`;
}

// -----------------------------------------------------------------------------
// Kalendereintrag
// -----------------------------------------------------------------------------
function icsErzeugen(opts: {
  start: Date;
  titel: string;
  ort: string;
  beschreibung: string;
  uid: string;
}): string {
  const stempel = (d: Date) =>
    `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
  const ende = new Date(opts.start.getTime() + 6 * 60 * 60 * 1000);
  const falten = (s: string) => s.replace(/\r?\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pfarrjugend SJB//Wiesnauftakt//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${stempel(new Date())}`,
    `DTSTART:${stempel(opts.start)}`,
    `DTEND:${stempel(ende)}`,
    `SUMMARY:${falten(opts.titel)}`,
    `LOCATION:${falten(opts.ort)}`,
    `DESCRIPTION:${falten(opts.beschreibung)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// -----------------------------------------------------------------------------
// Versand
// -----------------------------------------------------------------------------
type Anhang = { filename: string; content: string };

async function senden(opts: {
  an: string;
  betreff: string;
  html: string;
  text: string;
  art: MailArt;
  reservierungId?: string;
  anhaenge?: Anhang[];
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
        ...(opts.anhaenge?.length ? { attachments: opts.anhaenge } : {}),
      });
      if (antwort.error) fehler = antwort.error.message;
      else erfolgreich = true;
    } catch (e) {
      fehler = e instanceof Error ? e.message : String(e);
    }
  }

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

// -----------------------------------------------------------------------------
// Vorlagen
// -----------------------------------------------------------------------------
export async function mailAnfrageEingegangen(r: Reservierung): Promise<boolean> {
  const e = await einstellungenLaden();
  const namen = aufzaehlung(r.personen.map((p) => p.vorname));
  const vUrl = verwaltungsUrl(r.token);
  const tUrl = tischUrl(r.tischId);
  const tischTitel = r.tischName ? `„${r.tischName}“ (Tisch ${r.tischNummer})` : `Tisch ${r.tischNummer}`;

  const html = huelle(
    "Deine Anfrage ist da",
    `<h1 style="margin:0 0 8px 0;font-size:24px;line-height:1.25;">Servus ${escape(r.personen[0]?.vorname ?? "")}, deine Anfrage ist da.</h1>
<p style="margin:0 0 4px 0;color:${FARBE.gedimmt};">${escape(tischTitel)} · ${r.personen.length === 1 ? "1 Person" : `${r.personen.length} Personen`}: ${escape(namen)}</p>

${kasten(
  `<strong style="color:${FARBE.gelb};">Das ist noch keine Zusage.</strong><br>
   Wir schauen jede Anfrage einmal an und bestätigen sie von Hand. Sobald das passiert ist, bekommst du eine zweite Mail. Erst die zählt.`,
  FARBE.gelb,
)}

<p style="margin:0 0 4px 0;"><strong>Dein Verwaltungslink</strong> – damit kannst du jederzeit Namen nachtragen, korrigieren oder absagen:</p>
${knopf(vUrl, "Reservierung öffnen")}
${linkZeile(vUrl)}

<p style="margin:22px 0 4px 0;"><strong>Link für die Gruppe</strong> – wer sich noch dazusetzen will, klickt hier:</p>
${linkZeile(tUrl)}

<p style="margin:22px 0 0 0;color:${FARBE.gedimmt};font-size:14px;">
${escape(datumLang(e.event_datum))} · Einlass ab ${escape(e.einlass_zeit)} Uhr · ${escape(e.ort_name)}<br>
Wir halten eure Plätze bis ${escape(e.verfall_zeit)} Uhr frei. Danach geben wir den Tisch weiter.<br>
Jede angemeldete Person bekommt am Einlass ihren SJB-Trachtenpin.
</p>`,
  );

  const text = `Servus ${r.personen[0]?.vorname ?? ""},

deine Anfrage für ${tischTitel} ist bei uns eingegangen.
Personen: ${namen}

WICHTIG: Das ist noch keine Zusage. Wir bestätigen jede Anfrage von Hand.
Sobald das passiert ist, bekommst du eine zweite Mail.

Deine Reservierung verwalten (Namen nachtragen, korrigieren, absagen):
${vUrl}

Link für die Gruppe (wer sich dazusetzen will):
${tUrl}

${datumLang(e.event_datum)}, Einlass ab ${e.einlass_zeit} Uhr, ${e.ort_name}
Wir halten eure Plätze bis ${e.verfall_zeit} Uhr frei.
Jede angemeldete Person bekommt am Einlass ihren SJB-Trachtenpin.`;

  return senden({
    an: r.email,
    betreff: `Anfrage eingegangen – ${tischTitel}`,
    html,
    text,
    art: "anfrage_eingegangen",
    reservierungId: r.id,
  });
}

export async function mailBestaetigt(r: Reservierung): Promise<boolean> {
  const e = await einstellungenLaden();
  const namen = r.personen.map((p) => p.vorname).join(", ");
  const vUrl = verwaltungsUrl(r.token);
  const tischTitel = r.tischName ? `„${r.tischName}“ (Tisch ${r.tischNummer})` : `Tisch ${r.tischNummer}`;
  const start = einlassZeitpunkt(e);

  const ics = icsErzeugen({
    start,
    titel: "Wiesnauftakt der Pfarrjugend SJB",
    ort: `${e.ort_name}, ${e.ort_adresse}`,
    beschreibung: `${tischTitel}. Einlass ab ${e.einlass_zeit} Uhr. Wir halten euren Tisch bis ${e.verfall_zeit} Uhr frei.\n\nReservierung verwalten: ${vUrl}`,
    uid: `wiesnauftakt-${r.id}@pfarrjugend-sjb.de`,
  });

  const html = huelle(
    "Passt, ihr seid dabei",
    `<h1 style="margin:0 0 8px 0;font-size:24px;line-height:1.25;">Passt – ihr seid dabei.</h1>
<p style="margin:0 0 16px 0;color:${FARBE.gedimmt};">Wir haben eure Reservierung bestätigt. Freuen uns auf euch.</p>

${kasten(
  `<div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${FARBE.gedimmt};margin-bottom:6px;">Euer Tisch</div>
   <div style="font-size:21px;font-weight:700;">${escape(tischTitel)}</div>
   <div style="margin-top:10px;color:${FARBE.gedimmt};">${r.personen.length === 1 ? "1 Person" : `${r.personen.length} Personen`}: ${escape(namen)}</div>`,
  FARBE.gruen,
)}

<p style="margin:0 0 6px 0;"><strong>${escape(datumLang(e.event_datum))}</strong><br>
Einlass ab ${escape(e.einlass_zeit)} Uhr · ${escape(e.ort_name)}, ${escape(e.ort_adresse)}</p>

${kasten(
  `<strong style="color:${FARBE.gelb};">Bitte merken:</strong> Wir halten euren Tisch bis <strong>${escape(e.verfall_zeit)} Uhr</strong> frei. Wer später kommt, findet den Tisch möglicherweise besetzt – sagt uns lieber kurz Bescheid, wenn es später wird.`,
  FARBE.gelb,
)}

<p style="margin:0 0 16px 0;">Jede Person auf dieser Liste bekommt am Einlass ihren <strong>SJB-Trachtenpin</strong>. Nicht einer pro Tisch – einer pro Person.</p>

<p style="margin:0 0 4px 0;">Etwas ändern oder doch absagen? Kein Problem:</p>
${knopf(vUrl, "Reservierung öffnen", FARBE.gruen)}
${linkZeile(vUrl)}`,
  );

  const text = `Passt – ihr seid dabei.

${tischTitel}
${r.personen.length === 1 ? "1 Person" : `${r.personen.length} Personen`}: ${namen}

${datumLang(e.event_datum)}
Einlass ab ${e.einlass_zeit} Uhr, ${e.ort_name}, ${e.ort_adresse}

BITTE MERKEN: Wir halten euren Tisch bis ${e.verfall_zeit} Uhr frei.
Danach können wir ihn weitergeben.

Jede Person auf der Liste bekommt am Einlass ihren SJB-Trachtenpin.

Reservierung ändern oder absagen:
${vUrl}`;

  return senden({
    an: r.email,
    betreff: `Bestätigt – ${tischTitel} beim Wiesnauftakt`,
    html,
    text,
    art: "bestaetigt",
    reservierungId: r.id,
    anhaenge: [
      {
        filename: "wiesnauftakt.ics",
        content: Buffer.from(ics, "utf-8").toString("base64"),
      },
    ],
  });
}

export async function mailAbgelehnt(r: Reservierung, grund?: string): Promise<boolean> {
  const e = await einstellungenLaden();
  const tischTitel = r.tischName ? `„${r.tischName}“ (Tisch ${r.tischNummer})` : `Tisch ${r.tischNummer}`;

  const html = huelle(
    "Zu deiner Anfrage",
    `<h1 style="margin:0 0 8px 0;font-size:24px;line-height:1.25;">Das klappt leider nicht.</h1>
<p style="margin:0 0 16px 0;color:${FARBE.gedimmt};">Deine Anfrage für ${escape(tischTitel)} können wir nicht bestätigen.</p>
${grund ? kasten(escape(grund), FARBE.rot) : ""}
<p style="margin:16px 0 0 0;">Wenn du glaubst, dass da ein Missverständnis vorliegt: Antworte einfach auf diese Mail oder meld dich bei uns. Wir finden meistens eine Lösung.</p>
<p style="margin:16px 0 0 0;color:${FARBE.gedimmt};font-size:14px;">${escape(e.kontakt_email)}</p>`,
  );

  const text = `Das klappt leider nicht.

Deine Anfrage für ${tischTitel} können wir nicht bestätigen.
${grund ? `\n${grund}\n` : ""}
Wenn du glaubst, dass da ein Missverständnis vorliegt: Antworte einfach auf
diese Mail oder meld dich bei uns. Wir finden meistens eine Lösung.

${e.kontakt_email}`;

  return senden({
    an: r.email,
    betreff: `Zu deiner Anfrage – ${tischTitel}`,
    html,
    text,
    art: "abgelehnt",
    reservierungId: r.id,
  });
}

export async function mailLinkErneut(
  email: string,
  reservierungen: Reservierung[],
): Promise<boolean> {
  const eintraege = reservierungen
    .map((r) => {
      const titel = r.tischName ? `„${r.tischName}“ (Tisch ${r.tischNummer})` : `Tisch ${r.tischNummer}`;
      const status = r.status === "bestaetigt" ? "bestätigt" : "Anfrage, noch nicht bestätigt";
      return kasten(
        `<strong>${escape(titel)}</strong> · ${escape(status)}<br>
         ${r.personen.length === 1 ? "1 Person" : `${r.personen.length} Personen`}<br>
         <a href="${escape(verwaltungsUrl(r.token))}" style="color:${FARBE.gelb};">Reservierung öffnen</a><br>
         ${linkZeile(verwaltungsUrl(r.token))}`,
      );
    })
    .join("");

  const html = huelle(
    "Deine Reservierung",
    `<h1 style="margin:0 0 8px 0;font-size:24px;line-height:1.25;">Da ist dein Link.</h1>
<p style="margin:0 0 16px 0;color:${FARBE.gedimmt};">Zu dieser Adresse haben wir Folgendes gefunden:</p>
${eintraege}
<p style="margin:16px 0 0 0;color:${FARBE.gedimmt};font-size:14px;">Speicher dir den Link am besten – zum Beispiel, indem du ihn dir selbst schickst.</p>`,
  );

  const text = `Da ist dein Link.

${reservierungen
  .map((r) => {
    const titel = r.tischName ? `"${r.tischName}" (Tisch ${r.tischNummer})` : `Tisch ${r.tischNummer}`;
    return `${titel} (${r.status === "bestaetigt" ? "bestätigt" : "noch nicht bestätigt"})\n${verwaltungsUrl(r.token)}`;
  })
  .join("\n\n")}

Speicher dir den Link am besten – zum Beispiel, indem du ihn dir selbst schickst.`;

  return senden({
    an: email,
    betreff: "Deine Reservierung beim Wiesnauftakt",
    html,
    text,
    art: "link_erneut",
    reservierungId: reservierungen[0]?.id,
  });
}

export { basisUrl };
