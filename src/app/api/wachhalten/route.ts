import type { NextRequest } from "next/server";
import { db, dbKonfiguriert } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Haelt die Supabase-Datenbank wach.
 *
 * Projekte im kostenlosen Tarif werden pausiert, wenn sie ueber sieben Tage zu
 * wenig Aktivitaet sehen – laut Supabase-Doku reichen "a few user requests to
 * the database each day" zum Wachbleiben. Fuer eine Seite, deren Link wochenlang
 * in einem Gruppenchat liegt und dann ploetzlich angeklickt wird, ist das ein
 * echtes Risiko: eine ruhige Woche im August, und der Link ist tot.
 *
 * Deshalb einmal taeglich ein paar guenstige Abfragen. Ausgeloest von Vercel
 * Cron (siehe vercel.json), abgesichert ueber CRON_SECRET.
 */
export async function GET(anfrage: NextRequest) {
  const geheimnis = env("CRON_SECRET");

  // Vercel schickt bei gesetztem CRON_SECRET automatisch diesen Header mit.
  if (geheimnis && anfrage.headers.get("authorization") !== `Bearer ${geheimnis}`) {
    return new Response("Nicht berechtigt", { status: 401 });
  }

  if (!dbKonfiguriert()) {
    return Response.json({ ok: false, grund: "keine Datenbank konfiguriert" }, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const start = Date.now();

  try {
    // Zwei winzige Abfragen statt einer: Supabase spricht von "a few requests",
    // und beides zusammen kostet weniger als ein einzelner Seitenaufruf.
    const [tische, personen] = await Promise.all([
      db().from("tische").select("id", { count: "exact", head: true }),
      db().from("gaeste").select("id", { count: "exact", head: true }),
    ]);

    if (tische.error || personen.error) {
      const fehler = tische.error?.message ?? personen.error?.message;
      console.error("[wachhalten] Abfrage fehlgeschlagen:", fehler);
      return Response.json({ ok: false, fehler }, { status: 500 });
    }

    return Response.json(
      {
        ok: true,
        tische: tische.count ?? 0,
        personen: personen.count ?? 0,
        dauerMs: Date.now() - start,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const fehler = e instanceof Error ? e.message : String(e);
    console.error("[wachhalten] Fehler:", fehler);
    return Response.json({ ok: false, fehler }, { status: 500 });
  }
}
