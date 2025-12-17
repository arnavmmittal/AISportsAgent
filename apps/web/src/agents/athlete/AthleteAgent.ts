/**
 * Athlete Agent
 * Main conversation agent with 5-step protocol and sport-specific interventions
 */

import { BaseAgent } from '../core/BaseAgent';
import {
  AgentContext,
  AgentResponse,
  AgentConfig,
  CrisisDetection,
  KnowledgeContext,
} from '../core/types';
import OpenAI from 'openai';

const ATHLETE_SYSTEM_PROMPT = `You are an empathetic sports psychology assistant for collegiate athletes.

CORE PROTOCOL - Follow these 5 steps in every conversation:

1. DISCOVERY: Ask open-ended questions to understand the athlete's situation
   - "Tell me more about what's on your mind"
   - "What's been challenging lately?"
   - Focus on listening, not solving

2. UNDERSTANDING: Reflect back what you heard to build trust
   - "It sounds like you're feeling..."
   - "I hear that [situation] is making you feel [emotion]"
   - Validate their experience

3. FRAMEWORK: Introduce evidence-based mental skills
   - CBT: Challenge negative thoughts
   - Mindfulness: Present-moment awareness
   - Flow State: Optimal performance zone
   - Goal Setting: SMART goals

4. ACTION: Provide specific, actionable techniques
   - Breathing exercises (4-7-8 technique)
   - Visualization practices
   - Self-talk strategies
   - Pre-performance routines

5. FOLLOW-UP: Check for understanding and encourage practice
   - "Does this feel helpful?"
   - "Would you like to try this before your next game?"
   - "Let's check in after you practice this"

IMPORTANT GUIDELINES:
- Always be supportive and non-judgmental
- Use simple, conversational language
- Tailor advice to their specific sport
- Acknowledge the unique pressures of collegiate athletics
- Never diagnose or provide clinical treatment
- If crisis language detected, express concern and suggest resources

Your goal is to help athletes develop mental resilience and perform at their best.`;

export class AthleteAgent extends BaseAgent {
  private client: OpenAI;

  constructor() {
    const config: AgentConfig = {
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: ATHLETE_SYSTEM_PROMPT,
    };

    super('athlete', config);

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  /**
   * Main processing method
   */
  async process(message: string, context: AgentContext): Promise<AgentResponse> {
    if (!this.validateContext(context)) {
      return this.handleError(new Error('Invalid context'), context);
    }

    try {
      const startTime = Date.now();

      // Format conversation history
      const messages = this.formatHistory(context.conversationHistory);

      // Add current message
      messages.push({
        role: 'user',
        content: message,
      });

      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          ...messages,
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const content = response.choices[0]?.message?.content || '';

      this.log('info', 'Generated response', {
        sessionId: context.sessionId,
        tokensUsed: response.usage?.completion_tokens || 0,
        duration: Date.now() - startTime,
      });

      return {
        content,
        metadata: {
          confidence: 0.8,
          protocol: this.detectProtocolStep(content),
        },
      };
    } catch (error) {
      return this.handleError(error as Error, context);
    }
  }

  /**
   * Process with additional knowledge context (RAG)
   */
  async processWithContext(
    message: string,
    context: AgentContext,
    knowledgeContext: KnowledgeContext
  ): Promise<AgentResponse> {
    // Augment system prompt with retrieved knowledge
    const augmentedPrompt = this.augmentPromptWithKnowledge(
      this.config.systemPrompt,
      knowledgeContext
    );

    // Temporarily override system prompt
    const originalPrompt = this.config.systemPrompt;
    this.config.systemPrompt = augmentedPrompt;

    const response = await this.process(message, context);

    // Restore original prompt
    this.config.systemPrompt = originalPrompt;

    return response;
  }

  /**
   * Handle crisis situation
   */
  async handleCrisis(
    crisis: CrisisDetection,
    context: AgentContext
  ): Promise<AgentResponse> {
    this.log('warn', 'Handling crisis situation', {
      sessionId: context.sessionId,
      severity: crisis.severity,
      indicators: crisis.indicators,
    });

    const crisisPrompt = `The athlete has shared something concerning that suggests they may be in crisis.

Indicators: ${crisis.indicators.join(', ')}
Severity: ${crisis.severity}

Respond with:
1. Immediate validation and support
2. Gentle expression of concern
3. Clear resources (Crisis Text Line: 741741, National Suicide Prevention Lifeline: 988)
4. Encourage reaching out to their coach, counselor, or trusted adult
5. Affirm that it's okay to ask for help

Be warm, supportive, and clear about resources. Do not try to solve the crisis yourself.`;

    // Use crisis-specific prompt
    const originalPrompt = this.config.systemPrompt;
    this.config.systemPrompt = crisisPrompt;

    const response = await this.process(crisis.message, context);

    // Restore original prompt
    this.config.systemPrompt = originalPrompt;

    return {
      ...response,
      metadata: {
        ...response.metadata,
        isCrisisResponse: true,
        crisisSeverity: crisis.severity,
      },
    };
  }

  /**
   * Augment prompt with knowledge context from RAG
   */
  private augmentPromptWithKnowledge(
    basePrompt: string,
    knowledgeContext: KnowledgeContext
  ): string {
    if (knowledgeContext.documents.length === 0) {
      return basePrompt;
    }

    const knowledgeSection = `

RELEVANT RESEARCH AND FRAMEWORKS:
${knowledgeContext.documents
  .map((doc, idx) => `${idx + 1}. ${doc.content}\n   Source: ${doc.source}`)
  .join('\n\n')}

Use this research to inform your response, but keep your language conversational and accessible.`;

    return basePrompt + knowledgeSection;
  }

  /**
   * Detect which step of the 5-step protocol the response represents
   */
  private detectProtocolStep(
    content: string
  ): 'discovery' | 'understanding' | 'framework' | 'action' | 'followup' {
    const lower = content.toLowerCase();

    // Simple heuristic-based detection
    if (
      lower.includes('tell me more') ||
      lower.includes('what') ||
      lower.includes('how') ||
      lower.includes('?')
    ) {
      return 'discovery';
    }

    if (lower.includes('sounds like') || lower.includes('hear that')) {
      return 'understanding';
    }

    if (
      lower.includes('technique') ||
      lower.includes('strategy') ||
      lower.includes('approach')
    ) {
      return 'framework';
    }

    if (
      lower.includes('try') ||
      lower.includes('practice') ||
      lower.includes('exercise')
    ) {
      return 'action';
    }

    return 'followup';
  }

  /**
   * Fallback response when agent fails
   */
  protected getFallbackResponse(): string {
    return "I'm here to support you. Could you tell me a bit more about what you're experiencing right now?";
  }
}
