/** Rueckgabewert aller Formularaktionen. Liegt bewusst ausserhalb der
 *  "use server"-Dateien, weil die nur async Funktionen exportieren duerfen. */
export type Zustand = { ok: boolean; meldung?: string };

export const LEER: Zustand = { ok: false };
