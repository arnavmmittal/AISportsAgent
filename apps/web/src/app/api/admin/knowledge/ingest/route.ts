/**
 * Admin API: Ingest Knowledge Base Content
 *
 * Allows admins to add new knowledge base entries dynamically.
 * Use cases:
 * - Add new research papers
 * - Add school-specific mental health resources
 * - Update existing knowledge base content
 *
 * POST /api/admin/knowledge/ingest
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Input validation schema
const ingestSchema = z.object({
  title: z.string().min(10).max(500),
  content: z.string().min(50).max(10000),
  source: z.string().min(1).max(500),
  sourceUrl: z.string().url().optional(),
  category: z.enum([
    'GENERAL',
    'CBT',
    'MINDFULNESS',
    'FLOW_STATE',
    'MOTIVATION',
    'ANXIETY_MANAGEMENT',
    'CONFIDENCE',
    'TEAM_DYNAMICS',
    'INJURY_RECOVERY',
  ]),
  tags: z.array(z.string()).max(10).optional(),
  schoolId: z.string().optional(), // If null, global knowledge
  isActive: z.boolean().default(true),
});

/**
 * Generate embedding for knowledge content
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Max 8K tokens
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('[Knowledge Ingest] Failed to generate embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify auth (admin only)
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    const fullUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { role: true },
    });

    if (fullUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = ingestSchema.parse(body);

    console.log('[Knowledge Ingest] Ingesting new knowledge:', {
      title: validated.title,
      category: validated.category,
      source: validated.source,
      schoolId: validated.schoolId || 'global',
    });

    // Generate embedding
    const embedding = await generateEmbedding(validated.content);

    // Create knowledge base entry
    const knowledge = await prisma.knowledgeBase.create({
      data: {
        id: `kb_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        title: validated.title,
        content: validated.content,
        source: validated.source,
        sourceUrl: validated.sourceUrl || null,
        embedding,
        category: validated.category,
        tags: validated.tags?.join(', ') || '',
        isActive: validated.isActive,
        updatedAt: new Date(),
        schoolId: validated.schoolId || null,
      },
    });

    // Audit log
    console.log('[Knowledge Ingest] Successfully created:', knowledge.id);

    return NextResponse.json(
      {
        success: true,
        knowledge: {
          id: knowledge.id,
          title: knowledge.title,
          category: knowledge.category,
          source: knowledge.source,
        },
        message: 'Knowledge ingested successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('[Knowledge Ingest] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to ingest knowledge',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/knowledge/ingest - Get ingestion stats
 */
export async function GET(request: NextRequest) {
  try {
    // Verify auth (admin only)
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    const fullUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { role: true, schoolId: true },
    });

    if (fullUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get stats
    const total = await prisma.knowledgeBase.count();
    const byCategory = await prisma.knowledgeBase.groupBy({
      by: ['category'],
      _count: true,
    });

    const globalCount = await prisma.knowledgeBase.count({
      where: { schoolId: null },
    });

    const schoolCount = await prisma.knowledgeBase.count({
      where: { schoolId: { not: null } },
    });

    return NextResponse.json({
      stats: {
        total,
        global: globalCount,
        schoolSpecific: schoolCount,
        byCategory: byCategory.map((cat) => ({
          category: cat.category,
          count: cat._count,
        })),
      },
    });
  } catch (error) {
    console.error('[Knowledge Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
