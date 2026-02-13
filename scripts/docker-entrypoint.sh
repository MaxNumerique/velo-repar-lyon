#!/bin/sh

# Exit on error
set -e

echo "Waiting for database to be ready..."
# Simple check for database connectivity
until nc -z db 5432; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is up - executing migrations"
npx prisma migrate deploy

echo "Ensuring data is seeded"
node prisma/seed.js

echo "Starting application..."
exec node server.js
