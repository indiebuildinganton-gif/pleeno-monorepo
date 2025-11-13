# Task 3: Commission Calculation Functions

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** AC 4, 5, 9
**Status:** pending

## Context

This task implements the commission calculation engine with support for non-commissionable fees and GST handling. It includes both PostgreSQL database functions (for server-side calculations) and TypeScript utilities (for client-side preview in the wizard).

## Task Description

Create commission calculation functions that:
1. Calculate commissionable value (total course value minus non-commissionable fees)
2. Calculate expected commission (commissionable value × commission rate, adjusted for GST)
3. Auto-update these values via database triggers
4. Provide client-side utilities for real-time preview

## Subtasks

### Database Functions

- [ ] Create migration: `supabase/migrations/003_payments_domain/006_commission_functions.sql`
- [ ] Create SQL function: `calculate_commissionable_value(total_value DECIMAL, materials DECIMAL, admin DECIMAL, other DECIMAL) RETURNS DECIMAL`
  - Formula: `total_value - materials - admin - other`
  - Return type: DECIMAL(10, 2)
- [ ] Create SQL function: `calculate_expected_commission(commissionable_value DECIMAL, commission_rate DECIMAL, gst_inclusive BOOLEAN) RETURNS DECIMAL`
  - If gst_inclusive = true: base = commissionable_value
  - If gst_inclusive = false: base = commissionable_value / 1.10
  - Formula: `base * commission_rate`
  - Return type: DECIMAL(10, 2)

### Database Triggers

- [ ] Create migration: `supabase/migrations/003_payments_domain/007_commission_triggers.sql`
- [ ] Create trigger function: `update_payment_plan_commissions()`
- [ ] Trigger fires BEFORE INSERT OR UPDATE on payment_plans
- [ ] Auto-calculates and sets:
  - `commissionable_value` = calculate_commissionable_value(total_amount, materials_cost, admin_fees, other_fees)
  - `expected_commission` = calculate_expected_commission(commissionable_value, commission_rate, gst_inclusive)
- [ ] Return NEW record with updated values

### TypeScript Utilities

- [ ] Create/extend file: `packages/utils/src/commission-calculator.ts`
- [ ] Export function: `calculateCommissionableValue(plan: {total_course_value: number, materials_cost: number, admin_fees: number, other_fees: number}): number`
- [ ] Export function: `calculateExpectedCommission(plan: {commissionable_value: number, commission_rate: number, gst_inclusive: boolean}): number`
- [ ] Add JSDoc comments explaining formulas and parameters
- [ ] Round results to 2 decimal places
- [ ] Add unit tests in `packages/utils/src/__tests__/commission-calculator.test.ts`

## Technical Requirements

**Commission Calculation Formula:**

1. **Commissionable Value:**
   ```
   Commissionable Value = Total Course Value - Materials Cost - Admin Fees - Other Fees
   ```

2. **Expected Commission:**
   ```
   If GST Inclusive:
     base = commissionable_value
   If GST Exclusive:
     base = commissionable_value / 1.10  (removes 10% GST)

   Expected Commission = base × commission_rate
   ```

**Example Calculations:**

*Example 1: GST Inclusive*
- Total Course Value: $10,000
- Materials Cost: $500
- Admin Fees: $200
- Other Fees: $100
- Commission Rate: 15% (0.15)
- GST Inclusive: true

Calculation:
- Commissionable Value = $10,000 - $500 - $200 - $100 = $9,200
- Base = $9,200 (GST inclusive)
- Expected Commission = $9,200 × 0.15 = $1,380

*Example 2: GST Exclusive*
- Total Course Value: $10,000
- Materials Cost: $500
- Admin Fees: $200
- Other Fees: $100
- Commission Rate: 15% (0.15)
- GST Inclusive: false

Calculation:
- Commissionable Value = $10,000 - $500 - $200 - $100 = $9,200
- Base = $9,200 / 1.10 = $8,363.64 (remove GST)
- Expected Commission = $8,363.64 × 0.15 = $1,254.55

## Acceptance Criteria

✅ **AC 4:** Non-Commissionable Fees
- Fees excluded from commission calculation via calculateCommissionableValue()
- Materials, admin, and other fees subtracted from total course value

✅ **AC 5:** Real-Time Payment Summary
- TypeScript utilities enable client-side preview calculations
- Updates as user enters values in wizard Step 2

✅ **AC 9:** Installment Schedule Table
- Commission calculations determine commission-eligible amounts
- All installments marked with generates_commission = true

## References

**From Story Context:**
- PRD Section: FR-5.5 Commission Calculation Engine
- Architecture: Pattern 2: Commission Calculation Engine
- Database triggers pattern from Story 4.1

## Testing Checklist

### Unit Tests (TypeScript)

- [ ] Test calculateCommissionableValue():
  - With all fees = 0 (should equal total_course_value)
  - With materials_cost only
  - With all three fees
  - Edge case: fees sum to total_course_value (result should be 0)

- [ ] Test calculateExpectedCommission():
  - With gst_inclusive = true
  - With gst_inclusive = false (verify GST removal)
  - With commission_rate = 0 (result should be 0)
  - With commission_rate = 1 (result should be 100% of base)
  - Edge case: commissionable_value = 0

### Integration Tests (Database)

- [ ] Test SQL function calculate_commissionable_value():
  - Verify correct subtraction
  - Test with NULL fee values (should treat as 0)

- [ ] Test SQL function calculate_expected_commission():
  - Verify GST handling (inclusive vs exclusive)
  - Test precision (2 decimal places)

- [ ] Test trigger update_payment_plan_commissions:
  - INSERT payment plan → verify commissionable_value and expected_commission auto-calculated
  - UPDATE payment plan (change fees) → verify recalculation
  - UPDATE payment plan (change gst_inclusive) → verify commission changes

## Dev Notes

**Why Two Implementations?**

1. **Database Functions + Triggers:** Server-side, always accurate, enforces consistency
2. **TypeScript Utilities:** Client-side, enables real-time preview without API calls

Both implementations MUST use identical formulas to ensure consistency.

**GST Handling:**
- Australia uses 10% GST
- When gst_inclusive = false, we divide by 1.10 to remove GST before calculating commission
- When gst_inclusive = true, the amount already includes GST, so we calculate on the full amount

**Precision:**
- Use DECIMAL(10, 2) in database for currency values
- Round TypeScript results to 2 decimal places: `Math.round(value * 100) / 100`

**Relationship to Story 4.1:**
Story 4.1 implemented basic commission calculation:
```sql
expected_commission = total_amount * (commission_rate_percent / 100)
```

Story 4.2 enhances this with:
- Non-commissionable fees
- GST handling
- Separate commissionable_value calculation
