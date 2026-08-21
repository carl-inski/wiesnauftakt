-- =============================================================================
-- Wiesnauftakt 2026 – Startdaten
-- =============================================================================
-- Mehrfach ausfuehrbar: bestehende Werte werden nicht ueberschrieben, damit ein
-- erneuter Lauf keine im Admin gepflegten Aenderungen zerstoert.
-- =============================================================================

insert into einstellungen (key, wert, beschreibung) values
  ('event_datum',              to_jsonb('2026-09-18'::text),          'Tag der Veranstaltung (ISO)'),
  ('einlass_zeit',             to_jsonb('18:30'::text),               'Einlass ab (HH:MM)'),
  ('verfall_zeit',             to_jsonb('19:45'::text),               'Ab hier verfallen reservierte Tische'),
  ('buchungsschluss',          to_jsonb('2026-09-15T23:59:00+02:00'::text), 'Letzter Zeitpunkt fuer Anfragen'),
  ('max_personen_pro_tisch',   to_jsonb(12),                          'Harte Obergrenze pro Tisch'),
  ('richtwert_personen',       to_jsonb(10),                          'Ab hier gilt ein Tisch als gut belegt'),
  ('mindestalter',             to_jsonb(16),                          'Unter diesem Alter keine Reservierung'),
  ('gesamt_obergrenze',        to_jsonb(130),                         'Maximale Personenzahl im Saal'),
  ('reservierung_offen',       to_jsonb(true),                        'Notaus: false schliesst die Reservierung'),
  ('ort_name',                 to_jsonb('Jugendheim SJB Haidhausen'::text), 'Veranstaltungsort'),
  ('ort_adresse',              to_jsonb('Kirchenstraße 37, 81675 München'::text), 'Adresse fuer Karte und Kalender'),
  ('maps_link',                to_jsonb('https://maps.app.goo.gl/rkstZvriJ1chQuAVA'::text), 'Ziel des Knopfes unter der Karte'),
  ('kontakt_email',            to_jsonb('sjb.pfarrjugend@gmx.de'::text), 'Ruecklaufadresse'),
  ('hinweis_startseite',       to_jsonb(''::text),                    'Optionaler Hinweis oben auf der Startseite')
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Tische. Die ids entsprechen data/tische.json.
-- Start: 5 Tische online (T03, T04, T06, T08, T12), 4 fest vergeben, 4 gesperrt.
-- -----------------------------------------------------------------------------
insert into tische (id, nummer, status, interner_titel) values
  ('T01',  1, 'intern',   'Bamhackl/Alumni-Boxe'),
  ('T02',  2, 'intern',   'Eltern-Ehrenloge'),
  ('T03',  3, 'buchbar',  null),
  ('T04',  4, 'buchbar',  null),
  ('T05',  5, 'intern',   'SJB-Tisch 1'),
  ('T06',  6, 'buchbar',  null),
  ('T07',  7, 'gesperrt', null),
  ('T08',  8, 'buchbar',  null),
  ('T09',  9, 'gesperrt', null),
  ('T10', 10, 'intern',   'SJB-Tisch 2'),
  ('T11', 11, 'gesperrt', null),
  ('T12', 12, 'buchbar',  null),
  ('T13', 13, 'gesperrt', null)
on conflict (id) do nothing;
