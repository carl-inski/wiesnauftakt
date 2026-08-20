import Link from "next/link";
import { Hinweis } from "@/components/Hinweis";
import { GastVerschieben } from "@/components/admin/GastVerschieben";
import { einstellungenLaden } from "@/lib/einstellungen";
import { gaesteFiltern, gaesteListe } from "@/lib/gaeste";
import { saalLaden } from "@/lib/tische";

export const dynamic = "force-dynamic";

type Eigenschaften = {
  searchParams: Promise<{ q?: string; minderjaehrig?: string }>;
};

export default async function GaesteSeite({ searchParams }: Eigenschaften) {
  const { q = "", minderjaehrig } = await searchParams;
  const nurMinderjaehrig = minderjaehrig === "1";

  const [e, alle, saal] = await Promise.all([
    einstellungenLaden(),
    gaesteListe(["angefragt", "bestaetigt"]),
    saalLaden(),
  ]);

  const gefiltert = gaesteFiltern(alle, q, nurMinderjaehrig, e.mindestalter);
  const minderjaehrigeGesamt = alle.filter((g) => g.alterJahre < e.mindestalter).length;

  const zieltische = saal.tische
    .filter((t) => t.status !== "gesperrt")
    .map((t) => ({ id: t.id, nummer: t.nummer, frei: t.frei, name: t.name }));

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gästeliste</h1>
          <p className="mt-1 text-sm text-white/50">
            {alle.length} {alle.length === 1 ? "Person" : "Personen"} angemeldet (inkl.
            offener Anfragen)
          </p>
        </div>
        <a
          href="/admin/export"
          className="glas-knopf rounded-full px-4 py-2 text-sm font-semibold text-white"
        >
          Als CSV exportieren
        </a>
      </div>

      <form className="mt-5 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="q">
          Suchen
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Name, Tisch oder Handynummer suchen"
          className="feld min-w-0 flex-1"
        />
        {nurMinderjaehrig && <input type="hidden" name="minderjaehrig" value="1" />}
        <button className="glas-knopf shrink-0 rounded-xl px-5 text-sm font-semibold text-white">
          Suchen
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/admin/gaeste${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          className={`rounded-full px-3.5 py-1.5 text-sm ring-1 ring-inset transition ${
            !nurMinderjaehrig
              ? "bg-white/12 text-white ring-white/25"
              : "text-white/55 ring-white/12 hover:text-white"
          }`}
        >
          Alle
        </Link>
        <Link
          href={`/admin/gaeste?minderjaehrig=1${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={`rounded-full px-3.5 py-1.5 text-sm ring-1 ring-inset transition ${
            nurMinderjaehrig
              ? "bg-rot/20 text-rot-hell ring-rot/40"
              : "text-white/55 ring-white/12 hover:text-white"
          }`}
        >
          Unter {e.mindestalter} ({minderjaehrigeGesamt})
        </Link>
      </div>

      {nurMinderjaehrig && (
        <div className="mt-4">
          <Hinweis ton="gelb" titel="Für die Ausweiskontrolle">
            Diese Personen sind laut Anmeldung unter {e.mindestalter}. Über die Seite kann
            das eigentlich niemand buchen – wer hier auftaucht, wurde von Hand eingetragen
            oder hat sich vertippt. Am Einlass bitte prüfen.
          </Hinweis>
        </div>
      )}

      <div className="glas mt-5 overflow-x-auto">
        {gefiltert.length === 0 ? (
          <p className="p-6 text-center text-sm text-white/45">
            {q || nurMinderjaehrig ? "Nichts gefunden." : "Noch keine Anmeldungen."}
          </p>
        ) : (
          <table className="w-full min-w-[38rem] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Alter</th>
                <th className="px-3 py-3 font-semibold">Tisch</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Kontakt</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {gefiltert.map((g) => (
                <tr key={g.id} className="align-middle">
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{g.nachname}</span>, {g.vorname}
                  </td>
                  <td
                    className={`px-3 py-2.5 tabular-nums ${
                      g.alterJahre < e.mindestalter ? "font-semibold text-rot-hell" : "text-white/55"
                    }`}
                  >
                    {g.alterJahre}
                  </td>
                  <td className="px-3 py-2.5 text-white/70">
                    {g.tischNummer}
                    {g.tischName && <span className="text-white/40"> · {g.tischName}</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        g.status === "bestaetigt" ? "text-gruen-hell" : "text-gelb"
                      }
                    >
                      {g.status === "bestaetigt" ? "bestätigt" : "offen"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-white/45">
                    {g.telefon ? (
                      <a href={`tel:${g.telefon}`} className="underline underline-offset-2">
                        {g.telefon}
                      </a>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <GastVerschieben
                      gastId={g.id}
                      aktuellerTisch={g.tischId}
                      tische={zieltische}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-4 text-xs text-white/35">
        {gefiltert.length} von {alle.length} angezeigt.
      </p>
    </>
  );
}
