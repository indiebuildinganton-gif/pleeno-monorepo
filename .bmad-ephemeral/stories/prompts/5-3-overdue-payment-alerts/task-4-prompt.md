# Task 4: Add Overdue Payments Section to Dashboard

## Context
You are implementing Story 5.3: Overdue Payment Alerts - Task 4 of 5.

This task creates a prominent dashboard widget that displays overdue payment summary with count and total value. This provides immediate visibility into overdue payments when agency users access the dashboard.

## Story Overview
**As an** Agency User
**I want** to receive in-app notifications for overdue payments
**So that** I'm immediately aware when follow-up action is needed

## Prerequisites
- Task 1 completed: Notifications table and API exist
- Task 2 completed: Notifications are being generated
- Task 3 completed: Notification UI components built
- Dashboard infrastructure exists (from Story 5.2 or earlier)

## Acceptance Criteria for This Task
- AC 5: The dashboard prominently displays the total count and value of overdue payments

## Your Task
Create a prominent overdue payments summary widget for the dashboard:

### Subtasks:
1. Create OverduePaymentsSummary widget for dashboard
2. Query installments WHERE status = 'overdue' to calculate count and total value
3. Display prominent card with red styling showing: "X Overdue Payments ($Y total)"
4. Add click handler to navigate to /payments/plans?status=overdue
5. Update dashboard layout to prioritize overdue section (top of page)
6. Test dashboard with various overdue payment scenarios

## Technical Specifications

### Component: OverduePaymentsSummary
Location: `apps/dashboard/app/components/OverduePaymentsSummary.tsx`

**Purpose:** Prominent dashboard widget showing overdue payment count and total value

**Features:**
- Large, bold card with red styling for urgency
- Display count of overdue installments
- Display total value of overdue payments
- Clickable to navigate to filtered payment plans
- Icon (AlertTriangle from lucide-react)
- Auto-refresh data using TanStack Query

**Implementation Pattern:**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface OverdueSummary {
  count: number;
  totalValue: number;
}

