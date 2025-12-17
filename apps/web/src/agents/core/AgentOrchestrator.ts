/**
 * Agent Orchestrator
 * Routes requests to appropriate agents and coordinates responses
 */

import { AgentContext, AgentResponse, CrisisDetection } from './types';
import { AthleteAgent } from '../athlete/AthleteAgent';
import { GovernanceAgent } from '../governance/GovernanceAgent';
import { KnowledgeAgent } from '../knowledge/KnowledgeAgent';

export class AgentOrchestrator {
  private athleteAgent: AthleteAgent;
  private governanceAgent: GovernanceAgent;
  private knowledgeAgent: KnowledgeAgent;

  constructor() {
    // Initialize all agents
    this.athleteAgent = new AthleteAgent();
    this.governanceAgent = new GovernanceAgent();
    this.knowledgeAgent = new KnowledgeAgent();
  }

  /**
   * Main orchestration method
   * Coordinates all agents to generate a response
   */
  async processMessage(
    message: string,
    context: AgentContext
  ): Promise<{
    response: AgentResponse;
    crisisDetection?: CrisisDetection;
  }> {
    const startTime = Date.now();

    try {
      // Step 1: Crisis detection (always runs first for safety)
      const crisisCheck = await this.governanceAgent.detectCrisis(message, context);

      // If critical crisis, handle immediately
      if (crisisCheck.isCrisis && crisisCheck.severity === 'CRITICAL') {
        return {
          response: await this.athleteAgent.handleCrisis(crisisCheck, context),
          crisisDetection: crisisCheck,
        };
      }

      // Step 2: Retrieve relevant knowledge (RAG)
      const knowledgeContext = await this.knowledgeAgent.retrieve(message, context);

      // Step 3: Generate response with athlete agent
      const response = await this.athleteAgent.processWithContext(
        message,
        context,
        knowledgeContext
      );

      // Add crisis detection to metadata if present
      if (crisisCheck.isCrisis) {
        response.metadata = {
          ...response.metadata,
          crisisDetection: crisisCheck,
        };
      }

      const duration = Date.now() - startTime;
      this.log('info', `Orchestration completed in ${duration}ms`, {
        sessionId: context.sessionId,
        hasCrisis: crisisCheck.isCrisis,
        knowledgeDocsUsed: knowledgeContext.documents.length,
      });

      return {
        response,
        crisisDetection: crisisCheck.isCrisis ? crisisCheck : undefined,
      };
    } catch (error) {
      this.log('error', 'Orchestration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: context.sessionId,
      });

      // Fallback response
      return {
        response: {
          content:
            "I'm here to help, but I'm having a technical issue right now. Please try again in a moment, or if this is urgent, reach out to your coach directly.",
          metadata: {
            confidence: 0,
          },
        },
      };
    }
  }

  /**
   * Process message with streaming support
   * Returns crisis detection immediately, streams tokens via callback
   */
  async processMessageStream(
    message: string,
    context: AgentContext,
    onChunk: (chunk: string) => void
  ): Promise<{
    response: AgentResponse;
    crisisDetection?: CrisisDetection;
  }> {
    const startTime = Date.now();

    try {
      // Step 1: Crisis detection (always runs first for safety)
      const crisisCheck = await this.governanceAgent.detectCrisis(message, context);

      // If critical crisis, handle immediately (no streaming for crisis responses)
      if (crisisCheck.isCrisis && crisisCheck.severity === 'CRITICAL') {
        return {
          response: await this.athleteAgent.handleCrisis(crisisCheck, context),
          crisisDetection: crisisCheck,
        };
      }

      // Step 2: Retrieve relevant knowledge (RAG)
      const knowledgeContext = await this.knowledgeAgent.retrieve(message, context);

      // Step 3: Generate streaming response with athlete agent
      const response = await this.athleteAgent.processStream(
        message,
        context,
        onChunk
      );

      // Add crisis detection to metadata if present
      if (crisisCheck.isCrisis) {
        response.metadata = {
          ...response.metadata,
          crisisDetection: crisisCheck,
        };
      }

      const duration = Date.now() - startTime;
      this.log('info', `Streaming orchestration completed in ${duration}ms`, {
        sessionId: context.sessionId,
        hasCrisis: crisisCheck.isCrisis,
        knowledgeDocsUsed: knowledgeContext.documents.length,
      });

      return {
        response,
        crisisDetection: crisisCheck.isCrisis ? crisisCheck : undefined,
      };
    } catch (error) {
      this.log('error', 'Streaming orchestration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: context.sessionId,
      });

      // Fallback response
      return {
        response: {
          content:
            "I'm here to help, but I'm having a technical issue right now. Please try again in a moment, or if this is urgent, reach out to your coach directly.",
          metadata: {
            confidence: 0,
          },
        },
      };
    }
  }

  /**
   * Get athlete agent for direct access (e.g., for testing)
   */
  getAthleteAgent(): AthleteAgent {
    return this.athleteAgent;
  }

  /**
   * Get governance agent for direct access
   */
  getGovernanceAgent(): GovernanceAgent {
    return this.governanceAgent;
  }

  /**
   * Get knowledge agent for direct access
   */
  getKnowledgeAgent(): KnowledgeAgent {
    return this.knowledgeAgent;
  }

  /**
   * Log orchestrator activity
   */
  private log(level: 'info' | 'warn' | 'error', message: string, metadata?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ORCHESTRATOR]', message, metadata);
    }
  }
}

// Singleton instance for the application
let orchestratorInstance: AgentOrchestrator | null = null;

export function getOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}
