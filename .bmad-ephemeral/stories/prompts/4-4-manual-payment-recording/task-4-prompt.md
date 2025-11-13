# Story 4-4: Manual Payment Recording - Task 4

## Story Context
**As a** Agency User
**I want** to manually record when an installment is paid
**So that** I can keep the system up-to-date and track which payments have been received

**Previous Tasks**:
- Task 1 (Record Payment API) - Completed
- Task 2 (Mark as Paid UI Component) - Completed
- Task 3 (TanStack Query Mutation) - Completed

## Task 4: Payment Plan Detail Page Updates

### Description
Update the payment plan detail page to display the "Mark as Paid" button and show payment progress.

### Implementation Checklist
- [ ] Update `InstallmentsList.tsx` to add "Mark as Paid" button column
- [ ] Show button only for pending and partial installments
- [ ] Hide button for already paid installments
- [ ] Add onClick handler to open `MarkAsPaidModal`
- [ ] Update `PaymentPlanDetail.tsx` to add payment progress indicators:
  - [ ] Progress bar showing percentage of installments paid
  - [ ] Text: "X of Y installments paid"
  - [ ] Text: "$X of $Y paid" (using formatCurrency)
- [ ] Add modal state management (isOpen, selectedInstallment)
- [ ] Integrate `MarkAsPaidModal` component
- [ ] Ensure page auto-refreshes after successful payment recording
- [ ] Update status badges to reflect new payment statuses

### Acceptance Criteria
- **AC 1**: Mark Installment as Paid - User can mark pending installments as paid. Status changes to "paid".
- **AC 4**: Payment Plan Status Auto-Update - When all installments paid → payment_plan.status changes to "completed".
- **AC 5**: Dashboard and Reports Reflect Updates - Payment plan detail shows current payment progress.

### Key Constraints
- Path Format: Use project-relative paths only
- Currency Formatting: Use packages/utils/src/formatters.ts formatCurrency() with agency.currency
- Status Badge Reuse: Follow same badge styling from Story 4.3 (paid=green, partial=yellow)

### Relevant Artifacts
- **InstallmentsList**: [apps/payments/app/plans/[id]/components/InstallmentsList.tsx](apps/payments/app/plans/[id]/components/InstallmentsList.tsx) - Add "Mark as Paid" button column
- **PaymentPlanDetail**: [apps/payments/app/plans/[id]/components/PaymentPlanDetail.tsx](apps/payments/app/plans/[id]/components/PaymentPlanDetail.tsx) - Add payment progress bar
- **usePaymentPlanDetail**: [apps/payments/app/plans/[id]/hooks/usePaymentPlanDetail.ts](apps/payments/app/plans/[id]/hooks/usePaymentPlanDetail.ts) - Will auto-refetch after mutation
- Formatter utilities: [packages/utils/src/formatters.ts](packages/utils/src/formatters.ts)

### Implementation Guide

**InstallmentsList Updates**:
```typescript
// Add Actions column to table
<TableCell>
  {installment.status !== 'paid' && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onMarkAsPaid(installment)}
    >
      Mark as Paid
    </Button>
  )}
</TableCell>
```

**PaymentPlanDetail Progress Indicator**:
```typescript
const paidInstallments = installments.filter(i => i.status === 'paid').length
const totalInstallments = installments.length
const paidAmount = installments
  .filter(i => i.status === 'paid')
  .reduce((sum, i) => sum + i.paid_amount, 0)
const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0)
const progressPercentage = (paidAmount / totalAmount) * 100

<div className="payment-progress">
  <Progress value={progressPercentage} />
  <div className="progress-text">
    {paidInstallments} of {totalInstallments} installments paid
  </div>
  <div className="progress-amount">
    {formatCurrency(paidAmount)} of {formatCurrency(totalAmount)} paid
  </div>
</div>
```

---

## Manifest Update Instructions

**Before starting Task 4**, update the manifest:

1. Open `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/manifest.md`
2. Update Task 3:
   ```markdown
   ### Task 3: TanStack Query Mutation for Payment Recording
   - Status: Completed
   - Started: [Date]
   - Completed: [Current Date]
   - Notes: [Add any notes about Task 3 implementation]
   ```
3. Update Task 4:
   ```markdown
   ### Task 4: Payment Plan Detail Page Updates
   - Status: In Progress
   - Started: [Current Date]
   - Completed:
   - Notes:
   ```

---

## Implementation Notes from Previous Tasks

- **Task 1**: API endpoint handles payment recording and status updates
- **Task 2**: `MarkAsPaidModal` provides the UI for payment input
- **Task 3**: `useRecordPayment` mutation handles optimistic updates and query invalidation

This task (Task 4) integrates all previous components into the payment plan detail page, making the feature accessible to users.

**Auto-refresh**: Thanks to Task 3's query invalidation, the page will automatically refetch and show updated data after successful payment recording.

---

## Next Steps

1. Update the manifest as described above
2. Implement Task 4 following the checklist
3. Test the complete flow:
   - Click "Mark as Paid" button
   - Fill in payment details in modal
   - Submit and verify optimistic update
   - Verify page shows updated progress
4. When Task 4 is complete:
   - Update manifest: Set Task 4 status to "Completed" with completion date
   - Add implementation notes
   - Move to `task-5-prompt.md` (Dashboard Widget Updates)

**Reference**: For full story context, see `.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml`
