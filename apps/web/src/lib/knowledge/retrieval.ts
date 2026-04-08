import { generateEmbedding, cosineSimilarity } from './embedding';
import { prisma, Prisma } from '@/lib/prisma';

export interface RetrievedChunk {
  content: string;
  source: string;
  title: string;
  category: string;
  similarity: number;
}

/**
 * Retrieve relevant knowledge base chunks using vector similarity search.
 * Queries both global knowledge (schoolId IS NULL) and team-specific knowledge.
 *
 * Since the schema stores embeddings as Json (not pgvector), we compute
 * cosine similarity in application code. This is fine for a few hundred
 * knowledge base entries; for thousands+, migrate to pgvector.
 */
export async function retrieveRelevantKnowledge(
  query: string,
  opts: { topK?: number; schoolId?: string | null } = {}
): Promise<RetrievedChunk[]> {
  const { topK = 5, schoolId = null } = opts;

  try {
    const queryEmbedding = await generateEmbedding(query);

    // Fetch all active entries that have embeddings
    const entries = await prisma.knowledgeBase.findMany({
      where: {
        isActive: true,
        NOT: { embedding: { equals: Prisma.DbNull } },
        OR: [
          { schoolId: null },
          ...(schoolId ? [{ schoolId }] : []),
        ],
      },
      select: {
        content: true,
        source: true,
        title: true,
        category: true,
        embedding: true,
      },
    });

    // Score each entry by cosine similarity
    const scored: RetrievedChunk[] = entries
      .map(entry => {
        const entryEmbedding = entry.embedding as number[];
        const similarity = cosineSimilarity(queryEmbedding, entryEmbedding);
        return {
          content: entry.content,
          source: entry.source,
          title: entry.title,
          category: entry.category,
          similarity,
        };
      })
      .filter(r => r.similarity > 0.25) // minimum relevance threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return scored;
  } catch (error) {
    console.error('[RAG] Knowledge retrieval failed:', error);
    return []; // Graceful degradation — chat works without RAG
  }
}
