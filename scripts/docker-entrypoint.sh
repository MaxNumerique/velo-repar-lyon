#!/bin/sh

# Exit on error
set -e

echo "Waiting for database to be ready..."
# Simple check for database connectivity
until nc -z db 5432; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is up - syncing schema"
npx prisma db push --url "$DATABASE_URL" --accept-data-loss

echo "Ensuring data is seeded"
(sleep 5 && wget --post-data="" -q -O- "http://localhost:3000/api/admin/db/seed?secret=$CLERK_SECRET_KEY" || echo "Seeding skipped/failed (non-critical)") &

echo "Starting application..."
exec node server.js
