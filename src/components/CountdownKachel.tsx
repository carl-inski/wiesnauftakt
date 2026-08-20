import { Countdown } from "./Countdown";

/**
 * Eigene Kachel unter dem Belegungsbalken. Der Countdown stand vorher klein
 * in der Kopfzeile und ging dort unter.
 */
export function CountdownKachel({
  zielIso,
  datumText,
  einlassZeit,
}: {
  zielIso: string;
  datumText: string;
  einlassZeit: string;
}) {
  return (
    <div className="glas p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
        Countdown
      </p>
      <p className="mt-1 text-2xl font-semibold sm:text-3xl">
        <Countdown zielIso={zielIso} />
      </p>
      <p className="mt-2 border-t border-white/8 pt-2 text-sm text-white/50">
        {datumText} · ab {einlassZeit} Uhr
      </p>
    </div>
  );
}
