import { Hinweis } from "@/components/Hinweis";
import { TischZeile } from "@/components/admin/TischZeile";
import { db, dbKonfiguriert } from "@/lib/db";
import { einstellungenLaden } from "@/lib/einstellungen";
import { saalLaden } from "@/lib/tische";

export const dynamic = "force-dynamic";

export default async function TischeSeite() {
  const [e, saal] = await Promise.all([einstellungenLaden(), saalLaden()]);

  // max_personen pro Tisch liegt nicht in der oeffentlichen Ansicht – hier
  // brauchen wir den Rohwert, um "leer = globaler Wert" abbilden zu koennen.
  const eigeneMax = new Map<string, number | null>();
  if (dbKonfiguriert()) {
    const { data } = await db().from("tische").select("id, max_personen");
    for (const z of (data ?? []) as { id: string; max_personen: number | null }[]) {
      eigeneMax.set(z.id, z.max_personen);
    }
  }

  const buchbar = saal.tische.filter((t) => t.status === "buchbar");

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Tische</h1>
      <p className="mt-1 text-sm leading-relaxed text-white/50">
        {buchbar.length} von {saal.tische.length} Tischen sind online. Ein freigeschalteter
        Tisch taucht sofort auf der öffentlichen Seite auf – kein Deploy nötig. Nicht
        freigeschaltete Tische stehen für die Gäste als „Freie Platzwahl ohne
        Reservierung“ im Plan.
      </p>

      <div className="mt-4">
        <Hinweis ton="neutral">
          Aktuell {saal.plaetzeBelegt} von {saal.plaetzeGesamt} Plätzen belegt. Wenn es eng
          wird, hier einfach den nächsten Tisch freischalten.
        </Hinweis>
      </div>

      <div className="mt-5 space-y-3">
        {saal.tische.map((t) => (
          <TischZeile
            key={t.id}
            id={t.id}
            nummer={t.nummer}
            status={t.status}
            name={t.name}
            internerTitel={t.internerTitel}
            belegt={t.belegt}
            max={t.max}
            maxEigen={eigeneMax.get(t.id) ?? null}
            vornamen={t.vornamen}
          />
        ))}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-white/35">
        Globaler Standardwert: {e.max_personen_pro_tisch} Personen pro Tisch. Änderbar
        unter Einstellungen.
      </p>
    </>
  );
}
