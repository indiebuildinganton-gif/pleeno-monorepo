# Story 6-5: Overdue Payments Summary Widget - Task 6

## Story Context

**As an** Agency User
**I want** a dedicated widget highlighting all overdue payments
**So that** I can immediately focus on the most urgent follow-ups

## Task 6: Add Auto-Refresh for Real-Time Updates

**Acceptance Criteria**: #1

### Task Description

Configure TanStack Query to automatically refresh overdue payments data at regular intervals and when the user returns to the tab, ensuring the urgency information stays current.

### Subtasks

- [ ] Configure TanStack Query with auto-refetch:
  - `refetchInterval: 300000` (5 minutes - shorter for urgency)
  - `refetchOnWindowFocus: true`
- [ ] Add subtle visual indicator when new overdue payments detected:
  - Flash animation on widget border
  - "New overdue payment" badge
- [ ] Consider sound/notification for new overdue (future enhancement)

## Context

### Key Constraints

- **Auto-Refresh Interval**: 5-minute refresh interval (shorter than other widgets due to urgency)
- **TanStack Query**: Use for data fetching with `staleTime: 300000` (5 min), `refetchInterval: 300000`
- **User Experience**: Provide visual feedback when new overdue payments detected

### TanStack Query Configuration

**Already Implemented in Task 2** (verify/enhance):
```typescript
// apps/dashboard/app/hooks/useOverduePayments.ts

export function useOverduePayments() {
  return useQuery({
    queryKey: ['overdue-payments'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/overdue-payments')
      if (!res.ok) throw new Error('Failed to fetch overdue payments')
      return res.json() as Promise<OverduePaymentsResponse>
    },
    staleTime: 300000, // 5 minutes (shorter for urgency)
    refetchInterval: 300000, // Auto-refresh every 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  })
}
```

### Visual Indicator for New Overdue Payments

**Option A: Flash Border Animation**
```typescript
// apps/dashboard/app/components/OverduePaymentsWidget.tsx

export function OverduePaymentsWidget() {
  const { data, isLoading, error, refetch } = useOverduePayments()
  const [hasNewOverdue, setHasNewOverdue] = useState(false)
  const prevCountRef = useRef<number>()

  useEffect(() => {
    if (data && prevCountRef.current !== undefined) {
      if (data.total_count > prevCountRef.current) {
        // New overdue payment detected
        setHasNewOverdue(true)
        setTimeout(() => setHasNewOverdue(false), 3000) // Clear after 3 seconds
      }
    }
    prevCountRef.current = data?.total_count
  }, [data?.total_count])

  // ... loading/error/empty states

  return (
    <div
      className={`
        border-2 rounded-lg p-4 bg-red-50
        ${hasNewOverdue ? 'border-red-600 animate-pulse' : 'border-red-500'}
      `}
    >
      {hasNewOverdue && (
        <div className="mb-2 px-3 py-1 bg-red-600 text-white text-sm rounded-full inline-block">
          ⚠️ New overdue payment detected
        </div>
      )}
      {/* ... rest of widget */}
    </div>
  )
}
```

**Option B: Notification Badge**
```typescript
export function OverduePaymentsWidget() {
  const { data, isLoading, error, refetch } = useOverduePayments()
  const [newCount, setNewCount] = useState(0)
  const prevCountRef = useRef<number>()

  useEffect(() => {
    if (data && prevCountRef.current !== undefined) {
      const diff = data.total_count - prevCountRef.current
      if (diff > 0) {
        setNewCount(diff)
        setTimeout(() => setNewCount(0), 5000) // Clear after 5 seconds
      }
    }
    prevCountRef.current = data?.total_count
  }, [data?.total_count])

  return (
    <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50 relative">
      {newCount > 0 && (
        <div className="absolute -top-2 -right-2 px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded-full animate-bounce">
          +{newCount} NEW
        </div>
      )}
      {/* ... rest of widget */}
    </div>
  )
}
```

**Option C: Toast Notification (using a toast library)**
```typescript
import { toast } from 'sonner' // or your preferred toast library

export function OverduePaymentsWidget() {
  const { data, isLoading, error, refetch } = useOverduePayments()
  const prevCountRef = useRef<number>()

  useEffect(() => {
    if (data && prevCountRef.current !== undefined) {
      const diff = data.total_count - prevCountRef.current
      if (diff > 0) {
        toast.error(`${diff} new overdue payment${diff > 1 ? 's' : ''} detected!`, {
          action: {
            label: 'View',
            onClick: () => {
              // Scroll to widget or highlight it
              document.getElementById('overdue-payments-widget')?.scrollIntoView({ behavior: 'smooth' })
            },
          },
        })
      }
    }
    prevCountRef.current = data?.total_count
  }, [data?.total_count])

  return (
    <div id="overdue-payments-widget" className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
      {/* ... widget content */}
    </div>
  )
}
```

