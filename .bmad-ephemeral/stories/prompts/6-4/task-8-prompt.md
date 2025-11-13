# Story 6-4: Recent Activity Feed - Task 8

## Story Context

**As an** Agency User
**I want** to see a feed of recent activity in the system
**So that** I'm aware of what's happening and can stay in sync with my team

## Task 8: Testing

**Acceptance Criteria**: All

### Task Description

Write comprehensive tests covering all aspects of the activity feed feature: database queries, API routes, utility functions, React components, and end-to-end flows.

### Subtasks

- [ ] Write API route unit tests:
  - Test activity log query returns most recent 20 activities
  - Test activities ordered by created_at DESC
  - Test RLS filtering by agency_id
  - Test user name join (handle null users)
  - Test limit parameter
- [ ] Write activity logger utility tests:
  - Test logActivity creates activity_log record
  - Test description formatting with metadata
  - Test null user_id handling (system actions)
- [ ] Write component tests using React Testing Library:
  - Test ActivityFeed renders with mock data
  - Test relative timestamps display correctly
  - Test icons display per entity_type
  - Test clickable activities navigate correctly
  - Test loading state (skeleton)
  - Test error state with retry
  - Test empty state (no activities)
- [ ] Write integration test:
  - Dashboard loads → Activity feed displays
  - Perform action (record payment) → New activity appears in feed
  - Click activity → Navigate to detail page
- [ ] Test auto-refresh:
  - Wait 60 seconds → Feed refetches automatically
  - Switch tabs → Feed refetches on return

## Context from Previous Tasks

**All previous tasks completed**:
- Task 1: Database schema with RLS
- Task 2: Activity logging utility and integration
- Task 3: Activity Feed API route
- Task 4: ActivityFeed component
- Task 5: Auto-refresh functionality
- Task 6: Clickable navigation
- Task 7: Dashboard integration

This final task ensures everything works correctly and reliably.

## Key Constraints

- **Testing**: Testing framework: Vitest for unit tests, React Testing Library for component tests, Playwright for E2E tests
- **Testing**: All tests must verify RLS policies prevent cross-agency data access
- **Testing**: Mock Supabase client in unit tests using vi.mock()
- **Testing**: Component tests should use MSW for API mocking
- **Testing**: E2E tests should create isolated test data per agency

## Test Locations

- `apps/dashboard/app/api/activity-log/route.test.ts`
- `packages/database/src/activity-logger.test.ts`
- `apps/dashboard/app/components/ActivityFeed.test.tsx`
- `e2e/activity-feed.spec.ts`

## Dependencies

- **vitest** (latest): Fast unit testing framework
- **@testing-library/react** (latest): Component testing utilities
- **playwright** (latest): End-to-end testing

## Reference Documentation

- [.bmad-ephemeral/stories/6-4-recent-activity-feed.md](.bmad-ephemeral/stories/6-4-recent-activity-feed.md) - Testing standards and ideas

## Implementation Guide

### 1. API Route Tests

**File**: `apps/dashboard/app/api/activity-log/route.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { createServerClient } from '@supabase/ssr'

// Mock Supabase client
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn()
}))

describe('Activity Log API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return most recent 20 activities', async () => {
    const mockActivities = Array.from({ length: 20 }, (_, i) => ({
      id: `activity-${i}`,
      entity_type: 'payment',
      created_at: new Date().toISOString()
    }))

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockActivities,
              error: null
            })
          })
        })
      })
    }

    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const request = new Request('http://localhost/api/activity-log?limit=20')
    const response = await GET(request)
    const data = await response.json()

    expect(data).toHaveLength(20)
  })

  it('should order activities by created_at DESC', async () => {
    // Test ordering logic
    // Verify query calls .order('created_at', { ascending: false })
  })

  it('should handle null user_id for system actions', async () => {
    const mockActivity = {
      id: 'activity-1',
      user_id: null,
      entity_type: 'installment',
      description: 'System marked installment as overdue'
    }

    // Mock and verify null user handling
  })

  it('should respect RLS filtering by agency_id', async () => {
    // Verify RLS policy is applied
    // Mock JWT with specific agency_id
    // Ensure only that agency's activities returned
  })

  it('should include user name from LEFT JOIN', async () => {
    const mockActivity = {
      id: 'activity-1',
      user_id: 'user-123',
      user: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com'
      }
    }

    // Verify user data is joined correctly
  })
})
```

