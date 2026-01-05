/**
 * Knowledge Base Ingestion Script
 *
 * Ingests PDF chunks into database with embeddings for RAG retrieval.
 * Can be run:
 * 1. Once during initial setup (ingest existing PDF)
 * 2. On-demand when adding new PDFs
 * 3. Via API endpoint for dynamic content addition
 *
 * Usage:
 *   pnpm tsx scripts/ingest-knowledge-base.ts
 *   pnpm tsx scripts/ingest-knowledge-base.ts --school-id <id>
 *   pnpm tsx scripts/ingest-knowledge-base.ts --update-embeddings
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface ChunkData {
  id: string;
  content: string;
  source: string;
  pageNumber?: number;
  metadata?: {
    section?: string;
    topic?: string;
  };
}

interface ChunksFile {
  source: string;
  pageCount: number;
  chunkCount: number;
  characterCount: number;
  generatedAt: string;
  chunks: ChunkData[];
}

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Max 8K tokens
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return [];
  }
}

/**
 * Categorize knowledge based on content
 */
function categorizeContent(content: string, metadata?: { section?: string; topic?: string }): string {
  const lowerContent = content.toLowerCase();
  const section = metadata?.section?.toLowerCase() || '';
  const topic = metadata?.topic?.toLowerCase() || '';

  // Check for specific keywords
  if (
    lowerContent.includes('breathing') ||
    lowerContent.includes('meditation') ||
    lowerContent.includes('mindfulness') ||
    topic.includes('mindfulness')
  ) {
    return 'MINDFULNESS';
  }

  if (
    lowerContent.includes('cognitive') ||
    lowerContent.includes('thought') ||
    lowerContent.includes('belief') ||
    topic.includes('cbt')
  ) {
    return 'CBT';
  }

  if (
    lowerContent.includes('flow') ||
    lowerContent.includes('zone') ||
    lowerContent.includes('optimal') ||
    topic.includes('flow')
  ) {
    return 'FLOW_STATE';
  }

  if (
    lowerContent.includes('motivation') ||
    lowerContent.includes('goal') ||
    topic.includes('motivation')
  ) {
    return 'MOTIVATION';
  }

  if (
    lowerContent.includes('anxiety') ||
    lowerContent.includes('stress') ||
    lowerContent.includes('nervous') ||
    topic.includes('anxiety')
  ) {
    return 'ANXIETY_MANAGEMENT';
  }

  if (
    lowerContent.includes('confidence') ||
    lowerContent.includes('self-efficacy') ||
    topic.includes('confidence')
  ) {
    return 'CONFIDENCE';
  }

  if (
    lowerContent.includes('team') ||
    lowerContent.includes('communication') ||
    topic.includes('team')
  ) {
    return 'TEAM_DYNAMICS';
  }

  if (
    lowerContent.includes('injury') ||
    lowerContent.includes('recovery') ||
    topic.includes('injury')
  ) {
    return 'INJURY_RECOVERY';
  }

  // Default to general
  return 'GENERAL';
}

/**
 * Extract tags from content
 */
function extractTags(content: string, metadata?: { section?: string; topic?: string }): string[] {
  const tags: Set<string> = new Set();

  // Add metadata tags
  if (metadata?.section) tags.add(metadata.section.toLowerCase());
  if (metadata?.topic) tags.add(metadata.topic.toLowerCase());

  // Extract common keywords
  const keywords = [
    'breathing',
    'meditation',
    'visualization',
    'cbt',
    'mindfulness',
    'flow',
    'anxiety',
    'stress',
    'confidence',
    'motivation',
    'goal-setting',
    'team',
    'communication',
    'injury',
    'recovery',
    'performance',
    'mental-training',
  ];

  const lowerContent = content.toLowerCase();
  keywords.forEach((keyword) => {
    if (lowerContent.includes(keyword)) {
      tags.add(keyword);
    }
  });

  return Array.from(tags).slice(0, 10); // Max 10 tags
}

/**
 * Ingest chunks from JSON file into database
 */
