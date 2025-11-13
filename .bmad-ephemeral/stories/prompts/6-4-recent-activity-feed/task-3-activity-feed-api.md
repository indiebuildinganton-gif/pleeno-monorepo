# Task 3: Create Activity Feed API Route

## Context
You are implementing Story 6.4, Task 3 of the Pleeno payment tracking system.

**Story:** As an Agency User, I want to see a feed of recent activity in the system, so that I'm aware of what's happening and can stay in sync with my team.

**This Task:** Create API route `GET /api/activity-log?limit=20` that returns recent activities with user information.

## Acceptance Criteria
- AC #1, 7-8: API returns chronological feed with timestamps, descriptions, and user info

## Requirements

Create API route at `apps/dashboard/app/api/activity-log/route.ts` that:

1. **Accepts query parameters:**
   - `limit` (optional, default: 20, max: 100): Number of activities to return

2. **Queries database:**
   - Fetch from `activity_log` table (RLS auto-filters by agency_id)
   - LEFT JOIN with `users` table to get user name (handles null user_id for system actions)
   - Order by `created_at DESC` (most recent first)
   - Limit to requested number (default 20)

3. **Returns JSON response:**
   ```typescript
   {
     success: true,
     data: Activity[]
   }

   interface Activity {
     id: string
     timestamp: string // ISO 8601 format
     action: string
     description: string
     user: { id: string; name: string; email: string } | null
     entity_type: string
     entity_id: string
     metadata: Record<string, any>
   }
   ```

4. **Implements caching:**
   - 1-minute cache for performance (frequent dashboard access)
   - Use Next.js `revalidate` or Response headers

5. **Handles errors:**
   - Return 401 if not authenticated
   - Return 500 with error message if query fails
   - Return empty array if no activities found (not an error)

## Technical Constraints

- **Architecture:** Dashboard zone at `apps/dashboard/` with basePath `/dashboard`
- **Security:** Use server-side Supabase client, RLS enforces agency_id filtering
- **Performance:** 1-minute cache, use LEFT JOIN to avoid N+1 queries
- **Database:** Query uses idx_activity_log_agency_created index for performance

## Implementation

### API Route Structure

