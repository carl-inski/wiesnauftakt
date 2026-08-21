"use client";

import { useEffect } from "react";

/**
 * Nach dem Abschicken wechselt Next die Seite als Client-Navigation. Der
 * Browser behaelt dabei die Scrollposition des Absendeknopfes – also ganz
 * unten. Die Bestaetigung samt Haken steht aber oben und bekaeme so niemand
 * zu sehen.
 *
 * Zweimal gesprungen, weil Next die alte Position direkt nach dem Mounten
 * noch einmal wiederherstellen kann; der zweite Sprung im naechsten Frame
 * gewinnt dann.
 *
 * "instant" ist wichtig: html steht global auf scroll-behavior: smooth, ein
 * schlichtes scrollTo(0, 0) gleitet die 1800 Pixel deshalb ueber gut eine
 * Sekunde hinunter – der Haken waere durchgezeichnet, bevor er im Bild ist.
 */
export function NachObenSpringen() {
  useEffect(() => {
    const hoch = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    hoch();
    const frame = requestAnimationFrame(hoch);
    return () => cancelAnimationFrame(frame);
  }, []);

  return null;
}
