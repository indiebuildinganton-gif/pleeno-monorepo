# Task 8: Integrate into Dashboard Page

## Context
You are implementing **Story 6.3: Commission Breakdown by College** for the Pleeno agency management platform. This task integrates the commission breakdown widget into the main dashboard page.

**Story Goal**: Enable Agency Admins to see commission breakdown by college/branch with tax details to identify valuable institutions and prioritize relationships.

**This Task**: Import the commission breakdown widget and position it on the dashboard page in a full-width layout below the Cash Flow Chart (from Story 6.2).

## Acceptance Criteria Coverage
This task addresses AC #1:
- AC #1: Dashboard widget displays commission breakdown when viewing dashboard

## Task Requirements

### Dashboard Page Location
- **File**: `apps/dashboard/app/page.tsx`
- **Purpose**: Main dashboard page that displays KPI widgets, charts, and tables

### Widget Positioning
Place the Commission Breakdown Widget:
1. **Below** Cash Flow Chart (from Story 6.2)
2. **Full-width** row (spans entire dashboard width)
3. **Above** any footer or lower content
4. In a responsive grid layout

### Expected Dashboard Layout
```
┌──────────────────────────────────────────────────────────────────┐
│ Dashboard Header / Navigation                                    │
├──────────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│ │ KPI Card 1 │ │ KPI Card 2 │ │ KPI Card 3 │ │ KPI Card 4 │    │ ← KPI widgets
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Cash Flow Projection Chart (Story 6.2)                     │  │ ← Cash flow widget
│ └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Commission Breakdown by College (Story 6.3)                │  │ ← NEW widget
│ │ [Summary Cards]                                            │  │
│ │ [Filters]                                                  │  │
│ │ [Table]                                                    │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Import Widget Component
```typescript
import { CommissionBreakdownWidget } from '@/components/CommissionBreakdownWidget'
```

### Dashboard Page Structure
```typescript
// apps/dashboard/app/page.tsx

import { CommissionBreakdownWidget } from '@/components/CommissionBreakdownWidget'
import { CashFlowChart } from '@/components/CashFlowChart' // From Story 6.2
import { KPICards } from '@/components/KPICards' // Existing KPI widgets

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's your agency performance overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICards />
      </div>

      {/* Cash Flow Chart (Story 6.2) */}
      <div className="mb-8">
        <CashFlowChart />
      </div>

      {/* Commission Breakdown Widget (Story 6.3) */}
      <div className="mb-8">
        <CommissionBreakdownWidget />
      </div>

      {/* Future widgets can be added here */}
    </div>
  )
}
```

### Responsive Grid Layout
Use consistent spacing and responsive breakpoints:
- **Mobile (sm)**: Single column, stacked vertically
- **Tablet (md)**: Full width for charts/tables, 2 columns for KPIs
- **Desktop (lg+)**: Full width for charts/tables, 4 columns for KPIs

### Section Heading (Optional)
If desired, add a section heading above the widget:
```typescript
<div className="mb-8">
  <h2 className="text-xl font-semibold text-gray-800 mb-4">
    Commission Performance
  </h2>
  <CommissionBreakdownWidget />
</div>
```

## Styling Considerations

### Consistent Spacing
- Use consistent margin/padding between widgets (e.g., `mb-8`)
- Ensure visual separation between sections
- Maintain consistent container padding

### Widget Width
- Commission breakdown should span full width of content area
- Use same container width as Cash Flow Chart
- Responsive: adapts to screen size

### Visual Hierarchy
- Clear separation between dashboard sections
- Widget has own border/shadow (from Task 6)
- Consistent typography across dashboard

## Integration Checklist

### Pre-Integration Checks
Before integrating, ensure these are complete:
- [ ] Task 1: API route created and working
- [ ] Task 2: CommissionBreakdownTable component created
- [ ] Task 3: Filter controls implemented
- [ ] Task 4: Drill-down links implemented
- [ ] Task 5: Summary metrics added
- [ ] Task 6: Widget header and container created
- [ ] Task 7: GST calculation utilities created

### Post-Integration Verification
After integrating, verify:
- [ ] Dashboard page loads without errors
- [ ] Commission breakdown widget renders
- [ ] Widget displays below Cash Flow Chart
- [ ] Widget spans full width
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] No layout shifts or visual glitches
- [ ] Other widgets (KPIs, Cash Flow) still work correctly

## Testing Requirements

### Integration Tests Required
Create: `__tests__/e2e/dashboard.spec.ts` (add to existing file if exists)

**Test Cases**:
1. **Test dashboard loads**
   - Navigate to dashboard
   - Verify page loads successfully
   - Verify no console errors

2. **Test commission breakdown widget displays**
   - Dashboard loads
   - Verify "Commission Breakdown by College" heading visible
   - Verify widget container displays
   - Verify table renders with data

3. **Test widget positioning**
   - Verify widget is below Cash Flow Chart
   - Verify widget is above footer (if exists)
   - Verify full-width layout

4. **Test responsive layout**
   - Test on desktop viewport
   - Test on tablet viewport (768px)
   - Test on mobile viewport (375px)
   - Verify widgets stack correctly

5. **Test all dashboard widgets work together**
   - Verify KPI cards display
   - Verify Cash Flow Chart displays
   - Verify Commission Breakdown displays
   - No layout conflicts or overlaps

### E2E Test Pattern (Playwright)
```typescript
import { test, expect } from '@playwright/test'

