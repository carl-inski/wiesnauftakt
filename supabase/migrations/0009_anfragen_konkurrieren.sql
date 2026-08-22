-- =============================================================================
-- Wiesnauftakt 2026 – Anfragen konkurrieren um denselben Tisch
-- =============================================================================
-- Bisher galt: Absenden belegt den Platz. Wer zuerst kam, hatte den Tisch, und
-- alle weiteren setzten sich dazu, bis er voll war.
--
-- Ab jetzt gilt: Eine Anfrage ist ein Angebot. Mehrere Gruppen duerfen
-- denselben Tisch anfragen, ohne sich gegenseitig zu blockieren, und das
-- Orgateam sucht aus. Belegt ist ein Platz erst mit der Bestaetigung.
--
-- Daraus folgt dreierlei:
--
--   1. tisch_belegt() zaehlt nur noch bestaetigte Gaeste. Damit rechnen
--      automatisch alle Anzeigen, Fuellstaende und Kapazitaetspruefungen mit
--      der neuen Wahrheit.
--   2. Der Tischname darf nicht mehr beim Anfragen gesetzt werden – sonst
--      stuende der Wunschname einer Gruppe oeffentlich auf dem Plan, bevor
--      ueberhaupt entschieden ist. Er wandert in reservierungen.tisch_name_
--      wunsch und kommt erst bei der Bestaetigung auf den Tisch.
--   3. Die Ueberbuchungsgarantie verschiebt sich vom Anlegen auf das
--      Bestaetigen. Genau dort sperrt reservierung_entscheiden() jetzt die
--      Tischzeile und zaehlt nach; die beiden Constraint-Trigger bleiben als
--      letzte Absicherung fuer jeden anderen Schreibweg bestehen.
-- =============================================================================

alter table reservierungen add column if not exists tisch_name_wunsch text;

comment on column reservierungen.tisch_name_wunsch is
  'Wunschname aus dem Formular. Landet erst bei der Bestaetigung auf dem Tisch.';

-- -----------------------------------------------------------------------------
-- Belegung: nur bestaetigte Gaeste zaehlen
-- -----------------------------------------------------------------------------
create or replace function tisch_belegt(p_tisch_id text)
returns int language sql stable
set search_path = public, pg_temp as $$
  select count(*)::int
  from gaeste g
  join reservierungen r on r.id = g.reservierung_id
  where g.tisch_id = p_tisch_id
    and r.status = 'bestaetigt';
$$;

comment on function tisch_belegt(text) is
  'Bestaetigte Personen an diesem Tisch. Offene Anfragen zaehlen bewusst nicht.';

-- Belegung ohne eine bestimmte Reservierung – fuer Pruefungen, bei denen die
-- eigenen Leute nicht doppelt zaehlen duerfen.
create or replace function tisch_belegt_ohne(p_tisch_id text, p_reservierung_id uuid)
returns int language sql stable
set search_path = public, pg_temp as $$
  select count(*)::int
  from gaeste g
  join reservierungen r on r.id = g.reservierung_id
  where g.tisch_id = p_tisch_id
    and r.status = 'bestaetigt'
    and g.reservierung_id <> p_reservierung_id;
$$;

-- -----------------------------------------------------------------------------
-- Statuswechsel: nur der Weg nach 'bestaetigt' kann ueberbuchen
-- -----------------------------------------------------------------------------
create or replace function reservierung_kapazitaet()
returns trigger language plpgsql
set search_path = public, pg_temp as $$
declare
  r record;
begin
  if new.status <> 'bestaetigt' then
    return null;
  end if;
  if old.status = 'bestaetigt' then
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

-- -----------------------------------------------------------------------------
-- Anfrage anlegen
-- -----------------------------------------------------------------------------
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

  -- Gegen die bereits bestaetigten Leute geprueft: Was jetzt schon nicht mehr
  -- passt, koennte auch spaeter niemand bestaetigen. Offene Anfragen anderer
  -- Gruppen stehen hier bewusst nicht im Weg.
  v_max    := tisch_max_personen(p_tisch_id);
  v_belegt := tisch_belegt(p_tisch_id);
  if v_belegt + v_neu > v_max then
    raise exception 'TISCH_VOLL|%|%', p_tisch_id, v_max - v_belegt
      using errcode = '23514';
  end if;

  v_gesamt_max := einstellung_int('gesamt_obergrenze', 130);
  select count(*)::int into v_gesamt
  from gaeste g join reservierungen r on r.id = g.reservierung_id
  where r.status = 'bestaetigt';
  if v_gesamt + v_neu > v_gesamt_max then
    raise exception 'GESAMT_OBERGRENZE|%', v_gesamt_max - v_gesamt;
  end if;

  insert into reservierungen (tisch_id, token, kontakt_email, kontakt_telefon,
                              tisch_name_wunsch)
  values (p_tisch_id, p_token, lower(btrim(p_email)),
          nullif(btrim(coalesce(p_telefon, '')), ''),
          nullif(btrim(coalesce(p_tisch_name, '')), ''))
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

