#!/usr/bin/env node
/**
 * FIX REMAINING RLS - Apply to tables that were missed
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const TABLES_TO_FIX = [
  'Account', 'AlertRule', 'Assignment', 'AuditLog', 'ChatSession',
  'CoachAthleteRelation', 'CrisisAlert', 'Goal', 'Intervention',
  'KnowledgeBase', 'MoodLog', 'PerformanceMetric', 'User',
  'UserSettings', 'WearableConnection'
];

// Policies to create for each table
const POLICIES = {
  User: [
    `CREATE POLICY "Users can view own profile" ON "User" FOR SELECT USING (id = auth.uid()::text)`,
    `CREATE POLICY "Users can update own profile" ON "User" FOR UPDATE USING (id = auth.uid()::text)`,
    `CREATE POLICY "Service role User" ON "User" FOR ALL USING (auth.role() = 'service_role')`
  ],
  Athlete: [
    `CREATE POLICY "Athletes can manage own" ON "Athlete" FOR ALL USING ("userId" = auth.uid()::text)`,
    `CREATE POLICY "Service role Athlete" ON "Athlete" FOR ALL USING (auth.role() = 'service_role')`
  ],
  Account: [
    `CREATE POLICY "Users can view own accounts" ON "Account" FOR SELECT USING ("userId" = auth.uid()::text)`,
    `CREATE POLICY "Service role Account" ON "Account" FOR ALL USING (auth.role() = 'service_role')`
  ],
  AlertRule: [
    `CREATE POLICY "Coaches can manage own alerts" ON "AlertRule" FOR ALL USING ("coachId" = auth.uid()::text)`,
    `CREATE POLICY "Service role AlertRule" ON "AlertRule" FOR ALL USING (auth.role() = 'service_role')`
  ],
  Assignment: [
    `CREATE POLICY "Coaches can manage own assignments" ON "Assignment" FOR ALL USING ("coachId" = auth.uid()::text)`,
    `CREATE POLICY "Service role Assignment" ON "Assignment" FOR ALL USING (auth.role() = 'service_role')`
  ],
  AuditLog: [
    `CREATE POLICY "Service role only AuditLog" ON "AuditLog" FOR ALL USING (auth.role() = 'service_role')`
  ],
  ChatSession: [
    `CREATE POLICY "Athletes can manage own sessions" ON "ChatSession" FOR ALL USING ("athleteId" = auth.uid()::text)`,
    `CREATE POLICY "Service role ChatSession" ON "ChatSession" FOR ALL USING (auth.role() = 'service_role')`
  ],
  CoachAthleteRelation: [
    `CREATE POLICY "Coaches can view own relations" ON "CoachAthleteRelation" FOR SELECT USING ("coachId" = auth.uid()::text)`,
    `CREATE POLICY "Athletes can view relations to them" ON "CoachAthleteRelation" FOR SELECT USING ("athleteId" = auth.uid()::text)`,
    `CREATE POLICY "Service role CoachAthleteRelation" ON "CoachAthleteRelation" FOR ALL USING (auth.role() = 'service_role')`
  ],
  CrisisAlert: [
    `CREATE POLICY "Athletes can view own alerts" ON "CrisisAlert" FOR SELECT USING ("athleteId" = auth.uid()::text)`,
    `CREATE POLICY "Service role CrisisAlert" ON "CrisisAlert" FOR ALL USING (auth.role() = 'service_role')`
  ],
  Goal: [
    `CREATE POLICY "Athletes can manage own goals" ON "Goal" FOR ALL USING ("athleteId" = auth.uid()::text)`,
    `CREATE POLICY "Service role Goal" ON "Goal" FOR ALL USING (auth.role() = 'service_role')`
  ],
  Intervention: [
    `CREATE POLICY "Athletes can manage own interventions" ON "Intervention" FOR ALL USING ("athleteId" = auth.uid()::text)`,
    `CREATE POLICY "Service role Intervention" ON "Intervention" FOR ALL USING (auth.role() = 'service_role')`
  ],
  KnowledgeBase: [
    `CREATE POLICY "Authenticated can read KB" ON "KnowledgeBase" FOR SELECT USING (auth.role() = 'authenticated')`,
    `CREATE POLICY "Service role KnowledgeBase" ON "KnowledgeBase" FOR ALL USING (auth.role() = 'service_role')`
  ],
  MoodLog: [
    `CREATE POLICY "Athletes can manage own mood" ON "MoodLog" FOR ALL USING ("athleteId" = auth.uid()::text)`,
    `CREATE POLICY "Service role MoodLog" ON "MoodLog" FOR ALL USING (auth.role() = 'service_role')`
  ],
  PerformanceMetric: [
    `CREATE POLICY "Athletes can manage own metrics" ON "PerformanceMetric" FOR ALL USING ("athleteId" = auth.uid()::text)`,
    `CREATE POLICY "Service role PerformanceMetric" ON "PerformanceMetric" FOR ALL USING (auth.role() = 'service_role')`
  ],
  UserSettings: [
    `CREATE POLICY "Users can manage own settings" ON "UserSettings" FOR ALL USING ("userId" = auth.uid()::text)`,
    `CREATE POLICY "Service role UserSettings" ON "UserSettings" FOR ALL USING (auth.role() = 'service_role')`
  ],
  WearableConnection: [
    `CREATE POLICY "Athletes can manage own wearable" ON "WearableConnection" FOR ALL USING ("athleteId" = auth.uid()::text)`,
    `CREATE POLICY "Service role WearableConnection" ON "WearableConnection" FOR ALL USING (auth.role() = 'service_role')`
  ]
};

async function fix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('\n=== FIXING REMAINING RLS ISSUES ===\n');

  try {
    await client.connect();
    console.log('✓ Connected\n');

    // Step 1: Enable RLS on remaining tables
    console.log('Step 1: Enabling RLS on remaining tables...\n');

    for (const table of TABLES_TO_FIX) {
      try {
        await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
        console.log(`  ✓ RLS enabled on ${table}`);
      } catch (err) {
        if (err.message.includes('does not exist')) {
          console.log(`  ⚠ Table ${table} does not exist`);
        } else {
          console.log(`  ⚠ ${table}: ${err.message}`);
        }
      }
    }

    // Step 2: Create policies
    console.log('\nStep 2: Creating policies...\n');

    for (const [table, policies] of Object.entries(POLICIES)) {
      console.log(`  ${table}:`);
      for (const policy of policies) {
        try {
          await client.query(policy);
          console.log(`    ✓ Policy created`);
        } catch (err) {
          if (err.message.includes('already exists')) {
            console.log(`    - Policy already exists`);
          } else {
            console.log(`    ⚠ ${err.message.substring(0, 50)}`);
          }
        }
      }
    }

    // Step 3: Verify
    console.log('\n=== VERIFICATION ===\n');

    const rlsCheck = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public' AND rowsecurity = false
        AND tablename NOT LIKE 'checkpoint%'
        AND tablename NOT LIKE 'chat_%'
      ORDER BY tablename;
    `);

    if (rlsCheck.rows.length === 0) {
      console.log('✅ ALL TABLES NOW HAVE RLS ENABLED!\n');
    } else {
      console.log('⚠ Tables still without RLS:');
      rlsCheck.rows.forEach(r => console.log(`  - ${r.tablename}`));
    }

    const policyCount = await client.query(`
      SELECT COUNT(*) as count FROM pg_policies WHERE schemaname = 'public';
    `);
    console.log(`\nTotal policies: ${policyCount.rows[0].count}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

fix();
