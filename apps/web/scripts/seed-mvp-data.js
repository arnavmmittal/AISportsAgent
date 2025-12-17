#!/usr/bin/env node

/**
 * MVP Database Seed Script
 *
 * Seeds realistic data for testing and demo:
 * - 1 school
 * - 2 coaches
 * - 20 athletes with varying risk levels
 * - 30 days of mood logs per athlete
 * - Goals (mix of active/completed)
 * - Chat sessions with messages
 * - Crisis alerts
 * - Coach-athlete relationships
 * - Assignments
 */

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Sports and years for variety
const SPORTS = ['Basketball', 'Soccer', 'Track', 'Volleyball', 'Swimming', 'Tennis'];
const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
const POSITIONS = {
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Soccer: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
  Track: ['Sprinter', 'Distance', 'Hurdler', 'Jumper', 'Thrower'],
  Volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Libero'],
  Swimming: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly'],
  Tennis: ['Singles', 'Doubles'],
};

// Athlete profiles with varying risk levels
const ATHLETES = [
  { firstName: 'Sarah', lastName: 'Johnson', sport: 'Basketball', year: 'Junior', riskLevel: 'LOW', avgMood: 8, avgConfidence: 9, avgStress: 3 },
  { firstName: 'Mike', lastName: 'Chen', sport: 'Basketball', year: 'Sophomore', riskLevel: 'HIGH', avgMood: 5, avgConfidence: 4, avgStress: 8 },
  { firstName: 'Emily', lastName: 'Rodriguez', sport: 'Soccer', year: 'Senior', riskLevel: 'MEDIUM', avgMood: 6, avgConfidence: 6, avgStress: 6 },
  { firstName: 'Alex', lastName: 'Turner', sport: 'Track', year: 'Freshman', riskLevel: 'LOW', avgMood: 7, avgConfidence: 7, avgStress: 4 },
  { firstName: 'Taylor', lastName: 'Martinez', sport: 'Volleyball', year: 'Sophomore', riskLevel: 'HIGH', avgMood: 4, avgConfidence: 3, avgStress: 9 },
  { firstName: 'Jordan', lastName: 'Kim', sport: 'Swimming', year: 'Junior', riskLevel: 'MEDIUM', avgMood: 6, avgConfidence: 5, avgStress: 7 },
  { firstName: 'Morgan', lastName: 'Williams', sport: 'Tennis', year: 'Senior', riskLevel: 'LOW', avgMood: 8, avgConfidence: 8, avgStress: 3 },
  { firstName: 'Jamie', lastName: 'Lee', sport: 'Basketball', year: 'Freshman', riskLevel: 'LOW', avgMood: 7, avgConfidence: 7, avgStress: 4 },
  { firstName: 'Casey', lastName: 'Thompson', sport: 'Soccer', year: 'Junior', riskLevel: 'MEDIUM', avgMood: 6, avgConfidence: 6, avgStress: 5 },
  { firstName: 'Riley', lastName: 'Anderson', sport: 'Track', year: 'Sophomore', riskLevel: 'LOW', avgMood: 8, avgConfidence: 8, avgStress: 2 },
  { firstName: 'Avery', lastName: 'Garcia', sport: 'Volleyball', year: 'Senior', riskLevel: 'MEDIUM', avgMood: 5, avgConfidence: 6, avgStress: 6 },
  { firstName: 'Dakota', lastName: 'Patel', sport: 'Swimming', year: 'Freshman', riskLevel: 'HIGH', avgMood: 4, avgConfidence: 4, avgStress: 8 },
  { firstName: 'Peyton', lastName: 'Brown', sport: 'Tennis', year: 'Junior', riskLevel: 'LOW', avgMood: 9, avgConfidence: 8, avgStress: 2 },
  { firstName: 'Skylar', lastName: 'Davis', sport: 'Basketball', year: 'Sophomore', riskLevel: 'MEDIUM', avgMood: 6, avgConfidence: 7, avgStress: 5 },
  { firstName: 'Quinn', lastName: 'Miller', sport: 'Soccer', year: 'Senior', riskLevel: 'LOW', avgMood: 8, avgConfidence: 7, avgStress: 3 },
  { firstName: 'Rowan', lastName: 'Wilson', sport: 'Track', year: 'Freshman', riskLevel: 'MEDIUM', avgMood: 6, avgConfidence: 5, avgStress: 6 },
  { firstName: 'Cameron', lastName: 'Moore', sport: 'Volleyball', year: 'Junior', riskLevel: 'LOW', avgMood: 7, avgConfidence: 8, avgStress: 4 },
  { firstName: 'Sage', lastName: 'Taylor', sport: 'Swimming', year: 'Sophomore', riskLevel: 'HIGH', avgMood: 5, avgConfidence: 5, avgStress: 7 },
  { firstName: 'Phoenix', lastName: 'Thomas', sport: 'Tennis', year: 'Senior', riskLevel: 'LOW', avgMood: 8, avgConfidence: 9, avgStress: 3 },
  { firstName: 'River', lastName: 'Jackson', sport: 'Basketball', year: 'Junior', riskLevel: 'CRITICAL', avgMood: 3, avgConfidence: 2, avgStress: 10 },
];

