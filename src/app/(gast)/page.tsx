import { Belegungsbalken } from "@/components/Belegungsbalken";
import { CountdownKachel } from "@/components/CountdownKachel";
import { Hinweis } from "@/components/Hinweis";
import { Saalansicht } from "@/components/Saalansicht";
import { buchungOffen, einlassZeitpunkt, einstellungenLaden } from "@/lib/einstellungen";
import { datumLang } from "@/lib/format";
import { PLAN } from "@/lib/plan";
import { saalLaden } from "@/lib/tische";

export const dynamic = "force-dynamic";

export default async function Saalseite() {
  const [e, saal] = await Promise.all([einstellungenLaden(), saalLaden()]);
  const offen = buchungOffen(e);

  return (
    <main id="inhalt" className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 sm:pt-6">
      <h1 className="marke mb-4 text-4xl sm:text-5xl">Der Saal</h1>

      <div className="mb-3">
        <Belegungsbalken gesamt={saal.plaetzeGesamt} belegt={saal.plaetzeBelegt} />
      </div>

      <div className="mb-4">
        <CountdownKachel
          zielIso={einlassZeitpunkt(e).toISOString()}
          datumText={datumLang(e.event_datum)}
          einlassZeit={e.einlass_zeit}
        />
      </div>

      {e.hinweis_startseite.trim() !== "" && (
        <div className="mb-4">
          <Hinweis ton="gelb">{e.hinweis_startseite}</Hinweis>
        </div>
      )}

      {!offen && (
        <div className="mb-4">
          <Hinweis ton="rot" titel="Die Reservierung ist zu">
            {e.reservierung_offen
              ? "Der Buchungsschluss ist durch. Meld dich direkt bei uns, vielleicht geht noch was."
              : "Gerade nehmen wir keine Reservierungen an."}
          </Hinweis>
        </div>
      )}

      <Saalansicht
        tische={saal.tische}
        viewBox={PLAN.viewBox}
        huelle={PLAN.huelle}
        buchungOffen={offen}
      />
    </main>
  );
}
