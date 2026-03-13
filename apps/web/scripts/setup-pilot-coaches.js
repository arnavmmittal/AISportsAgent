#!/usr/bin/env node
/**
 * Setup Pilot Coaches
 *
 * Creates 3 coach accounts and distributes 50 athletes among them.
 * Also removes any non-athlete/non-coach accounts (like akshayanand).
 *
 * Usage: node scripts/setup-pilot-coaches.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const prisma = new PrismaClient();

// Default school ID (from existing users)
const DEFAULT_SCHOOL_ID = 'default-school';

// Generate readable password
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + '!2';
}

const COACHES = [
  { email: 'coach1@uw.edu', name: 'Sports Psych Coach 1', sport: 'All Sports' },
  { email: 'coach2@uw.edu', name: 'Sports Psych Coach 2', sport: 'All Sports' },
  { email: 'coach3@uw.edu', name: 'Sports Psych Coach 3', sport: 'All Sports' },
];

// Emails to remove (not athletes or coaches)
const EMAILS_TO_REMOVE = [
  'akshayanand2026@u.northwestern.edu',
];

async function main() {
  console.log('=== Setting Up 3 Pilot Coaches ===\n');

  // Step 0: Remove non-pilot accounts
  console.log('=== Removing Non-Pilot Accounts ===\n');
  for (const email of EMAILS_TO_REMOVE) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);
    if (user) {
      // Delete from Supabase Auth
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) {
        console.error(`  ⚠️ Failed to delete auth user ${email}: ${error.message}`);
      } else {
        console.log(`✅ Deleted auth user: ${email}`);
      }

      // Delete from our User table (if exists)
      try {
        await prisma.user.delete({ where: { id: user.id } });
        console.log(`  ✅ Deleted User record: ${email}`);
      } catch (e) {
        // May not exist in User table
      }
    } else {
      console.log(`  ℹ️ User not found: ${email}`);
    }
  }
  console.log('');

  const coachCredentials = [];
  const coachIds = [];

  // Step 1: Create/update coach accounts in Supabase Auth
  for (const coach of COACHES) {
    const password = generatePassword();

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === coach.email);

    let userId;

    if (existingUser) {
      // Update existing user's password
      const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: password
      });
      if (error) {
        console.error(`❌ Failed to update ${coach.email}: ${error.message}`);
        continue;
      }
      userId = existingUser.id;
      console.log(`✅ Updated existing coach: ${coach.email}`);
    } else {
      // Create new user
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: coach.email,
        password: password,
        email_confirm: true
      });
      if (error) {
        console.error(`❌ Failed to create ${coach.email}: ${error.message}`);
        continue;
      }
      userId = newUser.user.id;
      console.log(`✅ Created new coach: ${coach.email}`);
    }

    coachIds.push(userId);
    coachCredentials.push({ email: coach.email, password, name: coach.name, id: userId });

    // Upsert User record using Prisma
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: {
          email: coach.email,
          name: coach.name,
          role: 'COACH',
          updatedAt: new Date(),
        },
        create: {
          id: userId,
          email: coach.email,
          name: coach.name,
          role: 'COACH',
          emailVerified: new Date(),
          schoolId: DEFAULT_SCHOOL_ID,
        },
      });
      console.log(`  ✅ User record created/updated`);
    } catch (e) {
      console.error(`  ⚠️ User record error: ${e.message}`);
    }

    // Upsert Coach record using Prisma
    try {
      await prisma.coach.upsert({
        where: { userId: userId },
        update: {
          sport: coach.sport,
          updatedAt: new Date(),
        },
        create: {
          userId: userId,
          sport: coach.sport,
        },
      });
      console.log(`  ✅ Coach record created/updated`);
    } catch (e) {
      console.error(`  ⚠️ Coach record error: ${e.message}`);
    }
  }

  console.log(`\n=== Distributing Athletes Among ${coachIds.length} Coaches ===\n`);

  // Step 2: Get all athletes using Prisma (only uw.edu athletes)
  const athletes = await prisma.athlete.findMany({
    include: {
      User: {
        select: { email: true, name: true }
      }
    },
    where: {
      User: {
        email: {
          endsWith: '@uw.edu'
        }
      }
    },
    orderBy: { userId: 'asc' }
  });

  console.log(`Found ${athletes.length} athletes\n`);

  // Step 3: Clear existing coach-athlete relations for these coaches
  for (const coachId of coachIds) {
    await prisma.coachAthleteRelation.deleteMany({
      where: { coachId: coachId }
    });
  }
  console.log('Cleared existing coach-athlete relations\n');

  // Step 4: Distribute athletes evenly (with consent granted for pilot)
  const athletesPerCoach = Math.ceil(athletes.length / coachIds.length);
  const distribution = {};

  for (let i = 0; i < athletes.length; i++) {
    const coachIndex = Math.floor(i / athletesPerCoach);
    const coachId = coachIds[Math.min(coachIndex, coachIds.length - 1)];
    const athlete = athletes[i];

    if (!distribution[coachId]) {
      distribution[coachId] = [];
    }
    distribution[coachId].push(athlete);

    // Create coach-athlete relation with consent
    try {
      await prisma.coachAthleteRelation.create({
        data: {
          coachId: coachId,
          athleteId: athlete.userId,
          consentGranted: true, // Pre-granted for pilot
        },
      });
    } catch (e) {
      if (!e.message.includes('Unique constraint')) {
        console.error(`  ⚠️ Relation error for ${athlete.userId}: ${e.message}`);
      }
    }
  }

  // Print distribution summary
  console.log('=== Distribution Summary ===\n');
  for (const cred of coachCredentials) {
    const athleteCount = distribution[cred.id]?.length || 0;
    console.log(`${cred.email}: ${athleteCount} athletes`);

    // List athlete emails for this coach
    const athleteEmails = distribution[cred.id]?.map(a => a.User?.email || a.userId).slice(0, 5);
    if (athleteEmails) {
      athleteEmails.forEach(e => console.log(`  - ${e}`));
      if (distribution[cred.id].length > 5) {
        console.log(`  - ... and ${distribution[cred.id].length - 5} more`);
      }
    }
    console.log('');
  }

  // Step 5: Generate output
  console.log('=== Coach Credentials ===\n');
  console.log('Email,Password,Name,Athletes Assigned');
  for (const cred of coachCredentials) {
    const count = distribution[cred.id]?.length || 0;
    console.log(`${cred.email},${cred.password},"${cred.name}",${count}`);
  }

  // Save to file
  const output = {
    coaches: coachCredentials.map(c => ({
      email: c.email,
      password: c.password,
      name: c.name,
      athleteCount: distribution[c.id]?.length || 0,
      athletes: distribution[c.id]?.map(a => a.User?.email) || []
    }))
  };

  fs.writeFileSync('pilot-coaches.json', JSON.stringify(output, null, 2));
  console.log('\n📄 Full details saved to: pilot-coaches.json');
  console.log('⚠️  DO NOT COMMIT THIS FILE!');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
