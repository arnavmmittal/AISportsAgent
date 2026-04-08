import { generateEmbedding, chunkDocument } from './embedding';
import { prisma } from '@/lib/prisma';
import type { KnowledgeCategory } from '@prisma/client';

interface IngestOptions {
  title: string;
  content: string;
  source: string;
  category: KnowledgeCategory;
  tags: string[];
  schoolId?: string | null;
}

/**
 * Ingest a document into the knowledge base.
 * Chunks the text, generates embeddings, and stores in the database.
 * Each chunk becomes a separate KnowledgeBase row with its embedding stored as Json.
 */
export async function ingestDocument(opts: IngestOptions): Promise<number> {
  const chunks = chunkDocument(opts.content);
  let count = 0;

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);
    const id = `${opts.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`;
    const tagsStr = opts.tags.join(',');

    await prisma.knowledgeBase.upsert({
      where: { id },
      create: {
        id,
        title: opts.title,
        content: chunks[i],
        source: opts.source,
        category: opts.category,
        tags: tagsStr,
        embedding: embedding as any,
        schoolId: opts.schoolId || null,
        updatedAt: new Date(),
      },
      update: {
        content: chunks[i],
        embedding: embedding as any,
        updatedAt: new Date(),
      },
    });
    count++;
  }
  return count;
}
