-- =============================================================================
-- Fachliche Regeln gegen eine echte Postgres-Instanz pruefen.
-- Aufruf: scripts/db-test.sh
-- Erwartet eine frische Datenbank mit allen Migrationen aus supabase/migrations.
-- Jede Zeile "ERWARTET: ..." beschreibt, was passieren soll.
--
-- Leitgedanke seit 0009: Eine Anfrage ist ein Angebot, kein Platz. Mehrere
-- Gruppen duerfen denselben Tisch anfragen, ohne sich zu blockieren. Belegt
-- wird erst mit der Bestaetigung – und genau dort greift die
-- Ueberbuchungsgarantie.
-- =============================================================================
\set ON_ERROR_STOP off
\pset pager off

create or replace function testpersonen(n int, praefix text default 'Gast', alter_j int default 20)
returns jsonb language sql as $$
  select jsonb_agg(jsonb_build_object(
    'vorname', praefix || i, 'nachname', 'Testmeier', 'alter_jahre', alter_j))
  from generate_series(1, n) i;
$$;

create or replace function res_id(p_token text) returns uuid language sql as $$
  select id from reservierungen where token = p_token;
$$;

\echo ''
\echo '=== 1  Tisch anfragen (4 Personen auf T03)'
\echo '       ERWARTET: klappt – aber belegt bleibt 0 und der Tisch bleibt namenlos'
select reservierung_anlegen('T03','Zeltlager-Crew','t-1','a@b.de',null,testpersonen(4));
select tisch_belegt('T03') as belegt, coalesce(oeffentlicher_name,'(leer)') as name
  from tische where id='T03';

\echo ''
\echo '=== 2  Zweite Gruppe fragt denselben Tisch an (6 Personen)'
\echo '       ERWARTET: klappt – offene Anfragen blockieren einander nicht'
select reservierung_anlegen('T03','Anderer Name','t-2','c@d.de',null,testpersonen(6,'Neu'));

\echo ''
\echo '=== 3  Dritte Gruppe will denselben Tisch ganz (12 Personen)'
\echo '       ERWARTET: klappt ebenfalls, belegt weiterhin 0'
select reservierung_anlegen('T03',null,'t-3','e@f.de',null,testpersonen(12,'Gross'));
select tisch_belegt('T03') as belegt_immer_noch_null from tische where id='T03';

\echo ''
\echo '=== 4  Erste Anfrage bestaetigen'
\echo '       ERWARTET: belegt 4, Tisch heisst jetzt Zeltlager-Crew'
select reservierung_entscheiden(res_id('t-1'), 'bestaetigt');
select tisch_belegt('T03') as belegt, oeffentlicher_name from tische where id='T03';

\echo ''
\echo '=== 5  Die 12er-Gruppe bestaetigen — ERWARTET: TISCH_VOLL|T03|8'
select reservierung_entscheiden(res_id('t-3'), 'bestaetigt');

\echo ''
\echo '=== 6  Zweite Gruppe bestaetigen (6 Personen)'
\echo '       ERWARTET: klappt, belegt 10, Name bleibt Zeltlager-Crew'
select reservierung_entscheiden(res_id('t-2'), 'bestaetigt');
select tisch_belegt('T03') as belegt, oeffentlicher_name from tische where id='T03';

\echo ''
\echo '=== 7  Anfrage ueber die verbleibenden Plaetze hinaus (3 waeren 13)'
\echo '       ERWARTET: TISCH_VOLL|T03|2 – schon beim Anfragen, das kaeme nie durch'
select reservierung_anlegen('T03',null,'t-4','g@h.de',null,testpersonen(3));

\echo ''
\echo '=== 8  Exakt auffuellen (2 Personen) und bestaetigen — ERWARTET: belegt 12'
select reservierung_anlegen('T03',null,'t-5','i@j.de',null,testpersonen(2,'Rest'));
select reservierung_entscheiden(res_id('t-5'), 'bestaetigt');
select tisch_belegt('T03') as belegt from tische where id='T03';

\echo ''
\echo '=== 9  Auf den vollen Tisch anfragen — ERWARTET: TISCH_VOLL|T03|0'
select reservierung_anlegen('T03',null,'t-6','k@l.de',null,testpersonen(1));

\echo ''
\echo '=== 10 Abgelehnte Anfrage belegt nichts — ERWARTET: belegt bleibt 12, Grund steht'
select reservierung_entscheiden(res_id('t-3'), 'abgelehnt', 'Leider schon vergeben.');
select tisch_belegt('T03') as belegt,
       (select ablehnung_grund from reservierungen where token='t-3') as grund;

