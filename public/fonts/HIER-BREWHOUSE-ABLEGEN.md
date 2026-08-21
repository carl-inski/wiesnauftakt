# BrewHouse

Leg die Schriftdatei hier ab. **Eines** dieser Formate genuegt:

    brewhouse.woff2     bevorzugt, kleinste Datei
    brewhouse.woff
    brewhouse.otf       funktioniert genauso, nur groesser
    brewhouse.ttf       ebenso

Der Dateiname muss genau so lauten (klein geschrieben) – `src/app/globals.css`
bindet alle vier Varianten unter `@font-face { font-family: "BrewHouse" }` ein
und nimmt die erste, die es findet.

Solange keine Datei da ist, greift die Ersatzkette (Georgia bzw. die
System-Serifenschrift). Die Seite funktioniert vollstaendig, nur der
Schriftcharakter der Marke fehlt.

## otf/ttf kleiner machen (empfohlen)

Der Browser probiert die vier Formate der Reihe nach durch. Liegt nur eine
`brewhouse.ttf` da, laufen bei jedem Seitenaufruf drei erfolglose Anfragen
(woff2, woff, otf) ins Leere, bevor die ttf greift. Schadet nichts, ist aber
unnoetig – mit einer woff2 sitzt gleich der erste Versuch.

    pip install fonttools brotli
    python3 scripts/font-woff2.py

Das erzeugt aus der otf/ttf eine woff2, meist rund halb so gross. Noetig ist
es nicht – es spart nur Ladezeit auf dem Handy.

Die Schrift wird bewusst selbst gehostet und nicht von einem fremden Server
geladen, damit die Seite ohne Drittanbieter auskommt.
