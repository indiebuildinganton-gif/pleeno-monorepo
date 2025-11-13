# Task 8: Multi-Step Payment Plan Wizard - Step 3

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** AC 8, 9, 10
**Status:** pending

## Context

This task creates Step 3 of the payment plan wizard, which displays a comprehensive review and confirmation screen showing the payment plan summary and complete installment schedule before final save.

## Task Description

Create Step 3 component that displays generated installments for review, validates that amounts reconcile, and provides navigation to edit previous steps or finalize the payment plan creation.

## Subtasks

### Step 3 Main Component

- [ ] Create file: `apps/payments/app/plans/new/components/PaymentPlanWizardStep3.tsx`
- [ ] Import generated installments from wizard state
- [ ] Import Step 1 and Step 2 data from wizard state
- [ ] Create layout with Summary Section and Installment Schedule Table
- [ ] Implement validation logic (amounts reconciliation)
- [ ] Add "Create Payment Plan" button (calls API to save)
- [ ] Add "Edit General Info" button (navigate to Step 1)
- [ ] Add "Edit Payment Structure" button (navigate to Step 2)
- [ ] Handle loading state during API call
- [ ] Handle success: show success message, redirect to payment plan detail page
- [ ] Handle errors: display error message, keep user on Step 3

### Summary Section Component

- [ ] Create subsection: "Payment Plan Summary"
- [ ] Display fields (read-only):
  - **Selected Student:**
    - Student name (from Step 1)
    - Display prominently at top
  - **Course:**
    - Course name (from Step 1)
  - **Course Dates:**
    - Start date - End date (formatted)
  - **Total Course Value:**
    - Currency formatted
    - Display prominently
  - **Commission Details:**
    - Commission Rate: XX% (convert decimal to percentage)
    - Commissionable Value: $XXX (after fees)
    - **Total Commission: $XXX**
      - Green highlight
      - Larger font
      - Badge or emphasized styling
  - **Non-Commissionable Fees:**
    - Materials: $XXX
    - Admin: $XXX
    - Other: $XXX
    - Total Fees: $XXX
  - **GST Status:**
    - Badge: "GST Inclusive" or "GST Exclusive"
  - **Payment Structure:**
    - Payment Frequency: Monthly / Quarterly / Custom
    - Number of Installments: N
    - Student Lead Time: X days

### Installment Schedule Table

- [ ] Use InstallmentTable component from Task 10
- [ ] Pass generated installments as props
- [ ] Display table with columns:
  - **Installment #:**
    - 0 = "Initial Payment" (if exists)
    - 1, 2, 3...N = "Installment 1", "Installment 2", etc.
  - **Amount:**
    - Currency formatted
    - Align right
  - **Student Due Date:**
    - Date formatted (e.g., "Mar 8, 2025")
  - **College Due Date:**
    - Date formatted (e.g., "Mar 15, 2025")
  - **Status:**
    - Badge component
    - "Paid" (green) if initial_payment_paid = true for installment 0
    - "Draft" (gray) for all other installments
- [ ] Highlight initial payment row:
  - Bold text or background color
  - Clearly distinguish from regular installments
- [ ] Show commission-eligible indicator:
  - Green checkmark icon or badge
  - All installments have generates_commission = true
- [ ] Add table footer:
  - Total row showing SUM of all installments
  - Compare to total course value

### Validation Logic

- [ ] Calculate total from installments:
  ```typescript
  const installmentTotal = installments.reduce((sum, inst) => sum + inst.amount, 0)
  ```
- [ ] Compare to total_course_value from Step 1:
  ```typescript
  const difference = Math.abs(installmentTotal - total_course_value)
  const isValid = difference < 0.01 // Allow 1 cent rounding difference
  ```
- [ ] Display validation result:
  - ✅ If valid: Green banner "Amounts reconcile correctly"
  - ⚠️ If invalid: Red banner "Warning: Installments do not sum to total course value"
    - Show expected: $XXX
    - Show actual: $XXX
    - Show difference: $XXX
    - Disable "Create Payment Plan" button

### Navigation Actions

- [ ] "Edit General Info" button:
  - Navigate to Step 1
  - Preserve all wizard state
  - User can modify and regenerate installments
- [ ] "Edit Payment Structure" button:
  - Navigate to Step 2
  - Preserve Step 1 state
  - User can modify fees, installments, dates
  - Must regenerate installments before returning to Step 3
- [ ] "Create Payment Plan" button:
  - Only enabled when validation passes
  - Shows loading spinner during API call
  - Calls POST /api/payment-plans with full wizard data
  - On success: redirect to payment plan detail page
  - On error: display error message

