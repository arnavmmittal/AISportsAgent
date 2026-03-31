/**
 * Model Node - LLM Invocation with Tools
 *
 * Calls GPT-4 with bound tools for the main conversation.
 * Uses the 5-step Discovery-First protocol as the base system prompt.
 * Injects enriched context for personalization.
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { SystemMessage, AIMessage, type BaseMessage } from '@langchain/core/messages';
import type { ConversationState, ProtocolPhase } from '../state';
import { allTools } from '../tools';
import { buildContextPromptSection } from './context';
import type { Runnable } from '@langchain/core/runnables';

// System prompt for the 5-step Discovery-First protocol
const BASE_SYSTEM_PROMPT = `You are a sports psychology AI coach trained in evidence-based mental performance techniques. You help collegiate athletes develop mental skills, manage performance anxiety, build confidence, and optimize their psychological preparation for competition.

## Your Approach: Discovery-First Protocol

Follow this 5-step approach in your conversations:

### 1. DISCOVERY (First few exchanges)
- Ask open-ended questions to understand the athlete's situation
- Focus on listening and exploring, not solving
- Examples: "Tell me more about what's happening", "How did that make you feel?"

### 2. UNDERSTANDING (After gathering context)
- Reflect back what you've heard
- Validate the athlete's experience
- Show you understand before moving to solutions
- Examples: "It sounds like you're feeling...", "I hear that this is really affecting your..."

### 3. FRAMEWORK (When appropriate)
- Introduce evidence-based mental skills frameworks:
  - **CBT**: Challenge unhelpful thoughts, cognitive restructuring
  - **Mindfulness**: Present-moment awareness, centering
  - **Flow State**: Optimal performance zone, challenge-skill balance
  - **Goal Setting**: SMART goals, process vs outcome focus
- Explain the "why" behind techniques

### 4. ACTION (Concrete techniques)
- Provide specific, actionable techniques:
  - Breathing exercises (4-7-8, box breathing)
  - Visualization and mental rehearsal
  - Self-talk strategies (cue words, affirmations)
  - Pre-performance routines
  - Focus cues and attention control
- Make techniques practical and sport-specific

### 5. FOLLOW-UP (Check understanding)
- Confirm the athlete understands
- Offer to practice together
- Set up accountability
- Examples: "Would you like to try this before your game?", "How does this feel?"

## Important Guidelines

1. **Safety First**: If an athlete expresses thoughts of self-harm, hopelessness, or crisis, prioritize their safety. Provide crisis resources immediately.

2. **Be Warm and Supportive**: Athletes need empathy, not lectures. Meet them where they are.

3. **Sport-Specific**: Tailor advice to the athlete's sport when you know it.

4. **Evidence-Based**: Ground advice in sports psychology research.

5. **Respect Autonomy**: Offer options, don't prescribe. The athlete decides what works for them.

6. **Use Tools When Helpful**: You have access to tools to retrieve athlete data, set goals, and track progress. Use them to personalize support.

7. **Keep Responses Focused**: Athletes are busy. Be concise but thorough.

## Response Style
- Warm and encouraging tone
- Use "I" statements when appropriate
- Ask questions to deepen understanding
- Acknowledge emotions before problem-solving
- End with a question or invitation to continue

## 🎯 PROACTIVE COACHING (USE YOUR CONTEXT!)

You have access to rich athlete data. BE PROACTIVE, not just reactive:

1. **Use Forecasts**: If readiness is predicted to drop, mention it naturally:
   - "I noticed your energy might dip toward the end of the week. Let's plan some recovery..."

2. **Reference What Works**: Use technique effectiveness data to suggest proven approaches:
   - "Visualization has worked well for you before - want to try it again?"

3. **Acknowledge Patterns**: Use behavioral patterns for personalized timing:
   - "You tend to feel strongest on Wednesdays - great day to tackle challenges"

4. **Generate Structured Widgets** when giving actionable advice:
   - Use \`generate_action_plan\` for multi-step recommendations
   - Use \`generate_practice_drill\` for skill-building exercises
   - Use \`generate_pre_performance_routine\` for competition prep

5. **First Message Personalization**: On new sessions, reference recent data:
   - Recent mood trends
   - Upcoming games
   - Burnout stage if concerning

Don't just wait for problems - anticipate them based on your data!`;

/**
 * Build the complete system prompt with context
 */
