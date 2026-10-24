#!/bin/sh
# Восстановление: docker compose -f compose.prod.yml exec backup sh /scripts/restore.sh /backups/<file>.dump
# ВНИМАНИЕ: перезаписывает текущую базу.
set -eu
FILE=${1:?"usage: restore.sh /backups/<file>.dump"}
pg_restore --clean --if-exists --no-owner -d "$PGDATABASE" "$FILE"
echo "restored from $FILE"
