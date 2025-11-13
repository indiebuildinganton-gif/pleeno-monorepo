# Story 4-4: Manual Payment Recording - Task 6

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

## Task 6: Partial Payment Display

### Description
Enhance the UI to clearly display partial payment information and outstanding balances.

### Implementation Checklist
- [ ] Update `InstallmentsList` to show partial payment details:
  - [ ] Display paid_amount when status is "partial"
  - [ ] Calculate and display outstanding balance (amount - paid_amount)
  - [ ] Use yellow badge for partial payment status
- [ ] Add visual indicators for partial payments:
  - [ ] Progress bar or indicator showing paid percentage
  - [ ] Text: "$X of $Y paid" (e.g., "$500 of $1,000 paid")
  - [ ] Outstanding balance: "$Y remaining"
- [ ] Update `MarkAsPaidModal` to handle partial payment scenarios:
  - [ ] Pre-fill paid_amount with outstanding balance for partial payments
  - [ ] Show "This is a partial payment" warning if paid_amount < installment.amount
  - [ ] Show remaining balance after current payment in real-time
- [ ] Ensure consistent currency formatting throughout
- [ ] Add tooltip or help text explaining partial payments

### Acceptance Criteria
- **AC 2**: Partial Payment Support - User can record partial payments where paid_amount < installment.amount. System tracks outstanding balance.

### Key Constraints
- Currency Formatting: Use packages/utils/src/formatters.ts formatCurrency() with agency.currency
- Status Badge Reuse: Follow same badge styling from Story 4.3 (paid=green, partial=yellow, pending=gray)

### Relevant Artifacts
- **InstallmentsList**: [apps/payments/app/plans/[id]/components/InstallmentsList.tsx](apps/payments/app/plans/[id]/components/InstallmentsList.tsx)
- **MarkAsPaidModal**: [apps/payments/app/plans/[id]/components/MarkAsPaidModal.tsx](apps/payments/app/plans/[id]/components/MarkAsPaidModal.tsx)
- Formatter utilities: [packages/utils/src/formatters.ts](packages/utils/src/formatters.ts)

### Implementation Guide

**InstallmentsList Partial Payment Display**:
```typescript
{installment.status === 'partial' && (
  <div className="partial-payment-info">
    <Badge variant="warning">Partial</Badge>
    <div className="payment-details">
      <Progress value={(installment.paid_amount / installment.amount) * 100} />
      <span className="text-sm text-muted-foreground">
        {formatCurrency(installment.paid_amount)} of {formatCurrency(installment.amount)} paid
      </span>
      <span className="text-sm font-medium">
        {formatCurrency(installment.amount - installment.paid_amount)} remaining
      </span>
    </div>
  </div>
)}
```

**MarkAsPaidModal for Partial Payments**:
```typescript
// Calculate outstanding balance
const outstandingBalance = installment.amount - (installment.paid_amount || 0)

// Pre-fill with outstanding balance for partial payments
const defaultPaidAmount = installment.status === 'partial'
  ? outstandingBalance
  : installment.amount

// Show warning for partial payments
const isPaidAmountPartial = watchedPaidAmount < outstandingBalance

{isPaidAmountPartial && (
  <Alert variant="warning">
    <AlertDescription>
      This is a partial payment. Outstanding balance after this payment:
      {formatCurrency(outstandingBalance - watchedPaidAmount)}
    </AlertDescription>
  </Alert>
)}
```

**Status Badge Colors**:
- `paid`: Green (e.g., `bg-green-100 text-green-800`)
- `partial`: Yellow (e.g., `bg-yellow-100 text-yellow-800`)
- `pending`: Gray (e.g., `bg-gray-100 text-gray-800`)

---

## Manifest Update Instructions

**Before starting Task 6**, update the manifest:

1. Open `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/manifest.md`
2. Update Task 5:
   ```markdown
   ### Task 5: Dashboard Widget Updates
   - Status: Completed
   - Started: [Date]
   - Completed: [Current Date]
   - Notes: [Add any notes about Task 5 implementation]
   ```
3. Update Task 6:
   ```markdown
   ### Task 6: Partial Payment Display
   - Status: In Progress
   - Started: [Current Date]
   - Completed:
   - Notes:
   ```

---

## Implementation Notes from Previous Tasks

- **Task 1**: API supports partial payments (status = "partial" when paid_amount < amount)
- **Task 2**: `MarkAsPaidModal` allows entering any valid paid_amount
- **Task 4**: `InstallmentsList` displays installment status

This task (Task 6) enhances the UI to make partial payment information clear and actionable.

**Key UX Considerations**:
- Users should immediately understand how much has been paid and how much is remaining
- For partial payments, the "Mark as Paid" button should still be available to record additional payments
- The modal should help users understand they're making a partial payment in real-time

---

## Next Steps

1. Update the manifest as described above
2. Implement Task 6 following the checklist
3. Test partial payment scenarios:
   - Record a partial payment (e.g., $500 of $1,000)
   - Verify UI shows partial status, paid amount, and outstanding balance
   - Record another payment to complete the installment
4. When Task 6 is complete:
   - Update manifest: Set Task 6 status to "Completed" with completion date
   - Add implementation notes
   - Move to `task-7-prompt.md` (Audit Logging)

**Reference**: For full story context, see `.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml`
