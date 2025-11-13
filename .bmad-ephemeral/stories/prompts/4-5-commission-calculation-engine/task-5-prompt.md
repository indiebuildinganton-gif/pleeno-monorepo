# Story 4.5: Commission Calculation Engine - Task 5

## Story Context
**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Previous Task**: Task 4 - Update Payment Recording to Recalculate Commission (Completed)

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

---

## Task 5: Payment Plan Detail Commission Display

### Acceptance Criteria
AC 3: Per-Payment-Plan Commission Tracking
- Display: Expected Commission, Earned Commission, Outstanding Commission
- Commission progress bar: earned / expected
- Percentage of commission earned: (earned / expected) * 100
- Commission values update immediately when payment recorded (via query invalidation)

### Task Description
Create a CommissionSummary component to display commission information on the payment plan detail page. This component shows expected, earned, and outstanding commission with a visual progress bar.

### Subtasks Checklist
- [ ] Add CommissionSummary component to payment plan detail page
- [ ] Component displays:
  - Expected Commission: formatCurrency(payment_plan.expected_commission)
  - Earned Commission: formatCurrency(payment_plan.earned_commission) (green text)
  - Outstanding Commission: formatCurrency(expected - earned) (red if positive)
  - Commission Progress Bar: Visual bar showing earned / expected percentage
  - Percentage Earned: ((earned / expected) * 100).toFixed(1) + '%'
- [ ] Commission values fetch from payment_plan.expected_commission and payment_plan.earned_commission
- [ ] Update in real-time via query invalidation when payment recorded
- [ ] Handle edge case: If expected_commission = 0, show "N/A" or "No commission expected"

---

## Context & Constraints

### Key Constraints
- Use Shadcn UI components (Card, Progress, Badge)
- Real-time updates via TanStack Query invalidation
- Currency formatting with formatCurrency utility
- Visual distinction: Green for earned, red for outstanding
- Responsive design: Works on mobile and desktop

### Dependencies
```json
{
  "@tanstack/react-query": "5.90.7",
  "recharts": "3.3.0"
}
```

---

## Manifest Update Instructions

Before starting:
1. Open: `.bmad-ephemeral/stories/prompts/4-5-commission-calculation-engine/MANIFEST.md`
2. Update Task 4:
   - Status: "Completed"
   - Completed: [Date]
   - Notes: [Implementation notes from Task 4]
3. Update Task 5:
   - Status: "In Progress"
   - Started: [Current Date]

---

## Implementation Steps

