import Image from "next/image";

/**
 * Das Pin-Foto am rechten Rand einer Kachel, mittig zwischen Ober- und
 * Unterkante.
 *
 * TRACHTENPIN_PLATZ gehoert dazu und kommt auf den Textblock daneben: rechts
 * genug Rand, damit der Text nicht unter den Pin laeuft, und eine Mindesthoehe,
 * damit die Kachel den Pin ganz fasst. Ohne die Mindesthoehe ragt er auf
 * breiten Schirmen oben und unten heraus, weil der Text dort in zwei Zeilen
 * passt und die Kachel entsprechend flach bleibt.
 *
 * next/image rechnet das Bild beim Ausliefern auf die gebrauchte Groesse
 * herunter. Damit ist es egal, wie gross die Datei in public/ liegt – wer sie
 * gegen ein echtes Foto tauscht, muss nichts weiter tun.
 */
export const TRACHTENPIN_PLATZ =
  "flex min-h-36 flex-col justify-center pr-36 sm:min-h-40 sm:pr-44";

export function Trachtenpin() {
  return (
    <Image
      src="/pin-mockup.png"
      alt=""
      aria-hidden
      width={1254}
      height={1254}
      sizes="(min-width: 640px) 160px, 144px"
      className="pointer-events-none absolute right-2 top-1/2 h-auto w-36 -translate-y-1/2 rotate-[10deg] drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] sm:right-3 sm:w-40"
    />
  );
}
