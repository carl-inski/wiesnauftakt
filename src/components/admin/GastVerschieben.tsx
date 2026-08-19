"use client";

import { useState } from "react";
import { gastVerschieben } from "@/app/admin/aktionen";

export function GastVerschieben({
  gastId,
  aktuellerTisch,
  tische,
}: {
  gastId: string;
  aktuellerTisch: string;
  tische: { id: string; nummer: number; frei: number; name: string | null }[];
}) {
  const [offen, setOffen] = useState(false);

  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        className="rounded-full px-2.5 py-1 text-xs text-white/45 transition hover:bg-white/8 hover:text-white"
      >
        Umsetzen
      </button>
    );
  }

  return (
    <form action={gastVerschieben} className="flex items-center gap-1.5">
      <input type="hidden" name="gastId" value={gastId} />
      <label className="sr-only" htmlFor={`ziel-${gastId}`}>
        Zieltisch
      </label>
      <select
        id={`ziel-${gastId}`}
        name="tischId"
        defaultValue={aktuellerTisch}
        className="feld py-1.5 text-xs"
      >
        {tische.map((t) => (
          <option key={t.id} value={t.id}>
            Tisch {t.nummer}
            {t.name ? ` · ${t.name}` : ""}
            {t.id === aktuellerTisch ? " (jetzt)" : ` · ${t.frei} frei`}
          </option>
        ))}
      </select>
      <button className="rounded-full bg-rot px-3 py-1.5 text-xs font-semibold text-white">
        OK
      </button>
      <button
        type="button"
        onClick={() => setOffen(false)}
        className="px-1.5 text-xs text-white/40 hover:text-white"
      >
        ×
      </button>
    </form>
  );
}
