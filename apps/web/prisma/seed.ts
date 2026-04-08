import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { calculateReadiness } from '../src/lib/analytics/readiness';

// Load environment variables from .env.local (override .env)
config({ path: '.env.local', override: true });

// For seed, use direct connection (not pgbouncer) to support TRUNCATE CASCADE
// If DATABASE_URL uses port 6543 (pgbouncer), switch to 5432 (direct)
if (process.env.DATABASE_URL?.includes(':6543/')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(':6543/', ':5432/').replace('?pgbouncer=true&', '?');
  console.log('⚡ Switched to direct DB connection for seed (port 5432)');
}

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
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (!createError && createData.user) {
      console.log(`   ✓ Created: ${email} (${createData.user.id})`);
      return createData.user.id;
    }

    if (createError?.message?.includes('already been registered')) {
      let page = 1;
      while (true) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
        const existingUser = listData?.users?.find(u => u.email === email);
        if (existingUser) {
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
          console.log(`   ↻ Updated: ${email} (${existingUser.id})`);
          return existingUser.id;
        }
        if (!listData?.users || listData.users.length < 1000) break;
        page++;
      }
      console.error(`   ✗ ${email} exists but not found in list`);
      return null;
    }

    console.error(`   ✗ Failed: ${email}: ${createError?.message}`);
    return null;
  } catch (error: any) {
    console.error(`   ✗ Error: ${email}: ${error.message}`);
    return null;
  }
}

// ─── Data definitions ───────────────────────────────────────

const coaches = [
  { name: 'Coach Sarah Mitchell', email: 'coach1@uw.edu', password: 'Coach1', sport: 'Basketball' },
  { name: 'Coach James Rivera', email: 'coach2@uw.edu', password: 'Coach2', sport: 'Soccer' },
  { name: 'Coach Lisa Chen', email: 'coach3@uw.edu', password: 'Coach3', sport: 'Track & Field' },
];

// 30 athletes: 10 per coach, with realistic names
const athleteData = [
  // Coach 1 — Basketball (10)
  { name: 'Marcus Johnson', sport: 'Basketball', year: 'JUNIOR', position: 'Point Guard', coachIdx: 0 },
  { name: 'Aisha Williams', sport: 'Basketball', year: 'SOPHOMORE', position: 'Shooting Guard', coachIdx: 0 },
  { name: 'Tyler Brooks', sport: 'Basketball', year: 'SENIOR', position: 'Small Forward', coachIdx: 0 },
  { name: 'Sofia Ramirez', sport: 'Basketball', year: 'FRESHMAN', position: 'Power Forward', coachIdx: 0 },
  { name: 'Jordan Lee', sport: 'Basketball', year: 'JUNIOR', position: 'Center', coachIdx: 0 },
  { name: 'Kayla Thompson', sport: 'Basketball', year: 'SOPHOMORE', position: 'Point Guard', coachIdx: 0 },
  { name: 'Drew Patterson', sport: 'Basketball', year: 'SENIOR', position: 'Shooting Guard', coachIdx: 0 },
  { name: 'Mia Chen', sport: 'Basketball', year: 'FRESHMAN', position: 'Small Forward', coachIdx: 0 },
  { name: 'Jaylen Carter', sport: 'Basketball', year: 'JUNIOR', position: 'Power Forward', coachIdx: 0 },
  { name: 'Riley Morgan', sport: 'Basketball', year: 'SOPHOMORE', position: 'Center', coachIdx: 0 },

  // Coach 2 — Soccer (10)
  { name: 'Emma Garcia', sport: 'Soccer', year: 'JUNIOR', position: 'Forward', coachIdx: 1 },
  { name: 'Liam O\'Brien', sport: 'Soccer', year: 'SOPHOMORE', position: 'Midfielder', coachIdx: 1 },
  { name: 'Zara Patel', sport: 'Soccer', year: 'SENIOR', position: 'Defender', coachIdx: 1 },
  { name: 'Noah Kim', sport: 'Soccer', year: 'FRESHMAN', position: 'Goalkeeper', coachIdx: 1 },
  { name: 'Ava Martinez', sport: 'Soccer', year: 'JUNIOR', position: 'Midfielder', coachIdx: 1 },
  { name: 'Ethan Wright', sport: 'Soccer', year: 'SOPHOMORE', position: 'Forward', coachIdx: 1 },
  { name: 'Chloe Davis', sport: 'Soccer', year: 'SENIOR', position: 'Defender', coachIdx: 1 },
  { name: 'Lucas Brown', sport: 'Soccer', year: 'FRESHMAN', position: 'Midfielder', coachIdx: 1 },
  { name: 'Maya Robinson', sport: 'Soccer', year: 'JUNIOR', position: 'Forward', coachIdx: 1 },
  { name: 'Alex Torres', sport: 'Soccer', year: 'SOPHOMORE', position: 'Defender', coachIdx: 1 },

  // Coach 3 — Track & Field (10)
  { name: 'Isaiah Cooper', sport: 'Track & Field', year: 'SENIOR', position: 'Sprinter', coachIdx: 2 },
  { name: 'Olivia Nguyen', sport: 'Track & Field', year: 'JUNIOR', position: 'Distance Runner', coachIdx: 2 },
  { name: 'Derek Hall', sport: 'Track & Field', year: 'SOPHOMORE', position: 'Jumper', coachIdx: 2 },
  { name: 'Jasmine Scott', sport: 'Track & Field', year: 'FRESHMAN', position: 'Sprinter', coachIdx: 2 },
  { name: 'Cameron Reed', sport: 'Track & Field', year: 'JUNIOR', position: 'Thrower', coachIdx: 2 },
  { name: 'Natalie Foster', sport: 'Track & Field', year: 'SENIOR', position: 'Hurdler', coachIdx: 2 },
  { name: 'Brandon Hayes', sport: 'Track & Field', year: 'SOPHOMORE', position: 'Distance Runner', coachIdx: 2 },
  { name: 'Samantha Price', sport: 'Track & Field', year: 'FRESHMAN', position: 'Jumper', coachIdx: 2 },
  { name: 'Ryan Murphy', sport: 'Track & Field', year: 'JUNIOR', position: 'Sprinter', coachIdx: 2 },
  { name: 'Taylor Bennett', sport: 'Track & Field', year: 'SENIOR', position: 'Thrower', coachIdx: 2 },
];

