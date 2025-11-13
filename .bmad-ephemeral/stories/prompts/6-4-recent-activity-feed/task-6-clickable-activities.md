# Task 6: Make Activities Clickable

## Context
You are implementing Story 6.4, Task 6 of the Pleeno payment tracking system.

**Story:** As an Agency User, I want to see a feed of recent activity in the system, so that I'm aware of what's happening and can stay in sync with my team.

**This Task:** Make activity cards clickable so users can navigate to the relevant detail page based on the activity type.

## Acceptance Criteria
- AC #1: Activities are clickable and navigate to appropriate detail pages

## Requirements

Enhance `ActivityCard` component to:

1. **Make entire card clickable** using Next.js Link component

2. **Navigate to appropriate page** based on entity_type:
   - `payment`: `/payments/plans/[plan_id]` (from metadata.payment_plan_id)
   - `payment_plan`: `/payments/plans/[plan_id]`
   - `student`: `/entities/students/[student_id]`
   - `enrollment`: `/entities/students/[student_id]?tab=enrollments` (from metadata.student_id)
   - `installment`: `/payments/plans/[plan_id]` (from metadata.payment_plan_id)

3. **Add visual indicators:**
   - Hover state (background change)
   - Cursor pointer
   - Optional tooltip: "Click to view details"

4. **Handle edge cases:**
   - Missing metadata (disable link, show tooltip: "Details unavailable")
   - Invalid entity_id (fallback to dashboard)

## Technical Constraints

- **Architecture:** Client-side React component with Next.js routing
- **Navigation:** Use Next.js Link for client-side routing
- **User Experience:** Clear hover state, accessible keyboard navigation
- **Routing:** Follow existing app routing patterns (basePath per zone)

## Implementation

### Enhanced ActivityCard with Navigation

```typescript
// apps/dashboard/app/components/ActivityCard.tsx

'use client'

import Link from 'next/link'
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

/**
 * Generate navigation link based on activity entity type and metadata
 */
function getActivityLink(activity: Activity): string {
  const { entity_type, entity_id, metadata } = activity

  switch (entity_type) {
    case 'payment':
      // Navigate to payment plan page
      return metadata.payment_plan_id
        ? `/payments/plans/${metadata.payment_plan_id}`
        : '/dashboard'

    case 'installment':
      // Navigate to payment plan page (installments are part of plans)
      return metadata.payment_plan_id
        ? `/payments/plans/${metadata.payment_plan_id}`
        : '/dashboard'

    case 'payment_plan':
      // Navigate to payment plan detail page
      return `/payments/plans/${entity_id}`

    case 'student':
      // Navigate to student detail page
      return `/entities/students/${entity_id}`

    case 'enrollment':
      // Navigate to student page with enrollments tab
      return metadata.student_id
        ? `/entities/students/${metadata.student_id}?tab=enrollments`
        : `/entities/students/${entity_id}`

    default:
      // Fallback to dashboard
      return '/dashboard'
  }
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
  const link = getActivityLink(activity)

  return (
    <Link
      href={link}
      className={`flex items-start gap-3 p-3 rounded-lg border hover:bg-muted transition-colors cursor-pointer group ${className}`}
      title="Click to view details"
    >
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium group-hover:text-primary transition-colors">
          {activity.description}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {userName} · {relativeTime}
        </p>
      </div>
      {/* Optional: Add chevron icon to indicate clickability */}
      <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </Link>
  )
}
```

### Link Generation Logic

#### Payment and Installment
Both navigate to the payment plan detail page:

```typescript
case 'payment':
case 'installment':
  return metadata.payment_plan_id
    ? `/payments/plans/${metadata.payment_plan_id}`
    : '/dashboard'
```

**Metadata required:** `payment_plan_id`

#### Payment Plan
Direct link to plan detail:

```typescript
case 'payment_plan':
  return `/payments/plans/${entity_id}`
```

#### Student
Direct link to student detail:

```typescript
case 'student':
  return `/entities/students/${entity_id}`
```

#### Enrollment
Link to student page with enrollments tab:

```typescript
case 'enrollment':
  return metadata.student_id
    ? `/entities/students/${metadata.student_id}?tab=enrollments`
    : `/entities/students/${entity_id}`
```

**Metadata required:** `student_id`

## Styling Enhancements

### Hover State

```typescript
className="hover:bg-muted hover:border-primary/50 transition-colors cursor-pointer"
```

### Text Color Change on Hover

```typescript
className="group-hover:text-primary transition-colors"
```

