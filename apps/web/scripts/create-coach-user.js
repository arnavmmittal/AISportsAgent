#!/usr/bin/env node

/**
 * Create Coach User Script
 * Creates coach@uw.edu for testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Creating coach@uw.edu user...\n');

  // Get or create school
  let school = await prisma.school.findUnique({
    where: { id: 'mvp-university' }
  });

  if (!school) {
    school = await prisma.school.create({
      data: {
        id: 'mvp-university',
        name: 'MVP University',
        division: 'NCAA Division I',
      },
    });
    console.log(`✅ Created school: ${school.name}`);
  } else {
    console.log(`✅ Found school: ${school.name}`);
  }

  // Check if coach exists
  const existing = await prisma.user.findUnique({
    where: { email: 'coach@uw.edu' }
  });

  if (existing) {
    console.log('⚠️  Coach user already exists!');
    console.log(`   Email: ${existing.email}`);
    console.log(`   Name: ${existing.name}`);
    console.log(`   Role: ${existing.role}`);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash('coach123', 10);

  // Create user and coach
  const user = await prisma.user.create({
    data: {
      email: 'coach@uw.edu',
      name: 'Coach Sarah Smith',
      password: hashedPassword,
      role: 'COACH',
      schoolId: school.id,
      emailVerified: new Date(),
      Coach: {
        create: {
          sport: 'Basketball',
          title: 'Head Coach',
        }
      }
    },
    include: {
      Coach: true
    }
  });

  console.log('\n✅ Coach user created successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: coach@uw.edu');
  console.log('   Password: coach123');
  console.log(`\n👤 User Details:`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Sport: ${user.Coach.sport}`);
  console.log(`   Title: ${user.Coach.title}`);
}

main()
  .catch((e) => {
    console.error('❌ Error creating coach user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
