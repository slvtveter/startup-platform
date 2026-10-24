#!/bin/sh
set -eu
STAMP=$(date -u +%Y-%m-%dT%H%M%SZ)
FILE="/backups/${PGDATABASE}-${STAMP}.dump"
pg_dump -Fc -f "$FILE.partial"
mv "$FILE.partial" "$FILE"
# Загруженные файлы (аватары, KAN-34) — рядом с дампом базы.
if [ -d /media ]; then
  tar -czf "/backups/media-${STAMP}.tar.gz.partial" -C /media .
  mv "/backups/media-${STAMP}.tar.gz.partial" "/backups/media-${STAMP}.tar.gz"
fi
find /backups \( -name "*.dump" -o -name "media-*.tar.gz" \) -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete
echo "backup ok: $FILE ($(du -h "$FILE" | cut -f1))"
# Копию вне сервера делает отдельный cron на хосте (rclone/s3), см. docs/deploy.md.
