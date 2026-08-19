/* eslint-disable @next/next/no-img-element */

/**
 * Das Logo ist die einzige Stelle, an der die Seite bunt wird. Es liegt als
 * fertige Datei in public/ – wird dort das Original eingesetzt, aendert sich
 * hier nichts. Kein next/image, weil SVG ohnehin nicht optimiert wird.
 */
export function Logo({
  variante = "bildmarke",
  className = "",
  alt = "Wiesnauftakt der Pfarrjugend SJB",
}: {
  variante?: "bildmarke" | "quadrat" | "hoch";
  className?: string;
  alt?: string;
}) {
  const datei = {
    bildmarke: "/logo-bildmarke.svg",
    quadrat: "/logo-quadrat.svg",
    hoch: "/logo-hoch.svg",
  }[variante];

  return <img src={datei} alt={alt} className={className} draggable={false} />;
}
