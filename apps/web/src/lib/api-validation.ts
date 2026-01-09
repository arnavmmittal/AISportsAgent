/**
 * API Request Validation Schemas
 *
 * Comprehensive Zod schemas for validating all API requests.
 * CRITICAL SECURITY: All POST/PUT/PATCH requests must be validated.
 *
 * Features:
 * - Input sanitization
 * - Type safety
 * - Length limits
 * - Pattern matching
 * - Custom error messages
 */

import { z } from 'zod';

// ============================================
// COMMON VALIDATORS
// ============================================

// UUID format validation
const uuidSchema = z.string().uuid('Invalid UUID format');

// School ID validation (must be non-empty)
const schoolIdSchema = z.string().min(1, 'School ID is required');

// Date validation (ISO 8601 or Date object)
const dateSchema = z.union([
  z.string().datetime(),
  z.date(),
]);

// Pagination
const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// ============================================
// CHAT API VALIDATION
// ============================================

export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long (max 2000 characters)')
    .trim()
    // Remove HTML tags and dangerous characters
    .transform(val => val.replace(/<[^>]*>/g, ''))
    .transform(val => val.replace(/javascript:/gi, ''))
    .transform(val => val.replace(/on\w+=/gi, '')),

  sessionId: z.string()
    .uuid('Invalid session ID')
    .optional(),

  athleteId: uuidSchema,

  schoolId: schoolIdSchema,
});

export const createSessionSchema = z.object({
  athleteId: uuidSchema,
  schoolId: schoolIdSchema,
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .optional(),
});

export const updateSessionSchema = z.object({
  sessionId: uuidSchema,
  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title too long')
    .optional(),
  archived: z.boolean().optional(),
});

// ============================================
// MOOD LOG API VALIDATION
// ============================================

export const createMoodLogSchema = z.object({
  athleteId: uuidSchema,
  schoolId: schoolIdSchema,

  // Mood rating (1-10)
  mood: z.number()
    .int('Mood must be a whole number')
    .min(1, 'Mood rating must be at least 1')
    .max(10, 'Mood rating cannot exceed 10'),

  // Confidence rating (1-10)
  confidence: z.number()
    .int('Confidence must be a whole number')
    .min(1, 'Confidence rating must be at least 1')
    .max(10, 'Confidence rating cannot exceed 10'),

  // Stress rating (1-10)
  stress: z.number()
    .int('Stress must be a whole number')
    .min(1, 'Stress rating must be at least 1')
    .max(10, 'Stress rating cannot exceed 10'),

  // Sleep hours (0-24)
  sleepHours: z.number()
    .min(0, 'Sleep hours cannot be negative')
    .max(24, 'Sleep hours cannot exceed 24'),

  // Optional notes
  notes: z.string()
    .max(1000, 'Notes too long (max 1000 characters)')
    .optional()
    .transform(val => val?.replace(/<[^>]*>/g, '')),

  // Log date
  logDate: dateSchema.optional(),
});

export const getMoodLogsSchema = z.object({
  athleteId: uuidSchema,
  schoolId: schoolIdSchema,
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
}).merge(paginationSchema);

// ============================================
// GOAL API VALIDATION
// ============================================

export const goalCategorySchema = z.enum([
  'PERFORMANCE',
  'MENTAL',
  'ACADEMIC',
  'PERSONAL',
], {
  errorMap: () => ({ message: 'Invalid goal category' })
});

export const goalStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'ABANDONED',
], {
  errorMap: () => ({ message: 'Invalid goal status' })
});

export const createGoalSchema = z.object({
  athleteId: uuidSchema,
  schoolId: schoolIdSchema,

  title: z.string()
    .min(1, 'Goal title is required')
    .max(200, 'Title too long (max 200 characters)')
    .trim(),

  description: z.string()
    .max(2000, 'Description too long (max 2000 characters)')
    .optional()
    .transform(val => val?.replace(/<[^>]*>/g, '')),

  category: goalCategorySchema,

  targetDate: dateSchema.optional(),

  metrics: z.string()
    .max(500, 'Metrics too long')
    .optional(),
});

export const updateGoalSchema = z.object({
  goalId: uuidSchema,

  title: z.string()
    .min(1, 'Goal title cannot be empty')
    .max(200, 'Title too long')
    .optional(),

  description: z.string()
    .max(2000, 'Description too long')
    .optional(),

  status: goalStatusSchema.optional(),

  progress: z.number()
    .min(0, 'Progress cannot be negative')
    .max(100, 'Progress cannot exceed 100')
    .optional(),

  targetDate: dateSchema.optional(),

  completedDate: dateSchema.optional(),
});

// ============================================
// AUTHENTICATION API VALIDATION
// ============================================

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim()
    .transform(val => val.replace(/<[^>]*>/g, '')),

  role: z.enum(['ATHLETE', 'COACH'], {
    errorMap: () => ({ message: 'Invalid role' })
  }),

  schoolId: schoolIdSchema,

  // Athlete-specific fields
  sport: z.string()
    .max(100, 'Sport name too long')
    .optional(),

  year: z.enum(['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE'])
    .optional(),

  // Coach-specific fields
  team: z.string()
    .max(100, 'Team name too long')
    .optional(),
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(1, 'Password is required'),
});

// ============================================
// COACH/ADMIN API VALIDATION
// ============================================

export const createCoachAthleteRelationSchema = z.object({
  coachId: uuidSchema,
  athleteId: uuidSchema,
  schoolId: schoolIdSchema,
  consentGranted: z.boolean().default(false),
});

export const updateConsentSchema = z.object({
  relationId: uuidSchema,
  consentGranted: z.boolean(),
});

