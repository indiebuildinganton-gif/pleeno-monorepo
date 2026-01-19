/**
 * Cash Flow Projection CSV Export API Route
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.2: Cash Flow Projection Chart
 * Task: Add CSV Export Functionality
 *
 * This endpoint exports cash flow projection data to CSV format with:
 * - Filtering by date range and grouping
 * - Detailed installment information
 * - Currency formatting
 * - Proper CSV headers and filename with timestamp
 * - RLS enforcement (automatic agency filtering)
 */

import { NextRequest, NextResponse } from 'next/server'
import { stringify } from 'csv-stringify/sync'
import { createServerClientFromRequest } from '@pleeno/database/server'
import { requireRole, getUserAgencyId } from '@pleeno/auth/server'
import { handleApiError, ForbiddenError } from '@pleeno/utils'
import { startOfDay, addDays, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { z } from 'zod'

/**
 * Query parameters schema
 */
const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(90),
  groupBy: z.enum(['day', 'week', 'month']).default('week'),
})

/**
 * Installment detail for CSV export
 */
interface InstallmentDetail {
  student_name: string
  amount: number
  status: string
  due_date: string
  college_name?: string
}

/**
 * CSV row format
 */
interface CashFlowCSVRow {
  'Date Bucket': string
  'Paid Amount': string
  'Expected Amount': string
  'Total Amount': string
  'Installment Count': number
  'Student Name': string
  'Installment Amount': string
  'Installment Status': string
  'Due Date': string
  'College Name': string
}

/**
 * GET /api/cash-flow-projection/export
 *
 * Exports cash flow projection data to CSV format.
 *
 * Query Parameters:
 * - days (number, default: 90): Number of days to project forward
 * - groupBy (string, default: "week"): "day" | "week" | "month"
 *
 * Response (200):
 * Returns CSV file with cash flow projection data
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS policies automatically filter by agency_id
 *
 * @param request - Next.js request object
 * @returns CSV file download or error response
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
    const currency = agency.currency || 'AUD'

    // Calculate date ranges in agency timezone
    const now = new Date()
    const todayInTimezone = toZonedTime(startOfDay(now), timezone)
    const endDateInTimezone = toZonedTime(addDays(todayInTimezone, days), timezone)

    // Format dates for SQL query
    const startDate = format(todayInTimezone, 'yyyy-MM-dd')
    const endDate = format(endDateInTimezone, 'yyyy-MM-dd')

    // Query all installments within the date range
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

    // Group installments by date bucket
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
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
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

      // Add installment detail
      bucket.installments.push({
        student_name: student.full_name,
        amount: Math.round(amount * 100) / 100,
        status: installment.status,
        due_date: installment.student_due_date,
        college_name: college?.name || 'N/A',
      })
    }

    // Convert to CSV rows - one row per installment
    const csvRows: CashFlowCSVRow[] = []

    // Sort buckets by date
    const sortedBuckets = Array.from(bucketMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )

    for (const [dateBucket, data] of sortedBuckets) {
      const totalAmount = data.paid_amount + data.expected_amount

      // Format date bucket for display
      let displayDate = dateBucket
      if (groupBy === 'day') {
        displayDate = format(new Date(dateBucket), 'MMM dd, yyyy')
      } else if (groupBy === 'week') {
        const weekEnd = new Date(dateBucket)
        weekEnd.setDate(weekEnd.getDate() + 6)
        displayDate = `${format(new Date(dateBucket), 'MMM dd')}-${format(weekEnd, 'dd, yyyy')}`
      } else {
        displayDate = format(new Date(dateBucket), 'MMMM yyyy')
      }

      // Create a row for each installment
      for (const inst of data.installments) {
        csvRows.push({
          'Date Bucket': displayDate,
          'Paid Amount': new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency,
          }).format(data.paid_amount),
          'Expected Amount': new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency,
          }).format(data.expected_amount),
          'Total Amount': new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency,
          }).format(totalAmount),
          'Installment Count': data.installments.length,
          'Student Name': inst.student_name,
          'Installment Amount': new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency,
          }).format(inst.amount),
          'Installment Status': inst.status.charAt(0).toUpperCase() + inst.status.slice(1),
          'Due Date': format(new Date(inst.due_date), 'MMM dd, yyyy'),
          'College Name': inst.college_name || 'N/A',
        })
      }

      // If no installments in bucket, add summary row
      if (data.installments.length === 0) {
        csvRows.push({
          'Date Bucket': displayDate,
          'Paid Amount': new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency,
          }).format(data.paid_amount),
          'Expected Amount': new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency,
          }).format(data.expected_amount),
          'Total Amount': new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency,
          }).format(totalAmount),
          'Installment Count': 0,
          'Student Name': 'N/A',
          'Installment Amount': 'N/A',
          'Installment Status': 'N/A',
          'Due Date': 'N/A',
          'College Name': 'N/A',
        })
      }
    }

    // Generate CSV content
    const csv = stringify(csvRows, {
      header: true,
      columns: [
        'Date Bucket',
        'Paid Amount',
        'Expected Amount',
        'Total Amount',
        'Installment Count',
        'Student Name',
        'Installment Amount',
        'Installment Status',
        'Due Date',
        'College Name',
      ],
    })

    // Generate filename with timestamp
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss')
    const filename = `cash-flow-projection-${groupBy}-${timestamp}.csv`

    // Return CSV file with proper headers
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return handleApiError(error, {
      path: '/api/cash-flow-projection/export',
    })
  }
}
