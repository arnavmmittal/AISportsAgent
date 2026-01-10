# API Route Validation Guide

## Overview

All API routes **MUST** use input validation to prevent security vulnerabilities. This guide shows how to apply validation using the standardized middleware and schemas.

## Quick Start

```typescript
import { withPostMiddleware } from '@/lib/api-middleware';
import { chatMessageSchema } from '@/lib/api-validation';

export const POST = withPostMiddleware(
  chatMessageSchema,
  { requireRole: ['ATHLETE'] },
  async (context, validatedData) => {
    // validatedData is type-safe and sanitized
    // context contains authenticated user info
    return successResponse({ message: 'Success' });
  }
);
```

## Available Middleware

### 1. `withApiMiddleware` (Base)

Full-featured middleware with all options:

```typescript
export const POST = withApiMiddleware(
  {
    schema: mySchema,              // Zod schema for validation
    requireRole: ['ATHLETE'],      // Required roles
    requireAuth: true,             // Require authentication (default)
    rateLimit: true,               // Enable rate limiting (default)
    costControl: false,            // Enable cost control (for LLM endpoints)
    auditLog: false,               // Enable audit logging
  },
  async (context, validatedData) => {
    // Handler logic
  }
);
```

### 2. `withPostMiddleware` (Recommended for POST/PUT)

Simplified wrapper for routes with request bodies:

```typescript
export const POST = withPostMiddleware(
  mySchema,
  { requireRole: ['ATHLETE'] },
  async (context, validatedData) => {
    // Handler logic
  }
);
```

### 3. `withGetMiddleware` (For GET requests)

No body validation, just authentication and rate limiting:

```typescript
export const GET = withGetMiddleware(
  { requireRole: ['ATHLETE', 'COACH'] },
  async (context) => {
    const { user } = context;
    // Handler logic
  }
);
```

### 4. Role-Specific Wrappers

Pre-configured for specific roles:

```typescript
// Athlete-only routes
export const POST = withAthleteRoute(
  mySchema,
  async (context, validatedData) => {
    // Only athletes can access
  }
);

// Coach-only routes
export const POST = withCoachRoute(
  mySchema,
  async (context, validatedData) => {
    // Only coaches and admins can access
  }
);

// Admin-only routes
export const POST = withAdminRoute(
  mySchema,
  async (context, validatedData) => {
    // Only admins can access
  }
);
```

## Validation Schemas

All validation schemas are in `/src/lib/api-validation.ts`.

### Common Schemas

```typescript
import {
  chatMessageSchema,
  createMoodLogSchema,
  createGoalSchema,
  updateGoalSchema,
  registerSchema,
  loginSchema,
  createCoachAthleteRelationSchema,
  queryKnowledgeBaseSchema,
  getAnalyticsSchema,
  createCrisisAlertSchema,
} from '@/lib/api-validation';
```

### Creating Custom Schemas

```typescript
import { z } from 'zod';

const myCustomSchema = z.object({
  // Required field
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim(),

  // Optional field with transformation
  description: z.string()
    .max(500, 'Description too long')
    .optional()
    .transform(val => val?.replace(/<[^>]*>/g, '')), // Remove HTML

  // Enum field
  category: z.enum(['A', 'B', 'C'], {
    errorMap: () => ({ message: 'Invalid category' })
  }),

  // Number with constraints
  age: z.number()
    .int('Must be whole number')
    .min(1, 'Must be at least 1')
    .max(150, 'Must be at most 150'),

  // Date field
  startDate: z.union([z.string().datetime(), z.date()]),

  // Array field
  tags: z.array(z.string().max(50))
    .max(10, 'Too many tags')
    .optional(),

  // Nested object
  metadata: z.object({
    key: z.string(),
    value: z.string(),
  }).optional(),
});
```

## Route Patterns

### Pattern 1: Simple POST Route (Create Resource)

```typescript
// /api/goals/route.ts
import { withAthleteRoute, successResponse } from '@/lib/api-middleware';
import { createGoalSchema } from '@/lib/api-validation';
import { prisma } from '@/lib/prisma';

export const POST = withAthleteRoute(
  createGoalSchema,
  async (context, validatedData) => {
    const { user } = context;

    if (!validatedData) {
      return errorResponse('Invalid request data', 400);
    }

    // Verify user owns the resource (multi-tenant check)
    if (user.id !== validatedData.athleteId) {
      return errorResponse('Cannot create goals for other users', 403);
    }

    const goal = await prisma.goal.create({
      data: {
        athleteId: validatedData.athleteId,
        title: validatedData.title,
        description: validatedData.description || null,
        category: validatedData.category,
        targetDate: validatedData.targetDate,
      },
    });

    return successResponse(goal, 201);
  }
);
```