const opponents = [
  'Oregon Ducks', 'USC Trojans', 'Stanford Cardinal', 'UCLA Bruins', 'Arizona Wildcats',
  'Cal Bears', 'Colorado Buffaloes', 'Utah Utes', 'Oregon State Beavers', 'Washington State Cougars',
];

const topics = [
  'performance-anxiety', 'team-conflict', 'coach-pressure', 'injury-concern',
  'academic-stress', 'mindset-mental', 'goal-setting', 'recovery-rest',
  'competition-preparation', 'confidence-building', 'pre-game-nerves',
  'post-game-reflection', 'slump-recovery', 'leadership-development',
];

const emotionalTones = ['anxious', 'confident', 'frustrated', 'motivated', 'neutral', 'hopeful', 'overwhelmed', 'focused'];

const stressIndicators = [
  'fear of failure', 'coach pressure', 'performance expectations', 'academic overload',
  'comparison to others', 'injury anxiety', 'family expectations', 'scholarship concerns',
];

const copingStrategies = [
  'visualization', 'breathing exercises', 'positive self-talk', 'goal setting',
  'seeking support', 'rest and recovery', 'journaling', 'mindfulness meditation',
];

const userMessages = [
  "I've been struggling with nerves before big games lately. My heart races and I can't focus.",
  "I keep thinking about what happens if I mess up and let my team down.",
  "Coach says I'm overthinking but I can't help it. Every mistake feels huge.",
  "I had a great practice today, finally feeling like myself again.",
  "The visualization exercises you suggested are really helping. I feel more prepared.",
  "I'm starting to trust my training more. Less second-guessing.",
  "I've been in a slump for 3 weeks now. Nothing I try seems to work.",
  "Everyone keeps telling me to relax but that just makes me more frustrated.",
  "I have three midterms this week AND two away games. I'm exhausted.",
  "I can't sleep because I'm thinking about everything I have to do.",
  "There's been tension with some teammates. It's affecting my focus.",
  "I want to set some goals for this season but I don't know where to start.",
  "I achieved my goal from last month! What should I work on next?",
  "Game tomorrow. Feeling pretty good but a little anxious.",
  "What should I focus on tonight before the championship?",
];

