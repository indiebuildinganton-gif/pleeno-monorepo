# Task 9: Payment Plan Creation with Installments

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** AC 10
**Status:** pending

## Context

This task implements the enhanced payment plan creation API endpoint that atomically creates both the payment plan record and all associated installment records in a single database transaction.

## Task Description

Enhance the POST /api/payment-plans endpoint from Story 4.1 to accept the full wizard payload and create the payment plan with all installments in one atomic transaction.

## Subtasks

### API Route Enhancement

- [ ] Update/create file: `apps/payments/app/api/payment-plans/route.ts`
- [ ] Implement POST handler function
- [ ] Accept request body with combined Step 1 + Step 2 + Step 3 data
- [ ] Validate request body with Zod schema (from Task 11)
- [ ] Verify authentication (extract agency_id from JWT)
- [ ] Verify student belongs to agency (security check)
- [ ] Start database transaction
- [ ] Create payment plan record
- [ ] Create initial payment installment (if initial_payment_amount > 0)
- [ ] Create regular installments (1..N)
- [ ] Commit transaction
- [ ] Return created payment plan with installments
- [ ] Handle errors: rollback transaction, return appropriate status code

### Request Body Type

```typescript
interface CreatePaymentPlanRequest {
  // Step 1 data
  student_id: string          // UUID
  course_name: string
  total_course_value: number
  commission_rate: number     // 0-1 decimal
  course_start_date: string   // ISO date
  course_end_date: string     // ISO date

  // Step 2 data
  initial_payment_amount: number
  initial_payment_due_date: string | null  // ISO date
  initial_payment_paid: boolean
  number_of_installments: number
  payment_frequency: 'monthly' | 'quarterly' | 'custom'
  materials_cost: number
  admin_fees: number
  other_fees: number
  first_college_due_date: string  // ISO date
  student_lead_time_days: number
  gst_inclusive: boolean

  // Step 3 data (generated installments)
  installments: Array<{
    installment_number: number
    amount: number
    student_due_date: string  // ISO date
    college_due_date: string  // ISO date
    is_initial_payment: boolean
    generates_commission: boolean
  }>
}
```

### Database Transaction Logic

```typescript
const { data: paymentPlan, error: planError } = await supabase
  .from('payment_plans')
  .insert({
    agency_id: agencyId,
    student_id: body.student_id,
    course_name: body.course_name,
    total_amount: body.total_course_value,
    commission_rate: body.commission_rate,
    course_start_date: body.course_start_date,
    course_end_date: body.course_end_date,
    initial_payment_amount: body.initial_payment_amount,
    initial_payment_due_date: body.initial_payment_due_date,
    initial_payment_paid: body.initial_payment_paid,
    materials_cost: body.materials_cost,
    admin_fees: body.admin_fees,
    other_fees: body.other_fees,
    first_college_due_date: body.first_college_due_date,
    student_lead_time_days: body.student_lead_time_days,
    gst_inclusive: body.gst_inclusive,
    number_of_installments: body.number_of_installments,
    payment_frequency: body.payment_frequency,
    status: 'active',
    // commissionable_value and expected_commission auto-calculated by trigger (Task 3)
  })
  .select()
  .single()

if (planError) throw planError

// Create installments
const installmentRecords = body.installments.map(inst => ({
  payment_plan_id: paymentPlan.id,
  agency_id: agencyId,
  installment_number: inst.installment_number,
  amount: inst.amount,
  student_due_date: inst.student_due_date,
  college_due_date: inst.college_due_date,
  is_initial_payment: inst.is_initial_payment,
  generates_commission: inst.generates_commission,
  status: inst.is_initial_payment && body.initial_payment_paid ? 'paid' : 'draft',
  paid_date: inst.is_initial_payment && body.initial_payment_paid ? new Date().toISOString() : null,
  paid_amount: inst.is_initial_payment && body.initial_payment_paid ? inst.amount : null,
}))

const { data: installments, error: installmentsError } = await supabase
  .from('installments')
  .insert(installmentRecords)
  .select()

if (installmentsError) throw installmentsError

return {
  payment_plan: paymentPlan,
  installments: installments,
}
```

### Subtasks Checklist

- [ ] Validate all required fields present
- [ ] Validate student_id belongs to agency (prevent cross-agency access)
- [ ] Validate installments array not empty
- [ ] Validate SUM(installments.amount) === total_course_value (server-side validation)
- [ ] Create payment plan record with all Step 1 + Step 2 fields
- [ ] If initial_payment_amount > 0:
  - Create installment with installment_number = 0
  - is_initial_payment = true
  - If initial_payment_paid = true: status = 'paid', paid_date = NOW(), paid_amount = amount
  - Else: status = 'draft'
- [ ] Create regular installments (installment_number = 1..N)
  - is_initial_payment = false
  - generates_commission = true
  - status = 'draft'
