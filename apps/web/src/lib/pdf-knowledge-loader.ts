/**
 * PDF Knowledge Base Loader
 * Parses custom sports psychology PDF and chunks content for embeddings
 */

import fs from 'fs';
import path from 'path';

// Dynamic import to avoid Next.js bundling issues
let pdfParse: any = null;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('[PDF Loader] pdf-parse not available, using fallback');
}

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
 * Load and parse the custom PDF knowledge base
 * Returns chunks of text suitable for embedding
 */
export async function loadPDFKnowledgeBase(): Promise<KnowledgeChunk[]> {
  const pdfPath = path.join(process.cwd(), 'knowledge_base', 'AI Sports Psych Project.pdf');

  console.log('[PDF Loader] Loading PDF from:', pdfPath);

  // Check if pdf-parse is available
  if (!pdfParse) {
    throw new Error('pdf-parse library not available');
  }

  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    console.error('[PDF Loader] PDF not found at:', pdfPath);
    throw new Error(`PDF not found at ${pdfPath}`);
  }

  // Read PDF file
  const dataBuffer = fs.readFileSync(pdfPath);

  // Parse PDF - pdfParse is the default export
  const data = await pdfParse(dataBuffer);

  console.log('[PDF Loader] PDF parsed successfully');
  console.log('[PDF Loader] Pages:', data.numpages);
  console.log('[PDF Loader] Text length:', data.text.length);

  // Chunk the content
  const chunks = chunkPDFContent(data.text, data.numpages);

  console.log('[PDF Loader] Created', chunks.length, 'knowledge chunks');

  return chunks;
}

/**
 * Chunk PDF content into manageable pieces
 * Each chunk is ~500-1000 tokens (roughly 2000-4000 characters)
 */
function chunkPDFContent(text: string, numPages: number): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  // Split by double newlines to preserve paragraph structure
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 50);

  const CHUNK_SIZE = 3000; // characters
  const OVERLAP = 200; // overlap between chunks for context

  let currentChunk = '';
  let currentChunkId = 0;

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, save current chunk
    if (currentChunk.length + paragraph.length > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push({
        id: `pdf-chunk-${currentChunkId}`,
        content: currentChunk.trim(),
        source: 'AI Sports Psych Project.pdf',
        metadata: {
          section: detectSection(currentChunk),
          topic: detectTopic(currentChunk),
        },
      });

      // Start new chunk with overlap from previous chunk
      const overlapText = currentChunk.slice(-OVERLAP);
      currentChunk = overlapText + '\n\n' + paragraph;
      currentChunkId++;
    } else {
      // Add paragraph to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `pdf-chunk-${currentChunkId}`,
      content: currentChunk.trim(),
      source: 'AI Sports Psych Project.pdf',
      metadata: {
        section: detectSection(currentChunk),
        topic: detectTopic(currentChunk),
      },
    });
  }

  return chunks;
}

/**
 * Detect section from content (e.g., Introduction, Methods, Results)
 */
function detectSection(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('introduction') || lowerText.includes('background')) {
    return 'Introduction';
  }
  if (lowerText.includes('method') || lowerText.includes('approach')) {
    return 'Methods';
  }
  if (lowerText.includes('result') || lowerText.includes('finding')) {
    return 'Results';
  }
  if (lowerText.includes('discussion') || lowerText.includes('conclusion')) {
    return 'Discussion';
  }
  if (lowerText.includes('intervention') || lowerText.includes('technique')) {
    return 'Interventions';
  }

  return 'General';
}

/**
 * Detect main topic from content
 */
function detectTopic(text: string): string {
  const lowerText = text.toLowerCase();

  // Sports psychology topics
  if (lowerText.includes('anxiety') || lowerText.includes('stress')) {
    return 'Anxiety & Stress';
  }
  if (lowerText.includes('confidence') || lowerText.includes('self-efficacy')) {
    return 'Confidence';
  }
  if (lowerText.includes('motivation') || lowerText.includes('goal')) {
    return 'Motivation';
  }
  if (lowerText.includes('mindfulness') || lowerText.includes('meditation')) {
    return 'Mindfulness';
  }
  if (lowerText.includes('cbt') || lowerText.includes('cognitive behavioral')) {
    return 'CBT';
  }
  if (lowerText.includes('flow') || lowerText.includes('zone')) {
    return 'Flow State';
  }
  if (lowerText.includes('recovery') || lowerText.includes('burnout')) {
    return 'Recovery';
  }
  if (lowerText.includes('team') || lowerText.includes('communication')) {
    return 'Team Dynamics';
  }

  return 'General Sports Psychology';
}

/**
 * Get a quick summary of the PDF for logging
 */
export async function getPDFSummary(): Promise<{
  pageCount: number;
  characterCount: number;
  chunkCount: number;
}> {
  try {
    const chunks = await loadPDFKnowledgeBase();
    const pdfPath = path.join(process.cwd(), 'knowledge_base', 'AI Sports Psych Project.pdf');
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);

    return {
      pageCount: data.numpages,
      characterCount: data.text.length,
      chunkCount: chunks.length,
    };
  } catch (error) {
    console.error('[PDF Loader] Error getting PDF summary:', error);
    throw error;
  }
}
