#!/usr/bin/env node
/**
 * Reset Pilot Passwords
 *
 * Generates unique passwords for all pilot users and outputs a CSV
 * for secure distribution.
 *
 * Usage: node scripts/reset-pilot-passwords.js
 * Output: pilot-credentials.csv (DO NOT COMMIT THIS FILE)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generate readable password (no ambiguous chars like 0/O, 1/l)
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + '!2';
}

async function main() {
  console.log('=== Resetting Pilot Passwords ===\n');

  // Get all users from Supabase Auth
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }

  console.log(`Found ${authUsers.users.length} users in Supabase Auth\n`);

  const credentials = [];
  let updated = 0;
  let failed = 0;

  for (const user of authUsers.users) {
    const newPassword = generatePassword();

    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error(`❌ Failed to update ${user.email}: ${updateError.message}`);
      failed++;
      continue;
    }

    // Get user role from our User table
    const { data: userData } = await supabase
      .from('User')
      .select('role, name')
      .eq('id', user.id)
      .single();

    credentials.push({
      email: user.email,
      password: newPassword,
      role: userData?.role || 'UNKNOWN',
      name: userData?.name || ''
    });

    console.log(`✅ ${user.email} → ${newPassword}`);
    updated++;
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);

  // Generate CSV
  const csvHeader = 'Name,Email,Password,Role\n';
  const csvRows = credentials.map(c =>
    `"${c.name}","${c.email}","${c.password}","${c.role}"`
  ).join('\n');

  const csvContent = csvHeader + csvRows;

  // Save to file
  const outputPath = 'pilot-credentials.csv';
  fs.writeFileSync(outputPath, csvContent);
  console.log(`\n📄 Credentials saved to: ${outputPath}`);
  console.log('\n⚠️  DO NOT COMMIT THIS FILE - Add to .gitignore!');

  // Also output to console for immediate use
  console.log('\n=== Credentials (copy this) ===\n');
  console.log(csvContent);
}

main().catch(console.error);
