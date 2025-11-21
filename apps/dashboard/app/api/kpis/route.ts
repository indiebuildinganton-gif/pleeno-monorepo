/**
 * KPI Metrics API - Dashboard high-level business metrics
 *
 * This endpoint provides core business KPIs with trend indicators comparing
 * current month to previous month performance.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 1: Create KPI Metrics API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ForbiddenError,
} from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole, getUserAgencyId } from '@pleeno/auth/server'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

// Cache configuration: 5 minutes
export const revalidate = 300

/**
 * Trend direction type
 */
type TrendDirection = 'up' | 'down' | 'neutral'

/**
 * KPI Metrics Response
 */
interface KPIMetrics {
  active_students: number
  active_payment_plans: number
  outstanding_amount: number
  earned_commission: number
  collection_rate: number
  trends: {
    active_students: TrendDirection
    active_payment_plans: TrendDirection
    outstanding_amount: TrendDirection
    earned_commission: TrendDirection
    collection_rate: TrendDirection
  }
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
 * GET /api/kpis
 *
 * Returns core business KPI metrics with trend indicators.
 * Compares current month performance against previous month.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "active_students": 150,
 *     "active_payment_plans": 120,
 *     "outstanding_amount": 250000.00,
 *     "earned_commission": 45000.00,
 *     "collection_rate": 85.5,
 *     "trends": {
 *       "active_students": "up",
 *       "active_payment_plans": "up",
 *       "outstanding_amount": "down",
 *       "earned_commission": "up",
 *       "collection_rate": "neutral"
 *     }
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
 * - Database aggregations for efficiency
 * - Composite indexes on agency_id + status
 *
 * @param request - Next.js request object
 * @returns KPI metrics with trends or error response
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
    // CURRENT MONTH METRICS
    // =================================================================

    // 1. Active Students: COUNT DISTINCT students with active enrollments
    const { data: currentActiveStudentsData, error: currentStudentsError } = await supabase
      .from('enrollments')
      .select('student_id', { count: 'exact' })
      .eq('agency_id', userAgencyId)
      .eq('status', 'active')

    if (currentStudentsError) {
      console.error('Failed to fetch active students:', currentStudentsError)
      throw new Error('Failed to fetch active students')
    }

    // Count unique students
    const currentActiveStudents = new Set(
      currentActiveStudentsData?.map((e) => e.student_id) || []
    ).size

    // 2. Active Payment Plans: COUNT payment_plans WHERE status = 'active'
    const { count: currentActivePlans, error: currentPlansError } = await supabase
      .from('payment_plans')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', userAgencyId)
      .eq('status', 'active')

    if (currentPlansError) {
      console.error('Failed to fetch active payment plans:', currentPlansError)
      throw new Error('Failed to fetch active payment plans')
    }

    // 3. Outstanding Amount: SUM of active payment_plans total_amount
    // Note: This is a simplified implementation. When installments table exists,
    // this should be: SUM(installments.amount WHERE status IN ('pending', 'overdue'))
    const { data: outstandingData, error: outstandingError } = await supabase
      .from('payment_plans')
      .select('total_amount')
      .eq('agency_id', userAgencyId)
      .eq('status', 'active')

    if (outstandingError) {
      console.error('Failed to fetch outstanding amount:', outstandingError)
      throw new Error('Failed to fetch outstanding amount')
    }

    const currentOutstandingAmount = outstandingData?.reduce(
      (sum, plan) => sum + (Number(plan.total_amount) || 0),
      0
    ) || 0

    // 4. Earned Commission: SUM of payment_plans.expected_commission
    // Note: Using expected_commission as earned_commission field doesn't exist yet
    const { data: commissionData, error: commissionError } = await supabase
      .from('payment_plans')
      .select('expected_commission')
      .eq('agency_id', userAgencyId)

    if (commissionError) {
      console.error('Failed to fetch earned commission:', commissionError)
      throw new Error('Failed to fetch earned commission')
    }

