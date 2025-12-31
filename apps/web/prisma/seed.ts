import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { calculateReadiness } from '../lib/analytics/readiness';
import { getSportConfig } from '../lib/analytics/sport-configs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create school
  console.log('📚 Creating school...');
  const school = await prisma.school.upsert({
    where: { id: 'school-demo-001' },
    update: {},
    create: {
      id: 'school-demo-001',
      name: 'University of Washington',
      division: 'D1',
    },
  });

  // Create demo coach
  console.log('👨‍🏫 Creating demo coach...');
  const coachPassword = await hash('Coach2024!', 10);
  const coach = await prisma.user.upsert({
    where: { email: 'coach@uw.edu' },
    update: {},
    create: {
      id: 'user-coach-001',
      email: 'coach@uw.edu',
      name: 'Coach Mike Johnson',
      password: coachPassword,
      role: 'COACH',
      schoolId: school.id,
      coach: {
        create: {
          sport: 'Basketball',
        },
      },
    },
  });

  // Create 20 sample athletes
  console.log('🏃 Creating 20 sample athletes...');
  const sports = ['Basketball', 'Football', 'Soccer', 'Volleyball'];
  const years = ['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR'];
  const positions = {
    Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
    Football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Linebacker', 'Safety'],
    Soccer: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
    Volleyball: ['Outside Hitter', 'Middle Blocker', 'Setter', 'Libero'],
  };

  const athletePassword = await hash('Athlete2024!', 10);

  const athletes = [];
  for (let i = 1; i <= 20; i++) {
    const sport = sports[i % sports.length];
    const year = years[Math.floor(Math.random() * years.length)];
    const positionList = positions[sport as keyof typeof positions];
    const position = positionList[Math.floor(Math.random() * positionList.length)];

    const athlete = await prisma.user.create({
      data: {
        id: `user-athlete-${String(i).padStart(3, '0')}`,
        email: `athlete${i}@uw.edu`,
        name: `Athlete ${i}`,
        password: athletePassword,
        role: 'ATHLETE',
        schoolId: school.id,
        athlete: {
          create: {
            sport,
            year,
            teamPosition: position,
            consentCoachView: true,
          },
        },
      },
      include: {
        athlete: true,
      },
    });

    athletes.push(athlete);
  }

  // Create mood logs for last 30 days for each athlete
  // Intentionally create varied patterns to demonstrate correlations
  console.log('📊 Creating mood logs (30 days per athlete)...');
  const now = new Date();
  for (const athlete of athletes) {
    for (let day = 0; day < 30; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);

      // Create intentional variation: some high-readiness days, some low
      // High readiness pattern (70% of days): good mood, low stress, good sleep
      // Low readiness pattern (30% of days): poor mood, high stress, poor sleep
      const isHighReadiness = Math.random() > 0.3;

      let mood, stress, sleep, confidence, energy;
      if (isHighReadiness) {
        mood = Math.floor(Math.random() * 2) + 8; // 8-9
        stress = Math.floor(Math.random() * 2) + 2; // 2-3 (low stress)
        sleep = Math.floor(Math.random() * 1.5) + 7.5; // 7.5-9 hours
        confidence = Math.floor(Math.random() * 2) + 8; // 8-9
        energy = Math.floor(Math.random() * 2) + 8; // 8-9
      } else {
        mood = Math.floor(Math.random() * 3) + 4; // 4-6
        stress = Math.floor(Math.random() * 2) + 7; // 7-8 (high stress)
        sleep = Math.floor(Math.random() * 1.5) + 5; // 5-6.5 hours
        confidence = Math.floor(Math.random() * 3) + 4; // 4-6
        energy = Math.floor(Math.random() * 3) + 4; // 4-6
      }

      await prisma.moodLog.create({
        data: {
          athleteId: athlete.id,
          mood,
          stress,
          sleep,
          confidence,
          energy,
          tags: '',
          createdAt: date,
        },
      });
    }
  }


  // Create 10 games with performance metrics for first 10 athletes
  // Stats will correlate with readiness to demonstrate r>0.5 correlation
  console.log('🏀 Creating game performance data with correlations...');
  const opponents = [
    'Oregon Ducks',
    'USC Trojans',
    'Stanford Cardinal',
    'UCLA Bruins',
    'Arizona Wildcats',
    'Cal Bears',
    'Colorado Buffaloes',
    'Utah Utes',
    'Oregon State Beavers',
    'Washington State Cougars',
  ];

  for (let gameIdx = 0; gameIdx < 10; gameIdx++) {
    const gameDate = new Date(now);
    gameDate.setDate(gameDate.getDate() - (gameIdx * 7)); // Weekly games

    for (let athleteIdx = 0; athleteIdx < 10; athleteIdx++) {
      const athlete = athletes[athleteIdx];

      // Get exact mood data from that day
      const gameDayStart = new Date(gameDate);
      gameDayStart.setHours(0, 0, 0, 0);
      const gameDayEnd = new Date(gameDate);
      gameDayEnd.setHours(23, 59, 59, 999);

      const moodLog = await prisma.moodLog.findFirst({
        where: {
          athleteId: athlete.id,
          createdAt: {
            gte: gameDayStart,
            lte: gameDayEnd,
          },
        },
      });

      if (!moodLog) continue;

      // Calculate readiness score using advanced algorithm
      const readinessBreakdown = calculateReadiness({
        mood: moodLog.mood,
        confidence: moodLog.confidence,
        stress: moodLog.stress,
        energy: moodLog.energy || undefined,
        sleep: moodLog.sleep || undefined,
        focus: moodLog.focus || undefined,
        motivation: moodLog.motivation || undefined,
        createdAt: moodLog.createdAt,
      }, athlete.athlete?.sport || 'Basketball');

      const readinessScore = readinessBreakdown.overall;

      // Generate stats that correlate with readiness
      // High readiness (>85) → excellent performance
      // Medium readiness (70-85) → good performance
      // Low readiness (<70) → poor performance
      let stats = {};
      let outcome = 'UNKNOWN';

      if (athlete.athlete?.sport === 'Basketball') {
        // Correlation formula: performance = baseline + (readiness_factor * range)
        const readinessFactor = readinessScore / 100; // 0.0 - 1.0

        // Points: 5-30 range, strong correlation
        const points = Math.floor(5 + (readinessFactor * 25) + (Math.random() * 3 - 1.5));

        // Assists: 0-8 range, moderate correlation
        const assists = Math.floor(0 + (readinessFactor * 8) + (Math.random() * 2 - 1));

        // Rebounds: 2-12 range, moderate correlation
        const rebounds = Math.floor(2 + (readinessFactor * 10) + (Math.random() * 2 - 1));

        // Turnovers: inverted correlation (high readiness = low turnovers)
        const turnovers = Math.floor(6 - (readinessFactor * 5) + (Math.random() * 1.5));

        // Minutes: 20-40 range, slight correlation
        const minutes = Math.floor(20 + (readinessFactor * 20) + (Math.random() * 4 - 2));

        // Shooting percentage: 35-60%, moderate correlation
        const shootingPct = Math.round((0.35 + (readinessFactor * 0.25) + (Math.random() * 0.05 - 0.025)) * 100) / 100;

        stats = {
          points: Math.max(0, points),
          assists: Math.max(0, assists),
          rebounds: Math.max(0, rebounds),
          turnovers: Math.max(0, turnovers),
          minutes: Math.max(15, Math.min(40, minutes)),
          shootingPct,
        };

        // Outcome correlates with readiness
        if (readinessScore >= 80) {
          outcome = Math.random() > 0.2 ? 'WIN' : 'LOSS'; // 80% win rate
        } else if (readinessScore >= 70) {
          outcome = Math.random() > 0.5 ? 'WIN' : 'LOSS'; // 50% win rate
        } else {
          outcome = Math.random() > 0.7 ? 'WIN' : 'LOSS'; // 30% win rate
        }
      }

      await prisma.performanceMetric.create({
        data: {
          athleteId: athlete.id,
          gameDate,
          sport: athlete.athlete?.sport || 'Basketball',
          opponentName: opponents[gameIdx],
          outcome,
          stats,
          mentalMoodScore: moodLog.mood,
          mentalStressScore: moodLog.stress,
          mentalSleepHours: moodLog.sleep ? parseFloat(moodLog.sleep.toString()) : null,
          mentalHRVScore: null,
          readinessScore,
          slumpPrediction: null,
        },
      });
    }
  }

  // Create some goals
  console.log('🎯 Creating sample goals...');
  for (let i = 0; i < 10; i++) {
    const athlete = athletes[i];
    await prisma.goal.create({
      data: {
        athleteId: athlete.id,
        title: 'Improve Free Throw Percentage',
        description: 'Increase free throw percentage from 70% to 85% by end of season',
        category: 'PERFORMANCE',
        targetDate: new Date(now.getFullYear(), 11, 31),
        status: 'IN_PROGRESS',
      },
    });
  }

  // Create knowledge base entries
  console.log('📚 Creating knowledge base entries...');
  const kbEntries = [
    {
      title: 'Managing Pre-Game Anxiety',
      content: 'Pre-game anxiety is normal and can be managed through breathing exercises, visualization, and positive self-talk. Research shows that controlled breathing can reduce cortisol levels by up to 20%.',
      category: 'ANXIETY',
      tags: 'pre-game,anxiety,breathing,visualization',
      source: 'AI Sports Psych Project',
    },
    {
      title: 'Building Confidence Through Self-Talk',
      content: 'Positive self-talk has been shown to improve performance in competitive situations. Athletes who use constructive self-talk show 15% improvement in clutch situations.',
      category: 'CONFIDENCE',
      tags: 'confidence,self-talk,performance',
      source: 'Sports Psychology Research',
    },
    {
      title: 'Flow State Techniques',
      content: 'Achieving flow state requires complete focus on the present moment. Elite athletes report entering flow state when challenge matches skill level perfectly.',
      category: 'FLOW_STATE',
      tags: 'flow-state,focus,performance',
      source: 'Flow in Sports Research',
    },
  ];

  for (const entry of kbEntries) {
    await prisma.knowledgeBase.create({
      data: {
        ...entry,
        schoolId: null, // Global knowledge base
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 School (${school.name})`);
  console.log(`   - 1 Coach (coach@uw.edu / Coach2024!)`);
  console.log(`   - 20 Athletes (athlete1@uw.edu to athlete20@uw.edu / Athlete2024!)`);
  console.log(`   - ${20 * 30} Mood Logs (30 days per athlete with high/low readiness patterns)`);
  console.log(`   - ${10 * 10} Performance Metrics (10 games, 10 athletes) - CORRELATED WITH READINESS`);
  console.log(`   - 10 Goals`);
  console.log(`   - 3 Knowledge Base Entries`);
  console.log('\n🎯 Performance Correlation Details:');
  console.log('   - High Readiness (>85) → 18-28 PPG, 5-8 APG, 80% win rate');
  console.log('   - Low Readiness (<70) → 8-15 PPG, 1-3 APG, 30% win rate');
  console.log('   - Expected Pearson r > 0.5 for Points, Assists, Rebounds vs Readiness');
  console.log('\n🎉 Ready for MVP demo with analytics!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
