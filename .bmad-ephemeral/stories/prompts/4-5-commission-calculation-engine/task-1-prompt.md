# Story 4.5: Commission Calculation Engine - Task 1

## Story Context
**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Epic**: 4 - Payment Plan Engine

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

---

## Task 1: Draft Installment Calculation Logic

### Acceptance Criteria
AC 1: Draft Installment Calculation During Payment Plan Creation
- Auto-calculate installment amounts and dates based on total, frequency, and start date
- Present draft for review/approval before saving
- Allow manual adjustment with validation (SUM must equal total)
- Final installment auto-adjusts for rounding differences

### Task Description
Create the core utility function for calculating draft installment schedules. This function will be used by the payment plan wizard to auto-generate installment amounts and due dates based on the payment plan parameters.

### Subtasks Checklist
- [ ] Create calculateInstallmentSchedule utility function in packages/utils/src/commission-calculator.ts
- [ ] Function inputs: { total_amount, number_of_installments, frequency, start_date, student_lead_time_days }
- [ ] Function outputs: Array of draft installments with:
  - installment_number (1-N)
  - amount (calculated, with final installment adjusted for rounding)
  - student_due_date (calculated based on frequency and start_date)
  - college_due_date (student_due_date + student_lead_time_days)
  - status: 'draft'
- [ ] Frequency calculation:
  - Monthly: Add 1 month between installments using date-fns addMonths()
  - Quarterly: Add 3 months between installments
  - Custom: Handled manually by user (not auto-calculated)
- [ ] Rounding handling:
  - Calculate base_amount = Math.floor((total_amount / number_of_installments) * 100) / 100
  - Distribute base_amount to all installments except last
  - Final installment = total_amount - SUM(installments 1 to N-1)
- [ ] Validation: SUM(installments) === total_amount (throw error if not equal)

---

## Context & Constraints

### Key Constraints
- Multi-zone architecture: Commission utilities must be in packages/utils (shared), UI components in respective zones
- Rounding handling: Final installment auto-adjusts to ensure SUM(installments) === total_amount
- Testing requirement: Unit tests for calculation logic with edge cases
- Use date-fns for date calculations (addMonths, addDays)

### Dependencies
```json
{
  "date-fns": "4.1.0",
  "zod": "4.x"
}
```

### Interfaces to Implement
```typescript
interface CalculateInstallmentScheduleParams {
  total_amount: number;
  number_of_installments: number;
  frequency: 'monthly' | 'quarterly' | 'custom';
  start_date: Date;
  student_lead_time_days: number;
}

interface DraftInstallment {
  installment_number: number;
  amount: number;
  student_due_date: Date;
  college_due_date: Date;
  status: 'draft';
}

function calculateInstallmentSchedule(
  params: CalculateInstallmentScheduleParams
): DraftInstallment[]
```

### Architecture Patterns

**Rounding Strategy**:
```typescript
// Distribute evenly, adjust final installment for rounding
const baseAmount = Math.floor((totalAmount / numInstallments) * 100) / 100;
const installments = Array(numInstallments - 1).fill(baseAmount);
const finalAmount = totalAmount - (baseAmount * (numInstallments - 1));
installments.push(finalAmount);

// Validation: Ensure SUM equals total
if (installments.reduce((a, b) => a + b, 0) !== totalAmount) {
  throw new Error('Installment amounts do not total to payment plan amount');
}
```

**Date Calculation**:
```typescript
import { addMonths, addDays } from 'date-fns';

const calculateInstallmentDates = (
  startDate: Date,
  frequency: 'monthly' | 'quarterly',
  count: number,
  leadTimeDays: number
) => {
  const increment = frequency === 'monthly' ? 1 : 3;
  return Array.from({ length: count }, (_, i) => {
    const collegeDueDate = addMonths(startDate, i * increment);
    const studentDueDate = addDays(collegeDueDate, -leadTimeDays);
    return { studentDueDate, collegeDueDate };
  });
};
```

---

## Manifest Creation (CRITICAL)

As part of Task 1, you MUST create a manifest file to track progress across all tasks in this story.

### Create Manifest File
**Location**: `.bmad-ephemeral/stories/prompts/4-5-commission-calculation-engine/MANIFEST.md`

**Content Template**:
```markdown
# Story 4.5 Implementation Manifest

**Story**: Commission Calculation Engine
**Status**: In Progress
**Started**: [Current Date]

## Task Progress

### Task 1: Draft Installment Calculation Logic
- Status: In Progress
- Started: [Current Date]
- Completed:
- Notes:

### Task 2: Payment Plan Wizard Draft Review Step
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Earned Commission Calculation Utility
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Update Payment Recording to Recalculate Commission
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Payment Plan Detail Commission Display
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Commission by College/Branch Report
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Commission by College/Branch Report Page
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 8: Dashboard Commission Summary Widget
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 9: Non-Commissionable Fees Handling
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 10: Database View for Real-Time Commission Calculation (Optional)
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 11: Testing
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 12: Migration and Data Seeding
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through the implementation]

## Files Created/Modified

[Track which files were created or modified during implementation]
```

---

## Implementation Steps

1. Create the new file: `packages/utils/src/commission-calculator.ts`
2. Implement the `calculateInstallmentSchedule` function with proper TypeScript types
3. Handle all three frequency types: monthly, quarterly, custom
4. Implement the rounding strategy to ensure totals match
5. Add validation to throw errors if calculations are incorrect
6. Write unit tests in `packages/utils/src/commission-calculator.test.ts`:
   - Test monthly frequency (12 installments over 12 months)
   - Test quarterly frequency (4 installments over 12 months)
   - Test rounding ensures SUM equals total
   - Test final installment adjustment
   - Test validation errors

---

## Testing Requirements

### Unit Tests to Write
Create: `packages/utils/src/commission-calculator.test.ts`

Test cases:
1. Monthly frequency generates correct dates (12 installments over 12 months)
2. Quarterly frequency generates correct dates (4 installments over 12 months)
3. Rounding: SUM of all installments exactly equals total_amount
4. Final installment correctly adjusts for rounding differences
5. Validation: Throws error if SUM !== total_amount
6. Edge case: Single installment (no splitting needed)
7. Edge case: Large number of installments (e.g., 24 monthly)

---

## Context References

### Story Context File
Full context available at: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Related Documentation
- Architecture: Multi-zone structure (packages/utils for shared utilities)
- PRD: Commission calculation requirements (auto-calculate commissionable value)
- Epic 4: Payment Plan Engine (Stories 4.1-4.5 build payment system)

### Dependencies from Previous Stories
- Story 4.2: Payment plan structure with frequency and installment fields
- Date utilities: Existing date-fns integration for date calculations

---

## Next Steps

After completing Task 1:
1. Update the manifest file (MANIFEST.md) with:
   - Task 1 status: "Completed"
   - Task 1 completed date
   - Add implementation notes (files created, key decisions)
2. Run tests to verify all functionality works correctly
3. Move to Task 2: Payment Plan Wizard Draft Review Step
4. Reference file: `task-2-prompt.md`

---

## Success Criteria

Task 1 is complete when:
- [x] `calculateInstallmentSchedule` function exists in `packages/utils/src/commission-calculator.ts`
- [x] Function correctly calculates installment amounts with proper rounding
- [x] Function correctly calculates due dates for monthly and quarterly frequencies
- [x] Validation ensures SUM of installments equals total_amount
- [x] Unit tests pass with 100% coverage of the function
- [x] MANIFEST.md file is created and Task 1 is marked as complete
