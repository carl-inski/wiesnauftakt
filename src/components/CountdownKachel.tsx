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
    <div className="glas flex flex-col justify-between p-4 sm:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Countdown
        </p>
        <p className="mt-1 text-2xl font-semibold sm:text-3xl">
          <Countdown zielIso={zielIso} />
        </p>
      </div>
      <p className="mt-3 text-xs leading-snug text-white/45">
        {datumText.replace(/^\w+, /, "")}
        <br />
        ab {einlassZeit} Uhr
      </p>
    </div>
  );
}
