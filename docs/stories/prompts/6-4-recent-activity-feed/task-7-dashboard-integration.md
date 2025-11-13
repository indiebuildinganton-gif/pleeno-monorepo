# Task 7: Integrate ActivityFeed into Dashboard Page

## Context
You are implementing Story 6.4, Task 7 of the Pleeno payment tracking system.

**Story:** As an Agency User, I want to see a feed of recent activity in the system, so that I'm aware of what's happening and can stay in sync with my team.

**This Task:** Integrate the ActivityFeed component into the dashboard page with appropriate layout and positioning.

## Acceptance Criteria
- AC #1: Activity feed displays on dashboard in accessible, well-positioned location

## Requirements

Modify `apps/dashboard/app/page.tsx` to:

1. **Import ActivityFeed component**

2. **Position in layout:**
   - **Option A:** Right sidebar on desktop, below widgets on mobile
   - **Option B:** Bottom section below all widgets (full width)

3. **Add section heading:** "Recent Activity"

4. **Ensure responsive layout:**
   - Desktop (≥1024px): Sidebar or dedicated column
   - Tablet (768px-1023px): Full width below widgets
   - Mobile (<768px): Full width, stacked layout

5. **Maintain consistency** with existing dashboard widget styling

6. **Add appropriate spacing** to prevent crowding

## Technical Constraints

- **Architecture:** Dashboard page at `apps/dashboard/app/page.tsx`
- **Layout:** Follow existing dashboard grid patterns
- **Responsive:** Mobile-first approach with Tailwind breakpoints
- **Styling:** Consistent with existing widgets (Shadcn UI)

## Implementation

### Option A: Right Sidebar Layout

```typescript
// apps/dashboard/app/page.tsx

import { ActivityFeed } from './components/ActivityFeed'
import { KPIWidget } from './components/KPIWidget'
import { SeasonalCommissionChart } from './components/SeasonalCommissionChart'
import { CommissionBreakdownTable } from './components/CommissionBreakdownTable'

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Main grid layout with sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area (left side) */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Cards */}
          <KPIWidget />

          {/* Seasonal Commission Chart */}
          <SeasonalCommissionChart />

          {/* Commission Breakdown Table */}
          <CommissionBreakdownTable />
        </div>

        {/* Sidebar (right side) */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
```

**Layout:**
```
┌─────────────────────────────────────────┐
│ Dashboard                               │
├───────────────────────────┬─────────────┤
│ KPI Cards                 │ Activity    │
│                           │ Feed        │
├───────────────────────────┤             │
│ Seasonal Commission Chart │             │
│                           │             │
├───────────────────────────┤             │
│ Commission Breakdown      │             │
│                           │             │
└───────────────────────────┴─────────────┘
```

### Option B: Bottom Section Layout

```typescript
// apps/dashboard/app/page.tsx

import { ActivityFeed } from './components/ActivityFeed'
import { KPIWidget } from './components/KPIWidget'
import { SeasonalCommissionChart } from './components/SeasonalCommissionChart'
import { CommissionBreakdownTable } from './components/CommissionBreakdownTable'

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* KPI Cards */}
      <KPIWidget />

      {/* Seasonal Commission Chart */}
      <SeasonalCommissionChart />

      {/* Commission Breakdown Table */}
      <CommissionBreakdownTable />

      {/* Activity Feed - Full Width Bottom Section */}
      <div className="mt-8">
        <ActivityFeed />
      </div>
    </div>
  )
}
```

**Layout:**
```
┌─────────────────────────────────────────┐
│ Dashboard                               │
├─────────────────────────────────────────┤
│ KPI Cards                               │
├─────────────────────────────────────────┤
│ Seasonal Commission Chart               │
├─────────────────────────────────────────┤
│ Commission Breakdown                    │
├─────────────────────────────────────────┤
│ Recent Activity                         │
│ (Activity Feed)                         │
└─────────────────────────────────────────┘
```

## Recommended Layout: Option A (Right Sidebar)

**Rationale:**
- Activity feed is always visible (no scrolling required on desktop)
- Natural "live updates" position (right sidebar pattern)
- Doesn't push main analytics content down
- Consistent with common dashboard UX patterns

**Implementation:**

```typescript
// apps/dashboard/app/page.tsx

import { ActivityFeed } from './components/ActivityFeed'
import { KPIWidget } from './components/KPIWidget'
import { SeasonalCommissionChart } from './components/SeasonalCommissionChart'
import { CommissionBreakdownTable } from './components/CommissionBreakdownTable'

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          <KPIWidget />
          <SeasonalCommissionChart />
          <CommissionBreakdownTable />
        </div>

        {/* Sidebar with activity feed */}
        <div className="lg:col-span-1 space-y-6">
          <ActivityFeed />
          {/* Future: Add other sidebar widgets here */}
        </div>
      </div>
    </div>
  )
}
```

