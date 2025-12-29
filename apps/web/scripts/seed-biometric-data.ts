/**
 * Biometric Data Seed Script
 *
 * Generates realistic 30-day biometric data for all athletes:
 * - HRV (Heart Rate Variability): 40-100ms with weekly cycles
 * - Resting HR: 45-75 bpm with inverse correlation to HRV
 * - Sleep Duration: 5-9 hours with sleep debt accumulation
 * - Recovery Score: 0-100 (Whoop-style composite score)
 *
 * Run with: pnpm tsx scripts/seed-biometric-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Realistic biometric value ranges
const BIOMETRIC_RANGES = {
  hrv: { min: 40, max: 100, optimal: 70, unit: 'ms' },
  resting_hr: { min: 45, max: 75, optimal: 55, unit: 'bpm' },
  sleep_duration: { min: 5, max: 9, optimal: 8, unit: 'hours' },
  recovery_score: { min: 0, max: 100, optimal: 75, unit: 'score' },
};

// Device types for variety
const DEVICE_TYPES = ['whoop', 'oura', 'garmin', 'apple_watch'];

/**
 * Generate realistic HRV value with weekly cycles
 * - Athletes have a baseline HRV (varies by fitness level)
 * - Weekly training stress creates dips and recoveries
 * - Random daily variation ±10ms
 */
function generateHRV(dayIndex: number, baselineHRV: number): number {
  // Weekly cycle: dip mid-week (hard training), recover on weekends
  const weekProgress = (dayIndex % 7) / 7; // 0-1 within week
  const weeklyCycleFactor = Math.sin(weekProgress * Math.PI); // 0 → 1 → 0

  // Hard training days (Tuesday-Thursday) suppress HRV
  const weekday = dayIndex % 7;
  const trainingStress = (weekday >= 2 && weekday <= 4) ? -10 : 0;

  // Random daily variation
  const dailyNoise = (Math.random() - 0.5) * 10;

  const hrv = baselineHRV + (weeklyCycleFactor * 15) + trainingStress + dailyNoise;

  return Math.max(BIOMETRIC_RANGES.hrv.min, Math.min(BIOMETRIC_RANGES.hrv.max, hrv));
}

/**
 * Generate resting heart rate (inversely correlated with HRV)
 * - Higher HRV → lower resting HR (indicates better recovery)
 * - Baseline varies by athlete
 */
function generateRestingHR(hrv: number, baselineHR: number): number {
  // Inverse correlation: higher HRV = lower HR
  const hrvFactor = (BIOMETRIC_RANGES.hrv.max - hrv) / BIOMETRIC_RANGES.hrv.max;
  const hr = baselineHR + (hrvFactor * 15);

  return Math.max(BIOMETRIC_RANGES.resting_hr.min, Math.min(BIOMETRIC_RANGES.resting_hr.max, hr));
}

/**
 * Generate sleep duration with sleep debt accumulation
 * - Athletes accumulate sleep debt during week
 * - Catch up sleep on weekends
 * - Random variation ±1 hour
 */
function generateSleepDuration(dayIndex: number, baselineSleep: number): number {
  const weekday = dayIndex % 7;

  // Sleep debt accumulation during week
  const sleepDebtFactor = weekday <= 4 ? -0.5 : 1; // Less sleep Mon-Fri, more Sat-Sun

  // Random variation
  const dailyNoise = (Math.random() - 0.5) * 1;

  const sleep = baselineSleep + sleepDebtFactor + dailyNoise;

  return Math.max(BIOMETRIC_RANGES.sleep_duration.min, Math.min(BIOMETRIC_RANGES.sleep_duration.max, sleep));
}

/**
 * Calculate Whoop-style recovery score
 * - Based on HRV (50%), sleep (30%), resting HR (20%)
 * - Normalized to 0-100 scale
 */
function calculateRecoveryScore(hrv: number, sleepHours: number, restingHR: number): number {
  // Normalize each metric to 0-1 scale
  const hrvNorm = (hrv - BIOMETRIC_RANGES.hrv.min) / (BIOMETRIC_RANGES.hrv.max - BIOMETRIC_RANGES.hrv.min);
  const sleepNorm = (sleepHours - BIOMETRIC_RANGES.sleep_duration.min) / (BIOMETRIC_RANGES.sleep_duration.max - BIOMETRIC_RANGES.sleep_duration.min);
  const hrNorm = 1 - ((restingHR - BIOMETRIC_RANGES.resting_hr.min) / (BIOMETRIC_RANGES.resting_hr.max - BIOMETRIC_RANGES.resting_hr.min));

  // Weighted composite score
  const recoveryScore = (hrvNorm * 0.5) + (sleepNorm * 0.3) + (hrNorm * 0.2);

  return Math.round(recoveryScore * 100);
}

