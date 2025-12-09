# Authentication & Security

## Overview

The AI Sports Agent platform uses NextAuth.js v5 for authentication with comprehensive role-based access control (RBAC).

## User Roles

- **ATHLETE**: Access to chat, mood logging, goals, history
- **COACH**: Access to team analytics, readiness dashboards, performance recording
- **ADMIN**: Full access to all features

## Protected Routes

### Page Routes (Middleware)

The Next.js middleware (`src/middleware.ts`) automatically protects routes:

**Athlete Routes** (ATHLETE or ADMIN only):
- `/dashboard`
- `/chat`
- `/mood`
- `/goals`
- `/history`

**Coach Routes** (COACH or ADMIN only):
- `/coach/dashboard`
- `/coach/readiness`
- `/coach/performance/record`
- `/coach/athletes`
- `/coach/insights`

**API Routes** (COACH or ADMIN only):
- `/api/analytics/*`
- `/api/performance/*`
- `/api/coach/*`

### How Middleware Works

1. **Unauthenticated users** → Redirect to `/auth/signin`
2. **Authenticated users on auth pages** → Redirect to role-specific home
3. **Role mismatch** → Redirect or 403 Forbidden

## Auth Helpers (API Routes)

Use these server-side helpers in API routes:

### `requireAuth()`

Require any authenticated user:

```typescript
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const { authorized, session, response } = await requireAuth();
  if (!authorized || !session) return response;

  // User is authenticated, proceed
  const userId = session.user.id;
}
```

### `requireCoach()`

Require COACH or ADMIN role:

```typescript
import { requireCoach } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  const { authorized, session, response } = await requireCoach();
  if (!authorized || !session) return response;

  // User is a coach, proceed
}
```

### `requireAdmin()`

Require ADMIN role only:

```typescript
import { requireAdmin } from '@/lib/auth-helpers';

export async function DELETE(request: NextRequest) {
  const { authorized, session, response } = await requireAdmin();
  if (!authorized || !session) return response;

  // User is an admin, proceed
}
```

### `requireAthlete()`

Require ATHLETE or ADMIN role:

```typescript
import { requireAthlete } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  const { authorized, session, response } = await requireAthlete();
  if (!authorized || !session) return response;

  // User is an athlete, proceed
}
```

## Ownership & School Verification

### Verify Resource Ownership

```typescript
import { requireAuth, verifyOwnership } from '@/lib/auth-helpers';

const { authorized, session } = await requireAuth();
if (!authorized || !session) return response;

// Check if user owns the resource
if (!verifyOwnership(session, athleteId)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Verify School Access (Multi-tenancy)

```typescript
import { requireCoach, verifySchoolAccess } from '@/lib/auth-helpers';

const { authorized, session } = await requireCoach();
if (!authorized || !session) return response;

// Check if coach belongs to same school as athlete
if (!verifySchoolAccess(session, athlete.schoolId)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## Convenience Functions

```typescript
import { getUserId, getUserRole, getSchoolId } from '@/lib/auth-helpers';

const userId = getUserId(session);
const role = getUserRole(session);
const schoolId = getSchoolId(session);
```

## Example: Complete Protected API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireCoach, verifySchoolAccess } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  // 1. Require COACH role
  const { authorized, session, response } = await requireCoach();
  if (!authorized || !session) return response;

  // 2. Parse request
  const { athleteId, data } = await request.json();

  // 3. Verify athlete exists
  const athlete = await prisma.athlete.findUnique({
    where: { userId: athleteId },
  });

  if (!athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }

  // 4. Verify school access (multi-tenancy)
  if (!verifySchoolAccess(session, athlete.user.schoolId)) {
    return NextResponse.json(
      { error: 'Forbidden - Different school' },
      { status: 403 }
    );
  }

  // 5. Proceed with operation
  // ... your logic here
}
```

## Security Best Practices

1. **Always use auth helpers** in API routes
2. **Never trust client-side data** - verify on server
3. **Implement multi-tenancy** - filter by schoolId
4. **Verify ownership** before allowing edits/deletes
5. **Use middleware** for automatic route protection
6. **Log security events** for audit trails

## Testing

### Demo Accounts

```typescript
// Athlete (hardcoded for testing)
email: 'demo@athlete.com'
password: 'demo123'

// Coach (requires database)
// Use signup flow or seed data
```

### Testing Protected Routes

1. Access `/coach/readiness` without auth → Redirects to `/auth/signin`
2. Sign in as ATHLETE → Cannot access `/coach/*` routes
3. Sign in as COACH → Full access to coach features

### Testing API Protection

```bash
# Without auth - 401 Unauthorized
curl http://localhost:3000/api/performance/record

# With ATHLETE auth - 403 Forbidden
curl -H "Cookie: ..." http://localhost:3000/api/performance/record

# With COACH auth - Success
curl -X POST -H "Cookie: ..." -d '{"athleteId":"..."}' http://localhost:3000/api/performance/record
```

## Compliance (FERPA)

All coach access to athlete data is logged via:
- Middleware logs requests
- API routes create AuditLog records
- 3-year retention for compliance

See `prisma/schema.prisma` → `AuditLog` model.
