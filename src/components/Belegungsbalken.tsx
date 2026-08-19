type Eigenschaften = {
  gesamt: number;
  belegt: number;
  kompakt?: boolean;
};

/**
 * Ehrliche Zahlen: gezaehlt werden die Plaetze auf den Tischen, die gerade
 * online freigeschaltet sind. Schalten wir einen Tisch nach, waechst der Nenner
 * mit – kein kuenstliches "nur noch 2 frei!".
 */
export function Belegungsbalken({ gesamt, belegt, kompakt = false }: Eigenschaften) {
  const frei = Math.max(0, gesamt - belegt);
  const anteil = gesamt > 0 ? Math.min(100, (belegt / gesamt) * 100) : 0;

  const farbe =
    anteil >= 100 ? "bg-rot" : anteil >= 80 ? "bg-orange" : "bg-gruen";

  return (
    <div className={kompakt ? "" : "glas p-4 sm:p-5"}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className={kompakt ? "text-sm font-medium" : "text-base font-semibold sm:text-lg"}>
          {gesamt === 0 ? (
            "Noch keine Tische freigeschaltet"
          ) : frei === 0 ? (
            <>Alle {gesamt} Plätze vergeben</>
          ) : (
            <>
              Noch <span className="text-gelb">{frei}</span> von {gesamt} Plätzen frei
            </>
          )}
        </p>
        {gesamt > 0 && (
          <p className="text-xs text-white/50 tabular-nums">
            {belegt} {belegt === 1 ? "Person" : "Personen"} angemeldet
          </p>
        )}
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={belegt}
        aria-valuemin={0}
        aria-valuemax={gesamt}
        aria-label={`${belegt} von ${gesamt} Plätzen belegt`}
      >
        <div
          className={`h-full rounded-full ${farbe} transition-[width] duration-300 ease-out`}
          style={{ width: `${anteil}%` }}
        />
      </div>
    </div>
  );
}
