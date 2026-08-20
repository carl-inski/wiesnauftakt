# Einrichten

Reihenfolge: Datenbank, Mail, Deployment. Dauert zusammen etwa eine halbe Stunde.

## 1. Supabase

1. Auf [supabase.com](https://supabase.com) ein Projekt anlegen, Region
   `eu-central-1` (Frankfurt).
2. Im SQL-Editor die drei Dateien aus `supabase/migrations/` **in dieser
   Reihenfolge** ausfuehren:

   ```
   0001_schema.sql      Tabellen, Indizes, RLS
   0002_funktionen.sql  Kapazitaetsgarantie und Buchungslogik
   0003_seed.sql        Einstellungen und die 13 Tische
   ```

   Alle drei sind mehrfach ausfuehrbar. `0003_seed.sql` ueberschreibt nichts,
   was spaeter im Orgabereich geaendert wurde.

3. Unter **Settings → API** die Projekt-URL und den **service_role**-Key holen.

Der service_role-Key umgeht RLS – deshalb steht er nur auf dem Server. Auf allen
Tabellen ist RLS aktiv und es gibt bewusst **keine einzige Policy**: Wer den
anon-Key in die Hand bekommt, sieht damit nichts.

### Kostenloser Tarif: der eine Haken

Fuer diese Seite reicht der Free-Plan von Supabase ohne Abstriche. 130 Personen
sind ein paar hundert Zeilen – von den 500 MB Datenbank sieht man nichts.

Ein Punkt ist aber wichtig: **Supabase pausiert Projekte im kostenlosen Tarif,
wenn sie ueber sieben Tage zu wenig Aktivitaet sehen.** Laut
[Doku](https://supabase.com/docs/guides/platform/free-project-pausing) genuegen
"a few user requests to the database each day" zum Wachbleiben. Passiert es
doch, ist die Seite kaputt, bis jemand im Dashboard auf *Resume project*
klickt – ausgerechnet dann, wenn nach einer ruhigen Woche der erste den
Instagram-Link antippt.

Dagegen laeuft `/api/wachhalten`: ein Endpunkt, der zwei winzige Abfragen macht
und von Vercel Cron einmal taeglich aufgerufen wird (`vercel.json`, 05:00 UTC).
Zusammen mit dem echten Verkehr reicht das. Zwei Dinge dafuer:

- `CRON_SECRET` auf Vercel setzen (beliebige lange Zufallszeichenkette) –
  Vercel schickt sie dann automatisch mit, und der Endpunkt weist alles andere
  mit 401 ab.
- Nach dem ersten Deploy unter **Settings → Cron Jobs** kontrollieren, dass der
  Job gelistet ist. Auf dem Hobby-Plan laeuft er einmal taeglich, ungefaehr zur
  angegebenen Zeit.

Supabase warnt ausserdem rund eine Woche vorher per Mail, bevor ein Projekt
pausiert wird – die Adresse des Projekteigentuemers sollte also jemand lesen.
Und selbst ein pausiertes Projekt laesst sich 90 Tage lang mit einem Klick
zurueckholen, ohne Datenverlust.

Mit der Supabase-CLI geht es auch ohne Copy-Paste:

```bash
supabase link --project-ref <ref>
supabase db push
```

## 2. Mailversand

Bei [Resend](https://resend.com) eine Domain verifizieren (SPF und DKIM setzen)
und einen API-Key erzeugen. Absender in `MAIL_ABSENDER` eintragen, zum Beispiel
`Wiesnauftakt <wiesn@pfarrjugend-sjb.de>`.

Ohne `RESEND_API_KEY` laeuft alles weiter, es gehen nur keine Mails raus. Jeder
Versuch landet in der Tabelle `mail_log`, mit Fehlertext – da schaut man nach,
wenn jemand sagt, es sei nichts angekommen.

Ein anderer Anbieter ist schnell eingehaengt: nur `senden()` in `src/lib/mail.ts`
tauscht man aus, die Vorlagen bleiben.

## 3. Vercel

Repository verbinden, Framework wird automatisch erkannt. Unter
**Settings → Environment Variables** alles aus `.env.example` eintragen:

| Variable | Pflicht | Wofuer |
| --- | --- | --- |
| `SUPABASE_URL` | ja | Datenbank |
| `SUPABASE_SERVICE_ROLE_KEY` | ja | Datenbank |
| `ADMIN_PASSWORT` | ja | Zugang zu `/admin` |
| `RESEND_API_KEY` | fuer Mails | Versand |
| `MAIL_ABSENDER` | fuer Mails | Absenderadresse |
| `NEXT_PUBLIC_SITE_URL` | empfohlen | Links in den Mails |
| `CRON_SECRET` | im Free-Tarif | schuetzt den Wachhalter |
| `ADMIN_SESSION_SECRET` | optional | sonst wird `ADMIN_PASSWORT` verwendet |

`NEXT_PUBLIC_SITE_URL` ohne Schraegstrich am Ende. Fehlt sie, nimmt die Seite
die Vercel-Adresse – dann stehen in den Mails Vorschau-URLs.

## 4. Vor dem Teilen des Links

- [ ] Logo ausgetauscht (siehe [`assets.md`](assets.md))
- [ ] Datum, Einlasszeit und Buchungsschluss unter `/admin/einstellungen` geprueft
- [ ] Tische unter `/admin/tische` zugewiesen: welche sind fest vergeben, welche
      gehen online
- [ ] Eine Testreservierung durchgespielt und beide Mails angeschaut
- [ ] `ADMIN_PASSWORT` an die zwei bis drei Leute weitergegeben, die es brauchen
- [ ] Im kostenlosen Supabase-Tarif: Cron-Job unter Vercel → Settings → Cron Jobs
      sichtbar, `CRON_SECRET` gesetzt

## Datenbank testen

Gegen ein beliebiges erreichbares Postgres:

```bash
scripts/db-test.sh            # 21 fachliche Regeln
scripts/db-test-parallel.sh   # zwei Gruppen greifen gleichzeitig zu
```

Beide legen eine Wegwerf-Datenbank an (`WIESN_TESTDB`, Standard `wiesn_test`)
und fassen das Produktivsystem nicht an.