### Pattern 2: GET Route with Query Params

```typescript
// /api/mood-logs/route.ts
import { withGetMiddleware, successResponse, errorResponse } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

export const GET = withGetMiddleware(
  { requireRole: ['ATHLETE', 'COACH'] },
  async (context) => {
    const { user, request } = context;
    const { searchParams } = new URL(request.url);

    const athleteId = searchParams.get('athleteId');

    if (!athleteId) {
      return errorResponse('Missing athleteId parameter', 400);
    }

    // Verify access
    if (user.id !== athleteId && user.role !== 'COACH') {
      return errorResponse('Forbidden', 403);
    }

    const moodLogs = await prisma.moodLog.findMany({
      where: { athleteId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return successResponse(moodLogs);
  }
);
```

### Pattern 3: Dynamic Route with Params

```typescript
// /api/goals/[id]/route.ts
import { withApiMiddleware, successResponse, errorResponse } from '@/lib/api-middleware';
import { updateGoalSchema } from '@/lib/api-validation';
import { prisma } from '@/lib/prisma';

export const PATCH = withApiMiddleware(
  { schema: updateGoalSchema, requireRole: ['ATHLETE', 'COACH'] },
  async (context, validatedData) => {
    const { user, request } = context;

    // Extract ID from URL
    const url = new URL(request.url);
    const goalId = url.pathname.split('/').slice(-1)[0];

    // Get existing goal
    const existing = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { Athlete: true },
    });

    if (!existing) {
      return errorResponse('Goal not found', 404);
    }

    // Verify ownership
    if (user.id !== existing.athleteId && user.role !== 'COACH') {
      return errorResponse('Forbidden', 403);
    }

    // Update goal
    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    return successResponse(updated);
  }
);
```

### Pattern 4: Coach Route with Consent Check

```typescript
// /api/coach/athletes/[id]/summary/route.ts
import { withCoachRoute, successResponse, errorResponse, assertOwnership } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

export const GET = withCoachRoute(
  undefined, // No body validation for GET
  async (context) => {
    const { user, request } = context;

    // Extract athlete ID from URL
    const url = new URL(request.url);
    const athleteId = url.pathname.split('/').slice(-2)[0];

    // Get coach
    const coach = await prisma.coach.findUnique({
      where: { userId: user.id },
      select: { userId: true, schoolId: true },
    });

    if (!coach) {
      return errorResponse('Coach not found', 404);
    }

    // Check consent
    const relation = await prisma.coachAthleteRelation.findUnique({
      where: {
        coachId_athleteId: {
          coachId: coach.userId,
          athleteId: athleteId,
        },
      },
      include: {
        Athlete: {
          select: { schoolId: true },
        },
      },
    });

    if (!relation) {
      return errorResponse('Athlete not connected to coach', 404);
    }

    if (!relation.consentGranted) {
      return errorResponse('Athlete has not granted consent', 403);
    }

    // Verify multi-tenant boundary
    assertOwnership(
      coach.schoolId,
      relation.Athlete.schoolId,
      'Cannot access athletes from other schools'
    );

    // Fetch summary data
    const summary = await prisma.weeklySummary.findFirst({
      where: { athleteId },
      orderBy: { weekStart: 'desc' },
    });

    return successResponse(summary);
  }
);
```

### Pattern 5: LLM Endpoint with Cost Control

```typescript
// /api/chat/stream/route.ts (simplified)
import { withApiMiddleware } from '@/lib/api-middleware';
import { chatMessageSchema } from '@/lib/api-validation';

export const POST = withApiMiddleware(
  {
    schema: chatMessageSchema,
    requireRole: ['ATHLETE'],
    rateLimit: true,
    costControl: true, // ENABLE cost control for LLM endpoints
  },
  async (context, validatedData) => {
    const { user } = context;

    // Cost control automatically checked before handler runs
    // Rate limiting automatically enforced

    // Process chat message
    // ...

    return successResponse({ sessionId: 'abc123' });
  }
);
```

## Security Checklist

When creating or updating an API route, ensure:

### ✅ Input Validation
- [ ] All POST/PUT/PATCH requests have Zod schema validation
- [ ] All user inputs are sanitized (HTML removal, XSS prevention)
- [ ] Length limits enforced on strings
- [ ] Number ranges validated
- [ ] Enums used for limited options

### ✅ Authentication & Authorization
- [ ] `requireAuth: true` (or use role-specific wrapper)
- [ ] Correct role requirements specified
- [ ] User ownership verified before data access
- [ ] Multi-tenant boundaries enforced (schoolId checks)

### ✅ Rate Limiting
- [ ] Rate limiting enabled (default: true)
- [ ] Custom limits set for high-traffic endpoints
- [ ] Proper Retry-After headers returned on 429