function buildSystemPrompt(state: ConversationState): string {
  const parts: string[] = [BASE_SYSTEM_PROMPT];

  // Add protocol phase guidance
  parts.push('');
  parts.push('## Current Conversation State');
  parts.push(`- **Protocol Phase**: ${state.protocolPhase}`);
  parts.push(`- **Turn in Phase**: ${state.turnCountInPhase}`);

  // Phase-specific guidance
  const phaseGuidance = getPhaseGuidance(state.protocolPhase, state.turnCountInPhase);
  if (phaseGuidance) {
    parts.push(phaseGuidance);
  }

  // Add enriched context if available
  const contextSection = buildContextPromptSection(state);
  if (contextSection) {
    parts.push('');
    parts.push('# Athlete Context (Personalization)');
    parts.push(contextSection);
  }

  // Add sport context
  if (state.sport) {
    parts.push('');
    parts.push(`## Sport Context`);
    parts.push(`This athlete plays ${state.sport}. Tailor your advice accordingly.`);
  }

  // Add crisis context if LOW/MEDIUM detected
  if (state.crisisDetection && state.crisisDetection.isCrisis) {
    parts.push('');
    parts.push('## ⚠️ Concern Detected');
    parts.push(`A ${state.crisisDetection.severity} level concern was detected: "${state.crisisDetection.indicators.join(', ')}"`);
    parts.push('Be extra supportive and check in on how they are feeling. Gently offer resources if appropriate.');
  }

  // First message guidance - personalized opening
  if (state.protocolPhase === 'discovery' && state.turnCountInPhase === 0) {
    parts.push('');
    parts.push('## 🌟 First Message - Make It Personal!');
    parts.push('This is the start of a new conversation. Create a warm, personalized opening:');

    const ctx = state.enrichedContext;
    if (ctx) {
      // Build personalized opening hints
      const hints: string[] = [];

      if (ctx.daysSinceLastChat && ctx.daysSinceLastChat > 7) {
        hints.push(`- Welcome them back (it's been ${ctx.daysSinceLastChat} days)`);
      }

      if (ctx.hasGameSoon && ctx.daysUntilNextGame !== null && ctx.daysUntilNextGame <= 3) {
        hints.push(`- Acknowledge upcoming game in ${ctx.daysUntilNextGame} day(s)`);
      }

      if (ctx.burnout && ctx.burnout.stage !== 'healthy') {
        hints.push(`- Gently check in on energy levels (burnout indicators detected)`);
      }

      if (ctx.readiness && ctx.readiness.trend === 'declining') {
        hints.push(`- Note: readiness is trending down, be supportive`);
      }

      if (ctx.forecast && ctx.forecast.riskFlags.length > 0) {
        hints.push(`- Forecast shows risk flags - can mention proactively`);
      }

      if (hints.length > 0) {
        parts.push('Consider mentioning:');
        hints.forEach(h => parts.push(h));
      } else {
        parts.push('- Start with a warm, open question about how they are doing today');
      }
    }
  }

  return parts.join('\n');
}

/**
 * Get phase-specific guidance for the current protocol phase
 */
function getPhaseGuidance(phase: ProtocolPhase, turnCount: number): string {
  switch (phase) {
    case 'discovery':
      return `\n**Phase Guidance**: You are in DISCOVERY. Focus on asking open-ended questions and listening. Avoid jumping to solutions too quickly. ${turnCount < 2 ? 'Ask at least 2-3 more questions before moving to understanding.' : ''}`;
    case 'understanding':
      return `\n**Phase Guidance**: You are in UNDERSTANDING. Reflect back what you've heard and validate the athlete's experience. Show you understand before suggesting solutions.`;
    case 'framework':
      return `\n**Phase Guidance**: You are in FRAMEWORK. Introduce an evidence-based technique that fits the athlete's situation. Explain why it works.`;
    case 'action':
      return `\n**Phase Guidance**: You are in ACTION. Provide specific, actionable steps the athlete can take. Make it practical and concrete.`;
    case 'followup':
      return `\n**Phase Guidance**: You are in FOLLOW-UP. Check if the athlete found this helpful. Offer to practice together or set up next steps.`;
    default:
      return '';
  }
}

// Lazy-initialized models with tools
 
let openaiModelInstance: Runnable<any, any> | null = null;
 
let anthropicModelInstance: Runnable<any, any> | null = null;

type ModelProvider = 'openai' | 'anthropic';

 
function getOpenAIModel(): Runnable<any, any> {
  if (!openaiModelInstance) {
    const model = new ChatOpenAI({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 2048,
      streaming: true,
    });
    openaiModelInstance = model.bindTools(allTools);
  }
  return openaiModelInstance;
}

 
function getAnthropicModel(): Runnable<any, any> {
  if (!anthropicModelInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    const model = new ChatAnthropic({
      anthropicApiKey: apiKey,
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      temperature: 0.7,
      maxTokens: 2048,
      streaming: true,
    });
    anthropicModelInstance = model.bindTools(allTools);
  }
  return anthropicModelInstance;
}

 
function getModelWithTools(provider: ModelProvider = 'openai'): Runnable<any, any> {
  if (provider === 'anthropic') {
    return getAnthropicModel();
  }
  return getOpenAIModel();
}

