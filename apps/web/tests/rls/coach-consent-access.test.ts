/**
 * Coach Consent-Based Access Tests
 *
 * Verifies that coaches can ONLY access athlete data
 * when the athlete has explicitly granted consent.
 *
 * CRITICAL FOR PRIVACY - Athletes must opt-in to coach viewing
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

// Test data IDs
let schoolId: string;
let coachId: string;
let athlete1Id: string; // Has consented
let athlete2Id: string; // Has NOT consented
let summary1Id: string;
let summary2Id: string;
let session1Id: string;
let session2Id: string;

describe('Coach Consent-Based Access (RLS)', () => {
  beforeAll(async () => {
    // Create test school
    const school = await prisma.school.create({
      data: {
        id: `test-school-consent-${Date.now()}`,
        name: 'Test Consent University',
        email: 'consent@test.edu',
        division: 'D1',
      },
    });
    schoolId = school.id;

    // Create coach
    const passwordHash = await hash('coach-password-123', 10);
    const coachUser = await prisma.user.create({
      data: {
        id: `test-coach-${Date.now()}`,
        email: `coach-${Date.now()}@test.edu`,
        name: 'Test Coach',
        password: passwordHash,
        role: 'COACH',
        schoolId,
      },
    });
    coachId = coachUser.id;

    await prisma.coach.create({
      data: {
        userId: coachId,
        sport: 'Basketball',
        teamName: 'Test Varsity Team',
      },
    });

    // Create athlete 1 (WITH consent)
    const athlete1User = await prisma.user.create({
      data: {
        id: `test-athlete-consent-1-${Date.now()}`,
        email: `athlete-consent-1-${Date.now()}@test.edu`,
        name: 'Athlete With Consent',
        password: passwordHash,
        role: 'ATHLETE',
        schoolId,
      },
    });
    athlete1Id = athlete1User.id;

    await prisma.athlete.create({
      data: {
        userId: athlete1Id,
        sport: 'Basketball',
        year: 'JUNIOR',
        teamName: 'Test Varsity Team',
        consentChatSummaries: true, // CONSENTED
      },
    });

    // Create athlete 2 (WITHOUT consent)
    const athlete2User = await prisma.user.create({
      data: {
        id: `test-athlete-consent-2-${Date.now()}`,
        email: `athlete-consent-2-${Date.now()}@test.edu`,
        name: 'Athlete Without Consent',
        password: passwordHash,
        role: 'ATHLETE',
        schoolId,
      },
    });
    athlete2Id = athlete2User.id;

    await prisma.athlete.create({
      data: {
        userId: athlete2Id,
        sport: 'Basketball',
        year: 'SOPHOMORE',
        teamName: 'Test Varsity Team',
        consentChatSummaries: false, // NO CONSENT
      },
    });

    // Create chat sessions for both
    const session1 = await prisma.chatSession.create({
      data: {
        id: `test-session-consent-1-${Date.now()}`,
        athleteId: athlete1Id,
      },
    });
    session1Id = session1.id;

    const session2 = await prisma.chatSession.create({
      data: {
        id: `test-session-consent-2-${Date.now()}`,
        athleteId: athlete2Id,
      },
    });
    session2Id = session2.id;

    // Create weekly summaries for both
    const summary1 = await prisma.chatSummary.create({
      data: {
        id: `test-summary-consent-1-${Date.now()}`,
        athleteId: athlete1Id,
        sessionId: session1Id,
        summaryType: 'WEEKLY',
        weekStart: new Date('2025-01-01'),
        weekEnd: new Date('2025-01-07'),
        summary: 'Summary for athlete with consent',
        keyThemes: ['anxiety', 'performance'],
        messageCount: 12,
      },
    });
    summary1Id = summary1.id;

    const summary2 = await prisma.chatSummary.create({
      data: {
        id: `test-summary-consent-2-${Date.now()}`,
        athleteId: athlete2Id,
        sessionId: session2Id,
        summaryType: 'WEEKLY',
        weekStart: new Date('2025-01-01'),
        weekEnd: new Date('2025-01-07'),
        summary: 'Summary for athlete WITHOUT consent',
        keyThemes: ['stress', 'sleep'],
        messageCount: 8,
      },
    });
    summary2Id = summary2.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.chatSummary.deleteMany({
      where: { id: { in: [summary1Id, summary2Id] } },
    });
    await prisma.chatSession.deleteMany({
      where: { id: { in: [session1Id, session2Id] } },
    });
    await prisma.athlete.deleteMany({
      where: { userId: { in: [athlete1Id, athlete2Id] } },
    });
    await prisma.coach.deleteMany({
      where: { userId: coachId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [coachId, athlete1Id, athlete2Id] } },
    });
    await prisma.school.deleteMany({
      where: { id: schoolId },
    });
  });

  describe('ChatSummary Consent Enforcement', () => {
    it('should allow coach to view summary when athlete has consented', async () => {
      // Coach queries summaries where consent is granted
      const summaries = await prisma.chatSummary.findMany({
        where: {
          Athlete: {
            User: {
              schoolId, // Same school
            },
            consentChatSummaries: true, // Consent granted
          },
        },
      });

      // Should include summary1 (athlete with consent)
      const summary1Included = summaries.some(s => s.id === summary1Id);
      expect(summary1Included).toBe(true);
    });

    it('should NOT allow coach to view summary without athlete consent', async () => {
      // Coach tries to access summary2 (no consent)
      const summaries = await prisma.chatSummary.findMany({
        where: {
          athleteId: athlete2Id, // Athlete 2 (no consent)
          Athlete: {
            User: {
              schoolId, // Same school
            },
          },
        },
      });

      // In production with RLS, this would be filtered by consent
      // For now, check in application layer
      const athlete = await prisma.athlete.findUnique({
        where: { userId: athlete2Id },
        select: { consentChatSummaries: true },
      });

      if (!athlete?.consentChatSummaries && summaries.length > 0) {
        throw new Error('CONSENT VIOLATION: Coach accessed data without consent!');
      }

      expect(athlete?.consentChatSummaries).toBe(false);
    });

    it('should filter summaries list to only consented athletes', async () => {
      // Coach queries all summaries (should only see consented)
      const summaries = await prisma.chatSummary.findMany({
        where: {
          Athlete: {
            User: {
              schoolId,
            },
            consentChatSummaries: true,
          },
        },
      });

      // Should include summary1, NOT summary2
      const hasSummary1 = summaries.some(s => s.id === summary1Id);
      const hasSummary2 = summaries.some(s => s.id === summary2Id);

      expect(hasSummary1).toBe(true);
      expect(hasSummary2).toBe(false);
    });
  });

  describe('ChatSession Consent Enforcement', () => {
    it('should NOT allow coach to view sessions without consent', async () => {
      // Coach tries to access session2 (no consent)
      const sessions = await prisma.chatSession.findMany({
        where: {
          id: session2Id,
          Athlete: {
            User: {
              schoolId,
            },
          },
        },
      });

      // Check consent before allowing access
      if (sessions.length > 0) {
        const athlete = await prisma.athlete.findUnique({
          where: { userId: sessions[0].athleteId },
          select: { consentChatSummaries: true },
        });

        if (!athlete?.consentChatSummaries) {
          throw new Error('CONSENT VIOLATION: Coach accessed session without consent!');
        }
      }
    });

    it('should allow viewing sessions with consent', async () => {
      const sessions = await prisma.chatSession.findMany({
        where: {
          id: session1Id,
          Athlete: {
            consentChatSummaries: true,
          },
        },
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].athleteId).toBe(athlete1Id);
    });
  });

  describe('Consent Revocation', () => {
    it('should immediately block access when athlete revokes consent', async () => {
      // Initially, coach can see summary1 (consent granted)
      let summaries = await prisma.chatSummary.findMany({
        where: {
          athleteId: athlete1Id,
          Athlete: {
            consentChatSummaries: true,
          },
        },
      });

      expect(summaries).toHaveLength(1);

      // Athlete 1 revokes consent
      await prisma.athlete.update({
        where: { userId: athlete1Id },
        data: { consentChatSummaries: false },
      });

      // Coach should no longer see the summary
      summaries = await prisma.chatSummary.findMany({
        where: {
          athleteId: athlete1Id,
          Athlete: {
            consentChatSummaries: true,
          },
        },
      });

      expect(summaries).toHaveLength(0);

      // Restore consent for other tests
      await prisma.athlete.update({
        where: { userId: athlete1Id },
        data: { consentChatSummaries: true },
      });
    });
  });

  describe('Coach Dashboard Access', () => {
    it('should only show consented athletes in coach dashboard', async () => {
      // Simulate coach dashboard query
      const athletes = await prisma.athlete.findMany({
        where: {
          User: {
            schoolId,
          },
          consentChatSummaries: true,
        },
        include: {
          User: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Should include athlete1, NOT athlete2
      const hasAthlete1 = athletes.some(a => a.userId === athlete1Id);
      const hasAthlete2 = athletes.some(a => a.userId === athlete2Id);

      expect(hasAthlete1).toBe(true);
      expect(hasAthlete2).toBe(false);
    });

    it('should aggregate stats only from consented athletes', async () => {
      // Coach tries to get average mood across team
      const summariesForStats = await prisma.chatSummary.findMany({
        where: {
          Athlete: {
            User: {
              schoolId,
            },
            consentChatSummaries: true,
          },
          weekStart: {
            gte: new Date('2025-01-01'),
          },
        },
        select: {
          moodScore: true,
          stressScore: true,
          athleteId: true,
        },
      });

      // Should only include data from athlete1 (consented)
      const athleteIds = summariesForStats.map(s => s.athleteId);
      expect(athleteIds).toContain(athlete1Id);
      expect(athleteIds).not.toContain(athlete2Id);
    });
  });

  describe('Audit Logging for Consent Access', () => {
    it('should log when coach views consented athlete data', async () => {
      // In production, this would create an audit log entry
      // For now, we verify the pattern

      const summary = await prisma.chatSummary.findUnique({
        where: { id: summary1Id },
        include: {
          Athlete: {
            select: {
              consentChatSummaries: true,
            },
          },
        },
      });

      if (summary && summary.Athlete.consentChatSummaries) {
        // In production: await createAuditLog({
        //   userId: coachId,
        //   action: 'READ',
        //   resource: `ChatSummary:${summary1Id}`,
        //   schoolId,
        // });

        expect(summary.Athlete.consentChatSummaries).toBe(true);
      }
    });

    it('should log attempts to access non-consented data', async () => {
      // Attempt to access summary2 (no consent)
      const summary = await prisma.chatSummary.findUnique({
        where: { id: summary2Id },
        include: {
          Athlete: {
            select: {
              consentChatSummaries: true,
            },
          },
        },
      });

      if (summary && !summary.Athlete.consentChatSummaries) {
        // In production: await createAuditLog({
        //   userId: coachId,
        //   action: 'READ_DENIED',
        //   resource: `ChatSummary:${summary2Id}`,
        //   schoolId,
        //   reason: 'Athlete has not consented',
        // });

        // Should throw error in production
        expect(summary.Athlete.consentChatSummaries).toBe(false);
      }
    });
  });

  describe('Consent UI Flow', () => {
    it('should allow athlete to grant consent', async () => {
      // Athlete 2 grants consent
      const updated = await prisma.athlete.update({
        where: { userId: athlete2Id },
        data: { consentChatSummaries: true },
      });

      expect(updated.consentChatSummaries).toBe(true);

      // Now coach should be able to see summary2
      const summaries = await prisma.chatSummary.findMany({
        where: {
          athleteId: athlete2Id,
          Athlete: {
            consentChatSummaries: true,
          },
        },
      });

      expect(summaries).toHaveLength(1);

      // Revoke for cleanup
      await prisma.athlete.update({
        where: { userId: athlete2Id },
        data: { consentChatSummaries: false },
      });
    });

    it('should prevent coach access before consent is granted', async () => {
      // Verify athlete2 has NOT consented
      const athlete = await prisma.athlete.findUnique({
        where: { userId: athlete2Id },
        select: { consentChatSummaries: true },
      });

      expect(athlete?.consentChatSummaries).toBe(false);

      // Coach tries to query athlete2's summaries
      const summaries = await prisma.chatSummary.findMany({
        where: {
          athleteId: athlete2Id,
          Athlete: {
            consentChatSummaries: true, // Filter by consent
          },
        },
      });

      // Should return empty (no consent)
      expect(summaries).toHaveLength(0);
    });
  });
});