### Auto-Refresh Behavior

**What Triggers Refetch:**
1. **Interval**: Every 5 minutes automatically
2. **Window Focus**: When user returns to browser tab
3. **Manual Retry**: When user clicks retry button (error state)
4. **Query Invalidation**: When related mutations complete (e.g., payment recorded)

**What Doesn't Trigger Refetch:**
- Navigating within the dashboard (data remains cached)
- Hovering over the widget
- Scrolling the page

### Dependencies

- **react** (18.x): useState, useEffect, useRef hooks
- **@tanstack/react-query** (5.90.7): Auto-refresh configuration
- **sonner** (optional): Toast notifications for new overdue alerts

### Reference Documentation

- [docs/architecture.md](../../architecture.md) - State Management with TanStack Query
- [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/guides/window-focus-refetching) - Window focus refetching
- [.bmad-ephemeral/stories/6-4-recent-activity-feed.md](../../../.bmad-ephemeral/stories/6-4-recent-activity-feed.md) - Auto-refresh patterns

## Implementation Guide

1. **Verify TanStack Query configuration** in `apps/dashboard/app/hooks/useOverduePayments.ts`:
   - Ensure `staleTime: 300000` (5 minutes)
   - Ensure `refetchInterval: 300000` (5 minutes)
   - Ensure `refetchOnWindowFocus: true`

2. **Choose visual indicator approach**:
   - **Recommended**: Option A (flash border) for subtlety
   - Alternative: Option B (notification badge) for more visibility
   - Future: Option C (toast notification) for maximum attention

3. **Implement change detection**:
   - Use `useRef` to track previous count
   - Use `useEffect` to compare current vs previous
   - Trigger visual indicator when count increases

4. **Add animation/indicator**:
   - Tailwind `animate-pulse` for border flash
   - Tailwind `animate-bounce` for badge
   - Auto-dismiss after 3-5 seconds

5. **Test auto-refresh**:
   - Wait 5 minutes → verify refetch occurs
   - Switch browser tabs → verify refetch on return
   - Simulate new overdue payment → verify indicator shows

### Testing Approach

Create test cases to verify:
- Query refetches every 5 minutes (use fake timers)
- Query refetches when window regains focus
- Visual indicator shows when new overdue detected
- Indicator auto-dismisses after timeout
- Previous count tracking works correctly
- No unnecessary re-renders

### Performance Considerations

**Optimize Refetching**:
- 5-minute interval balances freshness vs server load
- `staleTime` prevents excessive refetches
- `refetchOnWindowFocus` ensures data is current when user returns

**Avoid Over-Rendering**:
- Use `useRef` for tracking (doesn't trigger re-render)
- Memoize components if needed
- Clear timeouts on unmount

**Memory Management**:
```typescript
useEffect(() => {
  // ... change detection logic

  return () => {
    // Cleanup: cancel any pending timeouts
  }
}, [data?.total_count])
```

### Future Enhancements (Document for Later)

**Browser Notifications** (future story):
```typescript
// Request permission
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification('New Overdue Payment', {
    body: `${newCount} new overdue payment detected`,
    icon: '/logo.png',
  })
}
```

**Sound Alert** (future story):
```typescript
const playAlert = () => {
  const audio = new Audio('/sounds/alert.mp3')
  audio.play()
}
```

**Configurable Interval** (future story):
```typescript
// Allow users to configure refresh interval in settings
const { refreshInterval } = useUserSettings()

return useQuery({
  // ...
  refetchInterval: refreshInterval || 300000,
})
```

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-5/manifest.md`:
   - Change Task 6 status to "Completed"
   - Add completion date
   - Note which visual indicator option you chose (A, B, or C)

2. **Proceed to Task 7**: Open `task-7-prompt.md` to implement comprehensive testing

3. **Verify**: Test auto-refresh by:
   - Using browser DevTools to advance time (or wait 5 minutes)
   - Switching browser tabs and returning
   - Manually creating a new overdue payment in the database

---

**Remember**: This is Task 6 of 7. Task 7 will add comprehensive testing for all functionality.
