/**
 * Commission by College API - Commission breakdown by college/branch with filters
 *
 * This endpoint provides commission breakdown data grouped by college and branch
 * with support for filtering by time period, college, and branch.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.3: Commission Breakdown by College
 * Task 1: Create Commission Breakdown API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, createSuccessResponse, ForbiddenError } from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole, getUserAgencyId } from '@pleeno/auth/server'
import {
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

// Cache configuration: 5 minutes
export const revalidate = 300

/**
 * Commission breakdown data point
 */
interface CommissionBreakdown {
  college_id: string
  college_name: string
  branch_id: string
  branch_name: string
  branch_city: string | null
  total_commissions: number
  total_gst: number
  total_with_gst: number
  total_expected_commission: number
  total_earned_commission: number
  outstanding_commission: number
  payment_plan_count: number
}

/**
 * GET /api/commission-by-college
 *
 * Returns commission breakdown grouped by college and branch with filtering support.
 *
 * Query Parameters:
 * - period (optional): 'all' | 'year' | 'quarter' | 'month' (default: 'all')
 * - college_id (optional): Filter by specific college UUID
 * - branch_id (optional): Filter by specific branch UUID
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "college_id": "uuid",
 *       "college_name": "University of Sydney",
 *       "branch_id": "uuid",
 *       "branch_name": "Sydney Campus",
 *       "branch_city": "Sydney",
 *       "total_commissions": 15000.00,
 *       "total_gst": 1500.00,
 *       "total_with_gst": 16500.00,
 *       "total_expected_commission": 20000.00,
 *       "total_earned_commission": 15000.00,
 *       "outstanding_commission": 5000.00,
 *       "payment_plan_count": 12
 *     }
 *   ]
 * }
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS policies automatically filter by agency_id
 *
 * @param request - Next.js request object
 * @returns Commission breakdown data or error response
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

    console.log('[commission-by-college] User agency_id:', userAgencyId)
    console.log('[commission-by-college] app_metadata.agency_id:', user.app_metadata?.agency_id)
    console.log('[commission-by-college] user_metadata.agency_id:', user.user_metadata?.agency_id)

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'all') as 'all' | 'year' | 'quarter' | 'month'
    const collegeId = searchParams.get('college_id')
    const branchId = searchParams.get('branch_id')

    // Create Supabase client
    const supabase = await createServerClient()

    // Get agency timezone for date calculations
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('timezone, currency, gst_rate')
      .eq('id', userAgencyId)
      .single()

    if (agencyError || !agency) {
      console.error('Failed to fetch agency:', agencyError)
      throw new Error('Failed to fetch agency information')
    }

    const timezone = agency.timezone || 'UTC'
    const gstRate = agency.gst_rate || 0.1 // Default 10% GST

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = null

    if (period !== 'all') {
      switch (period) {
        case 'year':
          startDate = toZonedTime(startOfYear(now), timezone)
          endDate = toZonedTime(endOfYear(now), timezone)
          break
        case 'quarter':
          startDate = toZonedTime(startOfQuarter(now), timezone)
          endDate = toZonedTime(endOfQuarter(now), timezone)
          break
        case 'month':
          startDate = toZonedTime(startOfMonth(now), timezone)
          endDate = toZonedTime(endOfMonth(now), timezone)
          break
      }
    }

    // Build query for payment plans with joins
    let query = supabase
      .from('payment_plans')
      .select(
        `
        id,
        total_amount,
        expected_commission,
        gst_inclusive,
        created_at,
        enrollment_id,
        enrollments!inner(
          id,
          branch_id,
          branches!inner(
            id,
            name,
            city,
            college_id,
            colleges!inner(
              id,
              name
            )
          )
        )
      `
      )
      .eq('agency_id', userAgencyId)

    // Apply date filter if period is not 'all'
    if (startDate && endDate) {
      query = query
        .gte('created_at', format(startDate, 'yyyy-MM-dd'))
        .lte('created_at', format(endDate, 'yyyy-MM-dd'))
    }

    const { data: paymentPlans, error: plansError } = await query

    if (plansError) {
      console.error('Failed to fetch payment plans:', plansError)
      throw new Error('Failed to fetch commission data')
    }

    // Get paid installments for these payment plans
    const planIds = (paymentPlans || []).map((p) => p.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let installmentsData: any[] = []
    if (planIds.length > 0) {
      const { data: installments, error: installmentsError } = await supabase
        .from('installments')
        .select('payment_plan_id, paid_amount, status')
        .in('payment_plan_id', planIds)
        .eq('status', 'paid')

      if (installmentsError) {
        console.error('Failed to fetch installments:', installmentsError)
      } else {
        installmentsData = installments || []
      }
    }

    // Calculate total paid per payment plan
    const paidAmountMap = new Map<string, number>()
    for (const inst of installmentsData) {
      const current = paidAmountMap.get(inst.payment_plan_id) || 0
      paidAmountMap.set(inst.payment_plan_id, current + Number(inst.paid_amount || 0))
    }

    // Aggregate by college and branch
    const breakdownMap = new Map<string, CommissionBreakdown>()

    for (const plan of paymentPlans || []) {
      const enrollment = Array.isArray(plan.enrollments) ? plan.enrollments[0] : plan.enrollments
      if (!enrollment) continue

      const branch = Array.isArray(enrollment.branches)
        ? enrollment.branches[0]
        : enrollment.branches
      if (!branch) continue

      const college = Array.isArray(branch.colleges) ? branch.colleges[0] : branch.colleges
      if (!college) continue

      // Apply college filter
      if (collegeId && college.id !== collegeId) continue

      // Apply branch filter
      if (branchId && branch.id !== branchId) continue

      const key = `${college.id}-${branch.id}`

      // Calculate earned commission for this plan
      const totalAmount = Number(plan.total_amount || 0)
      const expectedCommission = Number(plan.expected_commission || 0)
      const paidAmount = paidAmountMap.get(plan.id) || 0
      const earnedCommission = totalAmount > 0 ? (paidAmount / totalAmount) * expectedCommission : 0

      // Calculate GST
      const gstInclusive = plan.gst_inclusive || false
      let gst = 0
      if (gstInclusive) {
        gst = (earnedCommission / (1 + gstRate)) * gstRate
      } else {
        gst = earnedCommission * gstRate
      }

      // Update or create breakdown entry
      const existing = breakdownMap.get(key)
      if (existing) {
        existing.total_expected_commission += expectedCommission
        existing.total_earned_commission += earnedCommission
        existing.total_commissions += earnedCommission
        existing.total_gst += gst
        existing.total_with_gst += earnedCommission + gst
        existing.outstanding_commission =
          existing.total_expected_commission - existing.total_earned_commission
        existing.payment_plan_count += 1
      } else {
        breakdownMap.set(key, {
          college_id: college.id,
          college_name: college.name,
          branch_id: branch.id,
          branch_name: branch.name,
          branch_city: branch.city || null,
          total_commissions: earnedCommission,
          total_gst: gst,
          total_with_gst: earnedCommission + gst,
          total_expected_commission: expectedCommission,
          total_earned_commission: earnedCommission,
          outstanding_commission: expectedCommission - earnedCommission,
          payment_plan_count: 1,
        })
      }
    }

    // Convert to array and sort by earned commission DESC
    const result = Array.from(breakdownMap.values())
      .map((item) => ({
        ...item,
        total_commissions: Math.round(item.total_commissions * 100) / 100,
        total_gst: Math.round(item.total_gst * 100) / 100,
        total_with_gst: Math.round(item.total_with_gst * 100) / 100,
        total_expected_commission: Math.round(item.total_expected_commission * 100) / 100,
        total_earned_commission: Math.round(item.total_earned_commission * 100) / 100,
        outstanding_commission: Math.round(item.outstanding_commission * 100) / 100,
      }))
      .sort((a, b) => b.total_earned_commission - a.total_earned_commission)

    // Return standardized success response
    return createSuccessResponse(result)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/commission-by-college',
    })
  }
}
