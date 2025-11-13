# Story 4.5: Commission Calculation Engine - Task 8

## Story Context
**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Previous Task**: Task 7 - Commission by College/Branch Report Page (Completed)

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

---

## Task 8: Dashboard Commission Summary Widget

### Acceptance Criteria
AC 5: Dashboard Commission Summary
- Dashboard displays "Total Outstanding Commission" widget showing:
  - Total expected commission across all active payment plans
  - Total earned commission (sum of all earned commission)
  - Total outstanding commission (expected - earned)
  - Trend indicator: change vs. last month
- Widget updates in real-time as payments recorded (query invalidation)

### Task Description
Create a dashboard widget that provides a high-level overview of commission status across all payment plans. This widget is prominently displayed on the agency dashboard and updates in real-time when payments are recorded.

### Subtasks Checklist
- [ ] Create CommissionSummaryWidget component for dashboard
- [ ] Implement GET /api/dashboard/commission-summary API route
- [ ] Query aggregates: SUM(expected_commission), SUM(earned_commission), SUM(outstanding)
- [ ] Calculate trend: Compare to last month's total_earned
- [ ] Widget displays:
  - Total Expected Commission (large number, currency formatted)
  - Total Earned Commission (green, currency formatted)
  - Total Outstanding Commission (red if > 0, currency formatted)
  - Trend indicator: ↑ X% vs last month (or ↓ if decreased)
- [ ] Widget refreshes on payment recording via query invalidation
- [ ] Click widget to navigate to /reports/commissions/by-college

---

## Context & Constraints

### Key Constraints
- Multi-zone architecture: Dashboard zone (apps/dashboard/)
- Use TanStack Query with 5-minute cache for performance
- Real-time updates via query invalidation from Task 4
- Trend calculation: Compare current month to previous month
- Click-through: Navigate to commission report for drill-down

### Dependencies
```json
{
  "@tanstack/react-query": "5.90.7",
  "recharts": "3.3.0",
  "date-fns": "4.1.0"
}
```

---

## Manifest Update Instructions

Before starting:
1. Open: `.bmad-ephemeral/stories/prompts/4-5-commission-calculation-engine/MANIFEST.md`
2. Update Task 7:
   - Status: "Completed"
   - Completed: [Date]
   - Notes: [Implementation notes from Task 7]
3. Update Task 8:
   - Status: "In Progress"
   - Started: [Current Date]

---

## Implementation Steps

### Step 1: Create Dashboard API Endpoint
Create: `apps/dashboard/app/api/commission-summary/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || '',
        },
      },
    }
  );

  // Verify user session
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Current month totals
  const { data: currentMonthPlans, error } = await supabase
    .from('payment_plans')
    .select('expected_commission, earned_commission')
    .eq('agency_id', session.user.agency_id)
    .eq('status', 'active');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total_expected = currentMonthPlans.reduce((sum, p) => sum + (p.expected_commission || 0), 0);
  const total_earned = currentMonthPlans.reduce((sum, p) => sum + (p.earned_commission || 0), 0);
  const total_outstanding = total_expected - total_earned;

  // Last month totals for trend calculation
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

  const { data: lastMonthPlans } = await supabase
    .from('payment_plans')
    .select('earned_commission')
    .eq('agency_id', session.user.agency_id)
    .eq('status', 'active')
    .gte('created_at', lastMonthStart.toISOString())
    .lte('created_at', lastMonthEnd.toISOString());

  const last_month_earned = lastMonthPlans?.reduce((sum, p) => sum + (p.earned_commission || 0), 0) || 0;

  // Calculate trend percentage
  const trend_percentage = last_month_earned > 0
    ? ((total_earned - last_month_earned) / last_month_earned) * 100
    : 0;

  return NextResponse.json({
    total_expected,
    total_earned,
    total_outstanding,
    trend_percentage,
    last_month_earned,
  });
}
```

