import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to test chat request validation
 * POST /api/debug/chat-test
 *
 * Send the same payload as /api/chat/stream to see exactly what's failing
 */
export async function POST(req: NextRequest) {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    rawBody: null,
    parsedBody: null,
    validationResult: null,
    errors: [],
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
      results.errors.push(`JSON parse error: ${e instanceof Error ? e.message : 'unknown'}`);
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
      fieldChecks.session_id = {
        value: obj.session_id,
        type: typeof obj.session_id,
        isEmpty: obj.session_id === '',
        isNull: obj.session_id === null,
        isUndefined: obj.session_id === undefined,
        isValidUUID: typeof obj.session_id === 'string' && obj.session_id !== '' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(obj.session_id),
      };
    }

    results.fieldChecks = fieldChecks;

    // Now try the actual validation schema
    const sessionIdSchema = z
      .string()
      .optional()
      .transform((val) => (val === '' ? undefined : val))
      .pipe(z.string().uuid('Invalid session ID').optional());

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
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(results, { status: 500 });
  }
}
