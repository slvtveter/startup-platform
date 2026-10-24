#!/bin/sh
# Ежедневный pg_dump в формате custom, хранение BACKUP_KEEP_DAYS дней.
set -eu
while true; do
  /bin/sh /scripts/backup.sh || echo "backup failed" >&2
  sleep 86400
done
