import { NextResponse } from 'next/server';

export async function GET() {
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
