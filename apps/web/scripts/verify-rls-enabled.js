#!/usr/bin/env node

/**
 * Verify RLS is Enabled
 * Checks if Row Level Security is enabled on all tables
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking RLS status on all tables...\n');

  try {
    // Check which tables have RLS enabled
    const result = await prisma.$queryRawUnsafe(`
      SELECT
        tablename,
        rowsecurity AS rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const totalTables = result.length;
    const rlsEnabled = result.filter(r => r.rls_enabled).length;
    const rlsDisabled = result.filter(r => !r.rls_enabled).length;

    console.log('📊 RLS Status Summary:');
    console.log('='.repeat(60));
    console.log(`Total tables: ${totalTables}`);
    console.log(`✅ RLS enabled: ${rlsEnabled}`);
    console.log(`❌ RLS disabled: ${rlsDisabled}`);
    console.log('='.repeat(60));
    console.log('');

    if (rlsDisabled > 0) {
      console.log('⚠️  Tables without RLS:');
      result
        .filter(r => !r.rls_enabled)
        .forEach(r => console.log(`   🔴 ${r.tablename}`));
      console.log('');
      console.log('❌ RLS is NOT fully enabled!');
      console.log('📖 See APPLY_RLS_INSTRUCTIONS.md for setup guide');
    } else {
      console.log('✅ All tables have RLS enabled!');

      // Check if policies exist
      const policies = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count
        FROM pg_policies
        WHERE schemaname = 'public'
      `);

      const policyCount = Number(policies[0].count);

      console.log(`🔐 Total RLS policies: ${policyCount}`);
      console.log('');
      console.log('🎉 Your database is secure!');
    }

  } catch (error) {
    console.error('❌ Error checking RLS status:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
