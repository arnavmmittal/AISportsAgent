/**
 * Persist Node - Save State to Database
 *
 * Final node that persists:
 * - Assistant message to the database
 * - Crisis alerts if detected
 * - Session metadata updates
 *
 * Also triggers async analysis for coach insights.
 */

import { AIMessage } from '@langchain/core/messages';
import type { ConversationState } from '../state';
import { prisma } from '@/lib/prisma';
import { shouldAdvancePhase } from '../state';

/**
 * Persist state node - saves conversation to database
 */
export async function persistStateNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  const startTime = Date.now();

  try {
    // Get the last assistant message
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    if (!(lastMessage instanceof AIMessage)) {
      // No assistant message to save
      return { isComplete: true };
    }

    const content = lastMessage.content as string;

    // Save assistant message to database
    // Note: Message requires explicit id (not auto-generated in schema)
    await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        sessionId: state.sessionId,
        role: 'assistant',
        content,
      },
    });

    // Create crisis alert if detected
    if (state.crisisDetection?.isCrisis && !state.crisisHandled) {
      await createCrisisAlert(state);
    }

    // Update session metadata
    await updateSessionMetadata(state);

    // Determine if phase should advance
    const hasFrameworkApplied =
      state.responseMetadata?.framework !== undefined ||
      content.toLowerCase().includes('breathing') ||
      content.toLowerCase().includes('visualization') ||
      content.toLowerCase().includes('mindfulness');

    const newPhase = shouldAdvancePhase(
      state.protocolPhase,
      state.turnCountInPhase,
      hasFrameworkApplied
    );

    const duration = Date.now() - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log('[LANGGRAPH:PERSIST]', {
        sessionId: state.sessionId,
        messageLength: content.length,
        hasCrisis: state.crisisDetection?.isCrisis,
        phaseAdvanced: newPhase !== state.protocolPhase,
        newPhase,
        duration: `${duration}ms`,
      });
    }

    // Reset turn count if phase changed
    const turnCountInPhase = newPhase !== state.protocolPhase ? 0 : state.turnCountInPhase;

    return {
      isComplete: true,
      protocolPhase: newPhase,
      turnCountInPhase,
    };
  } catch (error) {
    console.error('[LANGGRAPH:PERSIST] Failed to persist state:', error);

    // Mark complete even on error - don't block the response
    return {
      isComplete: true,
      error: state.error
        ? `${state.error}; Persist failed: ${error instanceof Error ? error.message : 'Unknown'}`
        : `Persist failed: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/**
 * Create a crisis alert in the database
 */
async function createCrisisAlert(state: ConversationState): Promise<void> {
  if (!state.crisisDetection) return;

  try {
    // Get the athlete info
    const athlete = await prisma.athlete.findUnique({
      where: { userId: state.athleteId },
    });

    if (!athlete) return;

    // Get the last message ID from the session
    const lastMessage = await prisma.message.findFirst({
      where: { sessionId: state.sessionId },
      orderBy: { createdAt: 'desc' },
    });

    // Create crisis alert using schema-compatible fields
    await prisma.crisisAlert.create({
      data: {
        athleteId: state.athleteId,
        sessionId: state.sessionId,
        messageId: lastMessage?.id || 'unknown',
        severity: state.crisisDetection.severity,
        notes: state.crisisDetection.message,
        escalated: state.crisisDetection.severity === 'CRITICAL',
      },
    });

    // Log for audit
    console.log('[CRISIS_ALERT]', {
      athleteId: state.athleteId,
      severity: state.crisisDetection.severity,
      indicators: state.crisisDetection.indicators,
    });

    // TODO: Send push notification to coaches
    // This would integrate with the existing push notification system
  } catch (error) {
    console.error('[CRISIS_ALERT] Failed to create crisis alert:', error);
  }
}

/**
 * Update session metadata in the database
 */
async function updateSessionMetadata(state: ConversationState): Promise<void> {
  try {
    // Determine topic/focus from conversation
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    const content = lastMessage.content as string;

    // Simple topic detection
    let focusArea: string | null = null;
    if (content.toLowerCase().includes('anxiety') || content.toLowerCase().includes('nervous')) {
      focusArea = 'anxiety';
    } else if (content.toLowerCase().includes('confidence')) {
      focusArea = 'confidence';
    } else if (content.toLowerCase().includes('focus') || content.toLowerCase().includes('concentration')) {
      focusArea = 'focus';
    } else if (content.toLowerCase().includes('motivation')) {
      focusArea = 'motivation';
    } else if (content.toLowerCase().includes('recovery') || content.toLowerCase().includes('rest')) {
      focusArea = 'recovery';
    }

    // Update session
    await prisma.chatSession.update({
      where: { id: state.sessionId },
      data: {
        focusArea: focusArea || undefined,
        discoveryPhase: state.protocolPhase,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    // Non-critical - log but don't throw
    console.error('[PERSIST] Failed to update session metadata:', error);
  }
}

/**
 * Extract response content from state for streaming
 */
export function extractResponseContent(state: ConversationState): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  if (lastMessage instanceof AIMessage) {
    return lastMessage.content as string;
  }

  return '';
}
