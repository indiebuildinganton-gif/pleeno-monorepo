# Task 4: Create ActivityFeed Component

## Context
You are implementing Story 6.4, Task 4 of the Pleeno payment tracking system.

**Story:** As an Agency User, I want to see a feed of recent activity in the system, so that I'm aware of what's happening and can stay in sync with my team.

**This Task:** Create React components `ActivityFeed` and `ActivityCard` to display recent activities with icons, timestamps, and user information.

## Acceptance Criteria
- AC #1, 7-8: Feed displays activities with relative timestamps, descriptions, user names, and appropriate icons

## Requirements

### Component 1: ActivityFeed

Create component at `apps/dashboard/app/components/ActivityFeed.tsx`:

1. **Fetches activities** using TanStack Query from `/api/activity-log?limit=20`

2. **Displays activities** in chronological list (most recent first)

3. **Handles states:**
   - Loading: Show skeleton loader (3-4 placeholder cards)
   - Error: Show error message with retry button
   - Empty: Show "No recent activity" message
   - Success: Render ActivityCard for each activity

4. **Shows "View More" button** at bottom (links to future full activity log page)

5. **Responsive layout:** Stacks on mobile, grid on desktop

### Component 2: ActivityCard

Create component at `apps/dashboard/app/components/ActivityCard.tsx`:

1. **Displays activity information:**
   - Icon (based on entity_type)
   - Description (action text)
   - User name (or "System" if null)
   - Relative timestamp ("2 hours ago", "yesterday")

2. **Styling:**
   - Card layout with hover effect
   - Icon, description, and metadata in flex layout
   - Subtle border and rounded corners
   - Responsive text sizing

3. **Icon mapping:**
   - `payment`: 💰
   - `payment_plan`: 📋
   - `student`: 👤
   - `enrollment`: 🏫
   - `installment`: ⚠️

## Technical Constraints

- **Architecture:** Dashboard zone component at `apps/dashboard/app/components/`
- **State Management:** TanStack Query for data fetching
- **Styling:** Shadcn UI components and Tailwind CSS
- **Date Formatting:** Use date-fns `formatDistanceToNow` for relative timestamps
- **Performance:** TanStack Query caching (1-minute stale time)

## Implementation

### ActivityFeed Component

```typescript
// apps/dashboard/app/components/ActivityFeed.tsx

'use client'

import { useQuery } from '@tanstack/react-query'
import { ActivityCard } from './ActivityCard'
import { ActivityFeedSkeleton } from './ActivityFeedSkeleton'
import { ActivityFeedError } from './ActivityFeedError'
import { ActivityFeedEmpty } from './ActivityFeedEmpty'

interface Activity {
  id: string
  timestamp: string
  action: string
  description: string
  user: { id: string; name: string; email: string } | null
  entity_type: string
  entity_id: string
  metadata: Record<string, any>
}

export function ActivityFeed() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await fetch('/api/activity-log?limit=20')
      if (!res.ok) throw new Error('Failed to fetch activities')
      const json = await res.json()
      return json.data as Activity[]
    },
    staleTime: 60000, // 1 minute
  })

  if (isLoading) return <ActivityFeedSkeleton />
  if (error) return <ActivityFeedError onRetry={() => refetch()} />
  if (!data || data.length === 0) return <ActivityFeedEmpty />

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Recent Activity</h2>
      <div className="space-y-2">
        {data.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
      <button
        className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        disabled
      >
        View More (Coming Soon)
      </button>
    </div>
  )
}
```

### ActivityCard Component

```typescript
// apps/dashboard/app/components/ActivityCard.tsx

'use client'

import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  timestamp: string
  action: string
  description: string
  user: { id: string; name: string; email: string } | null
  entity_type: string
  entity_id: string
  metadata: Record<string, any>
}

function getActivityIcon(entityType: string): string {
  const icons: Record<string, string> = {
    payment: '💰',
    payment_plan: '📋',
    student: '👤',
    enrollment: '🏫',
    installment: '⚠️',
  }
  return icons[entityType] || '📝'
}

export function ActivityCard({ activity }: { activity: Activity }) {
  const icon = getActivityIcon(activity.entity_type)
  const relativeTime = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
  })
  const userName = activity.user?.name || 'System'

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted transition-colors">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{activity.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {userName} · {relativeTime}
        </p>
      </div>
    </div>
  )
}
```

