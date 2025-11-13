# Story 4.5: Commission Calculation Engine - Task 3

## Story Context
**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Previous Task**: Task 2 - Payment Plan Wizard Draft Review Step (Completed)

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

---

## Task 3: Earned Commission Calculation Utility

### Acceptance Criteria
AC 2: Earned Commission Calculation Based on Payments
- Formula: earned_commission = (SUM(paid_amount WHERE status='paid') / total_amount) * expected_commission
- Commission only counted for installments with status = "paid"
- Partial payments contribute proportionally to earned commission

AC 6: Non-Commissionable Fees Exclusion
- Commission calculations exclude non-commissionable fees (materials_cost, admin_fees, other_fees)
- Commissionable amount = total_amount - (materials_cost + admin_fees + other_fees)
- Installments linked to non-commissionable fees (generates_commission = false) excluded

### Task Description
Create the core utility function for calculating earned commission based on actual payments received. This function excludes non-commissionable fees and only counts installments that generate commission.

### Subtasks Checklist
- [ ] Create calculateEarnedCommission function in packages/utils/src/commission-calculator.ts
- [ ] Function inputs: { installments: Installment[], total_amount, expected_commission, materials_cost, admin_fees, other_fees }
- [ ] Calculate commissionable_amount = total_amount - (materials_cost + admin_fees + other_fees)
- [ ] Filter installments: WHERE generates_commission = true AND status = 'paid'
- [ ] Calculate total_paid = SUM(paid_amount) for filtered installments
- [ ] Calculate earned_commission = (total_paid / commissionable_amount) * expected_commission
- [ ] Return: { earned_commission, total_paid, commissionable_amount, commission_percentage }
- [ ] Handle edge case: If commissionable_amount = 0, earned_commission = 0

---

## Context & Constraints

### Key Constraints
- Commission formula: (total_paid / commissionable_amount) * expected_commission
- Non-commissionable fees: Exclude materials_cost, admin_fees, other_fees from commission calculations
- Only count paid installments: status = 'paid' AND generates_commission = true
- Edge case handling: commissionable_amount = 0 should return earned_commission = 0
- Testing requirement: Unit tests for all edge cases

### Commission Calculation Formula
```typescript
// Exclude non-commissionable fees from commission calculation
const commissionableAmount = totalAmount - (materialsCost + adminFees + otherFees);

// Filter only commission-eligible paid installments
const totalPaid = installments
  .filter(i => i.status === 'paid' && i.generatesCommission === true)
  .reduce((sum, i) => sum + i.paidAmount, 0);

// Calculate earned commission proportionally
const earnedCommission = commissionableAmount > 0
  ? (totalPaid / commissionableAmount) * expectedCommission
  : 0;
```

---

## Manifest Update Instructions

Before starting:
1. Open: `.bmad-ephemeral/stories/prompts/4-5-commission-calculation-engine/MANIFEST.md`
2. Update Task 2:
   - Status: "Completed"
   - Completed: [Date]
   - Notes: [Implementation notes from Task 2]
3. Update Task 3:
   - Status: "In Progress"
   - Started: [Current Date]

---

## Interfaces to Implement

```typescript
interface Installment {
  id: string;
  payment_plan_id: string;
  installment_number: number;
  amount: number;
  paid_amount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  generates_commission: boolean;
  student_due_date: Date;
  college_due_date: Date;
  paid_date?: Date;
  payment_notes?: string;
}

interface CalculateEarnedCommissionParams {
  installments: Installment[];
  total_amount: number;
  expected_commission: number;
  materials_cost: number;
  admin_fees: number;
  other_fees: number;
}

interface EarnedCommissionResult {
  earned_commission: number;
  total_paid: number;
  commissionable_amount: number;
  commission_percentage: number;
}

function calculateEarnedCommission(
  params: CalculateEarnedCommissionParams
): EarnedCommissionResult
```

---

## Implementation Steps

### Step 1: Extend commission-calculator.ts
Add to: `packages/utils/src/commission-calculator.ts`

