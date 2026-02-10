import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { calculateReadiness } from '../src/lib/analytics/readiness';
import { getSportConfig } from '../src/lib/analytics/sport-configs';

// Load environment variables from .env.local (override .env)
config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

// Initialize Supabase Admin client for auth user creation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Helper to create or update a Supabase Auth user
 * Returns the Supabase Auth UUID to use as the Prisma user ID
 */
async function getOrCreateSupabaseAuthUser(email: string, password: string): Promise<string | null> {
  try {
    // Try to create the user first
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for seed users
    });

    if (!createError && createData.user) {
      console.log(`   ✓ Created Supabase Auth user: ${email} (ID: ${createData.user.id})`);
      return createData.user.id;
    }

    // If user already exists, find them and update password
    if (createError?.message?.includes('already been registered')) {
      // List users with pagination to find the existing user
      let page = 1;
      const perPage = 1000;

      while (true) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });

        const existingUser = listData?.users?.find(u => u.email === email);
        if (existingUser) {
          // Update the password
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password,
          });
          console.log(`   ↻ Updated Supabase Auth user: ${email} (ID: ${existingUser.id})`);
          return existingUser.id;
        }

        // If we got fewer users than perPage, we've reached the end
        if (!listData?.users || listData.users.length < perPage) {
          break;
        }
        page++;
      }

      console.error(`   ✗ User ${email} exists but couldn't be found in list`);
      return null;
    }

    console.error(`   ✗ Failed to create Supabase Auth user ${email}:`, createError?.message);
    return null;
  } catch (error: any) {
    console.error(`   ✗ Error with Supabase Auth for ${email}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🌱 Starting database seed...');
  console.log('');
  console.log('📋 Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.log('📋 Service Key:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
  console.log('');

  // Clear all existing data (delete in correct order to respect foreign keys)
  console.log('🗑️  Clearing existing data...');

  // Delete child records first (newest models first)
  await prisma.predictionLog.deleteMany({});
  await prisma.athleteModel.deleteMany({});
  await prisma.interventionOutcome.deleteMany({});
  await prisma.intervention.deleteMany({});
  await prisma.wearableDataPoint.deleteMany({});
  await prisma.wearableConnection.deleteMany({});
  await prisma.performanceOutcome.deleteMany({});
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
  const coachPasswordPlain = 'Coach2024!';
  const coachPassword = await hash(coachPasswordPlain, 10);

  // Create Supabase Auth user for coach FIRST to get the UUID
  console.log('   Creating Supabase Auth user for coach...');
  const coachAuthId = await getOrCreateSupabaseAuthUser('coach@uw.edu', coachPasswordPlain);
  if (!coachAuthId) {
    throw new Error('Failed to create Supabase Auth user for coach');
  }

  // Use Supabase Auth UUID as Prisma user ID
  const coach = await prisma.user.upsert({
    where: { id: coachAuthId },
    update: {
      email: 'coach@uw.edu',
      name: 'Coach Mike Johnson',
      password: coachPassword,
      role: 'COACH',
      schoolId: school.id,
    },
    create: {
      id: coachAuthId, // Use Supabase Auth UUID
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

  // Create 50 sample athletes across 12 sports
  console.log('🏃 Creating 50 sample athletes across 12 sports...');
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

  const athletePasswordPlain = 'Athlete2024!';
  const athletePassword = await hash(athletePasswordPlain, 10);

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
  for (let i = 1; i <= 50; i++) {
    const sport = sports[(i - 1) % sports.length];
    const year = years[Math.floor(Math.random() * years.length)];
    const positionList = positions[sport as keyof typeof positions];
    const position = positionList[Math.floor(Math.random() * positionList.length)];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const athleteName = `${firstName} ${lastName}`;
    const athleteEmail = `athlete${i}@uw.edu`;

    // Create Supabase Auth user FIRST to get the UUID
    const athleteAuthId = await getOrCreateSupabaseAuthUser(athleteEmail, athletePasswordPlain);
    if (!athleteAuthId) {
      console.error(`   ✗ Skipping athlete ${i} - failed to create Supabase Auth user`);
      continue;
    }

    // Use Supabase Auth UUID as Prisma user ID
    const athlete = await prisma.user.upsert({
      where: { id: athleteAuthId },
      update: {
        email: athleteEmail,
        name: athleteName,
        password: athletePassword,
        role: 'ATHLETE',
        schoolId: school.id,
      },
      create: {
        id: athleteAuthId, // Use Supabase Auth UUID
        email: athleteEmail,
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
            consentChatSummaries: true,
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
      console.log(`   ✓ Created ${i}/50 athletes`);
    }
  }
  console.log(`   ✓ All ${athletes.length} athletes created!`);

  // Create coach-athlete relationships for all athletes
  console.log('🔗 Creating coach-athlete relationships...');
  for (const athlete of athletes) {
    await prisma.coachAthleteRelation.create({
      data: {
        coachId: coach.id,
        athleteId: athlete.id,
        consentGranted: true,
        joinedAt: new Date(),
        notes: null,
      },
    });
  }
  console.log(`   ✓ Created ${athletes.length} coach-athlete relationships!`);

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

  // Create chat sessions and insights for ALL 50 athletes (3-7 sessions each)
  console.log('💬 Creating chat sessions with psychological insights for ALL athletes...');
  const emotionalTones = ['anxious', 'confident', 'frustrated', 'motivated', 'neutral', 'hopeful', 'overwhelmed', 'focused'];
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
    'technique-refinement',
    'confidence-building',
    'pre-game-nerves',
    'post-game-reflection',
    'slump-recovery',
    'leadership-development'
  ];
  const stressIndicators = [
    'fear of failure',
    'coach pressure',
    'performance expectations',
    'academic overload',
    'comparison to others',
    'injury anxiety',
    'family expectations',
    'social media criticism',
    'scholarship concerns',
    'playing time worries'
  ];
  const copingStrategies = [
    'visualization',
    'breathing exercises',
    'positive self-talk',
    'goal setting',
    'seeking support',
    'rest and recovery',
    'journaling',
    'mindfulness meditation',
    'focus cues',
    'pre-performance routine'
  ];

  // Realistic conversation templates
  const userMessages = [
    // Performance anxiety
    "I've been struggling with nerves before big games lately. My heart races and I can't focus.",
    "I keep thinking about what happens if I mess up and let my team down.",
    "Coach says I'm overthinking but I can't help it. Every mistake feels huge.",
    // Confidence
    "I had a great practice today, finally feeling like myself again.",
    "The visualization exercises you suggested are really helping. I feel more prepared.",
    "I'm starting to trust my training more. Less second-guessing.",
    // Recovery from slump
    "I've been in a slump for 3 weeks now. Nothing I try seems to work.",
    "Everyone keeps telling me to relax but that just makes me more frustrated.",
    "I miss how I used to play without thinking so much.",
    // Academic stress
    "I have three midterms this week AND two away games. I'm exhausted.",
    "I can't sleep because I'm thinking about everything I have to do.",
    "Sometimes I wonder if I can really handle being a student-athlete.",
    // Team dynamics
    "There's been tension with some teammates. It's affecting my focus.",
    "I feel like I'm not getting along with the new coach's style.",
    "I want to be a better leader but I don't know how to motivate everyone.",
    // Goal-setting
    "I want to set some goals for this season but I don't know where to start.",
    "I achieved my goal from last month! What should I work on next?",
    "I'm not sure if my goals are realistic or if I'm aiming too low.",
    // Pre-game
    "Game tomorrow. Feeling pretty good but a little anxious.",
    "I'm visualizing success like we discussed. It's becoming more natural.",
    "What should I focus on tonight before the championship?"
  ];

  const assistantResponses = [
    // Empathetic + technique
    "It sounds like pre-game anxiety is really affecting you. This is incredibly common among elite athletes. Let's work on a grounding technique - when you notice your heart racing, try the 4-7-8 breathing pattern. Would you like to practice it together?",
    "I hear you - that fear of letting others down can be overwhelming. But here's something to consider: your teammates chose to play alongside you for a reason. Let's reframe those thoughts. What would you say to a teammate feeling this way?",
    "Overthinking is your brain trying to protect you, but we can redirect that energy. Before your next competition, I want you to pick three specific focus cues - simple words that anchor you to the present moment. What aspects of your game feel most automatic?",
    // Celebrating progress
    "That's wonderful to hear! Momentum builds on moments like these. What specifically felt different about today's practice? Let's identify what you can replicate.",
    "I'm so glad the visualization is working for you. The brain doesn't fully distinguish between vividly imagined and real experiences. You're literally training your neural pathways for success.",
    "That shift from outcome-focus to process-focus is huge. Trusting your training means you've done the work. Now it's about letting your body do what it knows.",
    // Working through struggles
    "Slumps are frustrating precisely because they feel mysterious. But I've noticed in our conversations that you mention being 'in your head' a lot. Let's try something: this week, I want you to focus only on effort, not results. Can you commit to that?",
    "When people tell you to relax, it can feel dismissive of what you're experiencing. Your frustration is valid. Instead of trying to relax, let's channel that intensity into something productive. What one small thing could you control in your next practice?",
    "The beautiful thing about sport is that your body remembers how to perform. The skills are still there. Sometimes we need to quiet the mind to let the body play. Have you tried mindfulness exercises?",
    // Balance and wellbeing
    "That's a lot on your plate. First, let's acknowledge that feeling overwhelmed doesn't mean you're failing - it means you're human. Let's break this week down into manageable chunks. What's the most important thing tomorrow?",
    "Sleep deprivation will hurt both your academic and athletic performance. Tonight, I want you to write down everything on your mind, then close the notebook. It tells your brain 'I've got this handled' so you can rest.",
    "Being a student-athlete is genuinely hard. The fact that you're questioning it shows self-awareness, not weakness. What drew you to your sport in the first place? Sometimes reconnecting with that can help.",
    // Relationships
    "Team dynamics significantly impact individual performance. Without needing details, can you tell me what you need from those relationships that you're not getting right now?",
    "Adjusting to a new coaching style takes time. What aspects of the new approach challenge you most? Sometimes understanding 'why' behind new methods helps us adapt.",
    "Leadership isn't about having all the answers. It's about showing up consistently and caring about your teammates' success. What's one small way you could support a teammate this week?",
    // Goals
    "Great! Effective goals are specific, measurable, and challenging but achievable. Let's start with your biggest aspiration for this season, then we'll break it into weekly milestones. What matters most to you?",
    "Congratulations! Take a moment to really feel that accomplishment. Now, based on what you learned achieving that goal, what feels like the right next challenge? We want to stay in that growth zone.",
    "There's an art to goal-setting. Too easy and we're not motivated; too hard and we get discouraged. What would 'realistic stretch' look like for you? What would you attempt if you knew you couldn't fail?",
    // Pre-competition
    "Good - a little anxiety actually helps performance. It means you care. Tonight, visualize yourself succeeding in key moments. Then get good sleep. You've prepared for this. Trust your training.",
    "Excellent! The fact that visualization feels more natural shows your mind-body connection is strengthening. Keep that practice up tonight, focusing on how success FEELS, not just looks.",
    "For the championship: Stay present, use your pre-performance routine, and remember - pressure is privilege. Not everyone gets to compete at this level. Embrace it. You belong here."
  ];

  let totalSessions = 0;
  for (let i = 0; i < athletes.length; i++) {
    const athlete = athletes[i];

    // Create 3-7 chat sessions for each athlete over the past 45 days
    const numSessions = 3 + Math.floor(Math.random() * 5);

    for (let sessionIdx = 0; sessionIdx < numSessions; sessionIdx++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - (sessionIdx * 6 + Math.floor(Math.random() * 5)));

      // Determine session topic/theme
      const sessionTopic = topics[Math.floor(Math.random() * topics.length)];
      const focusArea = ['performance', 'mental', 'recovery', 'preparation', 'confidence'][Math.floor(Math.random() * 5)];

      // Create chat session
      const session = await prisma.chatSession.create({
        data: {
          athleteId: athlete.id,
          topic: sessionTopic,
          focusArea: focusArea,
          createdAt: sessionDate,
          updatedAt: sessionDate,
          isActive: false,
          discoveryPhase: 'follow_up',
        }
      });

      // Create realistic messages for the session (4-12 messages)
      const numMessages = 4 + Math.floor(Math.random() * 9);
      for (let msgIdx = 0; msgIdx < numMessages; msgIdx++) {
        const msgDate = new Date(sessionDate);
        msgDate.setMinutes(msgDate.getMinutes() + (msgIdx * 2) + Math.floor(Math.random() * 3));

        const isUser = msgIdx % 2 === 0;
        // Pick relevant messages based on topic
        let content: string;
        if (isUser) {
          content = userMessages[Math.floor(Math.random() * userMessages.length)];
        } else {
          content = assistantResponses[Math.floor(Math.random() * assistantResponses.length)];
        }

        await prisma.message.create({
          data: {
            id: `msg-${athlete.id}-${sessionIdx}-${msgIdx}`,
            sessionId: session.id,
            role: isUser ? 'user' : 'assistant',
            content: content,
            createdAt: msgDate
          }
        });
      }

      // Determine sentiment pattern based on session topic and timing
      const daysFromNow = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

      // Create varied sentiment patterns based on topic
      let sentiment: number;
      let tone: string;
      let selectedStressors: string[];
      let selectedCoping: string[];

      // Topic-based sentiment patterns
      if (sessionTopic.includes('anxiety') || sessionTopic.includes('pressure') || sessionTopic.includes('stress')) {
        sentiment = -0.5 + (Math.random() * 0.3); // -0.5 to -0.2
        tone = emotionalTones[Math.floor(Math.random() * 3)]; // anxious, confident, frustrated
        selectedStressors = stressIndicators.slice(0, 2 + Math.floor(Math.random() * 3));
        selectedCoping = copingStrategies.slice(0, 1 + Math.floor(Math.random() * 2));
      } else if (sessionTopic.includes('confidence') || sessionTopic.includes('goal') || sessionTopic.includes('preparation')) {
        sentiment = 0.3 + (Math.random() * 0.5); // 0.3 to 0.8
        tone = emotionalTones[1 + Math.floor(Math.random() * 3)]; // confident, frustrated, motivated
        selectedStressors = Math.random() < 0.2 ? [stressIndicators[Math.floor(Math.random() * stressIndicators.length)]] : [];
        selectedCoping = copingStrategies.slice(0, 2 + Math.floor(Math.random() * 3));
      } else if (sessionTopic.includes('slump') || sessionTopic.includes('conflict')) {
        sentiment = -0.3 + (Math.random() * 0.4); // -0.3 to 0.1
        tone = emotionalTones[2 + Math.floor(Math.random() * 3)]; // frustrated, motivated, neutral
        selectedStressors = stressIndicators.slice(0, 1 + Math.floor(Math.random() * 2));
        selectedCoping = copingStrategies.slice(0, 2 + Math.floor(Math.random() * 2));
      } else {
        // Neutral/mixed sessions
        sentiment = -0.1 + (Math.random() * 0.4); // -0.1 to 0.3
        tone = emotionalTones[4 + Math.floor(Math.random() * 4)]; // neutral, hopeful, overwhelmed, focused
        selectedStressors = Math.random() < 0.4 ? [stressIndicators[Math.floor(Math.random() * stressIndicators.length)]] : [];
        selectedCoping = copingStrategies.slice(0, 1 + Math.floor(Math.random() * 3));
      }

      // Determine if pre-game session
      const isPreGame = Math.random() < 0.2;
      const preGameDate = isPreGame ? new Date(sessionDate.getTime() + 24 * 60 * 60 * 1000) : null;

      const selectedTopics: string[] = [sessionTopic];
      if (Math.random() < 0.4) {
        selectedTopics.push(topics[Math.floor(Math.random() * topics.length)]);
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
          dominantTheme: sessionTopic,
          stressIndicators: selectedStressors,
          copingStrategies: selectedCoping,
          isPreGame: isPreGame,
          gameDate: preGameDate,
          daysUntilGame: isPreGame ? 1 : null,
          preGameMindset: isPreGame ? (sentiment > 0 ? 'confident' : 'nervous') : null,
          sessionDuration: 8 + Math.floor(Math.random() * 25), // 8-33 minutes
          messageCount: numMessages
        }
      });

      totalSessions++;
    }

    // Log progress every 10 athletes
    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Created chat sessions for ${i + 1}/50 athletes`);
    }
  }
  console.log(`   ✓ Created ${totalSessions} chat sessions with insights for ALL 50 athletes!`);

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
        createdAt: moodLog.createdAt,
      }, athlete.Athlete?.sport || 'Basketball');

      const readinessScore = readinessBreakdown.overall;

      // Generate stats that correlate with readiness
      // High readiness (>85) → excellent performance
      // Medium readiness (70-85) → good performance
      // Low readiness (<70) → poor performance
      let stats = {};
      let outcome = 'UNKNOWN';

      if (athlete.Athlete?.sport === 'Basketball') {
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
          sport: athlete.Athlete?.sport || 'Basketball',
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
          sport: athlete.Athlete?.sport || 'Basketball',
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

  // ============================================
  // WEEKLY CHAT SUMMARIES (for coach view)
  // ============================================
  console.log('📋 Creating weekly chat summaries...');
  let summaryCount = 0;
  for (const athlete of athletes) {
    // Create 4 weekly summaries (past 4 weeks)
    for (let weekIdx = 0; weekIdx < 4; weekIdx++) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (weekIdx * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);

      // Simulate weekly mood averages based on mood logs
      const moodScore = 5 + Math.random() * 4; // 5-9
      const stressScore = 2 + Math.random() * 5; // 2-7
      const confidenceScore = 5 + Math.random() * 4; // 5-9

      // Generate realistic summary
      const summaryTexts = [
        `${athlete.name} showed consistent engagement this week with ${3 + Math.floor(Math.random() * 3)} check-ins. Overall mood trending ${moodScore > 7 ? 'positive' : 'stable'}. Key focus areas included competition preparation and managing pre-game anxiety.`,
        `This week ${athlete.name} discussed managing academic stress alongside training demands. Showed good use of coping strategies discussed in previous sessions. Confidence levels ${confidenceScore > 7 ? 'improving' : 'maintained'}.`,
        `${athlete.name} had a productive week focusing on ${topics[Math.floor(Math.random() * topics.length)].replace('-', ' ')}. Reported ${stressScore < 4 ? 'low' : 'moderate'} stress levels and good sleep quality.`,
        `Notable progress in goal-setting and mental preparation for ${athlete.name}. Utilized visualization techniques before practice. Overall trajectory: ${moodScore > 6 ? 'positive' : 'stable'}.`,
      ];

      const keyThemes = [
        topics[Math.floor(Math.random() * topics.length)],
        topics[Math.floor(Math.random() * topics.length)],
      ];

      const actionItems = [
        'Continue daily visualization practice',
        'Use breathing exercises before competition',
        'Check in about academic balance next week',
        'Review goal progress in next session',
      ].slice(0, 2 + Math.floor(Math.random() * 2));

      const riskFlags = stressScore > 6 || moodScore < 5
        ? ['elevated stress', 'monitor closely']
        : [];

      const recommendedActions = stressScore > 6
        ? ['Schedule follow-up check-in', 'Consider stress management session']
        : ['Continue current approach', 'Maintain engagement'];

      await prisma.chatSummary.create({
        data: {
          athleteId: athlete.id,
          coachId: coach.id,
          summaryType: 'WEEKLY',
          weekStart,
          weekEnd,
          summary: summaryTexts[weekIdx % summaryTexts.length],
          keyThemes: keyThemes,
          emotionalState: moodScore > 7 ? 'positive' : moodScore > 5 ? 'neutral' : 'concerning',
          actionItems: actionItems,
          messageCount: 8 + Math.floor(Math.random() * 12),
          moodScore,
          stressScore,
          confidenceScore,
          sleepQualityScore: 6 + Math.random() * 3,
          riskFlags,
          recommendedActions,
          sessionCount: 1 + Math.floor(Math.random() * 3),
          engagementScore: 0.6 + Math.random() * 0.35,
          viewedByCoach: weekIdx > 1 ? Math.random() > 0.3 : false,
          viewedAt: weekIdx > 1 && Math.random() > 0.3 ? new Date(weekEnd.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
          generatedAt: new Date(weekEnd.getTime() + 12 * 60 * 60 * 1000), // Generated 12 hours after week end
          expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // Expires in 90 days
        },
      });
      summaryCount++;
    }
  }
  console.log(`   ✓ Created ${summaryCount} weekly chat summaries!`);

  // ============================================
  // INTERVENTIONS & INTERVENTION OUTCOMES
  // ============================================
  console.log('🧘 Creating interventions and outcomes...');
  const interventionTypes = [
    'BREATHING',
    'VISUALIZATION',
    'SELF_TALK',
    'ROUTINE',
    'FOCUS_CUE',
    'AROUSAL_REGULATION',
    'GOAL_SETTING',
    'COGNITIVE_REFRAME',
    'MINDFULNESS',
    'JOURNALING'
  ] as const;

  const interventionContexts = [
    'PRE_GAME',
    'PRE_PRACTICE',
    'POST_ERROR',
    'POST_GAME',
    'POST_LOSS',
    'SLUMP',
    'DAILY_ROUTINE',
    'ON_DEMAND'
  ] as const;

  const interventionSources = [
    'AI_SUGGESTED',
    'SELF_INITIATED',
    'COACH_ASSIGNED'
  ] as const;

  const protocolNames: Record<string, string[]> = {
    BREATHING: ['4-7-8 Breathing', 'Box Breathing', 'Diaphragmatic Breathing', 'Tactical Breathing'],
    VISUALIZATION: ['Success Imagery', 'Performance Rehearsal', 'Outcome Visualization', 'Process Visualization'],
    SELF_TALK: ['Positive Affirmations', 'Cue Words', 'Motivational Self-Talk', 'Instructional Self-Talk'],
    ROUTINE: ['Pre-Shot Routine', 'Pre-Game Ritual', 'Between-Point Routine', 'Morning Routine'],
    FOCUS_CUE: ['Anchor Words', 'Physical Trigger', 'Refocus Cue', 'Attention Reset'],
    AROUSAL_REGULATION: ['Energizing Routine', 'Calming Sequence', 'Optimal Activation', 'State Management'],
    GOAL_SETTING: ['SMART Goal Review', 'Weekly Intention Setting', 'Process Goals', 'Micro-Goals'],
    COGNITIVE_REFRAME: ['Thought Challenging', 'Perspective Shift', 'Reattribution', 'Growth Mindset Reframe'],
    MINDFULNESS: ['Body Scan', 'Present Moment Awareness', 'Mindful Movement', 'Acceptance Practice'],
    JOURNALING: ['Performance Journal', 'Gratitude Log', 'Reflection Writing', 'Goal Progress Journal']
  };

  let interventionCount = 0;
  let outcomeCount = 0;

  // Create interventions for all athletes (3-8 per athlete)
  for (const athlete of athletes) {
    const numInterventions = 3 + Math.floor(Math.random() * 6);

    for (let i = 0; i < numInterventions; i++) {
      const type = interventionTypes[Math.floor(Math.random() * interventionTypes.length)];
      const context = interventionContexts[Math.floor(Math.random() * interventionContexts.length)];
      const source = interventionSources[Math.floor(Math.random() * interventionSources.length)];
      const protocols = protocolNames[type] || ['General Protocol'];
      const protocol = protocols[Math.floor(Math.random() * protocols.length)];

      const performedDate = new Date(now);
      performedDate.setDate(performedDate.getDate() - Math.floor(Math.random() * 30));

      const completed = Math.random() > 0.15; // 85% completion rate
      const athleteRating = completed ? (3 + Math.random() * 2) : null; // 3-5 rating

      // Calculate effectiveness based on context and rating
      const baseEffectiveness = completed ? 0.4 + Math.random() * 0.5 : null;

      const intervention = await prisma.intervention.create({
        data: {
          athleteId: athlete.id,
          type,
          protocol,
          description: `${protocol} technique for ${context.toLowerCase().replace('_', ' ')} situations`,
          performedAt: performedDate,
          context,
          source,
          completed,
          athleteRating,
          effectivenessScore: baseEffectiveness,
        },
      });
      interventionCount++;

      // Create 1-2 outcome measurements for completed interventions
      if (completed && Math.random() > 0.3) {
        const numOutcomes = 1 + Math.floor(Math.random() * 2);
        for (let j = 0; j < numOutcomes; j++) {
          const measureDate = new Date(performedDate);
          measureDate.setHours(measureDate.getHours() + (j + 1) * 2);

          // Changes are correlated with rating
          const changeMultiplier = (athleteRating || 3) - 3; // -0 to 2

          await prisma.interventionOutcome.create({
            data: {
              interventionId: intervention.id,
              moodChange: (Math.random() * 0.5 + changeMultiplier * 0.2),
              confidenceChange: (Math.random() * 0.6 + changeMultiplier * 0.25),
              stressChange: -(Math.random() * 0.4 + changeMultiplier * 0.15), // Negative = reduction
              focusChange: (Math.random() * 0.4 + changeMultiplier * 0.2),
              measuredAt: measureDate,
              hoursAfterIntervention: (j + 1) * 2,
            },
          });
          outcomeCount++;
        }
      }
    }
  }
  console.log(`   ✓ Created ${interventionCount} interventions with ${outcomeCount} outcomes!`);

  // ============================================
  // ATHLETE MODELS (ML-derived personalization)
  // ============================================
  console.log('🧠 Creating athlete models with baselines...');
  for (const athlete of athletes) {
    // Calculate realistic baselines with some variation
    const baselineMood = 6 + Math.random() * 2;
    const baselineConfidence = 6 + Math.random() * 2;
    const baselineStress = 3 + Math.random() * 2;
    const baselineSleep = 6.5 + Math.random() * 1.5;

    // Optimal values are slightly higher than baseline
    const optimalMood = Math.min(10, baselineMood + 1 + Math.random());
    const optimalConfidence = Math.min(10, baselineConfidence + 1 + Math.random());
    const optimalStress = Math.max(1, baselineStress - 1 - Math.random() * 0.5);
    const optimalSleep = Math.min(9, baselineSleep + 0.5 + Math.random() * 0.5);

    // Create intervention profile based on athlete's interventions
    const interventionProfile = {
      breathing: { avgEffectiveness: 0.3 + Math.random() * 0.4, count: 2 + Math.floor(Math.random() * 5) },
      visualization: { avgEffectiveness: 0.35 + Math.random() * 0.35, count: 1 + Math.floor(Math.random() * 4) },
      self_talk: { avgEffectiveness: 0.25 + Math.random() * 0.4, count: 1 + Math.floor(Math.random() * 3) },
      mindfulness: { avgEffectiveness: 0.3 + Math.random() * 0.35, count: Math.floor(Math.random() * 4) },
    };

    // Risk factors specific to this athlete
    const riskFactors = [
      { factor: 'sleep_deficit', threshold: baselineSleep - 1.5, impact: -0.08 },
      { factor: 'stress_spike', threshold: baselineStress + 2, impact: -0.12 },
      { factor: 'pre_game_anxiety', threshold: 0.6, impact: -0.06 },
    ];

    // Prediction weights (how much each factor affects performance)
    const predictionWeights = {
      mood: 0.15 + Math.random() * 0.1,
      confidence: 0.2 + Math.random() * 0.1,
      stress: 0.15 + Math.random() * 0.1,
      sleep: 0.2 + Math.random() * 0.1,
      hrv: 0.1 + Math.random() * 0.05,
    };

    await prisma.athleteModel.create({
      data: {
        athleteId: athlete.id,
        baselineMood,
        baselineConfidence,
        baselineStress,
        baselineSleep,
        baselinePerformance: 70 + Math.random() * 15,
        optimalMood,
        optimalConfidence,
        optimalStress,
        optimalSleep,
        interventionProfile,
        riskFactors,
        predictionWeights,
        dataPointsUsed: 30 + Math.floor(Math.random() * 50),
        lastTrainedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        modelVersion: '1.0.0',
        accuracy: 0.7 + Math.random() * 0.2,
      },
    });
  }
  console.log(`   ✓ Created ${athletes.length} athlete models!`);

  // ============================================
  // PREDICTION LOGS
  // ============================================
  console.log('📈 Creating prediction logs...');
  let predictionCount = 0;
  for (const athlete of athletes) {
    // Create 10 predictions per athlete over last 30 days
    for (let i = 0; i < 10; i++) {
      const predictionDate = new Date(now);
      predictionDate.setDate(predictionDate.getDate() - Math.floor(Math.random() * 30));

      const predictedDeviation = -0.15 + Math.random() * 0.3; // -15% to +15%
      const confidence = 0.6 + Math.random() * 0.3;
      const riskLevel = predictedDeviation < -0.1 ? 'HIGH' : predictedDeviation < -0.05 ? 'MEDIUM' : 'LOW';

      // Contributing factors
      const contributingFactors = [
        { factor: 'sleep', impact: -0.05 + Math.random() * 0.1 },
        { factor: 'stress', impact: -0.08 + Math.random() * 0.1 },
        { factor: 'confidence', impact: Math.random() * 0.1 },
      ];

      const recommendedActions = [
        { action: 'Extra recovery focus', expectedImpact: 0.03 },
        { action: 'Pre-competition visualization', expectedImpact: 0.05 },
      ];

      // 70% have actual outcomes
      const hasOutcome = Math.random() > 0.3;
      const actualDeviation = hasOutcome ? predictedDeviation + (-0.1 + Math.random() * 0.2) : null;
      const predictionError = hasOutcome ? Math.abs((actualDeviation as number) - predictedDeviation) : null;

      await prisma.predictionLog.create({
        data: {
          athleteId: athlete.id,
          predictionDate,
          predictedDeviation,
          confidence,
          riskLevel: riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
          featuresUsed: {
            mood: 5 + Math.random() * 4,
            stress: 2 + Math.random() * 5,
            sleep: 5 + Math.random() * 4,
            daysSinceLastGame: Math.floor(Math.random() * 7),
          },
          contributingFactors,
          recommendedActions,
          actualDeviation,
          predictionError,
          wasAccurate: hasOutcome ? (predictionError as number) < 0.1 : null,
        },
      });
      predictionCount++;
    }
  }
  console.log(`   ✓ Created ${predictionCount} prediction logs!`);

  // ============================================
  // COMPREHENSIVE GOALS (multiple per athlete)
  // ============================================
  console.log('🎯 Creating comprehensive goals for all athletes...');
  const goalTemplates = [
    // Performance goals
    { category: 'PERFORMANCE', title: 'Improve Free Throw Percentage', description: 'Increase from 70% to 85%', targetMetric: 'free_throw_pct' },
    { category: 'PERFORMANCE', title: 'Increase Vertical Jump', description: 'Add 3 inches to max vertical', targetMetric: 'vertical_jump' },
    { category: 'PERFORMANCE', title: 'Reduce Personal Fouls', description: 'Average less than 2 fouls per game', targetMetric: 'fouls_per_game' },
    { category: 'PERFORMANCE', title: 'Improve Sprint Time', description: 'Cut 0.3 seconds off 40-yard dash', targetMetric: 'sprint_time' },
    // Mental goals
    { category: 'MENTAL', title: 'Build Pre-Game Routine', description: 'Develop consistent 20-minute mental preparation routine', targetMetric: 'routine_consistency' },
    { category: 'MENTAL', title: 'Master Visualization', description: 'Complete daily visualization for 30 days', targetMetric: 'visualization_streak' },
    { category: 'MENTAL', title: 'Manage Competition Anxiety', description: 'Reduce pre-game anxiety from 8/10 to 4/10', targetMetric: 'anxiety_level' },
    { category: 'MENTAL', title: 'Improve Focus Duration', description: 'Maintain focus for full practice without mental breaks', targetMetric: 'focus_duration' },
    // Academic goals
    { category: 'ACADEMIC', title: 'Maintain GPA', description: 'Keep semester GPA above 3.0', targetMetric: 'gpa' },
    { category: 'ACADEMIC', title: 'Complete Study Hours', description: 'Log 15 hours of study per week', targetMetric: 'study_hours' },
    // Personal goals
    { category: 'PERSONAL', title: 'Improve Sleep Quality', description: 'Average 7.5+ hours of quality sleep', targetMetric: 'sleep_hours' },
    { category: 'PERSONAL', title: 'Build Leadership Skills', description: 'Lead one team activity per month', targetMetric: 'leadership_activities' },
  ];

  const goalStatuses = ['IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'COMPLETED', 'NOT_STARTED'] as const;
  let goalCount = 0;

  for (const athlete of athletes) {
    // Each athlete gets 2-5 goals
    const numGoals = 2 + Math.floor(Math.random() * 4);
    const selectedGoals = [...goalTemplates].sort(() => Math.random() - 0.5).slice(0, numGoals);

    for (const goalTemplate of selectedGoals) {
      const status = goalStatuses[Math.floor(Math.random() * goalStatuses.length)];
      const completionPct = status === 'COMPLETED' ? 100
        : status === 'NOT_STARTED' ? 0
        : Math.floor(Math.random() * 80) + 10;

      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - (30 + Math.floor(Math.random() * 60)));

      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + (30 + Math.floor(Math.random() * 90)));

      await prisma.goal.create({
        data: {
          athleteId: athlete.id,
          title: goalTemplate.title,
          description: goalTemplate.description,
          category: goalTemplate.category as 'PERFORMANCE' | 'MENTAL' | 'ACADEMIC' | 'PERSONAL',
          status,
          completionPct,
          targetMetric: goalTemplate.targetMetric,
          startDate,
          targetDate,
          completedAt: status === 'COMPLETED' ? new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000) : null,
          type: Math.random() > 0.3 ? 'SHORT_TERM' : 'LONG_TERM',
        },
      });
      goalCount++;
    }
  }
  console.log(`   ✓ Created ${goalCount} goals across all athletes!`);

  // Create knowledge base entries
  console.log('📚 Creating knowledge base entries...');
  const kbEntries = [
    {
      id: 'kb-001',
      title: 'Managing Pre-Game Anxiety',
      content: 'Pre-game anxiety is normal and can be managed through breathing exercises, visualization, and positive self-talk. Research shows that controlled breathing can reduce cortisol levels by up to 20%.',
      category: 'ANXIETY',
      tags: 'pre-game,anxiety,breathing,visualization',
      source: 'AI Sports Psych Project',
    },
    {
      id: 'kb-002',
      title: 'Building Confidence Through Self-Talk',
      content: 'Positive self-talk has been shown to improve performance in competitive situations. Athletes who use constructive self-talk show 15% improvement in clutch situations.',
      category: 'CONFIDENCE',
      tags: 'confidence,self-talk,performance',
      source: 'Sports Psychology Research',
    },
    {
      id: 'kb-003',
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
        updatedAt: new Date(),
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n' + '═'.repeat(60));
  console.log('📊 COMPREHENSIVE SEED DATA SUMMARY');
  console.log('═'.repeat(60));

  console.log('\n👥 USERS & RELATIONSHIPS:');
  console.log(`   • 1 School (${school.name})`);
  console.log(`   • 1 Coach (coach@uw.edu / Coach2024!)`);
  console.log(`   • 50 Athletes across 12 sports (athlete1@uw.edu to athlete50@uw.edu / Athlete2024!)`);
  console.log(`   • 50 Coach-Athlete Relationships (all with consent granted)`);

  console.log('\n📈 MOOD & READINESS DATA:');
  console.log(`   • ${50 * 30} Mood Logs (30 days per athlete with high/low readiness patterns)`);
  console.log('   • Patterns: 70% high readiness days, 30% low readiness days');

  console.log('\n💬 CHAT & AI INTERACTION DATA:');
  console.log(`   • ${totalSessions} Chat Sessions (3-7 per athlete, ALL 50 athletes)`);
  console.log(`   • ${totalSessions} ChatInsights (sentiment, topics, coping strategies)`);
  console.log(`   • ${summaryCount} Weekly Chat Summaries (4 weeks × 50 athletes)`);
  console.log('   • Realistic conversation content with 20+ message templates');

  console.log('\n🧘 INTERVENTION & WELLNESS DATA:');
  console.log(`   • ${interventionCount} Interventions (breathing, visualization, mindfulness, etc.)`);
  console.log(`   • ${outcomeCount} Intervention Outcomes with measured changes`);
  console.log('   • 10 intervention types × 8 contexts × 3 sources');

  console.log('\n🧠 ML & PREDICTION DATA:');
  console.log(`   • ${athletes.length} Athlete Models (baselines, optimal states, risk factors)`);
  console.log(`   • ${predictionCount} Prediction Logs (risk assessments, accuracy tracking)`);
  console.log('   • Intervention effectiveness profiles per athlete');

  console.log('\n🏀 PERFORMANCE DATA:');
  console.log(`   • ${10 * 10} Performance Metrics (10 games × 10 athletes)`);
  console.log(`   • ${10 * 10} Game Results with linked mental state`);
  console.log('   • Performance correlated with readiness (r > 0.5)');

  console.log('\n🎯 GOALS DATA:');
  console.log(`   • ${goalCount} Goals (2-5 per athlete)`);
  console.log('   • Categories: Performance, Mental, Academic, Personal');
  console.log('   • Status distribution: 60% In Progress, 20% Completed, 20% Not Started');

  console.log('\n📚 KNOWLEDGE BASE:');
  console.log('   • 3 Knowledge Base Entries (Anxiety, Confidence, Flow State)');

  console.log('\n' + '─'.repeat(60));
  console.log('🏆 SPORTS COVERED:');
  console.log(`   ${sports.join(', ')}`);

  console.log('\n' + '─'.repeat(60));
  console.log('🔐 LOGIN CREDENTIALS:');
  console.log('   Coach: coach@uw.edu / Coach2024!');
  console.log('   Athletes: athlete1@uw.edu through athlete50@uw.edu / Athlete2024!');

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 ALL DATA READY FOR COMPREHENSIVE APP TESTING!');
  console.log('═'.repeat(60));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
