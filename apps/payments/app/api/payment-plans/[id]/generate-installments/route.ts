/**
 * Installment Generation API
 *
 * This endpoint generates draft installments for preview in the payment plan wizard.
 * It calculates commissionable value, distributes amounts across installments,
 * generates due dates, and returns a preview WITHOUT saving to database.
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 05: Installment Generation Logic
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from '@pleeno/utils'
import {
  calculateCommissionableValue,
  calculateExpectedCommission,
} from '@pleeno/utils/src/commission-calculator'
import {
  generateInstallmentDueDates,
  calculateStudentDueDate,
} from '@pleeno/utils/src/date-helpers'
import { createServerClient } from '@pleeno/database/server'

/**
 * Zod schema for generate installments request body
 */
const GenerateInstallmentsRequestSchema = z.object({
  initial_payment_amount: z.number().min(0, 'Initial payment amount must be non-negative'),
  initial_payment_due_date: z.string().datetime('Invalid date format for initial payment due date'),
  initial_payment_paid: z.boolean(),
  number_of_installments: z
    .number()
    .int('Number of installments must be an integer')
    .positive('Number of installments must be positive'),
  payment_frequency: z.enum(['monthly', 'quarterly', 'custom'], {
    errorMap: () => ({ message: "Payment frequency must be 'monthly', 'quarterly', or 'custom'" }),
  }),
  first_college_due_date: z.string().datetime('Invalid date format for first college due date'),
  student_lead_time_days: z
    .number()
    .int('Student lead time days must be an integer')
    .min(0, 'Student lead time days must be non-negative'),
  materials_cost: z.number().min(0, 'Materials cost must be non-negative'),
  admin_fees: z.number().min(0, 'Admin fees must be non-negative'),
  other_fees: z.number().min(0, 'Other fees must be non-negative'),
  gst_inclusive: z.boolean(),
  total_course_value: z.number().positive('Total course value must be positive'),
  commission_rate: z.number().min(0, 'Commission rate must be non-negative').max(1, 'Commission rate must be at most 1'),
})

type GenerateInstallmentsRequest = z.infer<typeof GenerateInstallmentsRequestSchema>

/**
 * Installment preview object
 */
interface InstallmentPreview {
  installment_number: number
  amount: number
  student_due_date: string // ISO date
  college_due_date: string // ISO date
  is_initial_payment: boolean
  generates_commission: boolean
  status: 'draft' | 'paid'
}

/**
 * Response summary object
 */
interface InstallmentsSummary {
  total_course_value: number
  commissionable_value: number
  expected_commission: number
  initial_payment: number
  total_installments: number
  amount_per_installment: number
}

/**
 * Generate installments response
 */
interface GenerateInstallmentsResponse {
  installments: InstallmentPreview[]
  summary: InstallmentsSummary
}

/**
 * POST /api/payment-plans/[id]/generate-installments
 *
 * Generates draft installments for preview in Step 3 of payment plan wizard.
 * Does NOT save installments to database - returns preview only.
 *
 * Request Body: See GenerateInstallmentsRequestSchema
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "installments": [
 *       {
 *         "installment_number": 0,
 *         "amount": 1000.00,
 *         "student_due_date": "2025-01-15T00:00:00.000Z",
 *         "college_due_date": "2025-01-22T00:00:00.000Z",
 *         "is_initial_payment": true,
 *         "generates_commission": true,
 *         "status": "paid"
 *       },
 *       ...
 *     ],
 *     "summary": {
 *       "total_course_value": 10000.00,
 *       "commissionable_value": 9000.00,
 *       "expected_commission": 1350.00,
 *       "initial_payment": 1000.00,
 *       "total_installments": 11,
 *       "amount_per_installment": 727.27
 *     }
 *   }
 * }
 *
 * Error responses:
 * - 400: Invalid request body
 * - 401: Not authenticated
 * - 403: Not authorized (no agency_id)
 * - 404: Payment plan not found
 * - 500: Server error
 *
 * Security:
 * - Requires authentication
 * - Verifies user has agency_id in app_metadata
 * - Verifies payment plan belongs to user's agency
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paymentPlanId } = await params

  try {
    const supabase = await createServerClient()

    // SECURITY BOUNDARY: Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    // Get user's agency_id
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Verify payment plan exists and belongs to user's agency
    const { data: paymentPlan, error: paymentPlanError } = await supabase
      .from('payment_plans')
      .select('id, agency_id')
      .eq('id', paymentPlanId)
      .eq('agency_id', userAgencyId)
      .single()

    if (paymentPlanError || !paymentPlan) {
      throw new ValidationError('Payment plan not found')
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = GenerateInstallmentsRequestSchema.parse(body)

    // Generate installments
    const result = generateInstallments(validatedData)

    return createSuccessResponse(result)
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return handleApiError(
        new ValidationError(
          'Invalid request body',
          error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        ),
        { path: `/api/payment-plans/${paymentPlanId}/generate-installments` }
      )
    }

    return handleApiError(error, {
      path: `/api/payment-plans/${paymentPlanId}/generate-installments`,
    })
  }
}

/**
 * Core logic to generate installments from request data
 */
