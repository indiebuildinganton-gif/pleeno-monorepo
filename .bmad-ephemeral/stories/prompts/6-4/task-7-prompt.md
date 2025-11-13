# Story 6-4: Recent Activity Feed - Task 7

## Story Context

**As an** Agency User
**I want** to see a feed of recent activity in the system
**So that** I'm aware of what's happening and can stay in sync with my team

## Task 7: Integrate into Dashboard Page

**Acceptance Criteria**: #1

### Task Description

Add the ActivityFeed component to the main dashboard page with appropriate positioning and styling to match other dashboard widgets.

### Subtasks

- [ ] Import ActivityFeed component into `apps/dashboard/app/page.tsx`
- [ ] Position in sidebar or dedicated section:
  - Option A: Right sidebar (desktop), below charts (mobile)
  - Option B: Bottom section below all widgets
- [ ] Add section heading: "Recent Activity"
- [ ] Ensure consistent styling with other dashboard widgets
- [ ] Verify widget displays correctly on desktop, tablet, and mobile

## Context from Previous Tasks

**Task 1 Completed**: Database schema created
**Task 2 Completed**: Activity logging integrated
**Task 3 Completed**: Activity Feed API route created
**Task 4 Completed**: ActivityFeed component created
**Task 5 Completed**: Auto-refresh implemented
**Task 6 Completed**: Activities are clickable

The component is fully functional. This task integrates it into the dashboard layout.

## Key Constraints

- **UI**: Ensure consistent styling with other dashboard widgets
- **UI**: Responsive layout (stacks on mobile, grid on desktop)

## Relevant Interfaces

The main dashboard page needs to import and render the ActivityFeed component.

## Dependencies

- **next** (15.x): React Server Components
- **react** (18.x): Component composition

## Reference Documentation

- [docs/architecture.md](docs/architecture.md) - Dashboard Zone component organization
- [.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md](.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md) - Similar dashboard widget integration

## Implementation Guide

### 1. Review Current Dashboard Layout

First, read the current dashboard page to understand the layout:

**File**: `apps/dashboard/app/page.tsx`

Identify:
- Current grid/layout structure
- Existing widgets and their positioning
- Responsive breakpoints used
- Section headings and styling patterns

### 2. Choose Integration Approach

**Option A: Right Sidebar** (Recommended for desktop-first)
```typescript
export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Main content area */}
      <div className="lg:col-span-2 space-y-6">
        <MetricsOverview />
        <CommissionBreakdown />
        {/* Other widgets */}
      </div>

      {/* Right sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <ActivityFeed />
        {/* Other sidebar content */}
      </div>
    </div>
  )
}
```

**Option B: Bottom Section** (Simpler approach)
```typescript
export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <MetricsOverview />
      <CommissionBreakdown />
      {/* Other widgets */}

      <ActivityFeed />
    </div>
  )
}
```

**Option C: Full-Width Section**
```typescript
export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Top widgets in grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricsOverview />
        <QuickActions />
      </div>

      {/* Full-width activity feed */}
      <section className="bg-card rounded-lg border p-6">
        <ActivityFeed />
      </section>

      {/* Other widgets */}
    </div>
  )
}
```

### 3. Import and Add Component

```typescript
import { ActivityFeed } from './components/ActivityFeed'

export default function DashboardPage() {
  return (
    <div className="...">
      {/* Existing widgets */}

      {/* Activity Feed Section */}
      <section className="bg-card rounded-lg border p-6">
        <ActivityFeed />
      </section>
    </div>
  )
}
```

### 4. Ensure Responsive Behavior

Test layouts at different breakpoints:

- **Mobile (< 640px)**: Stack all widgets vertically
- **Tablet (640px - 1024px)**: 1-2 column layout
- **Desktop (> 1024px)**: Full grid with sidebar or sections

Example responsive classes:
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Widgets */}
</div>
```

### 5. Style Consistency

Ensure ActivityFeed matches other widgets:
- Same card background (bg-card)
- Same border radius (rounded-lg)
- Same padding (p-6)
- Same border color (border)
- Same spacing between sections (gap-6 or space-y-6)

### 6. Add Section Context (Optional)

If the dashboard has section headings:

```typescript
<section>
  <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
  <div className="grid ...">
    {/* Metrics widgets */}
  </div>
</section>

<section>
  <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
  <ActivityFeed />
</section>
```

### 7. Handle Loading States

Consider wrapping in Suspense if using Server Components:

```typescript
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Other widgets */}

      <Suspense fallback={<ActivityFeedSkeleton />}>
        <ActivityFeed />
      </Suspense>
    </div>
  )
}
```

### 8. Testing Approach

Verify:
- ActivityFeed renders on dashboard page
- Layout doesn't break on mobile, tablet, desktop
- Styling matches other dashboard widgets
- Loading states work correctly
- Component is positioned appropriately
- Auto-refresh continues to work when integrated

**Visual Regression Testing**:
- Capture screenshots at different viewport sizes
- Compare with existing dashboard widgets
- Ensure consistent spacing and alignment

**Integration Testing**:
```typescript
describe('Dashboard Page', () => {
  it('should display activity feed on dashboard', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
  })

  it('should be responsive on mobile', () => {
    // Set viewport to mobile size
    render(<DashboardPage />)
    // Verify layout stacks vertically
  })
})
```

## Manifest Update Instructions

**Before starting**: Read the current manifest at `docs/stories/prompts/6-4/manifest.md`

**After completing this task**:
1. Update Task 6 status to "Completed" with today's date (if not already done)
2. Update Task 7 status to "Completed" with today's date
3. Add implementation notes about:
   - Integration approach chosen (sidebar, bottom, full-width)
   - Dashboard page location
   - Responsive behavior verified

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-4/manifest.md`
2. **Proceed to Task 8**: Open `task-8-prompt.md` to write comprehensive tests for the entire feature
3. **Verify**: View the dashboard at different screen sizes and ensure ActivityFeed integrates smoothly

---

**Progress**: Task 7 of 8. The feature is integrated and visible. Final task is comprehensive testing.