test.describe('Dashboard - Commission Breakdown Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('commission breakdown widget displays on dashboard', async ({ page }) => {
    // Verify widget heading
    await expect(page.getByText('Commission Breakdown by College')).toBeVisible()

    // Verify widget container
    await expect(page.locator('[class*="CommissionBreakdownWidget"]')).toBeVisible()

    // Verify table renders
    await expect(page.locator('table')).toBeVisible()
  })

  test('widget is positioned below cash flow chart', async ({ page }) => {
    const cashFlowChart = page.locator('[class*="CashFlowChart"]')
    const commissionWidget = page.locator('[class*="CommissionBreakdownWidget"]')

    const cashFlowBox = await cashFlowChart.boundingBox()
    const commissionBox = await commissionWidget.boundingBox()

    // Commission widget should be below (higher Y position)
    expect(commissionBox.y).toBeGreaterThan(cashFlowBox.y)
  })

  test('dashboard layout is responsive', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    await expect(page.locator('[class*="CommissionBreakdownWidget"]')).toBeVisible()

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('[class*="CommissionBreakdownWidget"]')).toBeVisible()

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('[class*="CommissionBreakdownWidget"]')).toBeVisible()
  })
})
```

## Error Handling

### Widget Load Failure
If the commission breakdown widget fails to load:
- Dashboard should still render other widgets
- Display error boundary or fallback UI
- Log error for debugging
- Don't break entire dashboard

Example error boundary:
```typescript
import { ErrorBoundary } from 'react-error-boundary'

function DashboardPage() {
  return (
    <div>
      {/* Other widgets */}

      <ErrorBoundary
        fallback={<div className="p-4 bg-red-50 rounded">Unable to load commission breakdown</div>}
        onError={(error) => console.error('Commission widget error:', error)}
      >
        <CommissionBreakdownWidget />
      </ErrorBoundary>
    </div>
  )
}
```

## Performance Considerations

### Widget Loading
- Commission breakdown widget fetches data independently
- Uses TanStack Query caching (5-minute stale time)
- Doesn't block other widgets from loading

### Page Load Performance
- Consider lazy loading widgets below the fold
- Use React Suspense for code splitting if needed
- Monitor page load time with all widgets

## Accessibility Considerations

### Page Structure
- Proper heading hierarchy (h1 → h2 → h3)
- Dashboard title is h1
- Widget titles are h2 or h3
- Section titles maintain hierarchy

### Keyboard Navigation
- User can tab through dashboard widgets
- Focus order is logical (top to bottom)
- All interactive elements accessible via keyboard

### Screen Reader Support
- Dashboard structure readable by screen readers
- Widgets have meaningful headings
- Skip links if page is long

## Dependencies
- Widget component from Task 6: `CommissionBreakdownWidget`
- Dashboard page: `apps/dashboard/app/page.tsx` (existing file)

## Success Criteria
- [ ] Dashboard page file edited
- [ ] CommissionBreakdownWidget imported
- [ ] Widget added to page layout
- [ ] Widget positioned below Cash Flow Chart
- [ ] Widget in full-width row
- [ ] Section heading added (optional)
- [ ] Consistent spacing applied
- [ ] Dashboard loads successfully
- [ ] No console errors
- [ ] All widgets render correctly
- [ ] Responsive layout works on all screen sizes
- [ ] Integration tests written and passing
- [ ] Error handling implemented

## Related Files
- Dashboard page: `apps/dashboard/app/page.tsx` (edit)
- Widget component: `apps/dashboard/app/components/CommissionBreakdownWidget.tsx` (Task 6)
- E2E tests: `__tests__/e2e/dashboard.spec.ts` (create or edit)
- Story file: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md`

## Next Steps
After completing this task, proceed to **Task 9: Testing** which will add comprehensive test coverage for all components and integration points.
