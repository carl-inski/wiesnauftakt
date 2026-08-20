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
    <div className={kompakt ? "" : "glas flex flex-col justify-between p-4 sm:p-5"}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Freie Plätze
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl">
          {gesamt === 0 ? (
            <span className="text-lg font-medium text-white/60">noch keine</span>
          ) : (
            <>
              <span className={frei === 0 ? "text-rot-hell" : "text-gelb"}>{frei}</span>
              <span className="text-base font-medium text-white/40"> von {gesamt}</span>
            </>
          )}
        </p>
      </div>
      <div className="mt-3">

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
    </div>
  );
}
