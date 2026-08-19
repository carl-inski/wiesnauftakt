import Link from "next/link";
import { FUELLSTAND_TEXT } from "@/lib/tisch-typen";
import type { PlanTisch } from "./Saalplan";

const PILLE: Record<string, string> = {
  leer: "bg-gruen/15 text-gruen-hell ring-gruen/30",
  fuellt_sich: "bg-gruen/15 text-gruen-hell ring-gruen/30",
  gut_belegt: "bg-orange/15 text-orange-hell ring-orange/30",
  voll: "bg-rot/15 text-rot-hell ring-rot/30",
};

export function Tischkarte({
  tisch,
  gewaehlt,
  onWaehlen,
  buchungOffen,
}: {
  tisch: PlanTisch;
  gewaehlt?: boolean;
  onWaehlen?: () => void;
  buchungOffen: boolean;
}) {
  const buchbar = tisch.status === "buchbar";
  const leer = tisch.belegt === 0;
  const voll = tisch.frei === 0;

  return (
    <div
      id={`karte-${tisch.id}`}
      onClick={buchbar ? onWaehlen : undefined}
      className={[
        "glas scroll-mt-24 p-4 transition-[border-color,background] duration-200",
        buchbar ? "cursor-pointer" : "opacity-55",
        gewaehlt ? "border-gelb/60 bg-white/[0.09]" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/45">
            Tisch {tisch.nummer}
          </p>
          <p className="mt-0.5 truncate text-lg font-semibold">
            {tisch.status === "intern"
              ? (tisch.internerTitel ?? "Fest vergeben")
              : tisch.status === "gesperrt"
                ? "Noch nicht offen"
                : (tisch.name ?? "Noch frei")}
          </p>
        </div>

        {buchbar && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${PILLE[tisch.fuellstand]}`}
          >
            {tisch.belegt}/{tisch.max}
          </span>
        )}
      </div>

      {buchbar ? (
        <>
          <p className="mt-2 text-sm text-white/60">
            {leer ? "Noch keiner da – eröffne den Tisch." : FUELLSTAND_TEXT[tisch.fuellstand]}
            {!leer && !voll && (
              <span className="text-white/45">
                {" "}· noch {tisch.frei} {tisch.frei === 1 ? "Platz" : "Plätze"}
              </span>
            )}
          </p>

          {tisch.vornamen.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {tisch.vornamen.map((name, i) => (
                <li
                  key={`${name}-${i}`}
                  className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-white/70 ring-1 ring-inset ring-white/10"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}

          {buchungOffen ? (
            <Link
              href={`/tisch/${tisch.id}`}
              onClick={(e) => e.stopPropagation()}
              aria-disabled={voll}
              tabIndex={voll ? -1 : undefined}
              className={[
                "mt-4 flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition",
                voll
                  ? "pointer-events-none bg-white/6 text-white/35"
                  : leer
                    ? "bg-rot text-white hover:bg-rot/85"
                    : "glas-knopf text-white",
              ].join(" ")}
            >
              {voll ? "Tisch ist voll" : leer ? "Tisch eröffnen" : "Dazusetzen"}
            </Link>
          ) : (
            <p className="mt-4 text-sm text-white/40">Reservierung geschlossen</p>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-white/45">
          {tisch.status === "intern"
            ? "Dieser Tisch ist fest vergeben."
            : "Diesen Tisch schalten wir vielleicht noch frei."}
        </p>
      )}
    </div>
  );
}
