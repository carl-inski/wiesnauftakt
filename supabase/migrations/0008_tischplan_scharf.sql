-- =============================================================================
-- Wiesnauftakt 2026 – Tischbelegung zum Start der echten Reservierung
-- =============================================================================
-- Loest 0006 ab. Die SJB-Tische wandern von 5 und 10 auf 6 und 7, dafuer gehen
-- 5, 9 und 11 online; 4, 8 und 10 sind vorerst gesperrt.
--
--   fest vergeben : T01 Bamhackl/Alumni-Boxe, T02 Eltern-Ehrenloge,
--                   T06 SJB-Tisch 1, T07 SJB-Tisch 2
--   online buchbar: T03, T05, T09, T11, T12
--   gesperrt      : T04, T08, T10, T13
--
-- Der oeffentliche Name wird ueberall dort geleert, wo ein Tisch nicht mehr
-- buchbar ist – sonst stuende der Name einer alten Runde auf einem Tisch, den
-- niemand mehr eroeffnen kann.
-- =============================================================================

update tische set status = 'intern', interner_titel = 'Bamhackl/Alumni-Boxe' where id = 'T01';
update tische set status = 'intern', interner_titel = 'Eltern-Ehrenloge'     where id = 'T02';
update tische set status = 'intern', interner_titel = 'SJB-Tisch 1'          where id = 'T06';
update tische set status = 'intern', interner_titel = 'SJB-Tisch 2'          where id = 'T07';

update tische set status = 'buchbar', interner_titel = null
 where id in ('T03', 'T05', 'T09', 'T11', 'T12');

update tische set status = 'gesperrt', interner_titel = null
 where id in ('T04', 'T08', 'T10', 'T13');

update tische set oeffentlicher_name = null where status <> 'buchbar';

update tische set aktualisiert_am = now();
