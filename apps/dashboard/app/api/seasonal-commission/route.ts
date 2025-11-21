/**
 * Seasonal Commission API - 12-month commission trends with peak/quiet indicators
 *
 * This endpoint provides monthly commission data for the last 12 months with:
 * - Peak month indicators (top 3 months by commission)
 * - Quiet month indicators (bottom 3 months by commission)
 * - Year-over-year comparison (if historical data available)
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 2: Create Seasonal Commission API Route
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
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

// Cache configuration: 5 minutes
export const revalidate = 300

/**
 * Monthly commission data point
 */
interface MonthlyCommission {
  month: string // ISO format: "2025-01"
  commission: number
  year_over_year_change?: number // percentage change vs same month last year
  is_peak?: boolean // true if in top 3 months
  is_quiet?: boolean // true if in bottom 3 months
}

/**
 * Internal structure for commission calculation
 */
interface MonthData {
  month: string
  commission: number
  previousYearCommission?: number
}

/**
 * GET /api/seasonal-commission
 *
 * Returns 12-month commission trends with peak/quiet month indicators.
 * Uses rolling 12-month window from current month back.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "month": "2024-12",
 *       "commission": 15000.00,
 *       "year_over_year_change": 12.5,
 *       "is_peak": false,
 *       "is_quiet": false
 *     },
 *     {
 *       "month": "2025-01",
 *       "commission": 25000.00,
 *       "year_over_year_change": 8.3,
 *       "is_peak": true,
 *       "is_quiet": false
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
 * - Single query for 24 months of data (current + previous year)
 *
 * @param request - Next.js request object
 * @returns Monthly commission data with trends or error response
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

    // Calculate 12 months back (for current year data)
    const twelveMonthsAgo = toZonedTime(startOfMonth(subMonths(now, 11)), timezone)

    // Calculate 24 months back (for year-over-year comparison)
    const twentyFourMonthsAgo = toZonedTime(startOfMonth(subMonths(now, 23)), timezone)

    // =================================================================
    // QUERY PAID INSTALLMENTS WITH COMMISSION DATA
    // =================================================================

    // Query all paid installments for the last 24 months
    // Join with payment_plans to get commission rates for calculation
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
          expected_commission
        )
      `)
      .eq('agency_id', userAgencyId)
      .eq('status', 'paid')
      .not('paid_date', 'is', null)
      .gte('paid_date', format(twentyFourMonthsAgo, 'yyyy-MM-dd'))
      .lte('paid_date', format(endOfMonth(now), 'yyyy-MM-dd'))

    if (installmentsError) {
      console.error('Failed to fetch installments:', installmentsError)
      throw new Error('Failed to fetch installment data')
    }

    // =================================================================
    // CALCULATE EARNED COMMISSION PER MONTH
    // =================================================================

    // Group installments by payment plan and calculate earned commission
    // Commission formula: (paid_amount / total_amount) * expected_commission
    // Only count installments where generates_commission = true

    const monthlyCommissionMap = new Map<string, number>()

    // Process each installment
    for (const installment of installmentsData || []) {
      // Skip if doesn't generate commission
      if (!installment.generates_commission) {
        continue
      }

      // Extract payment plan data
      const paymentPlan = Array.isArray(installment.payment_plans)
        ? installment.payment_plans[0]
        : installment.payment_plans

      if (!paymentPlan) {
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

      // Convert paid_date to agency timezone and extract month
      const paidDate = new Date(installment.paid_date!)
      const zonedDate = toZonedTime(paidDate, timezone)
      const monthKey = format(zonedDate, 'yyyy-MM')

      // Add to monthly total
      const currentTotal = monthlyCommissionMap.get(monthKey) || 0
      monthlyCommissionMap.set(monthKey, currentTotal + earnedCommission)
    }

    // =================================================================
    // BUILD TIME SERIES FOR LAST 12 MONTHS
    // =================================================================

    const monthsData: MonthData[] = []

    // Generate array of last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const monthKey = format(monthDate, 'yyyy-MM')
      const previousYearMonthDate = subMonths(monthDate, 12)
      const previousYearMonthKey = format(previousYearMonthDate, 'yyyy-MM')

      const commission = monthlyCommissionMap.get(monthKey) || 0
      const previousYearCommission = monthlyCommissionMap.get(previousYearMonthKey)

      monthsData.push({
        month: monthKey,
        commission: Math.round(commission * 100) / 100,
        previousYearCommission:
          previousYearCommission !== undefined
            ? Math.round(previousYearCommission * 100) / 100
            : undefined,
      })
    }

    // =================================================================
    // IDENTIFY PEAK AND QUIET MONTHS
    // =================================================================

    // Sort months by commission to identify top 3 (peak) and bottom 3 (quiet)
    const sortedByCommission = [...monthsData].sort(
      (a, b) => b.commission - a.commission
    )

    // Get top 3 peak months
    const peakMonths = new Set(
      sortedByCommission.slice(0, 3).map((m) => m.month)
    )

    // Get bottom 3 quiet months
    const quietMonths = new Set(
      sortedByCommission.slice(-3).map((m) => m.month)
    )

    // =================================================================
    // BUILD FINAL RESPONSE
    // =================================================================

    const result: MonthlyCommission[] = monthsData.map((data) => {
      const monthlyCommission: MonthlyCommission = {
        month: data.month,
        commission: data.commission,
        is_peak: peakMonths.has(data.month),
        is_quiet: quietMonths.has(data.month),
      }

      // Calculate year-over-year change if previous year data exists
      if (data.previousYearCommission !== undefined) {
        if (data.previousYearCommission > 0) {
          const change =
            ((data.commission - data.previousYearCommission) /
              data.previousYearCommission) *
            100
          monthlyCommission.year_over_year_change =
            Math.round(change * 10) / 10 // Round to 1 decimal place
        } else if (data.commission > 0) {
          // If previous year was 0 but current is positive, show 100% increase
          monthlyCommission.year_over_year_change = 100
        } else {
          // Both are 0, no change
          monthlyCommission.year_over_year_change = 0
        }
      }

      return monthlyCommission
    })

    // Return standardized success response
    return createSuccessResponse(result)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/seasonal-commission',
    })
  }
}