```typescript
// apps/dashboard/app/api/activity-log/route.ts

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 60 // Cache for 1 minute

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limitParam = searchParams.get('limit')
    const limit = Math.min(
      parseInt(limitParam || '20', 10),
      100 // Max 100 activities
    )

    // Get authenticated user session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Get session from request cookies
    const session = await getSession(request) // Implement session helper
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Query activity_log with user join
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select(`
        id,
        entity_type,
        entity_id,
        action,
        description,
        metadata,
        created_at,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .eq('agency_id', session.user.agency_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Activity log query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }

    // Transform response
    const transformedActivities = activities.map((activity) => ({
      id: activity.id,
      timestamp: activity.created_at,
      action: activity.action,
      description: activity.description,
      user: activity.users || null, // null for system actions
      entity_type: activity.entity_type,
      entity_id: activity.entity_id,
      metadata: activity.metadata || {}
    }))

    return NextResponse.json(
      { success: true, data: transformedActivities },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
        }
      }
    )
  } catch (err) {
    console.error('Activity feed API error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Database Query

### SQL Equivalent (for reference)

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
WHERE activity_log.agency_id = $1  -- RLS auto-applied
ORDER BY activity_log.created_at DESC
LIMIT $2;
```

### Query Performance Considerations

- **Index usage:** Query will use `idx_activity_log_agency_created` index
- **LEFT JOIN:** Single join, no N+1 queries
- **Limit:** Restricts rows returned for performance
- **RLS:** Agency filtering happens at database level (automatic)

## Testing Requirements

### Unit Tests

Create `apps/dashboard/app/api/activity-log/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { GET } from '../route'

describe('GET /api/activity-log', () => {
  it('should return most recent 20 activities by default', async () => {
    const mockRequest = new Request('http://localhost/api/activity-log')
    const response = await GET(mockRequest)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toBeInstanceOf(Array)
    expect(data.data.length).toBeLessThanOrEqual(20)
  })

  it('should respect limit parameter', async () => {
    const mockRequest = new Request('http://localhost/api/activity-log?limit=5')
    const response = await GET(mockRequest)
    const data = await response.json()

    expect(data.data.length).toBeLessThanOrEqual(5)
  })

  it('should limit to max 100 activities', async () => {
    const mockRequest = new Request('http://localhost/api/activity-log?limit=500')
    const response = await GET(mockRequest)
    const data = await response.json()

    expect(data.data.length).toBeLessThanOrEqual(100)
  })

  it('should return activities ordered by created_at DESC', async () => {
    const mockRequest = new Request('http://localhost/api/activity-log')
    const response = await GET(mockRequest)
    const data = await response.json()

    const timestamps = data.data.map((a: any) => new Date(a.timestamp).getTime())
    const sortedTimestamps = [...timestamps].sort((a, b) => b - a)

    expect(timestamps).toEqual(sortedTimestamps)
  })

  it('should handle null user (system actions)', async () => {
    // Mock activity with null user_id
    const mockRequest = new Request('http://localhost/api/activity-log')
    const response = await GET(mockRequest)
    const data = await response.json()

    const systemActivity = data.data.find((a: any) => a.user === null)
    expect(systemActivity).toBeDefined()
    expect(systemActivity.user).toBeNull()
  })

  it('should return 401 if not authenticated', async () => {
    // Mock unauthenticated request
    const mockRequest = new Request('http://localhost/api/activity-log')
    // Mock session to return null

    const response = await GET(mockRequest)
    expect(response.status).toBe(401)
  })

  it('should set cache headers', async () => {
    const mockRequest = new Request('http://localhost/api/activity-log')
    const response = await GET(mockRequest)

    const cacheControl = response.headers.get('Cache-Control')
    expect(cacheControl).toContain('s-maxage=60')
  })
})
```

### Integration Tests

Test with Playwright:

```typescript
test('activity feed API returns recent activities', async ({ page }) => {
  // Login
  await page.goto('/login')
  await login(page)

  // Perform an action (create student)
  await createStudent(page, { name: 'Test Student' })

  // Query activity feed API
  const response = await page.request.get('/api/activity-log?limit=20')
  const data = await response.json()

  expect(data.success).toBe(true)
  expect(data.data.length).toBeGreaterThan(0)

  // Verify recent activity includes student creation
  const recentActivity = data.data[0]
  expect(recentActivity.entity_type).toBe('student')
  expect(recentActivity.action).toBe('created')
  expect(recentActivity.description).toContain('Test Student')
})
```

## Implementation Notes

### Session Helper

You'll need a helper to extract session from request cookies:

```typescript
// apps/dashboard/lib/auth.ts

import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function getSession(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { session } } = await supabase.auth.getSession()
  return session
}
```

### Caching Strategy

- **Next.js Revalidate:** `export const revalidate = 60` (60 seconds)
- **Response Headers:** `Cache-Control: public, s-maxage=60, stale-while-revalidate=30`
- **CDN Caching:** Response cached at CDN edge for 60 seconds
- **Stale-While-Revalidate:** Serve stale content while fetching fresh data

### Response Format Notes

- `timestamp`: ISO 8601 format (e.g., "2025-11-13T10:30:00Z")
- `user`: null for system actions (e.g., overdue detection)
- `metadata`: Flexible JSON object with context (student_name, amount, etc.)
- `entity_id`: UUID of the affected entity

## Dependencies

- @supabase/supabase-js
- @supabase/ssr
- next (for API route)

## References

- [Architecture: Dashboard Endpoints API](docs/architecture.md#Dashboard-Endpoints-API)
- [Architecture: Multi-Tenant Isolation](docs/architecture.md#Multi-Tenant-Isolation-RLS)
- [Story: 6.4 Recent Activity Feed](.bmad-ephemeral/stories/6-4-recent-activity-feed.md)
- [Dev Notes: Database Query Logic](.bmad-ephemeral/stories/6-4-recent-activity-feed.md#Database-Query-Logic)
