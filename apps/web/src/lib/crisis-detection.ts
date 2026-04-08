/**
 * Crisis Detection Module
 *
 * Purpose: Safety net for detecting when athletes mention serious issues
 * Context: This is a PERFORMANCE platform, not clinical therapy
 *
 * Detection Layers:
 * 1. Keyword matching (fast, explicit mentions)
 * 2. Coded language patterns (students use euphemisms)
 * 3. OpenAI Moderation API (catches edge cases)
 *
 * When crisis detected:
 * - Create alert in database
 * - Notify coach immediately
 * - Escalate if not reviewed in 5 minutes
 * - Log to monitoring (Sentry)
 *
 * NOT trying to:
 * - Diagnose mental health conditions
 * - Replace professional counseling
 * - Provide clinical intervention
 */

import OpenAI from 'openai';
import * as Sentry from '@sentry/nextjs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Explicit crisis keywords
 * These are direct mentions of self-harm or serious distress
 */
const CRISIS_KEYWORDS = [
  /suicid/i,
  /kill (my)?self/i,
  /end (my life|it all)/i,
  /not worth living/i,
  /better off dead/i,
  /self[- ]?harm/i,
  /cut(ting)? myself/i,
];

/**
 * Coded language patterns
 * Students often use euphemisms instead of direct language
 */
const CODED_PATTERNS = [
  /unalive/i,
  /not (going to |gonna )?wake up/i,
  /go to sleep (forever|and not wake)/i,
  /final solution/i,
  /end (it|this|everything)/i,
  /can't (do this|take this|go on) anymore/i,
  /everyone('d| would) be better (off )?without me/i,
];

/**
 * Performance-related distress (not crisis, but noteworthy)
 * These indicate the athlete is struggling but not in immediate danger
 */
const PERFORMANCE_DISTRESS = [
  /give up/i,
  /quit (the team|sports|everything)/i,
  /don't want to play anymore/i,
  /hate (myself|this sport)/i,
  /feel like a failure/i,
];

export interface CrisisDetectionResult {
  isCrisis: boolean;
  isPerformanceDistress: boolean;
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  detectedBy: 'none' | 'keyword' | 'coded' | 'ai' | 'multiple';
  reasons: string[];
  shouldAlert: boolean; // Create alert in database
  shouldEscalate: boolean; // Immediate notification to coach
}

/**
 * Detect crisis indicators in a message
 */
export async function detectCrisis(
  message: string
): Promise<CrisisDetectionResult> {
  const reasons: string[] = [];
  let detectedBy: 'none' | 'keyword' | 'coded' | 'ai' | 'multiple' = 'none';

  // Layer 1: Explicit keyword detection (fastest)
  const keywordMatch = CRISIS_KEYWORDS.some((pattern) => pattern.test(message));
  if (keywordMatch) {
    reasons.push('Explicit crisis keyword detected');
    detectedBy = 'keyword';
  }

  // Layer 2: Coded language detection
  const codedMatch = CODED_PATTERNS.some((pattern) => pattern.test(message));
  if (codedMatch) {
    reasons.push('Coded crisis language detected');
    detectedBy = detectedBy === 'keyword' ? 'multiple' : 'coded';
  }

  // Layer 3: Performance distress (not crisis, but track it)
  const performanceDistress = PERFORMANCE_DISTRESS.some((pattern) =>
    pattern.test(message)
  );

  // Layer 4: OpenAI Moderation API (catches nuanced cases)
  let aiDetected = false;
  try {
    const moderation = await openai.moderations.create({
      input: message,
    });

    const result = moderation.results[0];
    if (result.flagged) {
      if (
        result.categories['self-harm'] ||
        result.categories['self-harm/intent'] ||
        result.categories['self-harm/instructions']
      ) {
        reasons.push('AI detected self-harm content');
        aiDetected = true;
        detectedBy = reasons.length > 1 ? 'multiple' : 'ai';
      }
      if (result.categories['violence']) {
        reasons.push('AI detected violence content');
        aiDetected = true;
      }
    }
  } catch (error) {
    // Don't fail if AI is down - keyword detection still works
    console.error('OpenAI moderation API failed:', error);
    Sentry.captureException(error as Error, {
      tags: { service: 'crisis_detection_ai' },
    });
  }

  const isCrisis = keywordMatch || codedMatch || aiDetected;

  // Determine severity
  let severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' = 'NONE';
  if (isCrisis) {
    if (keywordMatch && /suicid/i.test(message)) {
      severity = 'HIGH'; // Explicit suicide mention
    } else if (reasons.length >= 2) {
      severity = 'HIGH'; // Multiple detection methods agree
    } else if (codedMatch || aiDetected) {
      severity = 'MEDIUM'; // Less explicit but still concerning
    } else {
      severity = 'LOW'; // Single keyword, may be false positive
    }
  } else if (performanceDistress) {
    severity = 'LOW'; // Not crisis, but athlete struggling
  }

  // Should we create an alert?
  const shouldAlert = isCrisis && severity !== 'NONE';

  // Should we escalate immediately (email/SMS to coach)?
  const shouldEscalate = severity === 'HIGH';

  return {
    isCrisis,
    isPerformanceDistress: performanceDistress,
    severity,
    detectedBy,
    reasons,
    shouldAlert,
    shouldEscalate,
  };
}

/**
 * Test the crisis detection system
 * Run this in development to verify it's working
 */
export async function testCrisisDetection() {
  const testCases = [
    {
      message: 'I want to kill myself',
      expected: { severity: 'HIGH', isCrisis: true },
    },
    {
      message: 'Sometimes I just want to unalive myself',
      expected: { severity: 'MEDIUM', isCrisis: true },
    },
    {
      message: "I wish I wouldn't wake up tomorrow",
      expected: { severity: 'MEDIUM', isCrisis: true },
    },
    {
      message: 'I feel anxious about the game tomorrow',
      expected: { severity: 'NONE', isCrisis: false },
    },
    {
      message: 'I want to quit the team, I hate this',
      expected: { severity: 'LOW', isCrisis: false, isPerformanceDistress: true },
    },
    {
      message: 'I need help with my free throw technique',
      expected: { severity: 'NONE', isCrisis: false },
    },
  ];

  console.log('\n🧪 Testing Crisis Detection System\n');

  for (const test of testCases) {
    const result = await detectCrisis(test.message);
    const passed =
      result.severity === test.expected.severity &&
      result.isCrisis === test.expected.isCrisis;

    console.log(
      passed ? '✅' : '❌',
      `"${test.message.substring(0, 50)}..."`
    );
    console.log(`   Expected: ${test.expected.severity}, Got: ${result.severity}`);
    if (result.reasons.length > 0) {
      console.log(`   Reasons: ${result.reasons.join(', ')}`);
    }
    console.log('');
  }
}

/**
 * Get crisis resources for the athlete
 * Return this when crisis is detected
 */
export function getCrisisResources(): string {
  return `
I notice you might be going through a really difficult time. Your wellbeing is important.

**Immediate Resources:**

🆘 **National Crisis Hotline:** Call or text 988
   Available 24/7, free, confidential

📞 **Campus Counseling:** [Your university's counseling number here]

🏃 **Your Coach:** I'm letting your coach know so they can support you

**You're not alone in this.** Your coaches, teammates, and counseling services are here to help. The feelings you're experiencing are temporary, even though they might not feel that way right now.

**What happens next:**
- Your coach will be notified to check in with you
- Campus resources are available 24/7
- We can continue talking when you're ready

Would you like to talk about what's going on, or would you prefer to take a break and connect with someone in person?
  `.trim();
}
