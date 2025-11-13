# Task 2: Database Schema - Payment Plans Extensions

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** AC 4, 6, 7
**Status:** pending

## Context

This task extends the existing `payment_plans` table from Story 4.1 to support flexible installment structures, non-commissionable fees, dual timeline configuration, and GST handling.

## Task Description

Add new columns to the `payment_plans` table to store installment configuration, fee breakdowns, timeline settings, and GST preferences.

## Subtasks

- [ ] Create migration file: `supabase/migrations/003_payments_domain/005_payment_plans_extensions.sql`
- [ ] Add columns to `payment_plans` table:
  - initial_payment_amount (DECIMAL, nullable)
  - initial_payment_due_date (DATE, nullable)
  - initial_payment_paid (BOOLEAN, DEFAULT false)
  - materials_cost (DECIMAL, DEFAULT 0, NOT NULL)
  - admin_fees (DECIMAL, DEFAULT 0, NOT NULL)
  - other_fees (DECIMAL, DEFAULT 0, NOT NULL)
  - first_college_due_date (DATE, nullable)
  - student_lead_time_days (INTEGER, nullable)
  - gst_inclusive (BOOLEAN, DEFAULT true, NOT NULL)
  - number_of_installments (INTEGER, nullable)
  - payment_frequency (TEXT, CHECK IN ('monthly', 'quarterly', 'custom'), nullable)
- [ ] Add CHECK constraints for non-negative fee amounts
- [ ] Add CHECK constraint: student_lead_time_days >= 0 (if provided)
- [ ] Add CHECK constraint: number_of_installments > 0 (if provided)
- [ ] Update existing payment plans with default values (materials_cost = 0, admin_fees = 0, other_fees = 0, gst_inclusive = true)
- [ ] Add comments to columns explaining their purpose

## Technical Requirements

**Migration File:** `supabase/migrations/003_payments_domain/005_payment_plans_extensions.sql`

**Column Purposes:**

**Initial Payment Fields:**
- `initial_payment_amount`: Amount paid upfront (separate from installments)
- `initial_payment_due_date`: When initial payment is due
- `initial_payment_paid`: Whether initial payment has been received

**Non-Commissionable Fees:**
- `materials_cost`: Course materials/books (excluded from commission)
- `admin_fees`: Administrative/enrollment fees (excluded from commission)
- `other_fees`: Miscellaneous fees (excluded from commission)

**Timeline Configuration:**
- `first_college_due_date`: First date agency must pay college
- `student_lead_time_days`: Buffer days before college due date for student payment

**Installment Configuration:**
- `number_of_installments`: How many regular installments (excluding initial payment)
- `payment_frequency`: 'monthly', 'quarterly', or 'custom'

**GST Configuration:**
- `gst_inclusive`: Whether amounts already include GST (affects commission calculation)

## Acceptance Criteria

✅ **AC 4:** Non-Commissionable Fees
- Schema supports materials_cost, admin_fees, other_fees
- All fees default to 0 and are NOT NULL
- Fees excluded from commission calculation (handled in Task 3)

✅ **AC 6:** Due Date Configuration
- Schema stores first_college_due_date and student_lead_time_days
- Enables calculation: student_due_date = college_due_date - lead_time

✅ **AC 7:** GST Handling
- gst_inclusive boolean flag indicates whether amounts include GST
- Affects commission calculation base (handled in Task 3)

## References

**From Story Context:**
- Story 4.2 Context XML: `.bmad-ephemeral/stories/4-2-flexible-installment-structure.context.xml`
- PRD Section: FR-5.1 Payment Plan Creation Wizard (non-commissionable fees)
- PRD Section: FR-5.5 Commission Calculation Engine (GST handling)

**Related Story:**
- Story 4.1 created the base `payment_plans` table

## Testing Checklist

- [ ] Migration runs successfully on existing database
- [ ] Existing payment plans updated with default values
- [ ] All CHECK constraints enforce valid data
- [ ] Can create payment plan with all new fields populated
- [ ] Can create payment plan with only required fields (new fields use defaults)
- [ ] Cannot insert negative fee amounts
- [ ] Cannot insert negative student_lead_time_days
- [ ] payment_frequency only accepts 'monthly', 'quarterly', 'custom'

## Dev Notes

**Backward Compatibility:**
This migration extends Story 4.1's payment_plans table. Existing payment plans (if any) will receive default values:
- materials_cost = 0
- admin_fees = 0
- other_fees = 0
- gst_inclusive = true

**Commission Calculation Impact:**
These new fields feed into the enhanced commission calculation:
1. Commissionable Value = total_amount - materials_cost - admin_fees - other_fees
2. If gst_inclusive = false: base = commissionable_value / 1.10 (remove GST)
3. Expected Commission = base * commission_rate

(Actual calculation functions created in Task 3)

**Dual Timeline Pattern:**
- Agency needs buffer time to collect from student before paying college
- Example: If college_due_date is March 15 and student_lead_time_days is 7
  - Student must pay by March 8
  - Agency pays college on March 15
- This buffer is critical for cash flow management

**Payment Frequency:**
- 'monthly': Installments due every 1 month
- 'quarterly': Installments due every 3 months
- 'custom': Manually configured due dates (not auto-calculated)