const assistantResponses = [
  "It sounds like pre-game anxiety is really affecting you. This is incredibly common among elite athletes. Let's work on a grounding technique - when you notice your heart racing, try the 4-7-8 breathing pattern.",
  "I hear you - that fear of letting others down can be overwhelming. But your teammates chose to play alongside you for a reason. Let's reframe those thoughts.",
  "Overthinking is your brain trying to protect you, but we can redirect that energy. Before your next competition, pick three specific focus cues that anchor you to the present moment.",
  "That's wonderful to hear! Momentum builds on moments like these. What specifically felt different about today's practice? Let's identify what you can replicate.",
  "I'm so glad the visualization is working for you. The brain doesn't fully distinguish between vividly imagined and real experiences. You're literally training your neural pathways.",
  "Slumps are frustrating precisely because they feel mysterious. This week, I want you to focus only on effort, not results. Can you commit to that?",
  "That's a lot on your plate. Let's acknowledge that feeling overwhelmed doesn't mean you're failing. Let's break this week down into manageable chunks.",
  "Sleep deprivation will hurt both academic and athletic performance. Tonight, write down everything on your mind, then close the notebook.",
  "Team dynamics significantly impact individual performance. Can you tell me what you need from those relationships that you're not getting right now?",
  "Effective goals are specific, measurable, and challenging but achievable. Let's start with your biggest aspiration, then break it into weekly milestones.",
  "Congratulations! Take a moment to really feel that accomplishment. Based on what you learned, what feels like the right next challenge?",
  "Good - a little anxiety actually helps performance. It means you care. Tonight, visualize yourself succeeding. You've prepared for this.",
  "For the championship: Stay present, use your pre-performance routine, and remember - pressure is privilege. You belong here.",
];

const interventionTypes = [
  'BREATHING', 'VISUALIZATION', 'SELF_TALK', 'ROUTINE', 'FOCUS_CUE',
  'AROUSAL_REGULATION', 'GOAL_SETTING', 'COGNITIVE_REFRAME', 'MINDFULNESS', 'JOURNALING',
] as const;

const interventionContexts = [
  'PRE_GAME', 'PRE_PRACTICE', 'POST_ERROR', 'POST_GAME',
  'POST_LOSS', 'SLUMP', 'DAILY_ROUTINE', 'ON_DEMAND',
] as const;

const interventionSources = ['AI_SUGGESTED', 'SELF_INITIATED', 'COACH_ASSIGNED'] as const;

const protocolNames: Record<string, string[]> = {
  BREATHING: ['4-7-8 Breathing', 'Box Breathing', 'Diaphragmatic Breathing'],
  VISUALIZATION: ['Success Imagery', 'Performance Rehearsal', 'Process Visualization'],
  SELF_TALK: ['Positive Affirmations', 'Cue Words', 'Motivational Self-Talk'],
  ROUTINE: ['Pre-Shot Routine', 'Pre-Game Ritual', 'Morning Routine'],
  FOCUS_CUE: ['Anchor Words', 'Physical Trigger', 'Refocus Cue'],
  AROUSAL_REGULATION: ['Energizing Routine', 'Calming Sequence', 'State Management'],
  GOAL_SETTING: ['SMART Goal Review', 'Weekly Intention Setting', 'Process Goals'],
  COGNITIVE_REFRAME: ['Thought Challenging', 'Perspective Shift', 'Growth Mindset Reframe'],
  MINDFULNESS: ['Body Scan', 'Present Moment Awareness', 'Mindful Movement'],
  JOURNALING: ['Performance Journal', 'Gratitude Log', 'Reflection Writing'],
};

