/**
 * Installments API - Bulk Create Operation
 *
 * This endpoint creates multiple installments for a payment plan.
 * Used by the payment plan wizard after creating a payment plan.
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 8: Multi-Step Payment Plan Wizard - Step 3
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createSuccessResponse,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from '@pleeno/utils'
import { handleApiError } from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'

/**
 * Zod schema for bulk creating installments
 */
const InstallmentCreateSchema = z.object({
  installment_number: z.number().int().min(0),
  is_initial_payment: z.boolean(),
  amount: z.number().positive(),
  generates_commission: z.boolean(),
  student_due_date: z.string().datetime().nullable(),
  college_due_date: z.string().datetime().nullable(),
  status: z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled']),
})

const BulkCreateInstallmentsSchema = z.object({
  installments: z.array(InstallmentCreateSchema).min(1, 'At least one installment is required'),
})

type BulkCreateInstallmentsRequest = z.infer<typeof BulkCreateInstallmentsSchema>

/**
 * POST /api/payment-plans/[id]/installments
 *
 * Creates multiple installments for a payment plan in a single transaction.
 *
 * Request Body:
 * {
 *   "installments": [
 *     {
 *       "installment_number": 0,
 *       "is_initial_payment": true,
 *       "amount": 1000.00,
 *       "generates_commission": true,
 *       "student_due_date": "2025-01-15T00:00:00.000Z",
 *       "college_due_date": "2025-01-15T00:00:00.000Z",
 *       "status": "paid"
 *     },
 *     ...
 *   ]
 * }
 *
 * Response (201 Created):
 * {
 *   "success": true,
 *   "data": {
 *     "created": 5,
 *     "installments": [...]
 *   }
 * }
 *
 * Error responses:
 * - 400: Validation error
 * - 401: Not authenticated
 * - 403: Not authorized
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
    const validatedData = BulkCreateInstallmentsSchema.parse(body)

    // Prepare installments for insertion
    const installmentsToCreate = validatedData.installments.map((inst) => ({
      payment_plan_id: paymentPlanId,
      agency_id: userAgencyId,
      installment_number: inst.installment_number,
      is_initial_payment: inst.is_initial_payment,
      amount: inst.amount,
      generates_commission: inst.generates_commission,
      student_due_date: inst.student_due_date
        ? new Date(inst.student_due_date).toISOString().split('T')[0]
        : null,
      college_due_date: inst.college_due_date
        ? new Date(inst.college_due_date).toISOString().split('T')[0]
        : null,
      status: inst.status,
      paid_date: inst.status === 'paid' ? new Date().toISOString().split('T')[0] : null,
      paid_amount: inst.status === 'paid' ? inst.amount : null,
    }))

    // Insert installments in bulk
    const { data: createdInstallments, error: insertError } = await supabase
      .from('installments')
      .insert(installmentsToCreate)
      .select()

    if (insertError) {
      console.error('Failed to create installments:', insertError)
      throw new Error('Failed to create installments')
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          created: createdInstallments?.length || 0,
          installments: createdInstallments,
        },
      },
      { status: 201 }
    )
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
        { path: `/api/payment-plans/${paymentPlanId}/installments` }
      )
    }

    return handleApiError(error, {
      path: `/api/payment-plans/${paymentPlanId}/installments`,
    })
  }
}
