import { AnfrageKarte } from "@/components/admin/AnfrageKarte";
import { Hinweis } from "@/components/Hinweis";
import { einstellungenLaden } from "@/lib/einstellungen";
import { zeitpunktKurz } from "@/lib/format";
import { alleReservierungen } from "@/lib/reservierung";

export const dynamic = "force-dynamic";

export default async function AnfragenSeite() {
  const [e, offene, entschieden] = await Promise.all([
    einstellungenLaden(),
    alleReservierungen(["angefragt"]),
    alleReservierungen(["bestaetigt", "abgelehnt", "storniert"]),
  ]);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Anfragen</h1>
      <p className="mt-1 text-sm text-white/50">
        Bestätigen oder Ablehnen schickt jeweils sofort eine Mail an die buchende Person.
      </p>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/45">
          Warten auf Entscheidung ({offene.length})
        </h2>

        {offene.length === 0 ? (
          <Hinweis ton="gruen">Nichts offen. Alles durch.</Hinweis>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {offene.map((r) => (
              <AnfrageKarte
                key={r.id}
                id={r.id}
                tischNummer={r.tischNummer}
                tischName={r.tischName}
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
                    Tisch {r.tischNummer} · {r.tischName ?? "ohne Namen"}
                  </p>
                  <p className="text-xs text-white/45">
                    {r.personen.map((p) => p.vorname).join(", ")} · {r.email}
                  </p>
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
