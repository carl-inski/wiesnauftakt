#!/usr/bin/env bash
# Legt eine Wegwerf-Datenbank an, spielt alle Migrationen ein und laesst die
# Regeltests laufen. Braucht ein erreichbares Postgres (PGHOST/PGPORT/PGUSER).
#
#   scripts/db-test.sh
#
# Der Nebenlaeufigkeitstest (zwei Gruppen greifen gleichzeitig nach den letzten
# Plaetzen) steckt in scripts/db-test-parallel.sh.
set -euo pipefail

DB="${WIESN_TESTDB:-wiesn_test}"
cd "$(dirname "$0")/.."

dropdb --if-exists "$DB"
createdb "$DB"

for f in supabase/migrations/*.sql; do
  echo "→ $f"
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" > /dev/null
done

echo
psql -q -d "$DB" -f supabase/tests/regeln.sql
