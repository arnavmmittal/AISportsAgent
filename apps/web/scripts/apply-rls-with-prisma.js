#!/usr/bin/env node

/**
 * Apply RLS Security Policies via Prisma
 * Uses Prisma's raw SQL execution to apply the RLS migration
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Applying RLS Security Policies...\n');

  // Read the RLS migration file
  const sqlPath = path.join(__dirname, '../prisma/migrations/enable_rls_security.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Error: RLS migration file not found at:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('📄 Migration file loaded');
  console.log('📊 Size:', (sql.length / 1024).toFixed(2), 'KB');
  console.log('📝 Executing SQL statements...\n');

  try {
    // Split by semicolons but keep DO blocks together
    const statements = sql
      .split(/;(?=\s*(?:CREATE|ALTER|GRANT|DROP|DO\s+\$\$|--\s*=))/i)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🔄 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty or comment-only statements
      if (!statement || statement.match(/^\s*--/)) continue;

      try {
        // Add semicolon back
        await prisma.$executeRawUnsafe(statement + ';');
        successCount++;

        // Log progress every 10 statements
        if ((i + 1) % 10 === 0) {
          console.log(`✓ Processed ${i + 1}/${statements.length} statements`);
        }
      } catch (error) {
        // Some errors are expected (e.g., policy already exists)
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Skipping: ${error.message.split('\n')[0]}`);
          successCount++;
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message.split('\n')[0]);
          errorCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n✅ RLS policies successfully applied!\n');
      console.log('🔐 Security features enabled:');
      console.log('   ✓ Multi-tenant isolation (schoolId-based)');
      console.log('   ✓ Role-based access control (ATHLETE, COACH, ADMIN)');
      console.log('   ✓ Coach-athlete consent enforcement');
      console.log('   ✓ Privacy-protected chat summaries');
      console.log('   ✓ Crisis alert escalation controls\n');
    } else {
      console.log('\n⚠️  RLS policies applied with some errors');
      console.log('   Please review the errors above\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal error applying RLS policies:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
