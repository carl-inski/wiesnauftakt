-- -----------------------------------------------------------------------------
-- Kontaktadresse auf das echte Postfach der Pfarrjugend umstellen.
--
-- Die bisherige Adresse war ein Platzhalter aus der Aufbauphase – auf dieses
-- Postfach hat niemand Zugriff, Antworten waeren also ins Leere gelaufen.
--
-- 0003_seed.sql legt den Wert nur bei einer leeren Datenbank an
-- (on conflict do nothing), deshalb hier ein ausdrueckliches Update fuer die
-- bereits laufende Installation.
-- -----------------------------------------------------------------------------
update einstellungen
   set wert = to_jsonb('sjb.pfarrjugend@gmx.de'::text)
 where key = 'kontakt_email';