// Random variation helper
function randomVariation(base, variance = 1) {
  return Math.max(1, Math.min(10, base + Math.floor(Math.random() * (variance * 2 + 1)) - variance));
}

async function main() {
  console.log('🌱 Starting MVP database seed...\n');

  // 1. Create School
  console.log('📚 Creating school...');
  const school = await prisma.school.upsert({
    where: { id: 'mvp-university' },
    update: {},
    create: {
      id: 'mvp-university',
      name: 'MVP University',
      division: 'NCAA Division I',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(`✅ Created school: ${school.name}\n`);

  // 2. Create Coaches
  console.log('👨‍🏫 Creating coaches...');

  const coaches = [];
  for (const coachData of [
    { email: 'coach.smith@mvp-university.edu', name: 'Coach Sarah Smith', sport: 'Basketball' },
    { email: 'coach.williams@mvp-university.edu', name: 'Coach Mike Williams', sport: 'Soccer' },
  ]) {
    let userId;

    // Try to create in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: coachData.email,
      password: 'coach123456',
      email_confirm: true,
      user_metadata: {
        name: coachData.name,
        role: 'COACH',
      },
    });

    if (authError) {
      // Check if user already exists by looking at error code
      if (authError.code === 'email_exists') {
        console.log(`⚠️  Coach ${coachData.email} already exists, fetching ID...`);
        // User exists, fetch their ID
        try {
          const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) throw listError;

          const existingUser = users.find(u => u.email === coachData.email);
          if (existingUser) {
            userId = existingUser.id;
            console.log(`✅ Found existing coach with ID: ${userId}`);
          } else {
            console.error(`❌ Could not find existing user ${coachData.email}`);
            continue;
          }
        } catch (listErr) {
          console.error(`❌ Error listing users:`, listErr);
          continue;
        }
      } else {
        console.error(`❌ Error creating coach ${coachData.email}:`, authError);
        continue;
      }
    } else {
      userId = authData.user.id;
      console.log(`✅ Created new coach in Auth: ${coachData.email}`);
    }

    if (!userId) {
      console.error(`❌ No userId for ${coachData.email}`);
      continue;
    }

    // Create in database
    const hashedPassword = await bcrypt.hash('coach123456', 10);

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: coachData.email,
        name: coachData.name,
        role: 'COACH',
        password: hashedPassword,
        emailVerified: new Date(),
        schoolId: school.id,
      },
    });

    const coach = await prisma.coach.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        sport: coachData.sport,
        title: 'Head Coach',
      },
    });

    coaches.push({ user, coach });
    console.log(`✅ Processed coach: ${coachData.name}`);
  }
  console.log('');

  // 3. Create Athletes
  console.log('🏃 Creating athletes...');

  const athletes = [];
  for (const athleteData of ATHLETES) {
    const email = `${athleteData.firstName.toLowerCase()}.${athleteData.lastName.toLowerCase()}@mvp-university.edu`;
    let userId;

    // Try to create in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'athlete123456',
      email_confirm: true,
      user_metadata: {
        name: `${athleteData.firstName} ${athleteData.lastName}`,
        role: 'ATHLETE',
      },
    });

    if (authError) {
      // Check if user already exists by looking at error code
      if (authError.code === 'email_exists') {
        console.log(`⚠️  Athlete ${email} already exists, fetching ID...`);
        try {
          const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) throw listError;

          const existingUser = users.find(u => u.email === email);
          if (existingUser) {
            userId = existingUser.id;
            console.log(`✅ Found existing athlete with ID: ${userId}`);
          } else {
            console.error(`❌ Could not find existing user ${email} in user list`);
            continue;
          }
        } catch (listErr) {
          console.error(`❌ Error listing users:`, listErr);
          continue;
        }
      } else {
        console.error(`❌ Error creating athlete ${email}:`, authError);
        continue;
      }
    } else {
      userId = authData.user.id;
    }

    if (!userId) {
      console.error(`❌ No userId for ${email}`);
      continue;
    }

    // Create in database
    const hashedPassword = await bcrypt.hash('athlete123456', 10);

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email,
        name: `${athleteData.firstName} ${athleteData.lastName}`,
        role: 'ATHLETE',
        password: hashedPassword,
        emailVerified: new Date(),
        schoolId: school.id,
      },
    });

    const positions = POSITIONS[athleteData.sport];
    const position = positions[Math.floor(Math.random() * positions.length)];

    const athlete = await prisma.athlete.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        sport: athleteData.sport,
        year: athleteData.year,
        teamPosition: position,
        riskLevel: athleteData.riskLevel,
      },
    });

    athletes.push({ user, athlete, profile: athleteData });
    console.log(`✅ Processed athlete: ${athleteData.firstName} ${athleteData.lastName} (${athleteData.sport}, ${athleteData.riskLevel} risk)`);
  }
  console.log('');

  // 4. Create Coach-Athlete Relationships
  console.log('🤝 Creating coach-athlete relationships...');

  for (const { user, coach } of coaches) {
    const relevantAthletes = athletes.filter(a => a.athlete.sport === coach.sport || Math.random() > 0.7);

    for (const athlete of relevantAthletes) {
      const consentGranted = Math.random() > 0.2; // 80% grant consent

      await prisma.coachAthleteRelation.upsert({
        where: {
          coachId_athleteId: {
            coachId: coach.userId,
            athleteId: athlete.athlete.userId,
          },
        },
        update: {},
        create: {
          coachId: coach.userId,
          athleteId: athlete.athlete.userId,
          consentGranted,
          joinedAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
          notes: consentGranted ? null : 'Pending consent',
        },
      });
    }
  }
  console.log(`✅ Created relationships for ${coaches.length} coaches\n`);

  // 5. Create Mood Logs (last 30 days)
  console.log('📊 Creating mood logs...');

  let moodLogCount = 0;
  for (const { athlete, profile } of athletes) {
    const daysBack = Math.floor(Math.random() * 10) + 20; // 20-30 days of data

    for (let i = 0; i < daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      const mood = randomVariation(profile.avgMood, 2);
      const confidence = randomVariation(profile.avgConfidence, 2);
      const stress = randomVariation(profile.avgStress, 2);

      await prisma.moodLog.create({
        data: {
          athleteId: athlete.userId,
          mood,
          confidence,
          stress,
          sleep: Math.floor(Math.random() * 5) + 5, // 5-9 hours
          notes: Math.random() > 0.7 ? 'Feeling good about practice today' : null,
          tags: '',
          createdAt: date,
        },
      });

      moodLogCount++;
    }
  }
  console.log(`✅ Created ${moodLogCount} mood logs\n`);

  // 6. Create Goals
  console.log('🎯 Creating goals...');

  const goalTemplates = [
    { title: 'Improve free throw percentage', category: 'PERFORMANCE' },
    { title: 'Practice mindfulness 5 minutes daily', category: 'MENTAL' },
    { title: 'Maintain 3.5 GPA this semester', category: 'ACADEMIC' },
    { title: 'Get 8 hours of sleep per night', category: 'PERSONAL' },
    { title: 'Reduce pre-game anxiety', category: 'MENTAL' },
    { title: 'Complete all assignments on time', category: 'ACADEMIC' },
  ];

  let goalCount = 0;
  for (const { athlete } of athletes) {
    const numGoals = Math.floor(Math.random() * 4) + 2; // 2-5 goals per athlete

    for (let i = 0; i < numGoals; i++) {
      const template = goalTemplates[Math.floor(Math.random() * goalTemplates.length)];
      const status = Math.random() > 0.6 ? 'IN_PROGRESS' : Math.random() > 0.5 ? 'COMPLETED' : 'NOT_STARTED';
      const completionPct = status === 'COMPLETED' ? 100 : status === 'IN_PROGRESS' ? Math.floor(Math.random() * 70) + 10 : 0;

      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000);
      const updatedAt = status === 'COMPLETED' || status === 'IN_PROGRESS'
        ? new Date(createdAt.getTime() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000)
        : createdAt;

      const goalData = {
        athleteId: athlete.userId,
        title: template.title,
        category: template.category,
        status,
        completionPct,
        startDate: createdAt,
        createdAt,
        updatedAt,
      };

      // Add completedAt for completed goals
      if (status === 'COMPLETED') {
        goalData.completedAt = updatedAt;
      }

      await prisma.goal.create({
        data: goalData,
      });

      goalCount++;
    }
  }
  console.log(`✅ Created ${goalCount} goals\n`);

  // 7. Create Chat Sessions
  console.log('💬 Creating chat sessions...');

  const sessionsForAlerts = []; // Store sessions/messages for crisis alert creation
  let sessionCount = 0;
  for (const { athlete } of athletes.slice(0, 10)) { // First 10 athletes have chat history
    const numSessions = Math.floor(Math.random() * 3) + 1; // 1-3 sessions per athlete

    for (let i = 0; i < numSessions; i++) {
      const session = await prisma.chatSession.create({
        data: {
          athleteId: athlete.userId,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        },
      });

      // Add some messages
      const messages = [
        { role: 'user', content: 'I\'ve been feeling stressed about the upcoming game' },
        { role: 'assistant', content: 'I understand pre-game stress is common. Let\'s work through some techniques to help you feel more prepared and confident.' },
        { role: 'user', content: 'That would be helpful, thank you' },
      ];

      const createdMessages = [];
      for (const msg of messages) {
        const message = await prisma.message.create({
          data: {
            sessionId: session.id,
            role: msg.role,
            content: msg.content,
          },
        });
        createdMessages.push(message);
      }

      // Store for crisis alert creation (if athlete is high-risk)
      if (athlete.riskLevel === 'HIGH' || athlete.riskLevel === 'CRITICAL') {
        sessionsForAlerts.push({
          athleteId: athlete.userId,
          sessionId: session.id,
          messageId: createdMessages[0].id, // Link to first user message
        });
      }

      sessionCount++;
    }
  }
  console.log(`✅ Created ${sessionCount} chat sessions\n`);

  // 8. Create Crisis Alerts (for high-risk athletes with chat history)
  console.log('🚨 Creating crisis alerts...');

  let alertCount = 0;
  for (const sessionData of sessionsForAlerts.slice(0, 3)) {
    await prisma.crisisAlert.create({
      data: {
        athleteId: sessionData.athleteId,
        sessionId: sessionData.sessionId,
        messageId: sessionData.messageId,
        severity: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM',
        notes: 'Detected language indicating high stress and potential burnout',
        detectedAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
        reviewed: Math.random() > 0.7,
      },
    });
    alertCount++;
  }
  console.log(`✅ Created ${alertCount} crisis alerts\n`);

  // 9. Create Assignments
  console.log('📝 Creating assignments...');

  for (const { coach } of coaches) {
    const assignment = await prisma.assignment.create({
      data: {
        coachId: coach.userId,
        title: 'Weekly Mental Performance Reflection',
        description: 'Reflect on your week and identify one mental performance win and one area for improvement.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        targetSport: coach.sport,
        targetAthleteIds: null, // All athletes in sport
      },
    });

    console.log(`✅ Created assignment: ${assignment.title}`);
  }
  console.log('');

  console.log('✅ Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - 1 school`);
  console.log(`   - ${coaches.length} coaches`);
  console.log(`   - ${athletes.length} athletes`);
  console.log(`   - ${moodLogCount} mood logs`);
  console.log(`   - ${goalCount} goals`);
  console.log(`   - ${alertCount} crisis alerts`);
  console.log(`   - ${sessionCount} chat sessions`);
  console.log('');
  console.log('🔐 Login credentials:');
  console.log('   Coaches: coach.smith@mvp-university.edu / coach123456');
  console.log('   Coaches: coach.williams@mvp-university.edu / coach123456');
  console.log('   Athletes: [firstname].[lastname]@mvp-university.edu / athlete123456');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