export const getWeeklySummarySchema = z.object({
  athleteId: uuidSchema,
  schoolId: schoolIdSchema,
  weekStart: dateSchema,
  weekEnd: dateSchema,
});

// ============================================
// KNOWLEDGE BASE API VALIDATION
// ============================================

export const createKnowledgeBaseSchema = z.object({
  schoolId: schoolIdSchema,

  source: z.string()
    .min(1, 'Source is required')
    .max(500, 'Source too long')
    .trim(),

  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .trim(),

  content: z.string()
    .min(1, 'Content is required')
    .max(100000, 'Content too long (max 100KB)'),

  tags: z.array(z.string().max(50))
    .max(20, 'Too many tags (max 20)')
    .optional(),

  framework: z.enum(['CBT', 'MINDFULNESS', 'FLOW_STATE', 'GOAL_SETTING', 'VISUALIZATION', 'OTHER'])
    .optional(),
});

export const queryKnowledgeBaseSchema = z.object({
  query: z.string()
    .min(1, 'Query is required')
    .max(500, 'Query too long')
    .trim()
    .transform(val => val.replace(/<[^>]*>/g, '')),

  schoolId: schoolIdSchema,

  filters: z.object({
    framework: z.string().optional(),
    sport: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),

  limit: z.number()
    .int()
    .positive()
    .max(50)
    .default(10),
});

// ============================================
// ANALYTICS API VALIDATION
// ============================================

export const getAnalyticsSchema = z.object({
  athleteId: uuidSchema,
  schoolId: schoolIdSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  metrics: z.array(z.enum([
    'mood_trend',
    'confidence_trend',
    'stress_trend',
    'goal_progress',
    'chat_frequency',
    'crisis_events',
  ])).optional(),
});

export const getTeamAnalyticsSchema = z.object({
  schoolId: schoolIdSchema,
  teamId: z.string().optional(),
  startDate: dateSchema,
  endDate: dateSchema,

  // Anonymization flag (always true for non-admins)
  anonymize: z.boolean().default(true),
});

// ============================================
// CRISIS ALERT API VALIDATION
// ============================================

export const createCrisisAlertSchema = z.object({
  athleteId: uuidSchema,
  schoolId: schoolIdSchema,
  sessionId: uuidSchema,

  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    errorMap: () => ({ message: 'Invalid severity level' })
  }),

  detectedLanguage: z.string()
    .max(1000, 'Detected language too long'),

  context: z.string()
    .max(5000, 'Context too long'),

  aiConfidence: z.number()
    .min(0, 'Confidence must be between 0 and 1')
    .max(1, 'Confidence must be between 0 and 1'),
});

export const updateCrisisAlertSchema = z.object({
  alertId: uuidSchema,

  status: z.enum(['PENDING', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED'], {
    errorMap: () => ({ message: 'Invalid status' })
  }),

  notes: z.string()
    .max(2000, 'Notes too long')
    .optional(),

  resolvedBy: uuidSchema.optional(),
  resolvedAt: dateSchema.optional(),
});

// ============================================
// FILE UPLOAD VALIDATION
// ============================================

export const fileUploadSchema = z.object({
  file: z.instanceof(File),

  fileType: z.enum(['PDF', 'IMAGE', 'VIDEO', 'AUDIO'], {
    errorMap: () => ({ message: 'Invalid file type' })
  }),

  maxSizeMB: z.number()
    .positive()
    .max(50) // 50MB max
    .default(10),
})
  .refine(
    (data) => data.file.size <= data.maxSizeMB * 1024 * 1024,
    (data) => ({ message: `File size exceeds ${data.maxSizeMB}MB limit` })
  )
  .refine(
    (data) => {
      const allowedTypes: Record<string, string[]> = {
        PDF: ['application/pdf'],
        IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
        VIDEO: ['video/mp4', 'video/webm'],
        AUDIO: ['audio/mpeg', 'audio/wav', 'audio/webm'],
      };
      return allowedTypes[data.fileType].includes(data.file.type);
    },
    { message: 'Invalid file MIME type for specified type' }
  );

// ============================================
// VALIDATION HELPER FUNCTIONS
// ============================================

/**
 * Validate request body against schema
 * Returns validated data or throws detailed error
 */
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw new ValidationError('Invalid request data', formattedErrors);
    }
    throw error;
  }
}

/**
 * Custom validation error class
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
 * Sanitize user-provided text
 * Removes HTML tags and dangerous characters
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Validate and sanitize chat message
 * Extra security for chat interface
 */
export function sanitizeChatMessage(message: string): string {
  // Remove script tags
  let clean = message.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove all HTML tags
  clean = clean.replace(/<[^>]*>/g, '');

  // Remove javascript: and data: URLs
  clean = clean.replace(/javascript:/gi, '');
  clean = clean.replace(/data:/gi, '');

  // Remove event handlers
  clean = clean.replace(/on\w+=/gi, '');

  // Limit length
  if (clean.length > 2000) {
    clean = clean.substring(0, 2000);
  }

  return clean.trim();
}

/**
 * Check if request is from authenticated user
 */
export function isAuthenticated(userId: string | undefined): boolean {
  return !!userId && userId.length > 0;
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string | undefined, requiredRoles: string[]): boolean {
  return !!userRole && requiredRoles.includes(userRole);
}

/**
 * Check if user belongs to school (multi-tenant check)
 */
export function belongsToSchool(userSchoolId: string | undefined, resourceSchoolId: string): boolean {
  return !!userSchoolId && userSchoolId === resourceSchoolId;
}
