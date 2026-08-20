"use client";

import { useId } from "react";
import type { Fuellstand, TischStatus } from "@/lib/tisch-typen";
import type { TischGeometrie } from "@/lib/plan";

export type PlanTisch = {
  id: string;
  nummer: number;
  status: TischStatus;
  name: string | null;
  internerTitel: string | null;
  belegt: number;
  max: number;
  frei: number;
  vornamen: string[];
  fuellstand: Fuellstand;
  geometrie: TischGeometrie;
};

type Eigenschaften = {
  tische: PlanTisch[];
  viewBox: string;
  huelle: string;
  ausgewaehlt?: string | null;
  onAuswahl?: (id: string) => void;
  klein?: boolean;
};

const FARBEN: Record<Fuellstand, { flaeche: string; kante: string; text: string }> = {
  leer:        { flaeche: "rgba(27,161,73,0.22)",  kante: "#1BA149", text: "#ffffff" },
  fuellt_sich: { flaeche: "rgba(27,161,73,0.22)",  kante: "#1BA149", text: "#ffffff" },
  gut_belegt:  { flaeche: "rgba(242,101,34,0.24)", kante: "#F26522", text: "#ffffff" },
  voll:        { flaeche: "rgba(228,50,43,0.20)",  kante: "#E4322B", text: "#ffffff" },
};

const GESPERRT = { flaeche: "rgba(255,255,255,0.035)", kante: "rgba(255,255,255,0.16)", text: "rgba(255,255,255,0.4)" };
const INTERN   = { flaeche: "rgba(255,255,255,0.05)",  kante: "rgba(255,255,255,0.2)",  text: "rgba(255,255,255,0.5)" };

/**
 * Der Plan liegt datengetrieben ueber der statischen Huelle. Auf 390 px Breite
 * ist ein Tisch rund 57 x 119 px gross – deutlich ueber der Mindestgroesse fuer
 * Antippziele, deshalb funktioniert derselbe Plan auf Handy und Desktop, ohne
 * dass irgendwo gezoomt werden muss.
 */
export function Saalplan({
  tische,
  viewBox,
  huelle,
  ausgewaehlt,
  onAuswahl,
  klein = false,
}: Eigenschaften) {
  const id = useId();
  const [, , breite, hoehe] = viewBox.split(" ").map(Number);

  return (
    <svg
      viewBox={viewBox}
      className="h-full w-full"
      role="group"
      aria-label="Plan der Festhalle mit 13 Tischen"
    >
      <defs>
        <filter id={`${id}-schein`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="14" result="unscharf" />
          <feMerge>
            <feMergeNode in="unscharf" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Waende, Buehne, Bar, Eingang – unveraenderliche Huelle */}
      <image
        href={huelle}
        x={0}
        y={0}
        width={breite}
        height={hoehe}
        opacity={0.85}
        preserveAspectRatio="xMidYMid meet"
      />

      {tische.map((t) => {
        const g = t.geometrie;
        const gewaehlt = ausgewaehlt === t.id;
        const klickbar = t.status === "buchbar" && Boolean(onAuswahl);

        const stil =
          t.status === "intern" ? INTERN
          : t.status === "gesperrt" ? GESPERRT
          : FARBEN[t.fuellstand];

        const beschriftung =
          t.status === "intern"
            ? `Tisch ${t.nummer}: ${t.internerTitel ?? "fest vergeben"}, nicht buchbar`
            : t.status === "gesperrt"
              ? `Tisch ${t.nummer}: noch nicht freigeschaltet`
              : `Tisch ${t.nummer}${t.name ? `, ${t.name}` : ""}: ${t.belegt} von ${t.max} Plätzen belegt${t.frei > 0 ? `, ${t.frei} frei` : ", voll"}`;

        // Laengs an der Tischkante steht der Name: bei fest vergebenen Tischen
        // die interne Bezeichnung, bei buchbaren der Name, den die eroeffnende
        // Gruppe vergeben hat. Der Tisch ist 380 Einheiten hoch, bis rund 22
        // Zeichen passt es, wenn die Schrift mitwaechst; Laengeres wird
        // abgekuerzt und steht vollstaendig im Sheet.
        const rohName = t.status === "intern" ? t.internerTitel : t.name;
        const laengsText = rohName
          ? rohName.length <= 22
            ? rohName
            : `${rohName.slice(0, 21)}…`
          : null;
        const laengsGroesse = laengsText && laengsText.length > 16 ? 28 : 34;

        return (
          <g
            key={t.id}
            role={klickbar ? "button" : undefined}
            tabIndex={klickbar ? 0 : undefined}
            aria-label={beschriftung}
            aria-pressed={klickbar ? gewaehlt : undefined}
            className={klickbar ? "cursor-pointer outline-none" : undefined}
            onClick={klickbar ? () => onAuswahl?.(t.id) : undefined}
            onKeyDown={
              klickbar
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onAuswahl?.(t.id);
                    }
                  }
                : undefined
            }
          >
            {gewaehlt && (
              <rect
                x={g.x - 12}
                y={g.y - 12}
                width={g.w + 24}
                height={g.h + 24}
                rx={g.rx + 10}
                fill="none"
                stroke="#FFC61E"
                strokeWidth={6}
                filter={`url(#${id}-schein)`}
              />
            )}

            <rect
              x={g.x}
              y={g.y}
              width={g.w}
              height={g.h}
              rx={g.rx}
              fill={stil.flaeche}
              stroke={gewaehlt ? "#FFC61E" : stil.kante}
              strokeWidth={gewaehlt ? 7 : 4}
              strokeDasharray={t.status === "gesperrt" ? "14 12" : undefined}
              style={{ transition: "stroke 180ms ease, fill 180ms ease" }}
            />

            <text
              x={g.mitte.x}
              y={t.status === "buchbar" ? g.mitte.y - 6 : g.mitte.y + 24}
              textAnchor="middle"
              fontSize={klein ? 82 : 74}
              fontWeight={700}
              fill={stil.text}
            >
              {t.nummer}
            </text>

            {t.status === "buchbar" && (
              <text
                x={g.mitte.x}
                y={g.mitte.y + 52}
                textAnchor="middle"
                fontSize={42}
                fontWeight={600}
                fill={gewaehlt ? "#FFC61E" : stil.kante}
              >
                {t.belegt}/{t.max}
              </text>
            )}

            {laengsText && (
              <text
                x={g.mitte.x}
                y={g.mitte.y}
                textAnchor="middle"
                fontSize={laengsGroesse}
                fill={t.status === "buchbar" ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.45)"}
                /* Nach der Drehung verschiebt translate entlang der Bildschirm-x-
                   Achse. Der Versatz muss deshalb aus der Tisch*breite* kommen,
                   nicht aus der Hoehe – sonst steht die Beschriftung neben dem
                   Tisch statt darin. */
                transform={`rotate(-90 ${g.mitte.x} ${g.mitte.y}) translate(0 ${-(g.w / 2 - 26)})`}
              >
                {laengsText}
              </text>
            )}

            {t.status === "intern" && !laengsText && (
              <g
                transform={`translate(${g.mitte.x - 20} ${g.mitte.y - 96})`}
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={5}
              >
                <rect x={2} y={18} width={36} height={28} rx={6} />
                <path d="M 10 18 v -8 a 10 10 0 0 1 20 0 v 8" />
              </g>
            )}

            {t.status === "gesperrt" && (
              <text
                x={g.mitte.x}
                y={g.mitte.y + 76}
                textAnchor="middle"
                fontSize={32}
                fill="rgba(255,255,255,0.35)"
              >
                gesperrt
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

