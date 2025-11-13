# Story 4.5: Commission Calculation Engine - Task 4

## Story Context
**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Previous Task**: Task 3 - Earned Commission Calculation Utility (Completed)

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

---

## Task 4: Update Payment Recording to Recalculate Commission

### Acceptance Criteria
AC 2: Earned Commission Calculation Based on Payments
- When installments are marked as paid, system automatically recalculates earned commission
- Earned commission updates in real-time as payments are recorded
- Commission values update immediately via query invalidation

### Task Description
Extend the payment recording API from Story 4.4 to automatically recalculate and update the earned commission when a payment is recorded. This task integrates the `calculateEarnedCommission` utility from Task 3 into the payment workflow.

### Subtasks Checklist
- [ ] Modify POST /api/installments/[id]/record-payment from Story 4.4
- [ ] After updating installment status to 'paid':
  - Fetch payment plan with all installments
  - Call calculateEarnedCommission()
  - UPDATE payment_plans SET earned_commission = calculated_value WHERE id = payment_plan_id
- [ ] Return updated payment plan with new earned_commission in response
- [ ] TanStack Query mutation invalidates: ['payment-plans', planId], ['dashboard', 'commission-summary']

---

## Context & Constraints

### Key Constraints
- Extend existing API from Story 4.4 (don't break existing functionality)
- Recalculate commission after every payment recording
- Update cached earned_commission field on payment_plans table
- Query invalidation: Trigger UI refresh for payment plans and dashboard
- Audit logging: Log commission recalculation with user context

### Dependencies
```json
{
  "@supabase/supabase-js": "latest",
  "@tanstack/react-query": "5.90.7"
}
```

---

## Manifest Update Instructions

Before starting:
1. Open: `.bmad-ephemeral/stories/prompts/4-5-commission-calculation-engine/MANIFEST.md`
2. Update Task 3:
   - Status: "Completed"
   - Completed: [Date]
   - Notes: [Implementation notes from Task 3]
3. Update Task 4:
   - Status: "In Progress"
   - Started: [Current Date]

---

## Implementation from Previous Work

### Story 4.4: Payment Recording API
**Existing File**: `apps/payments/app/api/installments/[id]/record-payment/route.ts`

Current functionality:
- Updates installment status to 'paid'
- Records paid_date, paid_amount, payment_notes
- Auto-updates payment plan status when all installments paid
- Audit logging

**This task extends the API to also recalculate commission.**

### Task 3: Commission Calculation Utility
**Location**: `packages/utils/src/commission-calculator.ts`

Available function:
```typescript
function calculateEarnedCommission({
  installments,
  total_amount,
  expected_commission,
  materials_cost,
  admin_fees,
  other_fees,
}): EarnedCommissionResult
```

---

## Implementation Steps

### Step 1: Modify Payment Recording API Route
Modify: `apps/payments/app/api/installments/[id]/record-payment/route.ts`

Add commission recalculation logic after payment recording:

```typescript
import { calculateEarnedCommission } from '@/packages/utils/src/commission-calculator';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ... existing payment recording logic ...

  // After updating installment to 'paid', recalculate commission:

  // 1. Fetch the payment plan with all installments
  const { data: paymentPlan, error: planError } = await supabase
    .from('payment_plans')
    .select(`
      *,
      installments (*)
    `)
    .eq('id', installment.payment_plan_id)
    .single();

  if (planError) throw planError;

  // 2. Calculate earned commission
  const commissionResult = calculateEarnedCommission({
    installments: paymentPlan.installments,
    total_amount: paymentPlan.total_amount,
    expected_commission: paymentPlan.expected_commission,
    materials_cost: paymentPlan.materials_cost || 0,
    admin_fees: paymentPlan.admin_fees || 0,
    other_fees: paymentPlan.other_fees || 0,
  });

  // 3. Update payment_plans table with new earned_commission
  const { error: updateError } = await supabase
    .from('payment_plans')
    .update({
      earned_commission: commissionResult.earned_commission,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentPlan.id);

  if (updateError) throw updateError;

  // 4. Log commission recalculation to audit_logs
  await supabase.from('audit_logs').insert({
    table_name: 'payment_plans',
    record_id: paymentPlan.id,
    action: 'commission_recalculated',
    old_data: { earned_commission: paymentPlan.earned_commission },
    new_data: { earned_commission: commissionResult.earned_commission },
    user_id: session.user.id,
    agency_id: session.user.agency_id,
  });

  // 5. Return updated payment plan
  return NextResponse.json({
    installment: updatedInstallment,
    payment_plan: {
      ...paymentPlan,
      earned_commission: commissionResult.earned_commission,
    },
    commission: commissionResult,
  });
}
```

### Step 2: Update TanStack Query Mutation Hook
Modify: `apps/payments/app/plans/[id]/hooks/useRecordPayment.ts`

Add query invalidation for commission-related queries:

```typescript
export function useRecordPayment(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecordPaymentData) => {
      const response = await fetch(`/api/installments/${data.installmentId}/record-payment`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Existing invalidations from Story 4.4
      queryClient.invalidateQueries({ queryKey: ['payment-plans', planId] });
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'payment-status'] });

      // NEW: Invalidate commission-related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'commission-summary'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'commission-by-college'] });
    },
  });
}
```

### Step 3: Error Handling
Add proper error handling for commission recalculation:
- If commission calculation fails, log error but don't fail payment recording
- Return warning in response if commission couldn't be recalculated
- Ensure payment recording transaction is atomic (rollback if commission update fails)

---

## Testing Requirements

### Integration Tests
Create: `apps/payments/__tests__/api/commission-recalculation.test.ts`

Test cases:
1. **Payment Recording Triggers Recalculation**:
   - Record payment for installment
   - Verify earned_commission updated in payment_plans table
   - Verify response includes commission data
2. **Partial Payment Contribution**:
   - Record partial payment (paid_amount < installment.amount)
   - Verify commission calculated proportionally
3. **Multiple Payments**:
   - Record payments for multiple installments
   - Verify earned_commission accumulates correctly
4. **Non-Commissionable Installment**:
   - Record payment for installment with generates_commission = false
   - Verify earned_commission doesn't change
5. **Commission with Fees**:
   - Payment plan has materials_cost, admin_fees
   - Verify commission calculated on commissionable amount only
6. **Query Invalidation**:
   - Mock TanStack Query
   - Verify correct queries invalidated on success

---

## Context References

### Story Context File
Full context: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Related Files
- API Route: `apps/payments/app/api/installments/[id]/record-payment/route.ts`
- Mutation Hook: `apps/payments/app/plans/[id]/hooks/useRecordPayment.ts`
- Utility: `packages/utils/src/commission-calculator.ts`

### Dependencies from Previous Work
- Story 4.4: Payment recording API and mutation hook
- Task 3: calculateEarnedCommission utility function
- Database schema: payment_plans.earned_commission field (will be added in Task 12)

---

## Next Steps

After completing Task 4:
1. Update MANIFEST.md:
   - Task 4 status: "Completed"
   - Task 4 completed date
   - Add notes: Files modified, commission recalculation working
2. Test payment recording with commission updates
3. Move to Task 5: Payment Plan Detail Commission Display
4. Reference file: `task-5-prompt.md`

---

## Success Criteria

Task 4 is complete when:
- [x] Payment recording API recalculates commission after each payment
- [x] earned_commission field updated in payment_plans table
- [x] Commission calculation uses Task 3 utility function
- [x] API response includes updated commission data
- [x] Query invalidation triggers for commission-related queries
- [x] Audit logs record commission recalculations
- [x] Integration tests pass
- [x] MANIFEST.md updated with Task 4 completion