### Step 1: Create CommissionSummary Component
Create: `apps/payments/app/plans/[id]/components/CommissionSummary.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/packages/utils/src/formatters';

interface CommissionSummaryProps {
  expectedCommission: number;
  earnedCommission: number;
  currency?: string;
}

export function CommissionSummary({
  expectedCommission,
  earnedCommission,
  currency = 'AUD',
}: CommissionSummaryProps) {
  // Handle edge case: No commission expected
  if (expectedCommission === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No commission expected for this payment plan</p>
        </CardContent>
      </Card>
    );
  }

  const outstandingCommission = expectedCommission - earnedCommission;
  const commissionPercentage = (earnedCommission / expectedCommission) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Commission Amounts */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Expected</p>
            <p className="text-lg font-semibold">
              {formatCurrency(expectedCommission, currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Earned</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(earnedCommission, currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className={`text-lg font-semibold ${outstandingCommission > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {formatCurrency(outstandingCommission, currency)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Commission Progress</p>
            <Badge variant={commissionPercentage === 100 ? 'success' : 'default'}>
              {commissionPercentage.toFixed(1)}%
            </Badge>
          </div>
          <Progress value={commissionPercentage} className="h-3" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 2: Integrate into Payment Plan Detail Page
Modify: `apps/payments/app/plans/[id]/components/PaymentPlanDetail.tsx`

Add CommissionSummary component to the layout:

```typescript
import { CommissionSummary } from './CommissionSummary';

export function PaymentPlanDetail({ planId }: { planId: string }) {
  const { data: paymentPlan, isLoading } = useQuery({
    queryKey: ['payment-plans', planId],
    queryFn: () => fetchPaymentPlan(planId),
  });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Existing payment plan info */}
      <PaymentPlanHeader plan={paymentPlan} />

      {/* NEW: Commission Summary */}
      <CommissionSummary
        expectedCommission={paymentPlan.expected_commission}
        earnedCommission={paymentPlan.earned_commission}
        currency={paymentPlan.currency}
      />

      {/* Existing installments list */}
      <InstallmentsList planId={planId} />
    </div>
  );
}
```

### Step 3: Ensure Real-Time Updates
The component will automatically update when:
- Payment is recorded (Task 4 invalidates ['payment-plans', planId])
- TanStack Query refetches the payment plan data
- React re-renders CommissionSummary with new values

No additional work needed - query invalidation from Task 4 handles this.

### Step 4: Add Loading and Error States
```typescript
export function CommissionSummary({ ... }: CommissionSummaryProps) {
  // Add skeleton loader
  if (isLoading) {
    return <CommissionSummarySkeleton />;
  }

  // Add error handling
  if (error) {
    return <CommissionSummaryError error={error} />;
  }

  // ... existing component code
}
```

---

## UI/UX Considerations

### Visual Design
- **Card Layout**: Use Shadcn Card for clean separation
- **Color Coding**:
  - Expected: Default text color
  - Earned: Green (text-green-600)
  - Outstanding: Red if > 0 (text-red-600), Gray if 0
- **Progress Bar**: Visual indicator of commission earned
- **Badge**: Show percentage with success variant when 100%

### Responsive Design
- Grid layout for commission amounts (3 columns on desktop)
- Stack vertically on mobile (grid-cols-1)
- Progress bar full width for visibility

### Edge Cases to Handle
1. **No Commission Expected**: Show "N/A" message
2. **Zero Earned Commission**: Show $0 in green (not an error)
3. **100% Earned**: Show success badge and full progress bar
4. **Overpayment**: Cap progress bar at 100%, show actual amount

---

## Testing Requirements

### Component Tests
Create: `apps/payments/app/plans/[id]/components/__tests__/CommissionSummary.test.tsx`

Test cases:
1. Displays expected, earned, outstanding commission correctly
2. Shows progress bar with correct percentage
3. Colors earned commission green
4. Colors outstanding commission red when > 0
5. Shows "N/A" when expected commission is 0
6. Shows 100% badge when fully earned
7. Handles edge case: earned > expected (overpayment)
8. Currency formatting works correctly

### Integration Test
Test real-time updates:
1. Load payment plan detail page
2. Record a payment via MarkAsPaidModal
3. Verify CommissionSummary updates with new earned commission
4. Verify progress bar updates
5. Verify percentage badge updates

---

## Context References

### Story Context File
Full context: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Related Files
- Component: `apps/payments/app/plans/[id]/components/CommissionSummary.tsx` (NEW)
- Detail Page: `apps/payments/app/plans/[id]/components/PaymentPlanDetail.tsx` (MODIFY)
- Utility: `packages/utils/src/formatters.ts` (formatCurrency)
- Shadcn Components: Card, Progress, Badge

### Dependencies from Previous Tasks
- Task 3: Commission calculation logic
- Task 4: Real-time commission updates via query invalidation
- Story 4.3: Payment plan detail page structure

---

## Next Steps

After completing Task 5:
1. Update MANIFEST.md:
   - Task 5 status: "Completed"
   - Task 5 completed date
   - Add notes: Component created, integrated into detail page
2. Test commission display with various scenarios
3. Move to Task 6: Commission by College/Branch Report
4. Reference file: `task-6-prompt.md`

---

## Success Criteria

Task 5 is complete when:
- [x] CommissionSummary component created and styled
- [x] Component displays expected, earned, outstanding commission
- [x] Progress bar shows visual percentage
- [x] Color coding applied (green for earned, red for outstanding)
- [x] Edge case handled (no commission expected)
- [x] Component integrated into payment plan detail page
- [x] Real-time updates work when payment recorded
- [x] Component tests pass
- [x] MANIFEST.md updated with Task 5 completion
