/**
 * Safety Node - Crisis Detection
 *
 * First node in the graph that runs on every message.
 * Reuses the existing GovernanceAgent's triple-layer crisis detection:
 * 1. Fast regex scan for critical keywords
 * 2. OpenAI Moderation API
 * 3. GPT-4 nuanced analysis
 *
 * If a critical/high crisis is detected, the graph routes to crisis response.
 */

import { HumanMessage, AIMessage } from '@langchain/core/messages';
import type { ConversationState, CrisisDetection } from '../state';
import { GovernanceAgent } from '@/agents/governance/GovernanceAgent';

// Singleton governance agent
let governanceAgentInstance: GovernanceAgent | null = null;

function getGovernanceAgent(): GovernanceAgent {
  if (!governanceAgentInstance) {
    governanceAgentInstance = new GovernanceAgent();
  }
  return governanceAgentInstance;
}

/**
 * Safety check node - runs crisis detection on the latest user message
 */
export async function safetyCheckNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  const startTime = Date.now();

  // Get the last message
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // Only check user messages
  if (!(lastMessage instanceof HumanMessage)) {
    return { crisisDetection: null };
  }

  const userMessage = lastMessage.content as string;
  const governanceAgent = getGovernanceAgent();

  try {
    // Run crisis detection using existing GovernanceAgent
    const crisisCheck = await governanceAgent.detectCrisis(userMessage, {
      sessionId: state.sessionId,
      athleteId: state.athleteId,
      userId: state.userId,
      conversationHistory: [],
    });

    const duration = Date.now() - startTime;

    // Log crisis detection result
    if (process.env.NODE_ENV === 'development') {
      console.log('[LANGGRAPH:SAFETY]', {
        isCrisis: crisisCheck.isCrisis,
        severity: crisisCheck.severity,
        duration: `${duration}ms`,
      });
    }

    // Map to our state type
    const crisisDetection: CrisisDetection | null = crisisCheck.isCrisis
      ? {
          isCrisis: true,
          severity: crisisCheck.severity,
          indicators: crisisCheck.indicators,
          message: crisisCheck.message,
          confidence: crisisCheck.confidence,
          recommendedAction: crisisCheck.recommendedAction,
        }
      : null;

    return { crisisDetection };
  } catch (error) {
    console.error('[LANGGRAPH:SAFETY] Crisis detection failed:', error);
    // On error, fail safe - assume no crisis but log the error
    return {
      crisisDetection: null,
      error: `Crisis detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Routing function - determines next node after safety check
 */
export function routeAfterSafetyCheck(
  state: ConversationState
): 'crisis_response' | 'load_context' {
  const crisis = state.crisisDetection;

  // Route to crisis response for critical/high severity
  if (crisis?.isCrisis) {
    if (crisis.severity === 'CRITICAL' || crisis.severity === 'HIGH') {
      return 'crisis_response';
    }
  }

  // Continue normal flow
  return 'load_context';
}

/**
 * Crisis response node - handles critical/high crises immediately
 * Does not use tools, provides direct supportive response with resources
 */
export async function crisisResponseNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  const crisis = state.crisisDetection;
  if (!crisis) {
    // Should not happen, but handle gracefully
    return {
      crisisHandled: true,
      messages: [
        new AIMessage({
          content: "I'm here for you. If you're going through something difficult, please know that support is available.",
        }),
      ],
    };
  }

  // Build crisis response based on severity and indicators
  let response: string;

  if (crisis.severity === 'CRITICAL') {
    response = `I hear you, and I want you to know that what you're feeling is valid. Your safety and wellbeing matter more than anything else right now.

**If you're in immediate danger or having thoughts of harming yourself, please reach out now:**

🆘 **National Suicide Prevention Lifeline**: 988 (call or text)
🆘 **Crisis Text Line**: Text HOME to 741741
🆘 **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

I'm an AI and can't provide the level of support you need right now, but trained counselors are available 24/7 and want to help.

Would it be okay if I also let your coach or support staff know you're going through a difficult time? They care about you and want to support you.`;
  } else {
    // HIGH severity
    response = `I can hear that you're going through a really tough time right now. Thank you for trusting me with that - it takes courage to share.

What you're feeling is understandable, and you don't have to go through this alone. While I'm here to support you, I also want to make sure you have access to people who can provide more help if needed.

**Support resources available to you:**
📞 **988 Suicide & Crisis Lifeline**: 988 (call or text, 24/7)
💬 **Crisis Text Line**: Text HOME to 741741
🏫 **Your school's counseling center** can provide confidential support

I'm going to continue our conversation, but please know these resources are always available. Would you like to tell me more about what's going on?`;
  }

  return {
    crisisHandled: true,
    messages: [
      new AIMessage({
        content: response,
      }),
    ],
    responseMetadata: {
      isCrisisResponse: true,
      crisisSeverity: crisis.severity,
      confidence: crisis.confidence,
    },
  };
}
