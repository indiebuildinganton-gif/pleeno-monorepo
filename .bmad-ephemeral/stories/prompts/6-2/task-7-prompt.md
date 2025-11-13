# Story 6-2: Cash Flow Projection Chart - Task 7

## Story Context

**As an** Agency Admin
**I want** a visual chart showing projected cash flow for the next 90 days
**So that** I can anticipate incoming payments and plan accordingly

## Task 7: Integrate into Dashboard Page

**Acceptance Criteria:** #1

### Previous Task Completion

✅ Task 1: Cash Flow Projection API route created
✅ Task 2: CashFlowChart component with visualization
✅ Task 3: Interactive tooltip with student details
✅ Task 4: View toggle controls (Daily/Weekly/Monthly)
✅ Task 5: Real-time updates configured
✅ Task 6: Widget header and summary metrics

The Cash Flow Chart widget is now complete and ready to integrate into the dashboard.

### Task Description

Add the CashFlowChart component to the main dashboard page, positioning it below the KPI widgets in a full-width layout. Ensure consistent styling and responsive behavior.

### Subtasks

- [ ] Import CashFlowChart component into `apps/dashboard/app/page.tsx`
- [ ] Position below KPI widgets (from Story 6.1) in responsive grid
- [ ] Place in full-width row (spans entire dashboard width)
- [ ] Add section heading: "Cash Flow Projection"
- [ ] Ensure consistent styling with other dashboard widgets
- [ ] Verify widget displays correctly on desktop, tablet, and mobile

### Context

**Dashboard Page Location:** `apps/dashboard/app/page.tsx`

**Expected Layout:**
```
┌─────────────────────────────────────┐
│          Dashboard Header           │
├─────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐│
│  │ KPI │  │ KPI │  │ KPI │  │ KPI ││  ← From Story 6.1
│  └─────┘  └─────┘  └─────┘  └─────┘│
├─────────────────────────────────────┤
│   Cash Flow Projection              │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │   [Cash Flow Chart Widget]    │  │  ← YOU ARE HERE
│  │                               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Dashboard Zone Structure:**
- Dashboard app at `apps/dashboard/`
- Main page at `apps/dashboard/app/page.tsx`
- Components in `apps/dashboard/app/components/`

### Related Documentation

- [docs/architecture.md](docs/architecture.md#dashboard-zone) - Dashboard layout patterns
- [.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.md](.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.md) - KPI widgets layout

---

## Update Manifest

Before coding, update `docs/stories/prompts/6-2/manifest.md`:

1. Mark Task 6 as "Completed" with today's date
2. Add notes about Task 6
3. Mark Task 7 as "In Progress" with today's date

---

## Implementation Steps

### 1. Locate Dashboard Page

Find and open `apps/dashboard/app/page.tsx`

If the file doesn't exist yet (Story 6.1 may not be complete), create it:

```typescript
// apps/dashboard/app/page.tsx
import { Suspense } from 'react'
import CashFlowChart from './components/CashFlowChart'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your agency's performance</p>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {/* KPI Widgets Section (from Story 6.1) */}
          {/* TODO: Add KPI widgets here when Story 6.1 is complete */}

          {/* Cash Flow Projection Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cash Flow Projection
            </h2>
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
              <CashFlowChart />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  )
}
```

### 2. If Dashboard Page Already Exists (Story 6.1 Complete)

Add the Cash Flow Chart section after KPI widgets:

```typescript
// apps/dashboard/app/page.tsx
import { Suspense } from 'react'
import KPIWidgets from './components/KPIWidgets'  // From Story 6.1
import CashFlowChart from './components/CashFlowChart'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your agency's performance</p>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {/* KPI Widgets Section */}
          <section>
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded-lg" />}>
              <KPIWidgets />
            </Suspense>
          </section>

          {/* Cash Flow Projection Section - NEW */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cash Flow Projection
            </h2>
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
              <CashFlowChart />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  )
}
```

### 3. Ensure Responsive Layout

Verify the layout works on all screen sizes:

```typescript
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Content */}
</div>
```

### 4. Add Loading Fallback

Use Suspense to show loading state:

```typescript
<Suspense fallback={
  <div className="bg-white rounded-lg shadow-lg p-6">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-96 bg-gray-200 rounded"></div>
    </div>
  </div>
}>
  <CashFlowChart />
</Suspense>
```

### 5. Optional: Add Error Boundary

Wrap in ErrorBoundary for better error handling:

```typescript
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary
  fallback={
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p className="text-red-600">Failed to load cash flow projection</p>
    </div>
  }
>
  <CashFlowChart />
</ErrorBoundary>
```

---

## Next Steps

After completing Task 7:

1. **Update the manifest** - Mark Task 7 as completed, Task 8 as in progress
2. **Test the integration:**
   - Visit `/dashboard` route
   - Verify Cash Flow Chart displays
   - Check responsive layout on mobile
3. **Move to Task 8** - Open `task-8-prompt.md` to write tests

---

## Testing Checklist

### Visual Testing

- [ ] Dashboard page loads at `/dashboard` route
- [ ] Cash Flow Chart widget displays below KPI widgets
- [ ] Widget spans full width of dashboard
- [ ] Section heading "Cash Flow Projection" displays above widget
- [ ] Widget styling matches other dashboard components
- [ ] Loading fallback shows while data fetches
- [ ] No layout shifts when chart loads

### Responsive Testing

- [ ] Desktop (1920px): Widget displays at max-width with proper margins
- [ ] Tablet (768px): Widget adjusts to smaller width, maintains readability
- [ ] Mobile (375px):
  - [ ] Summary metrics stack vertically
  - [ ] Toggle buttons stack or remain horizontal (both acceptable)
  - [ ] Chart remains readable
  - [ ] No horizontal scrolling

### Integration Testing

- [ ] Chart fetches data from API successfully
- [ ] View toggle works (Daily/Weekly/Monthly)
- [ ] Tooltip appears on hover
- [ ] Real-time updates work (refetch on focus)
- [ ] Refresh button triggers manual refetch
- [ ] No console errors

---

## Common Issues

**Issue:** Dashboard page doesn't exist yet
- **Solution:** Create new page file with basic structure

**Issue:** KPI widgets from Story 6.1 not available
- **Solution:** Add placeholder comment, Cash Flow Chart still works independently

**Issue:** Styling inconsistency with other widgets
- **Solution:** Use same Tailwind classes (bg-white, rounded-lg, shadow-lg, p-6)

**Issue:** Chart too wide on small screens
- **Solution:** Ensure ResponsiveContainer width="100%" and parent has max-width

---

**Update the manifest, then integrate the chart into the dashboard!**