### ✅ Cost Control
- [ ] Cost control enabled for LLM endpoints
- [ ] Circuit breakers in place for budget limits
- [ ] Token usage tracked after LLM calls

### ✅ Error Handling
- [ ] Use `successResponse()` and `errorResponse()` helpers
- [ ] Don't expose internal errors to client
- [ ] Log errors for debugging
- [ ] Return appropriate HTTP status codes

### ✅ Audit Logging
- [ ] Enabled for sensitive operations (data exports, consent changes)
- [ ] Includes userId, resource, action, timestamp
- [ ] Doesn't log sensitive data (passwords, full messages)

## Common Pitfalls

### ❌ Don't: Manual JSON Parsing
```typescript
// BAD
const body = await req.json();
const { message } = body; // Unvalidated!
```

### ✅ Do: Use Validation Middleware
```typescript
// GOOD
export const POST = withPostMiddleware(
  mySchema,
  {},
  async (context, validatedData) => {
    const { message } = validatedData; // Type-safe and validated!
  }
);
```

### ❌ Don't: Skip Multi-Tenant Checks
```typescript
// BAD - No schoolId check
const data = await prisma.athlete.findMany({
  where: { id: athleteId }
});
```

### ✅ Do: Always Filter by School
```typescript
// GOOD
const data = await prisma.athlete.findMany({
  where: {
    id: athleteId,
    schoolId: user.schoolId // Multi-tenant isolation
  }
});

// Or use assertOwnership helper
assertOwnership(user.schoolId, resource.schoolId);
```

### ❌ Don't: Return Detailed Errors to Client
```typescript
// BAD - Exposes internal details
catch (error) {
  return NextResponse.json({ error: error.stack }, { status: 500 });
}
```

### ✅ Do: Return Generic Errors
```typescript
// GOOD
catch (error) {
  console.error('Internal error:', error); // Log for debugging
  return errorResponse('Internal server error', 500);
}
```

## Testing Validation

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { chatMessageSchema } from '@/lib/api-validation';

describe('chatMessageSchema', () => {
  it('should accept valid message', async () => {
    const result = await chatMessageSchema.parseAsync({
      message: 'Hello world',
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      athleteId: '123e4567-e89b-12d3-a456-426614174001',
      schoolId: 'school-123',
    });

    expect(result.message).toBe('Hello world');
  });

  it('should reject empty message', async () => {
    await expect(
      chatMessageSchema.parseAsync({ message: '' })
    ).rejects.toThrow('Message cannot be empty');
  });

  it('should strip HTML tags', async () => {
    const result = await chatMessageSchema.parseAsync({
      message: '<script>alert(1)</script>Hello',
      athleteId: '123e4567-e89b-12d3-a456-426614174001',
      schoolId: 'school-123',
    });

    expect(result.message).toBe('Hello');
  });
});
```

### Integration Tests

Test the full middleware stack:

```typescript
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/goals/route';

describe('POST /api/goals', () => {
  it('should reject unauthenticated request', async () => {
    const req = new Request('http://localhost:3000/api/goals', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });

    const response = await POST(req as any);
    expect(response.status).toBe(401);
  });

  it('should reject invalid payload', async () => {
    // Mock authenticated session
    const req = createAuthenticatedRequest({
      title: '', // Empty title - should fail
    });

    const response = await POST(req as any);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Validation failed');
  });
});
```

## Migration Checklist

To migrate an existing route to the new validation system:

1. **Import new middleware and schemas**
   ```typescript
   import { withPostMiddleware, successResponse, errorResponse } from '@/lib/api-middleware';
   import { mySchema } from '@/lib/api-validation';
   ```

2. **Remove old authentication code**
   - Delete `await requireAuth(req)`
   - Delete `await getServerSession()`

3. **Remove manual JSON parsing**
   - Delete `await req.json()`
   - Delete manual validation

4. **Wrap handler with middleware**
   ```typescript
   export const POST = withPostMiddleware(
     mySchema,
     { requireRole: ['ATHLETE'] },
     async (context, validatedData) => {
       // Handler logic
     }
   );
   ```

5. **Update return statements**
   - Use `successResponse()` and `errorResponse()`

6. **Test the route**
   - Verify authentication works
   - Verify validation works
   - Verify error handling works

## Summary

**All API routes must:**
1. Use validation middleware (`withApiMiddleware`, `withPostMiddleware`, etc.)
2. Have Zod schemas for request validation
3. Enforce authentication and authorization
4. Verify multi-tenant boundaries
5. Use rate limiting
6. Return standardized responses
7. Handle errors properly

For questions or clarifications, refer to:
- `/src/lib/api-middleware.ts` - Middleware implementation
- `/src/lib/api-validation.ts` - All validation schemas
- This guide - Best practices and patterns
