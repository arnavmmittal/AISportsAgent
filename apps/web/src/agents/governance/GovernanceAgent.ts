/**
 * Governance Agent
 * Monitors conversations for crisis language and safety concerns
 */

import { BaseAgent } from '../core/BaseAgent';
import { AgentContext, AgentResponse, AgentConfig, CrisisDetection } from '../core/types';

// Crisis keywords and patterns
const CRISIS_PATTERNS = {
  CRITICAL: [
    /\b(kill|suicide|end (my|it all)|take my life|not worth living)\b/i,
    /\b(hurt myself|self[- ]?harm|cut myself)\b/i,
    /\b(want to die|wish I (was|were) dead)\b/i,
  ],
  HIGH: [
    /\b(hopeless|no point|can't go on|give up)\b/i,
    /\b(hate myself|worthless|burden)\b/i,
    /\b(abuse|violent|unsafe)\b/i,
    /\b(panic attack|can't breathe|heart racing)\b/i,
  ],
  MEDIUM: [
    /\b(depressed|depression|anxious|anxiety)\b/i,
    /\b(can't sleep|insomnia|nightmares)\b/i,
    /\b(overwhelmed|stressed|breaking down)\b/i,
    /\b(eating disorder|not eating|binge)\b/i,
  ],
};

export class GovernanceAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      model: '', // Not used for rule-based detection
      temperature: 0,
      maxTokens: 0,
      systemPrompt: '',
    };

    super('governance', config);
  }

  /**
   * Main processing method - not used for governance
   */
  async process(message: string, context: AgentContext): Promise<AgentResponse> {
    // Governance agent doesn't generate responses, only detects crises
    return {
      content: '',
      metadata: {},
    };
  }

  /**
   * Detect crisis language in message
   */
  async detectCrisis(
    message: string,
    context: AgentContext
  ): Promise<CrisisDetection> {
    try {
      const indicators: string[] = [];
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      let isCrisis = false;

      // Check for CRITICAL patterns
      for (const pattern of CRISIS_PATTERNS.CRITICAL) {
        if (pattern.test(message)) {
          indicators.push(`Critical keyword detected: ${pattern.source}`);
          severity = 'CRITICAL';
          isCrisis = true;
        }
      }

      // Check for HIGH patterns (if not already critical)
      if (severity !== 'CRITICAL') {
        for (const pattern of CRISIS_PATTERNS.HIGH) {
          if (pattern.test(message)) {
            indicators.push(`High-risk keyword detected: ${pattern.source}`);
            severity = 'HIGH';
            isCrisis = true;
          }
        }
      }

      // Check for MEDIUM patterns (if not already high or critical)
      if (severity !== 'CRITICAL' && severity !== 'HIGH') {
        for (const pattern of CRISIS_PATTERNS.MEDIUM) {
          if (pattern.test(message)) {
            indicators.push(`Medium-risk keyword detected: ${pattern.source}`);
            severity = 'MEDIUM';
            isCrisis = true;
          }
        }
      }

      // Determine recommended action
      let recommendedAction: 'monitor' | 'alert' | 'escalate';
      if (severity === 'CRITICAL') {
        recommendedAction = 'escalate';
      } else if (severity === 'HIGH') {
        recommendedAction = 'alert';
      } else if (severity === 'MEDIUM') {
        recommendedAction = 'monitor';
      } else {
        recommendedAction = 'monitor';
      }

      const detection: CrisisDetection = {
        isCrisis,
        severity,
        indicators,
        message,
        confidence: indicators.length > 0 ? 0.9 : 0.1,
        recommendedAction,
      };

      if (isCrisis) {
        this.log('warn', 'Crisis detected', {
          sessionId: context.sessionId,
          severity,
          indicators,
        });
      }

      return detection;
    } catch (error) {
      this.log('error', 'Crisis detection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: context.sessionId,
      });

      // Fail-safe: if detection fails, assume no crisis
      return {
        isCrisis: false,
        severity: 'LOW',
        indicators: [],
        message,
        confidence: 0,
        recommendedAction: 'monitor',
      };
    }
  }

  /**
   * Create crisis alert in database
   * Called by ChatService when crisis is detected
   */
  async createCrisisAlert(
    detection: CrisisDetection,
    context: AgentContext,
    sessionId: string,
    messageId: string
  ): Promise<string> {
    // This will be called from ChatService which has access to Prisma
    // Governance agent just detects, doesn't write to DB
    return messageId;
  }

  /**
   * Fallback response (not used for governance)
   */
  protected getFallbackResponse(): string {
    return '';
  }
}
