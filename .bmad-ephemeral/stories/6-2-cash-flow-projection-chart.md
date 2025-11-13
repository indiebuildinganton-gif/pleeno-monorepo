# Story 6.2: Cash Flow Projection Chart

Status: ready-for-dev

## Story

As an **Agency Admin**,
I want **a visual chart showing projected cash flow for the next 90 days**,
so that **I can anticipate incoming payments and plan accordingly**.

## Acceptance Criteria

1. **Given** I am viewing the dashboard
   **When** I access the cash flow widget
   **Then** I see a chart showing projected daily/weekly incoming payments for the next 90 days

2. **And** projections are based on scheduled installment due dates

3. **And** the chart distinguishes between expected payments and already-paid amounts

4. **And** I can hover over chart points to see details (student names, amounts)

5. **And** the chart updates in real-time as payments are recorded

6. **And** I can toggle between daily, weekly, and monthly views

## Tasks / Subtasks

- [ ] **Task 1: Create Cash Flow Projection API Route** (AC: #1-3, 5)
  - [ ] Create API route: `GET /api/dashboard/cash-flow-projection`
  - [ ] Accept query parameters:
    - `days` (default: 90): number of days to project forward
    - `groupBy` (default: "week"): "day", "week", or "month"
  - [ ] Query installments table:
    - Filter by: `agency_id` (via RLS), `student_due_date` between TODAY and TODAY + {days}
    - Include both pending and paid installments
  - [ ] Group results by date bucket (day/week/month):
    - Calculate `expected_amount`: SUM(installments.amount WHERE status = 'pending')
    - Calculate `paid_amount`: SUM(installments.amount WHERE status = 'paid')
    - Count installments per bucket
  - [ ] Return time series data: `[{ date: string, expected_amount: number, paid_amount: number, installment_count: number, installments: [] }]`
  - [ ] Join with students, payment_plans, enrollments, colleges for tooltip details
  - [ ] Apply RLS for agency_id filtering
  - [ ] Add 5-minute cache for performance

- [ ] **Task 2: Create CashFlowChart Component** (AC: #1, 3-6)
  - [ ] Create React component: `apps/dashboard/app/components/CashFlowChart.tsx`
  - [ ] Use TanStack Query to fetch cash flow data from `/api/dashboard/cash-flow-projection`
  - [ ] Render chart using Recharts library (stacked bar chart or area chart)
  - [ ] Configure chart axes:
    - X-axis: Date labels (format based on groupBy - "Jan 15", "Week 2", "Feb 2025")
    - Y-axis: Amount (formatted as currency using agency.currency)
  - [ ] Display two data series:
    - **Paid** (green bars/area): Already received payments
    - **Expected** (blue bars/area): Pending installments
  - [ ] Implement stacked visualization (paid on bottom, expected stacked on top)
  - [ ] Add chart legend explaining color coding

- [ ] **Task 3: Implement Interactive Tooltip** (AC: #4)
  - [ ] Configure Recharts CustomTooltip component
  - [ ] Display on hover for each date bucket:
    - Date range (e.g., "Jan 15-21, 2025" for weekly view)
    - Total Expected: ${amount}
    - Total Paid: ${amount}
    - Total for Period: ${expected + paid}
    - Number of Installments: {count}
  - [ ] Show list of students in that period (limit to top 5 if > 5):
    - Student Name - ${amount} ({status})
    - "...and {n} more" if exceeds 5
  - [ ] Format amounts using agency currency
  - [ ] Handle empty buckets (no data for that period)

- [ ] **Task 4: Add View Toggle Controls** (AC: #6)
  - [ ] Add button group above chart: "Daily" | "Weekly" | "Monthly"
  - [ ] Use Zustand store to persist selected view (dashboard-store)
  - [ ] On toggle:
    - Update query parameter `groupBy` value
    - Refetch data via TanStack Query
    - Update chart with new grouping
  - [ ] Default to "Weekly" view
  - [ ] Highlight selected button (active state styling)

- [ ] **Task 5: Implement Real-Time Updates** (AC: #5)
  - [ ] Configure TanStack Query to refetch on:
    - Window focus (user returns to dashboard)
    - Background refetch every 5 minutes
    - Manual refetch when user records payment (via mutation callback)
  - [ ] Use Supabase Realtime subscription (optional enhancement):
    - Subscribe to installments table changes
    - Filter by agency_id and date range
    - Invalidate query cache on insert/update
  - [ ] Add visual indicator when data is being updated (loading spinner in corner)

- [ ] **Task 6: Add Widget Header and Controls** (AC: #1, 6)
  - [ ] Add widget container with header:
    - Title: "Cash Flow Projection (Next 90 Days)"
    - Refresh button (manual refetch)
    - View toggle buttons (Daily/Weekly/Monthly)
  - [ ] Add summary metrics above chart:
    - Total Expected: ${sum of expected_amount}
    - Total Paid: ${sum of paid_amount}
    - Net Projection: ${total expected}
  - [ ] Add date range indicator: "Jan 15 - Apr 15, 2025"
  - [ ] Responsive layout (full width widget, stacks on mobile)

- [ ] **Task 7: Integrate into Dashboard Page** (AC: #1)
  - [ ] Import CashFlowChart component into `apps/dashboard/app/page.tsx`
  - [ ] Position below KPI widgets (from Story 6.1) in responsive grid
  - [ ] Place in full-width row (spans entire dashboard width)
  - [ ] Add section heading: "Cash Flow Projection"
  - [ ] Ensure consistent styling with other dashboard widgets
  - [ ] Verify widget displays correctly on desktop, tablet, and mobile

- [ ] **Task 8: Testing** (AC: All)
  - [ ] Write API route unit tests:
    - Test date grouping logic (daily, weekly, monthly)
    - Test expected vs paid amount calculation
    - Test date range filtering (90 days from today)
    - Test empty result sets
    - Verify RLS filtering by agency_id
  - [ ] Write component tests using React Testing Library:
    - Test chart rendering with mock data
    - Test view toggle (daily/weekly/monthly)
    - Test tooltip display on hover
    - Test loading state (skeleton)
    - Test error state with retry button
    - Test real-time refetch behavior
  - [ ] Write integration test:
    - Dashboard loads → Cash flow chart displays
    - Record payment → Chart updates (refetch triggered)
    - Toggle view → Chart re-renders with new grouping
  - [ ] Test chart responsiveness on different screen sizes

## Dev Notes

### Architecture Context

**Dashboard Zone:**
- Component lives in `apps/dashboard/app/components/CashFlowChart.tsx`
- API route at `apps/dashboard/app/api/cash-flow-projection/route.ts`
- Uses Recharts library for data visualization

**Database Schema Dependencies:**
- `installments` table: `amount`, `student_due_date`, `status`, `payment_plan_id`
- `payment_plans` table: links to students via enrollments
- `students` table: `full_name` for tooltip details
- `enrollments` table: links students to colleges
- `colleges` table: `name` for context

**Date Handling:**
- All date calculations use agency timezone (from `agencies.timezone`)
- Query range: TODAY to TODAY + 90 days
- Group by logic:
  - Daily: Each date is a bucket
  - Weekly: `date_trunc('week', student_due_date)` groups by week start (Monday)
  - Monthly: `date_trunc('month', student_due_date)` groups by month start (1st)
- Use `date-fns` library for date formatting and manipulation
- Use `date-fns-tz` for timezone-aware conversions

### Learnings from Previous Story

**From Story 6.1 (Status: drafted)**

Story 6.1 established the dashboard infrastructure and KPI widgets. This story builds on that foundation.

**Key Points for Implementation:**
- Dashboard zone already exists at `apps/dashboard/`
- KPI widgets pattern established (can follow same structure)
- TanStack Query caching configured with 5-minute stale time
- Recharts library already installed and used in SeasonalCommissionChart
- Currency formatting utility available in `packages/utils/src/formatters.ts`
- RLS policies auto-filter by agency_id

**Patterns to Reuse:**
- API route structure: Same pattern as `/api/dashboard/kpis`
- Component structure: Follow KPIWidget component pattern
- TanStack Query setup: Same caching strategy
- Loading/error states: Use same skeleton and error UI patterns
- Currency formatting: Use existing `formatCurrency()` function

**New Patterns Introduced:**
- **View Toggle State:** Use Zustand dashboard-store to persist user's preferred view
- **Real-time Updates:** Implement TanStack Query refetch on window focus + background refetch
- **Interactive Tooltips:** Recharts CustomTooltip with detailed student list
- **Stacked Visualization:** Two data series (paid + expected) in single chart

### Project Structure Notes

**Component Organization:**
```
apps/dashboard/
├── app/
│   ├── page.tsx                           # Import CashFlowChart
│   ├── api/
│   │   └── cash-flow-projection/
│   │       └── route.ts                   # Cash flow API
│   └── components/
│       ├── CashFlowChart.tsx              # Main chart component
│       └── CashFlowTooltip.tsx            # Custom tooltip (optional)
```

**Shared Utilities:**
- Date helpers: `packages/utils/src/date-helpers.ts`
  - `formatDateRange(start, end, groupBy)` - Format x-axis labels
  - `getDateBuckets(startDate, days, groupBy)` - Generate empty buckets
- Currency formatting: `packages/utils/src/formatters.ts`
  - `formatCurrency(amount, currency)` - Format amounts with agency currency
- Dashboard store: `packages/stores/src/dashboard-store.ts`
  - Add `cashFlowView: 'daily' | 'weekly' | 'monthly'` state
  - Add `setCashFlowView(view)` action

### Cash Flow Calculation Logic

**Query Logic (PostgreSQL):**

```sql
-- Weekly grouping example
SELECT
  date_trunc('week', student_due_date) AS date_bucket,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_amount,
  SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS expected_amount,
  COUNT(*) AS installment_count,
  json_agg(json_build_object(
    'student_name', students.full_name,
    'amount', installments.amount,
    'status', installments.status,
    'due_date', installments.student_due_date
  )) AS installments
FROM installments
JOIN payment_plans ON installments.payment_plan_id = payment_plans.id
JOIN enrollments ON payment_plans.enrollment_id = enrollments.id
JOIN students ON enrollments.student_id = students.id
WHERE
  installments.agency_id = auth.uid()  -- RLS auto-applied
  AND installments.student_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
GROUP BY date_bucket
ORDER BY date_bucket ASC;
```

**Application Logic (TypeScript):**

```typescript
// Date bucket generation (fill gaps with zero values)
function fillDateBuckets(data: CashFlowData[], days: number, groupBy: GroupBy) {
  const buckets = getDateBuckets(new Date(), days, groupBy)
  return buckets.map(bucket => {
    const existing = data.find(d => isSameDate(d.date_bucket, bucket))
    return existing || {
      date_bucket: bucket,
      paid_amount: 0,
      expected_amount: 0,
      installment_count: 0,
      installments: []
    }
  })
}
```

### Performance Optimization

**Database Indexes:**
```sql
-- Add index for cash flow queries
CREATE INDEX idx_installments_due_date_agency ON installments(agency_id, student_due_date);
CREATE INDEX idx_installments_status ON installments(status) WHERE status IN ('pending', 'paid');
```

**Caching Strategy:**
- API route: 5-minute cache (Next.js `revalidate` or Vercel Edge caching)
- TanStack Query: 5-minute stale time, background refetch on window focus
- Consider pre-computing buckets in materialized view for large datasets (future optimization)

**Query Optimization:**
- Limit query to 90-day window (reduces data volume)
- Use database aggregation (SUM, COUNT) instead of fetching all rows
- Index on `student_due_date` and `agency_id` for fast filtering
- Limit installments JSON array to essential fields only

### Chart Configuration (Recharts)

**Stacked Bar Chart Setup:**

```typescript
<ResponsiveContainer width="100%" height={400}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      dataKey="date_bucket"
      tickFormatter={(date) => formatDateLabel(date, groupBy)}
    />
    <YAxis
      tickFormatter={(value) => formatCurrency(value, agency.currency)}
    />
    <Tooltip content={<CashFlowTooltip />} />
    <Legend />
    <Bar
      dataKey="paid_amount"
      stackId="a"
      fill="#10b981" // green-500
      name="Paid"
    />
    <Bar
      dataKey="expected_amount"
      stackId="a"
      fill="#3b82f6" // blue-500
      name="Expected"
    />
  </BarChart>
</ResponsiveContainer>
```

**Alternative: Area Chart (for smoother visualization):**

```typescript
<ResponsiveContainer width="100%" height={400}>
  <AreaChart data={chartData}>
    <defs>
      <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
      </linearGradient>
      <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
      </linearGradient>
    </defs>
    <XAxis dataKey="date_bucket" />
    <YAxis />
    <Tooltip content={<CashFlowTooltip />} />
    <Area
      type="monotone"
      dataKey="paid_amount"
      stackId="1"
      stroke="#10b981"
      fill="url(#colorPaid)"
    />
    <Area
      type="monotone"
      dataKey="expected_amount"
      stackId="1"
      stroke="#3b82f6"
      fill="url(#colorExpected)"
    />
  </AreaChart>
</ResponsiveContainer>
```

### Real-Time Updates Implementation

**TanStack Query Setup:**

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['cash-flow-projection', groupBy, days],
  queryFn: () => fetchCashFlowProjection({ groupBy, days }),
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: true, // Auto-refetch when user returns
  refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
})
```

**Mutation Integration (auto-refetch on payment recording):**

```typescript
// In payment recording mutation
const recordPaymentMutation = useMutation({
  mutationFn: recordPayment,
  onSuccess: () => {
    // Invalidate cash flow query to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['cash-flow-projection'] })
  }
})
```

**Supabase Realtime (Optional Enhancement):**

```typescript
useEffect(() => {
  const channel = supabase
    .channel('cash-flow-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'installments',
        filter: `agency_id=eq.${agencyId}`,
      },
      () => {
        // Invalidate query on any installment change
        queryClient.invalidateQueries({ queryKey: ['cash-flow-projection'] })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [agencyId])
```

### Testing Standards

**API Route Tests (Vitest):**
- Mock Supabase client queries
- Test date grouping logic (daily, weekly, monthly):
  - Verify correct `date_trunc` function used
  - Verify buckets align to correct start dates (week = Monday, month = 1st)
- Test expected vs paid calculation:
  - Verify SUM aggregation correct
  - Verify status filtering (pending vs paid)
- Test date range filtering (90 days from today)
- Test empty result sets (no installments in period)
- Test edge cases:
  - Single installment
  - All paid installments
  - All pending installments
  - Mixed statuses
- Verify RLS filtering by agency_id

**Component Tests (React Testing Library):**
- Test chart rendering with mock data:
  - Verify Recharts BarChart renders
  - Verify correct number of bars (2 per bucket: paid + expected)
- Test view toggle:
  - Click "Daily" → refetch with groupBy=day
  - Click "Weekly" → refetch with groupBy=week
  - Click "Monthly" → refetch with groupBy=month
  - Verify selected button highlighted
- Test tooltip display on hover:
  - Hover over bar → tooltip appears
  - Tooltip shows correct date range, amounts, student list
  - Hover away → tooltip disappears
- Test loading state:
  - Query loading → skeleton UI displays
  - Data loads → chart renders
- Test error state:
  - Query error → error message displays
  - Click retry → refetch triggered
- Test real-time refetch:
  - Simulate window focus → verify refetch called
  - Wait 5 minutes → verify background refetch called
- Test currency formatting:
  - Verify amounts formatted with agency.currency
  - Verify Y-axis labels formatted correctly

**Integration Tests (Playwright):**
- E2E flow: Login → Dashboard → Cash flow chart visible
- E2E flow: Record payment → Chart updates (refetch triggered)
- E2E flow: Toggle view (Daily/Weekly/Monthly) → Chart re-renders
- Test responsiveness: Desktop, tablet, mobile views

### Security Considerations

**Row-Level Security:**
- All queries MUST respect RLS policies (agency_id filtering automatic)
- Use server-side Supabase client (not anon key) in API routes
- JWT auth middleware protects dashboard routes

**Data Privacy:**
- Cash flow projections only show current user's agency data
- No cross-agency data leakage possible (enforced by RLS)
- Student names in tooltip only visible to users in same agency

### Accessibility Considerations

**WCAG 2.1 Level AA Compliance:**
- Chart colors: Green (#10b981) and Blue (#3b82f6) have sufficient contrast ratio
- Status communicated through color + legend text (not color alone)
- Keyboard navigation: Tab through view toggle buttons, Enter to select
- Screen reader support:
  - Add `aria-label` to chart container: "Cash flow projection for next 90 days"
  - Add `role="region"` to widget
  - Add `aria-live="polite"` for real-time updates
- Tooltip accessible via keyboard focus (Recharts supports this)

### User Experience Enhancements

**Empty State:**
- If no installments in 90-day window:
  - Display message: "No upcoming payments scheduled in the next 90 days"
  - Show illustration (empty chart icon)
  - Add CTA: "Create Payment Plan" button

**Loading State:**
- Skeleton loader with chart shape (bars placeholders)
- Smooth transition from skeleton to actual chart

**Error State:**
- Clear error message: "Unable to load cash flow projection"
- Retry button
- Support contact link

**Visual Indicators:**
- Current date marker: Vertical line showing "Today"
- Weekend shading (optional): Light gray background for weekends
- Milestone markers (optional): Highlight months/quarters

### References

- [Source: docs/epics.md#Story 6.2] - Acceptance criteria and technical notes
- [Source: docs/architecture.md#Dashboard Endpoints] - API structure for cash flow queries
- [Source: docs/architecture.md#Date Handling Pattern] - Timezone-aware date helpers
- [Source: docs/architecture.md#Multi-Tenant Isolation] - RLS policy patterns
- [Source: docs/architecture.md#Performance Considerations] - Caching and query optimization
- [Source: docs/PRD.md#Critical User Flows] - Flow 4: Review Cash Flow Projection

## Dev Agent Record

### Context Reference

- .bmad-ephemeral/stories/6-2-cash-flow-projection-chart.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
