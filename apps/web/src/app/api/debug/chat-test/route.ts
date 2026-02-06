import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to test chat request validation
 * POST /api/debug/chat-test
 *
 * Send the same payload as /api/chat/stream to see exactly what's failing
 *
 * SECURITY: Requires authentication and is disabled in production by default
 */
export async function POST(req: NextRequest) {
  // Block in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ROUTES !== 'true') {
    return NextResponse.json({ error: 'Debug routes disabled in production' }, { status: 404 });
  }

  // Require at least basic authentication
  const { authorized, response } = await requireAuth(req);
  if (!authorized) return response!;
  const errors: string[] = [];
  const results: {
    timestamp: string;
    rawBody: string | null;
    parsedBody: unknown;
    validationResult: unknown;
    errors: string[];
    fieldChecks?: Record<string, unknown>;
  } = {
    timestamp: new Date().toISOString(),
    rawBody: null,
    parsedBody: null,
    validationResult: null,
    errors,
  };

  try {
    // Get raw body text first
    const bodyText = await req.text();
    results.rawBody = bodyText;

    // Try to parse as JSON
    let body: unknown;
    try {
      body = JSON.parse(bodyText);
      results.parsedBody = body;
    } catch (e) {
      errors.push(`JSON parse error: ${e instanceof Error ? e.message : 'unknown'}`);
      return NextResponse.json(results, { status: 400 });
    }

    // Check each field individually
    const fieldChecks: Record<string, unknown> = {};

    // Check message
    if (typeof body === 'object' && body !== null) {
      const obj = body as Record<string, unknown>;

      // Message check
      fieldChecks.message = {
        value: obj.message,
        type: typeof obj.message,
        length: typeof obj.message === 'string' ? obj.message.length : null,
      };

      // athlete_id check
      fieldChecks.athlete_id = {
        value: obj.athlete_id,
        type: typeof obj.athlete_id,
        isValidUUID: typeof obj.athlete_id === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(obj.athlete_id),
      };

      // session_id check
      const sessionIdVal = obj.session_id;
      fieldChecks.session_id = {
        value: sessionIdVal,
        type: typeof sessionIdVal,
        isEmpty: sessionIdVal === '',
        isNull: sessionIdVal === null,
        isUndefined: sessionIdVal === undefined,
        isValidUUID: typeof sessionIdVal === 'string' && sessionIdVal !== '' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionIdVal),
        isValidCUID: typeof sessionIdVal === 'string' && sessionIdVal !== '' &&
          /^c[a-z0-9]{20,}$/.test(sessionIdVal),
        isValidId: typeof sessionIdVal === 'string' && sessionIdVal !== '' &&
          (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionIdVal) ||
           /^c[a-z0-9]{20,}$/.test(sessionIdVal)),
      };
    }

    results.fieldChecks = fieldChecks;

    // Now try the actual validation schema
    // Flexible ID schema that accepts both UUID and CUID
    const flexibleIdSchema = z.string().refine(
      (val) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(val)) return true;
        const cuidRegex = /^c[a-z0-9]{20,}$/;
        if (cuidRegex.test(val)) return true;
        return false;
      },
      { message: 'Invalid ID format (expected UUID or CUID)' }
    );

    const sessionIdSchema = z
      .string()
      .optional()
      .transform((val) => (val === '' ? undefined : val))
      .pipe(flexibleIdSchema.optional());

    const chatStreamRequestSchema = z.object({
      message: z.string().min(1).max(2000),
      athlete_id: z.string().uuid('Invalid ID format'),
      session_id: sessionIdSchema,
    });

    try {
      const validated = chatStreamRequestSchema.parse(body);
      results.validationResult = {
        success: true,
        data: validated,
      };
    } catch (e) {
      if (e instanceof z.ZodError) {
        results.validationResult = {
          success: false,
          zodErrors: e.errors,
          formatted: e.format(),
        };
      } else {
        results.validationResult = {
          success: false,
          error: e instanceof Error ? e.message : 'unknown',
        };
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(results, { status: 500 });
  }
}
