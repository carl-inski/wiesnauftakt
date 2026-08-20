/**
 * Basisadresse der Seite. Einzige Quelle fuer alles, was absolute Links baut:
 * Mails, Teilenlinks, metadataBase.
 *
 * Die Funktion ist bewusst nachsichtig, weil NEXT_PUBLIC_SITE_URL von Hand in
 * die Vercel-Oberflaeche getippt wird. Eine leere, vergessene oder schief
 * eingetippte Variable darf niemals den Build umbringen – sie faellt hier auf
 * die Vercel-Adresse zurueck.
 */

function vonVercel(): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function basisUrl(): string {
  const roh = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  // Nicht gesetzt oder leer: Vercel weiss selbst, wie es heisst.
  if (!roh) return vonVercel();

  // "wiesnauftakt.vercel.app" ohne Schema ist ein haeufiger Vertipper.
  const mitSchema = /^https?:\/\//i.test(roh) ? roh : `https://${roh}`;
  const sauber = mitSchema.replace(/\/+$/, "");

  try {
    // Wirft bei allem, was keine brauchbare Adresse ist.
    new URL(sauber);
    return sauber;
  } catch {
    console.warn(
      `[urls] NEXT_PUBLIC_SITE_URL ist unbrauchbar: ${JSON.stringify(roh)} – ` +
        "es wird stattdessen die Vercel-Adresse verwendet.",
    );
    return vonVercel();
  }
}

export const verwaltungsUrl = (token: string) => `${basisUrl()}/reservierung/${token}`;
export const tischUrl = (tischId: string) => `${basisUrl()}/tisch/${tischId}`;
