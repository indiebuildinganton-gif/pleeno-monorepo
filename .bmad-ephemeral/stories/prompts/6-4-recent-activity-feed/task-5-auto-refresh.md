# Task 5: Implement Auto-Refresh for Real-Time Feel

## Context
You are implementing Story 6.4, Task 5 of the Pleeno payment tracking system.

**Story:** As an Agency User, I want to see a feed of recent activity in the system, so that I'm aware of what's happening and can stay in sync with my team.

**This Task:** Add auto-refresh functionality to ActivityFeed component using TanStack Query polling for near real-time updates.

## Acceptance Criteria
- AC #1: Feed automatically refreshes to show new activities

## Requirements

Enhance the `ActivityFeed` component to:

1. **Auto-refresh every 60 seconds** using TanStack Query `refetchInterval`

2. **Refetch on window focus** using `refetchOnWindowFocus` (when user returns to tab)

3. **Show visual indicator** when new activities arrive:
   - Subtle "New Activity" badge or notification
   - Smooth transition animation when new items appear

4. **Handle gracefully:**
   - Don't interrupt user if they're interacting with the feed
   - Maintain scroll position if possible
   - Only show indicator if new activities actually arrived

## Technical Constraints

- **Architecture:** Client-side React component with TanStack Query
- **Performance:** 60-second polling interval (balance between freshness and load)
- **User Experience:** Non-intrusive updates, smooth animations
- **Future Enhancement:** Document WebSocket/Realtime as potential improvement

## Implementation

### Enhanced ActivityFeed with Auto-Refresh

```typescript
// apps/dashboard/app/components/ActivityFeed.tsx

'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
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
  const [previousActivityCount, setPreviousActivityCount] = useState(0)
  const [showNewActivityBadge, setShowNewActivityBadge] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await fetch('/api/activity-log?limit=20')
      if (!res.ok) throw new Error('Failed to fetch activities')
      const json = await res.json()
      return json.data as Activity[]
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  })

  // Detect new activities and show badge
  useEffect(() => {
    if (data && data.length > 0) {
      if (previousActivityCount > 0 && data.length > previousActivityCount) {
        setShowNewActivityBadge(true)
        // Auto-hide badge after 3 seconds
        setTimeout(() => setShowNewActivityBadge(false), 3000)
      }
      setPreviousActivityCount(data.length)
    }
  }, [data, previousActivityCount])

  if (isLoading && !data) return <ActivityFeedSkeleton />
  if (error) return <ActivityFeedError onRetry={() => refetch()} />
  if (!data || data.length === 0) return <ActivityFeedEmpty />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        {showNewActivityBadge && (
          <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full animate-pulse">
            New Activity
          </span>
        )}
      </div>
      <div className="space-y-2">
        {data.map((activity, index) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            className={index === 0 && showNewActivityBadge ? 'animate-fadeIn' : ''}
          />
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

### Enhanced ActivityCard with Animation

Update `ActivityCard` to accept `className` prop for animations:

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

export function ActivityCard({
  activity,
  className = '',
}: {
  activity: Activity
  className?: string
}) {
  const icon = getActivityIcon(activity.entity_type)
  const relativeTime = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
  })
  const userName = activity.user?.name || 'System'

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border hover:bg-muted transition-colors ${className}`}
    >
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

### CSS Animations

Add to global CSS or Tailwind config:

```css
/* apps/dashboard/app/globals.css */

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

Or add to Tailwind config:

```javascript
// tailwind.config.js

