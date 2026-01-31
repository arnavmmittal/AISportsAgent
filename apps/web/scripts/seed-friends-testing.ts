/**
 * Seed Script for Friends Testing
 *
 * Creates test accounts for friends to test the app on staging.
 *
 * Usage: pnpm tsx scripts/seed-friends-testing.ts
 *
 * Created accounts:
 * - Coach: coach@test.aisportsagent.com / TestPass123!
 * - Athletes: athlete1@test.aisportsagent.com, athlete2@test.aisportsagent.com, etc.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'TestPass123!';
const TEST_SCHOOL_ID = 'test-friends-school';
const TEST_SCHOOL_NAME = 'Friends Testing University';

interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'ATHLETE' | 'COACH' | 'ADMIN';
  sport?: string;
  year?: string;
}

const testUsers: TestUser[] = [
  // Coach
  {
    id: 'test-coach-1',
    email: 'coach@test.aisportsagent.com',
    name: 'Test Coach',
    role: 'COACH',
    sport: 'Basketball',
  },
  // Athletes
  {
    id: 'test-athlete-1',
    email: 'athlete1@test.aisportsagent.com',
    name: 'Alex Johnson',
    role: 'ATHLETE',
    sport: 'Basketball',
    year: 'JUNIOR',
  },
  {
    id: 'test-athlete-2',
    email: 'athlete2@test.aisportsagent.com',
    name: 'Jordan Smith',
    role: 'ATHLETE',
    sport: 'Basketball',
    year: 'SOPHOMORE',
  },
  {
    id: 'test-athlete-3',
    email: 'athlete3@test.aisportsagent.com',
    name: 'Taylor Williams',
    role: 'ATHLETE',
    sport: 'Soccer',
    year: 'SENIOR',
  },
  {
    id: 'test-athlete-4',
    email: 'athlete4@test.aisportsagent.com',
    name: 'Morgan Brown',
    role: 'ATHLETE',
    sport: 'Soccer',
    year: 'FRESHMAN',
  },
  {
    id: 'test-athlete-5',
    email: 'athlete5@test.aisportsagent.com',
    name: 'Casey Davis',
    role: 'ATHLETE',
    sport: 'Swimming',
    year: 'JUNIOR',
  },
];

async function main() {
  console.log('\n🧪 Seeding Friends Testing Data\n');
  console.log('='.repeat(50));

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  // Create test school
  console.log('\n📍 Creating test school...');
  const school = await prisma.school.upsert({
    where: { id: TEST_SCHOOL_ID },
    update: { name: TEST_SCHOOL_NAME },
    create: {
      id: TEST_SCHOOL_ID,
      name: TEST_SCHOOL_NAME,
    },
  });
  console.log(`   ✓ School: ${school.name} (${school.id})`);

  // Create users
  console.log('\n👥 Creating test users...');
  for (const user of testUsers) {
    const createdUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        password: passwordHash,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        password: passwordHash,
        role: user.role,
        schoolId: school.id,
        emailVerified: new Date(), // Pre-verified for testing
      },
    });

    if (user.role === 'ATHLETE') {
      await prisma.athlete.upsert({
        where: { userId: user.id },
        update: {
          sport: user.sport,
          year: user.year as any,
        },
        create: {
          userId: user.id,
          sport: user.sport!,
          year: user.year as any,
          schoolId: school.id,
        },
      });
    }

    if (user.role === 'COACH') {
      await prisma.coach.upsert({
        where: { userId: user.id },
        update: {
          team: user.sport,
        },
        create: {
          userId: user.id,
          team: user.sport!,
          schoolId: school.id,
          inviteCode: 'TEST-INVITE-2024',
        },
      });
    }

    console.log(`   ✓ ${user.role}: ${user.name} (${user.email})`);
  }

  // Create coach-athlete relationships with consent
  console.log('\n🤝 Creating coach-athlete relationships...');
  const coach = testUsers.find(u => u.role === 'COACH')!;
  const athletes = testUsers.filter(u => u.role === 'ATHLETE');

  for (const athlete of athletes) {
    await prisma.coachAthleteRelation.upsert({
      where: {
        coachId_athleteId: {
          coachId: coach.id,
          athleteId: athlete.id,
        },
      },
      update: {
        consentGranted: true,
      },
      create: {
        coachId: coach.id,
        athleteId: athlete.id,
        consentGranted: true,
        schoolId: school.id,
      },
    });
    console.log(`   ✓ ${coach.name} → ${athlete.name} (consent: granted)`);
  }

  // Create sample mood logs
  console.log('\n📊 Creating sample mood logs...');
  const today = new Date();
  for (const athlete of athletes) {
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      await prisma.moodLog.create({
        data: {
          athleteId: athlete.id,
          mood: Math.floor(Math.random() * 4) + 6, // 6-9
          confidence: Math.floor(Math.random() * 4) + 5, // 5-8
          stress: Math.floor(Math.random() * 5) + 3, // 3-7
          energy: Math.floor(Math.random() * 4) + 5, // 5-8
          sleep: Math.floor(Math.random() * 3) + 6, // 6-8 hours
          createdAt: date,
        },
      });
    }
    console.log(`   ✓ 7 days of mood logs for ${athlete.name}`);
  }

  // Create sample goals
  console.log('\n🎯 Creating sample goals...');
  const sampleGoals = [
    { title: 'Improve free throw accuracy', category: 'PERFORMANCE' },
    { title: 'Manage pre-game anxiety', category: 'MENTAL' },
    { title: 'Maintain 3.5 GPA', category: 'ACADEMIC' },
    { title: 'Get 8 hours of sleep', category: 'PERSONAL' },
  ];

  for (const athlete of athletes.slice(0, 3)) {
    for (const goal of sampleGoals.slice(0, 2)) {
      await prisma.goal.create({
        data: {
          athleteId: athlete.id,
          title: goal.title,
          category: goal.category as any,
          status: 'IN_PROGRESS',
          progress: Math.floor(Math.random() * 60) + 20,
        },
      });
    }
    console.log(`   ✓ 2 goals for ${athlete.name}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Friends Testing Data Seeded Successfully!\n');
  console.log('📋 TEST ACCOUNTS:');
  console.log('─'.repeat(50));
  console.log(`   Password for all accounts: ${TEST_PASSWORD}`);
  console.log('');
  console.log('   COACH:');
  console.log(`   • coach@test.aisportsagent.com`);
  console.log('');
  console.log('   ATHLETES:');
  for (const athlete of athletes) {
    console.log(`   • ${athlete.email} (${athlete.name}, ${athlete.sport})`);
  }
  console.log('');
  console.log('   INVITE CODE: TEST-INVITE-2024');
  console.log('');
  console.log('─'.repeat(50));
  console.log('\n🌐 Staging URL: https://staging.aisportsagent.com');
  console.log('   (or your Vercel preview URL)\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
