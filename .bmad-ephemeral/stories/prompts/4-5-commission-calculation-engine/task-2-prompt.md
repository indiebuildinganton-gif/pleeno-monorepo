# Story 4.5: Commission Calculation Engine - Task 2

## Story Context
**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Previous Task**: Task 1 - Draft Installment Calculation Logic (Completed)

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

---

## Task 2: Payment Plan Wizard Draft Review Step

### Acceptance Criteria
AC 1: Draft Installment Calculation During Payment Plan Creation
- Present draft installments to user for review and approval before saving
- Allow manual adjustment with validation (SUM must equal total)
- Enable/disable editing mode
- Show running total validation

### Task Description
Modify the PaymentPlanWizard component to include a draft installment review step. After the user inputs the payment plan parameters, the wizard should automatically calculate and display the draft installments using the `calculateInstallmentSchedule` function from Task 1.

### Subtasks Checklist
- [ ] Modify PaymentPlanWizard component (Step 2: Payment Structure)
- [ ] After user inputs number_of_installments and frequency:
  - Call calculateInstallmentSchedule()
  - Display draft installments in read-only table for review
  - Show: Installment #, Amount, Student Due Date, College Due Date
- [ ] Add "Edit Amounts" button to enable manual adjustment mode
- [ ] In edit mode:
  - Make amount fields editable (number inputs)
  - Show running total: SUM(installment amounts) and compare to total_amount
  - Show validation error if SUM != total_amount: "Installments must total ${total_amount}"
  - Disable "Next" button until SUM === total_amount
- [ ] Add "Reset to Auto-Calculated" button to revert manual changes
- [ ] Final installment amount auto-adjusts as user edits other installments

---

## Context & Constraints

### Key Constraints
- Multi-zone architecture: Payment wizard lives in apps/payments/ zone
- Use TanStack Query for server state management
- Use React Hook Form for form state management
- Follow Shadcn UI component patterns
- Real-time validation: Running total must always equal payment plan total

### Dependencies
```json
{
  "react-hook-form": "7.66.0",
  "zod": "4.x",
  "@tanstack/react-query": "5.90.7",
  "date-fns": "4.1.0"
}
```

### Files to Modify
- `apps/payments/app/plans/new/components/PaymentPlanWizard.tsx` - Add draft review step
- Create: `apps/payments/app/plans/new/components/DraftInstallmentsReview.tsx` - New component for draft table

### Component Structure
```typescript
interface DraftInstallmentsReviewProps {
  draftInstallments: DraftInstallment[];
  totalAmount: number;
  onInstallmentsChange: (installments: DraftInstallment[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// Component should include:
// - Read-only table view by default
// - "Edit Amounts" button to toggle edit mode
// - Editable amount fields in edit mode
// - Running total with validation indicator
// - "Reset to Auto-Calculated" button
// - Next/Back navigation buttons
```

---

## Implementation from Previous Task

Task 1 created the `calculateInstallmentSchedule` function that this task will consume:

**Location**: `packages/utils/src/commission-calculator.ts`

**Function Signature**:
```typescript
function calculateInstallmentSchedule(params: {
  total_amount: number;
  number_of_installments: number;
  frequency: 'monthly' | 'quarterly' | 'custom';
  start_date: Date;
  student_lead_time_days: number;
}): DraftInstallment[]
```

This task integrates that utility into the payment plan wizard UI.

---

## Manifest Update Instructions

Before starting implementation:
1. Open: `.bmad-ephemeral/stories/prompts/4-5-commission-calculation-engine/MANIFEST.md`
2. Update Task 1:
   - Status: "Completed"
   - Completed: [Date from Task 1]
   - Notes: [Any implementation notes from Task 1]
3. Update Task 2:
   - Status: "In Progress"
   - Started: [Current Date]

---

## Implementation Steps

### Step 1: Create DraftInstallmentsReview Component
Create: `apps/payments/app/plans/new/components/DraftInstallmentsReview.tsx`

Features:
- Display draft installments in a table (Shadcn Table component)
- Columns: Installment #, Amount, Student Due Date, College Due Date
- Show running total with visual indicator (green if matches, red if doesn't)
- Edit mode toggle
- Manual amount editing with real-time validation
- Auto-adjust final installment as user edits

### Step 2: Integrate into PaymentPlanWizard
Modify: `apps/payments/app/plans/new/components/PaymentPlanWizard.tsx`

Changes:
- Import calculateInstallmentSchedule from packages/utils
- Add state for draft installments
- After Step 1 (basic info), calculate draft installments
- Show DraftInstallmentsReview component in Step 2
- Pass draft installments to final submission

### Step 3: Validation Schema
Add validation for installment totals:
```typescript
const installmentValidation = z.object({
  installments: z.array(z.object({
    installment_number: z.number(),
    amount: z.number().positive(),
    student_due_date: z.date(),
    college_due_date: z.date(),
    status: z.literal('draft')
  }))
}).refine(
  (data) => {
    const sum = data.installments.reduce((acc, i) => acc + i.amount, 0);
    return Math.abs(sum - data.totalAmount) < 0.01; // Account for floating point
  },
  { message: "Installment amounts must equal total payment plan amount" }
)
```

### Step 4: UI/UX Considerations
- Use Shadcn Card for the draft installments section
- Use Shadcn Badge to show validation status (✓ Valid / ✗ Invalid)
- Use Shadcn Alert for validation messages
- Format currency with formatCurrency utility
- Format dates with date-fns format()
- Disable "Next" button until validation passes

---

## Testing Requirements

### Component Tests
Create: `apps/payments/app/plans/new/components/__tests__/DraftInstallmentsReview.test.tsx`

Test cases:
1. Displays draft installments correctly in read-only mode
2. "Edit Amounts" button enables edit mode
3. Amount fields become editable in edit mode
4. Running total updates as user edits amounts
5. Validation error shows when SUM != total
6. "Next" button disabled when validation fails
7. "Reset" button reverts to auto-calculated amounts
8. Final installment auto-adjusts when other amounts change

### Integration Test
Test the full wizard flow:
1. Enter payment plan details (total, installments, frequency)
2. Verify draft installments calculated and displayed
3. Enter edit mode and modify amounts
4. Verify validation works
5. Submit and verify installments saved correctly

---

## Context References

### Story Context File
Full context: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Related Artifacts
- Architecture Pattern: Multi-zone architecture (apps/payments/)
- UI Pattern: Shadcn components for forms and tables
- Validation Pattern: Zod schemas with custom refinements
- State Management: React Hook Form for form state

### Dependencies from Previous Stories
- Story 4.2: Payment plan wizard structure already exists
- Story 4.1: Payment plan schema in database
- Task 1 (this story): calculateInstallmentSchedule utility

---

## Next Steps

After completing Task 2:
1. Update MANIFEST.md:
   - Task 2 status: "Completed"
   - Task 2 completed date
   - Add notes: Files created, components modified
2. Test the wizard flow end-to-end
3. Move to Task 3: Earned Commission Calculation Utility
4. Reference file: `task-3-prompt.md`

---

## Success Criteria

Task 2 is complete when:
- [x] DraftInstallmentsReview component created and functional
- [x] PaymentPlanWizard integrated with draft installment review
- [x] Draft installments auto-calculate using Task 1 utility
- [x] Edit mode allows manual adjustment of amounts
- [x] Real-time validation ensures SUM equals total
- [x] "Next" button disabled when validation fails
- [x] Reset button reverts to auto-calculated values
- [x] Component tests pass
- [x] MANIFEST.md updated with Task 2 completion