- [ ] Use database transaction to ensure atomicity
- [ ] On error: rollback transaction, return 400/500 status
- [ ] On success: return 201 status with created payment plan + installments
- [ ] Call audit logging function (Task 12)

## Technical Requirements

**Transaction Pattern:**
Use Supabase RPC function for atomic transaction:
```sql
-- Create RPC function: create_payment_plan_with_installments()
-- Handles transaction logic server-side
-- Returns payment_plan_id on success
```

**Or use JavaScript transaction pattern:**
```typescript
try {
  // Start implicit transaction
  const plan = await createPaymentPlan(data)
  const installments = await createInstallments(plan.id, data.installments)

  // If we reach here, both succeeded
  return { plan, installments }
} catch (error) {
  // Any error rolls back both operations
  throw error
}
```

**Status Logic:**
- Payment plan: status = 'active' (ready for tracking)
- Installments:
  - Initial payment + paid: status = 'paid'
  - All others: status = 'draft'
  - Status transitions handled by background jobs (Epic 5)

**Security Checks:**
1. Verify user is authenticated (JWT token)
2. Extract agency_id from JWT
3. Verify student_id belongs to agency
4. All records created with agency_id for RLS enforcement

## Acceptance Criteria

✅ **AC 10:** Validation and Confirmation
- Create payment plan with all wizard data
- Create initial payment installment (installment_number = 0) if amount > 0
- Create regular installments (1..N)
- If initial_payment_paid = true, mark initial installment as 'paid'
- Otherwise, all installments status = 'draft'
- Transaction ensures atomic creation (all or nothing)
- Handle errors: rollback and return error message

## References

**From Story Context:**
- Story 4.1: Base payment plan creation pattern
- Task 1: installments table schema
- Task 2: payment_plans extensions schema
- Task 3: Commission calculation triggers (auto-calculate commissionable_value, expected_commission)
- Task 11: Validation schema
- Task 12: Audit logging

## Testing Checklist

### Unit Tests

- [ ] Validate request body parsing
- [ ] Validate student ownership check
- [ ] Validate installment sum reconciliation

### Integration Tests

- [ ] Test successful creation:
  - With initial payment paid
  - With initial payment unpaid
  - With only regular installments (no initial payment)
  - Verify payment_plan record created
  - Verify all installments created
  - Verify correct statuses

- [ ] Test validation errors:
  - Missing required fields → 400
  - Student not owned by agency → 403
  - Installments sum mismatch → 400
  - Empty installments array → 400

- [ ] Test transaction rollback:
  - If installments insert fails, payment plan not created
  - Database remains clean (no orphaned records)

- [ ] Test authentication:
  - No JWT token → 401
  - Invalid JWT token → 401
  - Valid token → 201

- [ ] Test commission auto-calculation:
  - Verify commissionable_value calculated by trigger
  - Verify expected_commission calculated by trigger
  - Match expected values from Step 2 preview

### E2E Tests

- [ ] Complete full wizard and create payment plan
- [ ] Verify payment plan appears in database
- [ ] Verify installments appear in database
- [ ] Verify commission calculations correct
- [ ] Query payment plan by ID
- [ ] Query installments by payment_plan_id

## Dev Notes

**Why Transaction Matters:**

Without transaction:
1. Payment plan created ✓
2. Installments fail ✗
3. Result: Orphaned payment plan with no installments (bad!)

With transaction:
1. Payment plan created ✓
2. Installments fail ✗
3. Result: Rollback, nothing created (good!)

**Initial Payment Status Logic:**

```typescript
const initialStatus = body.initial_payment_paid ? 'paid' : 'draft'
const paidDate = body.initial_payment_paid ? new Date().toISOString() : null
const paidAmount = body.initial_payment_paid ? initialPaymentAmount : null
```

**Installment Numbering:**
- Initial payment: installment_number = 0
- Regular installments: 1, 2, 3...N
- Always ORDER BY installment_number when querying

**Commission Auto-Calculation:**
The database trigger (Task 3) automatically calculates:
- `commissionable_value` = total_amount - materials_cost - admin_fees - other_fees
- `expected_commission` = calculated based on commissionable_value, commission_rate, gst_inclusive

So we don't need to calculate these in the API route—just insert the data and let the trigger handle it.

**generates_commission Flag:**
All installments in this story have `generates_commission = true` because all installment amounts are commission-eligible. Non-commissionable fees are tracked separately at the payment plan level.

**Response Format:**
Return the created payment plan with nested installments:
```typescript
{
  id: 'uuid',
  student_id: 'uuid',
  course_name: 'Bachelor of Business',
  total_amount: 10000,
  expected_commission: 1380,
  installments: [
    { installment_number: 0, amount: 2000, status: 'paid', ... },
    { installment_number: 1, amount: 2000, status: 'draft', ... },
    // ...
  ]
}
```

**Error Codes:**
- 201: Created successfully
- 400: Invalid request body or validation error
- 401: Unauthorized (no token)
- 403: Forbidden (student not owned by agency)
- 500: Server error (database error, transaction failed)
