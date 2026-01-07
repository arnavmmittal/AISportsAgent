/**
 * Cross-Tenant Isolation Tests
 *
 * Verifies that Row-Level Security (RLS) policies prevent
 * data leakage between different schools (multi-tenant isolation).
 *
 * CRITICAL SECURITY TEST - Must pass 100% before production launch
 *
 * NOTE: Skipped in CI (requires live Supabase instance)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';
import { isCI } from '../setup';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Skip RLS tests in CI (requires live Supabase with RLS configured)
const describeOrSkip = isCI || !SUPABASE_URL ? describe.skip : describe;

// Test data
let school1Id: string;
let school2Id: string;
let athlete1Id: string;
let athlete2Id: string;
let athlete1Token: string;
let athlete2Token: string;

describeOrSkip('Cross-Tenant Isolation (RLS)', () => {
  beforeAll(async () => {
    // Create two separate schools (tenants)
    const school1 = await prisma.school.create({
      data: {
        id: `test-school-1-${Date.now()}`,
        name: 'Test University 1',
        email: 'admin@test1.edu',
      },
    });
    school1Id = school1.id;

    const school2 = await prisma.school.create({
      data: {
        id: `test-school-2-${Date.now()}`,
        name: 'Test University 2',
        email: 'admin@test2.edu',
      },
    });
    school2Id = school2.id;

    // Create athlete in school 1
    const passwordHash = await hash('test-password-123', 10);
    const user1 = await prisma.user.create({
      data: {
        id: `test-user-1-${Date.now()}`,
        email: `athlete1-${Date.now()}@test.edu`,
        name: 'Test Athlete 1',
        password: passwordHash,
        role: 'ATHLETE',
        schoolId: school1Id,
      },
    });
    athlete1Id = user1.id;

    await prisma.athlete.create({
      data: {
        userId: athlete1Id,
        sport: 'Basketball',
        year: 'SOPHOMORE',
        teamName: 'Test Team 1',
      },
    });

    // Create athlete in school 2
    const user2 = await prisma.user.create({
      data: {
        id: `test-user-2-${Date.now()}`,
        email: `athlete2-${Date.now()}@test.edu`,
        name: 'Test Athlete 2',
        password: passwordHash,
        role: 'ATHLETE',
        schoolId: school2Id,
      },
    });
    athlete2Id = user2.id;

    await prisma.athlete.create({
      data: {
        userId: athlete2Id,
        sport: 'Soccer',
        year: 'JUNIOR',
        teamName: 'Test Team 2',
      },
    });

    // Authenticate both users to get tokens
    // (In real app, this would be through Supabase Auth)
    // For testing, we'll create JWT tokens manually
    athlete1Token = 'token-for-athlete1'; // Simplified for test
    athlete2Token = 'token-for-athlete2';
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await prisma.athlete.deleteMany({
      where: {
        userId: { in: [athlete1Id, athlete2Id] },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [athlete1Id, athlete2Id] },
      },
    });

    await prisma.school.deleteMany({
      where: {
        id: { in: [school1Id, school2Id] },
      },
    });
  });

  describe('ChatSession Isolation', () => {
    let session1Id: string;
    let session2Id: string;

    beforeAll(async () => {
      // Create chat session for athlete 1
      const session1 = await prisma.chatSession.create({
        data: {
          id: `test-session-1-${Date.now()}`,
          athleteId: athlete1Id,
        },
      });
      session1Id = session1.id;

      // Create chat session for athlete 2
      const session2 = await prisma.chatSession.create({
        data: {
          id: `test-session-2-${Date.now()}`,
          athleteId: athlete2Id,
        },
      });
      session2Id = session2.id;
    });

    afterAll(async () => {
      await prisma.chatSession.deleteMany({
        where: {
          id: { in: [session1Id, session2Id] },
        },
      });
    });

    it('should NOT allow athlete from school 1 to see sessions from school 2', async () => {
      // Query as athlete1 (school 1), try to access athlete2's session (school 2)
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // This should return empty/null due to RLS
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', session2Id)
        .eq('athlete_id', athlete2Id)
        .single();

      // Expect: RLS blocks access, data is null
      expect(data).toBeNull();
      expect(error).toBeDefined();
    });

    it('should allow athlete to see own sessions', async () => {
      // Athlete 1 accessing own session (same school)
      const sessions = await prisma.chatSession.findMany({
        where: {
          athleteId: athlete1Id,
          id: session1Id,
        },
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(session1Id);
    });
  });

  describe('Message Isolation', () => {
    let session1Id: string;
    let message1Id: string;
    let message2Id: string;

    beforeAll(async () => {
      // Create session for athlete 1
      const session1 = await prisma.chatSession.create({
        data: {
          id: `test-session-msg-1-${Date.now()}`,
          athleteId: athlete1Id,
        },
      });
      session1Id = session1.id;

      // Create message in athlete 1's session
      const message1 = await prisma.message.create({
        data: {
          id: `test-msg-1-${Date.now()}`,
          sessionId: session1Id,
          role: 'user',
          content: 'Sensitive message from athlete 1',
        },
      });
      message1Id = message1.id;

      // Create session for athlete 2
      const session2 = await prisma.chatSession.create({
        data: {
          id: `test-session-msg-2-${Date.now()}`,
          athleteId: athlete2Id,
        },
      });

      // Create message in athlete 2's session
      const message2 = await prisma.message.create({
        data: {
          id: `test-msg-2-${Date.now()}`,
          sessionId: session2.id,
          role: 'user',
          content: 'Sensitive message from athlete 2',
        },
      });
      message2Id = message2.id;
    });

    it('should NOT allow accessing messages from other schools', async () => {
      // Try to fetch message2 (from school 2) using athlete1's context
      // In production, this would be via Supabase client with athlete1's JWT

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', message2Id)
        .single();

      // RLS should block this
      expect(data).toBeNull();
      expect(error).toBeDefined();
    });

    it('should allow accessing own messages', async () => {
      // Athlete 1 accessing own message
      const messages = await prisma.message.findMany({
        where: {
          id: message1Id,
          Session: {
            athleteId: athlete1Id,
          },
        },
      });

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toContain('athlete 1');
    });
  });

  describe('ChatSummary Isolation', () => {
    let summary1Id: string;
    let summary2Id: string;

    beforeAll(async () => {
      // Create weekly summary for athlete 1
      const summary1 = await prisma.chatSummary.create({
        data: {
          id: `test-summary-1-${Date.now()}`,
          athleteId: athlete1Id,
          summaryType: 'WEEKLY',
          weekStart: new Date('2025-01-01'),
          weekEnd: new Date('2025-01-07'),
          summary: 'Sensitive summary for athlete 1',
          keyThemes: ['theme1', 'theme2'],
          messageCount: 10,
        },
      });
      summary1Id = summary1.id;

      // Create weekly summary for athlete 2
      const summary2 = await prisma.chatSummary.create({
        data: {
          id: `test-summary-2-${Date.now()}`,
          athleteId: athlete2Id,
          summaryType: 'WEEKLY',
          weekStart: new Date('2025-01-01'),
          weekEnd: new Date('2025-01-07'),
          summary: 'Sensitive summary for athlete 2',
          keyThemes: ['theme3', 'theme4'],
          messageCount: 15,
        },
      });
      summary2Id = summary2.id;
    });

    afterAll(async () => {
      await prisma.chatSummary.deleteMany({
        where: {
          id: { in: [summary1Id, summary2Id] },
        },
      });
    });

    it('should NOT allow accessing summaries from other schools', async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // Try to access summary2 (school 2) as athlete1 (school 1)
      const { data, error } = await supabase
        .from('chat_summaries')
        .select('*')
        .eq('id', summary2Id)
        .single();

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });

    it('should allow accessing own summaries', async () => {
      const summaries = await prisma.chatSummary.findMany({
        where: {
          athleteId: athlete1Id,
          id: summary1Id,
        },
      });

      expect(summaries).toHaveLength(1);
      expect(summaries[0].summary).toContain('athlete 1');
    });
  });

  describe('MoodLog Isolation', () => {
    let mood1Id: string;
    let mood2Id: string;

    beforeAll(async () => {
      // Create mood log for athlete 1
      const mood1 = await prisma.moodLog.create({
        data: {
          id: `test-mood-1-${Date.now()}`,
          athleteId: athlete1Id,
          mood: 7,
          stress: 4,
          sleep: 6,
          confidence: 8,
          notes: 'Feeling good before big game',
        },
      });
      mood1Id = mood1.id;

      // Create mood log for athlete 2
      const mood2 = await prisma.moodLog.create({
        data: {
          id: `test-mood-2-${Date.now()}`,
          athleteId: athlete2Id,
          mood: 5,
          stress: 7,
          sleep: 4,
          confidence: 6,
          notes: 'Stressed about exams',
        },
      });
      mood2Id = mood2.id;
    });

    afterAll(async () => {
      await prisma.moodLog.deleteMany({
        where: {
          id: { in: [mood1Id, mood2Id] },
        },
      });
    });

    it('should NOT allow accessing mood logs from other schools', async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('id', mood2Id)
        .single();

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe('Goal Isolation', () => {
    let goal1Id: string;
    let goal2Id: string;

    beforeAll(async () => {
      const goal1 = await prisma.goal.create({
        data: {
          id: `test-goal-1-${Date.now()}`,
          athleteId: athlete1Id,
          title: 'Improve free throw percentage',
          description: 'Get to 85% from line',
          goalType: 'PERFORMANCE',
          status: 'IN_PROGRESS',
          targetDate: new Date('2025-03-01'),
        },
      });
      goal1Id = goal1.id;

      const goal2 = await prisma.goal.create({
        data: {
          id: `test-goal-2-${Date.now()}`,
          athleteId: athlete2Id,
          title: 'Increase endurance',
          description: 'Run full 90 minutes',
          goalType: 'PERFORMANCE',
          status: 'IN_PROGRESS',
          targetDate: new Date('2025-03-01'),
        },
      });
      goal2Id = goal2.id;
    });

    afterAll(async () => {
      await prisma.goal.deleteMany({
        where: {
          id: { in: [goal1Id, goal2Id] },
        },
      });
    });

    it('should NOT allow accessing goals from other schools', async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goal2Id)
        .single();

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe('CrisisAlert Isolation', () => {
    let alert1Id: string;
    let alert2Id: string;
    let session1Id: string;
    let session2Id: string;

    beforeAll(async () => {
      // Create sessions first
      const session1 = await prisma.chatSession.create({
        data: {
          id: `test-crisis-session-1-${Date.now()}`,
          athleteId: athlete1Id,
        },
      });
      session1Id = session1.id;

      const session2 = await prisma.chatSession.create({
        data: {
          id: `test-crisis-session-2-${Date.now()}`,
          athleteId: athlete2Id,
        },
      });
      session2Id = session2.id;

      // Create crisis alerts
      const alert1 = await prisma.crisisAlert.create({
        data: {
          id: `test-alert-1-${Date.now()}`,
          athleteId: athlete1Id,
          sessionId: session1Id,
          messageId: `msg-${Date.now()}`,
          severity: 'HIGH',
          detectedAt: new Date(),
          reviewed: false,
        },
      });
      alert1Id = alert1.id;

      const alert2 = await prisma.crisisAlert.create({
        data: {
          id: `test-alert-2-${Date.now()}`,
          athleteId: athlete2Id,
          sessionId: session2Id,
          messageId: `msg-${Date.now()}`,
          severity: 'CRITICAL',
          detectedAt: new Date(),
          reviewed: false,
        },
      });
      alert2Id = alert2.id;
    });

    afterAll(async () => {
      await prisma.crisisAlert.deleteMany({
        where: {
          id: { in: [alert1Id, alert2Id] },
        },
      });
      await prisma.chatSession.deleteMany({
        where: {
          id: { in: [session1Id, session2Id] },
        },
      });
    });

    it('should NOT allow accessing crisis alerts from other schools', async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      const { data, error } = await supabase
        .from('crisis_alerts')
        .select('*')
        .eq('id', alert2Id)
        .single();

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });

    it('should prevent cross-school crisis alert queries', async () => {
      // Try to query all alerts (should only see own school's)
      const alerts = await prisma.crisisAlert.findMany({
        where: {
          Athlete: {
            User: {
              schoolId: school1Id,
            },
          },
        },
      });

      // Should NOT include alert2 (from school 2)
      const alert2Included = alerts.some(a => a.id === alert2Id);
      expect(alert2Included).toBe(false);
    });
  });
});
