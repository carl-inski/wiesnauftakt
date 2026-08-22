#!/usr/bin/env bash
# Zwei Leute im Orgateam bestaetigen gleichzeitig zwei konkurrierende Anfragen
# auf denselben Tisch.
#
# Seit 0009 faellt die Entscheidung nicht mehr beim Anfragen – beide Gruppen
# duerfen anfragen, das ist der Sinn der Sache. Der gefaehrliche Moment ist das
# Bestaetigen. Erwartet: eine Bestaetigung geht durch, die andere wartet auf die
# Tischzeile und faellt danach mit TISCH_VOLL raus; der Tisch ist am Ende genau
# einmal belegt, nicht doppelt.
set -euo pipefail

DB="${WIESN_TESTDB:-wiesn_test}"
ARBEIT="$(mktemp -d)"
trap 'rm -rf "$ARBEIT"' EXIT
cd "$(dirname "$0")/.."

psql -q -d "$DB" -c "
create or replace function testpersonen(n int, praefix text) returns jsonb
language sql as \$\$
  select jsonb_agg(jsonb_build_object('vorname', praefix||i, 'nachname','Test','alter_jahre',20))
  from generate_series(1,n) i;
\$\$;
create or replace function res_id(p_token text) returns uuid
language sql as \$\$ select id from reservierungen where token = p_token; \$\$;"

# Beide Anfragen entstehen ohne Konflikt – genau das ist die neue Regel.
psql -q -d "$DB" -c "
select reservierung_anlegen('T12','Gruppe A','par-a','a@a.de',null,testpersonen(8,'A'));
select reservierung_anlegen('T12','Gruppe B','par-b','b@b.de',null,testpersonen(8,'B'));"
echo -n "Beide Anfragen angelegt, Belegung T12 (muss 0 sein): "
psql -qtA -d "$DB" -c "select tisch_belegt('T12');"
echo

mkfifo "$ARBEIT/a.fifo"
psql -q -d "$DB" -f "$ARBEIT/a.fifo" > "$ARBEIT/a.out" 2>&1 &
exec 3> "$ARBEIT/a.fifo"

# A bestaetigt 8 von 12 Plaetzen und haelt die Transaktion offen.
echo "BEGIN;" >&3
echo "select reservierung_entscheiden(res_id('par-a'), 'bestaetigt');" >&3
sleep 1

# B bestaetigt gleichzeitig die zweite Gruppe – muss auf die Tischzeile warten.
( psql -q -d "$DB" -c \
    "select reservierung_entscheiden(res_id('par-b'), 'bestaetigt');" \
    > "$ARBEIT/b.out" 2>&1 ) &
BPID=$!
sleep 2

echo "B wartet auf:"
psql -qtA -d "$DB" -c \
  "select wait_event_type||'/'||wait_event from pg_stat_activity
   where state='active' and query like '%par-b%';"

echo "COMMIT;" >&3
exec 3>&-
wait "$BPID" || true
sleep 1

echo
echo "A: $(grep -c 'bestaetigt' "$ARBEIT/a.out" || true) Bestaetigung(en) erfolgreich"
echo "B: $(cat "$ARBEIT/b.out")"
echo
echo -n "Belegung T12 (muss 8 sein): "
psql -qtA -d "$DB" -c "select tisch_belegt('T12');"

psql -q -d "$DB" -c "drop function testpersonen(int, text); drop function res_id(text);"
