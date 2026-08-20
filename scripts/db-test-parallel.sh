#!/usr/bin/env bash
# Zwei Gruppen greifen gleichzeitig nach den letzten Plaetzen desselben Tisches.
# Erwartet: eine Buchung geht durch, die andere faellt mit TISCH_VOLL raus,
# und der Tisch ist danach genau einmal belegt – nicht doppelt.
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
\$\$;"

mkfifo "$ARBEIT/a.fifo"
psql -q -d "$DB" -f "$ARBEIT/a.fifo" > "$ARBEIT/a.out" 2>&1 &
exec 3> "$ARBEIT/a.fifo"

# A nimmt 8 von 12 Plaetzen und haelt die Transaktion offen.
echo "BEGIN;" >&3
echo "select reservierung_anlegen('T12','Gruppe A','par-a','a@a.de',null,testpersonen(8,'A'));" >&3
sleep 1

# B will gleichzeitig 8 Plaetze – muss auf die Tischzeile warten.
( psql -q -d "$DB" -c \
    "select reservierung_anlegen('T12','Gruppe B','par-b','b@b.de',null,testpersonen(8,'B'));" \
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
echo "A: $(grep -c 'personen' "$ARBEIT/a.out" || true) Buchung(en) erfolgreich"
echo "B: $(cat "$ARBEIT/b.out")"
echo
echo -n "Belegung T12 (muss 8 sein): "
psql -qtA -d "$DB" -c "select tisch_belegt('T12');"

psql -q -d "$DB" -c "drop function testpersonen(int, text);"
