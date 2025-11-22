import { z } from 'zod'
import { PaymentFrequencyEnum } from './payment-plan.schema'

/**
 * Payment Plan Wizard Validation Schemas
 *
 * These schemas provide step-by-step validation for the payment plan creation wizard.
 * They are designed to work with React Hook Form for client-side validation and
 * API endpoints for server-side validation.
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 11: Validation Schema
 *
 * @module payment-plan-wizard.schema
 */

/**
 * Step 1: General Information Schema
 *
 * Validates the initial wizard step containing course and student details.
 * All fields are required for this step.
 *
 * Validations:
 * - student_id: Must be a valid UUID
 * - course_name: Required, 1-200 characters
 * - total_course_value: Must be a positive number
 * - commission_rate: Must be between 0 and 1 (0% to 100%)
 * - course_start_date: Valid date
 * - course_end_date: Valid date, must be after course_start_date
 *
 * @example
 * ```typescript
 * const step1Data: Step1FormData = {
 *   student_id: '123e4567-e89b-12d3-a456-426614174000',
 *   course_name: 'Bachelor of Computer Science',
 *   total_course_value: 50000,
 *   commission_rate: 0.15,
 *   course_start_date: new Date('2025-03-01'),
 *   course_end_date: new Date('2028-12-31'),
 * }
 * ```
 */
/**
 * Step 1: General Information Schema Base
 * Base object schema without refinements for merging
 */
export const step1BaseSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  course_name: z.string().min(1, 'Course name is required').max(200, 'Course name too long'),
  total_course_value: z.number().positive('Total course value must be positive'),
  commission_rate: z
    .number()
    .min(0, 'Commission rate cannot be negative')
    .max(1, 'Commission rate cannot exceed 100%'),
  course_start_date: z.coerce.date(),
  course_end_date: z.coerce.date(),
})

export const step1Schema = step1BaseSchema.refine(
  (data) => data.course_end_date > data.course_start_date,
  {
    message: 'Course end date must be after start date',
    path: ['course_end_date'],
  }
)

/**
 * Step 2: Payment Structure Schema Base
 * Base object schema without refinements for merging
 */
export const step2BaseSchema = z.object({
  initial_payment_amount: z.number().nonnegative('Initial payment cannot be negative').default(0),
  initial_payment_due_date: z.coerce.date().nullable(),
  initial_payment_paid: z.boolean().default(false),
  number_of_installments: z
    .number()
    .int('Number of installments must be an integer')
    .min(1, 'Must have at least 1 installment')
    .max(24, 'Cannot exceed 24 installments'),
  payment_frequency: PaymentFrequencyEnum,
  materials_cost: z.number().nonnegative('Materials cost cannot be negative').default(0),
  admin_fees: z.number().nonnegative('Admin fees cannot be negative').default(0),
  other_fees: z.number().nonnegative('Other fees cannot be negative').default(0),
  first_college_due_date: z.coerce.date(),
  student_lead_time_days: z
    .number()
    .int('Lead time must be an integer')
    .nonnegative('Lead time cannot be negative'),
  gst_inclusive: z.boolean().default(true),
})

export const step2Schema = step2BaseSchema.refine(
  (data) => {
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

/**
 * Individual Installment Schema
 *
 * Validates a single installment record.
 *
 * Validations:
 * - installment_number: Integer >= 0 (0 for initial payment)
 * - amount: Must be positive
 * - student_due_date: Valid date when student must pay
 * - college_due_date: Valid date when college receives payment
 * - is_initial_payment: Boolean flag for initial payment
 * - generates_commission: Boolean flag for commission eligibility
 *
 * @example
 * ```typescript
 * const installment: InstallmentData = {
 *   installment_number: 1,
 *   amount: 6250,
 *   student_due_date: new Date('2025-03-01'),
 *   college_due_date: new Date('2025-03-15'),
 *   is_initial_payment: false,
 *   generates_commission: true,
 * }
 * ```
 */
export const installmentSchema = z.object({
  installment_number: z.number().int().nonnegative(),
  amount: z.number().positive('Installment amount must be positive'),
  student_due_date: z.coerce.date(),
  college_due_date: z.coerce.date(),
  is_initial_payment: z.boolean(),
  generates_commission: z.boolean(),
})

/**
 * Combined Payment Plan Wizard Schema
 *
 * Validates the complete wizard payload by merging step 1 and step 2 schemas
 * and adding installments with comprehensive cross-field validations.
 *
 * Cross-field validations:
 * 1. Course dates: end_date > start_date (from step1Schema)
 * 2. Initial payment: due_date required if amount > 0 (from step2Schema)
 * 3. Total fees: materials + admin + other < total_course_value
 * 4. Amount reconciliation: SUM(installments) === total_course_value (±1 cent tolerance)
 *
 * The 1 cent tolerance accounts for floating-point arithmetic in JavaScript.
 *
 * @example
 * ```typescript
 * const wizardData: PaymentPlanWizardData = {
 *   // Step 1 fields
 *   student_id: '123e4567-e89b-12d3-a456-426614174000',
 *   course_name: 'Bachelor of Computer Science',
 *   total_course_value: 50000,
 *   commission_rate: 0.15,
 *   course_start_date: new Date('2025-03-01'),
 *   course_end_date: new Date('2028-12-31'),
 *   // Step 2 fields
 *   initial_payment_amount: 5000,
 *   initial_payment_due_date: new Date('2025-02-15'),
 *   initial_payment_paid: false,
 *   number_of_installments: 8,
 *   payment_frequency: 'quarterly',
 *   materials_cost: 500,
 *   admin_fees: 250,
 *   other_fees: 100,
 *   first_college_due_date: new Date('2025-03-15'),
 *   student_lead_time_days: 14,
 *   gst_inclusive: true,
 *   // Installments
 *   installments: [
 *     // ... installment records totaling 50000
 *   ],
 * }
 * ```
 */
export const paymentPlanWizardSchema = step1BaseSchema
  .merge(step2BaseSchema)
  .extend({
    installments: z.array(installmentSchema).min(1, 'Must have at least one installment'),
  })
  // Re-apply Step 1 Refinement
  .refine((data) => data.course_end_date > data.course_start_date, {
    message: 'Course end date must be after start date',
    path: ['course_end_date'],
  })
  // Re-apply Step 2 Refinement
  .refine(
    (data) => {
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
  .refine(
    (data) => {
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
    (data) => {
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

/**
 * TypeScript type for Step 1 form data
 * Use this type in React components handling the first wizard step
 */
export type Step1FormData = z.infer<typeof step1Schema>

/**
 * TypeScript type for Step 2 form data
 * Use this type in React components handling the second wizard step
 */
export type Step2FormData = z.infer<typeof step2Schema>

/**
 * TypeScript type for individual installment data
 * Use this type when working with installment records
 */
export type InstallmentData = z.infer<typeof installmentSchema>

/**
 * TypeScript type for complete wizard data
 * Use this type in API handlers and final submission logic
 */
export type PaymentPlanWizardData = z.infer<typeof paymentPlanWizardSchema>

/**
 * TypeScript type for payment frequency
 */
export type PaymentFrequency = z.infer<typeof PaymentFrequencyEnum>
