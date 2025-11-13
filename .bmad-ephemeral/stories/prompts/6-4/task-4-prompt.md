# Story 6-4: Recent Activity Feed - Task 4

## Story Context

**As an** Agency User
**I want** to see a feed of recent activity in the system
**So that** I'm aware of what's happening and can stay in sync with my team

## Task 4: Create ActivityFeed Component

**Acceptance Criteria**: #1, 7-8

### Task Description

Create a React component that displays recent activities in a visually appealing feed format with appropriate icons, timestamps, and user information.

### Subtasks

- [ ] Create React component: `apps/dashboard/app/components/ActivityFeed.tsx`
- [ ] Use TanStack Query to fetch activities from `/api/activity-log?limit=20`
- [ ] Display activities in chronological list:
  - Show relative timestamp: "2 hours ago", "yesterday" (use date-fns `formatDistanceToNow`)
  - Show action description
  - Show user name (or "System" if user is null)
  - Use appropriate icon per entity_type: 💰 payment, 📋 plan, 👤 student, 🏫 enrollment, ⚠️ overdue
- [ ] Style with card layout:
  - Each activity as card with icon, description, user, timestamp
  - Hover effect for better UX
- [ ] Add "View More" button at bottom (links to full activity log page - future story)
- [ ] Responsive layout (stacks on mobile, grid on desktop)

## Context from Previous Tasks

**Task 1 Completed**: Database schema created
**Task 2 Completed**: Activity logging integrated into API routes
**Task 3 Completed**: Activity Feed API route created at `/api/activity-log`

The API is ready and returning formatted activity data. This task creates the visual component to display that data.

## Key Constraints

- **UI**: Component must follow Shadcn UI patterns and Tailwind CSS styling conventions
- **UI**: Activity feed must handle loading, error, and empty states with appropriate UI components
- **Testing**: Component tests must verify auto-refresh behavior and relative timestamp formatting

## Relevant Interfaces

**ActivityFeed Component**:
```typescript
export function ActivityFeed(): JSX.Element
// Displays recent 20 activities with auto-refresh every 60 seconds
```

**Path**: apps/dashboard/app/components/ActivityFeed.tsx

**Activity Interface** (from API):
```typescript
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

## Dependencies

- **react** (18.x): UI component library
- **@tanstack/react-query** (5.90.7): Server state management with auto-refresh
- **date-fns** (4.1.0): Date formatting and relative timestamps
- **next** (15.x): Next.js Link component for navigation

## Reference Documentation

- [docs/architecture.md](docs/architecture.md) - Dashboard Zone component patterns
- [.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md](.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md) - Similar dashboard widget patterns

## Implementation Guide

### 1. Component Structure

**Main Component**: `apps/dashboard/app/components/ActivityFeed.tsx`

```typescript
export function ActivityFeed() {
  const { data: activities, isLoading, error, refetch } = useActivities()

  if (isLoading) return <ActivityFeedSkeleton />
  if (error) return <ActivityFeedError onRetry={() => refetch()} />
  if (!activities || activities.length === 0) return <ActivityFeedEmpty />

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Recent Activity</h2>
      <div className="space-y-2">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
      <Button variant="outline" size="sm">View More</Button>
    </div>
  )
}
```

### 2. ActivityCard Component

Create a sub-component for individual activity cards:

```typescript
function ActivityCard({ activity }: { activity: Activity }) {
  const icon = getActivityIcon(activity.entity_type)
  const relativeTime = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
  const userName = activity.user?.name || 'System'

  return (
    <div className="block p-3 rounded-lg border hover:bg-muted transition-colors">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{activity.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {userName} · {relativeTime}
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 3. Icon Mapping

```typescript
function getActivityIcon(entity_type: string): string {
  const icons: Record<string, string> = {
    payment: '💰',
    payment_plan: '📋',
    student: '👤',
    enrollment: '🏫',
    installment: '⚠️',
  }
  return icons[entity_type] || '📝'
}
```

### 4. TanStack Query Hook

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
    refetchInterval: 60000, // Auto-refresh every 60 seconds (will be configured in Task 5)
    refetchOnWindowFocus: true,
  })
}
```

### 5. Loading, Error, and Empty States

**Loading State**: Skeleton with 3-4 placeholder cards
```typescript
function ActivityFeedSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-3 rounded-lg border">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Error State**: Clear message with retry button
```typescript
function ActivityFeedError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-4 text-center">
      <p className="text-sm text-muted-foreground mb-2">Unable to load recent activity</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
    </div>
  )
}
```

**Empty State**: Helpful message
```typescript
function ActivityFeedEmpty() {
  return (
    <div className="p-4 text-center">
      <p className="text-sm text-muted-foreground">No recent activity</p>
      <p className="text-xs text-muted-foreground mt-1">
        Activity will appear here as your team works
      </p>
    </div>
  )
}
```

### 6. Responsive Design

- Use Tailwind CSS responsive classes
- Stack vertically on mobile
- Consider grid layout for wider displays
- Ensure touch targets are appropriate on mobile

### 7. Testing Approach

Component tests should verify:
- Renders with mock activity data
- Shows relative timestamps correctly
- Displays correct icons per entity_type
- Shows user name or "System" appropriately
- Loading state shows skeleton
- Error state shows retry button
- Empty state shows helpful message

## Manifest Update Instructions

**Before starting**: Read the current manifest at `docs/stories/prompts/6-4/manifest.md`

**After completing this task**:
1. Update Task 3 status to "Completed" with today's date (if not already done)
2. Update Task 4 status to "Completed" with today's date
3. Add implementation notes about:
   - Component location
   - Sub-components created
   - Styling approach used

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-4/manifest.md`
2. **Proceed to Task 5**: Open `task-5-prompt.md` to implement auto-refresh functionality
3. **Verify**: View the component in Storybook or a test page to ensure it renders correctly

---

**Progress**: Task 4 of 8. The visual component is ready. Next we add auto-refresh and make activities clickable.
