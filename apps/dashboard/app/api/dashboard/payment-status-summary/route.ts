/**
 * Payment Status Summary API - Dashboard payment status overview
 *
 * This endpoint provides payment status summary statistics including
 * counts and totals for pending, due soon, overdue, and paid installments.
 *
 * Epic 5: Payment Status Dashboard Widget
 * Story 5.4: Payment Status Dashboard Widget
 * Task 2: Implement Payment Status Summary API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ForbiddenError,
} from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'
import { startOfMonth } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

// Cache configuration: 5 minutes
export const revalidate = 300

/**
 * Payment Status Category
 */
interface PaymentStatusCategory {
  count: number
  total_amount: number
}

/**
 * Payment Status Summary Response
 */
interface PaymentStatusSummary {
  pending: PaymentStatusCategory
  due_soon: PaymentStatusCategory
  overdue: PaymentStatusCategory
  paid_this_month: PaymentStatusCategory
}

/**
 * GET /api/dashboard/payment-status-summary
 *
 * Returns payment status summary with counts and totals for each category.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "pending": { "count": 25, "total_amount": 50000.00 },
 *     "due_soon": { "count": 5, "total_amount": 12000.00 },
 *     "overdue": { "count": 3, "total_amount": 8500.00 },
 *     "paid_this_month": { "count": 15, "total_amount": 35000.00 }
 *   }
 * }
 *
 * Categories:
 * - Pending: All installments with status = 'pending'
 * - Due Soon: Pending installments due within next 7 days
 * - Overdue: All installments with status = 'overdue'
 * - Paid This Month: Paid installments with paid_date >= start of current month
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS policies automatically filter by agency_id
 * - All queries are scoped to the user's agency
 *
 * Performance:
 * - 5-minute cache via Next.js revalidate
 * - Database aggregations for efficiency
 * - Composite indexes on agency_id + status + due_date
 *
 * @param request - Next.js request object
 * @returns Payment status summary or error response
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

    // Get agency timezone for date calculations
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('timezone')
      .eq('id', userAgencyId)
      .single()

    if (agencyError || !agency) {
      console.error('Failed to fetch agency:', agencyError)
      throw new Error('Failed to fetch agency information')
    }

    const timezone = agency.timezone || 'UTC'

    // Calculate date ranges in agency timezone
    const now = new Date()
    const currentDate = toZonedTime(now, timezone)
    const currentMonthStart = toZonedTime(startOfMonth(now), timezone)

    // Calculate due soon date range (next 7 days)
    const dueSoonEnd = new Date(currentDate)
    dueSoonEnd.setDate(dueSoonEnd.getDate() + 7)

    // =================================================================
    // QUERY 1: PENDING INSTALLMENTS
    // =================================================================
    // All installments with status = 'pending'

    const { data: pendingData, error: pendingError } = await supabase
      .from('installments')
      .select('amount')
      .eq('agency_id', userAgencyId)
      .eq('status', 'pending')

    if (pendingError) {
      console.error('Failed to fetch pending installments:', pendingError)
      throw new Error('Failed to fetch pending installments')
    }

    const pendingCount = pendingData?.length || 0
    const pendingTotal = pendingData?.reduce(
      (sum, inst) => sum + (Number(inst.amount) || 0),
      0
    ) || 0

    // =================================================================
    // QUERY 2: DUE SOON INSTALLMENTS
    // =================================================================
    // Pending installments with student_due_date between today and next 7 days

    const { data: dueSoonData, error: dueSoonError } = await supabase
      .from('installments')
      .select('amount')
      .eq('agency_id', userAgencyId)
      .eq('status', 'pending')
      .gte('student_due_date', currentDate.toISOString().split('T')[0])
      .lte('student_due_date', dueSoonEnd.toISOString().split('T')[0])

    if (dueSoonError) {
      console.error('Failed to fetch due soon installments:', dueSoonError)
      throw new Error('Failed to fetch due soon installments')
    }

    const dueSoonCount = dueSoonData?.length || 0
    const dueSoonTotal = dueSoonData?.reduce(
      (sum, inst) => sum + (Number(inst.amount) || 0),
      0
    ) || 0

    // =================================================================
    // QUERY 3: OVERDUE INSTALLMENTS
    // =================================================================
    // All installments with status = 'overdue'

    const { data: overdueData, error: overdueError } = await supabase
      .from('installments')
      .select('amount')
      .eq('agency_id', userAgencyId)
      .eq('status', 'overdue')

    if (overdueError) {
      console.error('Failed to fetch overdue installments:', overdueError)
      throw new Error('Failed to fetch overdue installments')
    }

    const overdueCount = overdueData?.length || 0
    const overdueTotal = overdueData?.reduce(
      (sum, inst) => sum + (Number(inst.amount) || 0),
      0
    ) || 0

    // =================================================================
    // QUERY 4: PAID THIS MONTH INSTALLMENTS
    // =================================================================
    // Installments with status = 'paid' and paid_date >= start of current month

    const { data: paidData, error: paidError } = await supabase
      .from('installments')
      .select('amount')
      .eq('agency_id', userAgencyId)
      .eq('status', 'paid')
      .gte('paid_date', currentMonthStart.toISOString().split('T')[0])

    if (paidError) {
      console.error('Failed to fetch paid installments:', paidError)
      throw new Error('Failed to fetch paid installments')
    }

    const paidCount = paidData?.length || 0
    const paidTotal = paidData?.reduce(
      (sum, inst) => sum + (Number(inst.amount) || 0),
      0
    ) || 0

    // =================================================================
    // BUILD RESPONSE
    // =================================================================

    const summary: PaymentStatusSummary = {
      pending: {
        count: pendingCount,
        total_amount: Math.round(pendingTotal * 100) / 100,
      },
      due_soon: {
        count: dueSoonCount,
        total_amount: Math.round(dueSoonTotal * 100) / 100,
      },
      overdue: {
        count: overdueCount,
        total_amount: Math.round(overdueTotal * 100) / 100,
      },
      paid_this_month: {
        count: paidCount,
        total_amount: Math.round(paidTotal * 100) / 100,
      },
    }

    // Return standardized success response
    return createSuccessResponse(summary)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/dashboard/payment-status-summary',
    })
  }
}