## Technical Requirements

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Step 3: Review & Confirmation                       │
├──────────────────────────────────────────────────────┤
│  Payment Plan Summary                                │
│  ┌────────────────────────────────────────────────┐  │
│  │ Student: John Doe                              │  │
│  │ Course: Bachelor of Business                   │  │
│  │ Total Value: $10,000                           │  │
│  │ Total Commission: $1,380 (15%)         [green] │  │
│  │ GST Inclusive: Yes                             │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Installment Schedule                                │
│  ┌────────────────────────────────────────────────┐  │
│  │ # │ Amount  │ Student Due │ College Due │ Status││
│  ├───┼─────────┼─────────────┼─────────────┼───────┤│
│  │ 0 │ $2,000  │ Feb 1, 2025 │ Feb 8, 2025 │ Paid  ││  <- Initial payment (bold)
│  │ 1 │ $2,000  │ Mar 1, 2025 │ Mar 8, 2025 │ Draft ││
│  │ 2 │ $2,000  │ Apr 1, 2025 │ Apr 8, 2025 │ Draft ││
│  │ 3 │ $2,000  │ May 1, 2025 │ May 8, 2025 │ Draft ││
│  │ 4 │ $2,000  │ Jun 1, 2025 │ Jun 8, 2025 │ Draft ││
│  ├───┴─────────┴─────────────┴─────────────┴───────┤│
│  │ Total: $10,000                          ✓ Valid ││
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [Edit Step 1]  [Edit Step 2]  [Create Payment Plan]│
└──────────────────────────────────────────────────────┘
```

**Dependencies:**
- InstallmentTable component (Task 10)
- Shadcn UI: Card, Badge, Button, Alert, Table
- TanStack Query for API mutation
- React Router / Next.js navigation

## Acceptance Criteria

✅ **AC 8:** Summary Display
- Show selected student, course, total value
- Highlight total commission (green)
- Display commission rate and GST inclusive status

✅ **AC 9:** Installment Schedule Table
- Display initial payment row (if exists) with paid status badge
- Display regular installment rows (1-N) with draft status
- Show amount, student due date, college due date for each
- Commission-eligible amounts styled/indicated

✅ **AC 10:** Validation and Confirmation
- SUM(initial + installments) = total_course_value
- Validation warning if amounts don't reconcile
- Navigate back to edit previous steps
- Final save creates payment plan with all installments

## References

**From Story Context:**
- Task 9: POST /api/payment-plans API endpoint (final save)
- Task 10: InstallmentTable component
- Epic 4: Story 4.2 review & confirmation requirements

## Testing Checklist

### Component Tests

- [ ] Summary display:
  - All fields display correctly
  - Commission highlighted in green
  - GST status shown as badge

- [ ] Installment table:
  - Initial payment row (installment 0) displayed with bold styling
  - Regular installments (1-N) displayed
  - All amounts, dates, statuses correct
  - Table footer shows total

- [ ] Validation:
  - Valid amounts: green banner, "Create" button enabled
  - Invalid amounts: red banner, "Create" button disabled
  - Rounding tolerance: 1 cent difference allowed

- [ ] Navigation:
  - "Edit Step 1" navigates to Step 1
  - "Edit Step 2" navigates to Step 2
  - "Create Payment Plan" calls API

### Integration Tests

- [ ] API call to POST /api/payment-plans:
  - Success: redirects to payment plan detail page
  - Error: displays error message
  - Loading state: button shows spinner

- [ ] Edit and regenerate:
  - Navigate to Step 2, change fees
  - Regenerate installments
  - Return to Step 3, verify updated installments

### E2E Tests

- [ ] Complete full wizard flow:
  - Step 1 → Step 2 → Step 3
  - Review all data
  - Create payment plan
  - Verify payment plan saved correctly in database
  - Verify installments created

- [ ] Edit flow:
  - Complete to Step 3
  - Go back to Step 1, change commission rate
  - Proceed to Step 3
  - Verify commission recalculated

## Dev Notes

**Validation Tolerance:**
Allow 1 cent rounding difference due to floating-point arithmetic:
```typescript
const VALIDATION_TOLERANCE = 0.01
const isValid = Math.abs(installmentTotal - total_course_value) < VALIDATION_TOLERANCE
```

**Why Amounts Might Not Reconcile:**
- Rounding errors in amount distribution
- User manually edited installment amounts (if custom frequency)
- Bug in generation logic (Task 5)

If validation fails, user must go back and regenerate.

**Initial Payment Highlighting:**
Make initial payment row visually distinct:
- Bold font
- Light background color
- "Initial Payment" label instead of "Installment 0"

**Status Badges:**
Use consistent badge styling:
- Paid: Green badge with checkmark
- Draft: Gray badge

**Commission Emphasis:**
Total commission is the most important metric for agency users. Make it prominent:
- Larger font size (1.5x)
- Green color
- Bold weight
- Maybe icon (💰 or 🎯)

**Success Redirect:**
After payment plan creation, redirect to:
```typescript
router.push(`/plans/${createdPlanId}`)
```

This shows the newly created payment plan detail page (future story).

**Error Handling:**
If API call fails:
- Display error message in alert banner
- Keep user on Step 3
- Allow retry or go back to edit

**Loading State:**
During API call:
- Disable all buttons
- Show spinner on "Create Payment Plan" button
- Show loading overlay (optional)

**Confirmation Dialog:**
Consider adding confirmation dialog before final save:
"Are you sure you want to create this payment plan?"
- Prevents accidental submissions
- User can review one more time
