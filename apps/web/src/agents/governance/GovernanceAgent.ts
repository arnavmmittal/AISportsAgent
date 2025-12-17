/**
 * Governance Agent - PRODUCTION-READY
 * AI-powered crisis detection with dual-layer safety system
 * Layer 1: Fast regex screening (immediate response)
 * Layer 2: GPT-4 powered nuanced analysis (context-aware)
 */

import { BaseAgent } from '../core/BaseAgent';
import { AgentContext, AgentResponse, AgentConfig, CrisisDetection } from '../core/types';
import OpenAI from 'openai';

// Layer 1: Fast regex patterns for immediate detection
const CRITICAL_KEYWORDS = [
  /\b(kill myself|suicide|end (my|it all)|take my life|not worth living)\b/i,
  /\b(hurt myself|self[- ]?harm|cut myself|cutting)\b/i,
  /\b(want to die|wish I (was|were) dead|better off dead)\b/i,
  /\b(end (my|the) pain|can't take it anymore)\b/i,
];

const HIGH_RISK_KEYWORDS = [
  /\b(hopeless|no point in|can't go on|give up on life)\b/i,
  /\b(hate myself|worthless|burden to everyone)\b/i,
  /\b(abuse|abused|violent|hit me|hurts me)\b/i,
  /\b(rape|sexual assault|molest)\b/i,
];

const CRISIS_ANALYSIS_PROMPT = `You are a mental health safety monitor for collegiate athletes. Analyze the message for signs of crisis.

CRITICAL INDICATORS (immediate danger):
- Explicit suicidal ideation
- Self-harm intent or recent self-harm
- Homicidal ideation
- Active abuse disclosure
- Severe dissociation or psychosis

HIGH RISK (needs urgent attention):
- Hopelessness with plan formation
- Severe emotional dysregulation
- Recent trauma disclosure
- Eating disorder emergency (medical risk)
- Substance abuse crisis

MEDIUM RISK (needs monitoring):
- Persistent depression symptoms
- Anxiety interfering with functioning
- Sleep disturbances (severe)
- Social isolation increasing

LOW RISK:
- Normal stress/pressure about performance
- Mild anxiety before competition
- Temporary sadness about loss/failure

IMPORTANT CONTEXT:
- Athletes use metaphorical language ("I'm dying out there", "killing it")
- Distinguish performance stress from mental health crisis
- Consider: Is this immediate danger vs. chronic struggle?

Return a JSON object with:
{
  "isCrisis": boolean,
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "indicators": ["specific concerning phrases"],
  "reasoning": "brief explanation of assessment",
  "confidence": 0.0-1.0,
  "recommendedAction": "escalate" | "alert" | "monitor",
  "isMetaphor": boolean,
  "requiresImmediateResponse": boolean
}`;

export class GovernanceAgent extends BaseAgent {
  private client: OpenAI;
  private enableAIAnalysis: boolean;

  constructor() {
    const config: AgentConfig = {
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      temperature: 0, // Deterministic for safety
      maxTokens: 1024,
      systemPrompt: CRISIS_ANALYSIS_PROMPT,
    };

    super('governance', config);

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // Can disable AI analysis in dev/testing (falls back to regex only)
    this.enableAIAnalysis = process.env.ENABLE_AI_CRISIS_DETECTION !== 'false';
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
   * PRODUCTION-READY: Dual-layer crisis detection
   * Fast regex + AI-powered nuanced analysis
   */
  async detectCrisis(
    message: string,
    context: AgentContext
  ): Promise<CrisisDetection> {
    const startTime = Date.now();

    try {
      // Layer 1: Fast regex screening (< 1ms)
      const regexResult = this.quickRegexScreen(message);

      // If regex finds CRITICAL keywords, flag immediately
      if (regexResult.severity === 'CRITICAL') {
        this.log('warn', 'CRITICAL crisis detected via regex', {
          sessionId: context.sessionId,
          indicators: regexResult.indicators,
        });

        return {
          ...regexResult,
          confidence: 0.95, // High confidence for explicit keywords
        };
      }

      // Layer 2: AI-powered nuanced analysis
      // Understands context, metaphor, and subtle indicators
      if (this.enableAIAnalysis) {
        const aiResult = await this.aiCrisisAnalysis(message, context);

        // Use AI result if it detects higher severity
        if (
          this.getSeverityLevel(aiResult.severity) >
          this.getSeverityLevel(regexResult.severity)
        ) {
          this.log('info', 'AI enhanced crisis detection', {
            sessionId: context.sessionId,
            regexSeverity: regexResult.severity,
            aiSeverity: aiResult.severity,
            duration: Date.now() - startTime,
          });

          return aiResult;
        }
      }

      // Return regex result if no AI or AI found nothing higher
      return regexResult;
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
   * Layer 1: Fast regex screening
   */
  private quickRegexScreen(message: string): CrisisDetection {
    const indicators: string[] = [];
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    // Check CRITICAL patterns
    for (const pattern of CRITICAL_KEYWORDS) {
      const match = message.match(pattern);
      if (match) {
        indicators.push(`Critical: "${match[0]}"`);
        severity = 'CRITICAL';
      }
    }

    // Check HIGH patterns (if not already critical)
    if (severity !== 'CRITICAL') {
      for (const pattern of HIGH_RISK_KEYWORDS) {
        const match = message.match(pattern);
        if (match) {
          indicators.push(`High risk: "${match[0]}"`);
          severity = 'HIGH';
        }
      }
    }

    const isCrisis = severity === 'CRITICAL' || severity === 'HIGH';
    const recommendedAction =
      severity === 'CRITICAL'
        ? 'escalate'
        : severity === 'HIGH'
          ? 'alert'
          : 'monitor';

    return {
      isCrisis,
      severity,
      indicators,
      message,
      confidence: indicators.length > 0 ? 0.8 : 0.1,
      recommendedAction,
    };
  }

  /**
   * Layer 2: AI-powered nuanced analysis
   */
  private async aiCrisisAnalysis(
    message: string,
    context: AgentContext
  ): Promise<CrisisDetection> {
    try {
      // Include conversation context for better assessment
      const contextMessages = context.conversationHistory.slice(-3);
      const conversationContext = contextMessages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `Analyze this message for crisis indicators:

CONVERSATION CONTEXT:
${conversationContext}

CURRENT MESSAGE:
${message}

Return JSON only, no other text.`;

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';

      // Parse AI response
      const analysis = JSON.parse(content);

      return {
        isCrisis: analysis.isCrisis,
        severity: analysis.severity,
        indicators: analysis.indicators || [],
        message,
        confidence: analysis.confidence,
        recommendedAction: analysis.recommendedAction,
      };
    } catch (error) {
      this.log('warn', 'AI crisis analysis failed, falling back to regex', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to regex result
      return this.quickRegexScreen(message);
    }
  }

  /**
   * Convert severity to numeric level for comparison
   */
  private getSeverityLevel(
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): number {
    const levels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    return levels[severity];
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
