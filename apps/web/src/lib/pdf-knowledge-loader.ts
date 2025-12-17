/**
 * PDF Knowledge Base Loader
 * Loads pre-generated chunks from JSON instead of parsing PDF at runtime
 */

import fs from 'fs';
import path from 'path';

export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  pageNumber?: number;
  metadata?: {
    section?: string;
    topic?: string;
  };
}

/**
 * Load pre-generated PDF chunks from JSON
 * Note: PDF parsing at runtime doesn't work with Next.js webpack
 * To regenerate chunks, run: node scripts/generate-knowledge-chunks.js
 */
export async function loadPDFKnowledgeBase(): Promise<KnowledgeChunk[]> {
  const chunksPath = path.join(process.cwd(), 'knowledge_base', 'chunks.json');

  console.log('[PDF Loader] Loading pre-generated chunks from:', chunksPath);

  // Check if chunks.json exists
  if (!fs.existsSync(chunksPath)) {
    console.warn('[PDF Loader] chunks.json not found, using fallback');
    throw new Error('Pre-generated chunks not found. Run: node scripts/generate-knowledge-chunks.js');
  }

  try {
    const data = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
    console.log('[PDF Loader] Loaded knowledge base:', {
      source: data.source,
      pageCount: data.pageCount,
      chunkCount: data.chunkCount,
      generatedAt: data.generatedAt,
    });

    return data.chunks;
  } catch (error) {
    console.error('[PDF Loader] Failed to load chunks.json:', error);
    throw error;
  }
}

/**
 * Get a quick summary of the knowledge base
 */
export async function getPDFSummary(): Promise<{
  pageCount: number;
  characterCount: number;
  chunkCount: number;
}> {
  try {
    const chunksPath = path.join(process.cwd(), 'knowledge_base', 'chunks.json');

    if (!fs.existsSync(chunksPath)) {
      return { pageCount: 0, characterCount: 0, chunkCount: 0 };
    }

    const data = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));

    return {
      pageCount: data.pageCount || 0,
      characterCount: data.characterCount || 0,
      chunkCount: data.chunkCount || 0,
    };
  } catch (error) {
    console.error('[PDF Loader] Error getting PDF summary:', error);
    return { pageCount: 0, characterCount: 0, chunkCount: 0 };
  }
}
