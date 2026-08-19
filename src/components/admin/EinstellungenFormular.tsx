"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { einstellungenSpeichern } from "@/app/admin/aktionen";
import { LEER } from "@/lib/formzustand";
import { Hinweis } from "../Hinweis";

type Feld = {
  schluessel: string;
  beschriftung: string;
  wert: string | number | boolean;
  hilfe?: string;
  typ?: "text" | "number" | "date" | "datetime-local" | "time";
};

function Knopf() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-rot px-6 py-3.5 text-base font-semibold text-white transition hover:bg-rot/85 disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Wird gespeichert …" : "Alles speichern"}
    </button>
  );
}

export function EinstellungenFormular({ felder }: { felder: Feld[] }) {
  const [zustand, speichern] = useActionState(einstellungenSpeichern, LEER);

  return (
    <form action={speichern} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {felder.map((f) => (
          <div key={f.schluessel} className="glas p-4">
            {typeof f.wert === "boolean" ? (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name={f.schluessel}
                  value="an"
                  defaultChecked={f.wert}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-rot"
                />
                <span>
                  <span className="block text-sm font-semibold">{f.beschriftung}</span>
                  {f.hilfe && (
                    <span className="mt-0.5 block text-xs leading-relaxed text-white/45">
                      {f.hilfe}
                    </span>
                  )}
                </span>
              </label>
            ) : (
              <>
                <label
                  htmlFor={f.schluessel}
                  className="mb-1.5 block text-sm font-semibold"
                >
                  {f.beschriftung}
                </label>
                <input
                  id={f.schluessel}
                  name={f.schluessel}
                  type={f.typ ?? "text"}
                  defaultValue={String(f.wert)}
                  className="feld"
                  {...(f.typ === "number" ? { min: 0, step: 1 } : {})}
                />
                {f.hilfe && (
                  <p className="mt-1.5 text-xs leading-relaxed text-white/45">{f.hilfe}</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {zustand.meldung && (
        <Hinweis ton={zustand.ok ? "gruen" : "rot"}>{zustand.meldung}</Hinweis>
      )}

      <Knopf />
    </form>
  );
}
