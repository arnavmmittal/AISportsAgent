/**
 * Debug endpoint to check environment variables
 * TEMPORARY - Remove before production
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 15) + '...',
    anthropicModel: process.env.ANTHROPIC_MODEL,
    hasOpenaiKey: !!process.env.OPENAI_API_KEY,
    openaiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 15) + '...',
    openaiModel: process.env.OPENAI_MODEL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    nextPublicEnv: process.env.NEXT_PUBLIC_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}
