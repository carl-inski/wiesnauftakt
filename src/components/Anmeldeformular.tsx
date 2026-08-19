"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { anmeldenAktion } from "@/app/admin/aktionen";
import { LEER } from "@/lib/formzustand";
import { Hinweis } from "./Hinweis";

function Knopf() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-rot px-6 py-3.5 text-base font-semibold text-white transition hover:bg-rot/85 disabled:opacity-60"
    >
      {pending ? "Moment …" : "Anmelden"}
    </button>
  );
}

export function Anmeldeformular() {
  const [zustand, anmeldenTun] = useActionState(anmeldenAktion, LEER);

  return (
    <form action={anmeldenTun} className="space-y-4">
      <div>
        <label htmlFor="passwort" className="sr-only">
          Passwort
        </label>
        <input
          id="passwort"
          name="passwort"
          type="password"
          autoComplete="current-password"
          className="feld"
          placeholder="Passwort"
          required
          autoFocus
        />
      </div>

      {zustand.meldung && <Hinweis ton="rot">{zustand.meldung}</Hinweis>}

      <Knopf />
    </form>
  );
}
