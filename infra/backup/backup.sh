#!/bin/sh
set -eu
STAMP=$(date -u +%Y-%m-%dT%H%M%SZ)
FILE="/backups/${PGDATABASE}-${STAMP}.dump"
pg_dump -Fc -f "$FILE.partial"
mv "$FILE.partial" "$FILE"
find /backups -name "*.dump" -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete
echo "backup ok: $FILE ($(du -h "$FILE" | cut -f1))"
# Копию вне сервера делает отдельный cron на хосте (rclone/s3), см. docs/deploy.md.