### 2. Activity Logger Utility Tests

**File**: `packages/database/src/activity-logger.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logActivity } from './activity-logger'

describe('Activity Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create activity_log record with all fields', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })
    }

    await logActivity(
      'agency-123',
      'user-456',
      'payment',
      'payment-789',
      'recorded',
      'John recorded payment of $500 for Student XYZ',
      { student_name: 'Student XYZ', amount: 500 }
    )

    expect(mockSupabase.from).toHaveBeenCalledWith('activity_log')
    expect(mockSupabase.from().insert).toHaveBeenCalledWith({
      agency_id: 'agency-123',
      user_id: 'user-456',
      entity_type: 'payment',
      entity_id: 'payment-789',
      action: 'recorded',
      description: 'John recorded payment of $500 for Student XYZ',
      metadata: { student_name: 'Student XYZ', amount: 500 }
    })
  })

  it('should handle null user_id for system actions', async () => {
    // Test with user_id: null
    // Verify insert is called with null user_id
  })

  it('should format description with metadata', async () => {
    // Test description formatting
    // Verify metadata is stored correctly
  })

  it('should handle errors gracefully', async () => {
    // Mock database error
    // Verify error handling and logging
  })
})
```

### 3. Component Tests

**File**: `apps/dashboard/app/components/ActivityFeed.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ActivityFeed } from './ActivityFeed'

// Mock MSW for API calls
import { setupServer } from 'msw/node'
import { rest } from 'msw'

const server = setupServer(
  rest.get('/api/activity-log', (req, res, ctx) => {
    return res(ctx.json([
      {
        id: 'activity-1',
        timestamp: new Date().toISOString(),
        description: 'John recorded payment of $500 for Student XYZ',
        user: { id: 'user-1', name: 'John Doe' },
        entity_type: 'payment',
        entity_id: 'payment-1',
        metadata: {}
      }
    ]))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('ActivityFeed Component', () => {
  const queryClient = new QueryClient()

  it('should render with mock activity data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ActivityFeed />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/John recorded payment/)).toBeInTheDocument()
    })
  })

  it('should display relative timestamps correctly', async () => {
    // Test "2 hours ago", "yesterday" formatting
    // Use date-fns formatDistanceToNow
  })

  it('should display correct icon per entity_type', async () => {
    // Render activities with different entity_types
    // Verify correct emoji/icon displayed
  })

  it('should show loading state with skeleton', () => {
    // Delay API response
    // Verify skeleton is displayed
  })

  it('should show error state with retry button', async () => {
    server.use(
      rest.get('/api/activity-log', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    render(
      <QueryClientProvider client={queryClient}>
        <ActivityFeed />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Unable to load/)).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })
  })

  it('should show empty state when no activities', async () => {
    server.use(
      rest.get('/api/activity-log', (req, res, ctx) => {
        return res(ctx.json([]))
      })
    )

    render(
      <QueryClientProvider client={queryClient}>
        <ActivityFeed />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/No recent activity/)).toBeInTheDocument()
    })
  })

  it('should navigate correctly when activity is clicked', async () => {
    // Mock Next.js router
    // Render ActivityFeed
    // Click on activity
    // Verify navigation to correct URL
  })
})
```

### 4. Auto-Refresh Tests

