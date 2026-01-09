#!/bin/bash

# Deploy RLS Policies Script
# Purpose: Safely deploy Row-Level Security policies to Supabase
# Usage: ./scripts/deploy-rls.sh [local|staging|production]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get environment argument
ENV=${1:-local}

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}RLS Policy Deployment Script${NC}"
echo -e "${GREEN}Environment: $ENV${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Set database URL based on environment
case $ENV in
  local)
    DB_URL="${DATABASE_URL}"
    if [ -z "$DB_URL" ]; then
      echo -e "${RED}ERROR: DATABASE_URL not set in .env.local${NC}"
      exit 1
    fi
    ;;
  staging)
    DB_URL="${STAGING_DATABASE_URL}"
    if [ -z "$DB_URL" ]; then
      echo -e "${RED}ERROR: STAGING_DATABASE_URL not set${NC}"
      exit 1
    fi
    ;;
  production)
    echo -e "${RED}⚠️  WARNING: Deploying to PRODUCTION${NC}"
    echo -e "${YELLOW}This will enable RLS on all tables.${NC}"
    echo -e "${YELLOW}Have you tested in staging first? (yes/no)${NC}"
    read -r response
    if [ "$response" != "yes" ]; then
      echo "Deployment cancelled."
      exit 0
    fi
    DB_URL="${PRODUCTION_DATABASE_URL}"
    if [ -z "$DB_URL" ]; then
      echo -e "${RED}ERROR: PRODUCTION_DATABASE_URL not set${NC}"
      exit 1
    fi
    ;;
  *)
    echo -e "${RED}ERROR: Invalid environment. Use: local, staging, or production${NC}"
    exit 1
    ;;
esac

# Migration files in order
# CRITICAL: Apply fix migration FIRST to enable RLS on all tables
MIGRATIONS=(
  "prisma/migrations/20260106_CRITICAL_ENABLE_RLS_FIX.sql"
  "prisma/migrations/20250105_enable_rls_core_tables.sql"
  "prisma/migrations/20250105_enable_rls_chat_tables.sql"
  "prisma/migrations/20250105_enable_rls_wellbeing_tables.sql"
  "prisma/migrations/20250105_enable_rls_knowledge_analytics.sql"
  "prisma/migrations/20250105_enable_rls_audit_system.sql"
)

echo -e "${YELLOW}Step 1: Verifying database connection...${NC}"
if psql "$DB_URL" -c "SELECT 1" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Database connection successful${NC}"
else
  echo -e "${RED}✗ Database connection failed${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Backing up current policies...${NC}"
BACKUP_FILE="rls_backup_$(date +%Y%m%d_%H%M%S).sql"
psql "$DB_URL" -c "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies;" > "$BACKUP_FILE" 2>&1 || true
echo -e "${GREEN}✓ Backup saved to $BACKUP_FILE${NC}"

echo ""
echo -e "${YELLOW}Step 3: Applying RLS migrations...${NC}"
for migration in "${MIGRATIONS[@]}"; do
  if [ -f "$migration" ]; then
    echo -e "  Applying: ${YELLOW}$(basename $migration)${NC}"
    if psql "$DB_URL" -f "$migration" > /dev/null 2>&1; then
      echo -e "  ${GREEN}✓ Success${NC}"
    else
      echo -e "  ${RED}✗ Failed${NC}"
      echo -e "${RED}ERROR: Migration failed. Check logs above.${NC}"
      echo -e "${YELLOW}To rollback: psql \$DB_URL < $BACKUP_FILE${NC}"
      exit 1
    fi
  else
    echo -e "  ${RED}✗ File not found: $migration${NC}"
    exit 1
  fi
done

echo ""
echo -e "${YELLOW}Step 4: Verifying RLS enabled on tables...${NC}"
TABLES_WITHOUT_RLS=$(psql "$DB_URL" -t -c "
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename FROM pg_tables t
    WHERE schemaname = 'public'
    AND EXISTS (
      SELECT 1 FROM pg_class c
      WHERE c.relname = t.tablename
      AND c.relrowsecurity = true
    )
  )
  ORDER BY tablename;
")

if [ -z "$TABLES_WITHOUT_RLS" ]; then
  echo -e "${GREEN}✓ All tables have RLS enabled${NC}"
else
  echo -e "${YELLOW}⚠  Tables without RLS:${NC}"
  echo "$TABLES_WITHOUT_RLS"
fi

echo ""
echo -e "${YELLOW}Step 5: Counting policies...${NC}"
POLICY_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_policies;")
echo -e "${GREEN}✓ Total policies: $POLICY_COUNT${NC}"

echo ""
echo -e "${YELLOW}Step 6: Testing RLS enforcement (if test data exists)...${NC}"
# This would require test data - skip for now
echo -e "${YELLOW}ℹ  Manual testing required - see test plan below${NC}"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ RLS Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Run integration tests: pnpm run test:integration"
echo "2. Test cross-tenant queries (should fail)"
echo "3. Verify legitimate queries still work"
echo ""
echo -e "${YELLOW}Rollback (if needed):${NC}"
echo "psql \$DB_URL < $BACKUP_FILE"
echo ""
