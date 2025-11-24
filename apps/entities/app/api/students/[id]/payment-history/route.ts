/**
 * Student Payment History API Route
 *
 * Story 7.5: Student Payment History Report
 * Task 6: Add Date Range Filtering
 *
 * This endpoint fetches student payment history with optional date filtering.
 *
 * Features:
 * - Fetch all payment plans with installments for a student
 * - Optional date range filtering (date_from, date_to)
 * - Group installments by payment plan
 * - Calculate summary totals (paid, outstanding, percentage)
 * - RLS enforcement (automatic agency filtering)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'
import { ForbiddenError } from '@pleeno/utils'
import { handleApiError } from '@pleeno/utils/server'

/**
 * GET /api/students/[id]/payment-history
 *
 * Fetches student payment history with optional date range filtering.
 *
 * Route parameters:
 * - id: Student UUID
 *
 * Query parameters:
 * - date_from: ISO date string YYYY-MM-DD (optional)
 * - date_to: ISO date string YYYY-MM-DD (optional)
 *
 * Response:
 * {
 *   data: [
 *     {
 *       payment_plan_id: string,
 *       college_name: string,
 *       branch_name: string,
 *       program_name: string,
 *       plan_total_amount: number,
 *       plan_start_date: string,
 *       installments: [
 *         {
 *           installment_id: string,
 *           installment_number: number,
 *           amount: number,
 *           due_date: string,
 *           paid_at: string | null,
 *           paid_amount: number | null,
 *           status: string
 *         }
 *       ]
 *     }
 *   ],
 *   summary: {
 *     total_paid: number,
 *     total_outstanding: number,
 *     percentage_paid: number
 *   }
 * }
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS automatically filters by agency_id
 * - All queries scoped to user's agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters with student id
 * @returns JSON response with payment history data or error
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

    // Get student ID from route params
    const { id: studentId } = await params

    // Extract query parameters for date filtering
    const { searchParams } = new URL(request.url)
    const date_from = searchParams.get('date_from') || null
    const date_to = searchParams.get('date_to') || null

    // Create Supabase client
    const supabase = await createServerClient()

    // Verify student exists and belongs to user's agency
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('id', studentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch payment history using the database function
    const { data: paymentHistoryData, error: historyError } = await supabase.rpc(
      'get_student_payment_history',
      {
        p_student_id: studentId,
        p_agency_id: userAgencyId,
        p_date_from: date_from,
        p_date_to: date_to,
      }
    )

    if (historyError) {
      console.error('Payment history error:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch payment history', details: historyError.message },
        { status: 500 }
      )
    }

    // Group installments by payment plan
    const paymentPlansMap = new Map<string, any>()

    if (paymentHistoryData && paymentHistoryData.length > 0) {
      paymentHistoryData.forEach((row: any) => {
        const planId = row.payment_plan_id

        if (!paymentPlansMap.has(planId)) {
          paymentPlansMap.set(planId, {
            payment_plan_id: planId,
            college_name: row.college_name,
            branch_name: row.branch_name,
            program_name: row.program_name,
            plan_total_amount: parseFloat(row.plan_total_amount),
            plan_start_date: row.plan_start_date,
            plan_status: row.plan_status,
            installments: [],
          })
        }

        // Add installment if it exists
        if (row.installment_id) {
          paymentPlansMap.get(planId)!.installments.push({
            installment_id: row.installment_id,
            installment_number: row.installment_number,
            amount: parseFloat(row.amount),
            due_date: row.due_date,
            paid_at: row.paid_at,
            paid_amount: row.paid_amount ? parseFloat(row.paid_amount) : null,
            status: row.status,
          })
        }
      })
    }

    const paymentHistory = Array.from(paymentPlansMap.values())

    // Calculate summary
    let total_paid = 0
    let total_outstanding = 0

    paymentHistory.forEach((plan) => {
      plan.installments.forEach((inst: any) => {
        if (inst.paid_amount) {
          total_paid += inst.paid_amount
        }
        if (!inst.paid_at && inst.status !== 'cancelled') {
          total_outstanding += inst.amount
        }
      })
    })

    const total = total_paid + total_outstanding
    const percentage_paid = total > 0 ? (total_paid / total) * 100 : 0

    const summary = {
      total_paid,
      total_outstanding,
      percentage_paid,
    }

    // Return JSON response
    return NextResponse.json({
      data: paymentHistory,
      summary,
    })
  } catch (error) {
    console.error('Payment history API error:', error)
    return handleApiError(error, {
      path: `/api/students/${(await params).id}/payment-history`,
    })
  }
}
