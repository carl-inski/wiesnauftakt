-- =============================================================================
-- Wiesnauftakt 2026 – Schema
-- =============================================================================
-- Grundhaltung: Es gibt genau einen Zugriffsweg auf diese Daten, naemlich den
-- Next.js-Server mit dem Service-Role-Key. RLS ist auf allen Tabellen aktiv und
-- es existiert bewusst KEINE Policy. Damit sieht ein anon-Key nichts, selbst
-- wenn er versehentlich ins Frontend geraet.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Einstellungen: alles was sich bis September noch aendert
-- -----------------------------------------------------------------------------
create table if not exists einstellungen (
  key             text primary key,
  wert            jsonb not null,
  beschreibung    text,
  aktualisiert_am timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Tische
-- -----------------------------------------------------------------------------
-- status:
--   'buchbar'  – online reservierbar
--   'gesperrt' – im Plan sichtbar, aber noch nicht freigeschaltet
--   'intern'   – fest vergeben (Eltern, SJB, Alumni, Band), gedimmt, nicht klickbar
create table if not exists tische (
  id                 text primary key,          -- 'T01' .. 'T13', identisch zu data/tische.json
  nummer             int  not null unique,
  status             text not null default 'gesperrt'
                       check (status in ('buchbar', 'gesperrt', 'intern')),
  oeffentlicher_name text,                      -- vom Eroeffner vergeben, z.B. "Zeltlager-Crew"
  interner_titel     text,                      -- nur fuer status='intern', z.B. "Alumni / Bamhackl-Boxe"
  max_personen       int check (max_personen is null or max_personen between 1 and 40),
  notiz              text,
  aktualisiert_am    timestamptz not null default now()
);

comment on column tische.max_personen is
  'Ueberschreibt die globale Einstellung max_personen_pro_tisch. NULL = globaler Wert.';

-- -----------------------------------------------------------------------------
-- Reservierungen (= eine Anfrage einer buchenden Person)
-- -----------------------------------------------------------------------------
create table if not exists reservierungen (
  id               uuid primary key default gen_random_uuid(),
  tisch_id         text not null references tische(id) on update cascade,
  token            text not null unique,        -- Verwaltungslink
  kontakt_email    text not null,
  kontakt_telefon  text,
  status           text not null default 'angefragt'
                     check (status in ('angefragt', 'bestaetigt', 'abgelehnt', 'storniert')),
  ablehnung_grund  text,
  notiz_intern     text,
  erstellt_am      timestamptz not null default now(),
  aktualisiert_am  timestamptz not null default now(),
  entschieden_am   timestamptz
);

create index if not exists reservierungen_tisch_idx  on reservierungen (tisch_id);
create index if not exists reservierungen_email_idx  on reservierungen (lower(kontakt_email));
create index if not exists reservierungen_status_idx on reservierungen (status);

-- -----------------------------------------------------------------------------
-- Gaeste (= einzelne Personen)
-- -----------------------------------------------------------------------------
-- gaeste.tisch_id ist die Sitz-Wahrheit. Sie kann vom tisch_id der Reservierung
-- abweichen, wenn das Orga-Team eine einzelne Person umsetzt.
create table if not exists gaeste (
  id                uuid primary key default gen_random_uuid(),
  reservierung_id   uuid not null references reservierungen(id) on delete cascade,
  tisch_id          text not null references tische(id) on update cascade,
  vorname           text not null check (length(btrim(vorname)) between 1 and 60),
  nachname          text not null check (length(btrim(nachname)) between 1 and 60),
  alter_jahre       int  not null check (alter_jahre between 0 and 120),
  ist_kontakt       boolean not null default false,
  position          int not null default 0,
  eingecheckt_am    timestamptz,
  pin_ausgegeben_am timestamptz,
  erstellt_am       timestamptz not null default now()
);

create index if not exists gaeste_reservierung_idx on gaeste (reservierung_id);
create index if not exists gaeste_tisch_idx        on gaeste (tisch_id);
create index if not exists gaeste_name_idx         on gaeste (lower(vorname), lower(nachname));

-- Pro Reservierung genau eine Kontaktperson
create unique index if not exists gaeste_ein_kontakt_idx
  on gaeste (reservierung_id) where ist_kontakt;

-- -----------------------------------------------------------------------------
-- Mailprotokoll – damit im Zweifel nachvollziehbar ist, was rausging
-- -----------------------------------------------------------------------------
create table if not exists mail_log (
  id              uuid primary key default gen_random_uuid(),
  empfaenger      text not null,
  art             text not null,
  reservierung_id uuid references reservierungen(id) on delete set null,
  erfolgreich     boolean not null default true,
  fehler          text,
  gesendet_am     timestamptz not null default now()
);

create index if not exists mail_log_empfaenger_idx on mail_log (lower(empfaenger), gesendet_am desc);

alter table einstellungen  enable row level security;
alter table tische         enable row level security;
alter table reservierungen enable row level security;
alter table gaeste         enable row level security;
alter table mail_log       enable row level security;
