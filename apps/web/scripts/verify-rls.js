#!/usr/bin/env node

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyRLS() {
  try {
    await client.connect();

    // Check if RLS is enabled on key tables
    const { rows } = await client.query(`
      SELECT
        schemaname,
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('User', 'Athlete', 'MoodLog', 'Goal', 'ChatSession', 'Message', 'TokenUsage')
      ORDER BY tablename;
    `);

    console.log('\n📊 RLS Status for Key Tables:\n');
    rows.forEach(row => {
      const status = row.rls_enabled ? '✅ ENABLED' : '❌ DISABLED';
      console.log(`  ${status} - ${row.tablename}`);
    });

    const enabledCount = rows.filter(r => r.rls_enabled).length;
    console.log(`\n✅ ${enabledCount}/${rows.length} tables have RLS enabled\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

verifyRLS();
