/**
 * Mobile app login endpoint
 * Returns JWT token for stateless authentication
 *
 * Uses Supabase Auth for authentication (same as web app)
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const jwtSecret = process.env.NEXTAUTH_SECRET;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Mobile Login] Missing Supabase env vars');
      return NextResponse.json(
        { error: 'Server configuration error', code: 'MISSING_CONFIG' },
        { status: 500 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'INVALID_BODY' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required', code: 'MISSING_CREDENTIALS' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.log('[Mobile Login] Auth failed for', email, ':', authError.message);
      return NextResponse.json(
        { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Authentication failed', code: 'NO_USER' },
        { status: 401 }
      );
    }

    // Get user details from our database
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: authData.user.id },
        include: {
          School: true,
          Athlete: true,
          Coach: true,
        },
      });
    } catch (dbError) {
      console.error('[Mobile Login] Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    if (!user) {
      console.log('[Mobile Login] User not in DB:', authData.user.id);
      return NextResponse.json(
        { error: 'User profile not found', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    // Generate JWT token for mobile app
    const JWT_SECRET = new TextEncoder().encode(
      jwtSecret || 'default-secret-change-in-production'
    );

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(JWT_SECRET);

    console.log('[Mobile Login] Success for', email);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        athlete: user.Athlete,
        coach: user.Coach,
      },
      token,
      supabaseSession: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at,
      },
    });
  } catch (error) {
    console.error('[Mobile Login] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