function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Try invoking a model and return the response
 */
async function tryInvokeModel(
   
  model: Runnable<any, any>,
  messagesForModel: BaseMessage[],
  providerName: string
   
): Promise<{ response: any; duration: number }> {
  const startTime = Date.now();
  console.log(`[LANGGRAPH:MODEL] Calling ${providerName} model...`);

  const response = await model.invoke(messagesForModel);
  const duration = Date.now() - startTime;

  // Handle content that might be string or array (Anthropic returns array)
  const contentStr = typeof response.content === 'string'
    ? response.content
    : Array.isArray(response.content)
      ? response.content.map((c: { text?: string }) => c.text || '').join('')
      : '';

  console.log(`[LANGGRAPH:MODEL] ${providerName} response received:`, {
    hasToolCalls: (response.tool_calls?.length || 0) > 0,
    toolCalls: response.tool_calls?.map((tc: { name: string }) => tc.name),
    contentLength: contentStr.length,
    contentPreview: contentStr.substring(0, 100),
    duration: `${duration}ms`,
  });

  return { response, duration };
}

/**
 * Call model node - invokes LLM with tools
 * Uses OpenAI as primary, falls back to Anthropic if OpenAI fails
 */
export async function callModelNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  const systemPrompt = buildSystemPrompt(state);

  // Build messages array with system prompt
  const messagesForModel = [
    new SystemMessage({ content: systemPrompt }),
    ...state.messages,
  ];

  // Log key availability for debugging
  console.log('[LANGGRAPH:MODEL] Environment check:', {
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
  });

  // Try OpenAI first
  try {
    const openaiModel = getModelWithTools('openai');
    const { response } = await tryInvokeModel(openaiModel, messagesForModel, 'OpenAI');

    return {
      messages: [response],
      turnCountInPhase: state.turnCountInPhase + 1,
    };
  } catch (openaiError) {
    console.error('[LANGGRAPH:MODEL] OpenAI failed:', openaiError);
    console.error('[LANGGRAPH:MODEL] OpenAI error type:', openaiError instanceof Error ? openaiError.constructor.name : typeof openaiError);

    // If OpenAI fails and we have Anthropic key, try Anthropic as fallback
    if (hasAnthropicKey()) {
      console.log('[LANGGRAPH:MODEL] Falling back to Anthropic...');
      try {
        const anthropicModel = getModelWithTools('anthropic');
        console.log('[LANGGRAPH:MODEL] Anthropic model created successfully');
        const { response } = await tryInvokeModel(anthropicModel, messagesForModel, 'Anthropic');
        console.log('[LANGGRAPH:MODEL] Anthropic invocation successful');

        return {
          messages: [response],
          turnCountInPhase: state.turnCountInPhase + 1,
        };
      } catch (anthropicError) {
        console.error('[LANGGRAPH:MODEL] Anthropic also failed:', anthropicError);
        console.error('[LANGGRAPH:MODEL] Anthropic error type:', anthropicError instanceof Error ? anthropicError.constructor.name : typeof anthropicError);
        console.error('[LANGGRAPH:MODEL] Anthropic error stack:', anthropicError instanceof Error ? anthropicError.stack : 'no stack');
      }
    } else {
      console.log('[LANGGRAPH:MODEL] No Anthropic API key configured for fallback');
    }

    // Both providers failed or Anthropic not available - return fallback response
    console.error('[LANGGRAPH:MODEL] Both providers failed, returning fallback message');
    return {
      messages: [
        new AIMessage({
          content: "I'm here to help, but I'm having a technical issue right now. Please try again in a moment, or if this is urgent, reach out to your coach directly.",
        }),
      ],
      error: `Model invocation failed: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`,
    };
  }
}

/**
 * Routing function - determines if we should continue to tools or generate response
 */
export function shouldContinueToTools(
  state: ConversationState
): 'tools' | 'persist' {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // Check if last message is an AIMessage with tool calls
  if (lastMessage instanceof AIMessage) {
    const toolCalls = lastMessage.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      return 'tools';
    }
  }

  // No tool calls, go to persist
  return 'persist';
}

export { BASE_SYSTEM_PROMPT };
