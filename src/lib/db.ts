import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Einziger Zugriffsweg auf die Datenbank – und zwar ausschliesslich vom Server.
 *
 * Wir arbeiten bewusst mit dem Service-Role-Key statt mit dem anon-Key: In der
 * Datenbank ist RLS ohne jede Policy aktiv, also kommt ein versehentlich
 * geleakter anon-Key an keine einzige Zeile. Dafuer muss jede Abfrage hier
 * durch – und jede Abfrage entscheidet selbst, welche Felder sie herausgibt.
 */

let client: SupabaseClient | null = null;

export function dbKonfiguriert(): boolean {
  return env("SUPABASE_URL") !== undefined && env("SUPABASE_SERVICE_ROLE_KEY") !== undefined;
}

export function db(): SupabaseClient {
  if (client) return client;

  // Ohne /rest/v1 am Ende – genau das steht im Dashboard und wird gern
  // mitkopiert. Die Bibliothek haengt den Pfad selbst an.
  const url = env("SUPABASE_URL")?.replace(/\/+(rest\/v1\/?)?$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY fehlen. Siehe .env.example.",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-anwendung": "wiesnauftakt" } },
  });
  return client;
}

/** Fehlercodes, die unsere plpgsql-Funktionen werfen (Format: CODE|arg|arg). */
export type DbFehler =
  | "RESERVIERUNG_GESCHLOSSEN"
  | "BUCHUNGSSCHLUSS"
  | "TISCH_UNBEKANNT"
  | "TISCH_NICHT_BUCHBAR"
  | "TISCH_VOLL"
  | "GESAMT_OBERGRENZE"
  | "MINDESTALTER"
  | "KEINE_PERSONEN"
  | "RESERVIERUNG_UNBEKANNT"
  | "RESERVIERUNG_NICHT_AENDERBAR"
  | "GAST_UNBEKANNT"
  | "UNBEKANNT";

export function fehlerLesen(nachricht: string | undefined): {
  code: DbFehler;
  args: string[];
} {
  const text = nachricht ?? "";
  const treffer = text.match(
    /(RESERVIERUNG_GESCHLOSSEN|BUCHUNGSSCHLUSS|TISCH_UNBEKANNT|TISCH_NICHT_BUCHBAR|TISCH_VOLL|GESAMT_OBERGRENZE|MINDESTALTER|KEINE_PERSONEN|RESERVIERUNG_UNBEKANNT|RESERVIERUNG_NICHT_AENDERBAR|GAST_UNBEKANNT)(\|[^\s"]*)?/,
  );
  if (!treffer) return { code: "UNBEKANNT", args: [] };
  const args = (treffer[2] ?? "").split("|").filter(Boolean);
  return { code: treffer[1] as DbFehler, args };
}
