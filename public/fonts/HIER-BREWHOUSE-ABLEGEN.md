# BrewHouse

    BrewHouse.ttf       Original, wie hochgeladen – Quelle
    brewhouse.woff2     daraus erzeugt, 7 statt 23 KB – DIESE laedt die Seite

`src/app/globals.css` bindet beide Schreibweisen und alle gaengigen Formate
unter `@font-face { font-family: "BrewHouse" }` ein und nimmt die erste Datei,
die es findet. woff2 steht vorn, deshalb sitzt der erste Versuch.

## Neue Fassung der Schrift?

Original ablegen, dann:

    pip install fonttools brotli
    python3 scripts/font-woff2.py

Das Skript nimmt `brewhouse.otf`, `brewhouse.ttf` oder `BrewHouse.ttf` und
schreibt `brewhouse.woff2`.

Ohne Umwandlung laeuft die Seite auch – der Browser nimmt dann die ttf, nur
laufen vorher zwei erfolglose Anfragen ins Leere.

Die Schrift wird selbst gehostet und nicht von einem fremden Server geladen,
damit die Seite ohne Drittanbieter auskommt.
