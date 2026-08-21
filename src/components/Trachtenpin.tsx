import Image from "next/image";

/**
 * Das Pin-Foto, das aus der oberen rechten Ecke einer Kachel schaut.
 *
 * next/image rechnet das Bild beim Ausliefern auf die gebrauchte Groesse
 * herunter. Damit ist es egal, wie gross die Datei in public/ liegt – wer sie
 * gegen ein echtes Foto tauscht, muss nichts weiter tun.
 */
export function Trachtenpin() {
  return (
    <Image
      src="/pin-mockup.png"
      alt=""
      aria-hidden
      width={1254}
      height={1254}
      sizes="(min-width: 640px) 144px, 128px"
      className="pointer-events-none absolute -right-5 -top-5 h-auto w-32 rotate-[10deg] drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] sm:w-36"
    />
  );
}
