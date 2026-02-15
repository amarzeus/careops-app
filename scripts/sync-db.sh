#!/bin/bash
# Safe Prisma Sync Script
# This script ensures that DATABASE_URL is read from .env and not overridden by system environment variables.

echo "🔄 Syncing SQLite database..."

# Explicitly unset DATABASE_URL to prevent PostgreSQL overrides from environment
unset DATABASE_URL

# Run prisma db push using the local .env file
npx prisma db push

if [ $? -eq 0 ]; then
  echo "✅ Database is in sync!"
else
  echo "❌ Failed to sync database."
  exit 1
fi