export function OverduePaymentsSummary() {
  const router = useRouter();

  const { data, isLoading, error } = useQuery<OverdueSummary>({
    queryKey: ['overdue-payments-summary'],
    queryFn: async () => {
      const supabase = createClient();

      // Query overdue installments
      const { data: installments, error } = await supabase
        .from('installments')
        .select('amount')
        .eq('status', 'overdue');

      if (error) throw error;

      const count = installments?.length || 0;
      const totalValue = installments?.reduce((sum, i) => sum + i.amount, 0) || 0;

      return { count, totalValue };
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const handleClick = () => {
    router.push('/payments/plans?status=overdue');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600 text-sm">Failed to load overdue payments summary</p>
      </div>
    );
  }

  const { count, totalValue } = data || { count: 0, totalValue: 0 };

  if (count === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-800">All Payments Current</h3>
            <p className="text-sm text-green-600">No overdue payments at this time</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="bg-red-50 border-2 border-red-300 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="p-4 bg-red-100 rounded-full">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-red-900">
            {count} Overdue Payment{count !== 1 ? 's' : ''}
          </h3>
          <p className="text-xl font-semibold text-red-700 mt-1">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total
          </p>
          <p className="text-sm text-red-600 mt-2">
            Click to view overdue payment plans →
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Dashboard Layout Integration
Location: `apps/dashboard/app/page.tsx` (or main dashboard page)

**Update dashboard layout to prioritize overdue section:**

```typescript
import { OverduePaymentsSummary } from '@/components/OverduePaymentsSummary';
// Other dashboard widgets...

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Overdue Payments Section - TOP PRIORITY */}
      <div className="mb-8">
        <OverduePaymentsSummary />
      </div>

      {/* Other Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Other widgets: revenue, upcoming payments, etc. */}
      </div>
    </div>
  );
}
```

### Alternative: API Route for Summary (Optional)
If you prefer separating business logic from component:

Location: `apps/dashboard/app/api/overdue-summary/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();

  const { data: installments, error } = await supabase
    .from('installments')
    .select('amount')
    .eq('status', 'overdue');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const count = installments?.length || 0;
  const totalValue = installments?.reduce((sum, i) => sum + i.amount, 0) || 0;

  return NextResponse.json({ count, totalValue });
}
```

Then fetch from component:
```typescript
const { data } = useQuery({
  queryKey: ['overdue-payments-summary'],
  queryFn: async () => {
    const res = await fetch('/api/overdue-summary');
    return res.json();
  },
});
```

## Styling Specifications

### Overdue Widget Styling (RED - Urgent)
- Background: `bg-red-50`
- Border: `border-2 border-red-300`
- Icon background: `bg-red-100`
- Icon color: `text-red-600`
- Heading: `text-red-900` (large, bold)
- Subtitle: `text-red-700` (medium, semi-bold)
- Call-to-action: `text-red-600` (small)
- Hover effect: Shadow increase (`hover:shadow-lg`)

### No Overdue Payments Styling (GREEN - Good)
- Background: `bg-green-50`
- Border: `border border-green-200`
- Icon background: `bg-green-100`
- Icon color: `text-green-600`
- Heading: `text-green-800`
- Text: `text-green-600`

### Responsive Design
- Mobile (< 768px): Full-width card, stacked icon and content
- Tablet/Desktop (>= 768px): Horizontal layout with icon left, content right
- Icon size: 32px (h-8 w-8) on all screens

## Testing Requirements

### Component Tests
Location: `apps/dashboard/app/components/__tests__/`

**Test Cases:**
1. OverduePaymentsSummary - With overdue payments
   - Given: 3 overdue installments totaling $1,500
   - When: Component renders
   - Then: Display "3 Overdue Payments" and "$1,500.00 Total"
   - And: Red styling applied

2. OverduePaymentsSummary - No overdue payments
   - Given: 0 overdue installments
   - When: Component renders
   - Then: Display "All Payments Current" message
   - And: Green styling applied

3. OverduePaymentsSummary - Click navigation
   - Given: Widget rendered with overdue payments
   - When: User clicks widget
   - Then: Navigate to /payments/plans?status=overdue

4. OverduePaymentsSummary - Loading state
   - Given: Query is loading
   - When: Component renders
   - Then: Show loading skeleton (gray pulse animation)

5. OverduePaymentsSummary - Error state
   - Given: Query fails
   - When: Component renders
   - Then: Show error message in red

### Integration Tests
- Query installments table → widget shows correct count and total
- Mark installment as paid → count decrements, total reduces
- Click widget → filtered payment plans page loads with status=overdue

### Manual Testing Checklist
- [ ] Dashboard displays OverduePaymentsSummary at top
- [ ] Widget shows correct count of overdue installments
- [ ] Widget shows correct total value formatted as currency
- [ ] Widget uses prominent red styling
- [ ] Widget is clickable and navigates to filtered view
- [ ] Widget shows green "All Payments Current" when no overdue
- [ ] Widget auto-refreshes every 5 minutes
- [ ] Loading state displays correctly
- [ ] Error state displays correctly

### Test Scenarios
**Scenario 1: New Agency (No Overdue)**
- Dashboard loads → widget shows green "All Payments Current"

**Scenario 2: Agency with Overdue Payments**
- Dashboard loads → widget shows red alert with count and total
- Click widget → navigates to /payments/plans?status=overdue

**Scenario 3: Payment Status Changes**
- Mark overdue installment as paid → widget count/total updates automatically (after 5 min or refetch)

**Scenario 4: Multiple Overdue Installments**
- 10 overdue installments totaling $5,000 → widget displays "10 Overdue Payments" and "$5,000.00 Total"

## Dependencies
- `@tanstack/react-query` (v5.90.7) - Data fetching and caching
- `lucide-react` - AlertTriangle icon
- `next/navigation` - Router for navigation
- `@supabase/supabase-js` - Database queries
- Tailwind CSS (v4.x) - Styling

## Success Criteria
- [ ] OverduePaymentsSummary widget created
- [ ] Widget displays count and total value of overdue payments
- [ ] Widget uses prominent red styling for urgency
- [ ] Widget is clickable and navigates to filtered payment plans
- [ ] Widget positioned at top of dashboard
- [ ] Loading and error states handled gracefully
- [ ] Green "all clear" state displays when no overdue payments
- [ ] Component tests passing

## Context Files Reference
- Story Context: `.bmad-ephemeral/stories/5-3-overdue-payment-alerts.context.xml`
- Multi-zone architecture: Dashboard zone for KPI widgets
- Dashboard patterns from Story 5.2

## Next Steps
After completing this task:
1. Proceed to Task 5: Testing and validation
2. Update the MANIFEST.md file to mark Task 4 as complete

---

**Key Design Principle:** This widget uses visual hierarchy (size, color, position) to ensure overdue payments are IMMEDIATELY visible when users access the dashboard. Red color signifies urgency and demands attention, while green provides positive reinforcement when all payments are current.