-- -----------------------------------------------------------------------------
-- Entscheiden: hier faellt die Ueberbuchungsgarantie
-- -----------------------------------------------------------------------------
create or replace function reservierung_entscheiden(
  p_id     uuid,
  p_status text,      -- 'bestaetigt' | 'abgelehnt'
  p_grund  text default null
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_res            reservierungen%rowtype;
  v_max            int;
  v_belegt         int;
  v_eigene_tisch   int;   -- eigene Leute an diesem Tisch
  v_eigene_gesamt  int;   -- eigene Leute insgesamt (koennen umgesetzt sein)
  v_gesamt         int;
  v_gesamt_max     int;
begin
  if p_status not in ('bestaetigt', 'abgelehnt') then
    raise exception 'STATUS_UNBEKANNT';
  end if;

  select * into v_res from reservierungen where id = p_id;
  if not found then
    raise exception 'RESERVIERUNG_UNBEKANNT';
  end if;

  -- Tischzeile sperren: zwei gleichzeitige Bestaetigungen auf denselben Tisch
  -- werden dadurch serialisiert, die zweite sieht die erste bereits.
  perform 1 from tische where id = v_res.tisch_id for update;

  if p_status = 'bestaetigt' and v_res.status <> 'bestaetigt' then
    v_max    := tisch_max_personen(v_res.tisch_id);
    v_belegt := tisch_belegt_ohne(v_res.tisch_id, p_id);

    select count(*)::int into v_eigene_tisch
      from gaeste where reservierung_id = p_id and tisch_id = v_res.tisch_id;

    if v_belegt + v_eigene_tisch > v_max then
      raise exception 'TISCH_VOLL|%|%', v_res.tisch_id, v_max - v_belegt
        using errcode = '23514';
    end if;

    v_gesamt_max := einstellung_int('gesamt_obergrenze', 130);
    select count(*)::int into v_gesamt
      from gaeste g join reservierungen r on r.id = g.reservierung_id
     where r.status = 'bestaetigt' and r.id <> p_id;
    select count(*)::int into v_eigene_gesamt from gaeste where reservierung_id = p_id;
    if v_gesamt + v_eigene_gesamt > v_gesamt_max then
      raise exception 'GESAMT_OBERGRENZE|%', v_gesamt_max - v_gesamt;
    end if;
  end if;

  update reservierungen
     set status          = p_status,
         ablehnung_grund = case when p_status = 'abgelehnt'
                                then nullif(btrim(coalesce(p_grund, '')), '')
                                else null end,
         entschieden_am  = now(),
         aktualisiert_am = now()
   where id = p_id;

  if p_status = 'bestaetigt' then
    -- Den Namen vergibt die erste Gruppe, die den Tisch tatsaechlich bekommt.
    update tische
       set oeffentlicher_name = btrim(v_res.tisch_name_wunsch),
           aktualisiert_am    = now()
     where id = v_res.tisch_id
       and oeffentlicher_name is null
       and coalesce(btrim(v_res.tisch_name_wunsch), '') <> '';
  else
    perform tisch_neu_bewerten(v_res.tisch_id);
  end if;

  return jsonb_build_object('status', p_status, 'tisch_id', v_res.tisch_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- Gaesteliste nachtraeglich aendern
-- -----------------------------------------------------------------------------
-- Die Kapazitaet muss hier ausdruecklich geprueft werden: Der Constraint-
-- Trigger sieht nur bestaetigte Gaeste und wuerde eine offene Anfrage beliebig
-- wachsen lassen – die waere dann nie bestaetigbar.
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
  v_anzahl       int;
  v_max          int;
  v_belegt       int;
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

  v_anzahl := jsonb_array_length(p_personen);
  if v_anzahl is null or v_anzahl < 1 then
    raise exception 'KEINE_PERSONEN';
  end if;

  perform 1 from tische where id = v_res.tisch_id for update;

  v_max    := tisch_max_personen(v_res.tisch_id);
  v_belegt := tisch_belegt_ohne(v_res.tisch_id, p_reservierung_id);
  if v_belegt + v_anzahl > v_max then
    raise exception 'TISCH_VOLL|%|%', v_res.tisch_id, v_max - v_belegt
      using errcode = '23514';
  end if;

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

  update gaeste set ist_kontakt = (id = v_ids[1])
   where reservierung_id = p_reservierung_id;

  update reservierungen set aktualisiert_am = now() where id = p_reservierung_id;

  return jsonb_build_object('personen', v_pos);
end;
$$;

-- -----------------------------------------------------------------------------
-- Gast umsetzen: der alte Tisch muss neu bewertet werden
-- -----------------------------------------------------------------------------
-- Setzt das Orgateam die letzte Person von einem Tisch herunter, blieb bisher
-- der Tischname stehen – auf einem Tisch, an dem niemand mehr sitzt. Das fiel
-- vorher nicht auf, weil offene Anfragen als Belegung zaehlten und ein Tisch
-- praktisch nie auf null fiel.
create or replace function gast_verschieben(p_gast_id uuid, p_tisch_id text)
returns void language plpgsql
set search_path = public, pg_temp as $$
declare
  v_alt text;
begin
  select tisch_id into v_alt from gaeste where id = p_gast_id;
  if v_alt is null then
    raise exception 'GAST_UNBEKANNT';
  end if;

  perform 1 from tische where id = p_tisch_id for update;
  if not found then
    raise exception 'TISCH_UNBEKANNT';
  end if;

  update gaeste set tisch_id = p_tisch_id where id = p_gast_id;

  if v_alt <> p_tisch_id then
    perform tisch_neu_bewerten(v_alt);
  end if;
end;
$$;
