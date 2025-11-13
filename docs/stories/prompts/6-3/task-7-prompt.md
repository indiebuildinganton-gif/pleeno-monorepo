# Task 7: Integrate GST Calculation Logic

## Context
You are implementing **Story 6.3: Commission Breakdown by College** for the Pleeno agency management platform. This task creates reusable utility functions for GST and commission calculations.

**Story Goal**: Enable Agency Admins to see commission breakdown by college/branch with tax details to identify valuable institutions and prioritize relationships.

**This Task**: Create utility functions for calculating GST (inclusive and exclusive modes) and earned commission, with comprehensive unit tests.

## Acceptance Criteria Coverage
This task addresses AC #7:
- AC #7: Tax calculations (GST) are displayed separately and as combined totals

## Task Requirements

### Utility Functions
Create three core utility functions in `packages/utils/src/commission-calculator.ts`:

1. **calculateGST**: Calculate GST amount based on commission and GST configuration
2. **calculateTotalWithGST**: Calculate total amount including GST
3. **calculateEarnedCommission**: Calculate earned commission from paid installments

These functions will be used by:
- API route (Task 1) for database queries
- Frontend components (Tasks 2, 5) for calculations and display
- Future features requiring commission/GST calculations

## Function Specifications

### 1. calculateGST
Calculate GST amount based on commission amount and GST configuration.

**Signature**:
```typescript
function calculateGST(
  commissionAmount: number,
  gstRate: number,
  gstInclusive: boolean
): number
```

**Parameters**:
- `commissionAmount`: The commission amount (before or including GST, depending on `gstInclusive`)
- `gstRate`: GST rate as decimal (e.g., 0.1 for 10%)
- `gstInclusive`: Whether commission amount already includes GST

**Logic**:
- **If `gstInclusive = true`** (commission includes GST):
  - GST = commissionAmount / (1 + gstRate) × gstRate
  - Example: $1,100 with 10% GST → GST = 1100 / 1.1 × 0.1 = $100
- **If `gstInclusive = false`** (commission excludes GST):
  - GST = commissionAmount × gstRate
  - Example: $1,000 with 10% GST → GST = 1000 × 0.1 = $100

**Returns**: GST amount as number

**Example**:
```typescript
// GST inclusive mode
const gst1 = calculateGST(1100, 0.1, true)
// gst1 = 100 (GST extracted from $1100)

// GST exclusive mode
const gst2 = calculateGST(1000, 0.1, false)
// gst2 = 100 (GST added to $1000)
```

### 2. calculateTotalWithGST
Calculate total amount including GST.

**Signature**:
```typescript
function calculateTotalWithGST(
  commissionAmount: number,
  gstRate: number,
  gstInclusive: boolean
): number
```

**Parameters**:
- `commissionAmount`: The commission amount
- `gstRate`: GST rate as decimal (e.g., 0.1 for 10%)
- `gstInclusive`: Whether commission amount already includes GST

**Logic**:
- **If `gstInclusive = true`**:
  - Total = commissionAmount (already includes GST)
- **If `gstInclusive = false`**:
  - Total = commissionAmount + (commissionAmount × gstRate)

**Returns**: Total amount including GST as number

**Example**:
```typescript
// GST inclusive mode
const total1 = calculateTotalWithGST(1100, 0.1, true)
// total1 = 1100 (already includes GST)

// GST exclusive mode
const total2 = calculateTotalWithGST(1000, 0.1, false)
// total2 = 1100 (1000 + 100 GST)
```

### 3. calculateEarnedCommission
Calculate earned commission based on paid installments proportionally.

**Signature**:
```typescript
function calculateEarnedCommission(
  totalPaid: number,
  totalAmount: number,
  expectedCommission: number
): number
```

**Parameters**:
- `totalPaid`: Total amount paid so far (SUM of paid installments)
- `totalAmount`: Total payment plan amount
- `expectedCommission`: Expected commission for the full payment plan

**Logic**:
- If `totalAmount = 0`: Return 0 (avoid division by zero)
- Otherwise: `earned = (totalPaid / totalAmount) × expectedCommission`
- This calculates commission proportionally based on payment progress

**Returns**: Earned commission as number

**Example**:
```typescript
// 50% of payment plan paid
const earned = calculateEarnedCommission(5000, 10000, 1500)
// earned = 750 (50% of $1500 expected commission)

// 100% paid
const earned2 = calculateEarnedCommission(10000, 10000, 1500)
// earned2 = 1500 (full commission)

// Nothing paid yet
const earned3 = calculateEarnedCommission(0, 10000, 1500)
// earned3 = 0
```

## Implementation

### File Location
Create: `packages/utils/src/commission-calculator.ts`

