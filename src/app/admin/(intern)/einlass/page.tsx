import { Hinweis } from "@/components/Hinweis";
import { EinlassListe } from "@/components/admin/EinlassListe";
import { einstellungenLaden } from "@/lib/einstellungen";
import { gaesteListe } from "@/lib/gaeste";

export const dynamic = "force-dynamic";

export default async function EinlassSeite() {
  const [e, gaeste] = await Promise.all([
    einstellungenLaden(),
    gaesteListe(["bestaetigt", "angefragt"]),
  ]);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Einlass</h1>
      <p className="mt-1 text-sm leading-relaxed text-white/50">
        Name suchen, antippen, fertig. „Da“ zählt die Person, „Pin“ hakt den Trachtenpin
        ab. Nochmal tippen macht es rückgängig.
      </p>

      {gaeste.length === 0 ? (
        <div className="mt-5">
          <Hinweis ton="neutral">Noch niemand angemeldet.</Hinweis>
        </div>
      ) : (
        <EinlassListe
          mindestalter={e.mindestalter}
          gaeste={gaeste.map((g) => ({
            id: g.id,
            vorname: g.vorname,
            nachname: g.nachname,
            alterJahre: g.alterJahre,
            tischNummer: g.tischNummer,
            tischName: g.tischName,
            status: g.status,
            eingecheckt: Boolean(g.eingechecktAm),
            pin: Boolean(g.pinAusgegebenAm),
          }))}
        />
      )}
    </>
  );
}
