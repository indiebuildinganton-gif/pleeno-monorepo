# Task 11: Validation Schema

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** AC 10
**Status:** pending

## Context

This task creates comprehensive Zod validation schemas for all three wizard steps and the final combined payment plan creation request. These schemas ensure data integrity at both the client (form validation) and server (API validation) levels.

## Task Description

Create Zod schemas that validate:
1. Step 1 form data (general information)
2. Step 2 form data (payment structure)
3. Installment data
4. Complete wizard payload (combined with custom refinements)

## Subtasks

- [ ] Create file: `packages/validations/src/payment-plan-wizard.schema.ts`
- [ ] Export step1Schema with all field validations
- [ ] Export step2Schema with all field validations
- [ ] Export installmentSchema for individual installment validation
- [ ] Export paymentPlanWizardSchema (combined schema)
- [ ] Add custom refinement: course_end_date > course_start_date
- [ ] Add custom refinement: initial_payment_due_date required if initial_payment_amount > 0
- [ ] Add custom refinement: total fees < total_course_value
- [ ] Add custom refinement: SUM(installments.amount) === total_course_value (within tolerance)
- [ ] Export TypeScript types inferred from schemas
- [ ] Add JSDoc comments explaining validation rules
- [ ] Create unit tests for all validation scenarios

## Technical Requirements

**Schema Definitions:**

```typescript
import { z } from 'zod'

// Step 1: General Information
export const step1Schema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  course_name: z.string().min(1, 'Course name is required').max(200, 'Course name too long'),
  total_course_value: z.number().positive('Total course value must be positive'),
  commission_rate: z
    .number()
    .min(0, 'Commission rate cannot be negative')
    .max(1, 'Commission rate cannot exceed 100%'),
  course_start_date: z.coerce.date(),
  course_end_date: z.coerce.date(),
}).refine(
  data => data.course_end_date > data.course_start_date,
  {
    message: 'Course end date must be after start date',
    path: ['course_end_date'],
  }
)

// Step 2: Payment Structure
export const step2Schema = z.object({
  initial_payment_amount: z.number().nonnegative('Initial payment cannot be negative').default(0),
  initial_payment_due_date: z.coerce.date().nullable(),
  initial_payment_paid: z.boolean().default(false),
  number_of_installments: z
    .number()
    .int('Number of installments must be an integer')
    .min(1, 'Must have at least 1 installment')
    .max(24, 'Cannot exceed 24 installments'),
  payment_frequency: z.enum(['monthly', 'quarterly', 'custom'], {
    errorMap: () => ({ message: 'Payment frequency must be monthly, quarterly, or custom' }),
  }),
  materials_cost: z.number().nonnegative('Materials cost cannot be negative').default(0),
  admin_fees: z.number().nonnegative('Admin fees cannot be negative').default(0),
  other_fees: z.number().nonnegative('Other fees cannot be negative').default(0),
  first_college_due_date: z.coerce.date(),
  student_lead_time_days: z
    .number()
    .int('Lead time must be an integer')
    .nonnegative('Lead time cannot be negative'),
  gst_inclusive: z.boolean().default(true),
}).refine(
  data => {
    // If initial payment amount > 0, due date is required
    if (data.initial_payment_amount > 0 && !data.initial_payment_due_date) {
      return false
    }
    return true
  },
  {
    message: 'Initial payment due date is required when amount is specified',
    path: ['initial_payment_due_date'],
  }
)

// Individual Installment
export const installmentSchema = z.object({
  installment_number: z.number().int().nonnegative(),
  amount: z.number().positive('Installment amount must be positive'),
  student_due_date: z.coerce.date(),
  college_due_date: z.coerce.date(),
  is_initial_payment: z.boolean(),
  generates_commission: z.boolean(),
})

// Combined Payment Plan Wizard Schema
export const paymentPlanWizardSchema = step1Schema
  .merge(step2Schema)
  .extend({
    installments: z.array(installmentSchema).min(1, 'Must have at least one installment'),
  })
  .refine(
    data => {
      // Validate: total fees < total course value
      const totalFees = data.materials_cost + data.admin_fees + data.other_fees
      return totalFees < data.total_course_value
    },
    {
      message: 'Total fees cannot exceed or equal total course value',
      path: ['materials_cost'],
    }
  )
  .refine(
    data => {
      // Validate: SUM(installments) === total_course_value (within 1 cent tolerance)
      const installmentTotal = data.installments.reduce((sum, inst) => sum + inst.amount, 0)
      const difference = Math.abs(installmentTotal - data.total_course_value)
      const TOLERANCE = 0.01
      return difference < TOLERANCE
    },
    {
      message: 'Installment amounts must sum to total course value',
      path: ['installments'],
    }
  )

// Inferred TypeScript Types
export type Step1FormData = z.infer<typeof step1Schema>
export type Step2FormData = z.infer<typeof step2Schema>
export type InstallmentData = z.infer<typeof installmentSchema>
export type PaymentPlanWizardData = z.infer<typeof paymentPlanWizardSchema>
```

## Validation Rules Summary

### Step 1 Validations

| Field | Rules |
|-------|-------|
| student_id | Required, must be valid UUID |
| course_name | Required, 1-200 characters |
| total_course_value | Required, must be positive number |
| commission_rate | Required, 0-1 (0% to 100%) |
| course_start_date | Required, valid date |
| course_end_date | Required, valid date, must be after start date |