### Full Implementation
```typescript
/**
 * Commission and GST calculation utilities
 *
 * These functions handle commission calculations including GST (Goods and Services Tax)
 * in both inclusive and exclusive modes, as well as earned commission calculations
 * based on payment progress.
 */

/**
 * Calculate GST amount based on commission and GST configuration
 *
 * @param commissionAmount - The commission amount (before or including GST)
 * @param gstRate - GST rate as decimal (e.g., 0.1 for 10%)
 * @param gstInclusive - Whether commission amount already includes GST
 * @returns GST amount
 *
 * @example
 * // GST inclusive: Extract GST from total
 * calculateGST(1100, 0.1, true) // Returns 100
 *
 * // GST exclusive: Calculate GST to add
 * calculateGST(1000, 0.1, false) // Returns 100
 */
export function calculateGST(
  commissionAmount: number,
  gstRate: number,
  gstInclusive: boolean
): number {
  if (commissionAmount === 0) return 0

  if (gstInclusive) {
    // GST inclusive: GST = commission / (1 + rate) * rate
    return (commissionAmount / (1 + gstRate)) * gstRate
  } else {
    // GST exclusive: GST = commission * rate
    return commissionAmount * gstRate
  }
}

/**
 * Calculate total amount including GST
 *
 * @param commissionAmount - The commission amount
 * @param gstRate - GST rate as decimal (e.g., 0.1 for 10%)
 * @param gstInclusive - Whether commission amount already includes GST
 * @returns Total amount including GST
 *
 * @example
 * // GST inclusive: Amount already includes GST
 * calculateTotalWithGST(1100, 0.1, true) // Returns 1100
 *
 * // GST exclusive: Add GST to amount
 * calculateTotalWithGST(1000, 0.1, false) // Returns 1100
 */
export function calculateTotalWithGST(
  commissionAmount: number,
  gstRate: number,
  gstInclusive: boolean
): number {
  if (gstInclusive) {
    // Commission already includes GST, no adjustment needed
    return commissionAmount
  } else {
    // Add GST to commission
    return commissionAmount + (commissionAmount * gstRate)
  }
}

/**
 * Calculate earned commission from paid installments
 *
 * Calculates commission earned proportionally based on payment progress.
 * If 50% of the payment plan is paid, 50% of expected commission is earned.
 *
 * @param totalPaid - Total amount paid so far (SUM of paid installments)
 * @param totalAmount - Total payment plan amount
 * @param expectedCommission - Expected commission for the full payment plan
 * @returns Earned commission amount
 *
 * @example
 * // 50% paid
 * calculateEarnedCommission(5000, 10000, 1500) // Returns 750
 *
 * // 100% paid
 * calculateEarnedCommission(10000, 10000, 1500) // Returns 1500
 *
 * // Nothing paid
 * calculateEarnedCommission(0, 10000, 1500) // Returns 0
 */
export function calculateEarnedCommission(
  totalPaid: number,
  totalAmount: number,
  expectedCommission: number
): number {
  if (totalAmount === 0) return 0
  return (totalPaid / totalAmount) * expectedCommission
}

/**
 * Calculate outstanding commission
 *
 * @param expectedCommission - Total expected commission
 * @param earnedCommission - Commission earned so far
 * @returns Outstanding commission amount
 */
export function calculateOutstandingCommission(
  expectedCommission: number,
  earnedCommission: number
): number {
  return Math.max(0, expectedCommission - earnedCommission)
}
```

## Testing Requirements

### Unit Tests Required
Create: `packages/utils/src/commission-calculator.test.ts`

Use Vitest for testing:

