/**
 * Knowledge Agent - PRODUCTION-READY
 * Vector-based RAG system with OpenAI embeddings
 * Uses custom PDF knowledge base: "AI Sports Psych Project.pdf"
 * Semantic search with cosine similarity
 */

import { BaseAgent } from '../core/BaseAgent';
import { AgentContext, AgentResponse, AgentConfig, KnowledgeContext } from '../core/types';
import OpenAI from 'openai';
import { loadPDFKnowledgeBase, type KnowledgeChunk } from '@/lib/pdf-knowledge-loader';

// Fallback knowledge base if PDF fails to load
// In production, the custom PDF is the primary knowledge source
const FALLBACK_KNOWLEDGE_BASE = {
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

// Type for cached embeddings
interface EmbeddingCache {
  [key: string]: {
    embedding: number[];
    content: string;
    source: string;
    metadata?: {
      section?: string;
      topic?: string;
    };
  };
}

export class KnowledgeAgent extends BaseAgent {
  private client: OpenAI;
  private embeddingCache: EmbeddingCache | null = null;
  private useVectorSearch: boolean;
  private pdfChunks: KnowledgeChunk[] = [];
  private usePDFKnowledgeBase: boolean;

  constructor() {
    const config: AgentConfig = {
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      temperature: 0,
      maxTokens: 0,
      systemPrompt: '',
    };

    super('knowledge', config);

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // Configuration flags
    this.useVectorSearch = process.env.ENABLE_VECTOR_SEARCH !== 'false';
    this.usePDFKnowledgeBase = process.env.USE_PDF_KNOWLEDGE_BASE !== 'false';

    this.log('info', 'KnowledgeAgent initialized', {
      vectorSearch: this.useVectorSearch,
      pdfKnowledgeBase: this.usePDFKnowledgeBase,
    });
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
   * Uses vector similarity search with fallback to keyword matching
   */
  async retrieve(message: string, context: AgentContext): Promise<KnowledgeContext> {
    const startTime = Date.now();

    try {
      let relevantDocs: Array<{
        content: string;
        source: string;
        relevanceScore: number;
      }>;

      // Use vector search if enabled, otherwise fall back to keyword matching
      if (this.useVectorSearch) {
        relevantDocs = await this.vectorSearch(message);
      } else {
        relevantDocs = this.keywordSearch(message);
      }

      const duration = Date.now() - startTime;

      this.log('info', 'Knowledge retrieved', {
        sessionId: context.sessionId,
        docsFound: relevantDocs.length,
        method: this.useVectorSearch ? 'vector' : 'keyword',
        duration,
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

      // Fallback to keyword search if vector search fails
      if (this.useVectorSearch) {
        this.log('warn', 'Vector search failed, falling back to keyword search', {
          sessionId: context.sessionId,
        });
        const fallbackDocs = this.keywordSearch(message);
        return {
          documents: fallbackDocs,
          summary: this.summarizeDocuments(fallbackDocs),
        };
      }

      // Return empty context on complete failure
      return {
        documents: [],
      };
    }
  }

  /**
   * PRODUCTION: Vector-based semantic search
   * Uses OpenAI embeddings and cosine similarity
   */
  private async vectorSearch(query: string): Promise<
    Array<{
      content: string;
      source: string;
      relevanceScore: number;
    }>
  > {
    // Lazy load embeddings on first use
    if (!this.embeddingCache) {
      await this.initializeEmbeddings();
    }

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Calculate cosine similarity with all documents
    const results: Array<{
      content: string;
      source: string;
      relevanceScore: number;
    }> = [];

    for (const [key, cached] of Object.entries(this.embeddingCache!)) {
      const similarity = this.cosineSimilarity(queryEmbedding, cached.embedding);
      results.push({
        content: cached.content,
        source: cached.source,
        relevanceScore: similarity,
      });
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return top 2 most relevant (threshold: 0.7 similarity)
    return results.filter((r) => r.relevanceScore > 0.7).slice(0, 2);
  }

  /**
   * Fallback: Keyword-based search
   * Used when vector search is disabled or fails
   */
  private keywordSearch(query: string): Array<{
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

    // Simple keyword matching (fallback only)
    Object.values(FALLBACK_KNOWLEDGE_BASE).forEach((doc) => {
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
   * Initialize embeddings for knowledge base (lazy loading)
   * Loads from custom PDF or falls back to built-in knowledge
   */
  private async initializeEmbeddings(): Promise<void> {
    this.log('info', 'Initializing knowledge base embeddings', {
      source: this.usePDFKnowledgeBase ? 'PDF' : 'Built-in',
    });

    const cache: EmbeddingCache = {};

    try {
      if (this.usePDFKnowledgeBase) {
        // Load from custom PDF
        this.pdfChunks = await loadPDFKnowledgeBase();

        this.log('info', `Loaded ${this.pdfChunks.length} chunks from PDF`, {});

        // Generate embeddings for PDF chunks
        for (const chunk of this.pdfChunks) {
          try {
            const embedding = await this.generateEmbedding(chunk.content);
            cache[chunk.id] = {
              embedding,
              content: chunk.content,
              source: chunk.source,
              metadata: chunk.metadata,
            };
          } catch (error) {
            this.log('warn', `Failed to generate embedding for chunk ${chunk.id}`, {
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        this.log('info', `✅ Custom PDF knowledge base loaded: ${Object.keys(cache).length} chunks`, {});
      } else {
        // Fallback to built-in knowledge base
        for (const [key, doc] of Object.entries(FALLBACK_KNOWLEDGE_BASE)) {
          try {
            const embedding = await this.generateEmbedding(doc.content);
            cache[key] = {
              embedding,
              content: doc.content,
              source: doc.source,
            };
          } catch (error) {
            this.log('warn', `Failed to generate embedding for ${key}`, {
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        this.log('info', `Embeddings initialized for ${Object.keys(cache).length} built-in documents`, {});
      }
    } catch (error) {
      this.log('error', 'Failed to load PDF knowledge base, falling back to built-in', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to built-in knowledge base
      for (const [key, doc] of Object.entries(FALLBACK_KNOWLEDGE_BASE)) {
        try {
          const embedding = await this.generateEmbedding(doc.content);
          cache[key] = {
            embedding,
            content: doc.content,
            source: doc.source,
          };
        } catch (error) {
          this.log('warn', `Failed to generate embedding for ${key}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    this.embeddingCache = cache;
    this.log('info', `✅ Knowledge base ready: ${Object.keys(cache).length} documents embedded`, {});
  }

  /**
   * Generate OpenAI embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.config.model, // text-embedding-3-small
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   * Returns value between -1 and 1 (higher = more similar)
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
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