\echo ''
\echo '=== 11 Gesperrter Tisch — ERWARTET: TISCH_NICHT_BUCHBAR'
select reservierung_anlegen('T04',null,'t-7','m@n.de',null,testpersonen(1));

\echo ''
\echo '=== 12 Fest vergebener Tisch — ERWARTET: TISCH_NICHT_BUCHBAR'
select reservierung_anlegen('T01',null,'t-8','o@p.de',null,testpersonen(1));

\echo ''
\echo '=== 13 15 Jahre — ERWARTET: MINDESTALTER|16'
select reservierung_anlegen('T05','Jung','t-9','q@r.de',null,testpersonen(1,'Kind',15));

\echo ''
\echo '=== 14 16 Jahre — ERWARTET: klappt'
select reservierung_anlegen('T05','Grenzfall','t-10','s@t.de',null,testpersonen(1,'Grenz',16));

\echo ''
\echo '=== 15 Offene Anfrage ueber die Tischgroesse hinaus erweitern (13 Personen)'
\echo '       ERWARTET: TISCH_VOLL|T05|12 – sonst waere sie nie bestaetigbar'
select reservierung_gaeste_setzen(res_id('t-10'), testpersonen(13,'Zuviel',20));

\echo ''
\echo '=== 16 Rohes INSERT am RPC vorbei auf den vollen T03'
\echo '       ERWARTET: TISCH_VOLL aus dem Trigger, Belegung bleibt unveraendert'
begin;
  insert into gaeste (reservierung_id, tisch_id, vorname, nachname, alter_jahre, position)
  select res_id('t-1'), 'T03', 'Schwarz'||i, 'Fahrer', 30, 90+i
  from generate_series(1,5) i;
commit;
select tisch_belegt('T03') as belegt_unveraendert from tische where id='T03';

\echo ''
\echo '=== 17 Bestaetigten Gast auf den vollen Tisch umsetzen'
\echo '       ERWARTET: TISCH_VOLL aus dem Trigger'
select reservierung_entscheiden(res_id('t-10'), 'bestaetigt');
select gast_verschieben(
  (select g.id from gaeste g where g.reservierung_id = res_id('t-10') limit 1),
  'T03');

\echo ''
\echo '=== 18 Gast auf freien Tisch umsetzen — ERWARTET: klappt, sitzt danach auf T09'
select gast_verschieben(
  (select g.id from gaeste g where g.reservierung_id = res_id('t-10') limit 1),
  'T09');
select g.tisch_id from gaeste g where g.reservierung_id = res_id('t-10');

\echo ''
\echo '=== 19 Gaesteliste umsortieren — ERWARTET: zweite Person wird Kontakt, keine Kollision'
select reservierung_anlegen('T11','Boazn-Fraktion','t-20','x@y.de',null,testpersonen(2,'Orig'));
select reservierung_entscheiden(res_id('t-20'), 'bestaetigt');
select reservierung_gaeste_setzen(res_id('t-20'),
  jsonb_build_array(
    jsonb_build_object(
      'id', (select g.id::text from gaeste g
             where g.reservierung_id = res_id('t-20') and g.vorname='Orig2'),
      'vorname','Orig2','nachname','Testmeier','alter_jahre',21),
    jsonb_build_object('vorname','Ganzneu','nachname','Huber','alter_jahre',19)));
select g.vorname, g.ist_kontakt, g.position from gaeste g
  where g.reservierung_id = res_id('t-20') order by g.position;

\echo ''
\echo '=== 20 Check-in bleibt beim Bearbeiten erhalten — ERWARTET: noch_eingecheckt = t'
update gaeste set eingecheckt_am = now()
  where reservierung_id = res_id('t-20') and vorname='Orig2';
select reservierung_gaeste_setzen(res_id('t-20'),
  jsonb_build_array(jsonb_build_object(
    'id', (select g.id::text from gaeste g
           where g.reservierung_id = res_id('t-20') and g.vorname='Orig2'),
    'vorname','Orig2','nachname','Neuername','alter_jahre',22)));
select g.nachname, (g.eingecheckt_am is not null) as noch_eingecheckt
  from gaeste g where g.reservierung_id = res_id('t-20');

