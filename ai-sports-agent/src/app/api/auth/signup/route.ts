import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signupSchema } from '@/lib/validation/auth';
import { z } from 'zod';

// Default school ID - in production, this would be determined by subdomain or user selection
const DEFAULT_SCHOOL_ID = 'default-school';

/**
 * POST /api/auth/signup
 * Create a new user account (athlete or coach)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password, role, sport, year, title } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Ensure default school exists or create it
    let school = await prisma.school.findFirst({
      where: { id: DEFAULT_SCHOOL_ID },
    });

    if (!school) {
      school = await prisma.school.create({
        data: {
          id: DEFAULT_SCHOOL_ID,
          name: 'University of Washington',
          division: 'D1',
        },
      });
    }

    // Create user and role-specific record in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create base user
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role,
          schoolId: school!.id,
          onboardingCompleted: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Create role-specific record
      if (role === 'ATHLETE') {
        await tx.athlete.create({
          data: {
            userId: newUser.id,
            sport,
            year: year || 'FRESHMAN',
            consentCoachView: false,
            riskLevel: 'LOW',
          },
        });
      } else if (role === 'COACH') {
        await tx.coach.create({
          data: {
            userId: newUser.id,
            sport,
            title: title || 'Coach',
          },
        });
      }

      return newUser;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);

    // Handle Prisma errors
    if (error instanceof Error) {
      // Database connection error
      if (error.message.includes('prisma') || error.message.includes('database')) {
        return NextResponse.json(
          {
            error: 'Database connection error. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
