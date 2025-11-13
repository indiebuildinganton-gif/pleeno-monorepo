# Story 6.3: Commission Breakdown by College

Status: ready-for-dev

## Story

As an **Agency Admin**,
I want **to see commission breakdown by college/branch with tax details**,
so that **I know which institutions are most valuable, understand tax implications, and can prioritize relationships**.

## Acceptance Criteria

1. **Given** I am viewing the dashboard
   **When** I access the commission breakdown widget
   **Then** I see a table or chart showing commission earned per college/branch

2. **And** each row shows: college name, branch name, total commissions, total GST, total commission + GST, total expected commission, total earned commission, outstanding commission

3. **And** the list is sortable by any column

4. **And** I can filter by college, branch, and time period (all time, this year, this quarter, this month)

5. **And** clicking a college/branch drills down to see associated payment plans

6. **And** the widget highlights top-performing colleges

7. **And** tax calculations (GST) are displayed separately and as combined totals

## Tasks / Subtasks

- [ ] **Task 1: Create Commission Breakdown API Route** (AC: #1-4, 7)
  - [ ] Create API route: `GET /api/dashboard/commission-by-college`
  - [ ] Accept query parameters:
    - `period` (default: "all"): "all", "year", "quarter", "month"
    - `college_id` (optional): Filter by specific college
    - `branch_id` (optional): Filter by specific branch
  - [ ] Query payment_plans joined with enrollments, branches, colleges:
    - Filter by: `agency_id` (via RLS)
    - Filter by time period based on `payment_plans.created_at` or `installments.paid_date`
    - Include both active and completed payment plans
  - [ ] Aggregate per college/branch:
    - `total_expected_commission`: SUM(payment_plans.expected_commission)
    - `total_earned_commission`: SUM(earned_commission from paid installments)
    - `outstanding_commission`: expected - earned
    - `total_commissions`: earned_commission (commission-only amount)
    - `total_gst`: Calculate GST based on applicable tax rate
    - `total_with_gst`: total_commissions + total_gst
  - [ ] Return sorted by earned_commission DESC (top-performing colleges first)
  - [ ] Apply RLS for agency_id filtering
  - [ ] Add 5-minute cache for performance

- [ ] **Task 2: Create CommissionBreakdownTable Component** (AC: #1-3, 6-7)
  - [ ] Create React component: `apps/dashboard/app/components/CommissionBreakdownTable.tsx`
  - [ ] Use TanStack Query to fetch commission data from `/api/dashboard/commission-by-college`
  - [ ] Use TanStack Table for data grid with columns:
    - College (text, sortable)
    - Branch (text, sortable)
    - Total Commissions (currency, sortable)
    - Total GST (currency, sortable)
    - Total (Commission + GST) (currency, sortable)
    - Expected (currency, sortable)
    - Earned (currency, sortable)
    - Outstanding (currency, sortable)
  - [ ] Implement column sorting:
    - Default sort: Earned commission DESC (highest earners first)
    - Click column header to toggle sort ASC/DESC
    - Visual indicator (arrow) showing current sort column/direction
  - [ ] Format amounts using agency currency (from `formatCurrency()` utility)
  - [ ] Highlight top 3 performing colleges with visual indicator (badge or background color)
  - [ ] Add visual styling for outstanding amounts (red if > 0, green if 0)
  - [ ] Display GST amounts in separate column with clear labeling
  - [ ] Show combined total (Commission + GST) as emphasized column

- [ ] **Task 3: Implement Filter Controls** (AC: #4)
  - [ ] Add filter UI above table:
    - **Time Period Dropdown**: "All Time", "This Year", "This Quarter", "This Month"
    - **College Filter**: Dropdown/autocomplete with all colleges (optional)
    - **Branch Filter**: Dropdown with branches (optional, filtered by selected college)
  - [ ] Use Zustand store to persist selected filters (dashboard-store)
  - [ ] On filter change:
    - Update query parameters
    - Refetch data via TanStack Query with new filters
    - Update table with filtered results
  - [ ] Add "Clear Filters" button to reset all filters
  - [ ] Show active filter count badge (e.g., "2 filters active")
  - [ ] Default to "All Time" view with no college/branch filters

- [ ] **Task 4: Implement Drill-Down to Payment Plans** (AC: #5)
  - [ ] Make college name clickable as link
  - [ ] Link format: `/entities/colleges/[college_id]` (navigates to college detail page)
  - [ ] Make branch name clickable as link
  - [ ] Link format: `/entities/colleges/[college_id]?branch=[branch_id]` (navigates to college detail with branch filter)
  - [ ] Add "View Payment Plans" icon/button in each row
  - [ ] On click:
    - Navigate to `/payments/plans?college=[college_id]&branch=[branch_id]`
    - Pre-filter payment plans list by selected college/branch
  - [ ] Show payment plan count in row (e.g., "12 plans")
  - [ ] Add tooltip on hover showing: "Click to view [N] payment plans for [College - Branch]"

- [ ] **Task 5: Add Summary Metrics** (AC: #1, 7)
  - [ ] Add summary cards above table showing totals across all filtered results:
    - **Total Commissions Earned**: SUM(earned_commission)
    - **Total GST**: SUM(total_gst)
    - **Total Amount (Commission + GST)**: SUM(earned + GST)
    - **Outstanding Commission**: SUM(outstanding_commission)
  - [ ] Format amounts with agency currency
  - [ ] Update summary when filters change
  - [ ] Add visual indicators:
    - Green for earned amounts
    - Blue for GST amounts
    - Red for outstanding amounts
  - [ ] Display percentage breakdown:
    - Commission: X% of total
    - GST: Y% of total

- [x] **Task 6: Add Widget Header and Controls** (AC: #1, 4)
  - [x] Add widget container with header:
    - Title: "Commission Breakdown by College"
    - Refresh button (manual refetch)
    - Export to CSV button (future enhancement placeholder)
    - Time period filter dropdown
  - [x] Add college/branch filter controls below header
  - [x] Add date range indicator based on selected period: "All Time", "Jan 1 - Dec 31, 2025", etc.
  - [x] Responsive layout (full width widget, stacks on mobile)

- [ ] **Task 7: Integrate GST Calculation Logic** (AC: #7)
  - [ ] Create utility function in `packages/utils/src/commission-calculator.ts`:
    - `calculateGST(commissionAmount: number, gstRate: number, gstInclusive: boolean)`
    - If `gst_inclusive = true`: GST = commission / (1 + gstRate) * gstRate
    - If `gst_inclusive = false`: GST = commission * gstRate
  - [ ] Query `colleges.gst_status` and `payment_plans.gst_inclusive` for calculation
  - [ ] Default GST rate: 10% (0.1) for Australian agencies (configurable in agencies table)
  - [ ] Store calculated GST in commission breakdown response
  - [ ] Display GST calculations clearly:
    - Separate column for GST amount
    - Separate column for total (commission + GST)
    - Tooltip explaining calculation method (inclusive vs exclusive)

- [ ] **Task 8: Integrate into Dashboard Page** (AC: #1)
  - [ ] Import CommissionBreakdownTable component into `apps/dashboard/app/page.tsx`
  - [ ] Position below Cash Flow Chart (from Story 6.2) in responsive grid
  - [ ] Place in full-width row (spans entire dashboard width)
  - [ ] Add section heading: "Commission Breakdown by College"
  - [ ] Ensure consistent styling with other dashboard widgets
  - [ ] Verify widget displays correctly on desktop, tablet, and mobile

- [ ] **Task 9: Testing** (AC: All)
  - [ ] Write API route unit tests:
    - Test commission aggregation by college/branch
    - Test time period filtering (all, year, quarter, month)
    - Test college/branch filtering
    - Test expected vs earned commission calculation
    - Test GST calculation (inclusive and exclusive modes)
    - Test sorting (default: earned DESC)
    - Verify RLS filtering by agency_id
  - [ ] Write component tests using React Testing Library:
    - Test table rendering with mock data
    - Test column sorting (click header → sort ASC/DESC)
    - Test filter controls (time period, college, branch)
    - Test drill-down links (college, branch, payment plans)
    - Test loading state (skeleton)
    - Test error state with retry button
    - Test empty state (no commission data)
  - [ ] Write integration test:
    - Dashboard loads → Commission breakdown table displays
    - Apply filters → Table updates with filtered results
    - Click college name → Navigate to college detail page
    - Sort by column → Table re-sorts
  - [ ] Test table responsiveness on different screen sizes

## Dev Notes

### Architecture Context

**Dashboard Zone:**
- Component lives in `apps/dashboard/app/components/CommissionBreakdownTable.tsx`
- API route at `apps/dashboard/app/api/commission-by-college/route.ts`
- Uses TanStack Table for data grid with sorting/filtering

**Database Schema Dependencies:**
- `payment_plans` table: `expected_commission`, `enrollment_id`, `gst_inclusive`, `created_at`
- `installments` table: `paid_amount`, `status`, `payment_plan_id` (for earned commission)
- `enrollments` table: links payment plans to students and branches
- `branches` table: `name`, `city`, `commission_rate_percent`, `college_id`
- `colleges` table: `name`, `gst_status`, `default_commission_rate_percent`
- `agencies` table: `gst_rate` (default: 0.1 for 10% GST)

**Commission Calculation:**
- **Expected Commission**: `payment_plans.expected_commission` (calculated at plan creation)
- **Earned Commission**: Proportional based on paid installments
  - Formula: `SUM(installments.paid_amount WHERE status='paid') / payment_plan.total_amount * payment_plan.expected_commission`
- **Outstanding Commission**: `expected_commission - earned_commission`
- **GST Calculation**:
  - If `gst_inclusive = true`: GST = commission / (1 + gst_rate) * gst_rate
  - If `gst_inclusive = false`: GST = commission * gst_rate
  - Default rate: 10% (0.1) for Australian market

### Learnings from Previous Story

**From Story 6.2 (Status: ready-for-dev)**

Story 6.2 established the cash flow projection chart with view toggles and real-time updates. This story builds on similar patterns for data visualization and filtering.

**Key Points for Implementation:**
- Dashboard zone structure and patterns established
- TanStack Query caching configured with 5-minute stale time
- Filter state management via Zustand dashboard-store
- Currency formatting utility available in `packages/utils/src/formatters.ts`
- Date filtering patterns established for time period selection
- RLS policies auto-filter by agency_id

**Patterns to Reuse:**
- API route structure: Same pattern as `/api/dashboard/cash-flow-projection`
- Component structure: Follow CashFlowChart widget pattern
- TanStack Query setup: Same caching strategy
- Loading/error states: Use same skeleton and error UI patterns
- Currency formatting: Use existing `formatCurrency()` function
- Time period filtering: Reuse filter logic from cash flow chart

**New Patterns Introduced:**
- **TanStack Table**: Headless table library for sortable columns and pagination
- **Drill-Down Links**: Clickable college/branch names navigating to detail pages
- **GST Calculation**: Separate utility for tax calculations (inclusive vs exclusive)
- **Top Performers Highlighting**: Visual badges for top 3 colleges by earned commission
- **Multi-Column Filtering**: College, branch, and time period filters working together

### Project Structure Notes

**Component Organization:**
```
apps/dashboard/
├── app/
│   ├── page.tsx                              # Import CommissionBreakdownTable
│   ├── api/
│   │   └── commission-by-college/
│   │       └── route.ts                      # Commission breakdown API
│   └── components/
│       ├── CommissionBreakdownTable.tsx      # Main table component
│       └── CommissionFilters.tsx             # Filter controls (optional)
```

**Shared Utilities:**
- Commission calculator: `packages/utils/src/commission-calculator.ts`
  - `calculateEarnedCommission(paymentPlan, installments)` - Calculate earned commission
  - `calculateGST(amount, rate, inclusive)` - Calculate GST amount
  - `calculateOutstandingCommission(expected, earned)` - Calculate outstanding
- Currency formatting: `packages/utils/src/formatters.ts`
  - `formatCurrency(amount, currency)` - Format amounts with agency currency
- Dashboard store: `packages/stores/src/dashboard-store.ts`
  - Add `commissionFilters: { period, college_id, branch_id }` state
  - Add `setCommissionFilters(filters)` action

### Commission Breakdown Query Logic

**PostgreSQL Query (with GST calculation):**

```sql
-- Commission breakdown by college/branch
SELECT
  colleges.id AS college_id,
  colleges.name AS college_name,
  colleges.gst_status,
  branches.id AS branch_id,
  branches.name AS branch_name,
  branches.city AS branch_city,

  -- Expected commission
  SUM(payment_plans.expected_commission) AS total_expected_commission,

  -- Earned commission (from paid installments)
  SUM(
    COALESCE(
      (paid_installments.total_paid / payment_plans.total_amount) * payment_plans.expected_commission,
      0
    )
  ) AS total_earned_commission,

  -- Outstanding commission
  SUM(payment_plans.expected_commission) - SUM(
    COALESCE(
      (paid_installments.total_paid / payment_plans.total_amount) * payment_plans.expected_commission,
      0
    )
  ) AS outstanding_commission,

  -- GST calculation (depends on gst_inclusive flag)
  SUM(
    CASE
      WHEN payment_plans.gst_inclusive THEN
        -- GST inclusive: GST = commission / (1 + rate) * rate
        COALESCE(
          ((paid_installments.total_paid / payment_plans.total_amount) * payment_plans.expected_commission) / (1 + agencies.gst_rate) * agencies.gst_rate,
          0
        )
      ELSE
        -- GST exclusive: GST = commission * rate
        COALESCE(
          ((paid_installments.total_paid / payment_plans.total_amount) * payment_plans.expected_commission) * agencies.gst_rate,
          0
        )
    END
  ) AS total_gst,

  -- Payment plan count
  COUNT(DISTINCT payment_plans.id) AS payment_plan_count

FROM payment_plans
JOIN enrollments ON payment_plans.enrollment_id = enrollments.id
JOIN branches ON enrollments.branch_id = branches.id
JOIN colleges ON branches.college_id = colleges.id
JOIN agencies ON payment_plans.agency_id = agencies.id

-- Left join to calculate paid amount per plan
LEFT JOIN (
  SELECT
    payment_plan_id,
    SUM(paid_amount) AS total_paid
  FROM installments
  WHERE status = 'paid'
  GROUP BY payment_plan_id
) paid_installments ON payment_plans.id = paid_installments.payment_plan_id

WHERE
  payment_plans.agency_id = auth.uid()  -- RLS auto-applied
  AND (
    -- Time period filter
    (:period = 'all') OR
    (:period = 'year' AND EXTRACT(YEAR FROM payment_plans.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)) OR
    (:period = 'quarter' AND EXTRACT(QUARTER FROM payment_plans.created_at) = EXTRACT(QUARTER FROM CURRENT_DATE) AND EXTRACT(YEAR FROM payment_plans.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)) OR
    (:period = 'month' AND EXTRACT(MONTH FROM payment_plans.created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM payment_plans.created_at) = EXTRACT(YEAR FROM CURRENT_DATE))
  )
  AND (:college_id IS NULL OR colleges.id = :college_id)
  AND (:branch_id IS NULL OR branches.id = :branch_id)

GROUP BY
  colleges.id,
  colleges.name,
  colleges.gst_status,
  branches.id,
  branches.name,
  branches.city

ORDER BY total_earned_commission DESC;
```

**Application Logic (TypeScript):**

```typescript
// Calculate commission breakdown with GST
interface CommissionBreakdown {
  college_id: string
  college_name: string
  branch_id: string
  branch_name: string
  branch_city: string
  total_commissions: number
  total_gst: number
  total_with_gst: number
  total_expected_commission: number
  total_earned_commission: number
  outstanding_commission: number
  payment_plan_count: number
}

async function fetchCommissionBreakdown(filters: CommissionFilters): Promise<CommissionBreakdown[]> {
  const { data, error } = await supabase.rpc('get_commission_breakdown', {
    period: filters.period,
    college_id: filters.college_id,
    branch_id: filters.branch_id
  })

  if (error) throw error

  // Post-process to calculate totals with GST
  return data.map(row => ({
    ...row,
    total_commissions: row.total_earned_commission,
    total_with_gst: row.total_earned_commission + row.total_gst
  }))
}
```

### Performance Optimization

**Database Indexes:**
```sql
-- Add indexes for commission breakdown queries
CREATE INDEX idx_payment_plans_agency_created ON payment_plans(agency_id, created_at);
CREATE INDEX idx_installments_status_plan ON installments(payment_plan_id, status) WHERE status = 'paid';
CREATE INDEX idx_enrollments_branch ON enrollments(branch_id);
CREATE INDEX idx_branches_college ON branches(college_id);
```

**Caching Strategy:**
- API route: 5-minute cache (Next.js `revalidate` or Vercel Edge caching)
- TanStack Query: 5-minute stale time, background refetch on window focus
- Consider materialized view for pre-computed commission aggregates (future optimization)

**Query Optimization:**
- Use subquery to pre-calculate paid amounts (avoid N+1 queries)
- Index on `payment_plans.agency_id` and `created_at` for fast filtering
- Limit result set to top 50 colleges by default (pagination for more)
- Use database aggregation (SUM, COUNT) instead of application logic

### TanStack Table Configuration

**Column Definitions:**

```typescript
const columns: ColumnDef<CommissionBreakdown>[] = [
  {
    accessorKey: 'college_name',
    header: 'College',
    cell: ({ row }) => (
      <Link href={`/entities/colleges/${row.original.college_id}`} className="text-blue-600 hover:underline">
        {row.original.college_name}
      </Link>
    ),
  },
  {
    accessorKey: 'branch_name',
    header: 'Branch',
    cell: ({ row }) => (
      <Link
        href={`/entities/colleges/${row.original.college_id}?branch=${row.original.branch_id}`}
        className="text-blue-600 hover:underline"
      >
        {row.original.branch_name} ({row.original.branch_city})
      </Link>
    ),
  },
  {
    accessorKey: 'total_commissions',
    header: 'Total Commissions',
    cell: ({ row }) => formatCurrency(row.original.total_commissions, agency.currency),
  },
  {
    accessorKey: 'total_gst',
    header: 'Total GST',
    cell: ({ row }) => formatCurrency(row.original.total_gst, agency.currency),
  },
  {
    accessorKey: 'total_with_gst',
    header: 'Total (Commission + GST)',
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatCurrency(row.original.total_with_gst, agency.currency)}
      </span>
    ),
  },
  {
    accessorKey: 'total_expected_commission',
    header: 'Expected',
    cell: ({ row }) => formatCurrency(row.original.total_expected_commission, agency.currency),
  },
  {
    accessorKey: 'total_earned_commission',
    header: 'Earned',
    cell: ({ row }) => (
      <span className="text-green-600 font-medium">
        {formatCurrency(row.original.total_earned_commission, agency.currency)}
      </span>
    ),
  },
  {
    accessorKey: 'outstanding_commission',
    header: 'Outstanding',
    cell: ({ row }) => (
      <span className={row.original.outstanding_commission > 0 ? 'text-red-600' : 'text-green-600'}>
        {formatCurrency(row.original.outstanding_commission, agency.currency)}
      </span>
    ),
  },
]
```

**Table Initialization:**

```typescript
const table = useReactTable({
  data: commissionData,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  initialState: {
    sorting: [{ id: 'total_earned_commission', desc: true }], // Default sort by earned DESC
  },
})
```

### GST Calculation Utility

**Implementation:**

```typescript
// packages/utils/src/commission-calculator.ts

/**
 * Calculate GST amount based on commission and GST configuration
 */
export function calculateGST(
  commissionAmount: number,
  gstRate: number,
  gstInclusive: boolean
): number {
  if (gstInclusive) {
    // GST inclusive: GST = commission / (1 + rate) * rate
    return (commissionAmount / (1 + gstRate)) * gstRate
  } else {
    // GST exclusive: GST = commission * rate
    return commissionAmount * gstRate
  }
}

/**
 * Calculate total amount including GST
 */
export function calculateTotalWithGST(
  commissionAmount: number,
  gstRate: number,
  gstInclusive: boolean
): number {
  if (gstInclusive) {
    // Commission already includes GST, no adjustment needed
    return commissionAmount
  } else {
    // Add GST to commission
    return commissionAmount + (commissionAmount * gstRate)
  }
}

/**
 * Calculate earned commission from paid installments
 */
export function calculateEarnedCommission(
  totalPaid: number,
  totalAmount: number,
  expectedCommission: number
): number {
  if (totalAmount === 0) return 0
  return (totalPaid / totalAmount) * expectedCommission
}
```

**Unit Tests:**

```typescript
// packages/utils/src/commission-calculator.test.ts

describe('calculateGST', () => {
  it('calculates GST for inclusive mode correctly', () => {
    const commission = 1100 // $1100 including GST
    const gstRate = 0.1 // 10%
    const gstInclusive = true

    const gst = calculateGST(commission, gstRate, gstInclusive)

    expect(gst).toBeCloseTo(100, 2) // GST = 1100 / 1.1 * 0.1 = 100
  })

  it('calculates GST for exclusive mode correctly', () => {
    const commission = 1000 // $1000 excluding GST
    const gstRate = 0.1 // 10%
    const gstInclusive = false

    const gst = calculateGST(commission, gstRate, gstInclusive)

    expect(gst).toBe(100) // GST = 1000 * 0.1 = 100
  })

  it('handles zero commission', () => {
    expect(calculateGST(0, 0.1, true)).toBe(0)
    expect(calculateGST(0, 0.1, false)).toBe(0)
  })
})

describe('calculateEarnedCommission', () => {
  it('calculates earned commission proportionally', () => {
    const totalPaid = 5000 // $5000 paid
    const totalAmount = 10000 // $10000 total
    const expectedCommission = 1500 // $1500 expected

    const earned = calculateEarnedCommission(totalPaid, totalAmount, expectedCommission)

    expect(earned).toBe(750) // 5000/10000 * 1500 = 750
  })

  it('returns 0 when total amount is 0', () => {
    expect(calculateEarnedCommission(1000, 0, 500)).toBe(0)
  })
})
```

### Testing Standards

**API Route Tests (Vitest):**
- Mock Supabase client queries
- Test commission aggregation by college/branch:
  - Verify correct grouping by college and branch
  - Verify SUM aggregations (expected, earned, outstanding)
- Test time period filtering:
  - All time: No date filter
  - This year: Filter by current year
  - This quarter: Filter by current quarter
  - This month: Filter by current month
- Test college/branch filtering:
  - Filter by college_id: Only return branches for that college
  - Filter by branch_id: Only return specific branch
  - No filters: Return all colleges/branches
- Test expected vs earned commission calculation:
  - Verify proportional calculation based on paid installments
  - Verify outstanding = expected - earned
- Test GST calculation:
  - Test inclusive mode: GST extracted from total
  - Test exclusive mode: GST added to total
  - Test mixed mode (different plans with different GST settings)
- Test sorting (default: earned DESC)
- Verify RLS filtering by agency_id

**Component Tests (React Testing Library):**
- Test table rendering with mock data:
  - Verify TanStack Table renders with correct columns
  - Verify correct number of rows
- Test column sorting:
  - Click header → sort ASC
  - Click again → sort DESC
  - Verify arrow indicators
- Test filter controls:
  - Select time period → refetch with new filter
  - Select college → refetch with college filter
  - Select branch → refetch with branch filter
  - Clear filters → reset to all data
- Test drill-down links:
  - Click college name → navigate to college detail
  - Click branch name → navigate to college detail with branch filter
  - Click "View Payment Plans" → navigate to payment plans with filters
- Test loading state:
  - Query loading → skeleton UI displays
  - Data loads → table renders
- Test error state:
  - Query error → error message displays
  - Click retry → refetch triggered
- Test empty state:
  - No commission data → empty state message
  - "Create Payment Plan" CTA visible
- Test top performer highlighting:
  - Top 3 colleges have visual badge
  - Others do not have badge

**Integration Tests (Playwright):**
- E2E flow: Login → Dashboard → Commission breakdown table visible
- E2E flow: Apply filters → Table updates with filtered results
- E2E flow: Click college name → Navigate to college detail page
- E2E flow: Sort by column → Table re-sorts correctly
- Test responsiveness: Desktop, tablet, mobile views

### Security Considerations

**Row-Level Security:**
- All queries MUST respect RLS policies (agency_id filtering automatic)
- Use server-side Supabase client (not anon key) in API routes
- JWT auth middleware protects dashboard routes

**Data Privacy:**
- Commission breakdown only shows current user's agency data
- No cross-agency data leakage possible (enforced by RLS)
- College/branch names only visible to users in same agency

### Accessibility Considerations

**WCAG 2.1 Level AA Compliance:**
- Table structure: Proper `<thead>`, `<tbody>`, `<th>`, `<td>` semantic HTML
- Sortable headers: `aria-sort` attribute indicates current sort state
- Screen reader support:
  - Add `aria-label` to table: "Commission breakdown by college and branch"
  - Add `role="table"` to container
  - Add `aria-describedby` linking to summary metrics
- Keyboard navigation:
  - Tab through sortable headers
  - Enter/Space to toggle sort
  - Tab through drill-down links
- Color contrast: Ensure green/red text meets AA contrast ratio (4.5:1 minimum)
- Status communicated through text + color (not color alone):
  - Outstanding: "$500 (outstanding)" not just red color

### User Experience Enhancements

**Empty State:**
- If no commission data available:
  - Display message: "No commission data available for selected period"
  - Show illustration (empty table icon)
  - Add CTA: "Create Payment Plan" button
  - Add filter hint: "Try adjusting filters to see more data"

**Loading State:**
- Skeleton loader with table shape (rows and columns placeholders)
- Smooth transition from skeleton to actual table

**Error State:**
- Clear error message: "Unable to load commission breakdown"
- Retry button
- Support contact link

**Visual Indicators:**
- Top 3 performers: Gold/Silver/Bronze badges or star icons
- Outstanding amounts: Red text for > 0, green checkmark for = 0
- GST amounts: Blue text or icon to distinguish from commission
- Drill-down hints: Underline on hover, tooltip showing "Click to view details"

**Export Functionality (Future Enhancement):**
- Export to CSV button in widget header
- Exports current filtered/sorted view
- Includes all columns with proper formatting

### References

- [Source: docs/epics.md#Story 6.3] - Acceptance criteria and technical notes
- [Source: docs/architecture.md#Commission Calculation Pattern] - Commission calculation logic
- [Source: docs/architecture.md#Multi-Tenant Isolation] - RLS policy patterns
- [Source: docs/architecture.md#Performance Considerations] - Caching and query optimization
- [Source: docs/PRD.md#Critical User Flows] - Flow 5: Analyze Commission Performance
- [Source: .bmad-ephemeral/stories/6-2-cash-flow-projection-chart.md] - Previous story patterns

## Dev Agent Record

### Context Reference

- .bmad-ephemeral/stories/6-3-commission-breakdown-by-college.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
