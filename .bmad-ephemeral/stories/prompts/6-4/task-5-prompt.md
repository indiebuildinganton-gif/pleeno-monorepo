# Story 6-4: Recent Activity Feed - Task 5

## Story Context

**As an** Agency User
**I want** to see a feed of recent activity in the system
**So that** I'm aware of what's happening and can stay in sync with my team

## Task 5: Implement Auto-Refresh for Real-Time Feel

**Acceptance Criteria**: #1

### Task Description

Configure the activity feed to automatically refresh at regular intervals and when the user returns to the tab, providing a near real-time view of system activity.

### Subtasks

- [ ] Configure TanStack Query with auto-refetch:
  - `refetchInterval: 60000` (60 seconds)
  - `refetchOnWindowFocus: true`
- [ ] Add visual indicator when new activities arrive:
  - Show subtle "New Activity" badge when fresh data arrives
  - Smooth transition animation when new items appear
- [ ] Consider WebSocket for true real-time (future enhancement):
  - Document in Dev Notes as potential improvement
  - Current polling approach sufficient for MVP

## Context from Previous Tasks

**Task 1 Completed**: Database schema created
**Task 2 Completed**: Activity logging integrated
**Task 3 Completed**: Activity Feed API route created
**Task 4 Completed**: ActivityFeed component created with TanStack Query

The component is displaying activities but needs auto-refresh configuration to feel real-time.

## Key Constraints

- **Testing**: Component tests must verify auto-refresh behavior and relative timestamp formatting

## Relevant Interfaces

The existing `useActivities` hook needs to be enhanced with proper auto-refresh configuration.

## Dependencies

- **@tanstack/react-query** (5.90.7): Server state management with auto-refresh capabilities

## Reference Documentation

- [docs/architecture.md](docs/architecture.md) - State Management section for TanStack Query patterns
- [.bmad-ephemeral/stories/6-4-recent-activity-feed.md](.bmad-ephemeral/stories/6-4-recent-activity-feed.md) - Auto-refresh implementation details

## Implementation Guide

### 1. Update TanStack Query Configuration

Modify the `useActivities` hook in `apps/dashboard/app/components/ActivityFeed.tsx`:

```typescript
function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await fetch('/api/activity-log?limit=20')
      if (!res.ok) throw new Error('Failed to fetch activities')
      return res.json()
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when network reconnects
  })
}
```

### 2. Add Visual Indicator for New Activities

**Option A: Simple Badge**
```typescript
export function ActivityFeed() {
  const { data: activities, isLoading, error, refetch, dataUpdatedAt } = useActivities()
  const [showNewBadge, setShowNewBadge] = useState(false)
  const prevDataUpdatedAt = useRef(dataUpdatedAt)

  useEffect(() => {
    if (prevDataUpdatedAt.current && dataUpdatedAt > prevDataUpdatedAt.current) {
      setShowNewBadge(true)
      setTimeout(() => setShowNewBadge(false), 3000) // Hide after 3 seconds
    }
    prevDataUpdatedAt.current = dataUpdatedAt
  }, [dataUpdatedAt])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        {showNewBadge && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
            New Activity
          </span>
        )}
      </div>
      {/* Rest of component... */}
    </div>
  )
}
```

**Option B: Smooth Animation**
Add transition animations when new items appear at the top of the list:

```typescript
<div className="space-y-2">
  {activities.map((activity, index) => (
    <div
      key={activity.id}
      className="transition-all duration-300 ease-in-out"
      style={{
        animation: index === 0 ? 'slideIn 0.3s ease-out' : undefined
      }}
    >
      <ActivityCard activity={activity} />
    </div>
  ))}
</div>
```

Add CSS animation:
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 3. Optimize Refetch Behavior

Consider adding conditions to prevent excessive refetching:

```typescript
function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await fetch('/api/activity-log?limit=20')
      if (!res.ok) throw new Error('Failed to fetch activities')
      return res.json()
    },
    staleTime: 60000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Only refetch if data is stale
    refetchIntervalInBackground: false, // Don't refetch when tab is not visible
  })
}
```

### 4. Document Future WebSocket Enhancement

Add a comment in the code or Dev Notes:

```typescript
// TODO: Future Enhancement - Real-Time Updates
// Consider implementing WebSocket/Supabase Realtime subscriptions for true real-time updates
// Current polling approach (60s refresh) is sufficient for MVP
// WebSocket would eliminate polling overhead and provide instant updates
// See: https://supabase.com/docs/guides/realtime
```

### 5. Testing Approach

Create tests to verify:
- TanStack Query configuration includes refetchInterval
- refetchOnWindowFocus is enabled
- New activity badge appears when data updates
- Animations work correctly
- Background refetching behaves as expected

**Test Example**:
```typescript
describe('ActivityFeed Auto-Refresh', () => {
  it('should refetch activities every 60 seconds', () => {
    // Mock TanStack Query
    // Advance timers by 60 seconds
    // Verify fetch was called again
  })

  it('should refetch when window regains focus', () => {
    // Render component
    // Trigger window focus event
    // Verify fetch was called
  })

  it('should show new activity badge when data updates', () => {
    // Render component with initial data
    // Update data via mock
    // Verify badge is visible
    // Wait 3 seconds
    // Verify badge is hidden
  })
})
```

## Manifest Update Instructions

**Before starting**: Read the current manifest at `docs/stories/prompts/6-4/manifest.md`

**After completing this task**:
1. Update Task 4 status to "Completed" with today's date (if not already done)
2. Update Task 5 status to "Completed" with today's date
3. Add implementation notes about:
   - Auto-refresh configuration used
   - Visual indicator approach chosen
   - Any performance optimizations made

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-4/manifest.md`
2. **Proceed to Task 6**: Open `task-6-prompt.md` to make activities clickable with navigation
3. **Verify**: Leave the dashboard open for 60+ seconds and verify it automatically refreshes

---

**Progress**: Task 5 of 8. The feed now feels real-time. Next we add clickable navigation to activity details.
