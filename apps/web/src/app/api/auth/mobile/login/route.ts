/**
 * Mobile app login endpoint
 * Returns JWT token for stateless authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';

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
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const isValid = await compare(password, user.password);

      if (!isValid) {
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
