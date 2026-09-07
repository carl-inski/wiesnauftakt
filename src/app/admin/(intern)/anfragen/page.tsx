import { AnfrageKarte } from "@/components/admin/AnfrageKarte";
import { Hinweis } from "@/components/Hinweis";
import { einstellungenLaden } from "@/lib/einstellungen";
import { zeitpunktKurz } from "@/lib/format";
import { alleReservierungen, type Reservierung } from "@/lib/reservierung";
import { saalLaden } from "@/lib/tische";

export const dynamic = "force-dynamic";

/**
 * Offene Anfragen nach Tisch gruppiert. Mehrere Gruppen duerfen denselben Tisch
 * anfragen – nebeneinander gestellt lassen sie sich vergleichen, statt einzeln
 * in einer langen Liste unterzugehen.
 */
function nachTisch(offene: Reservierung[]) {
  const gruppen = new Map<string, { nummer: number; anfragen: Reservierung[] }>();
  for (const r of offene) {
    const eintrag = gruppen.get(r.tischId) ?? { nummer: r.tischNummer, anfragen: [] };
    eintrag.anfragen.push(r);
    gruppen.set(r.tischId, eintrag);
  }
  return [...gruppen.entries()]
    .map(([tischId, g]) => ({ tischId, ...g }))
    .sort((a, b) => a.nummer - b.nummer);
}

export default async function AnfragenSeite() {
  const [e, saal, offene, entschieden] = await Promise.all([
    einstellungenLaden(),
    saalLaden(),
    alleReservierungen(["angefragt"]),
    alleReservierungen(["bestaetigt", "abgelehnt", "storniert"]),
  ]);

  const gruppen = nachTisch(offene);
  const personenOffen = offene.reduce((s, r) => s + r.personen.length, 0);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Anfragen</h1>
      <p className="mt-1 text-sm text-white/50">
        Ein Platz ist erst mit der Bestätigung vergeben. Bis dahin sehen die Gäste
        weder den Tischnamen noch, wer sonst angefragt hat.
      </p>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/45">
          Warten auf Entscheidung ({offene.length}
          {offene.length > 0 && ` · ${personenOffen} Personen`})
        </h2>

        {gruppen.length === 0 ? (
          <Hinweis ton="gruen">Nichts offen. Alles durch.</Hinweis>
        ) : (
          <div className="space-y-8">
            {gruppen.map((g) => {
              const tisch = saal.tische.find((t) => t.id === g.tischId);
              const wollen = g.anfragen.reduce((s, r) => s + r.personen.length, 0);
              const frei = tisch?.frei ?? e.max_personen_pro_tisch;
              const konkurrenz = g.anfragen.length > 1;

              return (
                <div key={g.tischId}>
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-lg font-semibold">Tisch {g.nummer}</h3>
                    <p className="text-sm text-white/50">
                      {tisch?.belegt ? `${tisch.belegt} vergeben, ` : ""}
                      {frei} {frei === 1 ? "Platz" : "Plätze"} frei ·{" "}
                      {g.anfragen.length === 1
                        ? "1 Anfrage"
                        : `${g.anfragen.length} Anfragen`}{" "}
                      über {wollen} {wollen === 1 ? "Person" : "Personen"}
                    </p>
                    {konkurrenz && wollen > frei && (
                      <span className="rounded-full bg-gelb/15 px-2.5 py-0.5 text-xs font-semibold text-gelb ring-1 ring-inset ring-gelb/30">
                        mehr Anfragen als Plätze
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    {g.anfragen.map((r) => (
                      <AnfrageKarte
                        key={r.id}
                        id={r.id}
                        tischNummer={r.tischNummer}
                        tischName={r.tischName}
                        tischNameWunsch={r.tischNameWunsch}
                        hinweisGast={r.hinweisGast}
                        email={r.email}
                        telefon={r.telefon}
                        erstelltAm={`${zeitpunktKurz(r.erstelltAm)} Uhr`}
                        personen={r.personen}
                        notiz={r.notizIntern}
                        mindestalter={e.mindestalter}
                        status={r.status}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {entschieden.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/45">
            Schon entschieden ({entschieden.length})
          </h2>
          <div className="glas divide-y divide-white/8">
            {entschieden.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    Tisch {r.tischNummer} · {r.tischName ?? r.tischNameWunsch ?? "ohne Namen"}
                  </p>
                  <p className="text-xs text-white/45">
                    {r.personen.map((p) => p.vorname).join(", ")}
                    {r.telefon ? ` · ${r.telefon}` : ""}
                  </p>
                  {r.hinweisGast && (
                    <p className="mt-1 text-xs text-orange-hell">
                      Nachricht an die Gruppe: {r.hinweisGast}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                    r.status === "bestaetigt"
                      ? "bg-gruen/15 text-gruen-hell ring-gruen/30"
                      : r.status === "abgelehnt"
                        ? "bg-rot/15 text-rot-hell ring-rot/30"
                        : "bg-white/8 text-white/55 ring-white/15"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
