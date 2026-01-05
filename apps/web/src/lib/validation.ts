/**
 * Input Validation with Zod
 * All API routes MUST use these schemas for input validation
 *
 * Security features:
 * - Type-safe validation
 * - XSS prevention (HTML sanitization)
 * - Length limits
 * - Format validation
 */

import { z } from 'zod';
import { sanitizeHtmlSync, sanitizeChatMessageSync } from './sanitize';

// ============================================
// Utility Functions
// ============================================

/**
 * Sanitize HTML to prevent XSS attacks
 * Strips all HTML tags and keeps only plain text
 */
export function sanitizeHtml(input: string): string {
  return sanitizeHtmlSync(input);
}

/**
 * Sanitize message for chat (allows some markdown but strips dangerous HTML)
 */
export function sanitizeChatMessage(input: string): string {
  return sanitizeChatMessageSync(input);
}

// ============================================
// Common Schemas
// ============================================

/**
 * UUID validation (for IDs)
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Message content validation
 * - Min 1 character (no empty messages)
 * - Max 2000 characters (prevent spam)
 * - Sanitized to prevent XSS
 */
export const messageSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message too long (max 2000 characters)')
  .transform(sanitizeChatMessage);

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long');

/**
 * Password validation (for signup)
 * - Min 8 characters
 * - Max 100 characters
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long');

/**
 * Name validation (sanitized)
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .transform(sanitizeHtml);

/**
 * Optional session ID
 */
export const sessionIdSchema = z
  .string()
  .uuid('Invalid session ID')
  .optional();

// ============================================
// API Route Schemas
// ============================================

/**
 * Chat Stream Request
 * POST /api/chat/stream
 */
export const chatStreamRequestSchema = z.object({
  message: messageSchema,
  athlete_id: uuidSchema,
  session_id: sessionIdSchema,
});

export type ChatStreamRequest = z.infer<typeof chatStreamRequestSchema>;

/**
 * Chat Analyze Request
 * POST /api/chat/analyze
 */
export const chatAnalyzeRequestSchema = z.object({
  session_id: uuidSchema,
});

export type ChatAnalyzeRequest = z.infer<typeof chatAnalyzeRequestSchema>;

/**
 * Mood Log Create Request
 * POST /api/mood-logs
 */
export const moodLogCreateSchema = z.object({
  athleteId: uuidSchema,
  mood: z.number().int().min(1).max(10, 'Mood must be between 1-10'),
  stress: z.number().int().min(1).max(10, 'Stress must be between 1-10'),
  confidence: z.number().int().min(1).max(10, 'Confidence must be between 1-10'),
  energy: z.number().int().min(1).max(10, 'Energy must be between 1-10').optional(),
  sleep: z.number().min(0).max(24, 'Sleep hours must be between 0-24').optional(),
  notes: z.string().max(500, 'Notes too long').optional().transform((val) => val ? sanitizeHtml(val) : undefined),
  tags: z.string().max(200, 'Tags too long').optional().transform((val) => val ? sanitizeHtml(val) : undefined),
});

export type MoodLogCreateRequest = z.infer<typeof moodLogCreateSchema>;

/**
 * Goal Create Request
 * POST /api/goals
 */
export const goalCreateSchema = z.object({
  athleteId: uuidSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').transform(sanitizeHtml),
  description: z.string().max(1000, 'Description too long').optional().transform((val) => val ? sanitizeHtml(val) : undefined),
  category: z.enum(['PERFORMANCE', 'MENTAL', 'ACADEMIC', 'PERSONAL']).optional(),
  targetDate: z.string().datetime('Invalid date format').optional(),
  progress: z.number().int().min(0).max(100, 'Progress must be between 0-100').optional(),
});

export type GoalCreateRequest = z.infer<typeof goalCreateSchema>;

/**
 * Assignment Submit Request
 * POST /api/assignments/[id]/submit
 */
export const assignmentSubmitSchema = z.object({
  responses: z.record(z.string(), z.union([
    z.string().max(5000, 'Response too long').transform(sanitizeHtml),
    z.number(),
    z.boolean(),
  ])),
});

export type AssignmentSubmitRequest = z.infer<typeof assignmentSubmitSchema>;

/**
 * Auth Signup Request
 * POST /api/auth/signup
 */
export const authSignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  role: z.enum(['ATHLETE', 'COACH']),
  school_id: uuidSchema.optional(),
  sport: z.string().max(50).optional().transform((val) => val ? sanitizeHtml(val) : undefined),
});

export type AuthSignupRequest = z.infer<typeof authSignupSchema>;

/**
 * Biometrics Sync Request
 * POST /api/biometrics/sync
 */
export const biometricsSyncSchema = z.object({
  athleteId: uuidSchema,
  deviceType: z.enum(['whoop', 'oura', 'garmin', 'apple_watch', 'manual']),
  metrics: z.array(z.object({
    metricType: z.enum(['hrv', 'resting_hr', 'sleep_duration', 'spo2', 'recovery_score', 'sleep_stages']),
    value: z.number(),
    unit: z.string().max(20).optional(),
    recordedAt: z.string().datetime('Invalid date format'),
  })).min(1, 'At least one metric is required').max(100, 'Too many metrics at once'),
});

export type BiometricsSyncRequest = z.infer<typeof biometricsSyncSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Parse and validate request body
 * Returns validated data or throws ZodError with details
 *
 * Usage:
 * ```ts
 * const body = await validateRequest(req, chatStreamRequestSchema);
 * // body is now type-safe and sanitized
 * ```
 */
export async function validateRequest<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for client
      throw new ValidationError(
        'Validation failed',
        error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );
    }
    throw error;
  }
}

/**
 * Custom Validation Error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Create error response for validation failures
 */
export function createValidationErrorResponse(error: ValidationError): Response {
  return new Response(
    JSON.stringify({
      error: error.message,
      details: error.errors,
    }),
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// ============================================
// Security Validations
// ============================================

/**
 * Validate that user can access resource for given athlete
 * Prevents unauthorized cross-athlete access
 */
export function validateAthleteAccess(
  userId: string,
  athleteId: string,
  userRole: string
): boolean {
  // User can access their own data
  if (userId === athleteId) return true;

  // Admins can access any athlete
  if (userRole === 'ADMIN') return true;

  // Coaches can access with consent (checked at DB level via RLS)
  if (userRole === 'COACH') return true;

  return false;
}

/**
 * Validate school_id matches user's school (multi-tenant boundary)
 */
export function validateSchoolAccess(
  userSchoolId: string,
  resourceSchoolId: string
): boolean {
  return userSchoolId === resourceSchoolId;
}
