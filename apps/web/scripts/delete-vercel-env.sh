#!/bin/bash
# Delete all Vercel environment variables for Preview and Production
# Run: bash scripts/delete-vercel-env.sh

set -e

echo "🗑️  Deleting all Vercel environment variables..."
echo ""

# Get list of all env vars
ENV_VARS=$(vercel env ls 2>/dev/null | grep -E "^\w" | awk '{print $1}' | sort -u)

if [ -z "$ENV_VARS" ]; then
  echo "No environment variables found."
  exit 0
fi

echo "Found environment variables:"
echo "$ENV_VARS"
echo ""

# Delete each env var for all environments
for VAR in $ENV_VARS; do
  echo "Deleting $VAR..."

  # Delete from preview
  echo "y" | vercel env rm "$VAR" preview 2>/dev/null || true

  # Delete from production
  echo "y" | vercel env rm "$VAR" production 2>/dev/null || true

  # Delete from development
  echo "y" | vercel env rm "$VAR" development 2>/dev/null || true
done

echo ""
echo "✅ All environment variables deleted!"
echo ""
echo "Now import vercel-staging.env for Preview environment:"
echo "  vercel env pull .env.local"
echo "  Or use Vercel dashboard to import vercel-staging.env"