### Step 2: Create Dashboard Widget Component
Create: `apps/dashboard/app/components/CommissionSummaryWidget.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/packages/utils/src/formatters';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CommissionSummaryWidget() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'commission-summary'],
    queryFn: fetchCommissionSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  if (isLoading) {
    return <CommissionSummaryWidgetSkeleton />;
  }

  if (!data) return null;

  const trendIcon = data.trend_percentage >= 0 ? (
    <TrendingUp className="h-4 w-4 text-green-600" />
  ) : (
    <TrendingDown className="h-4 w-4 text-red-600" />
  );

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => router.push('/reports/commissions/by-college')}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Commission Overview</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Outstanding - Main Metric */}
          <div>
            <p className="text-xs text-muted-foreground">Total Outstanding</p>
            <p className={`text-3xl font-bold ${data.total_outstanding > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {formatCurrency(data.total_outstanding)}
            </p>
          </div>

          {/* Expected and Earned */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Expected</p>
              <p className="text-lg font-semibold">
                {formatCurrency(data.total_expected)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Earned</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(data.total_earned)}
              </p>
            </div>
          </div>

          {/* Trend Indicator */}
          <div className="flex items-center gap-2 text-sm">
            {trendIcon}
            <span className={data.trend_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(data.trend_percentage).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function fetchCommissionSummary() {
  const response = await fetch('/api/dashboard/commission-summary');
  if (!response.ok) throw new Error('Failed to fetch commission summary');
  return response.json();
}

function CommissionSummaryWidgetSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 3: Integrate into Dashboard
Modify: `apps/dashboard/app/components/widgets.tsx`

```typescript
import { CommissionSummaryWidget } from './CommissionSummaryWidget';

export function DashboardWidgets() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Existing widgets */}
      <PaymentStatusWidget />
      <EnrollmentStatsWidget />

      {/* NEW: Commission widget */}
      <CommissionSummaryWidget />

      {/* Other widgets */}
      <RecentActivityWidget />
    </div>
  );
}
```

### Step 4: Ensure Real-Time Updates
The widget will automatically update when payments are recorded because:
- Task 4 invalidates `['dashboard', 'commission-summary']` query key
- TanStack Query refetches the data
- Widget re-renders with updated commission values

No additional code needed - query invalidation from Task 4 handles this.

---

## UI/UX Considerations

### Visual Hierarchy
- **Primary Metric**: Total Outstanding (largest, most prominent)
- **Secondary Metrics**: Expected and Earned (smaller, side-by-side)
- **Trend**: Small indicator at bottom (green up arrow or red down arrow)

### Color Coding
- Outstanding: Red if > 0, Gray if 0
- Earned: Green (positive indicator)
- Expected: Default text color
- Trend: Green for positive, Red for negative

### Interactivity
- Entire widget is clickable
- Hover effect: Shadow increase
- Click navigates to full commission report

### Performance
- 5-minute stale time: Balance freshness with API calls
- Query invalidation: Force refetch on payment recording
- Skeleton loader: Show loading state

---

## Testing Requirements

### Component Tests
Create: `apps/dashboard/app/components/__tests__/CommissionSummaryWidget.test.tsx`

Test cases:
1. Displays commission data correctly
2. Shows trend indicator (up arrow for positive, down arrow for negative)
3. Colors outstanding commission red when > 0
4. Colors earned commission green
5. Click widget navigates to commission report
6. Shows skeleton loader while loading
7. Handles zero commission scenario
8. Calculates trend percentage correctly

### Integration Tests
Create: `apps/dashboard/__tests__/api/commission-summary.test.ts`

Test cases:
1. API returns correct aggregated totals
2. Trend calculation compares to last month correctly
3. RLS enforcement: Only returns agency's data
4. Handles no payment plans scenario
5. Handles no last month data scenario

### E2E Test
Test real-time update:
1. Load dashboard
2. Verify commission widget displays
3. Navigate to payment plan and record payment
4. Navigate back to dashboard
5. Verify commission widget updated with new values

---

## Context References

### Story Context File
Full context: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Related Files
- Widget: `apps/dashboard/app/components/CommissionSummaryWidget.tsx` (NEW)
- API: `apps/dashboard/app/api/commission-summary/route.ts` (NEW)
- Dashboard: `apps/dashboard/app/components/widgets.tsx` (MODIFY)

### Dependencies from Previous Tasks
- Task 3: Commission calculation logic
- Task 4: Query invalidation on payment recording
- Task 7: Commission report page (drill-down target)

---

## Next Steps

After completing Task 8:
1. Update MANIFEST.md:
   - Task 8 status: "Completed"
   - Task 8 completed date
   - Add notes: Dashboard widget created, real-time updates working
2. Test widget with various scenarios
3. Move to Task 9: Non-Commissionable Fees Handling
4. Reference file: `task-9-prompt.md`

---

## Success Criteria

Task 8 is complete when:
- [x] CommissionSummaryWidget component created
- [x] GET /api/dashboard/commission-summary endpoint created
- [x] Widget displays expected, earned, outstanding commission
- [x] Trend indicator shows change vs. last month
- [x] Widget integrated into dashboard
- [x] Real-time updates work via query invalidation
- [x] Click widget navigates to commission report
- [x] Component tests pass
- [x] Integration tests pass
- [x] E2E test passes
- [x] MANIFEST.md updated with Task 8 completion
