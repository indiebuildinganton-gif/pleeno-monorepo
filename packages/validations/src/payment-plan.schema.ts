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
