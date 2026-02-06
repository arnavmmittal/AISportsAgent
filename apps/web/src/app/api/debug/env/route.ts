import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Block in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ROUTES !== 'true') {
    return NextResponse.json({ error: 'Debug routes disabled in production' }, { status: 404 });
  }

  // Require admin authentication
  const { authorized, response } = await requireAdmin(request);
  if (!authorized) return response!;

  // Check which environment variables are set (without exposing the actual values)
  return NextResponse.json({
    // Core
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL || 'NOT SET',
    VERCEL_ENV: process.env.VERCEL_ENV || 'NOT SET',
    // AI Services
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set (hidden)' : 'NOT SET',
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ? 'Set (hidden)' : 'NOT SET',
    // Database
    DATABASE_URL: process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET',
    // Auth
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set (hidden)' : 'NOT SET',
  });
}
