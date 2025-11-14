/**
 * Record Payment API
 *
 * This endpoint allows agency users to manually record when an installment payment
 * is received. It validates the payment details, updates the installment status,
 * recalculates payment plan commission, and logs the activity for audit trail.
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 1: Record Payment API
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@pleeno/utils'
import { RecordPaymentSchema } from '@pleeno/validations'
import { createServerClient } from '@pleeno/database/server'
import { logActivity } from '@pleeno/database/activity-logger'

/**
 * POST /api/installments/[id]/record-payment
 *
 * Records payment for an installment with validation and automatic status updates.
 *
 * Request Body:
 * {
 *   paid_date: string (ISO date format, YYYY-MM-DD, cannot be future),
 *   paid_amount: number (positive, max 2 decimals, <= installment.amount * 1.1),
 *   notes?: string (optional, max 500 chars)
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "installment": {
 *       id, payment_plan_id, installment_number, amount, paid_date,
 *       paid_amount, status, payment_notes
 *     },
 *     "payment_plan": {
 *       id, status, earned_commission
 *     }
 *   }
 * }
 *
 * Error responses:
 * - 400: Invalid request body (validation failed)
 * - 401: Not authenticated
 * - 403: Forbidden (installment belongs to different agency)
 * - 404: Installment not found
 * - 500: Server error
 *
 * Security:
 * - Requires authentication
 * - Verifies user has agency_id in app_metadata
 * - Verifies installment belongs to user's agency via RLS
 *
 * Business Logic:
 * - Validates paid_amount <= installment.amount * 1.1 (allows 10% overpayment)
 * - Calculates status: "paid" if paid_amount >= amount, "partial" if less
 * - Updates payment_plan.status to "completed" if all installments paid
 * - Recalculates payment_plan.earned_commission based on paid installments
 * - Logs activity for audit trail
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: installmentId } = await params

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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = RecordPaymentSchema.parse(body)

    // Fetch installment with payment_plan data for validation and updates
    const { data: installment, error: installmentError } = await supabase
      .from('installments')
      .select('*, payment_plans!inner(id, agency_id, total_amount, expected_commission)')
      .eq('id', installmentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (installmentError || !installment) {
      throw new NotFoundError('Installment not found')
    }

    // Additional validation: paid_amount must not exceed installment.amount * 1.1 (10% overpayment tolerance)
    const maxAllowedAmount = installment.amount * 1.1
    if (validatedData.paid_amount > maxAllowedAmount) {
      throw new ValidationError(
        `Payment amount cannot exceed ${maxAllowedAmount.toFixed(2)} (110% of installment amount)`,
        [
          {
            field: 'paid_amount',
            message: `Payment amount cannot exceed ${maxAllowedAmount.toFixed(2)} (110% of installment amount)`,
          },
        ]
      )
    }

    // Calculate new status based on paid amount
    const newStatus = validatedData.paid_amount >= installment.amount ? 'paid' : 'partial'

    // Store old values for audit logging
    const oldValues = {
      status: installment.status,
      paid_date: installment.paid_date,
      paid_amount: installment.paid_amount,
      payment_notes: installment.payment_notes,
    }

    // Update installment with payment details
    const { data: updatedInstallment, error: updateError } = await supabase
      .from('installments')
      .update({
        paid_date: validatedData.paid_date,
        paid_amount: validatedData.paid_amount,
        status: newStatus,
        payment_notes: validatedData.notes || null,
      })
      .eq('id', installmentId)
      .select()
      .single()

    if (updateError || !updatedInstallment) {
      throw new Error('Failed to update installment')
    }

    // Check if all installments for this payment plan are now paid
    const { data: allInstallments, error: installmentsError } = await supabase
      .from('installments')
      .select('id, status, paid_amount, amount')
      .eq('payment_plan_id', installment.payment_plan_id)

    if (installmentsError) {
      throw new Error('Failed to fetch payment plan installments')
    }

    const allPaid = allInstallments?.every((inst) => inst.status === 'paid') ?? false

    // Calculate earned commission
    // Formula: (SUM(paid_amount WHERE status='paid') / total_amount) * expected_commission
    const totalPaidAmount =
      allInstallments
        ?.filter((inst) => inst.status === 'paid' && inst.paid_amount !== null)
        .reduce((sum, inst) => sum + (inst.paid_amount || 0), 0) || 0

    const paymentPlan = installment.payment_plans
    const earnedCommission =
      paymentPlan.total_amount > 0
        ? (totalPaidAmount / paymentPlan.total_amount) * paymentPlan.expected_commission
        : 0

    // Update payment plan status and earned commission
    const paymentPlanUpdate: {
      earned_commission: number
      status?: 'completed' | 'active'
    } = {
      earned_commission: Math.round(earnedCommission * 100) / 100, // Round to 2 decimal places
    }

    if (allPaid) {
      paymentPlanUpdate.status = 'completed'
    }

    const { data: updatedPaymentPlan, error: planUpdateError } = await supabase
      .from('payment_plans')
      .update(paymentPlanUpdate)
      .eq('id', installment.payment_plan_id)
      .select('id, status, earned_commission')
      .single()

    if (planUpdateError || !updatedPaymentPlan) {
      throw new Error('Failed to update payment plan')
    }

    // Get user name for activity logging
    const { data: userData } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    const userName = userData ? `${userData.first_name} ${userData.last_name}` : 'User'

    // Log activity for audit trail
    await logActivity(supabase, {
      agencyId: userAgencyId,
      userId: user.id,
      entityType: 'installment',
      entityId: installmentId,
      action: 'recorded',
      description: `${userName} recorded payment of $${validatedData.paid_amount.toFixed(2)} for installment #${installment.installment_number}`,
      metadata: {
        installment_id: installmentId,
        installment_number: installment.installment_number,
        payment_plan_id: installment.payment_plan_id,
        paid_date: validatedData.paid_date,
        paid_amount: validatedData.paid_amount,
        new_status: newStatus,
        old_status: oldValues.status,
        old_paid_amount: oldValues.paid_amount,
        old_paid_date: oldValues.paid_date,
        notes: validatedData.notes,
        payment_plan_completed: allPaid,
        earned_commission: updatedPaymentPlan.earned_commission,
      },
    })

    // Return updated installment and payment plan data
    return createSuccessResponse({
      installment: {
        id: updatedInstallment.id,
        payment_plan_id: updatedInstallment.payment_plan_id,
        installment_number: updatedInstallment.installment_number,
        amount: updatedInstallment.amount,
        paid_date: updatedInstallment.paid_date,
        paid_amount: updatedInstallment.paid_amount,
        status: updatedInstallment.status,
        payment_notes: updatedInstallment.payment_notes,
      },
      payment_plan: {
        id: updatedPaymentPlan.id,
        status: updatedPaymentPlan.status,
        earned_commission: updatedPaymentPlan.earned_commission,
      },
    })
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
        { path: `/api/installments/${installmentId}/record-payment` }
      )
    }

    return handleApiError(error, {
      path: `/api/installments/${installmentId}/record-payment`,
    })
  }
}
