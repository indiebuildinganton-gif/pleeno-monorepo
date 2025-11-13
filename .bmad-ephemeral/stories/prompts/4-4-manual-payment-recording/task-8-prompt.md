# Story 4-4: Manual Payment Recording - Task 8

## Story Context
**As a** Agency User
**I want** to manually record when an installment is paid
**So that** I can keep the system up-to-date and track which payments have been received

**Previous Tasks**:
- Task 1 (Record Payment API) - Completed
- Task 2 (Mark as Paid UI Component) - Completed
- Task 3 (TanStack Query Mutation) - Completed
- Task 4 (Payment Plan Detail Page Updates) - Completed
- Task 5 (Dashboard Widget Updates) - Completed
- Task 6 (Partial Payment Display) - Completed
- Task 7 (Audit Logging) - Completed

## Task 8: Commission Recalculation

### Description
Implement automatic commission recalculation when payments are recorded, laying the foundation for Story 4.5 (Commission Tracking).

### Implementation Checklist
- [ ] Implement commission calculation function based on architecture formula:
  - [ ] Calculate total paid amount: SUM(paid_amount WHERE status IN ('paid', 'partial'))
  - [ ] Calculate total amount: SUM(amount) for all installments
  - [ ] Calculate earned commission: (total_paid / total_amount) * expected_commission
- [ ] Integrate commission recalculation into Task 1's API endpoint:
  - [ ] Fetch all installments for the payment plan
  - [ ] Calculate earned_commission
  - [ ] Update payment_plan.earned_commission in the same transaction
- [ ] Add commission field to payment plan response
- [ ] Update payment plan detail UI to display earned commission:
  - [ ] Show expected_commission
  - [ ] Show earned_commission
  - [ ] Show commission progress percentage
  - [ ] Use formatCurrency for display
- [ ] Ensure commission updates reflect in dashboard widgets (Task 5)

### Acceptance Criteria
- **AC 5**: Dashboard and Reports Reflect Updates - Commission breakdown updates to reflect new payment status.
- **Foundation for Story 4.5**: Commission calculation logic is in place and tested.

### Key Constraints
- Commission Recalculation: Update payment_plan.earned_commission after each payment
- Database Transaction: Commission recalculation must be atomic with payment recording
- Currency Formatting: Use packages/utils/src/formatters.ts formatCurrency()

### Relevant Artifacts
- Architecture reference: [docs/architecture.md](docs/architecture.md) - Commission Calculation Engine section

### Commission Calculation Formula

From architecture docs:
```
earned_commission = (SUM(paid_amount WHERE status='paid') / total_amount) * expected_commission
```

**Note**: Include both 'paid' and 'partial' installments in the calculation, as partial payments contribute to earned commission.

### Implementation Guide

**Commission Calculation Function**:
```typescript
// packages/utils/src/commission.ts
export function calculateEarnedCommission(
  installments: Installment[],
  expectedCommission: number
): number {
  const totalPaid = installments
    .filter(i => i.status === 'paid' || i.status === 'partial')
    .reduce((sum, i) => sum + (i.paid_amount || 0), 0)

  const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0)

  if (totalAmount === 0) return 0

  return (totalPaid / totalAmount) * expectedCommission
}
```

**Integration in Task 1's API Route**:
```typescript
// After updating installment, recalculate commission
const { data: allInstallments } = await supabase
  .from('installments')
  .select('*')
  .eq('payment_plan_id', paymentPlanId)

const { data: paymentPlan } = await supabase
  .from('payment_plans')
  .select('expected_commission')
  .eq('id', paymentPlanId)
  .single()

const earnedCommission = calculateEarnedCommission(
  allInstallments,
  paymentPlan.expected_commission
)

// Update payment plan with new earned commission
await supabase
  .from('payment_plans')
  .update({ earned_commission: earnedCommission })
  .eq('id', paymentPlanId)
```

**UI Display in Payment Plan Detail**:
```typescript
<div className="commission-tracking">
  <div className="commission-header">Commission Tracking</div>
  <div className="commission-details">
    <div className="commission-row">
      <span>Expected Commission:</span>
      <span className="font-medium">{formatCurrency(paymentPlan.expected_commission)}</span>
    </div>
    <div className="commission-row">
      <span>Earned Commission:</span>
      <span className="font-medium text-green-600">
        {formatCurrency(paymentPlan.earned_commission)}
      </span>
    </div>
    <Progress
      value={(paymentPlan.earned_commission / paymentPlan.expected_commission) * 100}
      className="mt-2"
    />
    <span className="text-sm text-muted-foreground">
      {Math.round((paymentPlan.earned_commission / paymentPlan.expected_commission) * 100)}% earned
    </span>
  </div>
</div>
```

---

## Manifest Update Instructions

**Before starting Task 8**, update the manifest:

1. Open `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/manifest.md`
2. Update Task 7:
   ```markdown
   ### Task 7: Audit Logging
   - Status: Completed
   - Started: [Date]
   - Completed: [Current Date]
   - Notes: [Add any notes about Task 7 implementation]
   ```
3. Update Task 8:
   ```markdown
   ### Task 8: Commission Recalculation
   - Status: In Progress
   - Started: [Current Date]
   - Completed:
   - Notes:
   ```

---

## Implementation Notes from Previous Tasks

- **Task 1**: API endpoint handles payment recording and payment plan updates
- **Task 4**: Payment plan detail page displays payment plan information
- **Task 5**: Dashboard widgets display commission information

This task (Task 8) adds commission calculation logic and UI, preparing for Story 4.5 (Commission Tracking).

**Database Schema Note**: Ensure the `payment_plans` table has both `expected_commission` and `earned_commission` columns. If not, create a migration to add them.

---

## Next Steps

1. Update the manifest as described above
2. Implement Task 8 following the checklist
3. Test commission recalculation:
   - Record payments and verify earned_commission updates
   - Test with partial payments
   - Verify commission percentage is accurate
4. When Task 8 is complete:
   - Update manifest: Set Task 8 status to "Completed" with completion date
   - Add implementation notes
   - Move to `task-9-prompt.md` (Testing)

**Reference**: For full story context, see `.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml`