Implement `calculateEarnedCommission` function with:
1. Calculate commissionable amount (excluding fees)
2. Filter paid installments that generate commission
3. Sum paid amounts
4. Calculate earned commission proportionally
5. Calculate commission percentage
6. Handle edge cases (zero commissionable amount)

### Step 2: Add TypeScript Types
Define all interfaces and types for the function:
- CalculateEarnedCommissionParams
- EarnedCommissionResult
- Ensure Installment type matches database schema

### Step 3: Implement Business Logic
```typescript
export function calculateEarnedCommission({
  installments,
  total_amount,
  expected_commission,
  materials_cost = 0,
  admin_fees = 0,
  other_fees = 0,
}: CalculateEarnedCommissionParams): EarnedCommissionResult {
  // Calculate commissionable amount
  const commissionable_amount = total_amount - (materials_cost + admin_fees + other_fees);

  // Edge case: No commissionable amount
  if (commissionable_amount <= 0) {
    return {
      earned_commission: 0,
      total_paid: 0,
      commissionable_amount: 0,
      commission_percentage: 0,
    };
  }

  // Filter and sum paid installments that generate commission
  const total_paid = installments
    .filter(i => i.status === 'paid' && i.generates_commission === true)
    .reduce((sum, i) => sum + (i.paid_amount || 0), 0);

  // Calculate earned commission proportionally
  const earned_commission = (total_paid / commissionable_amount) * expected_commission;

  // Calculate percentage
  const commission_percentage = expected_commission > 0
    ? (earned_commission / expected_commission) * 100
    : 0;

  return {
    earned_commission,
    total_paid,
    commissionable_amount,
    commission_percentage,
  };
}
```

---

## Testing Requirements

### Unit Tests
Extend: `packages/utils/src/commission-calculator.test.ts`

Test cases:
1. **Basic Calculation**: 50% paid = 50% of expected commission
2. **Non-Commissionable Fees Exclusion**:
   - Total: $10,000, Fees: $2,000, Commission Rate: 10%
   - Commissionable: $8,000, Expected Commission: $800
   - 50% paid = $4,000 paid → Earned Commission: $400
3. **generates_commission Flag**:
   - Installments with generates_commission = false are excluded
4. **Partial Payments**:
   - Installment amount: $1,000, paid_amount: $500
   - Partial payment contributes proportionally
5. **Edge Case - Zero Commissionable Amount**:
   - total_amount = fees (no commissionable amount)
   - earned_commission should be 0
6. **Edge Case - No Paid Installments**:
   - All installments status = 'pending'
   - earned_commission should be 0
7. **Edge Case - Mixed Status**:
   - Some paid, some pending, some cancelled
   - Only count 'paid' status
8. **Overpayment**:
   - total_paid > commissionable_amount
   - earned_commission should not exceed expected_commission

---

## Context References

### Story Context File
Full context: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Related Documentation
- PRD: Commission calculation requirements (FR-5.4)
- Architecture: Commission calculation formula and fee exclusion patterns
- Story 4.4: Payment recording structure (installment status, paid_amount)

### Dependencies from Previous Tasks
- Task 1: calculateInstallmentSchedule (same file location)
- Task 2: Draft installment structure
- Story 4.4: Installment payment recording (status, paid_amount, paid_date)

---

## Next Steps

After completing Task 3:
1. Update MANIFEST.md:
   - Task 3 status: "Completed"
   - Task 3 completed date
   - Add notes: Function implemented with all edge cases
2. Ensure all unit tests pass
3. Move to Task 4: Update Payment Recording to Recalculate Commission
4. Reference file: `task-4-prompt.md`

---

## Success Criteria

Task 3 is complete when:
- [x] calculateEarnedCommission function exists in commission-calculator.ts
- [x] Function correctly calculates earned commission with formula
- [x] Non-commissionable fees are excluded from calculation
- [x] generates_commission flag is respected
- [x] Partial payments contribute proportionally
- [x] Edge cases handled (zero commissionable amount, no paid installments)
- [x] All unit tests pass with 100% coverage
- [x] MANIFEST.md updated with Task 3 completion
