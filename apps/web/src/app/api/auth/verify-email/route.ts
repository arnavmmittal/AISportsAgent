/**
 * Email Verification API
 *
 * POST - Send verification code to email (for coach signup flow)
 * PUT - Verify code or token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy init Supabase Admin client
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

// In-memory store for verification codes (use Redis in production)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (data.expiresAt < now) {
      verificationCodes.delete(email);
    }
  }
}, 5 * 60 * 1000);

/**
 * POST /api/auth/verify-email
 * Send verification code to email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, action } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // For coaches, prefer .edu or .org domains
    if (action === 'coach-signup' && !email.includes('.edu') && !email.includes('.org')) {
      console.warn(`Coach signup with non-institutional email: ${email}`);
    }

    // Generate 6-digit verification code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code
    verificationCodes.set(email, { code, expiresAt });

    // In production, send email via SendGrid/AWS SES
    // For now, return code in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n📧 Verification Code for ${email}: ${code}\n`);

      return NextResponse.json({
        success: true,
        message: 'Verification code sent',
        // Only include code in development
        devCode: code,
      });
    }

    // TODO: Production email sending
    // await sendVerificationEmail(email, code);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}

// Validation schemas
const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

const verifyTokenSchema = z.object({
  token: z.string().min(1),
});

/**
 * PUT /api/auth/verify-email
 * Verify code (for login flow) or token (for signup flow)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a token-based verification (from signup email link)
    if (body.token && !body.code) {
      return verifyToken(body.token);
    }

    // Otherwise, verify code (existing flow)
    const validationResult = verifyCodeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    const { email, code } = validationResult.data;

    const stored = verificationCodes.get(email);

    if (!stored) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 404 }
      );
    }

    if (stored.expiresAt < Date.now()) {
      verificationCodes.delete(email);
      return NextResponse.json(
        { error: 'Verification code expired. Please request a new one.' },
        { status: 410 }
      );
    }

    if (stored.code !== code.trim()) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      );
    }

    // Code is valid - remove it
    verificationCodes.delete(email);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Code verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}

/**
 * Verify email using token from signup email
 */
async function verifyToken(token: string): Promise<NextResponse> {
  try {
    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: 'Verification link has expired. Please sign up again.' },
        { status: 410 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      // Delete the token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json({
        success: true,
        message: 'Email already verified. You can sign in.',
        alreadyVerified: true,
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Update user and confirm email in Supabase
    await Promise.all([
      // Update user in database
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      // Confirm email in Supabase
      supabaseAdmin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      }),
      // Delete verification token
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    console.log(`[Verify Email] Email verified for user: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now sign in.',
    });

  } catch (error) {
    console.error('[Verify Email Token] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    );
  }
}
