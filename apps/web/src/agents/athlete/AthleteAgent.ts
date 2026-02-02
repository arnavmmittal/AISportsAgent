/**
 * Athlete Agent
 * Main conversation agent with 5-step protocol and sport-specific interventions
 *
 * Enhanced with AthleteContextService integration:
 * - Uses ML predictions for proactive support
 * - Personalizes responses based on athlete's history
 * - Incorporates real-time readiness data
 * - Leverages effective past interventions
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
import { getAthleteContextService, type EnrichedAthleteContext } from '@/services/AthleteContextService';

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

EMOTION IDENTIFICATION HELP:
Many athletes find it hard to name what they're feeling. This is normal - athletic training often emphasizes "pushing through" rather than noticing emotions. When athletes seem stuck or use vague language like "I don't know" or "just off":

1. OFFER VOCABULARY gently: "Sometimes athletes describe feeling like [anxious/frustrated/overwhelmed/drained] - do any of those fit?"

2. USE PHYSICAL CUES: "Where do you feel it in your body? Tight chest might be anxiety, heavy limbs might be exhaustion, churning stomach might be nerves."

3. NORMALIZE DIFFICULTY: "It's totally normal to not have words for this right now. Let's just explore what's happening."

4. PROVIDE OPTIONS: Instead of "How do you feel?", try "Would you say you're more frustrated, anxious, or something else entirely?"

5. CONNECT TO SPORT CONTEXT: "Before a big game, some athletes feel pumped, others feel tight, others feel kind of numb. What's it like for you?"

Common athlete emotion patterns to help identify:
- Pre-competition anxiety: butterflies, racing thoughts, restlessness, irritability
- Post-loss disappointment: heaviness, withdrawal, rumination, self-criticism
- Burnout: numbness, going through motions, loss of joy, exhaustion even after rest
- Performance pressure: perfectionism, fear of letting others down, comparison to teammates
- Injury frustration: helplessness, impatience, identity confusion, fear of returning

IMPORTANT GUIDELINES:
- Always be supportive and non-judgmental
- Use simple, conversational language
- Tailor advice to their specific sport
- Acknowledge the unique pressures of collegiate athletics
- Never diagnose or provide clinical treatment
- If crisis language detected, express concern and suggest resources

PROACTIVE SUPPORT (when context is available):
- If you notice patterns in the athlete's data, gently acknowledge them
- Reference techniques that have worked for them before
- Be aware of upcoming competitions and adjust your approach
- If their state is below their baseline, show extra care
- When you have technique effectiveness data, use it: "Last time you used X, your performance improved - want to try it again?"
- When mood patterns exist, reference them: "I notice your mood tends to dip on Mondays - how are you feeling today?"

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

      // Call OpenAI API (non-streaming for now, streaming handled separately)
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          ...messages,
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: false,
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
   * Process with additional knowledge context (RAG) and enriched athlete context
   */
  async processWithContext(
    message: string,
    context: AgentContext,
    knowledgeContext: KnowledgeContext
  ): Promise<AgentResponse> {
    // Build fully enhanced system prompt
    const enhancedPrompt = this.buildEnhancedSystemPrompt(
      context.enrichedContext,
      knowledgeContext
    );

    // Temporarily override system prompt
    const originalPrompt = this.config.systemPrompt;
    this.config.systemPrompt = enhancedPrompt;

    const response = await this.process(message, context);

    // Restore original prompt
    this.config.systemPrompt = originalPrompt;

    return response;
  }

  /**
   * Process with streaming support AND enriched context
   */
  async processStreamWithContext(
    message: string,
    context: AgentContext,
    knowledgeContext: KnowledgeContext,
    onChunk: (chunk: string) => void
  ): Promise<AgentResponse> {
    // Build fully enhanced system prompt
    const enhancedPrompt = this.buildEnhancedSystemPrompt(
      context.enrichedContext,
      knowledgeContext
    );

    // Temporarily override system prompt
    const originalPrompt = this.config.systemPrompt;
    this.config.systemPrompt = enhancedPrompt;

    const response = await this.processStream(message, context, onChunk);

    // Restore original prompt
    this.config.systemPrompt = originalPrompt;

    return response;
  }

  /**
   * Build an enhanced system prompt incorporating:
   * - Base protocol
   * - Enriched athlete context (ML predictions, readiness, patterns)
   * - Knowledge context (RAG documents)
   */
  private buildEnhancedSystemPrompt(
    enrichedContext: EnrichedAthleteContext | undefined,
    knowledgeContext: KnowledgeContext
  ): string {
    let prompt = this.config.systemPrompt;

    // Add enriched athlete context if available
    if (enrichedContext) {
      const contextService = getAthleteContextService();
      const athleteEnhancement = contextService.generatePromptEnhancement(enrichedContext);

      prompt = `${prompt}

═══════════════════════════════════════════════════════════════
PERSONALIZED ATHLETE INTELLIGENCE (Use this to be proactive)
═══════════════════════════════════════════════════════════════

${athleteEnhancement}

HOW TO USE THIS CONTEXT:
- If risk is high/critical or slump detected: Gently acknowledge patterns you're seeing
- Reference effective interventions that have worked for this athlete
- Be aware of their baseline - if they're below their typical state, acknowledge that
- Use upcoming game context to tailor advice to competition preparation
- Don't overwhelm them with all this info - use it naturally in conversation`;
    }

    // Add knowledge context (RAG)
    if (knowledgeContext.documents.length > 0) {
      prompt = this.augmentPromptWithKnowledge(prompt, knowledgeContext);
    }

    return prompt;
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

  /**
   * Process message with streaming support (for real-time token streaming)
   */
  async processStream(
    message: string,
    context: AgentContext,
    onChunk: (chunk: string) => void
  ): Promise<AgentResponse> {
    if (!message || !context) {
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

      // Call OpenAI API with streaming
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          ...messages,
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true,
      });

      let fullContent = '';

      // Process stream
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          onChunk(delta); // Send each chunk to callback
        }
      }

      this.log('info', 'Generated streaming response', {
        sessionId: context.sessionId,
        duration: Date.now() - startTime,
      });

      return {
        content: fullContent,
        metadata: {
          confidence: 0.8,
          protocol: this.detectProtocolStep(fullContent),
        },
      };
    } catch (error) {
      return this.handleError(error as Error, context);
    }
  }
}
