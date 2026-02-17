#!/usr/bin/env node
/**
 * EMERGENCY RLS FIX - Apply migration directly to database
 *
 * Run: node scripts/apply-emergency-rls.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('\n' + '='.repeat(60));
  console.log('   APPLYING EMERGENCY RLS FIX');
  console.log('='.repeat(60) + '\n');

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260217_EMERGENCY_RLS_FIX.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Loaded migration file: 20260217_EMERGENCY_RLS_FIX.sql');
    console.log('   Size:', (sql.length / 1024).toFixed(1), 'KB\n');

    // Split by semicolon and filter out comments/empty
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
    console.log('Applying migration...\n');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Extract operation type for logging
      const firstLine = stmt.split('\n')[0].trim();
      const operation = firstLine.substring(0, 60) + (firstLine.length > 60 ? '...' : '');

      try {
        await client.query(stmt);
        successCount++;

        // Show progress every 10 statements
        if (successCount % 10 === 0) {
          console.log(`   ✓ ${successCount}/${statements.length} statements executed`);
        }
      } catch (err) {
        errorCount++;
        errors.push({
          statement: operation,
          error: err.message
        });

        // Some errors are expected (e.g., policy already exists)
        if (err.message.includes('already exists')) {
          // Skip - policy already created
        } else {
          console.log(`   ⚠️  ${operation}`);
          console.log(`      Error: ${err.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('   MIGRATION COMPLETE');
    console.log('='.repeat(60) + '\n');

    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Errors: ${errorCount}`);

    if (errors.length > 0 && errors.some(e => !e.error.includes('already exists'))) {
      console.log('\n   Non-trivial errors:');
      errors
        .filter(e => !e.error.includes('already exists'))
        .slice(0, 5)
        .forEach(e => {
          console.log(`   - ${e.error}`);
        });
    }

    // Verify RLS is now enabled
    console.log('\n' + '━'.repeat(50));
    console.log('VERIFICATION');
    console.log('━'.repeat(50) + '\n');

    const rlsCheck = await client.query(`
      SELECT COUNT(*) as disabled_count
      FROM pg_tables
      WHERE schemaname = 'public' AND rowsecurity = false;
    `);

    const policyCheck = await client.query(`
      SELECT COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public';
    `);

    const disabledCount = parseInt(rlsCheck.rows[0].disabled_count);
    const policyCount = parseInt(policyCheck.rows[0].policy_count);

    console.log(`   Tables with RLS disabled: ${disabledCount}`);
    console.log(`   Total policies created: ${policyCount}`);

    if (disabledCount === 0 && policyCount > 80) {
      console.log('\n   ✅ RLS FIX SUCCESSFUL!\n');
    } else if (policyCount > 0) {
      console.log('\n   ⚠️  Partial fix applied - some tables may need manual attention\n');
    } else {
      console.log('\n   ❌ RLS fix may have failed - check errors above\n');
    }

  } catch (err) {
    console.error('❌ Fatal Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