    const currentEarnedCommission = commissionData?.reduce(
      (sum, plan) => sum + (Number(plan.expected_commission) || 0),
      0
    ) || 0

    // 5. Collection Rate: (payments received / expected) * 100
    // Note: This requires installments table which doesn't exist yet
    // Returning 0 as placeholder until payment tracking is implemented
    const currentCollectionRate = 0

    // =================================================================
    // PREVIOUS MONTH METRICS
    // =================================================================

    // For simplicity, we'll query the same metrics but for previous month
    // In a real scenario, we'd query based on created_at or updated_at dates

    // 1. Previous Active Students
    const { data: prevActiveStudentsData, error: prevStudentsError } = await supabase
      .from('enrollments')
      .select('student_id', { count: 'exact' })
      .eq('agency_id', userAgencyId)
      .eq('status', 'active')
      .lte('created_at', previousMonthEnd.toISOString())

    if (prevStudentsError) {
      console.error('Failed to fetch previous active students:', prevStudentsError)
      throw new Error('Failed to fetch previous active students')
    }

    const previousActiveStudents = new Set(
      prevActiveStudentsData?.map((e) => e.student_id) || []
    ).size

    // 2. Previous Active Payment Plans
    const { count: prevActivePlans, error: prevPlansError } = await supabase
      .from('payment_plans')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', userAgencyId)
      .eq('status', 'active')
      .lte('created_at', previousMonthEnd.toISOString())

    if (prevPlansError) {
      console.error('Failed to fetch previous payment plans:', prevPlansError)
      throw new Error('Failed to fetch previous payment plans')
    }

    // 3. Previous Outstanding Amount
    const { data: prevOutstandingData, error: prevOutstandingError } = await supabase
      .from('payment_plans')
      .select('total_amount')
      .eq('agency_id', userAgencyId)
      .eq('status', 'active')
      .lte('created_at', previousMonthEnd.toISOString())

    if (prevOutstandingError) {
      console.error('Failed to fetch previous outstanding amount:', prevOutstandingError)
      throw new Error('Failed to fetch previous outstanding amount')
    }

    const previousOutstandingAmount = prevOutstandingData?.reduce(
      (sum, plan) => sum + (Number(plan.total_amount) || 0),
      0
    ) || 0

    // 4. Previous Earned Commission
    const { data: prevCommissionData, error: prevCommissionError } = await supabase
      .from('payment_plans')
      .select('expected_commission')
      .eq('agency_id', userAgencyId)
      .lte('created_at', previousMonthEnd.toISOString())

    if (prevCommissionError) {
      console.error('Failed to fetch previous commission:', prevCommissionError)
      throw new Error('Failed to fetch previous commission')
    }

    const previousEarnedCommission = prevCommissionData?.reduce(
      (sum, plan) => sum + (Number(plan.expected_commission) || 0),
      0
    ) || 0

    // 5. Previous Collection Rate (placeholder)
    const previousCollectionRate = 0

    // =================================================================
    // CALCULATE TRENDS
    // =================================================================

    const trends = {
      active_students: calculateTrend(currentActiveStudents, previousActiveStudents),
      active_payment_plans: calculateTrend(currentActivePlans || 0, prevActivePlans || 0),
      outstanding_amount: calculateTrend(currentOutstandingAmount, previousOutstandingAmount),
      earned_commission: calculateTrend(currentEarnedCommission, previousEarnedCommission),
      collection_rate: calculateTrend(currentCollectionRate, previousCollectionRate),
    }

    // =================================================================
    // BUILD RESPONSE
    // =================================================================

    const metrics: KPIMetrics = {
      active_students: currentActiveStudents,
      active_payment_plans: currentActivePlans || 0,
      outstanding_amount: Math.round(currentOutstandingAmount * 100) / 100,
      earned_commission: Math.round(currentEarnedCommission * 100) / 100,
      collection_rate: Math.round(currentCollectionRate * 100) / 100,
      trends,
    }

    // Return standardized success response
    return createSuccessResponse(metrics)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/kpis',
    })
  }
}
