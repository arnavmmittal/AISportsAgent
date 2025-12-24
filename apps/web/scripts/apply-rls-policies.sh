#!/bin/bash

# Apply RLS Security Policies to Supabase
# This script enables Row Level Security on all database tables

set -e  # Exit on error

echo "🔒 Applying RLS Security Policies to Supabase..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo "   Please set it in your .env.local file or export it:"
  echo "   export DATABASE_URL='your-supabase-connection-string'"
  exit 1
fi

# Confirm before proceeding
echo "⚠️  WARNING: This will enable Row Level Security on ALL tables."
echo "   Make sure you have a backup of your database before proceeding."
echo ""
read -p "   Do you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
  echo "❌ Aborted by user"
  exit 1
fi

# Apply the migration
echo "📝 Applying RLS policies..."
psql "$DATABASE_URL" < prisma/migrations/enable_rls_security.sql

echo ""
echo "✅ RLS policies successfully applied!"
echo ""
echo "🔐 Security features enabled:"
echo "   ✓ Multi-tenant isolation (schoolId-based)"
echo "   ✓ Role-based access control (ATHLETE, COACH, ADMIN)"
echo "   ✓ Coach-athlete consent enforcement"
echo "   ✓ Privacy-protected chat summaries"
echo "   ✓ Crisis alert escalation controls"
echo ""
echo "📊 Next steps:"
echo "   1. Test your application to ensure data access works correctly"
echo "   2. Verify that users can only see their own data"
echo "   3. Check that coaches can only see consented athlete data"
echo "   4. Monitor Supabase logs for any RLS violations"
echo ""
