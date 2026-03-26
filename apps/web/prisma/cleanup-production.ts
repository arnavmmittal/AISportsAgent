/**
 * Production Database Cleanup Script
 *
 * This script clears ALL data from the production database.
 * Use this to prepare production for real users (no seeded data).
 *
 * Usage: npx tsx prisma/cleanup-production.ts
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function cleanupProduction() {
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('🗑️  PRODUCTION DATABASE CLEANUP');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');

  // Verify we're connected to production
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  console.log('📋 Supabase URL:', supabaseUrl);

  if (!supabaseUrl.includes('ccbcrerrnkqqgxtlqjnm')) {
    console.log('');
    console.log('⚠️  WARNING: This does not appear to be the production database!');
    console.log('   Expected: ccbcrerrnkqqgxtlqjnm.supabase.co');
    console.log('   Got:', supabaseUrl);
    console.log('');
    console.log('Aborting cleanup. Please update .env.local to point to production.');
    process.exit(1);
  }

  console.log('✓ Confirmed: Connected to PRODUCTION database');
  console.log('');

  // Initialize Supabase Admin client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Clear Supabase Auth users first
  console.log('🔐 Clearing Supabase Auth users...');
  try {
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.log('   ⚠️  Could not list auth users:', listError.message);
    } else if (users && users.users.length > 0) {
      console.log(`   Found ${users.users.length} auth users to delete...`);
      for (const user of users.users) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.log(`   ⚠️  Could not delete user ${user.email}:`, deleteError.message);
        }
      }
      console.log(`   ✓ Deleted ${users.users.length} auth users`);
    } else {
      console.log('   ✓ No auth users to delete');
    }
  } catch (error) {
    console.log('   ⚠️  Error clearing auth users:', error);
  }

  // Clear all Prisma data (in correct order to respect foreign keys)
  console.log('');
  console.log('🗄️  Clearing database tables...');

  // Delete child records first (newest models first)
  await prisma.predictionLog.deleteMany({});
  console.log('   ✓ Cleared predictionLog');

  await prisma.athleteModel.deleteMany({});
  console.log('   ✓ Cleared athleteModel');

  await prisma.interventionOutcome.deleteMany({});
  console.log('   ✓ Cleared interventionOutcome');

  await prisma.intervention.deleteMany({});
  console.log('   ✓ Cleared intervention');

  await prisma.wearableDataPoint.deleteMany({});
  console.log('   ✓ Cleared wearableDataPoint');

  await prisma.wearableConnection.deleteMany({});
  console.log('   ✓ Cleared wearableConnection');

  await prisma.performanceOutcome.deleteMany({});
  console.log('   ✓ Cleared performanceOutcome');

  await prisma.chatInsight.deleteMany({});
  console.log('   ✓ Cleared chatInsight');

  await prisma.gameResult.deleteMany({});
  console.log('   ✓ Cleared gameResult');

  await prisma.performanceMetric.deleteMany({});
  console.log('   ✓ Cleared performanceMetric');

  await prisma.crisisAlert.deleteMany({});
  console.log('   ✓ Cleared crisisAlert');

  await prisma.message.deleteMany({});
  console.log('   ✓ Cleared message');

  await prisma.chatSummary.deleteMany({});
  console.log('   ✓ Cleared chatSummary');

  await prisma.conversationInsight.deleteMany({});
  console.log('   ✓ Cleared conversationInsight');

  await prisma.chatSession.deleteMany({});
  console.log('   ✓ Cleared chatSession');

  await prisma.readinessScore.deleteMany({});
  console.log('   ✓ Cleared readinessScore');

  await prisma.wearableData.deleteMany({});
  console.log('   ✓ Cleared wearableData');

  await prisma.moodLog.deleteMany({});
  console.log('   ✓ Cleared moodLog');

  await prisma.goal.deleteMany({});
  console.log('   ✓ Cleared goal');

  await prisma.taskPattern.deleteMany({});
  console.log('   ✓ Cleared taskPattern');

  await prisma.task.deleteMany({});
  console.log('   ✓ Cleared task');

  await prisma.assignmentSubmission.deleteMany({});
  console.log('   ✓ Cleared assignmentSubmission');

  await prisma.assignment.deleteMany({});
  console.log('   ✓ Cleared assignment');

  await prisma.coachAthleteRelation.deleteMany({});
  console.log('   ✓ Cleared coachAthleteRelation');

  await prisma.knowledgeBase.deleteMany({});
  console.log('   ✓ Cleared knowledgeBase');

  await prisma.pushToken.deleteMany({});
  console.log('   ✓ Cleared pushToken');

  await prisma.tokenUsage.deleteMany({});
  console.log('   ✓ Cleared tokenUsage');

  await prisma.userSettings.deleteMany({});
  console.log('   ✓ Cleared userSettings');

  await prisma.athlete.deleteMany({});
  console.log('   ✓ Cleared athlete');

  await prisma.coach.deleteMany({});
  console.log('   ✓ Cleared coach');

  await prisma.session.deleteMany({});
  console.log('   ✓ Cleared session');

  await prisma.account.deleteMany({});
  console.log('   ✓ Cleared account');

  await prisma.auditLog.deleteMany({});
  console.log('   ✓ Cleared auditLog');

  await prisma.user.deleteMany({});
  console.log('   ✓ Cleared user');

  await prisma.school.deleteMany({});
  console.log('   ✓ Cleared school');

  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('✅ PRODUCTION DATABASE IS NOW EMPTY');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Real UW users can now sign up with fresh accounts.');
  console.log('');

  await prisma.$disconnect();
}

cleanupProduction()
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
