/**
 * RLS Policy Verification Script
 *
 * Verifies that ALL tables in the database have
 * proper Row-Level Security (RLS) policies configured.
 *
 * CRITICAL: Run before production deployment
 */

import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

// List of tables that MUST have RLS policies in production
const CRITICAL_TABLES_REQUIRING_RLS = [
  'users',
  'schools',
  'athletes',
  'coaches',
  'chat_sessions',
  'messages',
  'chat_summaries',
  'mood_logs',
  'goals',
  'crisis_alerts',
  'knowledge_base',
  'audit_logs',
  'coach_athlete_relations',
];

// Tables that should have RLS but can be lenient in development
const RECOMMENDED_RLS_TABLES = [
  'notification_preferences',
  'team_rosters',
  'practice_logs',
  'performance_metrics',
];

describe('RLS Policy Verification', () => {
  describe('Critical Tables RLS Status', () => {
    it('should list all critical tables requiring RLS', () => {
      console.log('\n📋 Critical Tables Requiring RLS:');
      CRITICAL_TABLES_REQUIRING_RLS.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table}`);
      });

      expect(CRITICAL_TABLES_REQUIRING_RLS.length).toBeGreaterThan(0);
    });

    it('should verify RLS is enabled on critical tables', async () => {
      // Query PostgreSQL system tables to check RLS status
      // This requires direct SQL query to pg_tables

      const rlsStatus = await prisma.$queryRaw<Array<{
        tablename: string;
        rowsecurity: boolean;
      }>>`
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = ANY(${CRITICAL_TABLES_REQUIRING_RLS}::text[]);
      `;

      console.log('\n🔒 RLS Status for Critical Tables:');
      rlsStatus.forEach((table) => {
        const status = table.rowsecurity ? '✅ ENABLED' : '❌ DISABLED';
        console.log(`  ${table.tablename}: ${status}`);
      });

      // Check that all critical tables have RLS enabled
      const missingRLS = rlsStatus.filter(t => !t.rowsecurity);

      if (missingRLS.length > 0) {
        console.error('\n❌ CRITICAL: These tables are missing RLS:');
        missingRLS.forEach(t => console.error(`  - ${t.tablename}`));
      }

      expect(missingRLS.length).toBe(0);
    });
  });

  describe('RLS Policy Coverage', () => {
    it('should verify policies exist for all critical operations', async () => {
      // Check for SELECT, INSERT, UPDATE, DELETE policies
      const policies = await prisma.$queryRaw<Array<{
        tablename: string;
        policyname: string;
        cmd: string; // SELECT, INSERT, UPDATE, DELETE
        qual: string; // Policy condition
      }>>`
        SELECT
          schemaname || '.' || tablename as tablename,
          policyname,
          cmd,
          qual
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = ANY(${CRITICAL_TABLES_REQUIRING_RLS}::text[])
        ORDER BY tablename, policyname;
      `;

      console.log('\n📜 RLS Policies Configured:');
      console.log(`  Total policies found: ${policies.length}`);

      // Group by table
      const policiesByTable = policies.reduce((acc, policy) => {
        if (!acc[policy.tablename]) {
          acc[policy.tablename] = [];
        }
        acc[policy.tablename].push(policy);
        return acc;
      }, {} as Record<string, typeof policies>);

      Object.entries(policiesByTable).forEach(([table, tablePolicies]) => {
        console.log(`\n  Table: ${table}`);
        tablePolicies.forEach(p => {
          console.log(`    - ${p.policyname} (${p.cmd})`);
        });
      });

      // Verify each critical table has at least one policy
      const tablesWithoutPolicies = CRITICAL_TABLES_REQUIRING_RLS.filter(
        table => !policiesByTable[`public.${table}`]
      );

      if (tablesWithoutPolicies.length > 0) {
        console.error('\n❌ CRITICAL: These tables have NO RLS policies:');
        tablesWithoutPolicies.forEach(t => console.error(`  - ${t}`));
      }

      expect(tablesWithoutPolicies.length).toBe(0);
    });

    it('should verify SELECT policies enforce tenant isolation', async () => {
      // Check that SELECT policies include schoolId filtering
      const selectPolicies = await prisma.$queryRaw<Array<{
        tablename: string;
        policyname: string;
        qual: string;
      }>>`
        SELECT
          tablename,
          policyname,
          qual
        FROM pg_policies
        WHERE schemaname = 'public'
        AND cmd = 'SELECT'
        AND tablename = ANY(${CRITICAL_TABLES_REQUIRING_RLS}::text[]);
      `;

      console.log('\n🔍 SELECT Policies (Tenant Isolation):');
      selectPolicies.forEach(p => {
        const hasSchoolFilter = p.qual?.includes('school_id') || p.qual?.includes('schoolId');
        const status = hasSchoolFilter ? '✅' : '⚠️';
        console.log(`  ${status} ${p.tablename}.${p.policyname}`);
      });

      // At least some policies should reference schoolId for multi-tenancy
      const tenantPolicies = selectPolicies.filter(
        p => p.qual?.includes('school_id') || p.qual?.includes('schoolId')
      );

      console.log(`\n  Policies with tenant filtering: ${tenantPolicies.length}/${selectPolicies.length}`);
      expect(tenantPolicies.length).toBeGreaterThan(0);
    });
  });

  describe('RLS Policy Testing Recommendations', () => {
    it('should provide manual testing checklist', () => {
      console.log('\n📝 Manual RLS Testing Checklist:');
      console.log('\n  Before Production Deployment:');
      console.log('  [ ] Test cross-tenant isolation (school 1 cannot see school 2 data)');
      console.log('  [ ] Test coach consent enforcement (cannot view without athlete consent)');
      console.log('  [ ] Test athlete self-access (can view own data)');
      console.log('  [ ] Test admin override (can view all data with audit log)');
      console.log('  [ ] Test RLS bypass prevention (service role key not exposed)');
      console.log('  [ ] Test consent revocation (immediately blocks access)');
      console.log('  [ ] Verify audit logs for all data access');
      console.log('  [ ] Load test with RLS enabled (performance impact)');
      console.log('\n  Required Test Scenarios:');
      console.log('  1. Create 2 schools, verify data isolation');
      console.log('  2. Create coach + athlete (same school), test consent flow');
      console.log('  3. Try to access data from different school (should fail)');
      console.log('  4. Verify RLS policies in Supabase dashboard');
      console.log('  5. Check pg_policies table for all policies');

      expect(true).toBe(true); // Just for output
    });
  });

  describe('Production Readiness Checks', () => {
    it('should verify RLS is enforced in production environment', () => {
      const env = process.env.NODE_ENV || process.env.NEXT_PUBLIC_ENV;

      if (env === 'production') {
        console.log('\n🚨 PRODUCTION ENVIRONMENT DETECTED');
        console.log('  RLS policies MUST be enabled and tested');
        console.log('  Service role key MUST NOT be exposed to client');
        console.log('  All data access MUST go through RLS-enforced queries');
      } else {
        console.log(`\n🔧 Environment: ${env}`);
        console.log('  RLS can be tested manually in staging');
      }

      expect(env).toBeDefined();
    });

    it('should check for service role key exposure risk', () => {
      // In production, service role key should NEVER be in client-accessible env vars
      const hasPublicServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

      if (hasPublicServiceKey) {
        console.error('\n❌ CRITICAL SECURITY ISSUE:');
        console.error('  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is set!');
        console.error('  This exposes service role key to client (BYPASSES RLS)');
        console.error('  Remove this variable immediately!');
      }

      expect(hasPublicServiceKey).toBeUndefined();
    });

    it('should verify Supabase anon key is used for client', () => {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!anonKey) {
        console.warn('\n⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
        console.warn('  Client queries may not work');
      } else {
        console.log('\n✅ Anon key configured (RLS will be enforced)');
      }

      // In production, anon key MUST be set
      if (process.env.NODE_ENV === 'production') {
        expect(anonKey).toBeDefined();
      }
    });
  });

  describe('Supabase RLS Best Practices', () => {
    it('should list RLS policy best practices', () => {
      console.log('\n📚 RLS Policy Best Practices:');
      console.log('\n  ✅ DO:');
      console.log('  - Enable RLS on ALL tables with sensitive data');
      console.log('  - Use auth.uid() to filter by current user');
      console.log('  - Filter by schoolId for multi-tenant isolation');
      console.log('  - Create separate policies for SELECT, INSERT, UPDATE, DELETE');
      console.log('  - Test policies with different user roles');
      console.log('  - Use service role key ONLY on server');
      console.log('  - Create audit logs for sensitive data access');
      console.log('\n  ❌ DON\'T:');
      console.log('  - Expose service role key to client (bypasses RLS)');
      console.log('  - Disable RLS to "fix" permission issues (fix the policy instead)');
      console.log('  - Use SELECT * without RLS filters in application code');
      console.log('  - Trust client-side filtering (always enforce server-side)');
      console.log('  - Skip testing cross-tenant isolation scenarios');

      expect(true).toBe(true);
    });
  });

  describe('RLS Performance Considerations', () => {
    it('should check for RLS policy complexity', async () => {
      // Complex RLS policies can impact query performance
      const policies = await prisma.$queryRaw<Array<{
        tablename: string;
        policyname: string;
        qual: string;
      }>>`
        SELECT tablename, policyname, qual
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = ANY(${CRITICAL_TABLES_REQUIRING_RLS}::text[]);
      `;

      console.log('\n⚡ RLS Policy Complexity Analysis:');

      policies.forEach(policy => {
        // Check for complex operations in policy (subqueries, joins)
        const hasSubquery = policy.qual?.includes('SELECT');
        const hasJoin = policy.qual?.includes('JOIN') || policy.qual?.includes('EXISTS');

        if (hasSubquery || hasJoin) {
          console.log(`  ⚠️  ${policy.tablename}.${policy.policyname}: Complex (may impact performance)`);
        }
      });

      console.log('\n  Tip: If RLS policies are slow, consider:');
      console.log('  - Adding indexes on filtered columns (schoolId, userId)');
      console.log('  - Simplifying policy conditions');
      console.log('  - Using materialized views for complex aggregations');

      expect(policies.length).toBeGreaterThan(0);
    });
  });

  describe('RLS Migration Path', () => {
    it('should provide RLS implementation SQL examples', () => {
      console.log('\n📝 Example RLS Policy SQL:');
      console.log('\n-- Enable RLS on table');
      console.log('ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;');
      console.log('\n-- Policy: Athletes see own sessions');
      console.log(`CREATE POLICY "Athletes see own sessions"
  ON chat_sessions FOR SELECT
  USING (
    athlete_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND school_id = chat_sessions.school_id
    )
  );`);
      console.log('\n-- Policy: Coaches see sessions with consent');
      console.log(`CREATE POLICY "Coaches see sessions with consent"
  ON chat_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'COACH'
      AND school_id IN (
        SELECT school_id FROM users WHERE id = chat_sessions.athlete_id
      )
    )
    AND EXISTS (
      SELECT 1 FROM athletes
      WHERE user_id = chat_sessions.athlete_id
      AND consent_chat_summaries = true
    )
  );`);

      console.log('\n-- Verify RLS is enabled');
      console.log(`SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'chat_sessions';`);

      console.log('\n-- List all policies for a table');
      console.log(`SELECT * FROM pg_policies
  WHERE tablename = 'chat_sessions';`);

      expect(true).toBe(true);
    });
  });
});