```typescript
import { describe, it, expect } from 'vitest'
import {
  calculateGST,
  calculateTotalWithGST,
  calculateEarnedCommission,
  calculateOutstandingCommission,
} from './commission-calculator'

describe('calculateGST', () => {
  describe('GST inclusive mode', () => {
    it('calculates GST correctly for 10% rate', () => {
      const commission = 1100 // $1100 including GST
      const gstRate = 0.1 // 10%
      const gstInclusive = true

      const gst = calculateGST(commission, gstRate, gstInclusive)

      // GST = 1100 / 1.1 * 0.1 = 100
      expect(gst).toBeCloseTo(100, 2)
    })

    it('calculates GST correctly for 15% rate', () => {
      const commission = 1150 // $1150 including GST
      const gstRate = 0.15 // 15%
      const gstInclusive = true

      const gst = calculateGST(commission, gstRate, gstInclusive)

      // GST = 1150 / 1.15 * 0.15 = 150
      expect(gst).toBeCloseTo(150, 2)
    })

    it('handles zero commission', () => {
      expect(calculateGST(0, 0.1, true)).toBe(0)
    })
  })

  describe('GST exclusive mode', () => {
    it('calculates GST correctly for 10% rate', () => {
      const commission = 1000 // $1000 excluding GST
      const gstRate = 0.1 // 10%
      const gstInclusive = false

      const gst = calculateGST(commission, gstRate, gstInclusive)

      // GST = 1000 * 0.1 = 100
      expect(gst).toBe(100)
    })

    it('calculates GST correctly for 15% rate', () => {
      const commission = 1000 // $1000 excluding GST
      const gstRate = 0.15 // 15%
      const gstInclusive = false

      const gst = calculateGST(commission, gstRate, gstInclusive)

      // GST = 1000 * 0.15 = 150
      expect(gst).toBe(150)
    })

    it('handles zero commission', () => {
      expect(calculateGST(0, 0.1, false)).toBe(0)
    })
  })
})

describe('calculateTotalWithGST', () => {
  it('returns same amount for inclusive mode', () => {
    const commission = 1100
    const gstRate = 0.1
    const gstInclusive = true

    const total = calculateTotalWithGST(commission, gstRate, gstInclusive)

    expect(total).toBe(1100) // Already includes GST
  })

  it('adds GST for exclusive mode', () => {
    const commission = 1000
    const gstRate = 0.1
    const gstInclusive = false

    const total = calculateTotalWithGST(commission, gstRate, gstInclusive)

    expect(total).toBe(1100) // 1000 + 100 GST
  })
})

describe('calculateEarnedCommission', () => {
  it('calculates earned commission proportionally', () => {
    const totalPaid = 5000 // $5000 paid
    const totalAmount = 10000 // $10000 total
    const expectedCommission = 1500 // $1500 expected

    const earned = calculateEarnedCommission(totalPaid, totalAmount, expectedCommission)

    expect(earned).toBe(750) // 50% of 1500 = 750
  })

  it('returns full commission when fully paid', () => {
    const totalPaid = 10000
    const totalAmount = 10000
    const expectedCommission = 1500

    const earned = calculateEarnedCommission(totalPaid, totalAmount, expectedCommission)

    expect(earned).toBe(1500) // 100% of 1500 = 1500
  })

  it('returns zero when nothing paid', () => {
    const totalPaid = 0
    const totalAmount = 10000
    const expectedCommission = 1500

    const earned = calculateEarnedCommission(totalPaid, totalAmount, expectedCommission)

    expect(earned).toBe(0) // 0% of 1500 = 0
  })

  it('returns zero when total amount is zero', () => {
    const earned = calculateEarnedCommission(1000, 0, 500)
    expect(earned).toBe(0) // Avoid division by zero
  })

  it('handles partial payment correctly', () => {
    const totalPaid = 2500 // $2500 paid
    const totalAmount = 10000 // $10000 total
    const expectedCommission = 1200 // $1200 expected

    const earned = calculateEarnedCommission(totalPaid, totalAmount, expectedCommission)

    expect(earned).toBe(300) // 25% of 1200 = 300
  })
})

describe('calculateOutstandingCommission', () => {
  it('calculates outstanding commission correctly', () => {
    const expected = 1500
    const earned = 750

    const outstanding = calculateOutstandingCommission(expected, earned)

    expect(outstanding).toBe(750) // 1500 - 750 = 750
  })

  it('returns zero when fully paid', () => {
    const expected = 1500
    const earned = 1500

    const outstanding = calculateOutstandingCommission(expected, earned)

    expect(outstanding).toBe(0)
  })

  it('returns zero when earned exceeds expected', () => {
    const expected = 1000
    const earned = 1200

    const outstanding = calculateOutstandingCommission(expected, earned)

    expect(outstanding).toBe(0) // Should not return negative
  })
})
```

## Integration Points

These utility functions will be used in:

1. **API Route** (Task 1):
   - Database queries use GST calculation logic
   - SQL CASE statements implement calculateGST logic

2. **Frontend Components** (Tasks 2, 5):
   - Display formatted GST amounts
   - Calculate summary metrics
   - May need client-side recalculations

3. **Future Features**:
   - Payment plan creation (calculate expected commission)
   - Invoice generation (calculate GST for invoices)
   - Reports and analytics (commission calculations)

## Documentation

### JSDoc Comments
- Each function has comprehensive JSDoc comments
- Parameters documented with types and descriptions
- Return values documented
- Examples provided for common use cases

### README or Package Documentation
Consider adding a README in `packages/utils/` explaining the commission calculation utilities.

## Dependencies
- `vitest` - For unit testing (should already be in project)

## Success Criteria
- [ ] `commission-calculator.ts` created in `packages/utils/src/`
- [ ] `calculateGST` function implemented
- [ ] `calculateTotalWithGST` function implemented
- [ ] `calculateEarnedCommission` function implemented
- [ ] `calculateOutstandingCommission` helper function implemented
- [ ] All functions have JSDoc comments
- [ ] Unit test file created: `commission-calculator.test.ts`
- [ ] Test coverage for GST inclusive mode
- [ ] Test coverage for GST exclusive mode
- [ ] Test coverage for earned commission calculation
- [ ] Test coverage for edge cases (zero amounts, division by zero)
- [ ] All tests passing
- [ ] Functions exported from package

## Related Files
- Utility: `packages/utils/src/commission-calculator.ts` (create)
- Tests: `packages/utils/src/commission-calculator.test.ts` (create)
- API Route: `apps/dashboard/app/api/commission-by-college/route.ts` (Task 1, uses these functions)
- Story file: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md`

## Next Steps
After completing this task, proceed to **Task 8: Integrate into Dashboard Page** which will add the commission breakdown widget to the main dashboard.
