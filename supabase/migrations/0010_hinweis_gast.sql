-- =============================================================================
-- Wiesnauftakt 2026 – Hinweis an die Gruppe
-- =============================================================================
-- Bisher gab es genau einen Weg, einer Gruppe etwas zu schreiben: den Grund bei
-- einer Absage. Wer eine Zusage bekommt, sah nur den festen Satz "Bestätigt –
-- ihr seid dabei".
--
-- Das reicht nicht, sobald eine Zusage mit einer Einschraenkung kommt – etwa
-- wenn eine Gruppe auf einen anderen Tisch muss, weil der gewuenschte weg ist.
-- Solche Nachrichten muessen dort stehen, wo die Gruppe ohnehin nachschaut,
-- und nicht in einem Kanal, den es hier nicht gibt (Mail an Gaeste gibt es
-- bewusst nicht).
--
-- Deshalb ein Freitext je Reservierung, den die Gruppe unter "Meine Buchung"
-- und auf ihrer Verwaltungsseite sieht – unabhaengig vom Status.
-- =============================================================================

alter table reservierungen add column if not exists hinweis_gast text;

comment on column reservierungen.hinweis_gast is
  'Freitext, den diese Gruppe zu sehen bekommt. Anders als notiz_intern nicht intern.';

-- -----------------------------------------------------------------------------
-- Entscheiden nimmt den Hinweis gleich mit
-- -----------------------------------------------------------------------------
-- Der zusaetzliche Parameter steht hinten und hat einen Vorgabewert, damit
-- bestehende Aufrufe unveraendert weiterlaufen.
--
-- Erst die alte Fassung wegwerfen: "create or replace" ersetzt eine Funktion
-- nur bei gleicher Parameterzahl. Sonst stuenden beide nebeneinander und jeder
-- Aufruf mit drei Argumenten waere mehrdeutig ("is not unique") – also genau
-- der Aufruf, den das Orgateam beim Bestaetigen ausloest.
drop function if exists reservierung_entscheiden(uuid, text, text);

create or replace function reservierung_entscheiden(
  p_id      uuid,
  p_status  text,      -- 'bestaetigt' | 'abgelehnt'
  p_grund   text default null,
  p_hinweis text default null
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_res            reservierungen%rowtype;
  v_max            int;
  v_belegt         int;
  v_eigene_tisch   int;
  v_eigene_gesamt  int;
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
         -- Ein leer mitgeschickter Hinweis loescht einen alten nicht: sonst
         -- verschwindet er, sobald jemand die Entscheidung nur korrigiert.
         hinweis_gast    = coalesce(nullif(btrim(coalesce(p_hinweis, '')), ''),
                                    hinweis_gast),
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
-- Ganze Reservierung auf einen anderen Tisch setzen
-- -----------------------------------------------------------------------------
-- gast_verschieben() bewegt einzelne Personen und laesst die Reservierung auf
-- ihrem Tisch stehen. Wenn eine ganze Gruppe umzieht, muessen beide mit –
-- sonst prueft die Bestaetigung die Kapazitaet des alten Tisches und vergibt
-- dessen Namen.
create or replace function reservierung_verschieben(p_id uuid, p_tisch_id text)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_res    reservierungen%rowtype;
  v_alt    text;
  v_max    int;
  v_belegt int;
  v_eigene int;
begin
  select * into v_res from reservierungen where id = p_id;
  if not found then
    raise exception 'RESERVIERUNG_UNBEKANNT';
  end if;

  perform 1 from tische where id = p_tisch_id for update;
  if not found then
    raise exception 'TISCH_UNBEKANNT';
  end if;

  v_alt := v_res.tisch_id;
  if v_alt = p_tisch_id then
    return jsonb_build_object('tisch_id', p_tisch_id, 'verschoben', false);
  end if;

  select count(*)::int into v_eigene from gaeste where reservierung_id = p_id;
  v_max    := tisch_max_personen(p_tisch_id);
  v_belegt := tisch_belegt_ohne(p_tisch_id, p_id);
  if v_belegt + v_eigene > v_max then
    raise exception 'TISCH_VOLL|%|%', p_tisch_id, v_max - v_belegt
      using errcode = '23514';
  end if;

  update gaeste set tisch_id = p_tisch_id where reservierung_id = p_id;
  update reservierungen set tisch_id = p_tisch_id, aktualisiert_am = now()
   where id = p_id;

  perform tisch_neu_bewerten(v_alt);

  return jsonb_build_object('tisch_id', p_tisch_id, 'verschoben', true,
                            'personen', v_eigene, 'vorher', v_alt);
end;
$$;
