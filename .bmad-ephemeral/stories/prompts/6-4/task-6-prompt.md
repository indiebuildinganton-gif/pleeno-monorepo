# Story 6-4: Recent Activity Feed - Task 6

## Story Context

**As an** Agency User
**I want** to see a feed of recent activity in the system
**So that** I'm aware of what's happening and can stay in sync with my team

## Task 6: Make Activities Clickable

**Acceptance Criteria**: #1

### Task Description

Make each activity card clickable and navigate to the appropriate detail page based on the entity type, allowing users to quickly access related information.

### Subtasks

- [ ] Make each activity card clickable:
  - Payment recorded → Navigate to `/payments/plans/[plan_id]`
  - Payment plan created → Navigate to `/payments/plans/[plan_id]`
  - Student added → Navigate to `/entities/students/[student_id]`
  - Enrollment added → Navigate to `/entities/students/[student_id]?tab=enrollments`
  - Installment overdue → Navigate to `/payments/plans/[plan_id]`
- [ ] Use Next.js Link component for navigation
- [ ] Add hover state to indicate clickability
- [ ] Add tooltip: "Click to view details"

## Context from Previous Tasks

**Task 1 Completed**: Database schema created
**Task 2 Completed**: Activity logging integrated
**Task 3 Completed**: Activity Feed API route created
**Task 4 Completed**: ActivityFeed component created
**Task 5 Completed**: Auto-refresh implemented

The feed is displaying and refreshing. Now we add navigation to make activities actionable.

## Key Constraints

- **UI**: Component must follow Shadcn UI patterns and Tailwind CSS styling conventions

## Relevant Interfaces

The ActivityCard component needs to be wrapped with Next.js Link and include navigation logic based on entity_type.

## Dependencies

- **next** (15.x): Next.js Link component for client-side navigation

## Reference Documentation

- [.bmad-ephemeral/stories/6-4-recent-activity-feed.md](.bmad-ephemeral/stories/6-4-recent-activity-feed.md) - Navigation mapping details

## Implementation Guide

### 1. Create Navigation Helper Function

Add a function to determine the destination URL based on activity type:

```typescript
function getActivityLink(activity: Activity): string {
  const { entity_type, entity_id, metadata } = activity

  switch (entity_type) {
    case 'payment':
    case 'installment':
      // Both navigate to the payment plan page
      return `/payments/plans/${metadata.payment_plan_id}`

    case 'payment_plan':
      return `/payments/plans/${entity_id}`

    case 'student':
      return `/entities/students/${entity_id}`

    case 'enrollment':
      // Navigate to student page with enrollments tab
      return `/entities/students/${metadata.student_id}?tab=enrollments`

    default:
      // Fallback to dashboard
      return '/dashboard'
  }
}
```

### 2. Update ActivityCard Component

Wrap the card with Next.js Link:

```typescript
import Link from 'next/link'

function ActivityCard({ activity }: { activity: Activity }) {
  const icon = getActivityIcon(activity.entity_type)
  const relativeTime = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
  const userName = activity.user?.name || 'System'
  const href = getActivityLink(activity)

  return (
    <Link
      href={href}
      className="block p-3 rounded-lg border hover:bg-muted transition-colors cursor-pointer"
      title="Click to view details"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{activity.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {userName} · {relativeTime}
          </p>
        </div>
      </div>
    </Link>
  )
}
```

### 3. Enhance Hover States

Add visual feedback for clickability:

```typescript
<Link
  href={href}
  className="block p-3 rounded-lg border hover:bg-muted hover:border-primary/50 transition-all cursor-pointer group"
  title="Click to view details"
>
  <div className="flex items-start gap-3">
    <div className="text-2xl transition-transform group-hover:scale-110">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium group-hover:text-primary transition-colors">
        {activity.description}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {userName} · {relativeTime}
      </p>
    </div>
  </div>
</Link>
```

### 4. Optional: Add External Link Icon

For visual clarity that items are clickable:

```typescript
import { ExternalLink } from 'lucide-react' // or your icon library

<Link href={href} className="...">
  <div className="flex items-start gap-3">
    <div className="text-2xl">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium group-hover:text-primary">
        {activity.description}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {userName} · {relativeTime}
      </p>
    </div>
    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
</Link>
```

### 5. Handle Missing Metadata

Ensure graceful fallback if metadata is missing:

```typescript
function getActivityLink(activity: Activity): string {
  const { entity_type, entity_id, metadata = {} } = activity

  switch (entity_type) {
    case 'payment':
    case 'installment':
      // Ensure payment_plan_id exists in metadata
      if (!metadata.payment_plan_id) {
        console.warn('Missing payment_plan_id in activity metadata:', activity.id)
        return '/dashboard'
      }
      return `/payments/plans/${metadata.payment_plan_id}`

    case 'payment_plan':
      return `/payments/plans/${entity_id}`

    case 'student':
      return `/entities/students/${entity_id}`

    case 'enrollment':
      if (!metadata.student_id) {
        console.warn('Missing student_id in activity metadata:', activity.id)
        return '/dashboard'
      }
      return `/entities/students/${metadata.student_id}?tab=enrollments`

    default:
      return '/dashboard'
  }
}
```

### 6. Testing Approach

Create tests to verify:
- Correct navigation URL generated for each entity_type
- Link component renders with correct href
- Hover states work correctly
- Tooltip displays "Click to view details"
- Fallback to dashboard if metadata missing
- Keyboard navigation works (Tab + Enter)

**Test Example**:
```typescript
describe('ActivityCard Navigation', () => {
  it('should navigate to payment plan page for payment activity', () => {
    const activity = {
      entity_type: 'payment',
      metadata: { payment_plan_id: 'plan-123' }
    }
    render(<ActivityCard activity={activity} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/payments/plans/plan-123')
  })

  it('should navigate to student page with enrollments tab for enrollment activity', () => {
    const activity = {
      entity_type: 'enrollment',
      entity_id: 'enrollment-123',
      metadata: { student_id: 'student-456' }
    }
    render(<ActivityCard activity={activity} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/entities/students/student-456?tab=enrollments')
  })

  it('should fallback to dashboard if metadata is missing', () => {
    const activity = {
      entity_type: 'payment',
      metadata: {} // Missing payment_plan_id
    }
    render(<ActivityCard activity={activity} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard')
  })
})
```

## Manifest Update Instructions

**Before starting**: Read the current manifest at `docs/stories/prompts/6-4/manifest.md`

**After completing this task**:
1. Update Task 5 status to "Completed" with today's date (if not already done)
2. Update Task 6 status to "Completed" with today's date
3. Add implementation notes about:
   - Navigation mapping implemented
   - Hover state enhancements
   - Any edge cases handled

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-4/manifest.md`
2. **Proceed to Task 7**: Open `task-7-prompt.md` to integrate the ActivityFeed into the dashboard page
3. **Verify**: Click on various activity types and ensure navigation works correctly

---

**Progress**: Task 6 of 8. Activities are now clickable and actionable. Next we integrate into the dashboard.