```typescript
describe('ActivityFeed Auto-Refresh', () => {
  it('should refetch activities every 60 seconds', async () => {
    vi.useFakeTimers()

    const fetchSpy = vi.fn()
    server.use(
      rest.get('/api/activity-log', (req, res, ctx) => {
        fetchSpy()
        return res(ctx.json([]))
      })
    )

    render(
      <QueryClientProvider client={queryClient}>
        <ActivityFeed />
      </QueryClientProvider>
    )

    // Initial fetch
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Advance 60 seconds
    vi.advanceTimersByTime(60000)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    vi.useRealTimers()
  })

  it('should refetch when window regains focus', async () => {
    // Render component
    // Trigger window focus event
    // Verify fetch was called again
  })
})
```

### 5. Integration Tests (E2E)

**File**: `e2e/activity-feed.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Activity Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should display activity feed on dashboard', async ({ page }) => {
    await expect(page.getByText('Recent Activity')).toBeVisible()
  })

  test('should show new activity after performing action', async ({ page }) => {
    // Navigate to payments page
    await page.goto('/payments')

    // Record a payment
    await page.click('button:has-text("Record Payment")')
    await page.fill('input[name="amount"]', '500')
    await page.click('button:has-text("Submit")')

    // Navigate back to dashboard
    await page.goto('/dashboard')

    // Verify new activity appears
    await expect(page.getByText(/recorded payment of/)).toBeVisible()
  })

  test('should navigate to detail page when activity clicked', async ({ page }) => {
    // Find first activity card
    const activityCard = page.locator('[data-testid="activity-card"]').first()

    // Click it
    await activityCard.click()

    // Verify navigation (URL or page content)
    await expect(page).toHaveURL(/\/payments\/plans\/|\/entities\/students\//)
  })

  test('should auto-refresh after 60 seconds', async ({ page }) => {
    // Get initial activity count
    const initialCount = await page.locator('[data-testid="activity-card"]').count()

    // Wait 60 seconds (or mock time)
    await page.waitForTimeout(60000)

    // Activity count may change if new activities logged
    // At minimum, verify no errors and feed is still functional
    await expect(page.getByText('Recent Activity')).toBeVisible()
  })
})
```

### 6. RLS Security Tests

```typescript
describe('RLS Security', () => {
  it('should prevent cross-agency data access', async () => {
    // Create test data for Agency A
    // Authenticate as user from Agency B
    // Query activity_log
    // Verify Agency A's data is not returned
  })

  it('should filter activities by agency_id automatically', async () => {
    // Create activities for multiple agencies
    // Authenticate as specific agency user
    // Verify only that agency's activities returned
  })
})
```

## Test Coverage Goals

Aim for:
- **Unit tests**: 90%+ coverage for utility functions and API routes
- **Component tests**: 80%+ coverage for React components
- **Integration tests**: All critical user flows covered
- **RLS tests**: All RLS policies verified

## Manifest Update Instructions

**Before starting**: Read the current manifest at `docs/stories/prompts/6-4/manifest.md`

**After completing this task**:
1. Update Task 7 status to "Completed" with today's date (if not already done)
2. Update Task 8 status to "Completed" with today's date
3. Update Story status to "Completed" with today's date
4. Add implementation notes about:
   - Test coverage achieved
   - Any edge cases discovered during testing
   - Known limitations or future improvements

## Final Verification

Before marking the story complete:

✅ All 8 tasks completed
✅ Database schema created with RLS
✅ Activity logging integrated into all API routes
✅ Activity Feed API route working
✅ ActivityFeed component rendering correctly
✅ Auto-refresh functioning every 60 seconds
✅ Activities are clickable with correct navigation
✅ Integrated into dashboard page
✅ Comprehensive tests written and passing
✅ All acceptance criteria met
✅ No regressions in existing features

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-4/manifest.md` - mark story complete
2. **Run all tests** and verify they pass
3. **Perform manual testing** on dev/staging environment
4. **Update story status** in `.bmad-ephemeral/sprint-status.yaml` to DONE
5. **Celebrate!** 🎉 Story 6-4 is complete

---

**Progress**: Task 8 of 8 - FINAL TASK. The feature is complete and tested!
