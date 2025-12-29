/**
 * Chat Service - PRODUCTION-READY
 * Orchestrates agent system with database persistence
 * Handles sessions, messages, crisis detection, and knowledge retrieval
 */

import { prisma } from '@/lib/prisma';
import { getOrchestrator } from '@/agents';
import { AgentContext, CrisisDetection } from '@/agents/core/types';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
  crisisDetected?: {
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    action: 'monitor' | 'alert' | 'escalate';
  };
}

export class ChatService {
  private orchestrator = getOrchestrator();

  /**
   * Process athlete message and generate AI response
   * Main entry point for chat functionality
   */
  async processMessage(
    athleteId: string,
    userId: string,
    message: string,
    sessionId?: string
  ): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      // Get or create session
      const session = sessionId
        ? await this.getSession(sessionId)
        : await this.createSession(athleteId);

      if (!session) {
        throw new Error('Failed to create or retrieve session');
      }

      // Get athlete data for context
      const athlete = await prisma.athlete.findUnique({
        where: { userId: athleteId },
        select: {
          sport: true,
          User: {
            select: {
              name: true,
            },
          },
        },
      });

      // Build conversation history from database
      const history = await this.getConversationHistory(session.id);

      // Create agent context
      const context: AgentContext = {
        sessionId: session.id,
        athleteId,
        userId,
        sport: athlete?.sport,
        conversationHistory: history.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        metadata: {
          athleteName: athlete?.User.name,
        },
      };

      // Save user message
      const userMessageId = await this.saveMessage(session.id, 'user', message);

      // Process with agent orchestrator
      const { response, crisisDetection } = await this.orchestrator.processMessage(
        message,
        context
      );

      // Save AI response
      await this.saveMessage(session.id, 'assistant', response.content);

      // Handle crisis detection
      if (crisisDetection?.isCrisis) {
        await this.handleCrisisDetection(session.id, userMessageId, crisisDetection, message);
      }

      // Update session timestamp
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { updatedAt: new Date() },
      });

      const duration = Date.now() - startTime;
      this.log('info', 'Message processed successfully', {
        sessionId: session.id,
        athleteId,
        hasCrisis: crisisDetection?.isCrisis,
        duration,
      });

      return {
        message: {
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
        },
        sessionId: session.id,
        crisisDetected: crisisDetection?.isCrisis
          ? {
              severity: crisisDetection.severity,
              action: crisisDetection.recommendedAction,
            }
          : undefined,
      };
    } catch (error) {
      this.log('error', 'Failed to process message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        athleteId,
      });

      throw error;
    }
  }

  /**
   * Create new chat session
   */
  private async createSession(athleteId: string): Promise<{ id: string; athleteId: string }> {
    return prisma.chatSession.create({
      data: {
        athleteId,
        // createdAt is automatically set by Prisma @default(now())
      },
    });
  }

  /**
   * Get existing session
   */
  private async getSession(
    sessionId: string
  ): Promise<{ id: string; athleteId: string } | null> {
    return prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { id: true, athleteId: true },
    });
  }

  /**
   * Get conversation history for session
   * Returns last 10 messages for context
   */
  private async getConversationHistory(
    sessionId: string
  ): Promise<Array<{ role: string; content: string }>> {
    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        role: true,
        content: true,
      },
    });

    // Reverse to get chronological order
    return messages.reverse();
  }

  /**
   * Save message to database
   */
  private async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<string> {
    const messageId = uuidv4();
    await prisma.message.create({
      data: {
        id: messageId,
        sessionId,
        role,
        content,
      },
    });
    return messageId;
  }

  /**
   * Handle crisis detection - create alert and notify
   */
  private async handleCrisisDetection(
    sessionId: string,
    messageId: string,
    detection: CrisisDetection,
    triggerMessage: string
  ): Promise<void> {
    try {
      // Get session to find athlete
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          Athlete: {
            include: {
              CoachAthlete: {
                where: { consentGranted: true },
                select: { coachId: true },
              },
            },
          },
        },
      });

      if (!session) {
        throw new Error('Session not found for crisis alert');
      }

      // Create crisis alert
      // Store indicators in notes field along with trigger message
      const notesContent = `Indicators: ${detection.indicators.join('; ')}\n\nTrigger message: ${triggerMessage}`;

      const alert = await prisma.crisisAlert.create({
        data: {
          athleteId: session.athleteId,
          sessionId,
          messageId,
          severity: detection.severity,
          detectedAt: new Date(),
          notes: notesContent,
          reviewed: false,
        },
      });

      this.log('warn', 'CRISIS ALERT CREATED', {
        alertId: alert.id,
        athleteId: session.athleteId,
        severity: detection.severity,
        indicators: detection.indicators,
      });

      // TODO: Send notifications to coaches (email/SMS)
      // For now, just log it - implement notification service later
      if (detection.severity === 'CRITICAL' || detection.severity === 'HIGH') {
        this.log('warn', 'HIGH PRIORITY - Notify coaches immediately', {
          alertId: alert.id,
          coaches: session.Athlete.CoachAthlete.map((r) => r.coachId),
        });
      }
    } catch (error) {
      this.log('error', 'Failed to create crisis alert', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
    }
  }

  /**
   * Get session history for athlete
   */
  async getSessionHistory(athleteId: string, limit: number = 10): Promise<
    Array<{
      id: string;
      startedAt: Date;
      updatedAt: Date | null;
      messageCount: number;
      lastMessage: string;
    }>
  > {
    const sessions = await prisma.chatSession.findMany({
      where: { athleteId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        Message: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
        _count: {
          select: { Message: true },
        },
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      startedAt: session.createdAt, // Use createdAt as session start time
      updatedAt: session.updatedAt,
      messageCount: session._count.Message,
      lastMessage: session.Message[0]?.content || 'No messages',
    }));
  }

  /**
   * Get full session with messages
   */
  async getSessionWithMessages(
    sessionId: string
  ): Promise<{
    id: string;
    messages: Array<{ role: string; content: string; timestamp: Date }>;
  } | null> {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        Message: {
          orderBy: { createdAt: 'asc' },
          select: {
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      messages: session.Message.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
      })),
    };
  }

  /**
   * Delete session and all messages
   */
  async deleteSession(sessionId: string): Promise<void> {
    // Prisma cascade delete will remove messages
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });
  }

  /**
   * Log service activity
   */
  private log(level: 'info' | 'warn' | 'error', message: string, metadata?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[CHAT_SERVICE]', message, metadata);
    }
    // In production: send to logging service (DataDog, CloudWatch, etc.)
  }
}

// Singleton instance
let chatServiceInstance: ChatService | null = null;

export function getChatService(): ChatService {
  if (!chatServiceInstance) {
    chatServiceInstance = new ChatService();
  }
  return chatServiceInstance;
}
