#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Missing DATABASE_URL in .env.local');
  process.exit(1);
}

async function runMigration(filePath, migrationName) {
  console.log(`\n📄 Running ${migrationName}...`);

  const sql = fs.readFileSync(filePath, 'utf-8');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Split SQL into statements by semicolon (rough split)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s =>
        s &&
        s.length > 0 &&
        !s.startsWith('--') &&
        !s.match(/^-{5,}/) && // Skip comment lines
        !s.match(/^={5,}/)    // Skip separator lines
      );

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      try {
        await client.query(statement);
        successCount++;
      } catch (err) {
        // Skip errors for already existing policies/tables
        if (
          err.message.includes('already exists') ||
          err.message.includes('duplicate')
        ) {
          skipCount++;
        } else {
          console.error(`  ⚠️  Error:`, err.message.split('\n')[0]);
        }
      }
    }

    console.log(`✅ ${migrationName} completed: ${successCount} executed, ${skipCount} skipped`);
  } catch (err) {
    console.error(`❌ ${migrationName} failed:`, err.message);
    throw err;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Starting Supabase migrations...\n');

  const migrationsDir = path.join(__dirname, '../prisma/supabase-migrations');

  // Run migrations in order
  await runMigration(
    path.join(migrationsDir, '001_enable_rls_policies.sql'),
    'Migration 001: Enable RLS Policies'
  );

  console.log('\n✅ All migrations completed!\n');
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
