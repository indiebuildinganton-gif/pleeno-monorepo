import { z } from 'zod'

/**
 * Payment plan status enum values
 * Matches the database CHECK constraint on payment_plans.status
 */
export const PaymentPlanStatusEnum = z.enum(['active', 'completed', 'cancelled'], {
  errorMap: () => ({
    message: 'Payment plan status must be one of: active, completed, cancelled',
  }),
})

/**
 * Zod schema for creating a new payment plan
 * Used for validating payment plan creation requests
 *
 * Required fields:
 * - enrollment_id: UUID of the enrollment
 * - total_amount: Total payment amount (must be > 0)
 * - start_date: Start date of the payment plan (ISO date format)
 *
 * Optional fields:
 * - notes: Additional notes about the payment plan
 * - reference_number: External reference number
 */
export const PaymentPlanCreateSchema = z.object({
  enrollment_id: z.string().uuid('Enrollment ID must be a valid UUID'),
  total_amount: z
    .number({
      required_error: 'Total amount is required',
      invalid_type_error: 'Total amount must be a number',
    })
    .positive('Total amount must be greater than 0')
    .finite('Total amount must be a finite number'),
  start_date: z
    .string()
    .date('Invalid date format. Use YYYY-MM-DD')
    .refine(
      (dateStr) => {
        // Ensure the date is not in an invalid format
        const date = new Date(dateStr)
        return !isNaN(date.getTime())
      },
      { message: 'Invalid date format. Use YYYY-MM-DD' }
    ),
  notes: z
    .string()
    .max(10000, 'Notes must be less than 10,000 characters')
    .trim()
    .optional()
    .nullable(),
  reference_number: z
    .string()
    .max(255, 'Reference number must be less than 255 characters')
    .trim()
    .optional()
    .nullable(),
})

/**
 * TypeScript type inferred from the PaymentPlanCreateSchema
 * Use this type for type-safe payment plan creation operations
 */
export type PaymentPlanCreate = z.infer<typeof PaymentPlanCreateSchema>

/**
 * Zod schema for updating an existing payment plan
 * All fields are optional - partial updates allowed
 */
export const PaymentPlanUpdateSchema = z.object({
  total_amount: z
    .number()
    .positive('Total amount must be greater than 0')
    .finite('Total amount must be a finite number')
    .optional(),
  start_date: z
    .string()
    .date('Invalid date format. Use YYYY-MM-DD')
    .refine(
      (dateStr) => {
        const date = new Date(dateStr)
        return !isNaN(date.getTime())
      },
      { message: 'Invalid date format. Use YYYY-MM-DD' }
    )
    .optional(),
  status: PaymentPlanStatusEnum.optional(),
  notes: z
    .string()
    .max(10000, 'Notes must be less than 10,000 characters')
    .trim()
    .optional()
    .nullable(),
  reference_number: z
    .string()
    .max(255, 'Reference number must be less than 255 characters')
    .trim()
    .optional()
    .nullable(),
})

/**
 * TypeScript type inferred from the PaymentPlanUpdateSchema
 * Use this type for type-safe payment plan update operations
 */
export type PaymentPlanUpdate = z.infer<typeof PaymentPlanUpdateSchema>

/**
 * Payment plan response type (matches database schema)
 */
export const PaymentPlanSchema = z.object({
  id: z.string().uuid(),
  enrollment_id: z.string().uuid(),
  agency_id: z.string().uuid(),
  total_amount: z.number(),
  currency: z.string(),
  start_date: z.string(),
  commission_rate_percent: z.number(),
  expected_commission: z.number(),
  status: PaymentPlanStatusEnum,
  notes: z.string().nullable(),
  reference_number: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * TypeScript type inferred from the PaymentPlanSchema
 */
export type PaymentPlan = z.infer<typeof PaymentPlanSchema>

/**
 * Payment frequency enum for installments
 * Matches the database CHECK constraint on payment_plans.payment_frequency
 */
export const PaymentFrequencyEnum = z.enum(['monthly', 'quarterly', 'custom'], {
  errorMap: () => ({
    message: 'Payment frequency must be one of: monthly, quarterly, custom',
  }),
})

/**
 * Installment status enum values
 * Matches the database CHECK constraint on installments.status
 */
export const InstallmentStatusEnum = z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled'], {
  errorMap: () => ({
    message: 'Installment status must be one of: draft, pending, paid, overdue, cancelled',
  }),
})

/**
 * Zod schema for individual installment in the wizard payload
 * Used in the payment plan creation with installments request
 */
