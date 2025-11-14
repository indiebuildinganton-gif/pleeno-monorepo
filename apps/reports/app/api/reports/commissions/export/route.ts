/**
 * Commissions Report CSV Export API Route
 *
 * Story 7.4: Commission Report by College
 * Task 4: Add CSV Export for Commissions Report
 *
 * This endpoint exports commission reports to CSV format with:
 * - Date range filtering (required: date_from, date_to)
 * - Optional city filtering
 * - Main section: commission data grouped by college/branch
 * - Drill-down section: student payment plan details
 * - Excel-compatible UTF-8 BOM encoding
 * - RLS enforcement (automatic agency filtering)
 */

import { NextRequest, NextResponse } from 'next/server'
import { stringify } from 'csv-stringify/sync'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import { handleApiError, ForbiddenError, ValidationError } from '@pleeno/utils'
import { formatCurrencyForCSV, formatDateISO, addUTF8BOM } from '@pleeno/utils/csv-formatter'
import type {
  CommissionsReportRequest,
  CommissionReportRow,
  CommissionPaymentPlan,
} from '../../../types/commissions-report'

/**
 * GET /api/reports/commissions/export
 *
 * Exports commission report to CSV format.
 *
 * Query parameters:
 * - format: "csv" (required)
 * - date_from: ISO date string YYYY-MM-DD (required)
 * - date_to: ISO date string YYYY-MM-DD (required)
 * - city: string (optional)
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS automatically filters by agency_id
 * - All queries scoped to user's agency
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
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const city = searchParams.get('city')

    // Validate format parameter
    if (format !== 'csv') {
      throw new ValidationError('Invalid or missing format parameter. Only "csv" is supported.')
    }

    // Validate required date parameters
    if (!date_from || !date_to) {
      throw new ValidationError('Date range is required', {
        errors: {
          date_from: !date_from ? ['Start date is required'] : undefined,
          date_to: !date_to ? ['End date is required'] : undefined,
        },
      })
    }

    // Validate date format (basic check)
    const dateFromValid = /^\d{4}-\d{2}-\d{2}$/.test(date_from)
    const dateToValid = /^\d{4}-\d{2}-\d{2}$/.test(date_to)

    if (!dateFromValid || !dateToValid) {
      throw new ValidationError('Invalid date format. Expected YYYY-MM-DD', {
        errors: {
          date_from: !dateFromValid ? ['Invalid date format'] : undefined,
          date_to: !dateToValid ? ['Invalid date format'] : undefined,
        },
      })
    }

    // Validate date range (date_from should be before or equal to date_to)
    if (new Date(date_from) > new Date(date_to)) {
      throw new ValidationError('Start date must be before or equal to end date', {
        errors: {
          date_from: ['Start date must be before or equal to end date'],
        },
      })
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Call the database function to get commission report (same as POST endpoint)
    const { data: reportData, error } = await supabase.rpc('get_commission_report', {
      p_agency_id: userAgencyId,
      p_date_from: date_from,
      p_date_to: date_to,
      p_city: city || null,
    })

    if (error) {
      console.error('Failed to fetch commission report:', error)
      throw new Error('Failed to fetch commission report')
    }

    // Transform the data to match our TypeScript types
    const data: CommissionReportRow[] = (reportData || []).map((row: any) => ({
      college_id: row.college_id,
      college_name: row.college_name,
      branch_id: row.branch_id,
      branch_name: row.branch_name,
      branch_city: row.branch_city,
      commission_rate_percent: parseFloat(row.commission_rate_percent),
      total_payment_plans: parseInt(row.total_payment_plans),
      total_students: parseInt(row.total_students),
      total_paid: parseFloat(row.total_paid),
      earned_commission: parseFloat(row.earned_commission),
      outstanding_commission: parseFloat(row.outstanding_commission),
      payment_plans: row.payment_plans || [],
    }))

    // Generate CSV content
    const csvContent = generateCommissionCSV(data, date_from, date_to, city)

    // Generate filename with date range start date
    const filename = `commissions_report_${date_from}.csv`

    // Return CSV response with proper headers
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/reports/commissions/export',
    })
  }
}

/**
 * Generate CSV content for commission report
 *
 * CSV Structure:
 * 1. Summary header with date range and filters
 * 2. Main commission data grouped by college/branch
 * 3. Blank row separator
 * 4. Drill-down section with student payment plan details
 *
 * @param data - Commission report data
 * @param date_from - Start date for report
 * @param date_to - End date for report
 * @param city - Optional city filter
 * @returns CSV content with UTF-8 BOM
 */
function generateCommissionCSV(
  data: CommissionReportRow[],
  date_from: string,
  date_to: string,
  city: string | null
): string {
  const rows: string[][] = []

  // Add report header/metadata
  rows.push(['Commission Report by College'])
  rows.push(['Date Range:', `${date_from} to ${date_to}`])
  if (city) {
    rows.push(['City Filter:', city])
  }
  rows.push([]) // Blank row

  // Main section: Commission summary by branch
  rows.push([
    'College',
    'Branch',
    'City',
    'Total Paid',
    'Rate (%)',
    'Earned Commission',
    'Outstanding Commission',
  ])

  // Group data by college for better organization
  const groupedByCollege = new Map<string, CommissionReportRow[]>()

  data.forEach((row) => {
    const existing = groupedByCollege.get(row.college_name) || []
    existing.push(row)
    groupedByCollege.set(row.college_name, existing)
  })

  // Add data rows grouped by college
  groupedByCollege.forEach((branches, collegeName) => {
    branches.forEach((branch) => {
      rows.push([
        collegeName,
        branch.branch_name,
        branch.branch_city,
        formatCurrencyForCSV(branch.total_paid),
        branch.commission_rate_percent.toString(),
        formatCurrencyForCSV(branch.earned_commission),
        formatCurrencyForCSV(branch.outstanding_commission),
      ])
    })
  })

  // Add totals row
  const totalPaid = data.reduce((sum, row) => sum + row.total_paid, 0)
  const totalEarned = data.reduce((sum, row) => sum + row.earned_commission, 0)
  const totalOutstanding = data.reduce((sum, row) => sum + row.outstanding_commission, 0)

  rows.push([]) // Blank row before totals
  rows.push([
    'TOTAL',
    '',
    '',
    formatCurrencyForCSV(totalPaid),
    '',
    formatCurrencyForCSV(totalEarned),
    formatCurrencyForCSV(totalOutstanding),
  ])

  // Add drill-down section header
  rows.push([]) // Blank row separator
  rows.push([]) // Another blank row for visual separation
  rows.push(['Student Payment Plan Details'])
  rows.push([
    'College',
    'Branch',
    'Student Name',
    'Payment Plan ID',
    'Total Amount',
    'Paid Amount',
    'Commission Earned',
  ])

  // Add student payment plan drill-down data
  data.forEach((branch) => {
    branch.payment_plans.forEach((plan: CommissionPaymentPlan) => {
      rows.push([
        branch.college_name,
        branch.branch_name,
        plan.student_name,
        plan.payment_plan_id,
        formatCurrencyForCSV(plan.total_amount),
        formatCurrencyForCSV(plan.paid_amount),
        formatCurrencyForCSV(plan.commission_earned),
      ])
    })
  })

  // Generate CSV with proper escaping
  const csv = stringify(rows, {
    quoted: true, // Quote all fields to handle commas in data
    quoted_empty: true,
    escape: '"', // Escape quotes with double quotes
  })

  // Add UTF-8 BOM for Excel compatibility
  return addUTF8BOM(csv)
}
