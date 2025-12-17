/**
 * Base Agent Class
 * All specialized agents (Athlete, Governance, Knowledge) extend this
 */

import {
  AgentContext,
  AgentResponse,
  AgentConfig,
  AgentMetrics,
  AgentRole,
  AgentMessage,
} from './types';

export abstract class BaseAgent {
  protected role: AgentRole;
  protected config: AgentConfig;

  constructor(role: AgentRole, config: AgentConfig) {
    this.role = role;
    this.config = config;
  }

  /**
   * Main entry point for agent processing
   * Must be implemented by each specific agent
   */
  abstract process(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse>;

  /**
   * Get the system prompt for this agent
   */
  protected getSystemPrompt(): string {
    return this.config.systemPrompt;
  }

  /**
   * Format conversation history for AI model
   */
  protected formatHistory(history: AgentMessage[]): AgentMessage[] {
    // Keep last 10 messages to stay within context limits
    const recentHistory = history.slice(-10);

    return [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
      ...recentHistory,
    ];
  }

  /**
   * Calculate metrics for monitoring
   */
  protected createMetrics(startTime: number, tokensUsed: number): AgentMetrics {
    return {
      responseTime: Date.now() - startTime,
      tokensUsed,
    };
  }

  /**
   * Log agent activity (useful for debugging and monitoring)
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, metadata?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent: this.role,
      level,
      message,
      ...metadata,
    };

    // In production, send to logging service (DataDog, CloudWatch, etc.)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.role.toUpperCase()}]`, message, metadata);
    }
  }

  /**
   * Handle errors gracefully
   */
  protected handleError(error: Error, context: AgentContext): AgentResponse {
    this.log('error', `Agent error: ${error.message}`, {
      sessionId: context.sessionId,
      error: error.stack,
    });

    return {
      content: this.getFallbackResponse(),
      metadata: {
        confidence: 0,
      },
    };
  }

  /**
   * Get fallback response when agent fails
   */
  protected abstract getFallbackResponse(): string;

  /**
   * Validate context before processing
   */
  protected validateContext(context: AgentContext): boolean {
    if (!context.sessionId || !context.userId) {
      this.log('warn', 'Invalid context provided', { context });
      return false;
    }
    return true;
  }
}
