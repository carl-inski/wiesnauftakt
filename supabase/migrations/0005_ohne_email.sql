-- =============================================================================
-- Wiesnauftakt 2026 – E-Mail wird nicht mehr abgefragt
-- =============================================================================
-- Gaeste geben nur noch optional eine Handynummer an. Den Weg zurueck zur
-- eigenen Reservierung kennt der Browser (Cookie) und der persoenliche Link.
-- Die Spalte bleibt bestehen, damit Altbestand erhalten bleibt – sie ist nur
-- nicht mehr verpflichtend.
-- =============================================================================

alter table reservierungen alter column kontakt_email drop not null;

comment on column reservierungen.kontakt_email is
  'Nur noch fuer Altbestand. Neue Reservierungen erfassen keine E-Mail mehr.';