\echo ''
\echo '=== 21 Mindestalter beim Nachtragen — ERWARTET: MINDESTALTER|16'
select reservierung_gaeste_setzen(res_id('t-20'),
  '[{"vorname":"Kind","nachname":"Klein","alter_jahre":14}]'::jsonb);

\echo ''
\echo '=== 22 Storno gibt Plaetze frei und raeumt den Tischnamen ab'
\echo '       ERWARTET: T11 leer, oeffentlicher_name leer'
update reservierungen set status='storniert' where token='t-20';
select tisch_neu_bewerten('T11');
select id, coalesce(oeffentlicher_name,'(leer)') as name, tisch_belegt(id) as belegt
  from tische where id='T11';

\echo ''
\echo '=== 23 Storniertes wiederbeleben, wenn der Tisch inzwischen voll ist'
\echo '       ERWARTET: TISCH_VOLL aus reservierung_kapazitaet'
update reservierungen set status='storniert' where token='t-5';
select reservierung_anlegen('T03',null,'t-23','z@z.de',null,testpersonen(2,'Lueckenfueller'));
select reservierung_entscheiden(res_id('t-23'), 'bestaetigt');
update reservierungen set status='bestaetigt' where token='t-5';

\echo ''
\echo '=== 24 Notaus — ERWARTET: RESERVIERUNG_GESCHLOSSEN'
update einstellungen set wert=to_jsonb(false) where key='reservierung_offen';
select reservierung_anlegen('T12',null,'t-24','n@n.de',null,testpersonen(1));
update einstellungen set wert=to_jsonb(true) where key='reservierung_offen';

\echo ''
\echo '=== 25 Buchungsschluss vorbei — ERWARTET: BUCHUNGSSCHLUSS'
update einstellungen set wert=to_jsonb('2020-01-01T00:00:00+01:00'::text) where key='buchungsschluss';
select reservierung_anlegen('T12',null,'t-25','n@n.de',null,testpersonen(1));
update einstellungen set wert=to_jsonb('2026-09-15T23:59:00+02:00'::text) where key='buchungsschluss';

\echo ''
\echo '=== 26 Gesamtobergrenze beim Anfragen — ERWARTET: GESAMT_OBERGRENZE'
update einstellungen set wert=to_jsonb(1) where key='gesamt_obergrenze';
select reservierung_anlegen('T12',null,'t-26','n@n.de',null,testpersonen(3));

\echo ''
\echo '=== 27 Gesamtobergrenze beim Bestaetigen — ERWARTET: GESAMT_OBERGRENZE'
\echo '       (die Anfrage lag vor, bevor die Grenze gesenkt wurde)'
update einstellungen set wert=to_jsonb(130) where key='gesamt_obergrenze';
select reservierung_anlegen('T12','Spaet','t-27','n@n.de',null,testpersonen(3));
update einstellungen set wert=to_jsonb(1) where key='gesamt_obergrenze';
select reservierung_entscheiden(res_id('t-27'), 'bestaetigt');
update einstellungen set wert=to_jsonb(130) where key='gesamt_obergrenze';

\echo ''
\echo '=== 28 Offene Anfragen tauchen in keiner Belegung auf'
\echo '       ERWARTET: keine Zeilen – tisch_belegt zaehlt ausschliesslich Bestaetigte'
select t.id, tisch_belegt(t.id) as belegt
  from tische t
 where tisch_belegt(t.id) <> (
   select count(*) from gaeste g join reservierungen r on r.id = g.reservierung_id
    where g.tisch_id = t.id and r.status = 'bestaetigt');
\echo '   (keine Zeilen = alles in Ordnung)'

\echo ''
\echo '=== 29 Kein Tischname ohne bestaetigte Gruppe'
\echo '       ERWARTET: keine Zeilen – ein Wunschname landet nie ungeprueft im Plan'
select t.id, t.oeffentlicher_name
  from tische t
 where t.oeffentlicher_name is not null
   and tisch_belegt(t.id) = 0;
\echo '   (keine Zeilen = alles in Ordnung)'

\echo ''
\echo '=== 30 Ein Tisch, ein Kontakt — ERWARTET: genau eine Kontaktperson je Reservierung'
select r.token, count(*) filter (where g.ist_kontakt) as kontakte
from reservierungen r join gaeste g on g.reservierung_id = r.id
group by r.token having count(*) filter (where g.ist_kontakt) <> 1;
\echo '   (keine Zeilen = alles in Ordnung)'

drop function testpersonen(int, text, int);
drop function res_id(text);
