# Bilddateien

## Logo – bitte ersetzen

Die drei Logodateien in `public/` sind **Platzhalter**. Sie treffen Palette und
Bildinhalt (Masskrug, Brezn, Tirolerhut), sind aber nicht das Original: der
Fraktur-Schriftzug laesst sich ohne die Originaldatei nicht nachbauen, und
externe Schriften sind laut Vorgabe nicht erlaubt.

Zum Austauschen einfach ueberschreiben – gleiche Dateinamen, gleiche
Seitenverhaeltnisse, dann aendert sich am Layout nichts:

| Datei | Format | Verwendet in |
| --- | --- | --- |
| `logo-bildmarke.svg` | 1:1, transparent | Startseite, 404, Anmeldung, Favicon |
| `logo-quadrat.svg` | 1:1, dunkler Grund | Vorschaubild beim Teilen (Open Graph) |
| `logo-hoch.svg` | 3:4, dunkler Grund | reserviert fuer Aushaenge und Plakate |

Angesprochen werden sie ausschliesslich ueber `src/components/Logo.tsx`. Wer
andere Dateinamen braucht, aendert nur diese eine Datei.

PNG statt SVG geht auch – dann in `Logo.tsx` die Endung anpassen.

## Saalplan

- `public/saalplan-raum.svg` – die Huelle, wird von der Seite geladen.
- `public/saalplan-referenz.png` – gerendertes Gesamtbild mit allen Tischen,
  nur zur Orientierung. Die Seite laedt es nicht.
- `public/saalplan-referenz.svg` – Quelle des Referenzbildes.

Details zu Koordinaten und Konventionen in [`saalplan.md`](saalplan.md).
