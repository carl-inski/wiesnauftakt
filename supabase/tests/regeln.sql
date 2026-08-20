-- =============================================================================
-- Fachliche Regeln gegen eine echte Postgres-Instanz pruefen.
-- Aufruf: scripts/db-test.sh
-- Erwartet eine frische Datenbank mit allen Migrationen aus supabase/migrations.
-- Jede Zeile "ERWARTET: ..." beschreibt, was passieren soll.
-- =============================================================================
\set ON_ERROR_STOP off
\pset pager off

create or replace function testpersonen(n int, praefix text default 'Gast', alter_j int default 20)
returns jsonb language sql as $$
  select jsonb_agg(jsonb_build_object(
    'vorname', praefix || i, 'nachname', 'Testmeier', 'alter_jahre', alter_j))
  from generate_series(1, n) i;
$$;

\echo ''
\echo '=== 1  Tisch eroeffnen (4 Personen auf T03) — ERWARTET: klappt, Name wird gesetzt'
select reservierung_anlegen('T03','Zeltlager-Crew','t-1','a@b.de',null,testpersonen(4));
select tisch_belegt('T03') as belegt, oeffentlicher_name from tische where id='T03';

\echo ''
\echo '=== 2  Dazubuchen (6 weitere) — ERWARTET: 10 belegt, Tischname bleibt'
select reservierung_anlegen('T03','Anderer Name','t-2','c@d.de',null,testpersonen(6,'Neu'));
select tisch_belegt('T03') as belegt, oeffentlicher_name from tische where id='T03';

\echo ''
\echo '=== 3  Ueberbuchen (3 weitere waeren 13) — ERWARTET: TISCH_VOLL|T03|2'
select reservierung_anlegen('T03',null,'t-3','e@f.de',null,testpersonen(3));

\echo ''
\echo '=== 4  Exakt auffuellen (2 weitere) — ERWARTET: klappt, 12 belegt'
select reservierung_anlegen('T03',null,'t-4','g@h.de',null,testpersonen(2,'Rest'));
select tisch_belegt('T03') as belegt from tische where id='T03';

\echo ''
\echo '=== 5  Auf vollen Tisch buchen — ERWARTET: TISCH_VOLL|T03|0'
select reservierung_anlegen('T03',null,'t-5','i@j.de',null,testpersonen(1));

\echo ''
\echo '=== 6  Gesperrter Tisch — ERWARTET: TISCH_NICHT_BUCHBAR'
select reservierung_anlegen('T09',null,'t-6','k@l.de',null,testpersonen(1));

\echo ''
\echo '=== 7  Fest vergebener Tisch — ERWARTET: TISCH_NICHT_BUCHBAR'
select reservierung_anlegen('T01',null,'t-7','m@n.de',null,testpersonen(1));

\echo ''
\echo '=== 8  15 Jahre — ERWARTET: MINDESTALTER|16'
select reservierung_anlegen('T04','Jung','t-8','o@p.de',null,testpersonen(1,'Kind',15));

\echo ''
\echo '=== 9  16 Jahre — ERWARTET: klappt'
select reservierung_anlegen('T04','Grenzfall','t-9','q@r.de',null,testpersonen(1,'Grenz',16));

\echo ''
\echo '=== 10 Rohes INSERT am RPC vorbei, ueber die Kapazitaet'
\echo '       ERWARTET: TISCH_VOLL aus dem Trigger, Belegung bleibt unveraendert'
begin;
  insert into gaeste (reservierung_id, tisch_id, vorname, nachname, alter_jahre, position)
  select (select id from reservierungen where token='t-1'), 'T03', 'Schwarz'||i, 'Fahrer', 30, 90+i
  from generate_series(1,5) i;
commit;
select tisch_belegt('T03') as belegt_unveraendert from tische where id='T03';

\echo ''
\echo '=== 11 Gast auf vollen Tisch umsetzen — ERWARTET: TISCH_VOLL aus dem Trigger'
select gast_verschieben(
  (select g.id from gaeste g join reservierungen r on r.id=g.reservierung_id where r.token='t-9' limit 1),
  'T03');

\echo ''
\echo '=== 12 Gast auf freien Tisch umsetzen — ERWARTET: klappt'
select gast_verschieben(
  (select g.id from gaeste g join reservierungen r on r.id=g.reservierung_id where r.token='t-9' limit 1),
  'T08');
select g.tisch_id from gaeste g join reservierungen r on r.id=g.reservierung_id where r.token='t-9';

