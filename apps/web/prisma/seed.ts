import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

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
  console.log('📊 Creating mood logs (30 days per athlete)...');
  const now = new Date();
  for (const athlete of athletes) {
    for (let day = 0; day < 30; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);

      const mood = Math.floor(Math.random() * 4) + 6; // 6-9
      const stress = Math.floor(Math.random() * 4) + 3; // 3-6
      const sleep = Math.floor(6 + Math.random() * 3); // 6-9 hours
      const confidence = Math.floor(Math.random() * 4) + 6; // 6-9

      await prisma.moodLog.create({
        data: {
          athleteId: athlete.id,
          mood,
          stress,
          sleep,
          confidence,
          tags: '',
          createdAt: date,
        },
      });
    }
  }

  // Create 10 games with performance metrics for first 10 athletes
  console.log('🏀 Creating game performance data...');
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
      const outcome = Math.random() > 0.5 ? 'win' : 'loss';

      // Basketball stats
      let stats = {};
      if (athlete.athlete?.sport === 'Basketball') {
        stats = {
          points: Math.floor(Math.random() * 25) + 5,
          shooting_pct: Math.random() * 0.3 + 0.35, // 35-65%
          assists: Math.floor(Math.random() * 8),
          rebounds: Math.floor(Math.random() * 10),
          turnovers: Math.floor(Math.random() * 5),
        };
      }

      // Get mood data from around that time
      const nearestMood = await prisma.moodLog.findFirst({
        where: {
          athleteId: athlete.id,
          createdAt: {
            gte: new Date(gameDate.getTime() - 3 * 24 * 60 * 60 * 1000),
            lte: new Date(gameDate.getTime() + 3 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const readinessScore = nearestMood
        ? Math.floor((nearestMood.mood * 0.25 + (10 - nearestMood.stress) * 0.2 + ((nearestMood.sleep || 0) / 10) * 100 * 0.2 + nearestMood.confidence * 0.15) * 10)
        : null;

      await prisma.performanceMetric.create({
        data: {
          athleteId: athlete.id,
          gameDate,
          sport: athlete.athlete?.sport || 'Basketball',
          opponentName: opponents[gameIdx],
          outcome,
          stats,
          mentalMoodScore: nearestMood?.mood || null,
          mentalStressScore: nearestMood?.stress || null,
          mentalSleepHours: nearestMood?.sleep ? parseFloat(nearestMood.sleep.toString()) : null,
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
  console.log(`   - ${20 * 30} Mood Logs (30 days per athlete)`);
  console.log(`   - ${10 * 10} Performance Metrics (10 games, 10 athletes)`);
  console.log(`   - 10 Goals`);
  console.log(`   - 3 Knowledge Base Entries`);
  console.log('\n🎉 Ready for MVP demo!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
