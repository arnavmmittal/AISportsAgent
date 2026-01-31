/**
 * User Registration API
 *
 * POST - Create a new user account with email verification
 *
 * Security features:
 * - Input validation via Zod schema
 * - XSS prevention via sanitization
 * - Strong password requirements
 * - Email verification required
 * - Rate limiting (TODO: implement via middleware)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { signupSchema } from '@/lib/validation/auth';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy init Supabase Admin client (only during runtime, not build)
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    supabaseAdminInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdminInstance;
}

// Default school ID - in production, this would be determined by subdomain or user selection
const DEFAULT_SCHOOL_ID = 'default-school';

// Email verification token expiry: 24 hours
const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * POST /api/auth/signup
 * Create a new user account
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

    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Don't reveal if user exists - security best practice
      return NextResponse.json(
        {
          success: true,
          message: 'If this email is not already registered, you will receive a verification email.',
        },
        { status: 200 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Create user in Supabase Auth (unverified initially)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email verification
      user_metadata: {
        name,
        role,
      },
    });

    if (authError || !authData.user) {
      console.error('[Signup] Supabase auth error:', authError);
      return NextResponse.json(
        {
          error: authError?.message || 'Failed to create authentication account',
        },
        { status: 500 }
      );
    }

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
          updatedAt: new Date(),
        },
      });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

    // Create user and role-specific record in database
    const user = await prisma.$transaction(async (tx) => {
      // Create base user with Supabase user ID
      const newUser = await tx.user.create({
        data: {
          id: authData.user.id, // Use Supabase user ID
          email,
          name,
          password: '', // Empty password - auth is handled by Supabase
          role,
          schoolId: school!.id,
          onboardingCompleted: false,
          emailVerified: null, // Not verified yet
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

      // Store verification token
      await tx.verificationToken.create({
        data: {
          identifier: email,
          token: verificationToken,
          expires: tokenExpiry,
        },
      });

      return newUser;
    });

    // Send verification email
    const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: 'Verify Your Email - AI Sports Agent',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 12px 24px; border-radius: 8px;">
              <span style="color: white; font-weight: bold; font-size: 18px;">AI Sports Agent</span>
            </div>
          </div>

          <h2 style="color: #18181b; text-align: center;">Welcome, ${name}!</h2>

          <p style="color: #52525b; line-height: 1.6;">
            Thanks for signing up for AI Sports Agent. Please verify your email address to get started with your mental performance journey.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}"
               style="display: inline-block;
                      background: linear-gradient(135deg, #6366f1, #8b5cf6);
                      color: white;
                      padding: 14px 32px;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: 600;
                      font-size: 16px;">
              Verify Email Address
            </a>
          </div>

          <p style="color: #a1a1aa; font-size: 14px; text-align: center;">
            This link will expire in 24 hours.
          </p>

          <p style="color: #a1a1aa; font-size: 14px; text-align: center;">
            Or copy this link: ${verifyUrl}
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="color: #a1a1aa; font-size: 12px; text-align: center;">
            If you didn't create an account, you can safely ignore this email.
          </p>

          <p style="color: #a1a1aa; font-size: 12px; text-align: center;">
            AI Sports Agent - Mental Performance Support for Athletes
          </p>
        </div>
      `,
      text: `Welcome to AI Sports Agent, ${name}!\n\nPlease verify your email address by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.`,
    });

    console.log(`[Signup] User created: ${user.email} (${user.role}), verification email sent`);

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! Please check your email to verify your account.',
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
    console.error('[Signup] Error:', error);

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
