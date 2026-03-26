#!/usr/bin/env node
/**
 * COMPREHENSIVE DATABASE SECURITY AUDIT
 *
 * Run: node scripts/security-audit.js
 *
 * Checks:
 * 1. RLS enabled on all tables
 * 2. Policy count per table
 * 3. Missing policies on sensitive tables
 * 4. Wrong column references in policies
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// All tables from Prisma schema (46 tables)
// Note: Some tables may have different names in DB (e.g., chat_summaries vs ChatSummary)
const ALL_TABLES = [
  'Account', 'AlertRule', 'Assignment', 'AssignmentSubmission', 'Athlete',
  'AthleteModel', 'AuditLog', 'ChatInsight', 'ChatSession', 'chat_summaries',
  'Coach', 'CoachAthleteRelation', 'CoachDigest', 'CoachDigestPreferences',
  'CoachNote', 'CoachTouchpoint', 'ConversationInsight', 'CrisisAlert',
  'ErrorLog', 'GameResult', 'GameSchedule', 'GeneratedAlert', 'Goal',
  'Intervention', 'InterventionOutcome', 'KnowledgeBase', 'Message', 'MoodLog',
  'PerformanceMetric', 'PerformanceOutcome', 'PreGameSession', 'PredictionLog',
  'PushToken', 'ReadinessScore', 'School', 'Session', 'Task', 'TaskPattern',
  'TeamConfig', 'TokenUsage', 'User', 'UserSettings', 'VerificationToken',
  'WearableConnection', 'WearableData', 'WearableDataPoint'
];

// Tables that MUST have RLS for security (contain sensitive athlete data)
const CRITICAL_TABLES = [
  'User', 'Athlete', 'Coach', 'MoodLog', 'Goal', 'Task', 'ChatSession',
  'Message', 'ChatInsight', 'chat_summaries', 'CrisisAlert', 'ConversationInsight',
  'PerformanceMetric', 'PerformanceOutcome', 'GameResult', 'ReadinessScore',
  'Intervention', 'InterventionOutcome', 'WearableConnection', 'WearableData',
  'WearableDataPoint', 'AthleteModel', 'PredictionLog', 'CoachNote',
  'CoachAthleteRelation', 'GeneratedAlert', 'CoachTouchpoint', 'AuditLog'
];

// Tables that use athleteId (not userId) - common source of bugs
const ATHLETE_ID_TABLES = [
  'MoodLog', 'Goal', 'Task', 'ChatSession', 'ChatInsight', 'chat_summaries',
  'PerformanceMetric', 'PerformanceOutcome', 'GameResult', 'ReadinessScore',
  'Intervention', 'WearableConnection', 'WearableData', 'WearableDataPoint',
  'AthleteModel', 'PredictionLog', 'CrisisAlert', 'ConversationInsight',
  'GeneratedAlert', 'CoachTouchpoint', 'GameSchedule', 'PreGameSession', 'TaskPattern'
];

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runAudit() {
  console.log('\n' + '='.repeat(60));
  console.log('   DATABASE SECURITY AUDIT - Flow Sports Coach');
  console.log('='.repeat(60) + '\n');

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    const results = {
      critical: [],
      warnings: [],
      info: []
    };

    // ============================================
    // CHECK 1: RLS enabled on all tables
    // ============================================
    console.log('━'.repeat(50));
    console.log('CHECK 1: Row-Level Security (RLS) Status');
    console.log('━'.repeat(50) + '\n');

    const rlsQuery = await client.query(`
      SELECT tablename, rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    const rlsStatus = {};
    rlsQuery.rows.forEach(row => {
      rlsStatus[row.tablename] = row.rls_enabled;
    });

    let rlsDisabledCount = 0;
    let rlsDisabledCritical = 0;

    ALL_TABLES.forEach(table => {
      const enabled = rlsStatus[table];
      const isCritical = CRITICAL_TABLES.includes(table);

      if (enabled === undefined) {
        // Table doesn't exist in DB
        results.info.push(`Table "${table}" not found in database`);
      } else if (!enabled) {
        rlsDisabledCount++;
        if (isCritical) {
          rlsDisabledCritical++;
          results.critical.push(`RLS DISABLED on CRITICAL table: ${table}`);
          console.log(`  ❌ CRITICAL: ${table} - RLS DISABLED`);
        } else {
          results.warnings.push(`RLS disabled on table: ${table}`);
          console.log(`  ⚠️  WARNING: ${table} - RLS disabled`);
        }
      } else {
        console.log(`  ✅ ${table}`);
      }
    });

    console.log(`\n  Summary: ${ALL_TABLES.length - rlsDisabledCount}/${ALL_TABLES.length} tables have RLS enabled`);
    if (rlsDisabledCritical > 0) {
      console.log(`  🚨 ${rlsDisabledCritical} CRITICAL tables missing RLS!\n`);
    }

    // ============================================
    // CHECK 2: Policy count per table
    // ============================================
    console.log('\n' + '━'.repeat(50));
    console.log('CHECK 2: RLS Policy Count');
    console.log('━'.repeat(50) + '\n');

    const policyQuery = await client.query(`
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY tablename
      ORDER BY tablename;
    `);

    const policyCount = {};
    policyQuery.rows.forEach(row => {
      policyCount[row.tablename] = parseInt(row.policy_count);
    });

    let tablesNoPolicies = 0;
    CRITICAL_TABLES.forEach(table => {
      const count = policyCount[table] || 0;
      if (count === 0) {
        tablesNoPolicies++;
        results.critical.push(`No policies on CRITICAL table: ${table}`);
        console.log(`  ❌ ${table}: 0 policies (CRITICAL)`);
      } else if (count < 2) {
        results.warnings.push(`Only ${count} policy on table: ${table}`);
        console.log(`  ⚠️  ${table}: ${count} policy (may need more)`);
      } else {
        console.log(`  ✅ ${table}: ${count} policies`);
      }
    });

    const totalPolicies = Object.values(policyCount).reduce((a, b) => a + b, 0);
    console.log(`\n  Total policies: ${totalPolicies}`);

    // ============================================
    // CHECK 3: Wrong column references
    // ============================================
    console.log('\n' + '━'.repeat(50));
    console.log('CHECK 3: Policy Column References');
    console.log('━'.repeat(50) + '\n');

    // Check for policies that reference userId on tables that use athleteId
    const wrongColumnQuery = await client.query(`
      SELECT tablename, policyname, qual::text as definition
      FROM pg_policies
      WHERE schemaname = 'public'
        AND qual::text LIKE '%"userId"%'
        AND tablename = ANY($1::text[]);
    `, [ATHLETE_ID_TABLES]);

    if (wrongColumnQuery.rows.length > 0) {
      console.log('  ❌ Found policies referencing wrong column (userId vs athleteId):\n');
      wrongColumnQuery.rows.forEach(row => {
        results.critical.push(`Wrong column in policy "${row.policyname}" on ${row.tablename}`);
        console.log(`     Table: ${row.tablename}`);
        console.log(`     Policy: ${row.policyname}`);
        console.log(`     Issue: References "userId" but table uses "athleteId"\n`);
      });
    } else {
      console.log('  ✅ No incorrect column references found');
    }

    // ============================================
    // CHECK 4: Service role bypass verification
    // ============================================
    console.log('\n' + '━'.repeat(50));
    console.log('CHECK 4: Special Checks');
    console.log('━'.repeat(50) + '\n');

    // Check if AuditLog has restrictive policies (should be admin-only)
    const auditQuery = await client.query(`
      SELECT policyname, cmd, roles
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'AuditLog';
    `);

    if (auditQuery.rows.length === 0) {
      results.warnings.push('AuditLog has no RLS policies - should be restricted');
      console.log('  ⚠️  AuditLog has no policies (should be admin-only)');
    } else {
      console.log(`  ✅ AuditLog has ${auditQuery.rows.length} policies`);
    }

    // Check WearableConnection (OAuth tokens - HIGHLY SENSITIVE)
    const wearableQuery = await client.query(`
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'WearableConnection';
    `);

    if (wearableQuery.rows.length === 0) {
      results.critical.push('WearableConnection has no policies - OAuth tokens exposed!');
      console.log('  ❌ WearableConnection has no policies (OAuth tokens exposed!)');
    } else {
      console.log(`  ✅ WearableConnection has ${wearableQuery.rows.length} policies`);
    }

    // ============================================
    // FINAL REPORT
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('   AUDIT SUMMARY');
    console.log('='.repeat(60) + '\n');

    if (results.critical.length > 0) {
      console.log('🚨 CRITICAL ISSUES (' + results.critical.length + '):\n');
      results.critical.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log('');
    }

    if (results.warnings.length > 0) {
      console.log('⚠️  WARNINGS (' + results.warnings.length + '):\n');
      results.warnings.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log('');
    }

    if (results.critical.length === 0 && results.warnings.length === 0) {
      console.log('✅ No security issues found!\n');
    }

    // Return exit code
    if (results.critical.length > 0) {
      console.log('❌ AUDIT FAILED - Critical issues must be fixed\n');
      process.exit(1);
    } else if (results.warnings.length > 0) {
      console.log('⚠️  AUDIT PASSED WITH WARNINGS\n');
      process.exit(0);
    } else {
      console.log('✅ AUDIT PASSED\n');
      process.exit(0);
    }

  } catch (err) {
    console.error('❌ Audit Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runAudit();
