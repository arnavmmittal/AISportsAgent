#!/bin/bash

# Backup Supabase Database
# Creates timestamped backup before applying RLS policies

set -e  # Exit on error

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/database"
BACKUP_FILE="$BACKUP_DIR/backup_before_rls_${TIMESTAMP}.sql"

echo "📦 Creating database backup..."
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  # Try to load from .env.local
  if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | grep DATABASE_URL | xargs)
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found"
  exit 1
fi

echo "🔄 Backing up database to: $BACKUP_FILE"

# Create full database backup (schema + data)
pg_dump "$DATABASE_URL" \
  --file="$BACKUP_FILE" \
  --format=plain \
  --no-owner \
  --no-acl \
  --verbose

echo ""
echo "✅ Backup created successfully!"
echo "📁 Location: $BACKUP_FILE"
echo "📊 Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""
echo "To restore this backup later:"
echo "  psql \"\$DATABASE_URL\" < $BACKUP_FILE"
echo ""