const goalTemplates = [
  { category: 'PERFORMANCE', title: 'Improve Free Throw Percentage', description: 'Increase from 70% to 85%', targetMetric: 'free_throw_pct' },
  { category: 'PERFORMANCE', title: 'Increase Vertical Jump', description: 'Add 3 inches to max vertical', targetMetric: 'vertical_jump' },
  { category: 'PERFORMANCE', title: 'Reduce Personal Fouls', description: 'Average less than 2 fouls per game', targetMetric: 'fouls_per_game' },
  { category: 'MENTAL', title: 'Build Pre-Game Routine', description: 'Develop consistent 20-minute mental preparation routine', targetMetric: 'routine_consistency' },
  { category: 'MENTAL', title: 'Master Visualization', description: 'Complete daily visualization for 30 days', targetMetric: 'visualization_streak' },
  { category: 'MENTAL', title: 'Manage Competition Anxiety', description: 'Reduce pre-game anxiety from 8/10 to 4/10', targetMetric: 'anxiety_level' },
  { category: 'ACADEMIC', title: 'Maintain GPA', description: 'Keep semester GPA above 3.0', targetMetric: 'gpa' },
  { category: 'PERSONAL', title: 'Improve Sleep Quality', description: 'Average 7.5+ hours of quality sleep', targetMetric: 'sleep_hours' },
  { category: 'PERSONAL', title: 'Build Leadership Skills', description: 'Lead one team activity per month', targetMetric: 'leadership_activities' },
];

// ─── Helpers ────────────────────────────────────────────────

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

// ─── Main seed function ─────────────────────────────────────