export const InstallmentCreateSchema = z.object({
  installment_number: z.number().int().min(0, 'Installment number must be >= 0'),
  amount: z.number().positive('Installment amount must be greater than 0'),
  student_due_date: z.string().date('Invalid date format. Use YYYY-MM-DD'),
  college_due_date: z.string().date('Invalid date format. Use YYYY-MM-DD'),
  is_initial_payment: z.boolean(),
  generates_commission: z.boolean(),
})

/**
 * TypeScript type for installment creation
 */
export type InstallmentCreate = z.infer<typeof InstallmentCreateSchema>

/**
 * Zod schema for creating a payment plan with installments
 * This schema combines Step 1 + Step 2 + Step 3 data from the wizard
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 9: Payment Plan Creation with Installments
 */
export const PaymentPlanWithInstallmentsCreateSchema = z.object({
  // Step 1 data
  student_id: z.string().uuid('Student ID must be a valid UUID'),
  course_name: z.string().min(1, 'Course name is required').max(500, 'Course name too long'),
  total_course_value: z
    .number({
      required_error: 'Total course value is required',
      invalid_type_error: 'Total course value must be a number',
    })
    .positive('Total course value must be greater than 0')
    .finite('Total course value must be a finite number'),
  commission_rate: z
    .number({
      required_error: 'Commission rate is required',
      invalid_type_error: 'Commission rate must be a number',
    })
    .min(0, 'Commission rate must be >= 0')
    .max(1, 'Commission rate must be <= 1')
    .refine((val) => val >= 0 && val <= 1, {
      message: 'Commission rate must be a decimal between 0 and 1 (e.g., 0.15 for 15%)',
    }),
  course_start_date: z.string().date('Invalid date format. Use YYYY-MM-DD'),
  course_end_date: z.string().date('Invalid date format. Use YYYY-MM-DD'),

  // Step 2 data
  initial_payment_amount: z.number().min(0, 'Initial payment amount must be >= 0'),
  initial_payment_due_date: z.string().date('Invalid date format. Use YYYY-MM-DD').nullable(),
  initial_payment_paid: z.boolean(),
  number_of_installments: z.number().int().min(1, 'Number of installments must be >= 1'),
  payment_frequency: PaymentFrequencyEnum,
  materials_cost: z.number().min(0, 'Materials cost must be >= 0'),
  admin_fees: z.number().min(0, 'Admin fees must be >= 0'),
  other_fees: z.number().min(0, 'Other fees must be >= 0'),
  first_college_due_date: z.string().date('Invalid date format. Use YYYY-MM-DD'),
  student_lead_time_days: z.number().int().min(0, 'Student lead time must be >= 0'),
  gst_inclusive: z.boolean(),

  // Step 3 data (generated installments)
  installments: z
    .array(InstallmentCreateSchema)
    .min(1, 'At least one installment is required')
    .refine(
      (installments) => {
        // Verify installments are properly numbered
        const numbers = installments.map((inst) => inst.installment_number).sort((a, b) => a - b)

        // Check for consecutive numbering
        for (let i = 0; i < numbers.length; i++) {
          if (numbers[i] !== numbers[0] + i) {
            return false
          }
        }

        // Ensure starting from 0 (initial) or 1
        return numbers[0] === 0 || numbers[0] === 1
      },
      {
        message: 'Installments must be consecutively numbered starting from 0 (initial) or 1',
      }
    ),
})
  .refine(
    (data) => {
      // Verify installment amounts sum equals total course value
      const sumOfInstallments = data.installments.reduce((sum, inst) => sum + inst.amount, 0)
      // Allow for small rounding differences (up to 1 cent)
      const difference = Math.abs(sumOfInstallments - data.total_course_value)
      return difference < 0.01
    },
    {
      message: 'Sum of installment amounts must equal total course value',
      path: ['installments'],
    }
  )
  .refine(
    (data) => {
      // If initial payment amount > 0, there should be an initial installment
      if (data.initial_payment_amount > 0) {
        const hasInitialInstallment = data.installments.some(
          (inst) => inst.installment_number === 0 && inst.is_initial_payment
        )
        return hasInitialInstallment
      }
      return true
    },
    {
      message: 'Initial payment amount requires an initial installment (installment_number = 0)',
      path: ['installments'],
    }
  )
  .refine(
    (data) => {
      // Course end date must be after start date
      const startDate = new Date(data.course_start_date)
      const endDate = new Date(data.course_end_date)
      return endDate > startDate
    },
    {
      message: 'Course end date must be after course start date',
      path: ['course_end_date'],
    }
  )

/**
 * TypeScript type inferred from the PaymentPlanWithInstallmentsCreateSchema
 * Use this type for type-safe payment plan creation with installments
 */
export type PaymentPlanWithInstallmentsCreate = z.infer<typeof PaymentPlanWithInstallmentsCreateSchema>
