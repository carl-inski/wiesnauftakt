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
  ('ort_adresse',              to_jsonb('München'::text),             'Adresse fuer Mail und .ics'),
  ('kontakt_email',            to_jsonb('wiesnauftakt@pfarrjugend-sjb.de'::text), 'Ruecklaufadresse'),
  ('hinweis_startseite',       to_jsonb(''::text),                    'Optionaler Hinweis oben auf der Startseite')
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Tische. Die ids entsprechen data/tische.json.
-- Start: 5 Tische online (T03–T06, T08), 5 fest vergeben, 3 noch gesperrt.
-- -----------------------------------------------------------------------------
insert into tische (id, nummer, status, interner_titel) values
  ('T01',  1, 'intern',   'Band'),
  ('T02',  2, 'intern',   'SJB-Tisch 1'),
  ('T03',  3, 'buchbar',  null),
  ('T04',  4, 'buchbar',  null),
  ('T05',  5, 'buchbar',  null),
  ('T06',  6, 'buchbar',  null),
  ('T07',  7, 'intern',   'SJB-Tisch 2'),
  ('T08',  8, 'buchbar',  null),
  ('T09',  9, 'gesperrt', null),
  ('T10', 10, 'gesperrt', null),
  ('T11', 11, 'gesperrt', null),
  ('T12', 12, 'intern',   'Eltern'),
  ('T13', 13, 'intern',   'Alumni / Bamhackl-Boxe')
on conflict (id) do nothing;
