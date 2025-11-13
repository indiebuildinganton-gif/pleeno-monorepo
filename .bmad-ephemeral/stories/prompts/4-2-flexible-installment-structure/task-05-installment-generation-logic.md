# Task 5: Installment Generation Logic

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** AC 3, 5, 6, 9
**Status:** pending

## Context

This task implements the API endpoint that generates draft installments for preview in the payment plan wizard. It calculates commissionable value, distributes amounts across installments, generates due dates, and returns a preview without saving to database.

## Task Description

Create an API route that accepts Step 2 wizard data and generates a complete installment structure for preview in Step 3.

## Subtasks

- [ ] Create API route: `apps/payments/app/api/payment-plans/[id]/generate-installments/route.ts`
- [ ] Implement POST handler function
- [ ] Accept request body with fields:
  - initial_payment_amount (number)
  - initial_payment_due_date (Date)
  - initial_payment_paid (boolean)
  - number_of_installments (number)
  - payment_frequency ('monthly' | 'quarterly' | 'custom')
  - first_college_due_date (Date)
  - student_lead_time_days (number)
  - materials_cost (number)
  - admin_fees (number)
  - other_fees (number)
  - gst_inclusive (boolean)
  - total_course_value (number)
  - commission_rate (number)
- [ ] Validate request body with Zod schema
- [ ] Calculate commissionable_value = total_course_value - materials_cost - admin_fees - other_fees
- [ ] Distribute commissionable_value across initial_payment + installments
- [ ] Generate college due dates based on frequency and first_college_due_date
- [ ] Calculate student due dates using student_lead_time_days
- [ ] Create initial payment installment (installment_number = 0) if initial_payment_amount > 0
- [ ] Create regular installments (installment_number = 1..N)
- [ ] Set generates_commission = true for all installments
- [ ] Return JSON response with generated installments (DO NOT save to database)
- [ ] Add error handling for invalid inputs
- [ ] Add authentication check (require valid agency_id)

## Technical Requirements

**API Route:** POST `/api/payment-plans/[id]/generate-installments`

**Request Body Type:**
```typescript
{
  initial_payment_amount: number
  initial_payment_due_date: string // ISO date
  initial_payment_paid: boolean
  number_of_installments: number
  payment_frequency: 'monthly' | 'quarterly' | 'custom'
  first_college_due_date: string // ISO date
  student_lead_time_days: number
  materials_cost: number
  admin_fees: number
  other_fees: number
  gst_inclusive: boolean
  total_course_value: number
  commission_rate: number // 0-1 decimal
}
```

**Response Body Type:**
```typescript
{
  installments: Array<{
    installment_number: number
    amount: number
    student_due_date: string // ISO date
    college_due_date: string // ISO date
    is_initial_payment: boolean
    generates_commission: boolean
    status: 'draft'
  }>
  summary: {
    total_course_value: number
    commissionable_value: number
    expected_commission: number
    initial_payment: number
    total_installments: number
    amount_per_installment: number
  }
}
```

**Calculation Logic:**

1. **Calculate commissionable value:**
   ```typescript
   const commissionableValue = total_course_value - materials_cost - admin_fees - other_fees
   ```

2. **Calculate expected commission:**
   ```typescript
   const base = gst_inclusive ? commissionableValue : commissionableValue / 1.10
   const expectedCommission = base * commission_rate
   ```

3. **Distribute amounts:**
   ```typescript
   const remainingAfterInitial = commissionableValue - initial_payment_amount
   const amountPerInstallment = remainingAfterInitial / number_of_installments
   ```

4. **Generate due dates:**
   - Use `generateInstallmentDueDates()` from Task 4 for college due dates
   - Use `calculateStudentDueDate()` from Task 4 for student due dates

5. **Create installment objects:**
   - Initial payment (if initial_payment_amount > 0):
     - installment_number = 0
     - is_initial_payment = true
     - amount = initial_payment_amount
     - status = 'draft' (or 'paid' if initial_payment_paid = true)
   - Regular installments (1..N):
     - installment_number = 1, 2, 3...N
     - is_initial_payment = false
     - amount = amountPerInstallment
     - status = 'draft'

## Acceptance Criteria

✅ **AC 3:** Installment Configuration
- Generate installments based on number_of_installments
- Calculate amounts based on payment frequency
- Support monthly, quarterly, custom frequencies

✅ **AC 5:** Real-Time Payment Summary
- Return summary with commission calculations
- Show remaining after initial payment
- Show amount per installment

✅ **AC 6:** Due Date Configuration
- Generate college due dates based on first_college_due_date and frequency
- Calculate student due dates = college_due_date - student_lead_time_days

✅ **AC 9:** Installment Schedule Table
- Return installment data in format ready for table display
- Include all fields needed for preview (number, amount, dates, status)

## References

**From Story Context:**
- Task 3: Commission calculation functions (import and use)
- Task 4: Date calculation utilities (import and use)
- Architecture: API route patterns

**Dependencies:**
- `calculateCommissionableValue()` from Task 3
- `calculateExpectedCommission()` from Task 3
- `generateInstallmentDueDates()` from Task 4
- `calculateStudentDueDate()` from Task 4

## Testing Checklist

### Unit Tests

- [ ] Test amount distribution:
  - With initial payment
  - Without initial payment
  - Verify amounts sum to commissionable_value
  - Test rounding (amounts should sum exactly)

- [ ] Test due date generation:
  - Monthly frequency (11 installments)
  - Quarterly frequency (4 installments)
  - Verify student due dates are before college due dates

- [ ] Test validation:
  - Invalid payment_frequency rejected
  - Negative amounts rejected
  - number_of_installments <= 0 rejected

### Integration Tests

- [ ] Test API endpoint:
  - POST with valid data returns 200 + installments
  - POST with initial_payment_paid = true sets status = 'paid' for installment 0
  - POST with initial_payment_amount = 0 skips initial payment installment
  - POST without authentication returns 401
  - POST with invalid data returns 400 + validation errors

- [ ] Test calculation accuracy:
  - Verify commission calculations match expected values
  - Verify amount distribution is accurate
  - Verify due dates are correct

## Dev Notes

**Why Generate Without Saving?**

This endpoint generates installments for PREVIEW only. The actual installments are created in Task 9 when the user confirms and saves the payment plan.

**Benefits:**
- User can review before committing
- User can go back and edit Step 2 without database writes
- No orphaned data if user abandons wizard

**Custom Frequency:**
For 'custom' frequency, this endpoint returns installments with placeholder due dates. The wizard UI would need to allow manual date entry (future enhancement beyond this story).

**Rounding Considerations:**
When distributing amounts, ensure totals reconcile exactly:
```typescript
// Calculate base amount per installment
const baseAmount = Math.floor(remainingAfterInitial * 100 / number_of_installments) / 100

// Calculate remainder cents to distribute
const totalBaseAmount = baseAmount * number_of_installments
const remainder = Math.round((remainingAfterInitial - totalBaseAmount) * 100) / 100

// Add remainder to final installment
installments[installments.length - 1].amount += remainder
```

**Authentication:**
Verify user's agency_id from JWT token. This prevents unauthorized access to payment plan data.

**Error Handling:**
Return appropriate HTTP status codes:
- 200: Success
- 400: Invalid request body
- 401: Unauthorized
- 404: Payment plan not found
- 500: Server error
