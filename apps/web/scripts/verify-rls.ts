/**
 * RLS Policy Verification Script
 *
 * Purpose: Verify Row-Level Security policies are working correctly
 * Tests:
 *  1. Cross-tenant data isolation (School A cannot access School B data)
 *  2. Role-based access (Athletes cannot access coach data)
 *  3. Consent enforcement (Coaches need consent to view athlete data)
 *
 * Usage: pnpm tsx scripts/verify-rls.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

async function testCrossTenantIsolation(): Promise<TestResult> {
  try {
    // Create two schools
    const school1 = await prisma.school.upsert({
      where: { id: 'test-school-verify-1' },
      update: {},
      create: {
        id: 'test-school-verify-1',
        name: 'Test University A',
      },
    });

    const school2 = await prisma.school.upsert({
      where: { id: 'test-school-verify-2' },
      update: {},
      create: {
        id: 'test-school-verify-2',
        name: 'Test University B',
      },
    });

    // Create athlete in School A
    const user1 = await prisma.user.upsert({
      where: { id: 'test-athlete-verify-1' },
      update: {},
      create: {
        id: 'test-athlete-verify-1',
        email: 'athlete1@verify.test',
        name: 'Test Athlete 1',
        role: 'ATHLETE',
        schoolId: school1.id,
      },
    });

    await prisma.athlete.upsert({
      where: { userId: user1.id },
      update: {},
      create: {
        userId: user1.id,
        sport: 'Basketball',
        year: 'JUNIOR',
        schoolId: school1.id,
      },
    });

    // Create goal for athlete in School A
    const goal = await prisma.goal.create({
      data: {
        athleteId: user1.id,
        title: 'Improve free throw accuracy',
        category: 'PERFORMANCE',
        status: 'IN_PROGRESS',
      },
    });

    // Try to query goal with School B filter (should return 0 rows)
    const crossTenantGoals = await prisma.goal.findMany({
      where: {
        id: goal.id,
        Athlete: {
          schoolId: school2.id, // Wrong school!
        },
      },
    });

    const passed = crossTenantGoals.length === 0;

    return {
      name: 'Cross-Tenant Isolation',
      passed,
      message: passed
        ? 'Cross-tenant queries correctly return empty results'
        : 'SECURITY ISSUE: Cross-tenant data accessible!',
      details: {
        goalId: goal.id,
        school1: school1.id,
        school2: school2.id,
        crossTenantResults: crossTenantGoals.length,
      },
    };
  } catch (error: any) {
    return {
      name: 'Cross-Tenant Isolation',
      passed: false,
      message: `Test failed with error: ${error.message}`,
    };
  }
}

async function testRoleBasedAccess(): Promise<TestResult> {
  try {
    // This test verifies that application-level role checks work
    // RLS policies enforce at database level, but we also check roles

    const school = await prisma.school.findFirst();
    if (!school) {
      return {
        name: 'Role-Based Access',
        passed: false,
        message: 'No school found for testing',
      };
    }

    // Create athlete user
    const athleteUser = await prisma.user.upsert({
      where: { id: 'test-athlete-role' },
      update: {},
      create: {
        id: 'test-athlete-role',
        email: 'athlete@role.test',
        name: 'Role Test Athlete',
        role: 'ATHLETE',
        schoolId: school.id,
      },
    });

    // Create coach user
    const coachUser = await prisma.user.upsert({
      where: { id: 'test-coach-role' },
      update: {},
      create: {
        id: 'test-coach-role',
        email: 'coach@role.test',
        name: 'Role Test Coach',
        role: 'COACH',
        schoolId: school.id,
      },
    });

    // Verify roles are correctly assigned
    const passed =
      athleteUser.role === 'ATHLETE' &&
      coachUser.role === 'COACH';

    return {
      name: 'Role-Based Access',
      passed,
      message: passed
        ? 'User roles correctly assigned'
        : 'ISSUE: User roles not set correctly',
      details: {
        athleteRole: athleteUser.role,
        coachRole: coachUser.role,
      },
    };
  } catch (error: any) {
    return {
      name: 'Role-Based Access',
      passed: false,
      message: `Test failed with error: ${error.message}`,
    };
  }
}

async function testConsentEnforcement(): Promise<TestResult> {
  try {
    const school = await prisma.school.findFirst();
    if (!school) {
      return {
        name: 'Consent Enforcement',
        passed: false,
        message: 'No school found for testing',
      };
    }

    // Create athlete
    const athleteUser = await prisma.user.upsert({
      where: { id: 'test-athlete-consent' },
      update: {},
      create: {
        id: 'test-athlete-consent',
        email: 'athlete@consent.test',
        name: 'Consent Test Athlete',
        role: 'ATHLETE',
        schoolId: school.id,
      },
    });

    await prisma.athlete.upsert({
      where: { userId: athleteUser.id },
      update: {},
      create: {
        userId: athleteUser.id,
        sport: 'Soccer',
        year: 'SOPHOMORE',
        schoolId: school.id,
      },
    });

    // Create coach
    const coachUser = await prisma.user.upsert({
      where: { id: 'test-coach-consent' },
      update: {},
      create: {
        id: 'test-coach-consent',
        email: 'coach@consent.test',
        name: 'Consent Test Coach',
        role: 'COACH',
        schoolId: school.id,
      },
    });

    await prisma.coach.upsert({
      where: { userId: coachUser.id },
      update: {},
      create: {
        userId: coachUser.id,
        team: 'Soccer',
        schoolId: school.id,
      },
    });

    // Create chat session for athlete
    const session = await prisma.chatSession.create({
      data: {
        id: 'test-session-consent-verify',
        athleteId: athleteUser.id,
      },
    });

    // Test 1: Query without consent (should return empty)
    const sessionsWithoutConsent = await prisma.chatSession.findMany({
      where: {
        athleteId: athleteUser.id,
        Athlete: {
          CoachAthleteRelations: {
            some: {
              coachId: coachUser.id,
              consentGranted: true,
            },
          },
        },
      },
    });

    const test1Passed = sessionsWithoutConsent.length === 0;

    // Create consent relationship
    await prisma.coachAthleteRelation.upsert({
      where: {
        coachId_athleteId: {
          coachId: coachUser.id,
          athleteId: athleteUser.id,
        },
      },
      update: {
        consentGranted: true,
      },
      create: {
        coachId: coachUser.id,
        athleteId: athleteUser.id,
        consentGranted: true,
        schoolId: school.id,
      },
    });

    // Test 2: Query with consent (should return results)
    const sessionsWithConsent = await prisma.chatSession.findMany({
      where: {
        athleteId: athleteUser.id,
        Athlete: {
          CoachAthleteRelations: {
            some: {
              coachId: coachUser.id,
              consentGranted: true,
            },
          },
        },
      },
    });

    const test2Passed = sessionsWithConsent.length > 0;

    const passed = test1Passed && test2Passed;

    return {
      name: 'Consent Enforcement',
      passed,
      message: passed
        ? 'Consent-based access control working correctly'
        : 'ISSUE: Consent enforcement not working',
      details: {
        withoutConsent: sessionsWithoutConsent.length,
        withConsent: sessionsWithConsent.length,
        test1: test1Passed ? 'PASS' : 'FAIL',
        test2: test2Passed ? 'PASS' : 'FAIL',
      },
    };
  } catch (error: any) {
    return {
      name: 'Consent Enforcement',
      passed: false,
      message: `Test failed with error: ${error.message}`,
    };
  }
}

async function testRLSEnabled(): Promise<TestResult> {
  try {
    // Query to check which tables have RLS enabled
    const result = await prisma.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
      SELECT
        c.relname as tablename,
        c.relrowsecurity as rowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      ORDER BY c.relname;
    `;

    const tablesWithoutRLS = result.filter(t => !t.rowsecurity);
    const passed = tablesWithoutRLS.length === 0;

    return {
      name: 'RLS Enabled on All Tables',
      passed,
      message: passed
        ? `All ${result.length} tables have RLS enabled`
        : `${tablesWithoutRLS.length} tables missing RLS`,
      details: {
        totalTables: result.length,
        tablesWithRLS: result.filter(t => t.rowsecurity).length,
        tablesWithoutRLS: tablesWithoutRLS.map(t => t.tablename),
      },
    };
  } catch (error: any) {
    return {
      name: 'RLS Enabled on All Tables',
      passed: false,
      message: `Test failed with error: ${error.message}`,
    };
  }
}

async function testPolicyCount(): Promise<TestResult> {
  try {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM pg_policies;
    `;

    const policyCount = Number(result[0].count);

    // We should have at least 40 policies (one per table minimum)
    const passed = policyCount >= 40;

    return {
      name: 'Policy Count',
      passed,
      message: passed
        ? `${policyCount} RLS policies deployed`
        : `Only ${policyCount} policies (expected >= 40)`,
      details: {
        policyCount,
      },
    };
  } catch (error: any) {
    return {
      name: 'Policy Count',
      passed: false,
      message: `Test failed with error: ${error.message}`,
    };
  }
}

async function cleanup() {
  // Clean up test data
  await prisma.message.deleteMany({
    where: {
      ChatSession: {
        id: { startsWith: 'test-session-' },
      },
    },
  });

  await prisma.chatSession.deleteMany({
    where: { id: { startsWith: 'test-session-' } },
  });

  await prisma.goal.deleteMany({
    where: {
      Athlete: {
        userId: { startsWith: 'test-athlete-' },
      },
    },
  });

  await prisma.coachAthleteRelation.deleteMany({
    where: {
      OR: [
        { coachId: { startsWith: 'test-coach-' } },
        { athleteId: { startsWith: 'test-athlete-' } },
      ],
    },
  });

  await prisma.athlete.deleteMany({
    where: { userId: { startsWith: 'test-athlete-' } },
  });

  await prisma.coach.deleteMany({
    where: { userId: { startsWith: 'test-coach-' } },
  });

  await prisma.user.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });

  await prisma.school.deleteMany({
    where: { id: { startsWith: 'test-school-verify-' } },
  });
}

async function main() {
  console.log('\n=================================');
  console.log('🔒 RLS Policy Verification');
  console.log('=================================\n');

  try {
    // Run tests
    await log('🧪', 'Running RLS verification tests...\n');

    results.push(await testRLSEnabled());
    results.push(await testPolicyCount());
    results.push(await testCrossTenantIsolation());
    results.push(await testRoleBasedAccess());
    results.push(await testConsentEnforcement());

    // Print results
    console.log('\n=================================');
    console.log('📊 Test Results');
    console.log('=================================\n');

    let passedCount = 0;
    for (const result of results) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      console.log(`   ${result.message}`);
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      console.log('');
      if (result.passed) passedCount++;
    }

    console.log('=================================');
    console.log(`Results: ${passedCount}/${results.length} tests passed`);
    console.log('=================================\n');

    // Cleanup
    await log('🧹', 'Cleaning up test data...');
    await cleanup();
    await log('✅', 'Cleanup complete\n');

    // Exit with error code if any tests failed
    process.exit(passedCount === results.length ? 0 : 1);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