### Step 2 Validations

| Field | Rules |
|-------|-------|
| initial_payment_amount | Optional, >= 0 |
| initial_payment_due_date | Required if initial_payment_amount > 0 |
| initial_payment_paid | Boolean, default false |
| number_of_installments | Required, 1-24 |
| payment_frequency | Required, enum: monthly/quarterly/custom |
| materials_cost | Optional, >= 0, default 0 |
| admin_fees | Optional, >= 0, default 0 |
| other_fees | Optional, >= 0, default 0 |
| first_college_due_date | Required, valid date |
| student_lead_time_days | Required, >= 0 |
| gst_inclusive | Boolean, default true |

### Installment Validations

| Field | Rules |
|-------|-------|
| installment_number | Required, integer, >= 0 |
| amount | Required, positive number |
| student_due_date | Required, valid date |
| college_due_date | Required, valid date |
| is_initial_payment | Required, boolean |
| generates_commission | Required, boolean |

### Cross-Field Validations

1. **Course Dates:** end_date > start_date
2. **Initial Payment:** If amount > 0, due_date is required
3. **Total Fees:** materials + admin + other < total_course_value
4. **Amount Reconciliation:** SUM(installments) === total_course_value (±1 cent)

## Acceptance Criteria

✅ **AC 10:** Validation and Confirmation
- Validate all wizard data before payment plan creation
- Ensure installment amounts sum to total course value
- Provide clear validation error messages
- Prevent invalid data from reaching API

## References

**From Story Context:**
- Task 6: Step 1 form uses step1Schema
- Task 7: Step 2 form uses step2Schema
- Task 9: API route uses paymentPlanWizardSchema
- Zod documentation: https://zod.dev

## Testing Checklist

### Unit Tests - Step 1 Schema

- [ ] Valid data passes validation
- [ ] Missing required fields fail
- [ ] Invalid UUID for student_id fails
- [ ] Empty course_name fails
- [ ] Negative total_course_value fails
- [ ] commission_rate < 0 fails
- [ ] commission_rate > 1 fails
- [ ] course_end_date before course_start_date fails
- [ ] course_end_date === course_start_date fails

### Unit Tests - Step 2 Schema

- [ ] Valid data passes validation
- [ ] initial_payment_amount > 0 without due_date fails
- [ ] Negative fee amounts fail
- [ ] number_of_installments < 1 fails
- [ ] number_of_installments > 24 fails
- [ ] Invalid payment_frequency fails
- [ ] Negative student_lead_time_days fails

### Unit Tests - Combined Schema

- [ ] Valid complete payload passes
- [ ] Total fees >= total_course_value fails
- [ ] Installments sum mismatch fails (difference > 1 cent)
- [ ] Installments sum match passes (difference < 1 cent)
- [ ] Empty installments array fails

### Integration Tests

- [ ] React Hook Form uses schemas correctly
- [ ] API route validates with schema before processing
- [ ] Validation errors displayed to user in forms

## Dev Notes

**Why Zod?**
- TypeScript-first schema validation
- Automatic type inference
- Composable schemas (merge, extend)
- Rich error messages
- Works on both client and server

**Tolerance for Amount Reconciliation:**
Allow 1 cent difference due to floating-point arithmetic:
```typescript
const TOLERANCE = 0.01
const isValid = Math.abs(sum - total) < TOLERANCE
```

Example:
- Total: $10,000.00
- Installments: $2,500.00 × 4 = $10,000.00 ✓
- Installments: $2,500.01 × 4 = $10,000.04 ✗ (difference = 0.04 > 0.01)

**Schema Reuse:**
These schemas are used in multiple places:
1. Client-side form validation (React Hook Form)
2. Server-side API validation (POST /api/payment-plans)
3. Type generation for TypeScript

**Error Messages:**
Provide user-friendly error messages:
- ❌ "Required"
- ✓ "Course name is required"

- ❌ "Invalid value"
- ✓ "Commission rate cannot exceed 100%"

**Coerce Dates:**
Use `z.coerce.date()` to handle both string and Date inputs:
```typescript
course_start_date: z.coerce.date()
// Accepts: "2025-03-15" (string) or Date object
```

**Custom Error Maps:**
Use custom error maps for enums:
```typescript
payment_frequency: z.enum(['monthly', 'quarterly', 'custom'], {
  errorMap: () => ({ message: 'Must be monthly, quarterly, or custom' })
})
```

**Validation in Forms:**
React Hook Form integration:
```typescript
const form = useForm<Step1FormData>({
  resolver: zodResolver(step1Schema),
  defaultValues: { /* ... */ }
})
```

**Server-Side Validation:**
API route validation:
```typescript
const parseResult = paymentPlanWizardSchema.safeParse(requestBody)

if (!parseResult.success) {
  return Response.json(
    { error: 'Validation error', details: parseResult.error.format() },
    { status: 400 }
  )
}

const validData = parseResult.data
// Proceed with validated data
```

**Type Safety:**
Inferred types ensure type safety throughout the app:
```typescript
type Step1FormData = z.infer<typeof step1Schema>
// Use in components, API handlers, etc.
```
