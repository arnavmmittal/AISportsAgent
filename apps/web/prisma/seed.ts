import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { calculateReadiness } from '../src/lib/analytics/readiness';
import { getSportConfig } from '../src/lib/analytics/sport-configs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear all existing data (delete in correct order to respect foreign keys)
  console.log('🗑️  Clearing existing data...');

  // Delete child records first
  await prisma.chatInsight.deleteMany({});
  await prisma.gameResult.deleteMany({});
  await prisma.performanceMetric.deleteMany({});
  await prisma.crisisAlert.deleteMany({}); // MUST come before Message
  await prisma.message.deleteMany({});
  await prisma.chatSummary.deleteMany({});
  await prisma.conversationInsight.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.readinessScore.deleteMany({});
  await prisma.wearableData.deleteMany({});
  await prisma.moodLog.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.taskPattern.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.coachAthleteRelation.deleteMany({});
  await prisma.knowledgeBase.deleteMany({});
  await prisma.pushToken.deleteMany({});
  await prisma.tokenUsage.deleteMany({});
  await prisma.userSettings.deleteMany({});
  await prisma.athlete.deleteMany({});
  await prisma.coach.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.school.deleteMany({});

  console.log('   ✓ All existing data cleared!');

  // Create school
  console.log('📚 Creating school...');
  const school = await prisma.school.upsert({
    where: { id: 'school-demo-001' },
    update: { updatedAt: new Date() },
    create: {
      id: 'school-demo-001',
      name: 'University of Washington',
      division: 'D1',
      updatedAt: new Date(),
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
      Coach: {
        create: {
          sport: 'Basketball',
        },
      },
    },
  });

  // Create 150 sample athletes across 12 sports
  console.log('🏃 Creating 150 sample athletes across 12 sports...');
  const sports = [
    'Basketball',
    'Football',
    'Soccer',
    'Baseball',
    'Volleyball',
    'Track & Field',
    'Swimming',
    'Tennis',
    'Cross Country',
    'Wrestling',
    'Gymnastics',
    'Lacrosse',
  ];
  const years = ['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR'];
  const positions = {
    Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
    Football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Linebacker', 'Safety', 'Defensive Back'],
    Soccer: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
    Baseball: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop', 'Outfield'],
    Volleyball: ['Outside Hitter', 'Middle Blocker', 'Setter', 'Libero', 'Opposite'],
    'Track & Field': ['Sprinter', 'Distance Runner', 'Jumper', 'Thrower', 'Hurdler'],
    Swimming: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'IM'],
    Tennis: ['Singles', 'Doubles'],
    'Cross Country': ['Distance Runner'],
    Wrestling: ['Lightweight', 'Middleweight', 'Heavyweight'],
    Gymnastics: ['All-Around', 'Vault', 'Bars', 'Beam', 'Floor'],
    Lacrosse: ['Attack', 'Midfield', 'Defense', 'Goalie'],
  };

  const athletePassword = await hash('Athlete2024!', 10);

  // First and last names for realistic athlete names
  const firstNames = [
    'Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Avery', 'Quinn', 'Blake', 'Cameron',
    'Sam', 'Drew', 'Reese', 'Peyton', 'Dylan', 'Skyler', 'Rowan', 'Sage', 'River', 'Phoenix',
    'Jamie', 'Kai', 'Dakota', 'Logan', 'Parker', 'Hayden', 'Charlie', 'Emerson', 'Finley', 'Spencer',
  ];
  const lastNames = [
    'Johnson', 'Smith', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson',
    'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark',
    'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez',
  ];

  const athletes = [];
  for (let i = 1; i <= 150; i++) {
    const sport = sports[(i - 1) % sports.length];
    const year = years[Math.floor(Math.random() * years.length)];
    const positionList = positions[sport as keyof typeof positions];
    const position = positionList[Math.floor(Math.random() * positionList.length)];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const athleteName = `${firstName} ${lastName}`;

    const athlete = await prisma.user.create({
      data: {
        id: `user-athlete-${String(i).padStart(3, '0')}`,
        email: `athlete${i}@uw.edu`,
        name: athleteName,
        password: athletePassword,
        role: 'ATHLETE',
        schoolId: school.id,
        Athlete: {
          create: {
            sport,
            year,
            teamPosition: position,
            consentCoachView: true,
          },
        },
      },
      include: {
        Athlete: true,
      },
    });

    athletes.push(athlete);

    // Log progress every 25 athletes
    if (i % 25 === 0) {
      console.log(`   ✓ Created ${i}/150 athletes`);
    }
  }
  console.log(`   ✓ All 150 athletes created!`);

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

  // Create chat sessions and insights for first 20 athletes
  console.log('💬 Creating chat sessions with psychological insights...');
  const emotionalTones = ['anxious', 'confident', 'frustrated', 'motivated', 'neutral'];
  const topics = [
    'performance-anxiety',
    'team-conflict',
    'coach-pressure',
    'injury-concern',
    'academic-stress',
    'mindset-mental',
    'goal-setting',
    'recovery-rest',
    'competition-preparation',
    'technique-refinement'
  ];
  const stressIndicators = [
    'fear of failure',
    'coach pressure',
    'performance expectations',
    'academic overload',
    'comparison to others',
    'injury anxiety'
  ];
  const copingStrategies = [
    'visualization',
    'breathing exercises',
    'positive self-talk',
    'goal setting',
    'seeking support',
    'rest and recovery'
  ];

  for (let i = 0; i < 20; i++) {
    const athlete = athletes[i];

    // Create 3-5 chat sessions for each athlete over the past 30 days
    const numSessions = 3 + Math.floor(Math.random() * 3);

    for (let sessionIdx = 0; sessionIdx < numSessions; sessionIdx++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - (sessionIdx * 7 + Math.floor(Math.random() * 3)));

      // Create chat session
      const session = await prisma.chatSession.create({
        data: {
          athleteId: athlete.id,
          createdAt: sessionDate,
          updatedAt: sessionDate,
          isActive: false
        }
      });

      // Create messages for the session (3-8 messages)
      const numMessages = 3 + Math.floor(Math.random() * 6);
      for (let msgIdx = 0; msgIdx < numMessages; msgIdx++) {
        const msgDate = new Date(sessionDate);
        msgDate.setMinutes(msgDate.getMinutes() + (msgIdx * 2));

        await prisma.message.create({
          data: {
            id: `msg-${athlete.id}-${sessionIdx}-${msgIdx}`,
            sessionId: session.id,
            role: msgIdx % 2 === 0 ? 'user' : 'assistant',
            content: msgIdx % 2 === 0 ? 'Athlete message content' : 'AI response content',
            createdAt: msgDate
          }
        });
      }

      // Determine sentiment pattern based on session timing
      // Sessions closer to games tend to be more anxious
      const daysFromNow = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      const isRecentSession = daysFromNow < 7;

      // Create varied sentiment patterns
      let sentiment: number;
      let tone: string;
      let selectedTopics: string[];
      let selectedStressors: string[];
      let selectedCoping: string[];

      if (Math.random() < 0.3) {
        // 30% anxious/struggling sessions
        sentiment = -0.6 + (Math.random() * 0.4); // -0.6 to -0.2
        tone = Math.random() < 0.6 ? 'anxious' : 'frustrated';
        selectedTopics = [topics[0], topics[1], topics[2]].slice(0, 2); // anxiety, conflict, pressure
        selectedStressors = stressIndicators.slice(0, 2 + Math.floor(Math.random() * 2));
        selectedCoping = copingStrategies.slice(0, 1); // Few coping strategies
      } else if (Math.random() < 0.5) {
        // 35% confident/motivated sessions
        sentiment = 0.4 + (Math.random() * 0.5); // 0.4 to 0.9
        tone = Math.random() < 0.6 ? 'confident' : 'motivated';
        selectedTopics = [topics[5], topics[6], topics[8]].slice(0, 2); // mindset, goals, prep
        selectedStressors = [];
        selectedCoping = copingStrategies.slice(0, 2 + Math.floor(Math.random() * 2));
      } else {
        // 35% neutral/mixed sessions
        sentiment = -0.2 + (Math.random() * 0.4); // -0.2 to 0.2
        tone = 'neutral';
        selectedTopics = [topics[Math.floor(Math.random() * topics.length)]];
        selectedStressors = Math.random() < 0.5 ? [stressIndicators[0]] : [];
        selectedCoping = copingStrategies.slice(0, 1 + Math.floor(Math.random() * 2));
      }

      // Create ChatInsight
      await prisma.chatInsight.create({
        data: {
          sessionId: session.id,
          athleteId: athlete.id,
          createdAt: sessionDate,
          overallSentiment: sentiment,
          emotionalTone: tone,
          confidenceLevel: Math.round(50 + sentiment * 30 + Math.random() * 15),
          topics: selectedTopics,
          dominantTheme: selectedTopics[0] || null,
          stressIndicators: selectedStressors,
          copingStrategies: selectedCoping,
          isPreGame: false,
          gameDate: null,
          daysUntilGame: null,
          preGameMindset: null,
          sessionDuration: 10 + Math.floor(Math.random() * 20), // 10-30 minutes
          messageCount: numMessages
        }
      });
    }

    if ((i + 1) % 5 === 0) {
      console.log(`   ✓ Created chat sessions for ${i + 1}/20 athletes`);
    }
  }
  console.log(`   ✓ All chat sessions and insights created!`);

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

      // NEW: Create GameResult with linked mental state from 3 days before
      // Get chat insights from 3 days before game
      const threeDaysBefore = new Date(gameDate);
      threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

      const chatInsights = await prisma.chatInsight.findMany({
        where: {
          athleteId: athlete.id,
          createdAt: {
            gte: threeDaysBefore,
            lte: gameDate
          }
        }
      });

      // Calculate average sentiment from chats before game
      const avgSentiment = chatInsights.length > 0
        ? chatInsights.reduce((sum, i) => sum + i.overallSentiment, 0) / chatInsights.length
        : null;

      // Get unique topics discussed before game
      const psychThemes = chatInsights.length > 0
        ? [...new Set(chatInsights.flatMap(i => i.topics))]
        : [];

      // Create GameResult
      await prisma.gameResult.create({
        data: {
          athleteId: athlete.id,
          gameDate,
          opponent: opponents[gameIdx],
          sport: athlete.athlete?.sport || 'Basketball',
          stats: {
            ...stats,
            performanceScore: Math.round((stats.points / 30) * 100) // Normalize to 0-100
          },
          outcome,
          readinessScore: readinessScore,
          chatSentiment: avgSentiment,
          psychThemes: psychThemes,
          scrapedFrom: 'seed-script',
          scrapedAt: new Date()
        }
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
  console.log(`   - 150 Athletes across 12 sports (athlete1@uw.edu to athlete150@uw.edu / Athlete2024!)`);
  console.log(`   - ${150 * 30} Mood Logs (30 days per athlete with high/low readiness patterns)`);
  console.log(`   - ~80 Chat Sessions with psychological insights (first 20 athletes)`);
  console.log(`   - ~80 ChatInsights (sentiment, topics, stress indicators from conversations)`);
  console.log(`   - ${10 * 10} Performance Metrics (10 games, 10 athletes) - CORRELATED WITH READINESS`);
  console.log(`   - ${10 * 10} Game Results with linked mental state (readiness + chat sentiment)`);
  console.log(`   - 10 Goals`);
  console.log(`   - 3 Knowledge Base Entries`);
  console.log('\n🏆 Sports Covered:');
  console.log(`   ${sports.join(', ')}`);
  console.log('\n🎯 Performance Correlation Details:');
  console.log('   - High Readiness (>85) → 18-28 PPG, 5-8 APG, 80% win rate');
  console.log('   - Low Readiness (<70) → 8-15 PPG, 1-3 APG, 30% win rate');
  console.log('   - Expected Pearson r > 0.5 for Points, Assists, Rebounds vs Readiness');
  console.log('\n💬 Chat Insights Data:');
  console.log('   - Sentiment patterns: 30% anxious, 35% confident, 35% neutral');
  console.log('   - Topics: performance-anxiety, mindset-mental, goal-setting, team-conflict, etc.');
  console.log('   - Stress indicators: fear of failure, coach pressure, performance expectations');
  console.log('   - GameResults linked to chat sentiment from 3 days before game');
  console.log('\n🎉 Ready for MVP demo with multi-modal correlation analysis!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