\echo ''
\echo '=== 13 Gaesteliste umsortieren — ERWARTET: zweite Person wird Kontakt, keine Kollision'
select reservierung_anlegen('T06','Boazn-Fraktion','t-13','x@y.de',null,testpersonen(2,'Orig'));
select reservierung_gaeste_setzen(
  (select r.id from reservierungen r where r.token='t-13'),
  jsonb_build_array(
    jsonb_build_object(
      'id', (select g.id::text from gaeste g join reservierungen r on r.id=g.reservierung_id
             where r.token='t-13' and g.vorname='Orig2'),
      'vorname','Orig2','nachname','Testmeier','alter_jahre',21),
    jsonb_build_object('vorname','Ganzneu','nachname','Huber','alter_jahre',19)));
select g.vorname, g.ist_kontakt, g.position from gaeste g
  join reservierungen r on r.id=g.reservierung_id where r.token='t-13' order by g.position;

\echo ''
\echo '=== 14 Check-in bleibt beim Bearbeiten erhalten — ERWARTET: noch_eingecheckt = t'
update gaeste g set eingecheckt_am = now()
  from reservierungen r where r.id=g.reservierung_id and r.token='t-13' and g.vorname='Orig2';
select reservierung_gaeste_setzen(
  (select r.id from reservierungen r where r.token='t-13'),
  jsonb_build_array(jsonb_build_object(
    'id', (select g.id::text from gaeste g join reservierungen r on r.id=g.reservierung_id
           where r.token='t-13' and g.vorname='Orig2'),
    'vorname','Orig2','nachname','Neuername','alter_jahre',22)));
select g.nachname, (g.eingecheckt_am is not null) as noch_eingecheckt
  from gaeste g join reservierungen r on r.id=g.reservierung_id where r.token='t-13';

\echo ''
\echo '=== 15 Mindestalter beim Nachtragen — ERWARTET: MINDESTALTER|16'
select reservierung_gaeste_setzen(
  (select r.id from reservierungen r where r.token='t-13'),
  '[{"vorname":"Kind","nachname":"Klein","alter_jahre":14}]'::jsonb);

\echo ''
\echo '=== 16 Storno gibt Plaetze frei und raeumt den Tischnamen ab'
\echo '       ERWARTET: T06 leer, oeffentlicher_name leer'
update reservierungen set status='storniert' where token='t-13';
select tisch_neu_bewerten('T06');
select id, oeffentlicher_name, tisch_belegt(id) as belegt from tische where id='T06';

\echo ''
\echo '=== 17 Storniertes wiederbeleben, wenn der Tisch inzwischen voll ist'
\echo '       ERWARTET: TISCH_VOLL aus reservierung_kapazitaet'
update reservierungen set status='storniert' where token='t-4';
select reservierung_anlegen('T03',null,'t-17','z@z.de',null,testpersonen(2,'Lueckenfueller'));
update reservierungen set status='angefragt' where token='t-4';

\echo ''
\echo '=== 18 Notaus — ERWARTET: RESERVIERUNG_GESCHLOSSEN'
update einstellungen set wert=to_jsonb(false) where key='reservierung_offen';
select reservierung_anlegen('T12',null,'t-18','n@n.de',null,testpersonen(1));
update einstellungen set wert=to_jsonb(true) where key='reservierung_offen';

\echo ''
\echo '=== 19 Buchungsschluss vorbei — ERWARTET: BUCHUNGSSCHLUSS'
update einstellungen set wert=to_jsonb('2020-01-01T00:00:00+01:00'::text) where key='buchungsschluss';
select reservierung_anlegen('T12',null,'t-19','n@n.de',null,testpersonen(1));
update einstellungen set wert=to_jsonb('2026-09-15T23:59:00+02:00'::text) where key='buchungsschluss';

\echo ''
\echo '=== 20 Gesamtobergrenze — ERWARTET: GESAMT_OBERGRENZE'
update einstellungen set wert=to_jsonb(5) where key='gesamt_obergrenze';
select reservierung_anlegen('T12',null,'t-20','n@n.de',null,testpersonen(3));
update einstellungen set wert=to_jsonb(130) where key='gesamt_obergrenze';

\echo ''
\echo '=== 21 Ein Tisch, ein Kontakt — ERWARTET: genau eine Kontaktperson je Reservierung'
select r.token, count(*) filter (where g.ist_kontakt) as kontakte
from reservierungen r join gaeste g on g.reservierung_id = r.id
group by r.token having count(*) filter (where g.ist_kontakt) <> 1;
\echo '   (keine Zeilen = alles in Ordnung)'

drop function testpersonen(int, text, int);
