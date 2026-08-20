-- =============================================================================
-- Wiesnauftakt 2026 – search_path festnageln
-- =============================================================================
-- Ohne festen search_path koennte jemand mit Schreibrecht auf ein frueher
-- durchsuchtes Schema eigene Funktionen unterschieben, die dann anstelle der
-- hiesigen laufen. Supabase' Linter meldet das als
-- function_search_path_mutable.
--
-- In 0002_funktionen.sql steht das inzwischen direkt an jeder Funktion. Diese
-- Datei zieht Datenbanken nach, die 0002 in der aelteren Fassung bekommen
-- haben. Fuer frische Installationen ist sie folgenlos.
-- =============================================================================

alter function einstellung_int(text, integer)          set search_path = public, pg_temp;
alter function einstellung_bool(text, boolean)         set search_path = public, pg_temp;
alter function einstellung_text(text, text)            set search_path = public, pg_temp;
alter function tisch_max_personen(text)                set search_path = public, pg_temp;
alter function tisch_belegt(text)                      set search_path = public, pg_temp;
alter function gaeste_kapazitaet()                     set search_path = public, pg_temp;
alter function reservierung_kapazitaet()               set search_path = public, pg_temp;
alter function reservierung_anlegen(text, text, text, text, text, jsonb)
                                                       set search_path = public, pg_temp;
alter function reservierung_gaeste_setzen(uuid, jsonb) set search_path = public, pg_temp;
alter function gast_verschieben(uuid, text)            set search_path = public, pg_temp;
alter function tisch_neu_bewerten(text)                set search_path = public, pg_temp;
