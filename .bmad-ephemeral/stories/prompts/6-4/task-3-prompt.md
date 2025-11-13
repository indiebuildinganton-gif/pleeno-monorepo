# Story 6-4: Recent Activity Feed - Task 3

## Story Context

**As an** Agency User
**I want** to see a feed of recent activity in the system
**So that** I'm aware of what's happening and can stay in sync with my team

## Task 3: Create Activity Feed API Route

**Acceptance Criteria**: #1, 7-8

### Task Description

Create an API endpoint that retrieves the most recent 20 activities for the current agency, including user information and formatted for display in the dashboard.

### Subtasks

- [ ] Create API route: `GET /api/activity-log?limit=20`
- [ ] Query `activity_log` table:
  - Filter by `agency_id` (auto-applied via RLS)
  - Join with `users` table to get user name (LEFT JOIN, nullable)
  - Order by `created_at DESC`
  - Limit to 20 most recent activities
- [ ] Return formatted response:
  ```typescript
  interface Activity {
    id: string
    timestamp: string
    action: string
    description: string
    user: { id: string; name: string } | null
    entity_type: string
    entity_id: string
    metadata: Record<string, any>
  }
  ```
- [ ] Apply 1-minute cache for performance (frequent dashboard access)
- [ ] Test: Verify only current agency's activities returned

## Context from Previous Tasks

**Task 1 Completed**: Database schema created with RLS policies and indexes
**Task 2 Completed**: Activity logging utility created and integrated into API routes

The activity_log table is now being populated with activities from various actions. This task creates the API to retrieve and display those activities.

## Key Constraints

- **API**: Activity feed API must apply 1-minute cache for performance (frequent dashboard access)
- **Security**: All activity_log queries MUST respect RLS policies - use server-side Supabase client with JWT auth
- **Testing**: All database queries must be tested with RLS verification to ensure no cross-agency data leakage

## Relevant Interfaces

**GET /api/activity-log**:
```typescript
GET /api/activity-log?limit=20
Response: Activity[]

interface Activity {
  id: string
  timestamp: string
  action: string
  description: string
  user: { id: string; name: string } | null
  entity_type: 'payment' | 'payment_plan' | 'student' | 'enrollment' | 'installment'
  entity_id: string
  metadata: Record<string, any>
}
```

**Path**: apps/dashboard/app/api/activity-log/route.ts

## Dependencies

- **Next.js** (15.x): Framework for React Server Components and API routes
- **@supabase/supabase-js** (latest): Database client for PostgreSQL with RLS
- **@supabase/ssr** (latest): Server-side Supabase authentication
- **zod** (4.x): TypeScript-first validation for API requests

## Reference Documentation

- [docs/architecture.md](docs/architecture.md) - Dashboard Zone section for API route patterns
- [.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md](.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md) - Similar API route patterns

## Implementation Guide

### 1. Create API Route

**File**: `apps/dashboard/app/api/activity-log/route.ts`

### 2. Database Query

Use the following SQL pattern:

```sql
SELECT
  activity_log.id,
  activity_log.entity_type,
  activity_log.entity_id,
  activity_log.action,
  activity_log.description,
  activity_log.metadata,
  activity_log.created_at,
  users.id AS user_id,
  users.name AS user_name,
  users.email AS user_email
FROM activity_log
LEFT JOIN users ON activity_log.user_id = users.id
WHERE activity_log.agency_id = auth.uid()  -- RLS auto-applied
ORDER BY activity_log.created_at DESC
LIMIT 20;
```

### 3. Response Formatting

Transform the database results into the Activity interface:
- Map `created_at` to `timestamp`
- Combine user fields into user object (or null if system action)
- Include all metadata as-is

### 4. Caching

Apply caching headers for 1-minute cache:
```typescript
export const revalidate = 60 // Next.js revalidation in seconds
```

### 5. Error Handling

- Handle database connection errors
- Handle authentication errors (missing JWT)
- Return appropriate HTTP status codes
- Provide clear error messages

### 6. Testing Approach

Create tests to verify:
- Correct query structure with LEFT JOIN
- RLS filtering (only current agency's activities)
- Limit of 20 activities enforced
- Activities ordered by created_at DESC
- Null user handling (system actions)
- Cache headers present

## Example Implementation Structure

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const revalidate = 60 // 1-minute cache

export async function GET(request: NextRequest) {
  try {
    // 1. Create authenticated Supabase client
    // 2. Query activity_log with LEFT JOIN to users
    // 3. Apply limit parameter (default 20)
    // 4. Transform results to Activity interface
    // 5. Return JSON response
  } catch (error) {
    // Handle errors appropriately
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}
```

## Manifest Update Instructions

**Before starting**: Read the current manifest at `docs/stories/prompts/6-4/manifest.md`

**After completing this task**:
1. Update Task 2 status to "Completed" with today's date (if not already done)
2. Update Task 3 status to "Completed" with today's date
3. Add implementation notes about:
   - API route location
   - Caching strategy implemented
   - Any query optimizations made

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-4/manifest.md`
2. **Proceed to Task 4**: Open `task-4-prompt.md` to create the ActivityFeed React component
3. **Verify**: Test the API endpoint directly to ensure it returns activities correctly

---

**Progress**: Task 3 of 8. The backend is complete - database, logging, and API. Next we build the frontend components.