function generateInstallments(data: GenerateInstallmentsRequest): GenerateInstallmentsResponse {
  // Calculate commissionable value
  const commissionableValue = calculateCommissionableValue(
    data.total_course_value,
    data.materials_cost,
    data.admin_fees,
    data.other_fees
  )

  // Calculate expected commission
  const expectedCommission = calculateExpectedCommission(
    commissionableValue,
    data.commission_rate,
    data.gst_inclusive
  )

  // Calculate remaining amount after initial payment
  const remainingAfterInitial = commissionableValue - data.initial_payment_amount

  // Validate that remaining amount is non-negative
  if (remainingAfterInitial < 0) {
    throw new ValidationError('Initial payment amount cannot exceed commissionable value')
  }

  // Calculate base amount per installment (with proper rounding)
  const baseAmountPerInstallment =
    Math.floor((remainingAfterInitial * 100) / data.number_of_installments) / 100

  // Calculate total base amount across all installments
  const totalBaseAmount = baseAmountPerInstallment * data.number_of_installments

  // Calculate remainder cents to distribute to final installment
  const remainder = Math.round((remainingAfterInitial - totalBaseAmount) * 100) / 100

  const installments: InstallmentPreview[] = []

  // Generate initial payment installment (installment_number = 0)
  if (data.initial_payment_amount > 0) {
    const initialPaymentDueDate = new Date(data.initial_payment_due_date)
    const initialPaymentCollegeDueDate = new Date(data.initial_payment_due_date)

    // For initial payment, student due date = college due date (no lead time)
    installments.push({
      installment_number: 0,
      amount: Math.round(data.initial_payment_amount * 100) / 100,
      student_due_date: initialPaymentDueDate.toISOString(),
      college_due_date: initialPaymentCollegeDueDate.toISOString(),
      is_initial_payment: true,
      generates_commission: true,
      status: data.initial_payment_paid ? 'paid' : 'draft',
    })
  }

  // Generate regular installments (1..N)
  if (data.payment_frequency === 'custom') {
    // For custom frequency, generate placeholder due dates
    // UI will allow manual date entry in future enhancement
    for (let i = 1; i <= data.number_of_installments; i++) {
      const amount = i === data.number_of_installments
        ? baseAmountPerInstallment + remainder
        : baseAmountPerInstallment

      installments.push({
        installment_number: i,
        amount: Math.round(amount * 100) / 100,
        student_due_date: '', // Placeholder for custom frequency
        college_due_date: '', // Placeholder for custom frequency
        is_initial_payment: false,
        generates_commission: true,
        status: 'draft',
      })
    }
  } else {
    // Generate college due dates based on frequency
    const firstCollegeDueDate = new Date(data.first_college_due_date)
    const collegeDueDates = generateInstallmentDueDates(
      firstCollegeDueDate,
      data.number_of_installments,
      data.payment_frequency
    )

    // Create installment objects with calculated due dates
    collegeDueDates.forEach((collegeDueDate, index) => {
      const installmentNumber = index + 1

      // Calculate student due date using lead time
      const studentDueDate = calculateStudentDueDate(collegeDueDate, data.student_lead_time_days)

      // Add remainder to final installment for exact reconciliation
      const amount =
        installmentNumber === data.number_of_installments
          ? baseAmountPerInstallment + remainder
          : baseAmountPerInstallment

      installments.push({
        installment_number: installmentNumber,
        amount: Math.round(amount * 100) / 100,
        student_due_date: studentDueDate.toISOString(),
        college_due_date: collegeDueDate.toISOString(),
        is_initial_payment: false,
        generates_commission: true,
        status: 'draft',
      })
    })
  }

  // Build summary
  const summary: InstallmentsSummary = {
    total_course_value: Math.round(data.total_course_value * 100) / 100,
    commissionable_value: Math.round(commissionableValue * 100) / 100,
    expected_commission: Math.round(expectedCommission * 100) / 100,
    initial_payment: Math.round(data.initial_payment_amount * 100) / 100,
    total_installments: data.number_of_installments + (data.initial_payment_amount > 0 ? 1 : 0),
    amount_per_installment: Math.round(baseAmountPerInstallment * 100) / 100,
  }

  return {
    installments,
    summary,
  }
}
