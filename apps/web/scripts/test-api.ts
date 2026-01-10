/**
 * API Testing Script
 *
 * Run with: npx tsx scripts/test-api.ts
 */

import * as dotenv from 'dotenv';
import * as jose from 'jose';
import { PrismaClient } from '@prisma/client';

// Load .env first, then .env.local (which overrides)
dotenv.config({ path: '.env', override: true });
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();
const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Get the secret from env - must match auth-helpers.ts (loaded from .env.local)
const JWT_SECRET = process.env.NEXTAUTH_SECRET || '0ytzKXlcwgopKpdhvnn4Y24+jJ9mHJ0Xq8krbu753Pg=';

console.log('Loaded NEXTAUTH_SECRET from env:', process.env.NEXTAUTH_SECRET ? 'yes' : 'no');
console.log('Secret starts with:', JWT_SECRET.substring(0, 10));

async function generateToken(userId: string, email: string, role: string, schoolId: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);

  const jwt = await new jose.SignJWT({
    id: userId,
    email: email,
    role: role,
    schoolId: schoolId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

  return jwt;
}

async function testAPI(name: string, method: string, url: string, token: string, body?: any): Promise<any> {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   ${method} ${url}`);

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const text = await response.text();

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.substring(0, 200) };
    }

    console.log(`   Status: ${response.status} ${response.ok ? '✅' : '❌'}`);

    if (!response.ok) {
      console.log(`   Error: ${JSON.stringify(data).substring(0, 300)}`);
    } else {
      // Truncate large responses
      const output = JSON.stringify(data, null, 2);
      console.log(`   Response: ${output.length > 800 ? output.substring(0, 800) + '...' : output}`);
    }

    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`   Error: ${error}`);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 Starting API Tests\n');
  console.log('='.repeat(60));
  console.log(`Using JWT_SECRET: ${JWT_SECRET.substring(0, 10)}...`);

  // Get coach user from database
  const coach = await prisma.user.findFirst({
    where: { role: 'COACH' },
    select: { id: true, email: true, role: true, schoolId: true },
  });

  if (!coach) {
    console.error('❌ No coach found in database. Run seed first.');
    process.exit(1);
  }

  console.log(`📋 Coach: ${coach.email} (${coach.id})`);

  // Get an athlete from database
  const athlete = await prisma.user.findFirst({
    where: { role: 'ATHLETE' },
    select: { id: true, email: true, role: true, schoolId: true },
  });

  if (!athlete) {
    console.error('❌ No athlete found in database. Run seed first.');
    process.exit(1);
  }

  console.log(`🏃 Athlete: ${athlete.email} (${athlete.id})`);

  // Generate tokens
  const coachToken = await generateToken(coach.id, coach.email, coach.role, coach.schoolId || '');
  const athleteToken = await generateToken(athlete.id, athlete.email, athlete.role, athlete.schoolId || '');

  console.log(`\n   Coach Token: ${coachToken.substring(0, 50)}...`);
  console.log(`   Athlete Token: ${athleteToken.substring(0, 50)}...`);

  console.log('\n' + '='.repeat(60));
  console.log('📊 TESTING PREDICT APIs (Performance Prediction)');
  console.log('='.repeat(60));

  // Test 1: Get predictions for athlete (coach access)
  await testAPI(
    'Get Predictions for Athlete',
    'GET',
    `${BASE_URL}/api/predictions/${athlete.id}`,
    coachToken
  );

  // Test 2: Get coach predictions summary
  await testAPI(
    'Get Coach Predictions Overview',
    'GET',
    `${BASE_URL}/api/coach/predictions`,
    coachToken
  );

  console.log('\n' + '='.repeat(60));
  console.log('💊 TESTING PRESCRIBE APIs (Interventions)');
  console.log('='.repeat(60));

  // Test 3: Get interventions (athlete)
  await testAPI(
    'Get My Interventions (Athlete)',
    'GET',
    `${BASE_URL}/api/interventions`,
    athleteToken
  );

  // Test 4: Create intervention (athlete)
  const interventionResult = await testAPI(
    'Create Intervention (Athlete)',
    'POST',
    `${BASE_URL}/api/interventions`,
    athleteToken,
    {
      type: 'BREATHING',
      protocol: '4-7-8 breathing technique for pre-game anxiety',
      context: 'PRE_GAME',
      notes: 'Test intervention from API test',
    }
  );

  // Test 5: Complete intervention and record outcome
  if (interventionResult.success && interventionResult.data?.id) {
    await testAPI(
      'Record Intervention Outcome',
      'POST',
      `${BASE_URL}/api/interventions/${interventionResult.data.id}/outcome`,
      athleteToken,
      {
        moodChange: 2,
        confidenceChange: 3,
        stressChange: -2,
        athleteRating: 8,
        notes: 'Felt much calmer after breathing exercise',
      }
    );
  }

  // Test 6: Get intervention effectiveness (coach)
  await testAPI(
    'Get Intervention Effectiveness',
    'GET',
    `${BASE_URL}/api/interventions/effectiveness`,
    coachToken
  );

  console.log('\n' + '='.repeat(60));
  console.log('📈 TESTING PATTERN APIs (Analytics & Correlations)');
  console.log('='.repeat(60));

  // Test 7: Get multi-modal correlation analysis
  await testAPI(
    'Get Multi-Modal Correlations',
    'GET',
    `${BASE_URL}/api/analytics/multi-modal?athleteId=${athlete.id}`,
    coachToken
  );

  // Test 8: Get performance-readiness correlation
  await testAPI(
    'Get Performance-Readiness Correlation',
    'GET',
    `${BASE_URL}/api/analytics/performance-correlation?athleteId=${athlete.id}`,
    coachToken
  );

  // Test 9: Get readiness forecast
  await testAPI(
    'Get Readiness Forecast',
    'GET',
    `${BASE_URL}/api/analytics/readiness-forecast?athleteId=${athlete.id}`,
    coachToken
  );

  // Test 10: Get team heatmap
  await testAPI(
    'Get Team Readiness Heatmap',
    'GET',
    `${BASE_URL}/api/coach/analytics/team-heatmap`,
    coachToken
  );

  console.log('\n' + '='.repeat(60));
  console.log('⌚ TESTING WEARABLE APIs');
  console.log('='.repeat(60));

  // Test 11: Get wearable status
  await testAPI(
    'Get Wearable Status',
    'GET',
    `${BASE_URL}/api/wearables/status`,
    athleteToken
  );

  // Test 12: Get WHOOP connect URL
  await testAPI(
    'Get WHOOP Connect URL',
    'GET',
    `${BASE_URL}/api/wearables/connect/whoop`,
    athleteToken
  );

  console.log('\n' + '='.repeat(60));
  console.log('👨‍🏫 TESTING COACH DASHBOARD APIs');
  console.log('='.repeat(60));

  // Test 13: Get coach dashboard
  await testAPI(
    'Get Coach Dashboard',
    'GET',
    `${BASE_URL}/api/coach/dashboard`,
    coachToken
  );

  // Test 14: Get coach athletes
  await testAPI(
    'Get Coach Athletes',
    'GET',
    `${BASE_URL}/api/coach/athletes`,
    coachToken
  );

  // Test 15: Get specific athlete details (coach)
  await testAPI(
    'Get Athlete Details (Coach View)',
    'GET',
    `${BASE_URL}/api/coach/athletes/${athlete.id}`,
    coachToken
  );

  // Test 16: Get command center
  await testAPI(
    'Get Command Center',
    'GET',
    `${BASE_URL}/api/coach/command-center`,
    coachToken
  );

  console.log('\n' + '='.repeat(60));
  console.log('📊 TESTING MOOD & BIOMETRIC APIs');
  console.log('='.repeat(60));

  // Test 17: Get mood logs
  await testAPI(
    'Get Mood Logs (Athlete)',
    'GET',
    `${BASE_URL}/api/mood-logs`,
    athleteToken
  );

  // Test 18: Create mood log
  await testAPI(
    'Create Mood Log (Athlete)',
    'POST',
    `${BASE_URL}/api/mood-logs`,
    athleteToken,
    {
      mood: 8,
      confidence: 7,
      stress: 4,
      energy: 8,
      sleep: 7.5,
      notes: 'Feeling good, ready for practice',
    }
  );

  // Test 19: Get biometrics
  await testAPI(
    'Get Biometrics (Athlete)',
    'GET',
    `${BASE_URL}/api/biometrics`,
    athleteToken
  );

  console.log('\n' + '='.repeat(60));
  console.log('🎯 TESTING GOAL APIs');
  console.log('='.repeat(60));

  // Test 20: Get goals
  await testAPI(
    'Get Goals (Athlete)',
    'GET',
    `${BASE_URL}/api/goals`,
    athleteToken
  );

  // Test 21: Create a goal
  await testAPI(
    'Create Goal (Athlete)',
    'POST',
    `${BASE_URL}/api/goals`,
    athleteToken,
    {
      title: 'Improve free throw percentage',
      description: 'Increase my free throw percentage from 75% to 85%',
      category: 'PERFORMANCE',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  );

  console.log('\n' + '='.repeat(60));
  console.log('💬 TESTING CHAT APIs');
  console.log('='.repeat(60));

  // Test 22: Get chat sessions
  await testAPI(
    'Get Chat Sessions',
    'GET',
    `${BASE_URL}/api/chat`,
    athleteToken
  );

  console.log('\n' + '='.repeat(60));
  console.log('🏆 TESTING PERFORMANCE APIs');
  console.log('='.repeat(60));

  // Test 23: Get performance data
  await testAPI(
    'Get Performance Data',
    'GET',
    `${BASE_URL}/api/performance/${athlete.id}`,
    coachToken
  );

  // Test 24: Get performance outcomes
  await testAPI(
    'Get Performance Outcomes',
    'GET',
    `${BASE_URL}/api/performance-outcomes?athleteId=${athlete.id}`,
    coachToken
  );

  console.log('\n' + '='.repeat(60));
  console.log('✅ API TESTING COMPLETE');
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

main().catch(console.error);