async function main() {
  console.log('🌱 Starting database seed...\n');
  console.log('📋 Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.log('📋 Service Key:', supabaseServiceKey ? '✓ Set' : '✗ Missing\n');

  // ── Clear all existing data (use raw SQL to handle FK constraints) ──
  console.log('🗑️  Clearing existing data...');
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations') LOOP
        EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE';
      END LOOP;
    END $$;
  `);
  console.log('   ✓ All existing data cleared!');

  // ── Also delete old Supabase Auth users ──
  console.log('🗑️  Clearing Supabase Auth users...');
  const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (existingAuthUsers?.users) {
    for (const user of existingAuthUsers.users) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
    console.log(`   ✓ Deleted ${existingAuthUsers.users.length} old auth users`);
  }

  // ── Create school ──
  console.log('📚 Creating school...');
  const school = await prisma.school.upsert({
    where: { id: 'school-uw-001' },
    update: { updatedAt: new Date() },
    create: {
      id: 'school-uw-001',
      name: 'University of Washington',
      division: 'D1',
      updatedAt: new Date(),
    },
  });

  // ── Create 3 coaches ──
  console.log('👨‍🏫 Creating 3 coaches...');
  const createdCoaches = [];
  for (const c of coaches) {
    const hashedPw = await hash(c.password, 10);
    const authId = await getOrCreateSupabaseAuthUser(c.email, c.password);
    if (!authId) throw new Error(`Failed to create auth user for ${c.email}`);

    const coach = await prisma.user.upsert({
      where: { id: authId },
      update: { email: c.email, name: c.name, password: hashedPw, role: 'COACH', schoolId: school.id },
      create: {
        id: authId,
        email: c.email,
        name: c.name,
        password: hashedPw,
        role: 'COACH',
        schoolId: school.id,
        Coach: { create: { sport: c.sport } },
      },
    });
    createdCoaches.push(coach);
  }

  // ── Create 30 athletes ──
  console.log('🏃 Creating 30 athletes...');
  const createdAthletes = [];
  for (let i = 0; i < athleteData.length; i++) {
    const a = athleteData[i];
    const num = i + 1;
    const email = `athlete${num}@uw.edu`;
    const password = `Athlete${num}`;
    const hashedPw = await hash(password, 10);

    const authId = await getOrCreateSupabaseAuthUser(email, password);
    if (!authId) { console.error(`   ✗ Skipping athlete ${num}`); continue; }

    const athlete = await prisma.user.upsert({
      where: { id: authId },
      update: { email, name: a.name, password: hashedPw, role: 'ATHLETE', schoolId: school.id },
      create: {
        id: authId,
        email,
        name: a.name,
        password: hashedPw,
        role: 'ATHLETE',
        schoolId: school.id,
        Athlete: {
          create: {
            sport: a.sport,
            year: a.year,
            teamPosition: a.position,
            consentCoachView: true,
            consentChatSummaries: true,
          },
        },
      },
      include: { Athlete: true },
    });
    createdAthletes.push({ ...athlete, coachIdx: a.coachIdx });
  }
  console.log(`   ✓ Created ${createdAthletes.length} athletes`);

  // ── Coach-athlete relationships ──
  console.log('🔗 Creating coach-athlete relationships...');
  for (const athlete of createdAthletes) {
    await prisma.coachAthleteRelation.create({
      data: {
        coachId: createdCoaches[athlete.coachIdx].id,
        athleteId: athlete.id,
        consentGranted: true,
        joinedAt: new Date(),
      },
    });
  }

  // ── Mood logs (30 days per athlete) ──
  console.log('📊 Creating mood logs...');
  const now = new Date();
  for (const athlete of createdAthletes) {
    for (let day = 0; day < 30; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      const isHigh = Math.random() > 0.3;

      const mood = isHigh ? 8 + Math.floor(Math.random() * 2) : 4 + Math.floor(Math.random() * 3);
      const stress = isHigh ? 2 + Math.floor(Math.random() * 2) : 7 + Math.floor(Math.random() * 2);
      const sleep = isHigh ? 7.5 + Math.random() * 1.5 : 5 + Math.random() * 1.5;
      const confidence = isHigh ? 8 + Math.floor(Math.random() * 2) : 4 + Math.floor(Math.random() * 3);
      const energy = isHigh ? 8 + Math.floor(Math.random() * 2) : 4 + Math.floor(Math.random() * 3);

      await prisma.moodLog.create({
        data: { athleteId: athlete.id, mood, stress, sleep, confidence, energy, tags: '', createdAt: date },
      });
    }
  }

  // ── Chat sessions (3-5 per athlete) ──
  console.log('💬 Creating chat sessions...');
  let totalSessions = 0;
  for (const athlete of createdAthletes) {
    const numSessions = 3 + Math.floor(Math.random() * 3);
    for (let s = 0; s < numSessions; s++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - (s * 7 + Math.floor(Math.random() * 5)));
      const sessionTopic = pick(topics);

      const session = await prisma.chatSession.create({
        data: {
          athleteId: athlete.id,
          topic: sessionTopic,
          focusArea: pick(['performance', 'mental', 'recovery', 'preparation', 'confidence']),
          createdAt: sessionDate,
          updatedAt: sessionDate,
          isActive: false,
          discoveryPhase: 'follow_up',
        },
      });

      // Messages (4-8 per session)
      const numMessages = 4 + Math.floor(Math.random() * 5);
      for (let m = 0; m < numMessages; m++) {
        const msgDate = new Date(sessionDate);
        msgDate.setMinutes(msgDate.getMinutes() + m * 2 + Math.floor(Math.random() * 3));
        const isUser = m % 2 === 0;
        await prisma.message.create({
          data: {
            id: `msg-${athlete.id}-${s}-${m}`,
            sessionId: session.id,
            role: isUser ? 'user' : 'assistant',
            content: isUser ? pick(userMessages) : pick(assistantResponses),
            createdAt: msgDate,
          },
        });
      }

      // Chat insight
      const isTense = sessionTopic.includes('anxiety') || sessionTopic.includes('stress') || sessionTopic.includes('conflict');
      const isPositive = sessionTopic.includes('confidence') || sessionTopic.includes('goal') || sessionTopic.includes('preparation');
      const sentiment = isTense ? -0.5 + Math.random() * 0.3
        : isPositive ? 0.3 + Math.random() * 0.5
        : -0.1 + Math.random() * 0.4;

      const isPreGame = Math.random() < 0.2;
      await prisma.chatInsight.create({
        data: {
          sessionId: session.id,
          athleteId: athlete.id,
          createdAt: sessionDate,
          overallSentiment: sentiment,
          emotionalTone: pick(emotionalTones),
          confidenceLevel: Math.round(50 + sentiment * 30 + Math.random() * 15),
          topics: [sessionTopic, ...(Math.random() < 0.4 ? [pick(topics)] : [])],
          dominantTheme: sessionTopic,
          stressIndicators: isTense ? pickN(stressIndicators, 2) : [],
          copingStrategies: pickN(copingStrategies, 1 + Math.floor(Math.random() * 2)),
          isPreGame,
          gameDate: isPreGame ? new Date(sessionDate.getTime() + 86400000) : null,
          daysUntilGame: isPreGame ? 1 : null,
          preGameMindset: isPreGame ? (sentiment > 0 ? 'confident' : 'nervous') : null,
          sessionDuration: 8 + Math.floor(Math.random() * 25),
          messageCount: numMessages,
        },
      });
      totalSessions++;
    }
  }

  // ── Performance metrics & game results (10 games, first 10 athletes) ──
  console.log('🏀 Creating game performance data...');
  for (let gameIdx = 0; gameIdx < 10; gameIdx++) {
    const gameDate = new Date(now);
    gameDate.setDate(gameDate.getDate() - gameIdx * 7);

    for (let ai = 0; ai < 10; ai++) {
      const athlete = createdAthletes[ai];
      const gameDayStart = new Date(gameDate); gameDayStart.setHours(0, 0, 0, 0);
      const gameDayEnd = new Date(gameDate); gameDayEnd.setHours(23, 59, 59, 999);
      const moodLog = await prisma.moodLog.findFirst({
        where: { athleteId: athlete.id, createdAt: { gte: gameDayStart, lte: gameDayEnd } },
      });
      if (!moodLog) continue;

      const readinessBreakdown = calculateReadiness({
        mood: moodLog.mood, confidence: moodLog.confidence, stress: moodLog.stress,
        energy: moodLog.energy || undefined, sleep: moodLog.sleep || undefined,
        createdAt: moodLog.createdAt,
      }, athlete.Athlete?.sport || 'Basketball');
      const readinessScore = readinessBreakdown.overall;
      const rf = readinessScore / 100;

      const points = Math.max(0, Math.floor(5 + rf * 25 + (Math.random() * 3 - 1.5)));
      const assists = Math.max(0, Math.floor(rf * 8 + (Math.random() * 2 - 1)));
      const rebounds = Math.max(0, Math.floor(2 + rf * 10 + (Math.random() * 2 - 1)));
      const turnovers = Math.max(0, Math.floor(6 - rf * 5 + Math.random() * 1.5));
      const stats = { points, assists, rebounds, turnovers };
      const outcome = readinessScore >= 80 ? (Math.random() > 0.2 ? 'WIN' : 'LOSS')
        : readinessScore >= 70 ? (Math.random() > 0.5 ? 'WIN' : 'LOSS')
        : (Math.random() > 0.7 ? 'WIN' : 'LOSS');

      await prisma.performanceMetric.create({
        data: {
          athleteId: athlete.id, gameDate, sport: athlete.Athlete?.sport || 'Basketball',
          opponentName: opponents[gameIdx], outcome, stats,
          mentalMoodScore: moodLog.mood, mentalStressScore: moodLog.stress,
          mentalSleepHours: moodLog.sleep ? parseFloat(moodLog.sleep.toString()) : null,
          readinessScore,
        },
      });

      await prisma.gameResult.create({
        data: {
          athleteId: athlete.id, gameDate, opponent: opponents[gameIdx],
          sport: athlete.Athlete?.sport || 'Basketball',
          stats: { ...stats, performanceScore: Math.round((points / 30) * 100) },
          outcome, readinessScore,
          scrapedFrom: 'seed-script', scrapedAt: new Date(),
        },
      });
    }
  }

  // ── Weekly chat summaries ──
  console.log('📋 Creating weekly chat summaries...');
  let summaryCount = 0;
  for (const athlete of createdAthletes) {
    const coachId = createdCoaches[athlete.coachIdx].id;
    for (let w = 0; w < 4; w++) {
      const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekStart = new Date(weekEnd); weekStart.setDate(weekStart.getDate() - 6);
      const moodScore = 5 + Math.random() * 4;
      const stressScore = 2 + Math.random() * 5;
      const confidenceScore = 5 + Math.random() * 4;

      await prisma.chatSummary.create({
        data: {
          athleteId: athlete.id, coachId, summaryType: 'WEEKLY', weekStart, weekEnd,
          summary: `${athlete.name} showed ${moodScore > 7 ? 'positive' : 'stable'} engagement this week with ${2 + Math.floor(Math.random() * 3)} check-ins. Key focus: ${pick(topics).replace(/-/g, ' ')}.`,
          keyThemes: pickN(topics, 2), emotionalState: moodScore > 7 ? 'positive' : moodScore > 5 ? 'neutral' : 'concerning',
          actionItems: pickN(['Continue visualization practice', 'Use breathing before competition', 'Check academic balance', 'Review goal progress'], 2),
          messageCount: 6 + Math.floor(Math.random() * 10), moodScore, stressScore, confidenceScore,
          sleepQualityScore: 6 + Math.random() * 3,
          riskFlags: stressScore > 6 ? ['elevated stress'] : [],
          recommendedActions: stressScore > 6 ? ['Schedule follow-up'] : ['Continue current approach'],
          sessionCount: 1 + Math.floor(Math.random() * 3),
          engagementScore: 0.6 + Math.random() * 0.35,
          viewedByCoach: w > 1 ? Math.random() > 0.3 : false,
          viewedAt: w > 1 && Math.random() > 0.3 ? new Date(weekEnd.getTime() + 2 * 86400000) : null,
          generatedAt: new Date(weekEnd.getTime() + 12 * 3600000),
          expiresAt: new Date(now.getTime() + 90 * 86400000),
        },
      });
      summaryCount++;
    }
  }

  // ── Interventions ──
  console.log('🧘 Creating interventions...');
  let interventionCount = 0;
  let outcomeCount = 0;
  for (const athlete of createdAthletes) {
    const num = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < num; i++) {
      const type = pick([...interventionTypes]);
      const context = pick([...interventionContexts]);
      const protocols = protocolNames[type] || ['General Protocol'];
      const protocol = pick(protocols);
      const performedDate = new Date(now); performedDate.setDate(performedDate.getDate() - Math.floor(Math.random() * 30));
      const completed = Math.random() > 0.15;
      const athleteRating = completed ? 3 + Math.random() * 2 : null;

      const intervention = await prisma.intervention.create({
        data: {
          athleteId: athlete.id, type, protocol,
          description: `${protocol} for ${context.toLowerCase().replace('_', ' ')}`,
          performedAt: performedDate, context, source: pick([...interventionSources]),
          completed, athleteRating,
          effectivenessScore: completed ? 0.4 + Math.random() * 0.5 : null,
        },
      });
      interventionCount++;

      if (completed && Math.random() > 0.3) {
        const mult = (athleteRating || 3) - 3;
        await prisma.interventionOutcome.create({
          data: {
            interventionId: intervention.id,
            moodChange: Math.random() * 0.5 + mult * 0.2,
            confidenceChange: Math.random() * 0.6 + mult * 0.25,
            stressChange: -(Math.random() * 0.4 + mult * 0.15),
            focusChange: Math.random() * 0.4 + mult * 0.2,
            measuredAt: new Date(performedDate.getTime() + 2 * 3600000),
            hoursAfterIntervention: 2,
          },
        });
        outcomeCount++;
      }
    }
  }

  // ── Athlete models ──
  console.log('🧠 Creating athlete models...');
  for (const athlete of createdAthletes) {
    const bm = 6 + Math.random() * 2, bc = 6 + Math.random() * 2;
    const bs = 3 + Math.random() * 2, bsl = 6.5 + Math.random() * 1.5;
    await prisma.athleteModel.create({
      data: {
        athleteId: athlete.id,
        baselineMood: bm, baselineConfidence: bc, baselineStress: bs, baselineSleep: bsl,
        baselinePerformance: 70 + Math.random() * 15,
        optimalMood: Math.min(10, bm + 1 + Math.random()),
        optimalConfidence: Math.min(10, bc + 1 + Math.random()),
        optimalStress: Math.max(1, bs - 1 - Math.random() * 0.5),
        optimalSleep: Math.min(9, bsl + 0.5 + Math.random() * 0.5),
        interventionProfile: {
          breathing: { avgEffectiveness: 0.3 + Math.random() * 0.4, count: 2 + Math.floor(Math.random() * 5) },
          visualization: { avgEffectiveness: 0.35 + Math.random() * 0.35, count: 1 + Math.floor(Math.random() * 4) },
        },
        riskFactors: [
          { factor: 'sleep_deficit', threshold: bsl - 1.5, impact: -0.08 },
          { factor: 'stress_spike', threshold: bs + 2, impact: -0.12 },
        ],
        predictionWeights: {
          mood: 0.15 + Math.random() * 0.1, confidence: 0.2 + Math.random() * 0.1,
          stress: 0.15 + Math.random() * 0.1, sleep: 0.2 + Math.random() * 0.1,
        },
        dataPointsUsed: 30 + Math.floor(Math.random() * 50),
        lastTrainedAt: new Date(now.getTime() - Math.random() * 7 * 86400000),
        modelVersion: '1.0.0',
        accuracy: 0.7 + Math.random() * 0.2,
      },
    });
  }

  // ── Goals ──
  console.log('🎯 Creating goals...');
  let goalCount = 0;
  const goalStatuses = ['IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'COMPLETED', 'NOT_STARTED'] as const;
  for (const athlete of createdAthletes) {
    const selected = pickN(goalTemplates, 2 + Math.floor(Math.random() * 3));
    for (const g of selected) {
      const status = pick([...goalStatuses]);
      const startDate = new Date(now); startDate.setDate(startDate.getDate() - (30 + Math.floor(Math.random() * 60)));
      const targetDate = new Date(now); targetDate.setDate(targetDate.getDate() + (30 + Math.floor(Math.random() * 90)));
      await prisma.goal.create({
        data: {
          athleteId: athlete.id, title: g.title, description: g.description,
          category: g.category as 'PERFORMANCE' | 'MENTAL' | 'ACADEMIC' | 'PERSONAL',
          status,
          completionPct: status === 'COMPLETED' ? 100 : status === 'NOT_STARTED' ? 0 : 10 + Math.floor(Math.random() * 80),
          targetMetric: g.targetMetric, startDate, targetDate,
          completedAt: status === 'COMPLETED' ? new Date(now.getTime() - Math.random() * 14 * 86400000) : null,
          type: Math.random() > 0.3 ? 'SHORT_TERM' : 'LONG_TERM',
        },
      });
      goalCount++;
    }
  }

  // ── Knowledge base ──
  console.log('📚 Creating knowledge base...');
  const kbEntries = [
    { id: 'kb-001', title: 'Managing Pre-Game Anxiety', content: 'Pre-game anxiety is normal and can be managed through breathing exercises, visualization, and positive self-talk.', category: 'ANXIETY', tags: 'pre-game,anxiety,breathing', source: 'Sports Psych Research' },
    { id: 'kb-002', title: 'Building Confidence Through Self-Talk', content: 'Positive self-talk improves performance in competitive situations. Athletes who use constructive self-talk show 15% improvement in clutch situations.', category: 'CONFIDENCE', tags: 'confidence,self-talk', source: 'Sports Psych Research' },
    { id: 'kb-003', title: 'Flow State Techniques', content: 'Achieving flow state requires complete focus on the present moment. Elite athletes report entering flow when challenge matches skill level.', category: 'FLOW_STATE', tags: 'flow-state,focus', source: 'Flow in Sports Research' },
  ];
  for (const e of kbEntries) {
    await prisma.knowledgeBase.create({ data: { ...e, schoolId: null, updatedAt: new Date() } });
  }

  // ── Summary ──
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SEED DATA SUMMARY');
  console.log('═'.repeat(60));
  console.log(`\n👥 1 School (University of Washington)`);
  console.log(`   3 Coaches, ${createdAthletes.length} Athletes (10 per coach)`);
  console.log(`📈 ${createdAthletes.length * 30} Mood Logs (30 days each)`);
  console.log(`💬 ${totalSessions} Chat Sessions with insights`);
  console.log(`📋 ${summaryCount} Weekly Summaries`);
  console.log(`🧘 ${interventionCount} Interventions, ${outcomeCount} Outcomes`);
  console.log(`🎯 ${goalCount} Goals`);
  console.log(`🏀 100 Game Results & Performance Metrics`);
  console.log('\n' + '─'.repeat(60));
  console.log('🔐 LOGIN CREDENTIALS:');
  console.log('   Coaches:');
  coaches.forEach(c => console.log(`     ${c.email} / ${c.password}`));
  console.log('   Athletes:');
  console.log('     athlete1@uw.edu / Athlete1');
  console.log('     athlete2@uw.edu / Athlete2');
  console.log('     ... through ...');
  console.log('     athlete30@uw.edu / Athlete30');
  console.log('═'.repeat(60));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
