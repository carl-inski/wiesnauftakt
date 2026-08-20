import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(1, "Bitte ausfüllen")
  .max(60, "Etwas kürzer bitte");

export const personSchema = z.object({
  id: z.string().uuid().optional(),
  vorname: name,
  nachname: name,
  alter_jahre: z.coerce
    .number({ message: "Bitte eine Zahl eintragen" })
    .int("Bitte eine ganze Zahl")
    .min(0, "Bitte eine Zahl eintragen")
    .max(120, "Das passt so nicht"),
});

export type PersonEingabe = z.infer<typeof personSchema>;

export const telefonSchema = z
  .string()
  .trim()
  .max(40, "Etwas kürzer bitte")
  .regex(/^[0-9+()/\s-]*$/, "Da sind Zeichen drin, die wir nicht kennen")
  .optional()
  .or(z.literal(""));

export const reservierungSchema = z.object({
  tischId: z.string().regex(/^T\d{2}$/, "Unbekannter Tisch"),
  tischName: z.string().trim().max(40, "Maximal 40 Zeichen").optional().or(z.literal("")),
  telefon: telefonSchema,
  personen: z.array(personSchema).min(1, "Mindestens eine Person").max(12),
  verstanden: z.literal("ja", { message: "Bitte einmal bestätigen" }),
});

export const gaesteSchema = z.object({
  personen: z.array(personSchema).min(1, "Mindestens eine Person").max(12),
});

/** Liest die dynamisch nummerierten Personenfelder aus einem FormData-Objekt. */
export function personenAusFormular(formular: FormData): unknown[] {
  const personen: Record<string, unknown>[] = [];
  const indizes = new Set<string>();

  for (const schluessel of formular.keys()) {
    const treffer = schluessel.match(/^person\.(\d+)\./);
    if (treffer) indizes.add(treffer[1]);
  }

  for (const i of [...indizes].sort((a, b) => Number(a) - Number(b))) {
    const vorname = String(formular.get(`person.${i}.vorname`) ?? "").trim();
    const nachname = String(formular.get(`person.${i}.nachname`) ?? "").trim();
    const alter = String(formular.get(`person.${i}.alter`) ?? "").trim();
    const id = String(formular.get(`person.${i}.id`) ?? "").trim();

    // Komplett leere Zeilen sind kein Fehler, die hat jemand einfach offen gelassen.
    if (!vorname && !nachname && !alter) continue;

    personen.push({
      ...(id ? { id } : {}),
      vorname,
      nachname,
      alter_jahre: alter,
    });
  }

  return personen;
}

export function ersterFehler(fehler: z.ZodError): string {
  return fehler.issues[0]?.message ?? "Da hat etwas nicht gepasst.";
}