async function ingestChunks(schoolId?: string, updateEmbeddings = false) {
  console.log('📚 Starting Knowledge Base Ingestion...\n');

  // Load chunks from JSON
  const chunksPath = path.join(process.cwd(), 'knowledge_base', 'chunks.json');

  if (!fs.existsSync(chunksPath)) {
    throw new Error('chunks.json not found. Run: node scripts/generate-knowledge-chunks.js');
  }

  const chunksData: ChunksFile = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));

  console.log('📖 Loaded PDF chunks:');
  console.log(`  Source: ${chunksData.source}`);
  console.log(`  Pages: ${chunksData.pageCount}`);
  console.log(`  Chunks: ${chunksData.chunkCount}`);
  console.log(`  Characters: ${chunksData.characterCount.toLocaleString()}`);
  console.log(`  Generated: ${chunksData.generatedAt}\n`);

  // Check if already ingested
  const existingCount = await prisma.knowledgeBase.count({
    where: { source: chunksData.source },
  });

  if (existingCount > 0 && !updateEmbeddings) {
    console.log(`⚠️  ${existingCount} chunks already ingested from ${chunksData.source}`);
    console.log('   Use --update-embeddings to regenerate embeddings\n');
    return;
  }

  if (updateEmbeddings) {
    console.log('🔄 Updating embeddings for existing chunks...\n');
  }

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const chunk of chunksData.chunks) {
    try {
      // Check if chunk already exists
      const existing = await prisma.knowledgeBase.findUnique({
        where: { id: chunk.id },
      });

      if (existing && !updateEmbeddings) {
        skippedCount++;
        continue;
      }

      // Generate embedding
      console.log(`Generating embedding for chunk ${chunk.id}...`);
      const embedding = await generateEmbedding(chunk.content);

      // Categorize and tag
      const category = categorizeContent(chunk.content, chunk.metadata) as any;
      const tags = extractTags(chunk.content, chunk.metadata);

      // Create title from first 100 chars
      const title = chunk.content.substring(0, 100).trim() + '...';

      if (existing && updateEmbeddings) {
        // Update existing chunk
        await prisma.knowledgeBase.update({
          where: { id: chunk.id },
          data: {
            embedding,
            category,
            tags: tags.join(', '),
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new chunk
        await prisma.knowledgeBase.create({
          data: {
            id: chunk.id,
            title,
            content: chunk.content,
            source: chunk.source,
            sourceUrl: `page-${chunk.pageNumber || 'unknown'}`,
            embedding,
            category,
            tags: tags.join(', '),
            isActive: true,
            updatedAt: new Date(),
            schoolId: schoolId || null, // Global knowledge if no schoolId
          },
        });
      }

      processedCount++;

      if (processedCount % 10 === 0) {
        console.log(`  Progress: ${processedCount}/${chunksData.chunkCount}`);
      }

      // Rate limit to avoid OpenAI quota (3000 req/min)
      await new Promise((resolve) => setTimeout(resolve, 20)); // 50 req/sec = 3000/min
    } catch (error) {
      console.error(`❌ Failed to process chunk ${chunk.id}:`, error);
      errorCount++;
    }
  }

  console.log('\n✅ Ingestion Complete!');
  console.log(`  Processed: ${processedCount}`);
  console.log(`  Skipped: ${skippedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Total in DB: ${await prisma.knowledgeBase.count()}\n`);
}

/**
 * List ingested knowledge base stats
 */
async function listStats() {
  console.log('📊 Knowledge Base Statistics\n');

  const total = await prisma.knowledgeBase.count();
  const byCategory = await prisma.knowledgeBase.groupBy({
    by: ['category'],
    _count: true,
  });

  const bySources = await prisma.knowledgeBase.groupBy({
    by: ['source'],
    _count: true,
  });

  console.log(`Total Chunks: ${total}\n`);

  console.log('By Category:');
  byCategory.forEach((cat) => {
    console.log(`  ${cat.category}: ${cat._count}`);
  });

  console.log('\nBy Source:');
  bySources.forEach((src) => {
    console.log(`  ${src.source}: ${src._count}`);
  });

  console.log();
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  try {
    if (command === 'stats' || command === '--stats') {
      await listStats();
    } else {
      const schoolIdArg = args.find((arg) => arg.startsWith('--school-id='));
      const schoolId = schoolIdArg?.split('=')[1];
      const updateEmbeddings = args.includes('--update-embeddings');

      await ingestChunks(schoolId, updateEmbeddings);

      // Show stats after ingestion
      await listStats();
    }
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
