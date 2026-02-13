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
npx prisma db push --url "$DATABASE_URL" --accept-data-loss --skip-generate

echo "Ensuring data is seeded"
node prisma/seed.js

echo "Starting application..."
exec node server.js