## Responsive Behavior

### Desktop (≥1024px)
- 3-column grid: 2 columns for main content, 1 for sidebar
- Activity feed in fixed position sidebar
- `lg:col-span-2` for main content, `lg:col-span-1` for sidebar

### Tablet (768px-1023px)
- Single column layout
- Main content stacked first
- Activity feed below main content

### Mobile (<768px)
- Single column layout
- All widgets stacked vertically
- Activity feed at bottom

```css
/* Responsive classes breakdown */
grid-cols-1          /* Mobile: 1 column */
lg:grid-cols-3       /* Desktop: 3-column grid */
lg:col-span-2        /* Main content: 2 columns on desktop */
lg:col-span-1        /* Sidebar: 1 column on desktop */
```

## Styling Consistency

### Spacing
- Container padding: `p-6`
- Gap between widgets: `gap-6`
- Space between sections: `space-y-6`
- Top margin for feed: `mt-0` (part of grid)

### Widget Container
```typescript
<div className="bg-card text-card-foreground rounded-lg border p-6">
  {/* Widget content */}
</div>
```

### Section Headings
```typescript
<h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
```

## Testing Requirements

### Visual Tests

1. **Desktop layout:**
   - Verify activity feed in right sidebar
   - Verify main content in left 2/3
   - Verify no overlap or crowding

2. **Tablet layout:**
   - Verify single column
   - Verify activity feed below main content
   - Verify spacing between sections

3. **Mobile layout:**
   - Verify single column stacking
   - Verify activity feed at bottom
   - Verify touch targets are adequately sized

### Functional Tests

```typescript
test('dashboard displays activity feed', async ({ page }) => {
  await page.goto('/login')
  await login(page)
  await page.goto('/dashboard')

  // Verify activity feed renders
  await expect(page.getByText('Recent Activity')).toBeVisible()
  await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible()
})

test('activity feed responsive on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }) // Mobile
  await page.goto('/login')
  await login(page)
  await page.goto('/dashboard')

  // Verify activity feed visible and not overlapping
  await expect(page.getByText('Recent Activity')).toBeVisible()

  // Verify stacked layout
  const feed = page.locator('[data-testid="activity-feed"]')
  const boundingBox = await feed.boundingBox()
  expect(boundingBox?.width).toBeLessThan(400) // Mobile width
})

test('activity feed responsive on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 }) // Desktop
  await page.goto('/login')
  await login(page)
  await page.goto('/dashboard')

  // Verify activity feed in sidebar
  const feed = page.locator('[data-testid="activity-feed"]')
  const boundingBox = await feed.boundingBox()

  // Sidebar should be ~1/3 of screen width
  expect(boundingBox?.width).toBeLessThan(700)
  expect(boundingBox?.x).toBeGreaterThan(1000) // Right side of screen
})
```

## Implementation Notes

### Data Attribute for Testing

Add `data-testid` to ActivityFeed:

```typescript
// apps/dashboard/app/components/ActivityFeed.tsx

export function ActivityFeed() {
  return (
    <div className="space-y-4" data-testid="activity-feed">
      {/* Content */}
    </div>
  )
}
```

### Loading State on Page Load

Dashboard page should handle loading states:

```typescript
export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<KPIWidgetSkeleton />}>
            <KPIWidget />
          </Suspense>
          {/* Other widgets */}
        </div>

        <div className="lg:col-span-1">
          <Suspense fallback={<ActivityFeedSkeleton />}>
            <ActivityFeed />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
```

### Sidebar Sticky Position (Optional Enhancement)

Make activity feed sticky on scroll:

```typescript
<div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
  <ActivityFeed />
</div>
```

This keeps the activity feed visible as user scrolls main content.

## Performance Considerations

- **Lazy loading:** Consider lazy loading ActivityFeed if below fold
- **Code splitting:** ActivityFeed component auto-splits in Next.js
- **Suspense:** Use React Suspense for loading states
- **SSR:** Activity feed can be SSR'd (TanStack Query supports SSR)

## Dependencies

- ActivityFeed component
- Existing dashboard widgets
- Tailwind CSS (grid layout)
- Next.js (page routing)

## References

- [Architecture: Dashboard Zone](docs/architecture.md#Dashboard-Zone)
- [Story: 6.4 Recent Activity Feed](.bmad-ephemeral/stories/6-4-recent-activity-feed.md)
- [Tailwind CSS: Grid](https://tailwindcss.com/docs/grid-template-columns)
- [Tailwind CSS: Responsive Design](https://tailwindcss.com/docs/responsive-design)
