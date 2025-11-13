# Story 6-5: Overdue Payments Summary Widget - Task 5

## Story Context

**As an** Agency User
**I want** a dedicated widget highlighting all overdue payments
**So that** I can immediately focus on the most urgent follow-ups

## Task 5: Integrate Widget into Dashboard

**Acceptance Criteria**: #1

### Task Description

Integrate the OverduePaymentsWidget into the main dashboard page with prominent positioning to ensure maximum visibility of urgent overdue payments.

### Subtasks

- [ ] Import OverduePaymentsWidget into `apps/dashboard/app/page.tsx`
- [ ] Position widget prominently:
  - Option A: Top of dashboard (above KPIs) for maximum visibility
  - Option B: Dedicated sidebar section (always visible)
  - Option C: Below KPIs but above other widgets
- [ ] Use urgent/attention-grabbing styling:
  - Red border or background tint when overdue items exist
  - Neutral styling when empty (no overdue)
- [ ] Ensure widget displays correctly on desktop, tablet, and mobile
- [ ] Verify widget is visible without scrolling (important for urgency)

## Context

### Key Constraints

- **Prominent Positioning**: Widget should be positioned at top of dashboard or in always-visible sidebar for maximum visibility
- **Responsive Layout**: Table on desktop, cards on mobile
- **Visual Urgency**: Widget should stand out when overdue items exist
- **Above the Fold**: Widget must be visible without scrolling

### Dashboard Integration Example

**Option A: Top of Dashboard (Recommended)**
```typescript
// apps/dashboard/app/page.tsx

import { OverduePaymentsWidget } from './components/OverduePaymentsWidget'
import { KPIWidget } from './components/KPIWidget'
import { CashFlowChart } from './components/CashFlowChart'

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Overdue Payments - TOP POSITION for maximum visibility */}
      <OverduePaymentsWidget />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPIWidget title="Total Collected" value="$125,000" />
        <KPIWidget title="Pending" value="$45,000" />
        <KPIWidget title="Overdue" value="$8,500" />
      </div>

      {/* Charts and other widgets */}
      <CashFlowChart />

      {/* Other dashboard content */}
    </div>
  )
}
```

**Option B: Sidebar (Alternative)**
```typescript
// apps/dashboard/app/page.tsx

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Overdue Payments (sticky on desktop) */}
        <aside className="lg:col-span-1">
          <div className="sticky top-6">
            <OverduePaymentsWidget />
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPIWidget title="Total Collected" value="$125,000" />
            <KPIWidget title="Pending" value="$45,000" />
            <KPIWidget title="Overdue" value="$8,500" />
          </div>

          <CashFlowChart />
        </main>
      </div>
    </div>
  )
}
```

**Option C: Below KPIs (Alternative)**
```typescript
// apps/dashboard/app/page.tsx

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* KPIs first */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPIWidget title="Total Collected" value="$125,000" />
        <KPIWidget title="Pending" value="$45,000" />
        <KPIWidget title="Overdue" value="$8,500" />
      </div>

      {/* Overdue Payments - Prominent but not overwhelming */}
      <OverduePaymentsWidget />

      {/* Charts and other widgets */}
      <CashFlowChart />
    </div>
  )
}
```

### Conditional Rendering (Optional Enhancement)

If you want to only show the widget when overdue payments exist:

```typescript
// apps/dashboard/app/page.tsx

import { useOverduePayments } from './hooks/useOverduePayments'

export default function DashboardPage() {
  const { data } = useOverduePayments()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Only show widget if overdue payments exist (or always show for empty state celebration) */}
      <OverduePaymentsWidget />

      {/* Rest of dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPIWidget title="Total Collected" value="$125,000" />
        <KPIWidget title="Pending" value="$45,000" />
        <KPIWidget title="Overdue" value="$8,500" />
      </div>

      <CashFlowChart />
    </div>
  )
}
```

### Responsive Considerations

**Mobile (< 768px)**:
- Widget displays full-width at top
- Card-based layout for overdue items
- Stacked layout

**Tablet (768px - 1024px)**:
- Widget full-width or in sidebar
- Table layout for overdue items
- Consider grid layout

**Desktop (> 1024px)**:
- Option A: Full-width at top
- Option B: Sidebar with sticky positioning
- Table layout for overdue items

### Dependencies

- **react** (18.x): React library
- **next** (15.x): Next.js App Router
- **OverduePaymentsWidget**: Component from Task 2

### Reference Documentation

- [docs/architecture.md](../../architecture.md) - Dashboard Zone architecture
- [docs/epics.md](../../epics.md) - Epic 6: Story 6.5
- [.bmad-ephemeral/stories/6-5-overdue-payments-summary-widget.md](../../../.bmad-ephemeral/stories/6-5-overdue-payments-summary-widget.md) - Dashboard placement strategy

## Implementation Guide

1. **Locate the dashboard page file**: `apps/dashboard/app/page.tsx`

2. **Import the widget component**:
   ```typescript
   import { OverduePaymentsWidget } from './components/OverduePaymentsWidget'
   ```

3. **Choose positioning strategy**:
   - **Recommended**: Option A (top of dashboard) for maximum visibility
   - Alternative: Option B (sidebar) for always-visible urgency
   - Alternative: Option C (below KPIs) for balanced approach

4. **Add the widget** to the dashboard layout

5. **Test responsive behavior**:
   - Desktop: Ensure widget is visible without scrolling
   - Tablet: Verify layout doesn't break
   - Mobile: Verify widget displays correctly at top

6. **Verify styling**:
   - Widget has red accent when overdue items exist
   - Widget has green accent when empty
   - Widget integrates visually with dashboard theme

### Layout Best Practices

**Grid System**:
- Use Tailwind grid utilities for responsive layout
- Ensure consistent spacing with other dashboard elements

**Visibility**:
- Widget should be in the viewport on page load (no scrolling needed)
- Use sticky positioning if using sidebar approach

**Visual Hierarchy**:
- Overdue widget should stand out (red border/background)
- But shouldn't overwhelm other important metrics

### Testing Approach

Create test cases to verify:
- Widget renders on dashboard page load
- Widget is positioned correctly (top, sidebar, or below KPIs)
- Widget is visible without scrolling (above the fold)
- Responsive layout works on mobile, tablet, desktop
- Widget integrates visually with dashboard theme
- Clicking overdue item navigates to payment plan detail

### Placement Decision Factors

**Option A: Top of Dashboard**
- ✅ Maximum visibility
- ✅ Immediate attention to urgency
- ❌ Pushes other content down
- **Use when**: Overdue payments are critical priority

**Option B: Sidebar**
- ✅ Always visible (sticky)
- ✅ Doesn't disrupt main content flow
- ❌ Less space for other sidebar widgets
- **Use when**: Dashboard has many widgets

**Option C: Below KPIs**
- ✅ Balanced visibility
- ✅ KPIs shown first (big picture)
- ❌ Might be below fold on smaller screens
- **Use when**: KPIs are higher priority

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-5/manifest.md`:
   - Change Task 5 status to "Completed"
   - Add completion date
   - Note which positioning option you chose (A, B, or C)

2. **Proceed to Task 6**: Open `task-6-prompt.md` to add auto-refresh functionality

3. **Verify**: Test the dashboard page in the browser to ensure:
   - Widget displays correctly
   - Widget is visible without scrolling
   - Responsive layout works on all screen sizes

---

**Remember**: This is Task 5 of 7. Task 6 will add auto-refresh for real-time updates.
