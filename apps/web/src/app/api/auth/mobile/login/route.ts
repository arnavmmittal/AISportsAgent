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
import { logLoginAttempt } from '@/lib/audit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Create Supabase client inside function to ensure env vars are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const jwtSecret = process.env.NEXTAUTH_SECRET;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const JWT_SECRET = new TextEncoder().encode(
    jwtSecret || 'your-secret-key-change-in-production'
  );

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    try {
      // Authenticate with Supabase Auth (same as web app)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        // Audit log: Failed login attempt
        await logLoginAttempt(
          email,
          false,
          {
            headers: {
              'x-forwarded-for': request.headers.get('x-forwarded-for') || undefined,
              'user-agent': request.headers.get('user-agent') || undefined,
            },
          },
          authError?.message || 'Authentication failed'
        ).catch(err => console.error('[Audit] Failed to log login attempt:', err));

        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Get user details from our database
      const user = await prisma.user.findUnique({
        where: { id: authData.user.id },
        include: {
          School: true,
          Athlete: true,
          Coach: true,
        },
      });

      if (!user) {
        // User exists in Supabase Auth but not in our User table
        await logLoginAttempt(
          email,
          false,
          {
            headers: {
              'x-forwarded-for': request.headers.get('x-forwarded-for') || undefined,
              'user-agent': request.headers.get('user-agent') || undefined,
            },
          },
          'User profile not found'
        ).catch(err => console.error('[Audit] Failed to log login attempt:', err));

        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 401 }
        );
      }

      // Generate JWT token for mobile app
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

      // Audit log: Successful login
      await logLoginAttempt(
        user.id,
        true,
        {
          headers: {
            'x-forwarded-for': request.headers.get('x-forwarded-for') || undefined,
            'user-agent': request.headers.get('user-agent') || undefined,
          },
        }
      ).catch(err => console.error('[Audit] Failed to log login success:', err));

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
        // Also include Supabase session for clients that prefer it
        supabaseSession: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          expires_at: authData.session?.expires_at,
        },
      });
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
