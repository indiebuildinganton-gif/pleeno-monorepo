/**
 * Commission by Country API - Top 5 countries by commission with trends
 *
 * This endpoint provides a breakdown of commission by country of origin with:
 * - Top 5 countries by commission earned in the current month
 * - Percentage share of each country's commission relative to total
 * - Trend indicators (up/down/neutral) comparing current vs previous month
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 4: Create Commission by Country API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ForbiddenError,
} from '@pleeno/utils/server'
import { createServerClientFromRequest } from '@pleeno/database/server'
import { requireRole, getUserAgencyId } from '@pleeno/auth/server'
import {
  startOfMonth, endOfMonth, subMonths,
  startOfYear, endOfYear, subYears,
  startOfQuarter, endOfQuarter, subQuarters,
  format
} from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

// Disable caching for authenticated routes (user-specific data)
export const revalidate = 0
export const dynamic = 'force-dynamic'

/**
 * Trend direction type
 */
type TrendDirection = 'up' | 'down' | 'neutral'

/**
 * Country commission data point
 */
interface CountryCommission {
  country: string
  commission: number
  percentage_share: number // 0-100
  trend: TrendDirection
}

/**
 * Internal structure for commission calculation
 */
interface CountryData {
  country: string
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
 * GET /api/commission-by-country
 *
 * Query Parameters:
 * - period (optional): 'all' | 'year' | 'quarter' | 'month' (default: 'all')
 *
 * Returns top 5 countries by commission with percentage share and trends.
 * Compares current period performance against previous period.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "country": "Australia",
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
 * - Limit to top 5 countries
 * - Date range queries with proper indexes
 *
 * @param request - Next.js request object
 * @returns Country commission data with trends or error response
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'all') as 'all' | 'year' | 'quarter' | 'month'

    // Create Supabase client from request (required for cross-subdomain cookies in Vercel)
    const supabase = createServerClientFromRequest(request)

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

    // Calculate date ranges based on period
    const now = new Date()
    let currentStart: Date, currentEnd: Date
    let previousStart: Date, previousEnd: Date

    switch (period) {
      case 'all':
        // For 'all', use last 30 days vs previous 30 days for trends
        currentEnd = toZonedTime(now, timezone)
        currentStart = toZonedTime(subMonths(now, 1), timezone)
        previousEnd = currentStart
        previousStart = toZonedTime(subMonths(now, 2), timezone)
        break

      case 'year':
        currentStart = toZonedTime(startOfYear(now), timezone)
        currentEnd = toZonedTime(endOfYear(now), timezone)
        previousStart = toZonedTime(startOfYear(subYears(now, 1)), timezone)
        previousEnd = toZonedTime(endOfYear(subYears(now, 1)), timezone)
        break

      case 'quarter':
        currentStart = toZonedTime(startOfQuarter(now), timezone)
        currentEnd = toZonedTime(endOfQuarter(now), timezone)
        previousStart = toZonedTime(startOfQuarter(subQuarters(now, 1)), timezone)
        previousEnd = toZonedTime(endOfQuarter(subQuarters(now, 1)), timezone)
        break

      case 'month':
        currentStart = toZonedTime(startOfMonth(now), timezone)
        currentEnd = toZonedTime(endOfMonth(now), timezone)
        previousStart = toZonedTime(startOfMonth(subMonths(now, 1)), timezone)
        previousEnd = toZonedTime(endOfMonth(subMonths(now, 1)), timezone)
        break
    }

    // =================================================================
    // QUERY PAID INSTALLMENTS WITH JOINS TO STUDENT DATA
    // =================================================================

    // Query all paid installments for current + previous period
    // Join with payment_plans -> enrollments -> students
    let installmentsQuery = supabase
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
            student_id,
            students!inner(
              id,
              nationality
            )
          )
        )
      `)
      .eq('agency_id', userAgencyId)
      .eq('status', 'paid')
      .not('paid_date', 'is', null)

    // Apply date filter based on period
    if (period !== 'all') {
      installmentsQuery = installmentsQuery
        .gte('paid_date', format(previousStart, 'yyyy-MM-dd'))
        .lte('paid_date', format(currentEnd, 'yyyy-MM-dd'))
    }

    const { data: installmentsData, error: installmentsError } = await installmentsQuery

    if (installmentsError) {
      console.error('Failed to fetch installments:', installmentsError)
      throw new Error('Failed to fetch installment data')
    }

    // =================================================================
    // CALCULATE EARNED COMMISSION PER COUNTRY
    // =================================================================

    // Map to track commission by country for current and previous month
    const currentMonthMap = new Map<string, number>()
    const previousMonthMap = new Map<string, number>()

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

      const student = Array.isArray(enrollment.students)
        ? enrollment.students[0]
        : enrollment.students

      if (!student) {
        continue
      }

      // Get nationality, default to "Unknown" if null
      const country = student.nationality || 'Unknown'

      // Calculate the earned commission for this installment
      // Formula: (paid_amount / plan_total_amount) * plan_expected_commission
      const paidAmount = Number(installment.paid_amount || 0)
      const totalAmount = Number(paymentPlan.total_amount || 0)
      const expectedCommission = Number(paymentPlan.expected_commission || 0)

      if (totalAmount <= 0) {
        continue
      }

      const earnedCommission = (paidAmount / totalAmount) * expectedCommission

      // Convert paid_date to agency timezone and determine which period
      const paidDate = new Date(installment.paid_date!)
      const zonedDate = toZonedTime(paidDate, timezone)

      // For 'all' period, include all records in current
      // For other periods, filter by date range
      const isCurrentPeriod = period === 'all' || (zonedDate >= currentStart && zonedDate <= currentEnd)
      const isPreviousPeriod = zonedDate >= previousStart && zonedDate <= previousEnd

      // Add to appropriate period's map
      if (isCurrentPeriod) {
        const existing = currentMonthMap.get(country) || 0
        currentMonthMap.set(country, existing + earnedCommission)
      }

      if (isPreviousPeriod) {
        const existing = previousMonthMap.get(country) || 0
        previousMonthMap.set(country, existing + earnedCommission)
      }
    }

    // =================================================================
    // BUILD COUNTRY DATA WITH CURRENT AND PREVIOUS MONTH
    // =================================================================

    const countriesMap = new Map<string, CountryData>()

    // Add all countries from current month
    for (const [country, commission] of currentMonthMap.entries()) {
      countriesMap.set(country, {
        country,
        currentCommission: commission,
        previousCommission: 0,
      })
    }

    // Merge in previous month data
    for (const [country, commission] of previousMonthMap.entries()) {
      const existing = countriesMap.get(country)
      if (existing) {
        existing.previousCommission = commission
      } else {
        // Country had commission in previous month but not current
        countriesMap.set(country, {
          country,
          currentCommission: 0,
          previousCommission: commission,
        })
      }
    }

    // Convert to array and sort by current month commission (descending)
    const countriesArray = Array.from(countriesMap.values()).sort(
      (a, b) => b.currentCommission - a.currentCommission
    )

    // Limit to top 5 countries
    const top5Countries = countriesArray.slice(0, 5)

    // =================================================================
    // CALCULATE PERCENTAGE SHARE AND TRENDS
    // =================================================================

    // Calculate total commission for current month (for percentage calculation)
    const totalCurrentCommission = Array.from(currentMonthMap.values()).reduce(
      (sum, commission) => sum + commission,
      0
    )

    // Build final response
    const result: CountryCommission[] = top5Countries.map((countryData) => {
      // Calculate percentage share (0-100)
      const percentageShare =
        totalCurrentCommission > 0
          ? (countryData.currentCommission / totalCurrentCommission) * 100
          : 0

      // Calculate trend
      const trend = calculateTrend(
        countryData.currentCommission,
        countryData.previousCommission
      )

      return {
        country: countryData.country,
        commission: Math.round(countryData.currentCommission * 100) / 100,
        percentage_share: Math.round(percentageShare * 10) / 10, // Round to 1 decimal
        trend,
      }
    })

    // Return standardized success response
    return createSuccessResponse(result)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/commission-by-country',
    })
  }
}
