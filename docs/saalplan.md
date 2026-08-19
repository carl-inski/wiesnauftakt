# Saalplan

Der Plan besteht aus zwei Teilen, die absichtlich getrennt bleiben:

| Datei | Inhalt | Aendert sich |
| --- | --- | --- |
| `public/saalplan-raum.svg` | Waende, Buehne, Bar, Eingang, Tanzflaeche | so gut wie nie |
| `data/tische.json` | Lage der 13 Tische in viewBox-Einheiten | wenn umgestellt wird |
| Datenbank (`tische`) | Farbe, Belegung, Klickverhalten, Sperrstatus | staendig |

Die Tische stehen **nicht** im SVG. `src/components/Saalplan.tsx` legt sie zur
Laufzeit darueber. So kann das Orgateam einen Tisch freischalten, ohne dass
jemand eine Datei anfasst.

## viewBox

```
0 0 1240 1900
```

Hochformat, Verhaeltnis 1240 : 1900 ≈ 0,653. Alle Koordinaten in
`data/tische.json` beziehen sich auf dieses System. Das SVG der Huelle hat
dieselbe viewBox und wird als `<image>` deckungsgleich untergelegt.

## Raster

Fuenf Spalten, 180 Einheiten breit, 60 Einheiten Gasse, 20 Einheiten Innenrand:

```
Spalte   1     2     3     4     5
x       50   290   530   770  1010
```

Drei Reihen plus ein einzelner Tisch hinten rechts:

```
Reihe A   y =   40    Tisch 1 und 2, links und rechts der Buehne
Reihe B   y =  460    Tisch 3 bis 7
Reihe C   y =  880    Tisch 8 bis 12
Reihe D   y = 1300    Tisch 13
```

Jeder Tisch ist 180 × 380 Einheiten mit 18 Einheiten Eckradius.

Auf einem 390 px breiten Handy wird ein Tisch daraus rund **57 × 119 px** –
deutlich ueber der Mindestgroesse fuer Antippziele. Der Plan funktioniert
deshalb ohne Zoom auf jedem Geraet.

## Namensschema

Tisch-ids sind `T01` bis `T13`, immer zweistellig. Dieselbe id steht in
`data/tische.json` und in der Spalte `tische.id`. Sie taucht auch in der
oeffentlichen Adresse auf: `/tisch/T04`.

Die Nummerierung laeuft in Lesereihenfolge, beginnend an der Buehne:

```
      ┌─────────────────────────────────┐
      │  1    [   BÜHNE   ]          2  │   Reihe A
      │  3    4     5     6          7  │   Reihe B
      │  8    9    10    11         12  │   Reihe C
      │                                 │
      │      Tanzfläche             13  │   Reihe D
      │  ⌐ Eingang   [ BAR ]            │
      └─────────────────────────────────┘
```

## Lage

- **Buehne** – Nordwand, mittig, ueber den Spalten 2 bis 4 (x 290 bis 950).
- **Bar** – Suedwand, mittig (x 410 bis 760), buendig in der Wand.
- **Eingang** – Luecke in der Suedwand links (x 110 bis 320), mit angedeutetem
  Tuerschwenk. Wer reinkommt, steht auf der Tanzflaeche und schaut zur Buehne.
- **Tanzflaeche** – die freie Ecke unten links.

## Tisch verschieben oder ergaenzen

1. Koordinaten in `data/tische.json` anpassen. Bleibt beim Raster oben, dann
   passt der Plan optisch weiter zusammen.
2. Bei einem neuen Tisch zusaetzlich eine Zeile in `tische` anlegen – die id
   muss uebereinstimmen, sonst wird der Tisch nicht angezeigt
   (`src/lib/tische.ts` filtert auf bekannte Geometrien).
3. `public/saalplan-referenz.png` neu erzeugen, wenn sich die Huelle geaendert
   hat. Die Datei ist reine Dokumentation und wird von der Seite nicht geladen.