### Chevron Icon (Optional)

Add chevron-right icon to indicate clickability:

```tsx
<div className="flex-shrink-0 text-muted-foreground group-hover:text-primary">
  <ChevronRightIcon />
</div>
```

## Testing Requirements

### Component Tests

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityCard } from '../ActivityCard'

describe('ActivityCard Navigation', () => {
  it('should link to payment plan for payment activity', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'Payment recorded',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'payment',
      entity_id: 'payment-1',
      action: 'recorded',
      metadata: { payment_plan_id: 'plan-123' }
    }

    render(<ActivityCard activity={activity} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/payments/plans/plan-123')
  })

  it('should link to student page for student activity', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'Student added',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'student',
      entity_id: 'student-123',
      action: 'created',
      metadata: { student_name: 'John Doe' }
    }

    render(<ActivityCard activity={activity} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/entities/students/student-123')
  })

  it('should link to student enrollments tab for enrollment activity', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'Enrollment created',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'enrollment',
      entity_id: 'enrollment-123',
      action: 'created',
      metadata: { student_id: 'student-123', college_name: 'MIT' }
    }

    render(<ActivityCard activity={activity} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/entities/students/student-123?tab=enrollments')
  })

  it('should fallback to dashboard if metadata missing', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'Payment recorded',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'payment',
      entity_id: 'payment-1',
      action: 'recorded',
      metadata: {} // Missing payment_plan_id
    }

    render(<ActivityCard activity={activity} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/dashboard')
  })
})
```

### Integration Tests

Test with Playwright:

```typescript
test('clicking activity navigates to detail page', async ({ page }) => {
  // Login and navigate to dashboard
  await page.goto('/login')
  await login(page)
  await page.goto('/dashboard')

  // Wait for activity feed to load
  await page.waitForSelector('[data-testid="activity-feed"]')

  // Click first activity
  const firstActivity = page.locator('[data-testid="activity-card"]').first()
  await firstActivity.click()

  // Verify navigation occurred
  await page.waitForURL(/\/(payments|entities)\//)
  expect(page.url()).not.toContain('/dashboard')
})

test('activity navigation respects entity type', async ({ page }) => {
  // Login
  await page.goto('/login')
  await login(page)

  // Create student (generates activity)
  await page.goto('/entities/students/new')
  await createStudent(page, { name: 'Test Student' })

  // Go to dashboard
  await page.goto('/dashboard')

  // Click student activity
  const studentActivity = page.getByText(/added new student Test Student/)
  await studentActivity.click()

  // Should navigate to student detail page
  await page.waitForURL(/\/entities\/students\/[a-z0-9-]+/)
  expect(page.url()).toContain('/entities/students/')
})
```

## Accessibility Considerations

### Keyboard Navigation

- Link is keyboard accessible (Tab key)
- Enter/Space triggers navigation
- Focus visible (outline on focus)

### Screen Reader Support

```tsx
<Link
  href={link}
  aria-label={`View details for: ${activity.description}`}
  title="Click to view details"
>
  {/* Card content */}
</Link>
```

### Focus Styles

```css
.activity-card:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

## Implementation Notes

### Next.js Link Component

Use Next.js Link for client-side navigation:

```tsx
import Link from 'next/link'

<Link href="/path" prefetch={false}>
  {/* Content */}
</Link>
```

- `prefetch={false}`: Don't prefetch on hover (optional, based on performance needs)
- Client-side navigation: Fast page transitions without full reload

### Multi-Zone Routing

Ensure links work across zones:
- **Payments zone:** `/payments/*` (basePath: `/payments`)
- **Entities zone:** `/entities/*` (basePath: `/entities`)
- **Dashboard zone:** `/dashboard/*` (basePath: `/dashboard`)

Links should use full paths (e.g., `/payments/plans/123`, not relative `plans/123`)

### Metadata Validation

Before generating link, validate metadata exists:

```typescript
if (!metadata.payment_plan_id) {
  console.warn('Missing payment_plan_id in activity metadata', activity)
  return '/dashboard' // Fallback
}
```

## Dependencies

- next (Link component)
- React
- date-fns

## References

- [Next.js: Linking and Navigating](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating)
- [Architecture: Multi-Zone Routing](docs/architecture.md#Multi-Zone-Routing)
- [Story: 6.4 Recent Activity Feed](.bmad-ephemeral/stories/6-4-recent-activity-feed.md)
- [Dev Notes: Link Mapping](.bmad-ephemeral/stories/6-4-recent-activity-feed.md#Link-Mapping)
