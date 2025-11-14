import { z } from 'zod'

/**
 * Installment status enum values
 * Matches the database CHECK constraint on installments.status
 */
export const InstallmentStatusEnum = z.enum(['draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled'], {
  errorMap: () => ({
    message: 'Installment status must be one of: draft, pending, partial, paid, overdue, cancelled',
  }),
})

/**
 * Zod schema for recording an installment payment
 * Used for validating payment recording requests
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 1: Record Payment API
 *
 * Validation rules:
 * - paid_date: Must be in YYYY-MM-DD format, cannot be in the future
 * - paid_amount: Must be positive, non-zero, max 2 decimal places
 * - notes: Optional, max 500 characters
 */
export const RecordPaymentSchema = z
  .object({
    paid_date: z
      .string({
        required_error: 'Payment date is required',
        invalid_type_error: 'Payment date must be a string',
      })
      .date('Invalid date format. Use YYYY-MM-DD')
      .refine(
        (dateStr) => {
          // Ensure the date is not in an invalid format
          const date = new Date(dateStr)
          return !isNaN(date.getTime())
        },
        { message: 'Invalid date format. Use YYYY-MM-DD' }
      )
      .refine(
        (dateStr) => {
          // Ensure the date is not in the future
          const date = new Date(dateStr)
          const today = new Date()
          today.setHours(0, 0, 0, 0) // Reset time to start of day for fair comparison
          return date <= today
        },
        { message: 'Payment date cannot be in the future' }
      ),
    paid_amount: z
      .number({
        required_error: 'Payment amount is required',
        invalid_type_error: 'Payment amount must be a number',
      })
      .positive('Payment amount must be greater than 0')
      .finite('Payment amount must be a finite number')
      .refine(
        (amount) => {
          // Check for max 2 decimal places
          // Multiply by 100 and check if result is an integer
          return Number.isInteger(amount * 100)
        },
        { message: 'Payment amount must have at most 2 decimal places' }
      ),
    notes: z
      .string()
      .max(500, 'Notes must be less than 500 characters')
      .trim()
      .optional()
      .nullable(),
  })
  .strict() // Don't allow extra fields

/**
 * TypeScript type inferred from the RecordPaymentSchema
 * Use this type for type-safe payment recording operations
 */
export type RecordPayment = z.infer<typeof RecordPaymentSchema>

/**
 * Installment response type (matches database schema with new fields)
 */
export const InstallmentSchema = z.object({
  id: z.string().uuid(),
  payment_plan_id: z.string().uuid(),
  agency_id: z.string().uuid(),
  installment_number: z.number().int(),
  is_initial_payment: z.boolean(),
  amount: z.number(),
  generates_commission: z.boolean(),
  student_due_date: z.string().nullable(),
  college_due_date: z.string().nullable(),
  status: InstallmentStatusEnum,
  paid_date: z.string().nullable(),
  paid_amount: z.number().nullable(),
  payment_notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * TypeScript type inferred from the InstallmentSchema
 */
export type Installment = z.infer<typeof InstallmentSchema>
