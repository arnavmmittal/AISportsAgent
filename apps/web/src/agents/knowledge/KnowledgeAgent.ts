/**
 * Knowledge Agent
 * Retrieves relevant sports psychology knowledge using RAG
 */

import { BaseAgent } from '../core/BaseAgent';
import { AgentContext, AgentResponse, AgentConfig, KnowledgeContext } from '../core/types';

// Simplified knowledge base for MVP
// In production, this would query a vector database (Pinecone, Weaviate, etc.)
const KNOWLEDGE_BASE = {
  cbt: {
    content: `Cognitive Behavioral Therapy (CBT) for Athletes:

Key Principles:
- Thoughts influence emotions and behaviors
- Challenge negative automatic thoughts
- Replace with balanced, realistic thoughts

Common Cognitive Distortions in Sports:
1. All-or-Nothing Thinking: "If I don't win, I'm a failure"
2. Catastrophizing: "One bad game means my season is ruined"
3. Mind Reading: "Everyone thinks I'm terrible"
4. Should Statements: "I should always perform perfectly"

Techniques:
- Thought Record: Identify situation → automatic thought → emotion → evidence for/against → balanced thought
- Cognitive Restructuring: Challenge and reframe negative thoughts
- Behavioral Experiments: Test beliefs through action`,
    source: 'CBT for Sport Performance (Gardner & Moore, 2006)',
    keywords: ['anxiety', 'negative', 'thinking', 'worry', 'pressure', 'fear'],
  },

  mindfulness: {
    content: `Mindfulness for Athletic Performance:

Core Concepts:
- Present-moment awareness without judgment
- Acceptance of thoughts and feelings
- Focus on process, not outcome

Benefits for Athletes:
- Reduced performance anxiety
- Improved focus and concentration
- Better emotion regulation
- Enhanced recovery from mistakes

Practices:
1. Body Scan: Systematic attention to physical sensations
2. Breath Awareness: Focus on natural breathing pattern
3. Mindful Movement: Attention to movement sensations
4. Non-Judgmental Observation: Notice thoughts without reacting

Application:
- Pre-competition: Centering breath (4-7-8 technique)
- During competition: One-point focus on present action
- Post-competition: Non-judgmental reflection`,
    source: 'Mindful Sport Performance Enhancement (Kaufman et al., 2009)',
    keywords: ['focus', 'present', 'anxiety', 'distracted', 'mindfulness', 'meditation'],
  },

  flowState: {
    content: `Flow State - Optimal Performance Zone:

Characteristics of Flow:
- Complete absorption in activity
- Loss of self-consciousness
- Distorted sense of time
- Intrinsic motivation
- Balance between challenge and skill

Conditions for Flow:
1. Clear goals for performance
2. Immediate feedback on progress
3. Challenge matches skill level
4. Deep concentration on task
5. Sense of control

Building Flow:
- Pre-performance routines (consistency)
- Process-focused goals (not outcome)
- Optimal arousal level (not too high/low)
- Remove distractions
- Trust training and preparation

Common Flow Blockers:
- Overthinking technique
- Focusing on results/winning
- Fear of failure
- External distractions`,
    source: 'Flow in Sports (Csikszentmihalyi, 1990)',
    keywords: ['performance', 'zone', 'confidence', 'flow', 'peak'],
  },

  goalSetting: {
    content: `Effective Goal Setting for Athletes:

SMART Goals Framework:
- Specific: Clear, concrete targets
- Measurable: Quantifiable progress
- Achievable: Realistic within abilities
- Relevant: Aligned with values
- Time-bound: Clear deadline

Types of Goals:
1. Outcome Goals: Final results (win championship)
2. Performance Goals: Personal standards (improve time)
3. Process Goals: Techniques/strategies (execute game plan)

Focus Hierarchy:
- Process goals (most control) → 70% focus
- Performance goals (moderate control) → 25% focus
- Outcome goals (least control) → 5% focus

Goal Implementation:
- Break long-term into short-term milestones
- Daily/weekly action steps
- Regular progress reviews
- Adjust based on feedback
- Celebrate small wins`,
    source: 'Goal Setting in Sport (Weinberg & Gould, 2019)',
    keywords: ['goals', 'motivation', 'improvement', 'progress', 'achievement'],
  },
};

export class KnowledgeAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      model: '', // Not used for knowledge retrieval
      temperature: 0,
      maxTokens: 0,
      systemPrompt: '',
    };

    super('knowledge', config);
  }

  /**
   * Main processing method - not used for knowledge agent
   */
  async process(message: string, context: AgentContext): Promise<AgentResponse> {
    // Knowledge agent doesn't generate responses, only retrieves context
    return {
      content: '',
      metadata: {},
    };
  }

  /**
   * Retrieve relevant knowledge based on message content
   */
  async retrieve(message: string, context: AgentContext): Promise<KnowledgeContext> {
    try {
      const relevantDocs = this.searchKnowledge(message);

      this.log('info', 'Knowledge retrieved', {
        sessionId: context.sessionId,
        docsFound: relevantDocs.length,
      });

      return {
        documents: relevantDocs,
        summary: this.summarizeDocuments(relevantDocs),
      };
    } catch (error) {
      this.log('error', 'Knowledge retrieval failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: context.sessionId,
      });

      // Return empty context on failure
      return {
        documents: [],
      };
    }
  }

  /**
   * Search knowledge base for relevant content
   * In production, this would use vector similarity search
   */
  private searchKnowledge(query: string): Array<{
    content: string;
    source: string;
    relevanceScore: number;
  }> {
    const queryLower = query.toLowerCase();
    const results: Array<{
      content: string;
      source: string;
      relevanceScore: number;
    }> = [];

    // Simple keyword matching for MVP
    // In production, use vector embeddings and cosine similarity
    Object.values(KNOWLEDGE_BASE).forEach((doc) => {
      const matchCount = doc.keywords.filter((keyword) =>
        queryLower.includes(keyword)
      ).length;

      if (matchCount > 0) {
        const relevanceScore = matchCount / doc.keywords.length;
        results.push({
          content: doc.content,
          source: doc.source,
          relevanceScore,
        });
      }
    });

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return top 2 most relevant documents
    return results.slice(0, 2);
  }

  /**
   * Summarize retrieved documents
   */
  private summarizeDocuments(
    docs: Array<{ content: string; source: string; relevanceScore: number }>
  ): string {
    if (docs.length === 0) {
      return 'No specific frameworks found, using general sports psychology principles.';
    }

    return `Found ${docs.length} relevant framework(s): ${docs
      .map((d) => d.source)
      .join(', ')}`;
  }

  /**
   * Fallback response (not used for knowledge agent)
   */
  protected getFallbackResponse(): string {
    return '';
  }
}