### Supporting Components

#### ActivityFeedSkeleton

```typescript
// apps/dashboard/app/components/ActivityFeedSkeleton.tsx

export function ActivityFeedSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg border"
          >
            <div className="w-8 h-8 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### ActivityFeedError

```typescript
// apps/dashboard/app/components/ActivityFeedError.tsx

interface Props {
  onRetry: () => void
}

export function ActivityFeedError({ onRetry }: Props) {
  return (
    <div className="space-y-4 text-center py-8">
      <p className="text-sm text-muted-foreground">
        Unable to load recent activity
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        Retry
      </button>
    </div>
  )
}
```

#### ActivityFeedEmpty

```typescript
// apps/dashboard/app/components/ActivityFeedEmpty.tsx

export function ActivityFeedEmpty() {
  return (
    <div className="space-y-4 text-center py-8">
      <div className="text-4xl">📭</div>
      <div>
        <p className="text-sm font-medium">No recent activity</p>
        <p className="text-xs text-muted-foreground mt-1">
          Activity will appear here as your team works
        </p>
      </div>
    </div>
  )
}
```

## Styling with Shadcn UI

Use these Shadcn UI patterns:

- **Card borders:** `border` class (subtle gray)
- **Hover states:** `hover:bg-muted` for subtle highlight
- **Text colors:**
  - Primary: `text-foreground`
  - Secondary: `text-muted-foreground`
- **Spacing:** `space-y-2` for activity list, `gap-3` for card layout
- **Typography:**
  - Description: `text-sm font-medium`
  - Metadata: `text-xs text-muted-foreground`

## Testing Requirements

### Component Tests

Create `apps/dashboard/app/components/__tests__/ActivityFeed.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ActivityFeed } from '../ActivityFeed'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

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
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    // Check for skeleton elements
  })

  it('should render activities after loading', async () => {
    // Mock fetch response
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

### ActivityCard Tests

```typescript
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
    expect(screen.getByText('👤')).toBeInTheDocument() // Student icon
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
    expect(screen.getByText('⚠️')).toBeInTheDocument() // Installment icon
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
})
```

## Implementation Notes

### TanStack Query Setup

Ensure TanStack Query is configured in the dashboard app:

```typescript
// apps/dashboard/app/layout.tsx or providers.tsx

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute default
      retry: 1,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### Date Formatting

Using date-fns `formatDistanceToNow`:

```typescript
import { formatDistanceToNow } from 'date-fns'

// Examples:
formatDistanceToNow(new Date('2025-11-13T10:00:00Z'), { addSuffix: true })
// "2 hours ago"

formatDistanceToNow(new Date('2025-11-12T10:00:00Z'), { addSuffix: true })
// "1 day ago"

formatDistanceToNow(new Date('2025-11-06T10:00:00Z'), { addSuffix: true })
// "7 days ago"
```

### Responsive Design

- **Mobile (< 768px):** Single column, full width cards
- **Desktop (≥ 768px):** Wider cards, consistent spacing

Use Tailwind responsive classes:
```tsx
<div className="w-full md:max-w-lg">
  {/* ActivityFeed content */}
</div>
```

## Dependencies

- @tanstack/react-query
- date-fns
- React
- Tailwind CSS
- Shadcn UI components

## References

- [Architecture: State Management](docs/architecture.md#State-Management)
- [Story: 6.4 Recent Activity Feed](.bmad-ephemeral/stories/6-4-recent-activity-feed.md)
- [Dev Notes: ActivityFeed Component Structure](.bmad-ephemeral/stories/6-4-recent-activity-feed.md#ActivityFeed-Component-Structure)
