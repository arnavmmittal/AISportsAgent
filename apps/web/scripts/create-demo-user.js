#!/usr/bin/env node

/**
 * Create Demo User Script
 * Creates the demo@athlete.com user for testing the mobile app
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Creating demo user...\n');

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

  // Check if demo user exists
  const existing = await prisma.user.findUnique({
    where: { email: 'demo@athlete.com' }
  });

  if (existing) {
    console.log('⚠️  Demo user already exists!');
    console.log(`   Email: ${existing.email}`);
    console.log(`   Name: ${existing.name}`);
    console.log(`   Role: ${existing.role}`);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash('demo123', 10);

  // Create user and athlete
  const user = await prisma.user.create({
    data: {
      email: 'demo@athlete.com',
      name: 'Demo Athlete',
      password: hashedPassword,
      role: 'ATHLETE',
      schoolId: school.id,
      emailVerified: new Date(),
      Athlete: {
        create: {
          sport: 'Basketball',
          year: 'JUNIOR',
          teamPosition: 'Point Guard',
          consentCoachView: true,
          consentChatSummaries: true,
        }
      }
    },
    include: {
      Athlete: true
    }
  });

  console.log('\n✅ Demo user created successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: demo@athlete.com');
  console.log('   Password: demo123');
  console.log(`\n👤 User Details:`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Sport: ${user.Athlete.sport}`);
  console.log(`   Year: ${user.Athlete.year}`);
}

main()
  .catch((e) => {
    console.error('❌ Error creating demo user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
