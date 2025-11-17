/**
 * Overdue Payments API - Dashboard widget for overdue payment tracking
 *
 * This endpoint provides a list of all overdue installments with full context
 * including student name, college name, amount, days overdue, and payment plan details.
 * Results are sorted by urgency (oldest/most overdue first).
 *
 * Epic 6: Dashboard Enhancements
 * Story 6.5: Overdue Payments Summary Widget
 * Task 1: Create Overdue Payments API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ForbiddenError,
} from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'

// Cache configuration: 5 minutes (shorter than other widgets due to urgency)
export const revalidate = 300

/**
 * Overdue Payment Item
 */
interface OverduePayment {
  id: string
  student_id: string
  student_name: string
  college_id: string
  college_name: string
  amount: number
  days_overdue: number
  due_date: string
  payment_plan_id: string
  installment_number: number
}

/**
 * Overdue Payments Response
 */
interface OverduePaymentsResponse {
  overdue_payments: OverduePayment[]
  total_count: number
  total_amount: number
}

/**
 * GET /api/dashboard/overdue-payments
 *
 * Returns a list of all overdue installments with complete context.
 * Includes student name, college name, amount, days overdue, and payment plan details.
 * Results are sorted by urgency (oldest due date first).
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "overdue_payments": [
 *       {
 *         "id": "uuid",
 *         "student_id": "uuid",
 *         "student_name": "John Doe",
 *         "college_id": "uuid",
 *         "college_name": "ABC College",
 *         "amount": 5000.00,
 *         "days_overdue": 15,
 *         "due_date": "2024-10-01",
 *         "payment_plan_id": "uuid",
 *         "installment_number": 2
 *       }
 *     ],
 *     "total_count": 25,
 *     "total_amount": 125000.00
 *   }
 * }
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS policies automatically filter by agency_id
 * - All queries are scoped to the user's agency
 *
 * Performance:
 * - 5-minute cache via Next.js revalidate
 * - Single query with joins for efficiency
 * - Days overdue calculated in SQL
 * - Composite indexes on agency_id + status + due_date
 *
 * @param request - Next.js request object
 * @returns Overdue payments list with totals or error response
 */
export async function GET(request: NextRequest) {
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

    // Create Supabase client
    const supabase = await createServerClient()

    // =================================================================
    // QUERY: OVERDUE INSTALLMENTS WITH FULL CONTEXT
    // =================================================================
    // Query installments with status = 'overdue'
    // Join with payment_plans, enrollments, students, and colleges
    // Calculate days_overdue in SQL for performance
    // Order by due_date ASC (oldest/most urgent first)

    const { data: overdueData, error: overdueError } = await supabase
      .from('installments')
      .select(`
        id,
        amount,
        student_due_date,
        installment_number,
        payment_plan_id,
        payment_plans!inner (
          id,
          enrollment_id,
          enrollments!inner (
            id,
            student_id,
            college_id,
            students!inner (
              id,
              name
            ),
            colleges!inner (
              id,
              name
            )
          )
        )
      `)
      .eq('agency_id', userAgencyId)
      .eq('status', 'overdue')
      .order('student_due_date', { ascending: true })

    if (overdueError) {
      console.error('Failed to fetch overdue installments:', overdueError)
      throw new Error('Failed to fetch overdue installments')
    }

    // =================================================================
    // TRANSFORM DATA AND CALCULATE DAYS OVERDUE
    // =================================================================

    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0) // Set to start of day for consistent comparison

    const overduePayments: OverduePayment[] = (overdueData || []).map((installment: any) => {
      const dueDate = new Date(installment.student_due_date)
      dueDate.setHours(0, 0, 0, 0)
      
      // Calculate days overdue (positive number)
      const daysOverdue = Math.floor(
        (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      const enrollment = installment.payment_plans.enrollments
      const student = enrollment.students
      const college = enrollment.colleges

      return {
        id: installment.id,
        student_id: enrollment.student_id,
        student_name: student.name,
        college_id: enrollment.college_id,
        college_name: college.name,
        amount: Number(installment.amount),
        days_overdue: daysOverdue,
        due_date: installment.student_due_date,
        payment_plan_id: installment.payment_plan_id,
        installment_number: installment.installment_number,
      }
    })

    // =================================================================
    // CALCULATE TOTALS
    // =================================================================

    const totalCount = overduePayments.length
    const totalAmount = overduePayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    )

    // =================================================================
    // BUILD RESPONSE
    // =================================================================

    const response: OverduePaymentsResponse = {
      overdue_payments: overduePayments,
      total_count: totalCount,
      total_amount: Math.round(totalAmount * 100) / 100,
    }

    // Return standardized success response
    return createSuccessResponse(response)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/dashboard/overdue-payments',
    })
  }
}
