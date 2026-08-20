-- =============================================================================
-- Wiesnauftakt 2026 – Funktionen
-- =============================================================================
-- Kern dieser Datei: Ein Tisch kann nicht ueberbucht werden. Die Garantie liegt
-- im Trigger gaeste_kapazitaet(), der VOR jedem Insert/Umzug die Tischzeile
-- sperrt (SELECT ... FOR UPDATE) und danach zaehlt. Zwei gleichzeitige Buchungen
-- auf denselben Tisch werden dadurch serialisiert: die zweite sieht die erste
-- bereits und faellt mit TISCH_VOLL raus. Das gilt fuer jeden Schreibweg,
-- auch fuer manuelle Inserts aus dem SQL-Editor.
--
-- Jede Funktion setzt ausserdem `search_path` fest. Ohne das koennte jemand mit
-- Schreibrecht auf ein frueher durchsuchtes Schema eigene Funktionen
-- unterschieben, die dann statt der hiesigen laufen. Supabase' Linter weist
-- zu Recht darauf hin (function_search_path_mutable).
-- =============================================================================

-- --- Einstellungen bequem lesen ---------------------------------------------
create or replace function einstellung_int(p_key text, p_default int)
returns int language sql stable
set search_path = public, pg_temp as $$
  select coalesce((select wert::int from einstellungen where key = p_key), p_default);
$$;

create or replace function einstellung_bool(p_key text, p_default boolean)
returns boolean language sql stable
set search_path = public, pg_temp as $$
  select coalesce((select wert::boolean from einstellungen where key = p_key), p_default);
$$;

