#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTestUser() {
  try {
    console.log('🚀 Creating/updating test user...\n');

    // Step 1: Check if user exists in Supabase Auth
    console.log('📝 Step 1: Checking Supabase Auth...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    let existingUser = users.find(u => u.email === 'test@athlete.com');

    if (existingUser) {
      console.log(`✅ Found existing user in Auth: ${existingUser.id}\n`);
      await insertUserToDatabase(existingUser.id);
    } else {
      // Create new user in Supabase Auth
      console.log('📝 Creating new user in Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'test@athlete.com',
        password: 'test123456',
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: 'Test Athlete',
          role: 'ATHLETE',
        },
      });

      if (authError) {
        throw authError;
      }

      console.log(`✅ User created in Auth: ${authData.user.id}\n`);

      // Step 2: Insert into database
      await insertUserToDatabase(authData.user.id);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

async function insertUserToDatabase(userId) {
  try {
    await pgClient.connect();
    console.log('📝 Step 2: Checking if School exists...');

    // Check if School table has any records
    const { rows: schools } = await pgClient.query('SELECT id FROM "School" LIMIT 1');

    let schoolId;
    if (schools.length === 0) {
      console.log('📝 Creating default school...');
      const { rows: newSchool } = await pgClient.query(`
        INSERT INTO "School" (id, name, "createdAt", "updatedAt")
        VALUES ('school-001', 'Default University', NOW(), NOW())
        RETURNING id
      `);
      schoolId = newSchool[0].id;
      console.log(`✅ Created school: ${schoolId}\n`);
    } else {
      schoolId = schools[0].id;
      console.log(`✅ Using existing school: ${schoolId}\n`);
    }

    console.log('📝 Step 3: Inserting user into User table...');

    // Check if user already exists
    const { rows: existingUsers } = await pgClient.query(
      'SELECT id FROM "User" WHERE id = $1',
      [userId]
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  User already exists in User table');
      console.log('📝 Updating password hash...');

      // Hash the password
      const hashedPassword = await bcrypt.hash('test123456', 10);

      // Update with hashed password
      await pgClient.query(
        'UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE id = $2',
        [hashedPassword, userId]
      );
      console.log('✅ Password hash updated\n');
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash('test123456', 10);

      await pgClient.query(`
        INSERT INTO "User" (id, email, name, role, password, "emailVerified", "schoolId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [userId, 'test@athlete.com', 'Test Athlete', 'ATHLETE', hashedPassword, new Date(), schoolId]);
      console.log(`✅ User inserted into User table\n`);
    }

    console.log('📝 Step 4: Creating Athlete profile...');

    // Check if athlete profile exists
    const { rows: existingAthletes } = await pgClient.query(
      'SELECT "userId" FROM "Athlete" WHERE "userId" = $1',
      [userId]
    );

    if (existingAthletes.length > 0) {
      console.log('⚠️  Athlete profile already exists\n');
    } else {
      await pgClient.query(`
        INSERT INTO "Athlete" ("userId", sport, year, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [userId, 'Basketball', 'Junior']);
      console.log(`✅ Athlete profile created\n`);
    }

    console.log('✅ Test user setup complete!\n');
    console.log('📧 Email: test@athlete.com');
    console.log('🔑 Password: test123456');
    console.log('🆔 User ID: ' + userId);
    console.log('\n🌐 You can now login at: http://localhost:3000/auth/signin\n');

  } catch (err) {
    console.error('❌ Database error:', err.message);
    throw err;
  } finally {
    await pgClient.end();
  }
}

createTestUser();