/**
 * Generate 30 days of biometric data for a single athlete
 */
async function generateAthleteData(athleteId: string, athleteName: string) {
  const now = new Date();
  const DAYS = 30;

  // Athlete-specific baselines (simulate individual differences)
  const baselineHRV = 50 + Math.random() * 30; // 50-80ms
  const baselineHR = 50 + Math.random() * 15; // 50-65 bpm
  const baselineSleep = 7 + Math.random() * 1; // 7-8 hours
  const deviceType = DEVICE_TYPES[Math.floor(Math.random() * DEVICE_TYPES.length)];

  console.log(`  ${athleteName}: Baseline HRV=${baselineHRV.toFixed(1)}ms, HR=${baselineHR.toFixed(1)}bpm, Sleep=${baselineSleep.toFixed(1)}h, Device=${deviceType}`);

  const records = [];

  for (let dayOffset = DAYS; dayOffset >= 0; dayOffset--) {
    const recordedAt = new Date(now);
    recordedAt.setDate(recordedAt.getDate() - dayOffset);
    recordedAt.setHours(6, 0, 0, 0); // Morning reading

    // Generate correlated metrics
    const hrv = generateHRV(DAYS - dayOffset, baselineHRV);
    const restingHR = generateRestingHR(hrv, baselineHR);
    const sleepHours = generateSleepDuration(DAYS - dayOffset, baselineSleep);
    const recoveryScore = calculateRecoveryScore(hrv, sleepHours, restingHR);

    // Create 4 biometric records per day
    records.push(
      {
        athleteId,
        deviceType,
        metricType: 'hrv',
        value: hrv,
        unit: BIOMETRIC_RANGES.hrv.unit,
        recordedAt,
      },
      {
        athleteId,
        deviceType,
        metricType: 'resting_hr',
        value: restingHR,
        unit: BIOMETRIC_RANGES.resting_hr.unit,
        recordedAt,
      },
      {
        athleteId,
        deviceType,
        metricType: 'sleep_duration',
        value: sleepHours,
        unit: BIOMETRIC_RANGES.sleep_duration.unit,
        recordedAt,
      },
      {
        athleteId,
        deviceType,
        metricType: 'recovery_score',
        value: recoveryScore,
        unit: BIOMETRIC_RANGES.recovery_score.unit,
        recordedAt,
      }
    );
  }

  // Bulk insert
  await prisma.wearableData.createMany({
    data: records,
    skipDuplicates: true,
  });

  return records.length;
}

/**
 * Main seed function
 */
async function main() {
  console.log('🏃 Starting biometric data seeding...\n');

  // Get all athletes
  const athletes = await prisma.athlete.findMany({
    include: {
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (athletes.length === 0) {
    console.log('⚠️  No athletes found in database. Please run athlete seed first.');
    return;
  }

  console.log(`📊 Found ${athletes.length} athletes. Generating 30 days × 4 metrics per athlete...\n`);

  let totalRecords = 0;

  for (const athlete of athletes) {
    const athleteName = athlete.User.name || athlete.User.email;
    const count = await generateAthleteData(athlete.userId, athleteName);
    totalRecords += count;
  }

  console.log(`\n✅ Seeded ${totalRecords} biometric data points for ${athletes.length} athletes`);
  console.log(`   (${totalRecords / athletes.length} records per athlete = 30 days × 4 metrics)`);

  // Show sample data for first athlete
  const firstAthlete = athletes[0];
  const sampleData = await prisma.wearableData.findMany({
    where: {
      athleteId: firstAthlete.userId,
    },
    orderBy: {
      recordedAt: 'desc',
    },
    take: 4,
  });

  console.log(`\n📋 Sample data for ${firstAthlete.User.name || firstAthlete.User.email} (most recent):`);
  sampleData.forEach(d => {
    console.log(`   ${d.metricType.padEnd(15)} ${d.value.toFixed(1).padStart(5)} ${d.unit?.padEnd(6)} (${d.recordedAt.toLocaleDateString()})`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding biometric data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
