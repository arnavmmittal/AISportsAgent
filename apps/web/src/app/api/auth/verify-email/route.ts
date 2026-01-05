/**

 * Email Verification API
 * Sends verification codes to coach emails
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

/**
 * PUT /api/auth/verify-email
 * Verify code
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

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
