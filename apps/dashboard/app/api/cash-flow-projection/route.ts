/**
 * Cash Flow Projection API - Time series data for projected cash flow
 *
 * This endpoint provides cash flow projection data for the next N days, showing:
 * - Expected amounts (pending installments)
 * - Paid amounts (already paid installments)
 * - Grouped by day, week, or month buckets
 * - Detailed installment information for tooltips
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.2: Cash Flow Projection Chart
 * Task 1: Create Cash Flow Projection API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ForbiddenError,
} from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole, getUserAgencyId } from '@pleeno/auth/server'
import { startOfDay, addDays, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { z } from 'zod'

// Cache configuration: 5 minutes
export const revalidate = 300

/**
 * Query parameters schema
 */
const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(90),
  groupBy: z.enum(['day', 'week', 'month']).default('week'),
})

/**
 * Installment detail for tooltip
 */
interface InstallmentDetail {
  student_name: string
  amount: number
  status: string
  due_date: string
  college_name?: string
}

/**
 * Cash flow data point for a specific time bucket
 */
interface CashFlowDataPoint {
  date_bucket: string // ISO date
  paid_amount: number
  expected_amount: number
  installment_count: number
  installments: InstallmentDetail[]
}

/**
 * Helper function to determine the PostgreSQL date_trunc unit
 */
function getDateTruncUnit(groupBy: 'day' | 'week' | 'month'): string {
  return groupBy // PostgreSQL date_trunc accepts 'day', 'week', or 'month' directly
}

/**
 * GET /api/cash-flow-projection
 *
 * Returns time series data showing projected cash flow for the next N days.
 * Groups installments by date buckets and shows both expected and paid amounts.
 *
 * Query Parameters:
 * - days (number, default: 90): Number of days to project forward
 * - groupBy (string, default: "week"): "day" | "week" | "month"
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "date_bucket": "2025-01-13",
 *       "paid_amount": 5000.00,
 *       "expected_amount": 15000.00,
 *       "installment_count": 8,
 *       "installments": [
 *         {
 *           "student_name": "John Doe",
 *           "amount": 2500.00,
 *           "status": "pending",
 *           "due_date": "2025-01-15",
 *           "college_name": "University X"
 *         }
 *       ]
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
 * - Optimized joins with installments, payment_plans, enrollments, students, colleges
 *
 * @param request - Next.js request object
 * @returns Cash flow projection data or error response
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

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const { days, groupBy } = querySchema.parse({
      days: searchParams.get('days'),
      groupBy: searchParams.get('groupBy'),
    })

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
    const todayInTimezone = toZonedTime(startOfDay(now), timezone)
    const endDateInTimezone = toZonedTime(addDays(todayInTimezone, days), timezone)

    // Format dates for SQL query
    const startDate = format(todayInTimezone, 'yyyy-MM-dd')
    const endDate = format(endDateInTimezone, 'yyyy-MM-dd')

    // =================================================================
    // QUERY INSTALLMENTS WITH JOINS
    // =================================================================

    // Query all installments within the date range
    // Join with payment_plans → enrollments → branches → colleges and students for details
    const { data: installmentsData, error: installmentsError } = await supabase
      .from('installments')
      .select(`
        id,
        amount,
        status,
        student_due_date,
        paid_amount,
        payment_plan_id,
        payment_plans!inner(
          id,
          enrollment_id,
          enrollments!inner(
            id,
            student_id,
            branch_id,
            students!inner(
              id,
              full_name
            ),
            branches!branch_id(
              id,
              name,
              colleges!college_id(
                id,
                name
              )
            )
          )
        )
      `)
      .eq('agency_id', userAgencyId)
      .gte('student_due_date', startDate)
      .lte('student_due_date', endDate)
      .in('status', ['pending', 'paid'])
      .order('student_due_date', { ascending: true })

    if (installmentsError) {
      console.error('Failed to fetch installments:', installmentsError)
      throw new Error('Failed to fetch installment data')
    }

    // =================================================================
    // GROUP INSTALLMENTS BY DATE BUCKET
    // =================================================================

    // Map to group installments by date bucket
    const bucketMap = new Map<string, {
      paid_amount: number
      expected_amount: number
      installments: InstallmentDetail[]
    }>()

    // Process each installment
    for (const installment of installmentsData || []) {
      // Extract nested data
      const paymentPlan = Array.isArray(installment.payment_plans)
        ? installment.payment_plans[0]
        : installment.payment_plans

      if (!paymentPlan) continue

      const enrollment = Array.isArray(paymentPlan.enrollments)
        ? paymentPlan.enrollments[0]
        : paymentPlan.enrollments

      if (!enrollment) continue

      const student = Array.isArray(enrollment.students)
        ? enrollment.students[0]
        : enrollment.students

      if (!student) continue

      // Extract branch and college data
      const branch = Array.isArray(enrollment.branches)
        ? enrollment.branches[0]
        : enrollment.branches

      let college = null
      if (branch?.colleges) {
        college = Array.isArray(branch.colleges)
          ? branch.colleges[0]
          : branch.colleges
      }

      // Calculate date bucket based on groupBy parameter
      const dueDate = new Date(installment.student_due_date)
      const zonedDate = toZonedTime(dueDate, timezone)

      let dateBucket: string
      if (groupBy === 'day') {
        dateBucket = format(zonedDate, 'yyyy-MM-dd')
      } else if (groupBy === 'week') {
        // Get the Monday of the week
        const dayOfWeek = zonedDate.getDay()
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust to Monday
        const weekStart = new Date(zonedDate)
        weekStart.setDate(zonedDate.getDate() + diff)
        dateBucket = format(weekStart, 'yyyy-MM-dd')
      } else {
        // month
        dateBucket = format(zonedDate, 'yyyy-MM-01')
      }

      // Initialize bucket if it doesn't exist
      if (!bucketMap.has(dateBucket)) {
        bucketMap.set(dateBucket, {
          paid_amount: 0,
          expected_amount: 0,
          installments: [],
        })
      }

      const bucket = bucketMap.get(dateBucket)!

      // Add amount to appropriate category
      const amount = Number(installment.amount || 0)
      if (installment.status === 'paid') {
        bucket.paid_amount += amount
      } else if (installment.status === 'pending') {
        bucket.expected_amount += amount
      }

      // Add installment detail for tooltip
      bucket.installments.push({
        student_name: student.full_name,
        amount: Math.round(amount * 100) / 100,
        status: installment.status,
        due_date: installment.student_due_date,
        college_name: college?.name,
      })
    }

    // =================================================================
    // BUILD FINAL RESPONSE
    // =================================================================

    // Convert map to sorted array
    const result: CashFlowDataPoint[] = Array.from(bucketMap.entries())
      .map(([dateBucket, data]) => ({
        date_bucket: dateBucket,
        paid_amount: Math.round(data.paid_amount * 100) / 100,
        expected_amount: Math.round(data.expected_amount * 100) / 100,
        installment_count: data.installments.length,
        installments: data.installments,
      }))
      .sort((a, b) => a.date_bucket.localeCompare(b.date_bucket))

    // Return standardized success response
    return createSuccessResponse(result)
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return handleApiError(error, {
      path: '/api/cash-flow-projection',
    })
  }
}
