"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { linkAnfordern } from "@/app/actions";
import { LEER } from "@/lib/formzustand";
import { Hinweis } from "./Hinweis";

function Knopf() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-rot px-6 py-3.5 text-base font-semibold text-white transition hover:bg-rot/85 active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? "Wird verschickt …" : "Link zuschicken"}
    </button>
  );
}

export function LinkFormular() {
  const [zustand, absenden] = useActionState(linkAnfordern, LEER);

  return (
    <form action={absenden} className="space-y-4">
      <div>
        <label htmlFor="email" className="sr-only">
          E-Mail-Adresse
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className="feld"
          placeholder="Deine E-Mail-Adresse"
          required
        />
      </div>

      {zustand.meldung && (
        <Hinweis ton={zustand.ok ? "gruen" : "rot"}>{zustand.meldung}</Hinweis>
      )}

      <Knopf />
    </form>
  );
}
