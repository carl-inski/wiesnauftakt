# Wiesnauftakt 2026 – Reservierung

Tischreservierung fuer den Wiesnauftakt der Pfarrjugend SJB.
Freitag, 18.09.2026, Einlass ab 18:30, Jugendheim SJB Haidhausen.

Next.js (App Router) auf Vercel, Supabase als Datenbank, Resend fuer Mails,
TypeScript, Tailwind CSS v4.

```bash
npm install
cp .env.example .env.local     # ausfuellen
npm run dev
```

Ohne Datenbank laeuft die Seite trotzdem. Mit `WIESN_DEMO=1` zeigt sie
Beispieltische, damit man das Layout anschauen kann:

```bash
WIESN_DEMO=1 npm run dev
```

Einrichtung von Supabase, Resend und Vercel: [`docs/setup.md`](docs/setup.md).

## Was die Seite kann

**Fuer Gaeste** – Saalplan mit 13 Tischen, davon 5 zum Start online. Einen
freien Tisch eroeffnen und benennen oder sich an einen angefangenen dazusetzen.
Pro Person Vorname, Nachname, Alter; die buchende Person zusaetzlich E-Mail und
optional die Handynummer. Danach ein persoenlicher Verwaltungslink zum
Nachtragen, Korrigieren und Absagen, und ein Tisch-Teilenlink fuer den
Gruppenchat.

**Fuer das Orgateam** unter `/admin` – Anfragen bestaetigen oder ablehnen
(beides schickt eine Mail), Tische einzeln freischalten, Personen zwischen
Tischen umsetzen, Gaesteliste mit Suche, Minderjaehrigenfilter und CSV-Export,
Einlassansicht fuers Handy und ein Notaus.

## Aufbau

```
data/tische.json          Tischkoordinaten in viewBox-Einheiten
public/saalplan-raum.svg  statische Huelle: Waende, Buehne, Bar, Eingang
public/logo-*.svg         Logo in drei Varianten (Platzhalter, siehe docs/assets.md)
supabase/migrations/      Schema, Funktionen, Startdaten
supabase/tests/           fachliche Regeln als SQL-Test
scripts/db-test*.sh       Testlaeufe gegen ein echtes Postgres
src/lib/                  Serverlogik: Datenbank, Mail, Validierung, Einstellungen
src/components/           Bausteine der Oberflaeche
src/app/                  Seiten und Serveraktionen
```

## Entscheidungen

**Keine Ueberbuchung, garantiert von der Datenbank.** Wenn zwei Gruppen
gleichzeitig nach den letzten Plaetzen greifen, sperrt der Trigger
`gaeste_kapazitaet()` zuerst die Tischzeile (`SELECT … FOR UPDATE`) und zaehlt
erst danach. Damit werden gleichzeitige Buchungen auf denselben Tisch
serialisiert: die zweite sieht die erste bereits und faellt mit `TISCH_VOLL`
raus. Das gilt fuer **jeden** Schreibweg, auch fuer ein Insert von Hand im
SQL-Editor. Nachgewiesen in `scripts/db-test-parallel.sh`. Im Frontend steht
dazu keine Logik – dort steht nur ein verstaendlicher Satz, was jetzt zu tun
ist.

**Nur ein Zugriffsweg auf die Daten.** RLS ist auf allen Tabellen aktiv und
es gibt keine Policy, der Server arbeitet mit dem Service-Role-Key. Jede
Abfrage entscheidet selbst, welche Felder sie herausgibt. Der oeffentliche Typ
`TischOeffentlich` kennt Nachname, Alter, E-Mail und Telefon gar nicht – so
kann man sie auch nicht versehentlich durchreichen. Die Servermodule sind mit
`server-only` markiert; ein Import aus einer Client-Komponente bricht den Build.

**Kein Konto, kein Passwort.** Wiedergefunden wird eine Reservierung ueber
einen Link mit 32 Byte Zufall. Der steht direkt nach dem Absenden zum Kopieren
auf der Seite, nicht nur in der Mail – die meisten schicken ihn sich lieber
selbst per WhatsApp. Dazu ein „nochmal zuschicken“-Weg, der immer dieselbe
Antwort gibt, damit man darueber keine fremden Adressen durchprobieren kann.

**Serveraktionen statt API-Routen.** Jede Mutation ist eine Server Action mit
`zod`-Pruefung; die fachlichen Regeln liegen zusaetzlich in der Datenbank.
Einzige Route ist der CSV-Export, weil der eine Datei ausliefert.

**Der Plan ist datengetrieben.** Farbe, Belegung, Klickverhalten und
Sperrstatus kommen aus der Datenbank und werden ueber die statische SVG-Huelle
gelegt. Ein Tisch wird per Klick im Orgabereich freigeschaltet und ist sofort
oeffentlich sichtbar.

**Mobil ohne Kompromiss.** Auf 390 px wird ein Tisch im Plan rund 57 × 119 px
gross, also klar antippbar – der Plan bleibt zur Orientierung sichtbar,
waehrend darunter dieselbe Auswahl als Kartenliste steht, wo mehr Platz fuer
Tischname, Belegung und Vornamen ist. Beide Ansichten teilen sich eine
Auswahl.

**Bewegung sparsam.** Uebergaenge unter 300 ms, `prefers-reduced-motion` wird
respektiert. Systemschriften, keine externen Fonts, kein Tracking, kein
Cookie-Banner – das einzige Cookie ist die Anmeldung im Orgabereich.

## Abweichungen vom Briefing

- **Kein Magic-Link fuer den Orgabereich, sondern ein gemeinsames Passwort.**
  Fuer zwei bis drei Leute ist das der kuerzere Weg und haengt nicht am
  Mailversand – gerade am Veranstaltungsabend ein Vorteil. Die Sitzung liegt in
  einem signierten HttpOnly-Cookie, das Passwort selbst nie.
- **Die Personenobergrenze ist nicht nur ein Zaehler, sondern auch eine
  Bremse.** Neue Anfragen werden abgelehnt, sobald sie ueberschritten waere.
  Der Startwert liegt mit 130 ueber der Summe aller Tischplaetze, stoert also
  im Normalfall nicht.
- **Die Einlassansicht ist gebaut**, nicht nur angedacht: unter `/admin/einlass`
  Name suchen, „Da“ und „Pin“ antippen. Sie ist der einzige Punkt aus dem
  Abschnitt „optional“.
- **Das Logo ist ein Platzhalter.** Siehe [`docs/assets.md`](docs/assets.md).

## Pruefen

```bash
npm run typecheck             # TypeScript
npm run build                 # Build inklusive Typpruefung
scripts/db-test.sh            # 21 fachliche Regeln gegen echtes Postgres
scripts/db-test-parallel.sh   # Nebenlaeufigkeit: zwei Gruppen, ein Tisch
```
