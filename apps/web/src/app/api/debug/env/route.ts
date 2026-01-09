import { NextResponse } from 'next/server';

export async function GET() {
  // Check which environment variables are set (without exposing the actual values)
  return NextResponse.json({
    MCP_SERVER_URL: process.env.MCP_SERVER_URL ? `Set (${process.env.MCP_SERVER_URL.substring(0, 30)}...)` : 'NOT SET',
    USE_MCP_SERVER: process.env.USE_MCP_SERVER || 'NOT SET',
    MCP_SERVICE_TOKEN: process.env.MCP_SERVICE_TOKEN ? 'Set (hidden)' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL || 'NOT SET',
    VERCEL_ENV: process.env.VERCEL_ENV || 'NOT SET',
  });
}
