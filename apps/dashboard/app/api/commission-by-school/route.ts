/**
 * Commission by School API - Top 5 schools by commission with trends
 *
 * This endpoint provides a breakdown of commission by school (college) with:
 * - Top 5 schools by commission earned in the current month
 * - Percentage share of each school's commission relative to total
 * - Trend indicators (up/down/neutral) comparing current vs previous month
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 3: Create Commission by School API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ForbiddenError,
} from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole, getUserAgencyId } from '@pleeno/auth/server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

// Cache configuration: 5 minutes
export const revalidate = 300

/**
 * Trend direction type
 */
type TrendDirection = 'up' | 'down' | 'neutral'

/**
 * School commission data point
 */
interface SchoolCommission {
  college_id: string
  college_name: string
  commission: number
  percentage_share: number // 0-100
  trend: TrendDirection
}

/**
 * Internal structure for commission calculation
 */
interface SchoolData {
  college_id: string
  college_name: string
  currentCommission: number
  previousCommission: number
}

/**
 * Calculate trend direction by comparing current vs previous values
 */
function calculateTrend(current: number, previous: number): TrendDirection {
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'neutral'
}

/**
 * GET /api/commission-by-school
 *
 * Returns top 5 schools by commission with percentage share and trends.
 * Compares current month performance against previous month.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "college_id": "uuid",
 *       "college_name": "University of Sydney",
 *       "commission": 15000.00,
 *       "percentage_share": 35.5,
 *       "trend": "up"
 *     }
 *   ]
 * }
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS policies automatically filter by agency_id
 * - All queries are scoped to the user's agency
 *
 * Performance:
 * - 5-minute cache via Next.js revalidate
 * - Database aggregations for efficiency
 * - Limit to top 5 schools
 * - Date range queries with proper indexes
 *
 * @param request - Next.js request object
 * @returns School commission data with trends or error response
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
    const userAgencyId = getUserAgencyId(user)

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Get agency timezone for date calculations
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('timezone, currency')
      .eq('id', userAgencyId)
      .single()

    if (agencyError || !agency) {
      console.error('Failed to fetch agency:', agencyError)
      throw new Error('Failed to fetch agency information')
    }

    const timezone = agency.timezone || 'UTC'

    // Calculate date ranges in agency timezone
    const now = new Date()
    const currentMonthStart = toZonedTime(startOfMonth(now), timezone)
    const currentMonthEnd = toZonedTime(endOfMonth(now), timezone)
    const previousMonthStart = toZonedTime(startOfMonth(subMonths(now, 1)), timezone)
    const previousMonthEnd = toZonedTime(endOfMonth(subMonths(now, 1)), timezone)

    // =================================================================
    // QUERY PAID INSTALLMENTS WITH JOINS TO COLLEGE DATA
    // =================================================================

    // Query all paid installments for current + previous month
    // Join with payment_plans -> enrollments -> branches -> colleges
    const { data: installmentsData, error: installmentsError } = await supabase
      .from('installments')
      .select(`
        id,
        amount,
        paid_amount,
        paid_date,
        generates_commission,
        payment_plan_id,
        payment_plans!inner(
          id,
          total_amount,
          expected_commission,
          enrollment_id,
          enrollments!inner(
            id,
            branch_id,
            branches!inner(
              id,
              college_id,
              colleges!inner(
                id,
                name
              )
            )
          )
        )
      `)
      .eq('agency_id', userAgencyId)
      .eq('status', 'paid')
      .not('paid_date', 'is', null)
      .gte('paid_date', format(previousMonthStart, 'yyyy-MM-dd'))
      .lte('paid_date', format(currentMonthEnd, 'yyyy-MM-dd'))

    if (installmentsError) {
      console.error('Failed to fetch installments:', installmentsError)
      throw new Error('Failed to fetch installment data')
    }

    // =================================================================
    // CALCULATE EARNED COMMISSION PER SCHOOL
    // =================================================================

    // Map to track commission by school for current and previous month
    const currentMonthMap = new Map<string, { name: string; commission: number }>()
    const previousMonthMap = new Map<string, { name: string; commission: number }>()

    // Process each installment
    for (const installment of installmentsData || []) {
      // Skip if doesn't generate commission
      if (!installment.generates_commission) {
        continue
      }

      // Extract nested data (handle both array and object responses)
      const paymentPlan = Array.isArray(installment.payment_plans)
        ? installment.payment_plans[0]
        : installment.payment_plans

      if (!paymentPlan) {
        continue
      }

      const enrollment = Array.isArray(paymentPlan.enrollments)
        ? paymentPlan.enrollments[0]
        : paymentPlan.enrollments

      if (!enrollment) {
        continue
      }

      const branch = Array.isArray(enrollment.branches)
        ? enrollment.branches[0]
        : enrollment.branches

      if (!branch) {
        continue
      }

      const college = Array.isArray(branch.colleges)
        ? branch.colleges[0]
        : branch.colleges

      if (!college) {
        continue
      }

      // Calculate the earned commission for this installment
      // Formula: (paid_amount / plan_total_amount) * plan_expected_commission
      const paidAmount = Number(installment.paid_amount || 0)
      const totalAmount = Number(paymentPlan.total_amount || 0)
      const expectedCommission = Number(paymentPlan.expected_commission || 0)

      if (totalAmount <= 0) {
        continue
      }

      const earnedCommission = (paidAmount / totalAmount) * expectedCommission

      // Convert paid_date to agency timezone and determine which month
      const paidDate = new Date(installment.paid_date!)
      const zonedDate = toZonedTime(paidDate, timezone)

      // Determine if this is current or previous month
      const isCurrentMonth =
        zonedDate >= currentMonthStart && zonedDate <= currentMonthEnd
      const isPreviousMonth =
        zonedDate >= previousMonthStart && zonedDate <= previousMonthEnd

      // Add to appropriate month's map
      if (isCurrentMonth) {
        const existing = currentMonthMap.get(college.id) || {
          name: college.name,
          commission: 0,
        }
        existing.commission += earnedCommission
        currentMonthMap.set(college.id, existing)
      }

      if (isPreviousMonth) {
        const existing = previousMonthMap.get(college.id) || {
          name: college.name,
          commission: 0,
        }
        existing.commission += earnedCommission
        previousMonthMap.set(college.id, existing)
      }
    }

    // =================================================================
    // BUILD SCHOOL DATA WITH CURRENT AND PREVIOUS MONTH
    // =================================================================

    const schoolsMap = new Map<string, SchoolData>()

    // Add all schools from current month
    for (const [collegeId, data] of currentMonthMap.entries()) {
      schoolsMap.set(collegeId, {
        college_id: collegeId,
        college_name: data.name,
        currentCommission: data.commission,
        previousCommission: 0,
      })
    }

    // Merge in previous month data
    for (const [collegeId, data] of previousMonthMap.entries()) {
      const existing = schoolsMap.get(collegeId)
      if (existing) {
        existing.previousCommission = data.commission
      } else {
        // School had commission in previous month but not current
        schoolsMap.set(collegeId, {
          college_id: collegeId,
          college_name: data.name,
          currentCommission: 0,
          previousCommission: data.commission,
        })
      }
    }

    // Convert to array and sort by current month commission (descending)
    const schoolsArray = Array.from(schoolsMap.values()).sort(
      (a, b) => b.currentCommission - a.currentCommission
    )

    // Limit to top 5 schools
    const top5Schools = schoolsArray.slice(0, 5)

    // =================================================================
    // CALCULATE PERCENTAGE SHARE AND TRENDS
    // =================================================================

    // Calculate total commission for current month (for percentage calculation)
    const totalCurrentCommission = Array.from(currentMonthMap.values()).reduce(
      (sum, data) => sum + data.commission,
      0
    )

    // Build final response
    const result: SchoolCommission[] = top5Schools.map((school) => {
      // Calculate percentage share (0-100)
      const percentageShare =
        totalCurrentCommission > 0
          ? (school.currentCommission / totalCurrentCommission) * 100
          : 0

      // Calculate trend
      const trend = calculateTrend(
        school.currentCommission,
        school.previousCommission
      )

      return {
        college_id: school.college_id,
        college_name: school.college_name,
        commission: Math.round(school.currentCommission * 100) / 100,
        percentage_share: Math.round(percentageShare * 10) / 10, // Round to 1 decimal
        trend,
      }
    })

    // Return standardized success response
    return createSuccessResponse(result)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/commission-by-school',
    })
  }
}
