# BrewHouse

Hier gehoert die Schrift des Logos hin:

    public/fonts/brewhouse.woff2      (bevorzugt)
    public/fonts/brewhouse.woff       (optional, fuer aeltere Browser)

Die Dateinamen muessen genau so lauten – `src/app/globals.css` bindet sie
unter `@font-face { font-family: "BrewHouse" }` ein.

Solange die Dateien fehlen, greift die Ersatzkette (Georgia bzw. die
System-Serifenschrift). Die Seite funktioniert vollstaendig, nur der
Schriftcharakter der Marke fehlt.

Aus einer OTF/TTF wird eine woff2 zum Beispiel mit `fonttools`:

    pip install fonttools brotli
    fonttools ttLib.woff2 compress -o brewhouse.woff2 BrewHouse.otf

Die Schrift wird bewusst selbst gehostet und nicht von einem fremden Server
geladen – so bleibt die Seite ohne Drittanbieter.
