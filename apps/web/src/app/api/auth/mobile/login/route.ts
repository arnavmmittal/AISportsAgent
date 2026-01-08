/**

 * Mobile app login endpoint
 * Returns JWT token for stateless authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';
import { logLoginAttempt } from '@/lib/audit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// JWT secret (same as NEXTAUTH_SECRET)
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Database authentication for real users
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          School: true,
          Athlete: true,
          Coach: true,
        },
      });

      if (!user || !user.password) {
        // Audit log: Failed login attempt (user not found)
        await logLoginAttempt(
          email,
          false,
          {
            headers: {
              'x-forwarded-for': request.headers.get('x-forwarded-for') || undefined,
              'user-agent': request.headers.get('user-agent') || undefined,
            },
          },
          'User not found'
        ).catch(err => console.error('[Audit] Failed to log login attempt:', err));

        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const isValid = await compare(password, user.password);

      if (!isValid) {
        // Audit log: Failed login attempt (invalid password)
        await logLoginAttempt(
          user.id,
          false,
          {
            headers: {
              'x-forwarded-for': request.headers.get('x-forwarded-for') || undefined,
              'user-agent': request.headers.get('user-agent') || undefined,
            },
          },
          'Invalid password'
        ).catch(err => console.error('[Audit] Failed to log login attempt:', err));

        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Generate JWT token
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
      });
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Invalid credentials or database unavailable' },
        { status: 401 }
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
