# Story 6.5: Overdue Payments Summary Widget

Status: done

## Story

As an **Agency User**,
I want **a dedicated widget highlighting all overdue payments**,
so that **I can immediately focus on the most urgent follow-ups**.

## Acceptance Criteria

1. **Given** I am viewing the dashboard
   **When** overdue payments exist
   **Then** I see a prominent widget listing all overdue installments

2. **And** the widget shows: student name, college, amount, days overdue

3. **And** the list is sorted by days overdue (most urgent first)

4. **And** each item is clickable and navigates to the payment plan detail

5. **And** the widget shows total count and total amount overdue

6. **And** if no overdue payments exist, the widget shows a success message

## Tasks / Subtasks

- [ ] **Task 1: Create Overdue Payments API Route** (AC: #1-5)
  - [ ] Create API route: `GET /api/dashboard/overdue-payments`
  - [ ] Query installments table:
    - Filter: `status = 'overdue'`
    - Join with: students, payment_plans, enrollments, colleges
    - Calculate: `days_overdue = CURRENT_DATE - due_date`
    - Order by: `due_date ASC` (oldest/most urgent first)
  - [ ] Return formatted response:
    ```typescript
    interface OverduePayment {
      id: string
      student_name: string
      college_name: string
      amount: number
      days_overdue: number
      due_date: string
      payment_plan_id: string
      installment_number: number
    }

    interface OverduePaymentsResponse {
      overdue_payments: OverduePayment[]
      total_count: number
      total_amount: number
    }
    ```
  - [ ] Apply RLS filtering (agency_id auto-applied)
  - [ ] Add caching: 5-minute cache (frequent dashboard access, but needs freshness)
  - [ ] Test: Verify only current agency's overdue payments returned
  - [ ] Test: Verify correct sorting by days overdue
  - [ ] Test: Verify totals calculation (count and amount)

- [ ] **Task 2: Create OverduePaymentsWidget Component** (AC: #1-6)
  - [ ] Create React component: `apps/dashboard/app/components/OverduePaymentsWidget.tsx`
  - [ ] Use TanStack Query to fetch from `/api/dashboard/overdue-payments`
  - [ ] Display prominent header:
    - Title: "Overdue Payments"
    - Badge with total count (red/urgent styling)
    - Total amount prominently displayed
  - [ ] Display overdue payments table/list:
    - Columns: Student Name, College, Amount, Days Overdue
    - Sort by days overdue (most urgent first)
    - Use urgent visual styling (red accents, warning icons)
    - Clickable rows navigate to `/payments/plans/[plan_id]`
  - [ ] Show days overdue with color coding:
    - 1-7 days: yellow/warning
    - 8-30 days: orange/alert
    - 30+ days: red/critical
  - [ ] Format amounts as currency (use `formatCurrency` from utils)
  - [ ] Responsive layout (table on desktop, cards on mobile)

- [ ] **Task 3: Implement Empty State** (AC: #6)
  - [ ] Create empty state component when no overdue payments:
    - Success icon (✅ or 🎉)
    - Message: "No overdue payments! Great work!"
    - Positive visual styling (green accent)
  - [ ] Show empty state conditionally when `total_count === 0`
  - [ ] Add subtle animation for celebration effect
  - [ ] Consider showing "last checked" timestamp for reassurance

- [ ] **Task 4: Add Loading and Error States**
  - [ ] Implement skeleton loader:
    - Show placeholder rows while loading
    - Match layout of actual widget
    - Smooth transition to real data
  - [ ] Implement error state:
    - Clear error message: "Unable to load overdue payments"
    - Retry button
    - Log error for debugging
  - [ ] Test loading state renders correctly
  - [ ] Test error state with retry functionality

- [ ] **Task 5: Integrate Widget into Dashboard** (AC: #1)
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

- [ ] **Task 6: Add Auto-Refresh for Real-Time Updates** (AC: #1)
  - [ ] Configure TanStack Query with auto-refetch:
    - `refetchInterval: 300000` (5 minutes - shorter for urgency)
    - `refetchOnWindowFocus: true`
  - [ ] Add subtle visual indicator when new overdue payments detected:
    - Flash animation on widget border
    - "New overdue payment" badge
  - [ ] Consider sound/notification for new overdue (future enhancement)

- [ ] **Task 7: Testing** (AC: All)
  - [ ] Write API route unit tests:
    - Test query returns only overdue installments (status = 'overdue')
    - Test ordering by due_date ASC (oldest first)
    - Test RLS filtering by agency_id
    - Test days_overdue calculation
    - Test totals calculation (count and amount)
    - Test joins with students, colleges, payment_plans
  - [ ] Write component tests using React Testing Library:
    - Test OverduePaymentsWidget renders with mock data
    - Test list displays: student name, college, amount, days overdue
    - Test sorting (oldest overdue first)
    - Test clickable rows navigate to payment plan detail
    - Test total count and total amount display
    - Test empty state when no overdue payments
    - Test loading state (skeleton)
    - Test error state with retry
  - [ ] Write integration test:
    - Dashboard loads → Overdue widget displays
    - Mark installment as overdue → Widget updates to show it
    - Click overdue item → Navigate to payment plan detail page
    - Record payment for overdue installment → Widget updates (count decreases)
  - [ ] Test color coding:
    - 1-7 days: yellow/warning style
    - 8-30 days: orange/alert style
    - 30+ days: red/critical style
  - [ ] Test auto-refresh:
    - Wait 5 minutes → Widget refetches automatically
    - Switch tabs → Widget refetches on return

## Dev Notes

### Architecture Context

**Dashboard Zone:**
- Component lives in `apps/dashboard/app/components/OverduePaymentsWidget.tsx`
- API route at `apps/dashboard/app/api/dashboard/overdue-payments/route.ts`
- Uses TanStack Query for data fetching with 5-minute cache

**Database Query:**
- Queries `installments` table filtered by `status = 'overdue'`
- Joins with `students`, `payment_plans`, `enrollments`, `colleges` for display
- RLS policy enforces agency-level isolation
- Calculates `days_overdue = CURRENT_DATE - due_date`
- Orders by `due_date ASC` (oldest/most urgent first)

**Urgency Patterns:**
- Widget uses urgent visual styling (red accents) when overdue items exist
- Days overdue color-coded: yellow (1-7), orange (8-30), red (30+)
- Positioned prominently on dashboard (top or always-visible sidebar)
- Shorter auto-refresh interval (5 minutes) vs other widgets (60 minutes)

### Learnings from Previous Story

**From Story 6.4: Recent Activity Feed (Status: ready-for-dev)**

Story 6.4 established the activity logging infrastructure and dashboard widget patterns with auto-refresh.

**Key Points for Implementation:**
- Dashboard zone structure and TanStack Query patterns established
- Activity feed uses 60-second auto-refresh - this widget should use 5 minutes (less frequent, more urgent)
- RLS policies auto-filter by agency_id
- Component styling follows Shadcn UI patterns
- Currency formatting utility available in `packages/utils/src/formatters.ts`

**Patterns to Reuse:**
- API route structure: Similar to `/api/activity-log` but simpler (single table query)
- Component structure: Follow ActivityFeed widget pattern (loading/error/empty states)
- TanStack Query setup: Similar caching strategy but different interval (5min vs 60sec)
- Responsive layout: Follow dashboard grid patterns
- Loading/error states: Use same skeleton and error UI patterns
- Clickable items: Similar navigation pattern (Link component, hover states)

**New Patterns Introduced in This Story:**
- **Urgency-Based Styling**: Red/orange/yellow color coding by severity
- **Prominent Positioning**: Widget placement optimized for immediate visibility
- **Success Celebration**: Positive empty state ("No overdue payments! 🎉")
- **Days Overdue Calculation**: Dynamic date calculation in SQL
- **Severity Thresholds**: Color coding based on age (1-7, 8-30, 30+ days)

**Differences from Story 6.4:**
- This widget is more urgent → shorter cache (5min vs 60sec)
- This widget should be more prominent → top placement vs sidebar
- Empty state is celebratory (success) vs neutral (no activity)
- Sorting by urgency (days overdue) vs chronological (created_at)

### Project Structure Notes

**Component Organization:**
```
apps/dashboard/
├── app/
│   ├── page.tsx                              # Import OverduePaymentsWidget (prominent position)
│   ├── api/
│   │   └── dashboard/
│   │       └── overdue-payments/
│   │           └── route.ts                  # Overdue payments API
│   └── components/
│       ├── OverduePaymentsWidget.tsx         # Main widget component
│       └── OverduePaymentItem.tsx            # Single overdue item row (optional)
```

**Shared Utilities:**
- Currency formatting: `packages/utils/src/formatters.ts`
  - Use existing `formatCurrency(amount)` for amount display
- Date calculations: Handle in SQL query for performance
- Color coding logic: Component-level helper function

### Database Query Logic

**Overdue Payments Query:**

```sql
-- Fetch all overdue installments with student/college details
SELECT
  installments.id,
  installments.amount,
  installments.due_date,
  installments.installment_number,
  (CURRENT_DATE - installments.due_date) AS days_overdue,
  students.id AS student_id,
  students.name AS student_name,
  colleges.id AS college_id,
  colleges.name AS college_name,
  payment_plans.id AS payment_plan_id
FROM installments
INNER JOIN payment_plans ON installments.payment_plan_id = payment_plans.id
INNER JOIN enrollments ON payment_plans.enrollment_id = enrollments.id
INNER JOIN students ON enrollments.student_id = students.id
INNER JOIN colleges ON enrollments.college_id = colleges.id
WHERE installments.status = 'overdue'
  AND payment_plans.agency_id = auth.uid()  -- RLS auto-applied
ORDER BY installments.due_date ASC;  -- Oldest overdue first

-- Calculate totals
SELECT
  COUNT(*) AS total_count,
  SUM(installments.amount) AS total_amount
FROM installments
INNER JOIN payment_plans ON installments.payment_plan_id = payment_plans.id
WHERE installments.status = 'overdue'
  AND payment_plans.agency_id = auth.uid();
```

**TypeScript Type Definitions:**

```typescript
// apps/dashboard/app/api/dashboard/overdue-payments/types.ts

export interface OverduePayment {
  id: string
  student_id: string
  student_name: string
  college_id: string
  college_name: string
  amount: number
  days_overdue: number
  due_date: string
  payment_plan_id: string
  installment_number: number
}

export interface OverduePaymentsResponse {
  overdue_payments: OverduePayment[]
  total_count: number
  total_amount: number
}
```

### OverduePaymentsWidget Component Structure

**Component Architecture:**

```typescript
// apps/dashboard/app/components/OverduePaymentsWidget.tsx

export function OverduePaymentsWidget() {
  const { data, isLoading, error, refetch } = useOverduePayments()

  if (isLoading) return <OverduePaymentsSkeleton />
  if (error) return <OverduePaymentsError onRetry={() => refetch()} />
  if (!data || data.total_count === 0) return <OverduePaymentsEmpty />

  return (
    <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-red-900">
          Overdue Payments
          <span className="ml-2 px-2 py-1 bg-red-600 text-white text-sm rounded-full">
            {data.total_count}
          </span>
        </h2>
        <div className="text-right">
          <p className="text-sm text-red-700">Total Overdue</p>
          <p className="text-2xl font-bold text-red-900">
            {formatCurrency(data.total_amount)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {data.overdue_payments.map((payment) => (
          <OverduePaymentItem key={payment.id} payment={payment} />
        ))}
      </div>
    </div>
  )
}
```

**OverduePaymentItem Component:**

```typescript
function OverduePaymentItem({ payment }: { payment: OverduePayment }) {
  const urgencyColor = getUrgencyColor(payment.days_overdue)

  return (
    <Link
      href={`/payments/plans/${payment.payment_plan_id}`}
      className="block p-3 rounded-lg border hover:bg-white transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">{payment.student_name}</p>
          <p className="text-sm text-muted-foreground">{payment.college_name}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">{formatCurrency(payment.amount)}</p>
          <p className={`text-sm font-medium ${urgencyColor}`}>
            {payment.days_overdue} days overdue
          </p>
        </div>
      </div>
    </Link>
  )
}
```

**Urgency Color Helper:**

```typescript
function getUrgencyColor(days: number): string {
  if (days >= 30) return 'text-red-600'      // Critical
  if (days >= 8) return 'text-orange-600'    // Alert
  return 'text-yellow-600'                   // Warning
}

function getUrgencyBgColor(days: number): string {
  if (days >= 30) return 'bg-red-100 border-red-300'
  if (days >= 8) return 'bg-orange-100 border-orange-300'
  return 'bg-yellow-100 border-yellow-300'
}
```

**Empty State Component:**

```typescript
function OverduePaymentsEmpty() {
  return (
    <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50 text-center">
      <div className="text-6xl mb-3">🎉</div>
      <h3 className="text-lg font-semibold text-green-900 mb-2">
        No overdue payments!
      </h3>
      <p className="text-sm text-green-700">
        Great work keeping all payments on track!
      </p>
    </div>
  )
}
```

### TanStack Query Configuration

**Query Setup:**

```typescript
// apps/dashboard/app/hooks/useOverduePayments.ts

export function useOverduePayments() {
  return useQuery({
    queryKey: ['overdue-payments'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/overdue-payments')
      if (!res.ok) throw new Error('Failed to fetch overdue payments')
      return res.json() as Promise<OverduePaymentsResponse>
    },
    staleTime: 300000, // 5 minutes (shorter for urgency)
    refetchInterval: 300000, // Auto-refresh every 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  })
}
```

### Performance Optimization

**Caching Strategy:**
- API route: 5-minute cache (Next.js `revalidate` or Vercel Edge caching)
- TanStack Query: 5-minute stale time, auto-refresh every 5 minutes
- Shorter interval than other widgets (60min) due to urgency of overdue payments

**Database Indexes:**
- Existing index on `installments(status, due_date)` should optimize this query
- Consider composite index: `(status, agency_id, due_date)` if performance issues

**Query Optimization:**
- Filter early: `status = 'overdue'` reduces rows before joins
- Use INNER JOINs (all relationships required)
- Limit rows if needed (e.g., top 50 most overdue) for very large datasets
- Calculate totals in separate query or use window functions

### Dashboard Placement Strategy

**Option A: Top of Dashboard (Recommended)**
- Most visible position
- Users see overdue payments immediately on login
- Conditional rendering: only show when overdue items exist
- Position: Above KPIs, full width

**Option B: Dedicated Sidebar Section**
- Always visible (sticky positioning)
- Doesn't disrupt KPI/chart layout
- Good for mobile (collapsible sidebar)
- Position: Right sidebar (desktop), top (mobile)

**Option C: Below KPIs**
- Balances visibility with other metrics
- Prominent but not overwhelming
- Position: Between KPIs and charts

**Implementation Note:**
- Choose Option A or B based on user feedback
- Consider A/B testing positioning for optimal user engagement
- Ensure widget is visible without scrolling (above the fold)

### Testing Standards

**API Route Tests (Vitest):**
- Mock Supabase client queries
- Test overdue payments query:
  - Verify query returns only installments with status = 'overdue'
  - Verify ordering by due_date ASC (oldest first)
  - Verify RLS filtering by agency_id
  - Verify days_overdue calculation
  - Verify totals calculation (count and amount)
  - Verify joins with students, colleges, payment_plans
- Test caching headers (5-minute cache)
- Test empty result (no overdue payments)

**Component Tests (React Testing Library):**
- Test OverduePaymentsWidget renders with mock data
- Test displays: student name, college, amount, days overdue
- Test sorting by days overdue (oldest first)
- Test clickable items navigate to payment plan detail
- Test total count badge and total amount display
- Test urgency color coding:
  - 1-7 days: yellow
  - 8-30 days: orange
  - 30+ days: red
- Test empty state (success message, celebration icon)
- Test loading state (skeleton UI)
- Test error state with retry button

**Integration Tests (Playwright):**
- E2E flow: Login → Dashboard → Overdue widget visible
- E2E flow: Mark installment as overdue → Widget displays it
- E2E flow: Click overdue item → Navigate to payment plan detail
- E2E flow: Record payment → Overdue count decreases
- Test auto-refresh: Wait 5 minutes → Widget refetches
- Test empty state: No overdue payments → Celebration message

### Security Considerations

**Row-Level Security:**
- All installments queries MUST respect RLS policies (agency_id filtering automatic)
- Use server-side Supabase client (not anon key) in API routes
- JWT auth middleware protects dashboard routes

**Data Privacy:**
- Overdue payments only show current user's agency data
- No cross-agency data leakage possible (enforced by RLS)
- Student names only visible to users in same agency

### User Experience Enhancements

**Visual Urgency Indicators:**
- Red border and red-tinted background when overdue items exist
- Green border and green-tinted background when empty (celebration)
- Badge with count (red, prominent)
- Total amount displayed prominently (large, bold)

**Color-Coded Days Overdue:**
- 1-7 days: Yellow (⚠️ warning)
- 8-30 days: Orange (🔶 alert)
- 30+ days: Red (🔴 critical)

**Empty State Celebration:**
- Success icon (🎉)
- Positive message: "No overdue payments! Great work!"
- Green styling (success color)
- Reinforces desired behavior (on-time payments)

**Loading State:**
- Skeleton loader with card shapes
- Smooth transition from skeleton to actual widget
- Matches layout of actual widget

**Error State:**
- Clear error message: "Unable to load overdue payments"
- Retry button
- Support contact link

**Future Enhancements (Document for Later Stories):**
- **Bulk Actions**: "Send reminder email to all" button
- **Quick Actions**: "Record payment" button per row (inline)
- **Notifications**: Browser/email notifications for new overdue payments
- **Sound Alerts**: Audio cue when new overdue payment detected (optional, user preference)
- **Export to CSV**: Export overdue list for follow-up campaigns
- **Filter/Search**: Filter by college, student name, amount range

### References

- [Source: docs/epics.md#Story 6.5] - Story acceptance criteria and technical notes
- [Source: docs/architecture.md#Dashboard Zone] - Dashboard component architecture
- [Source: docs/architecture.md#Multi-Tenant Isolation] - RLS policy patterns
- [Source: docs/architecture.md#State Management] - TanStack Query configuration
- [Source: .bmad-ephemeral/stories/6-4-recent-activity-feed.md] - Previous story patterns (dashboard widgets, TanStack Query, auto-refresh, clickable items)

## Dev Agent Record

### Context Reference

- .bmad-ephemeral/stories/6-5-overdue-payments-summary-widget.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
