# Task 8: Testing

## Context
You are implementing Story 6.4, Task 8 of the Pleeno payment tracking system.

**Story:** As an Agency User, I want to see a feed of recent activity in the system, so that I'm aware of what's happening and can stay in sync with my team.

**This Task:** Write comprehensive test suite covering API routes, activity logger utility, React components, and end-to-end integration.

## Acceptance Criteria
- All AC (#1-8): Comprehensive test coverage ensures all acceptance criteria are met

## Requirements

Write tests for:

1. **API Route Tests** (`apps/dashboard/app/api/activity-log/__tests__/route.test.ts`)
   - Activity log query returns most recent 20 activities
   - Activities ordered by created_at DESC
   - RLS filtering by agency_id
   - User name join (handle null users)
   - Limit parameter validation
   - Caching headers

2. **Activity Logger Utility Tests** (`packages/database/src/__tests__/activity-logger.test.ts`)
   - logActivity creates activity_log record
   - Description formatting with metadata
   - Null user_id handling (system actions)
   - Error handling (graceful failure)

3. **Component Tests** (`apps/dashboard/app/components/__tests__/*.test.tsx`)
   - ActivityFeed renders with mock data
   - Relative timestamps display correctly
   - Icons display per entity_type
   - Clickable activities navigate correctly
   - Loading state (skeleton)
   - Error state with retry
   - Empty state (no activities)
   - Auto-refresh behavior

4. **Integration Tests** (`__tests__/e2e/activity-feed.spec.ts`)
   - Dashboard loads → Activity feed displays
   - Perform action (record payment) → New activity appears in feed
   - Click activity → Navigate to detail page
   - Auto-refresh functionality
   - Cross-browser compatibility

## Technical Constraints

- **Testing Framework:** Vitest for unit tests, Playwright for E2E
- **Coverage Target:** 80%+ code coverage
- **Mocking:** Mock Supabase client, fetch API, TanStack Query
- **Test Data:** Use fixtures for consistent test data

## Implementation

### 1. API Route Tests

```typescript
// apps/dashboard/app/api/activity-log/__tests__/route.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { createClient } from '@supabase/supabase-js'

vi.mock('@supabase/supabase-js')

describe('GET /api/activity-log', () => {
  const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          entity_type: 'student',
          entity_id: 'student-1',
          action: 'created',
          description: 'Test created student John Doe',
          metadata: { student_name: 'John Doe' },
          created_at: '2025-11-13T10:00:00Z',
          users: { id: 'user-1', name: 'Test User', email: 'test@example.com' }
        }
      ],
      error: null
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockSupabaseClient)
  })

  it('should return most recent 20 activities by default', async () => {
    const request = new Request('http://localhost/api/activity-log')
    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toBeInstanceOf(Array)
    expect(mockSupabaseClient.limit).toHaveBeenCalledWith(20)
  })

  it('should respect limit parameter', async () => {
    const request = new Request('http://localhost/api/activity-log?limit=5')
    await GET(request)

    expect(mockSupabaseClient.limit).toHaveBeenCalledWith(5)
  })

  it('should cap limit at 100', async () => {
    const request = new Request('http://localhost/api/activity-log?limit=500')
    await GET(request)

    expect(mockSupabaseClient.limit).toHaveBeenCalledWith(100)
  })

  it('should order by created_at DESC', async () => {
    const request = new Request('http://localhost/api/activity-log')
    await GET(request)

    expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('should handle null user (system actions)', async () => {
    mockSupabaseClient.limit.mockResolvedValue({
      data: [
        {
          id: '1',
          entity_type: 'installment',
          entity_id: 'installment-1',
          action: 'marked_overdue',
          description: 'System marked installment as overdue',
          metadata: { amount: 500 },
          created_at: '2025-11-13T10:00:00Z',
          users: null
        }
      ],
      error: null
    })

    const request = new Request('http://localhost/api/activity-log')
    const response = await GET(request)
    const data = await response.json()

    expect(data.data[0].user).toBeNull()
  })

  it('should return 500 on database error', async () => {
    mockSupabaseClient.limit.mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    })

    const request = new Request('http://localhost/api/activity-log')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })

  it('should set cache headers', async () => {
    const request = new Request('http://localhost/api/activity-log')
    const response = await GET(request)

    const cacheControl = response.headers.get('Cache-Control')
    expect(cacheControl).toContain('s-maxage=60')
  })
})
```

### 2. Activity Logger Utility Tests

```typescript
// packages/database/src/__tests__/activity-logger.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logActivity } from '../activity-logger'
import { createClient } from '@supabase/supabase-js'

vi.mock('@supabase/supabase-js')

describe('logActivity', () => {
  const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockSupabaseClient)
  })

  it('should insert activity log with all parameters', async () => {
    await logActivity({
      agency_id: 'agency-123',
      user_id: 'user-123',
      entity_type: 'student',
      entity_id: 'student-123',
      action: 'created',
      description: 'Test created student John Doe',
      metadata: { student_name: 'John Doe' }
    })

    expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
      agency_id: 'agency-123',
      user_id: 'user-123',
      entity_type: 'student',
      entity_id: 'student-123',
      action: 'created',
      description: 'Test created student John Doe',
      metadata: { student_name: 'John Doe' }
    })
  })

  it('should handle null user_id for system actions', async () => {
    await logActivity({
      agency_id: 'agency-123',
      user_id: null,
      entity_type: 'installment',
      entity_id: 'installment-123',
      action: 'marked_overdue',
      description: 'System marked installment as overdue',
      metadata: { amount: 500 }
    })

    expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: null })
    )
  })

  it('should not throw error on insert failure', async () => {
    mockSupabaseClient.insert.mockResolvedValue({
      error: { message: 'Insert failed' }
    })

    await expect(logActivity({
      agency_id: 'agency-123',
      user_id: 'user-123',
      entity_type: 'student',
      entity_id: 'student-123',
      action: 'created',
      description: 'Test',
      metadata: {}
    })).resolves.not.toThrow()
  })

  it('should log error to console on failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSupabaseClient.insert.mockResolvedValue({
      error: { message: 'Insert failed' }
    })

    await logActivity({
      agency_id: 'agency-123',
      user_id: 'user-123',
      entity_type: 'student',
      entity_id: 'student-123',
      action: 'created',
      description: 'Test',
      metadata: {}
    })

    expect(consoleSpy).toHaveBeenCalledWith('Failed to log activity:', expect.any(Object))
    consoleSpy.mockRestore()
  })
})
```

### 3. Component Tests

#### ActivityFeed Tests

```typescript
// apps/dashboard/app/components/__tests__/ActivityFeed.test.tsx

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ActivityFeed } from '../ActivityFeed'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
})

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('ActivityFeed', () => {
  it('should render loading skeleton initially', () => {
    render(<ActivityFeed />, { wrapper })
    // Verify skeleton elements present
    expect(screen.getByTestId('activity-feed-skeleton')).toBeInTheDocument()
  })

  it('should render activities after loading', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            description: 'Test created student John Doe',
            user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
            entity_type: 'student',
            entity_id: 'student-1',
            action: 'created',
            metadata: {}
          }
        ]
      })
    })

    render(<ActivityFeed />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test created student John Doe')).toBeInTheDocument()
      expect(screen.getByText(/Test User/)).toBeInTheDocument()
    })
  })

  it('should show empty state when no activities', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] })
    })

    render(<ActivityFeed />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })
  })

  it('should show error state on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<ActivityFeed />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Unable to load recent activity')).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })
  })
})
```

#### ActivityCard Tests

```typescript
// apps/dashboard/app/components/__tests__/ActivityCard.test.tsx

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityCard } from '../ActivityCard'

describe('ActivityCard', () => {
  it('should render activity with user', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'Test created student John Doe',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'student',
      entity_id: 'student-1',
      action: 'created',
      metadata: {}
    }

    render(<ActivityCard activity={activity} />)

    expect(screen.getByText('Test created student John Doe')).toBeInTheDocument()
    expect(screen.getByText(/Test User/)).toBeInTheDocument()
    expect(screen.getByText('👤')).toBeInTheDocument()
  })

  it('should render "System" for null user', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'System marked installment as overdue',
      user: null,
      entity_type: 'installment',
      entity_id: 'installment-1',
      action: 'marked_overdue',
      metadata: {}
    }

    render(<ActivityCard activity={activity} />)

    expect(screen.getByText(/System/)).toBeInTheDocument()
    expect(screen.getByText('⚠️')).toBeInTheDocument()
  })

  it('should show relative timestamp', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const activity = {
      id: '1',
      timestamp: oneHourAgo,
      description: 'Test activity',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'student',
      entity_id: 'student-1',
      action: 'created',
      metadata: {}
    }

    render(<ActivityCard activity={activity} />)

    expect(screen.getByText(/about 1 hour ago/i)).toBeInTheDocument()
  })

  it('should link to correct detail page', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'Test activity',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'student',
      entity_id: 'student-123',
      action: 'created',
      metadata: {}
    }

    render(<ActivityCard activity={activity} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/entities/students/student-123')
  })
})
```

### 4. Integration Tests (E2E)

```typescript
// __tests__/e2e/activity-feed.spec.ts

import { test, expect } from '@playwright/test'
import { login, createStudent } from './helpers'

test.describe('Activity Feed', () => {
  test('dashboard displays activity feed', async ({ page }) => {
    await page.goto('/login')
    await login(page)
    await page.goto('/dashboard')

    // Verify activity feed renders
    await expect(page.getByText('Recent Activity')).toBeVisible()
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible()
  })

  test('new activity appears in feed after action', async ({ page }) => {
    await page.goto('/login')
    await login(page)

    // Create student
    await page.goto('/entities/students/new')
    await createStudent(page, { name: 'Test Student' })

    // Go to dashboard
    await page.goto('/dashboard')

    // Verify activity appears
    await expect(page.getByText(/added new student Test Student/)).toBeVisible()
  })

  test('clicking activity navigates to detail page', async ({ page }) => {
    await page.goto('/login')
    await login(page)

    // Create student to generate activity
    await page.goto('/entities/students/new')
    await createStudent(page, { name: 'Test Student' })

    // Go to dashboard
    await page.goto('/dashboard')

    // Click activity
    await page.getByText(/added new student Test Student/).click()

    // Verify navigation to student detail page
    await expect(page).toHaveURL(/\/entities\/students\/[a-z0-9-]+/)
  })

  test('activity feed auto-refreshes', async ({ page }) => {
    await page.goto('/login')
    await login(page)
    await page.goto('/dashboard')

    // Get initial activity count
    const initialActivities = await page.locator('[data-testid="activity-card"]').count()

    // Perform action in another tab
    const newPage = await page.context().newPage()
    await newPage.goto('/login')
    await login(newPage)
    await newPage.goto('/entities/students/new')
    await createStudent(newPage, { name: 'New Test Student' })
    await newPage.close()

    // Wait for auto-refresh (60 seconds max)
    await page.waitForTimeout(65000)

    // Verify new activity appeared
    const newActivities = await page.locator('[data-testid="activity-card"]').count()
    expect(newActivities).toBeGreaterThan(initialActivities)
  })

  test('activity feed responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    await login(page)
    await page.goto('/dashboard')

    // Verify activity feed visible
    await expect(page.getByText('Recent Activity')).toBeVisible()

    // Verify stacked layout (feed below widgets)
    const feed = page.locator('[data-testid="activity-feed"]')
    const boundingBox = await feed.boundingBox()
    expect(boundingBox?.width).toBeLessThan(400)
  })
})
```

## Test Fixtures

Create shared fixtures for consistent test data:

```typescript
// __tests__/fixtures/activities.ts

export const mockActivities = [
  {
    id: '1',
    timestamp: '2025-11-13T10:00:00Z',
    description: 'Test created student John Doe',
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    entity_type: 'student',
    entity_id: 'student-1',
    action: 'created',
    metadata: { student_name: 'John Doe' }
  },
  {
    id: '2',
    timestamp: '2025-11-13T09:00:00Z',
    description: 'System marked installment $500 as overdue for Jane Smith',
    user: null,
    entity_type: 'installment',
    entity_id: 'installment-1',
    action: 'marked_overdue',
    metadata: { student_name: 'Jane Smith', amount: 500 }
  }
]
```

## Coverage Requirements

Target 80%+ coverage for:
- API routes: 90%+
- Activity logger: 100%
- React components: 80%+
- Integration tests: Key user flows covered

Run coverage:
```bash
npm run test:coverage
```

## Dependencies

- vitest
- @testing-library/react
- @testing-library/user-event
- @playwright/test
- @tanstack/react-query

## References

- [Vitest Docs](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Docs](https://playwright.dev/)
- [Story: 6.4 Recent Activity Feed](.bmad-ephemeral/stories/6-4-recent-activity-feed.md)