module.exports = {
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(-10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
      },
    },
  },
}
```

## Testing Requirements

### Component Tests

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ActivityFeed } from '../ActivityFeed'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('ActivityFeed Auto-Refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should auto-refresh every 60 seconds', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            description: 'Test activity',
            user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
            entity_type: 'student',
            entity_id: 'student-1',
            action: 'created',
            metadata: {}
          }
        ]
      })
    })
    global.fetch = fetchSpy

    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <ActivityFeed />
      </QueryClientProvider>
    )

    // Initial fetch
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    // Advance time by 60 seconds
    vi.advanceTimersByTime(60000)

    // Should refetch
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
  })

  it('should show "New Activity" badge when new activities arrive', async () => {
    // Mock initial data
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              id: '1',
              timestamp: new Date().toISOString(),
              description: 'Old activity',
              user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
              entity_type: 'student',
              entity_id: 'student-1',
              action: 'created',
              metadata: {}
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              id: '2',
              timestamp: new Date().toISOString(),
              description: 'New activity',
              user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
              entity_type: 'student',
              entity_id: 'student-2',
              action: 'created',
              metadata: {}
            },
            {
              id: '1',
              timestamp: new Date().toISOString(),
              description: 'Old activity',
              user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
              entity_type: 'student',
              entity_id: 'student-1',
              action: 'created',
              metadata: {}
            }
          ]
        })
      })

    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <ActivityFeed />
      </QueryClientProvider>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Old activity')).toBeInTheDocument()
    })

    // Advance time to trigger refetch
    vi.advanceTimersByTime(60000)

    // Wait for new activity and badge
    await waitFor(() => {
      expect(screen.getByText('New Activity')).toBeInTheDocument()
      expect(screen.getByText('New activity')).toBeInTheDocument()
    })

    // Badge should auto-hide after 3 seconds
    vi.advanceTimersByTime(3000)

    await waitFor(() => {
      expect(screen.queryByText('New Activity')).not.toBeInTheDocument()
    })
  })
})
```

### Manual Testing

1. **Test auto-refresh:**
   - Open dashboard
   - Perform action in another tab (create student)
   - Wait 60 seconds
   - Verify feed updates with new activity

2. **Test window focus refetch:**
   - Open dashboard
   - Switch to another tab
   - Perform action in another browser window
   - Switch back to dashboard tab
   - Verify feed refetches immediately

3. **Test badge animation:**
   - Open dashboard with existing activities
   - Perform action to create new activity
   - Wait for auto-refresh
   - Verify "New Activity" badge appears
   - Verify badge disappears after 3 seconds

## Implementation Notes

### TanStack Query Polling

Key configuration options:

```typescript
{
  refetchInterval: 60000, // Poll every 60 seconds
  refetchOnWindowFocus: true, // Refetch when user returns
  refetchOnMount: true, // Refetch on component mount (default)
  staleTime: 60000, // Data considered fresh for 1 minute
}
```

### Visual Feedback Best Practices

- **Non-intrusive:** Badge fades in smoothly, auto-hides
- **Contextual:** Only show when new activities actually arrive
- **Accessible:** Use aria-live region for screen readers

### Future Enhancement: WebSocket Integration

Document for future story:

```typescript
// Future: Use Supabase Realtime for instant updates

const { data, error } = await supabase
  .from('activity_log')
  .select('*')
  .eq('agency_id', agency_id)
  .order('created_at', { ascending: false })
  .limit(20)

// Subscribe to new activities
supabase
  .channel('activity-feed')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'activity_log',
      filter: `agency_id=eq.${agency_id}`
    },
    (payload) => {
      // Add new activity to feed in real-time
      queryClient.setQueryData(['activities'], (old: Activity[]) => [
        payload.new as Activity,
        ...old.slice(0, 19) // Keep 20 activities
      ])
    }
  )
  .subscribe()
```

## Performance Considerations

- **Polling interval:** 60 seconds balances freshness vs. server load
- **Window focus:** Refetch immediately when user returns (good UX)
- **Caching:** 1-minute stale time prevents excessive refetches
- **Badge animation:** Lightweight CSS animation (no JS animation)

## Dependencies

- @tanstack/react-query
- React hooks (useState, useEffect)
- date-fns
- Tailwind CSS (for animations)

## References

- [Architecture: State Management](docs/architecture.md#State-Management)
- [Story: 6.4 Recent Activity Feed](.bmad-ephemeral/stories/6-4-recent-activity-feed.md)
- [Dev Notes: TanStack Query Configuration](.bmad-ephemeral/stories/6-4-recent-activity-feed.md#TanStack-Query-Configuration)
- [TanStack Query Docs: Polling](https://tanstack.com/query/latest/docs/react/guides/window-focus-refetching)
