/**
 * Due Soon Count API - Dashboard widget for upcoming payments
 *
 * This endpoint provides a count and total amount of installments that are
 * due soon (within the agency's configured threshold, default 4 days).
 *
 * Epic 5: Intelligent Status Automation
 * Story 5.2: Due Soon Notification Flags
 * Task 2: Update UI to display "due soon" badges
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ForbiddenError,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import { addDays, startOfDay } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

// Cache configuration: 5 minutes
export const revalidate = 300

/**
 * Due Soon Count Response
 */
interface DueSoonCountData {
  count: number
  total_amount: number
}

/**
 * GET /api/dashboard/due-soon-count
 *
 * Returns the count and total amount of installments that are due soon.
 * "Due soon" is defined as installments with student_due_date between today
 * and today + threshold_days (inclusive), where threshold_days is configured
 * per agency (default: 4 days).
 *
 * Only counts installments with status = 'pending' (excludes overdue, paid, etc.)
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "count": 12,
 *     "total_amount": 15000.00
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
 * - Uses partial index on student_due_date for fast queries
 * - Single aggregation query for count and sum
 *
 * @param request - Next.js request object
 * @returns Due soon count and total amount or error response
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

    // Get agency settings (timezone and due_soon_threshold_days)
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('timezone, due_soon_threshold_days')
      .eq('id', userAgencyId)
      .single()

    if (agencyError || !agency) {
      console.error('Failed to fetch agency:', agencyError)
      throw new Error('Failed to fetch agency information')
    }

    const timezone = agency.timezone || 'UTC'
    const thresholdDays = agency.due_soon_threshold_days || 4

    // Calculate date range in agency timezone
    // "Due soon" = student_due_date BETWEEN today AND today + threshold_days (inclusive)
    const now = new Date()
    const agencyNow = toZonedTime(now, timezone)
    const agencyToday = startOfDay(agencyNow)
    const thresholdDate = addDays(agencyToday, thresholdDays)

    // Convert to ISO strings for PostgreSQL comparison
    const todayISO = agencyToday.toISOString()
    const thresholdISO = thresholdDate.toISOString()

    // Query installments that are:
    // 1. Status = 'pending' (not overdue, paid, or cancelled)
    // 2. student_due_date >= today (not in the past)
    // 3. student_due_date <= today + threshold_days (within threshold)
    const { data: dueSoonInstallments, error: installmentsError } = await supabase
      .from('installments')
      .select('amount')
      .eq('agency_id', userAgencyId)
      .eq('status', 'pending')
      .gte('student_due_date', todayISO)
      .lte('student_due_date', thresholdISO)

    if (installmentsError) {
      console.error('Failed to fetch due soon installments:', installmentsError)
      throw new Error('Failed to fetch due soon installments')
    }

    // Calculate count and total amount
    const count = dueSoonInstallments?.length || 0
    const totalAmount = dueSoonInstallments?.reduce(
      (sum, installment) => sum + (Number(installment.amount) || 0),
      0
    ) || 0

    // Build response
    const data: DueSoonCountData = {
      count,
      total_amount: Math.round(totalAmount * 100) / 100,
    }

    // Return standardized success response
    return createSuccessResponse(data)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/dashboard/due-soon-count',
    })
  }
}
