-- =============================================================================
-- Wiesnauftakt 2026 – Tischbelegung nach Absprache
-- =============================================================================
--   fest vergeben : T01 Bamhackl/Alumni-Boxe, T02 Eltern-Ehrenloge,
--                   T05 SJB-Tisch 1, T10 SJB-Tisch 2
--   online buchbar: T03, T04, T06, T08, T12
--   gesperrt      : T07, T09, T11, T13
-- =============================================================================

update tische set status = 'intern', interner_titel = 'Bamhackl/Alumni-Boxe' where id = 'T01';
update tische set status = 'intern', interner_titel = 'Eltern-Ehrenloge'     where id = 'T02';
update tische set status = 'intern', interner_titel = 'SJB-Tisch 1'          where id = 'T05';
update tische set status = 'intern', interner_titel = 'SJB-Tisch 2'          where id = 'T10';

update tische set status = 'buchbar', interner_titel = null
 where id in ('T03', 'T04', 'T06', 'T08', 'T12');

update tische set status = 'gesperrt', interner_titel = null
 where id in ('T07', 'T09', 'T11', 'T13');

update tische set aktualisiert_am = now();
