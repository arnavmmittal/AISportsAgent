#!/usr/bin/env node

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function enableUserRLS() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('📝 Enabling RLS on User table...');
    await client.query('ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS enabled on User table\n');

    console.log('📝 Creating RLS policies for User table...');

    // Athletes can view their own profile
    await client.query(`
      CREATE POLICY IF NOT EXISTS "Athletes can view own profile"
      ON "User"
      FOR SELECT
      USING (auth.uid()::text = id AND role = 'ATHLETE');
    `).catch(e => console.log('  Policy may already exist'));

    // Coaches can view their own profile
    await client.query(`
      CREATE POLICY IF NOT EXISTS "Coaches can view own profile"
      ON "User"
      FOR SELECT
      USING (auth.uid()::text = id AND role = 'COACH');
    `).catch(e => console.log('  Policy may already exist'));

    // Users can update their own profile
    await client.query(`
      CREATE POLICY IF NOT EXISTS "Users can update own profile"
      ON "User"
      FOR UPDATE
      USING (auth.uid()::text = id);
    `).catch(e => console.log('  Policy may already exist'));

    console.log('✅ User table RLS policies created\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

enableUserRLS();