create or replace function einstellung_text(p_key text, p_default text)
returns text language sql stable
set search_path = public, pg_temp as $$
  select coalesce((select wert #>> '{}' from einstellungen where key = p_key), p_default);
$$;

-- --- Kapazitaet eines konkreten Tisches --------------------------------------
create or replace function tisch_max_personen(p_tisch_id text)
returns int language sql stable
set search_path = public, pg_temp as $$
  select coalesce(
    (select max_personen from tische where id = p_tisch_id),
    einstellung_int('max_personen_pro_tisch', 12)
  );
$$;

-- Belegte Plaetze: vorgemerkt zaehlt ab dem Absenden, nicht erst ab Bestaetigung.
create or replace function tisch_belegt(p_tisch_id text)
returns int language sql stable
set search_path = public, pg_temp as $$
  select count(*)::int
  from gaeste g
  join reservierungen r on r.id = g.reservierung_id
  where g.tisch_id = p_tisch_id
    and r.status in ('angefragt', 'bestaetigt');
$$;

-- --- Kapazitaetsgarantie -----------------------------------------------------
create or replace function gaeste_kapazitaet()
returns trigger language plpgsql
set search_path = public, pg_temp as $$
declare
  v_max    int;
  v_belegt int;
begin
  -- Tischzeile sperren: ab hier ist dieser Tisch fuer andere Transaktionen dicht.
  perform 1 from tische where id = new.tisch_id for update;

  v_max    := tisch_max_personen(new.tisch_id);
  v_belegt := tisch_belegt(new.tisch_id);

  if v_belegt > v_max then
    raise exception 'TISCH_VOLL|%|%', new.tisch_id, v_max
      using errcode = '23514',
            hint = 'Auf diesem Tisch sind nicht mehr genug Plaetze frei.';
  end if;

  return null;
end;
$$;

drop trigger if exists gaeste_kapazitaet_trg on gaeste;
create constraint trigger gaeste_kapazitaet_trg
  after insert or update on gaeste
  deferrable initially deferred
  for each row execute function gaeste_kapazitaet();

-- Statuswechsel angefragt/bestaetigt -> zurueck kann nie ueberbuchen, nur der
-- Weg zurueck in eine zaehlende Reservierung. Deshalb hier ebenfalls pruefen.
create or replace function reservierung_kapazitaet()
returns trigger language plpgsql
set search_path = public, pg_temp as $$
declare
  r record;
begin
  if new.status not in ('angefragt', 'bestaetigt') then
    return null;
  end if;
  if old.status in ('angefragt', 'bestaetigt') then
    return null;
  end if;

  for r in select distinct tisch_id from gaeste where reservierung_id = new.id loop
    perform 1 from tische where id = r.tisch_id for update;
    if tisch_belegt(r.tisch_id) > tisch_max_personen(r.tisch_id) then
      raise exception 'TISCH_VOLL|%|%', r.tisch_id, tisch_max_personen(r.tisch_id)
        using errcode = '23514';
    end if;
  end loop;

  return null;
end;
$$;

drop trigger if exists reservierung_kapazitaet_trg on reservierungen;
create constraint trigger reservierung_kapazitaet_trg
  after update on reservierungen
  deferrable initially deferred
  for each row execute function reservierung_kapazitaet();

-- --- Reservierung anlegen ----------------------------------------------------
-- Deckt beide Wege ab: Tisch eroeffnen (p_tisch_name gesetzt, Tisch noch leer)
-- und Dazubuchen (Name bleibt, wie ihn die erste Person vergeben hat).
create or replace function reservierung_anlegen(
  p_tisch_id   text,
  p_tisch_name text,
  p_token      text,
  p_email      text,
  p_telefon    text,
  p_personen   jsonb   -- [{vorname, nachname, alter_jahre}], erste Person = Kontakt
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_tisch        tische%rowtype;
  v_max          int;
  v_belegt       int;
  v_neu          int;
  v_mindestalter int;
  v_res_id       uuid;
  v_person       jsonb;
  v_pos          int := 0;
  v_gesamt       int;
  v_gesamt_max   int;
begin
  if not einstellung_bool('reservierung_offen', true) then
    raise exception 'RESERVIERUNG_GESCHLOSSEN';
  end if;

  if now() > (einstellung_text('buchungsschluss', '2099-01-01T00:00:00Z'))::timestamptz then
    raise exception 'BUCHUNGSSCHLUSS';
  end if;

  v_neu := jsonb_array_length(p_personen);
  if v_neu is null or v_neu < 1 then
    raise exception 'KEINE_PERSONEN';
  end if;

  -- Tisch sperren, bevor irgendetwas gezaehlt wird.
  select * into v_tisch from tische where id = p_tisch_id for update;
  if not found then
    raise exception 'TISCH_UNBEKANNT';
  end if;
  if v_tisch.status <> 'buchbar' then
    raise exception 'TISCH_NICHT_BUCHBAR';
  end if;

  v_mindestalter := einstellung_int('mindestalter', 16);
  for v_person in select * from jsonb_array_elements(p_personen) loop
    if (v_person ->> 'alter_jahre')::int < v_mindestalter then
      raise exception 'MINDESTALTER|%', v_mindestalter;
    end if;
  end loop;

  v_max    := tisch_max_personen(p_tisch_id);
  v_belegt := tisch_belegt(p_tisch_id);
  if v_belegt + v_neu > v_max then
    raise exception 'TISCH_VOLL|%|%', p_tisch_id, v_max - v_belegt
      using errcode = '23514';
  end if;

  v_gesamt_max := einstellung_int('gesamt_obergrenze', 130);
  select count(*)::int into v_gesamt
  from gaeste g join reservierungen r on r.id = g.reservierung_id
  where r.status in ('angefragt', 'bestaetigt');
  if v_gesamt + v_neu > v_gesamt_max then
    raise exception 'GESAMT_OBERGRENZE|%', v_gesamt_max - v_gesamt;
  end if;

  -- Tischname vergibt, wer den Tisch eroeffnet. Sitzt schon jemand da und der
  -- Tisch hat einen Namen, bleibt der stehen – auch wenn beim Dazubuchen ein
  -- anderer mitgeschickt wird.
  if coalesce(btrim(p_tisch_name), '') <> ''
     and (v_belegt = 0 or v_tisch.oeffentlicher_name is null) then
    update tische
       set oeffentlicher_name = btrim(p_tisch_name), aktualisiert_am = now()
     where id = p_tisch_id;
  end if;

  insert into reservierungen (tisch_id, token, kontakt_email, kontakt_telefon)
  values (p_tisch_id, p_token, lower(btrim(p_email)), nullif(btrim(coalesce(p_telefon, '')), ''))
  returning id into v_res_id;

  for v_person in select * from jsonb_array_elements(p_personen) loop
    insert into gaeste (reservierung_id, tisch_id, vorname, nachname, alter_jahre,
                        ist_kontakt, position)
    values (v_res_id, p_tisch_id,
            btrim(v_person ->> 'vorname'),
            btrim(v_person ->> 'nachname'),
            (v_person ->> 'alter_jahre')::int,
            v_pos = 0, v_pos);
    v_pos := v_pos + 1;
  end loop;

  return jsonb_build_object(
    'reservierung_id', v_res_id,
    'tisch_id',        p_tisch_id,
    'token',           p_token,
    'personen',        v_neu
  );
end;
$$;

-- --- Gaesteliste einer Reservierung neu setzen -------------------------------
-- Erhaltend: Zeilen mit mitgegebener id werden aktualisiert, fehlende geloescht,
-- neue eingefuegt. Damit bleiben Check-in- und Pin-Status erhalten.
create or replace function reservierung_gaeste_setzen(
  p_reservierung_id uuid,
  p_personen        jsonb   -- [{id?, vorname, nachname, alter_jahre}]
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_res          reservierungen%rowtype;
  v_mindestalter int;
  v_person       jsonb;
  v_pos          int := 0;
  v_max          int;
  v_ids          uuid[] := '{}';
  v_id           uuid;
begin
  select * into v_res from reservierungen where id = p_reservierung_id;
  if not found then
    raise exception 'RESERVIERUNG_UNBEKANNT';
  end if;
  if v_res.status in ('abgelehnt', 'storniert') then
    raise exception 'RESERVIERUNG_NICHT_AENDERBAR';
  end if;
  if jsonb_array_length(p_personen) < 1 then
    raise exception 'KEINE_PERSONEN';
  end if;

  perform 1 from tische where id = v_res.tisch_id for update;

  v_mindestalter := einstellung_int('mindestalter', 16);
  for v_person in select * from jsonb_array_elements(p_personen) loop
    if (v_person ->> 'alter_jahre')::int < v_mindestalter then
      raise exception 'MINDESTALTER|%', v_mindestalter;
    end if;
  end loop;

  for v_person in select * from jsonb_array_elements(p_personen) loop
    if (v_person ->> 'id') is not null then
      update gaeste
         set vorname     = btrim(v_person ->> 'vorname'),
             nachname    = btrim(v_person ->> 'nachname'),
             alter_jahre = (v_person ->> 'alter_jahre')::int,
             ist_kontakt = false,
             position    = v_pos
       where id = (v_person ->> 'id')::uuid
         and reservierung_id = p_reservierung_id
      returning id into v_id;
      if v_id is null then
        raise exception 'GAST_UNBEKANNT';
      end if;
    else
      insert into gaeste (reservierung_id, tisch_id, vorname, nachname, alter_jahre,
                          ist_kontakt, position)
      values (p_reservierung_id, v_res.tisch_id,
              btrim(v_person ->> 'vorname'),
              btrim(v_person ->> 'nachname'),
              (v_person ->> 'alter_jahre')::int,
              false, v_pos)
      returning id into v_id;
    end if;
    v_ids := v_ids || v_id;
    v_pos := v_pos + 1;
  end loop;

  delete from gaeste
   where reservierung_id = p_reservierung_id
     and not (id = any (v_ids));

  -- Kontaktflag zum Schluss, wenn keine Altzeile mehr im Weg steht.
  update gaeste set ist_kontakt = (id = v_ids[1])
   where reservierung_id = p_reservierung_id;

  update reservierungen set aktualisiert_am = now() where id = p_reservierung_id;

  -- Kapazitaet wird vom deferred Constraint-Trigger beim Commit geprueft.
  return jsonb_build_object('personen', v_pos);
end;
$$;

-- --- Gast auf einen anderen Tisch setzen (Adminfunktion) ---------------------
create or replace function gast_verschieben(p_gast_id uuid, p_tisch_id text)
returns void language plpgsql
set search_path = public, pg_temp as $$
begin
  perform 1 from tische where id = p_tisch_id for update;
  if not found then
    raise exception 'TISCH_UNBEKANNT';
  end if;
  update gaeste set tisch_id = p_tisch_id where id = p_gast_id;
end;
$$;

-- --- Tischnamen aufraeumen ---------------------------------------------------
-- Wird ein Tisch wieder leer (alles storniert/abgelehnt), verliert er seinen
-- oeffentlichen Namen, damit die naechste Gruppe ihn neu vergeben kann.
create or replace function tisch_neu_bewerten(p_tisch_id text)
returns void language plpgsql
set search_path = public, pg_temp as $$
begin
  if tisch_belegt(p_tisch_id) = 0 then
    update tische
       set oeffentlicher_name = null, aktualisiert_am = now()
     where id = p_tisch_id and status = 'buchbar';
  end if;
end;
$$;
