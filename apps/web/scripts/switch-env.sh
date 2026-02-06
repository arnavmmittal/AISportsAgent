#!/bin/bash
# Switch .env.local between staging and production

ENV_DIR="$(dirname "$0")/.."
BRANCH=$(git branch --show-current)

if [ "$1" = "staging" ] || [ "$BRANCH" = "staging" ]; then
  if [ -f "$ENV_DIR/.env.staging.local" ]; then
    cp "$ENV_DIR/.env.staging.local" "$ENV_DIR/.env.local"
    echo "✅ Switched to STAGING environment"
  else
    echo "❌ .env.staging.local not found"
    exit 1
  fi
elif [ "$1" = "production" ] || [ "$1" = "main" ] || [ "$BRANCH" = "main" ]; then
  if [ -f "$ENV_DIR/.env.production.local" ]; then
    cp "$ENV_DIR/.env.production.local" "$ENV_DIR/.env.local"
    echo "✅ Switched to PRODUCTION environment"
  else
    echo "❌ .env.production.local not found"
    exit 1
  fi
else
  echo "Usage: ./scripts/switch-env.sh [staging|production]"
  echo "Or run without args to auto-detect from git branch"
  exit 1
fi
