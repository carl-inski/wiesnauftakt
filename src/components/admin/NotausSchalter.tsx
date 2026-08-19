"use client";

import { useState } from "react";
import { reservierungUmschalten } from "@/app/admin/aktionen";
import { Hinweis } from "../Hinweis";

/**
 * Notaus. Ein Klick zu viel waere hier teuer, deshalb einmal nachfragen –
 * aber ohne Umweg ueber eine zweite Seite.
 */
export function NotausSchalter({ offen }: { offen: boolean }) {
  const [nachfragen, setNachfragen] = useState(false);

  if (offen && !nachfragen) {
    return (
      <div className="glas p-4">
        <p className="font-semibold text-gruen-hell">Reservierung ist offen</p>
        <p className="mt-1 text-sm text-white/55">
          Gäste können Tische eröffnen und sich dazusetzen.
        </p>
        <button
          type="button"
          onClick={() => setNachfragen(true)}
          className="mt-3 rounded-full border border-rot/40 px-5 py-2 text-sm font-semibold text-rot-hell transition hover:bg-rot/12"
        >
          Reservierung schließen
        </button>
      </div>
    );
  }

  if (offen) {
    return (
      <div className="space-y-3">
        <Hinweis ton="rot" titel="Reservierung wirklich schließen?">
          Die Seite zeigt danach nur noch Infos, niemand kann mehr buchen. Bestehende
          Reservierungen bleiben erhalten und lassen sich weiter verwalten.
        </Hinweis>
        <div className="flex flex-wrap gap-2">
          <form action={reservierungUmschalten}>
            <input type="hidden" name="an" value="0" />
            <button className="rounded-full bg-rot px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rot/85">
              Ja, schließen
            </button>
          </form>
          <button
            type="button"
            onClick={() => setNachfragen(false)}
            className="glas-knopf rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glas border-rot/30 bg-rot/8 p-4">
      <p className="font-semibold text-rot-hell">Reservierung ist geschlossen</p>
      <p className="mt-1 text-sm text-white/55">
        Die öffentliche Seite zeigt gerade nur Infos, es kann niemand buchen.
      </p>
      <form action={reservierungUmschalten} className="mt-3">
        <input type="hidden" name="an" value="1" />
        <button className="rounded-full bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gruen/85">
          Wieder öffnen
        </button>
      </form>
    </div>
  );
}
