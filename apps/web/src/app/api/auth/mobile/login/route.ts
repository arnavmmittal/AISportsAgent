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

    // Demo athlete account for testing (no database required)
    if (email === 'demo@athlete.com' && password === 'demo123') {
      const token = await new SignJWT({
        id: 'demo-athlete-123',
        email: 'demo@athlete.com',
        role: 'ATHLETE',
        schoolId: 'demo-school-123',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(JWT_SECRET);

      return NextResponse.json({
        user: {
          id: 'demo-athlete-123',
          email: 'demo@athlete.com',
          name: 'Demo Athlete',
          role: 'ATHLETE',
          schoolId: 'demo-school-123',
          athlete: {
            userId: 'demo-athlete-123',
            sport: 'Basketball',
            year: 'Junior',
            teamPosition: 'Point Guard',
            consentCoachView: false,
            consentChatSummaries: false,
            riskLevel: 'LOW',
          },
        },
        token,
      });
    }

    // Demo coach account for testing (no database required)
    if (email === 'demo@coach.com' && password === 'demo123') {
      const token = await new SignJWT({
        id: 'demo-coach-123',
        email: 'demo@coach.com',
        role: 'COACH',
        schoolId: 'demo-school-123',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(JWT_SECRET);

      return NextResponse.json({
        user: {
          id: 'demo-coach-123',
          email: 'demo@coach.com',
          name: 'Demo Coach',
          role: 'COACH',
          schoolId: 'demo-school-123',
          coach: {
            userId: 'demo-coach-123',
            sport: 'Basketball',
            teamName: 'Demo University Basketball',
            inviteCode: 'DEMO-COACH-2024',
          },
        },
        token,
      });
    }

    // Try database authentication for real users
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
