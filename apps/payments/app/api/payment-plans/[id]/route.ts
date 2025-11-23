/**
 * Payment Plan Detail API
 *
 * This endpoint provides detailed payment plan information with nested relationships
 * and progress calculations.
 *
 * Epic 4: Payments Domain
 * Story 4.3: Payment Plan List and Detail Views
 * Task 2: Payment Plan Detail API
 */

import { NextRequest, NextResponse } from 'next/server'
import { NotFoundError, ForbiddenError } from '@pleeno/utils'
import { handleApiError } from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'

/**
 * GET /api/payment-plans/[id]
 *
 * Retrieves a single payment plan with full details including nested relationships
 * and progress metrics.
 *
 * Path parameters:
 * - id: UUID of the payment plan
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "enrollment_id": "uuid",
 *     "agency_id": "uuid",
 *     "total_amount": 10000.50,
 *     "currency": "AUD",
 *     "start_date": "2025-01-15",
 *     "commission_rate_percent": 15,
 *     "expected_commission": 1500.08,
 *     "status": "active",
 *     "notes": "Optional notes",
 *     "reference_number": "REF-123",
 *     "created_at": "2025-01-13T...",
 *     "updated_at": "2025-01-13T...",
 *     "enrollment": {
 *       "id": "uuid",
 *       "student_id": "uuid",
 *       "branch_id": "uuid",
 *       "student": {
 *         "id": "uuid",
 *         "first_name": "John",
 *         "last_name": "Doe"
 *       },
 *       "branch": {
 *         "id": "uuid",
 *         "name": "Main Campus",
 *         "college_id": "uuid",
 *         "college": {
 *           "id": "uuid",
 *           "name": "University of Example"
 *         }
 *       }
 *     },
 *     "installments": [
 *       {
 *         "id": "uuid",
 *         "payment_plan_id": "uuid",
 *         "agency_id": "uuid",
 *         "installment_number": 0,
 *         "amount": 1000.50,
 *         "student_due_date": "2025-01-15",
 *         "college_due_date": "2025-01-10",
 *         "is_initial_payment": true,
 *         "generates_commission": false,
 *         "status": "paid",
 *         "paid_date": "2025-01-14",
 *         "paid_amount": 1000.50,
 *         "created_at": "2025-01-13T...",
 *         "updated_at": "2025-01-14T..."
 *       }
 *     ],
 *     "progress": {
 *       "total_paid": 5000.50,
 *       "installments_paid_count": 5
 *     }
 *   }
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not authorized
 * - 404: Payment plan not found or belongs to different agency
 *
 * Security:
 * - Requires authentication with agency_admin or agency_user role
 * - RLS policies automatically filter by agency_id
 * - Returns 404 if plan belongs to different agency (no information disclosure)
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing payment plan ID
 * @returns Payment plan details with nested relationships or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Await params to get the ID
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      throw new NotFoundError('Payment plan not found')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Fetch payment plan with nested relationships
    // RLS policies will automatically filter by agency_id
    const { data: paymentPlan, error: fetchError } = await supabase
      .from('payment_plans')
      .select(
        `
        id,
        enrollment_id,
        agency_id,
        total_amount,
        currency,
        start_date,
        commission_rate_percent,
        expected_commission,
        status,
        notes,
        reference_number,
        created_at,
        updated_at,
        enrollment:enrollments (
          id,
          student_id,
          branch_id,
          student:students (
            id,
            first_name,
            last_name
          ),
          branch:branches (
            id,
            name,
            college_id,
            college:colleges (
              id,
              name
            )
          )
        )
      `
      )
      .eq('id', id)
      .single()

    if (fetchError || !paymentPlan) {
      // Return 404 whether plan doesn't exist or belongs to different agency
      // This prevents information disclosure about other agencies' data
      throw new NotFoundError('Payment plan not found')
    }

    // Fetch all installments for this payment plan, ordered by student_due_date ASC
    const { data: installments, error: installmentsError } = await supabase
      .from('installments')
      .select(
        `
        id,
        payment_plan_id,
        agency_id,
        installment_number,
        amount,
        student_due_date,
        college_due_date,
        is_initial_payment,
        generates_commission,
        status,
        paid_date,
        paid_amount,
        created_at,
        updated_at
      `
      )
      .eq('payment_plan_id', id)
      .order('student_due_date', { ascending: true })

    if (installmentsError) {
      console.error('Failed to fetch installments:', installmentsError)
      throw new Error('Failed to fetch installments')
    }

    // Calculate progress metrics
    const paidInstallments = (installments || []).filter(
      (inst: any) => inst.status === 'paid'
    )

    const totalPaid = paidInstallments.reduce(
      (sum: number, inst: any) => sum + (inst.paid_amount || 0),
      0
    )

    const installmentsPaidCount = paidInstallments.length

    // Build response with nested data
    const response = {
      ...paymentPlan,
      installments: installments || [],
      progress: {
        total_paid: totalPaid,
        installments_paid_count: installmentsPaidCount,
      },
    }

    // Return standardized success response
    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: `/api/payment-plans/${(await params).id}`,
    })
  }
}
