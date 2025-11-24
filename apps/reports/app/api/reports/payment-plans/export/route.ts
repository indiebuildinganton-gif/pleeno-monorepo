/**
 * Payment Plans CSV Export API Route
 *
 * Epic 7.2: CSV Export Functionality
 * Task 1: Create CSV Export API Route
 *
 * This endpoint exports payment plans reports to CSV format with:
 * - Flexible filtering (dates, colleges, branches, students, status, contract expiration)
 * - Column selection
 * - Currency and date formatting per acceptance criteria
 * - Proper CSV headers and filename with timestamp
 * - RLS enforcement (automatic agency filtering)
 */

import { NextRequest, NextResponse } from 'next/server'
import { stringify } from 'csv-stringify/sync'
import { createServerClient } from '@pleeno/database/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireRole } from '@pleeno/auth/server'
import { handleApiError, ForbiddenError, ValidationError } from '@pleeno/utils'
import { calculateExpectedCommission } from '@pleeno/utils'
import { exportAsCSVStream } from '@pleeno/utils/csv-formatter'
import { logReportExport } from '@pleeno/database/activity-logger'
import type {
  PaymentPlanReportRow,
  ContractStatus,
  PaymentPlanStatus,
} from '../../../types/payment-plans-report'

/**
 * Threshold for using streaming vs synchronous export
 * Datasets with more than this many rows will use streaming
 */
const STREAMING_THRESHOLD = 1000

/**
 * Batch size for streaming queries
 * Rows fetched from database per batch
 */
const BATCH_SIZE = 500

/**
 * Default columns to export if none specified
 */
const DEFAULT_COLUMNS = [
  'reference_number',
  'student_name',
  'college_name',
  'branch_name',
  'program_name',
  'plan_amount',
  'currency',
  'commission_rate_percent',
  'expected_commission',
  'total_paid',
  'total_remaining',
  'earned_commission',
  'status',
  'contract_expiration_date',
  'days_until_contract_expiration',
  'contract_status',
  'start_date',
]

/**
 * Column headers mapping for CSV export
 */
const COLUMN_HEADERS: Record<string, string> = {
  reference_number: 'Reference Number',
  student_name: 'Student Name',
  college_name: 'College',
  branch_name: 'Branch',
  program_name: 'Program',
  plan_amount: 'Plan Amount',
  currency: 'Currency',
  commission_rate_percent: 'Commission Rate (%)',
  expected_commission: 'Expected Commission',
  total_paid: 'Total Paid',
  total_remaining: 'Total Remaining',
  earned_commission: 'Earned Commission',
  status: 'Status',
  contract_expiration_date: 'Contract Expiration Date',
  days_until_contract_expiration: 'Days Until Expiration',
  contract_status: 'Contract Status',
  start_date: 'Start Date',
  created_at: 'Created At',
  updated_at: 'Updated At',
}

/**
 * Filters for payment plan export queries
 */
interface ExportFilters {
  date_from: string | null
  date_to: string | null
  college_ids: string[]
  branch_ids: string[]
  student_ids: string[]
  status: PaymentPlanStatus[]
  contract_expiration_from: string | null
  contract_expiration_to: string | null
}

/**
 * Query payment plans in batches for streaming export
 * Uses pagination to avoid loading all data into memory
 *
 * @param supabase Supabase client instance
 * @param userAgencyId User's agency ID for RLS filtering
 * @param filters Export filters to apply
 * @param batchSize Number of rows per batch (default: 500)
 * @yields Batches of payment plan data
 */
async function* queryPaymentPlansBatch(
  supabase: SupabaseClient,
  userAgencyId: string,
  filters: ExportFilters,
  batchSize: number = BATCH_SIZE
): AsyncGenerator<any[], void, unknown> {
  let offset = 0
  let hasMore = true

  while (hasMore) {
    // Build query with same structure as main query
    let query = supabase
      .from('payment_plans')
      .select(
        `
        id,
        reference_number,
        total_amount,
        currency,
        commission_rate_percent,
        expected_commission,
        status,
        start_date,
        created_at,
        updated_at,
        enrollments!inner (
          id,
          program_name,
          contract_expiration_date,
          student_id,
          students!inner (
            id,
            name
          ),
          branches!inner (
            id,
            name,
            college_id,
            colleges!inner (
              id,
              name
            )
          )
        )
      `
      )
      .eq('agency_id', userAgencyId)
      .range(offset, offset + batchSize - 1)
      .order('start_date', { ascending: false })

    // Apply filters - same as main query
    if (filters.date_from) {
      query = query.gte('start_date', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('start_date', filters.date_to)
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.student_ids && filters.student_ids.length > 0) {
      query = query.in('enrollments.student_id', filters.student_ids)
    }

    if (filters.branch_ids && filters.branch_ids.length > 0) {
      query = query.in('enrollments.branches.id', filters.branch_ids)
    }

    if (filters.college_ids && filters.college_ids.length > 0) {
      query = query.in('enrollments.branches.college_id', filters.college_ids)
    }

    // Execute batch query
    const { data, error } = await query

    if (error) {
      console.error('Batch query error:', error)
      throw new Error('Failed to fetch payment plans batch')
    }

    if (!data || data.length === 0) {
      hasMore = false
      break
    }

    // Transform data (same as main query)
    const transformedBatch = transformPaymentPlansData(data, filters)

    yield transformedBatch

    // Check if we got fewer rows than batch size (last batch)
    if (data.length < batchSize) {
      hasMore = false
    }

    offset += batchSize
  }
}

/**
 * Transform raw payment plan data into report format
 * Shared by both streaming and synchronous exports
 *
 * @param paymentPlans Raw payment plan data from database
 * @param filters Export filters (for contract expiration filtering)
 * @returns Transformed report data
 */
function transformPaymentPlansData(
  paymentPlans: any[],
  filters: ExportFilters
): PaymentPlanReportRow[] {
  const reportData: PaymentPlanReportRow[] = paymentPlans.map((plan: any) => {
    const enrollment = plan.enrollments
    const student = enrollment.students
    const branch = enrollment.branches
    const college = branch.colleges

    // Calculate contract expiration details
    let daysUntilExpiration: number | null = null
    let contractStatus: ContractStatus | null = null

    if (enrollment.contract_expiration_date) {
      const expirationDate = new Date(enrollment.contract_expiration_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset to start of day for accurate comparison

      const diffTime = expirationDate.getTime() - today.getTime()
      daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (daysUntilExpiration < 0) {
        contractStatus = 'expired'
      } else if (daysUntilExpiration <= 30) {
        contractStatus = 'expiring_soon'
      } else {
        contractStatus = 'active'
      }
    }

    // Calculate total paid (would need to query installments table)
    // For now, we'll set it to 0 and calculate earned commission
    const totalPaid = 0 // TODO: Sum from installments table when available
    const totalRemaining = plan.total_amount - totalPaid

    // Calculate earned commission based on amount paid
    const earnedCommission = calculateExpectedCommission(totalPaid, plan.commission_rate_percent)

    return {
      id: plan.id,
      reference_number: plan.reference_number,
      student_id: student.id,
      student_name: student.name,
      college_id: college.id,
      college_name: college.name,
      branch_id: branch.id,
      branch_name: branch.name,
      program_name: enrollment.program_name,
      plan_amount: plan.total_amount,
      currency: plan.currency,
      commission_rate_percent: plan.commission_rate_percent,
      expected_commission: plan.expected_commission,
      total_paid: totalPaid,
      total_remaining: totalRemaining,
      earned_commission: earnedCommission,
      status: plan.status,
      contract_expiration_date: enrollment.contract_expiration_date,
      days_until_contract_expiration: daysUntilExpiration,
      contract_status: contractStatus,
      start_date: plan.start_date,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    }
  })

  // Apply contract expiration filters after transformation
  // (These can't be applied in Supabase query as they're computed)
  let filteredData = reportData

  if (filters.contract_expiration_from || filters.contract_expiration_to) {
    filteredData = reportData.filter((row) => {
      if (!row.contract_expiration_date) return false

      if (filters.contract_expiration_from) {
        if (row.contract_expiration_date < filters.contract_expiration_from) {
          return false
        }
      }

      if (filters.contract_expiration_to) {
        if (row.contract_expiration_date > filters.contract_expiration_to) {
          return false
        }
      }

      return true
    })
  }

  return filteredData
}

/**
 * GET /api/reports/payment-plans/export
 *
 * Exports payment plans report to CSV format.
 *
 * Query parameters:
 * - format: "csv" (required)
 * - date_from, date_to: ISO date strings (optional)
 * - college_id, branch_id, student_id: UUIDs (optional, can be multiple)
 * - status[]: Array of payment status strings (optional)
 * - contract_expiration_from, contract_expiration_to: ISO date strings (optional)
 * - columns[]: Array of column keys (optional, defaults to all columns)
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

    // Validate format parameter
    if (format !== 'csv') {
      throw new ValidationError('Invalid or missing format parameter. Only "csv" is supported.')
    }

    // Extract filters
    const filters = {
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      college_ids: searchParams.getAll('college_id'),
      branch_ids: searchParams.getAll('branch_id'),
      student_ids: searchParams.getAll('student_id'),
      status: searchParams.getAll('status[]') as PaymentPlanStatus[],
      contract_expiration_from: searchParams.get('contract_expiration_from'),
      contract_expiration_to: searchParams.get('contract_expiration_to'),
    }

    // Validate date ranges
    if (filters.date_from && filters.date_to) {
      if (new Date(filters.date_from) > new Date(filters.date_to)) {
        throw new ValidationError('Start date must be before or equal to end date')
      }
    }

    if (filters.contract_expiration_from && filters.contract_expiration_to) {
      if (new Date(filters.contract_expiration_from) > new Date(filters.contract_expiration_to)) {
        throw new ValidationError(
          'Contract expiration start date must be before or equal to end date'
        )
      }
    }

    // Extract selected columns
    const selectedColumns = searchParams.getAll('columns[]')
    const columns = selectedColumns.length > 0 ? selectedColumns : DEFAULT_COLUMNS

    // Validate columns
    for (const column of columns) {
      if (!COLUMN_HEADERS[column]) {
        throw new ValidationError(`Invalid column: ${column}`)
      }
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // First, count total rows to determine if we should use streaming
    let countQuery = supabase
      .from('payment_plans')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', userAgencyId)

    // Apply same filters to count query
    if (filters.date_from) {
      countQuery = countQuery.gte('start_date', filters.date_from)
    }

    if (filters.date_to) {
      countQuery = countQuery.lte('start_date', filters.date_to)
    }

    if (filters.status && filters.status.length > 0) {
      countQuery = countQuery.in('status', filters.status)
    }

    if (filters.student_ids && filters.student_ids.length > 0) {
      countQuery = countQuery.in('enrollments.student_id', filters.student_ids)
    }

    if (filters.branch_ids && filters.branch_ids.length > 0) {
      countQuery = countQuery.in('enrollments.branches.id', filters.branch_ids)
    }

    if (filters.college_ids && filters.college_ids.length > 0) {
      countQuery = countQuery.in('enrollments.branches.college_id', filters.college_ids)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Failed to count payment plans:', countError)
      throw new Error('Failed to count payment plans')
    }

    const totalRows = count || 0

    // Handle empty results
    if (totalRows === 0) {
      return exportAsCSV([], columns)
    }

    // Choose streaming vs synchronous based on dataset size
    if (totalRows > STREAMING_THRESHOLD) {
      console.log(`Using streaming export for ${totalRows} rows`)

      // Log export activity asynchronously (don't await to avoid blocking response)
      logReportExport({
        client: supabase,
        agencyId: userAgencyId,
        userId: user.id,
        reportType: 'payment_plans',
        format: 'csv',
        rowCount: totalRows,
        filters,
        columns,
      }).catch((error) => {
        console.error('Failed to log export activity:', error)
        // Swallow error - logging failures shouldn't break export
      })

      // Use streaming approach for large datasets
      return exportAsCSVStream(
        async function* () {
          // Create generator that yields batches
          for await (const batch of queryPaymentPlansBatch(
            supabase,
            userAgencyId,
            filters,
            BATCH_SIZE
          )) {
            yield batch
          }
        },
        columns,
        totalRows
      )
    } else {
      console.log(`Using synchronous export for ${totalRows} rows`)

      // Use synchronous approach for small datasets
      let baseQuery = supabase
        .from('payment_plans')
        .select(
          `
        id,
        reference_number,
        total_amount,
        currency,
        commission_rate_percent,
        expected_commission,
        status,
        start_date,
        created_at,
        updated_at,
        enrollments!inner (
          id,
          program_name,
          contract_expiration_date,
          student_id,
          students!inner (
            id,
            name
          ),
          branches!inner (
            id,
            name,
            college_id,
            colleges!inner (
              id,
              name
            )
          )
        )
      `
        )
        .eq('agency_id', userAgencyId)

      // Apply filters dynamically
      if (filters.date_from) {
        baseQuery = baseQuery.gte('start_date', filters.date_from)
      }

      if (filters.date_to) {
        baseQuery = baseQuery.lte('start_date', filters.date_to)
      }

      if (filters.status && filters.status.length > 0) {
        baseQuery = baseQuery.in('status', filters.status)
      }

      if (filters.student_ids && filters.student_ids.length > 0) {
        baseQuery = baseQuery.in('enrollments.student_id', filters.student_ids)
      }

      if (filters.branch_ids && filters.branch_ids.length > 0) {
        baseQuery = baseQuery.in('enrollments.branches.id', filters.branch_ids)
      }

      if (filters.college_ids && filters.college_ids.length > 0) {
        baseQuery = baseQuery.in('enrollments.branches.college_id', filters.college_ids)
      }

      // Execute the query
      const { data: paymentPlans, error } = await baseQuery

      if (error) {
        console.error('Failed to fetch payment plans for export:', error)
        throw new Error('Failed to fetch payment plans')
      }

      if (!paymentPlans || paymentPlans.length === 0) {
        return exportAsCSV([], columns)
      }

      // Transform the data
      const filteredData = transformPaymentPlansData(paymentPlans, filters)

      // Log export activity asynchronously (don't await to avoid blocking response)
      logReportExport({
        client: supabase,
        agencyId: userAgencyId,
        userId: user.id,
        reportType: 'payment_plans',
        format: 'csv',
        rowCount: filteredData.length,
        filters,
        columns,
      }).catch((error) => {
        console.error('Failed to log export activity:', error)
        // Swallow error - logging failures shouldn't break export
      })

      // Export as CSV
      return exportAsCSV(filteredData, columns)
    }
  } catch (error) {
    return handleApiError(error, {
      path: '/api/reports/payment-plans/export',
    })
  }
}

/**
 * Format data as CSV and return with proper headers
 *
 * AC #4: Currency amounts formatted correctly (decimal format "1234.56")
 * AC #5: Dates in ISO format (YYYY-MM-DD)
 * AC #6: Filename includes report type and timestamp
 *
 * @param data - Report data rows
 * @param columns - Selected columns to include
 * @returns Response with CSV file download
 */
function exportAsCSV(data: PaymentPlanReportRow[], columns: string[]): Response {
  // Generate timestamp for filename (YYYY-MM-DD_HHmmss)
  const now = new Date()
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const filename = `payment_plans_${timestamp}.csv`

  // Build CSV headers
  const headers = columns.map((col) => COLUMN_HEADERS[col])

  // Build CSV rows
  const rows = data.map((row) => {
    return columns.map((col) => {
      const value = row[col as keyof PaymentPlanReportRow]

      // Handle null/undefined values
      if (value === null || value === undefined) {
        return ''
      }

      // Format currency amounts as decimal (AC #4)
      if (
        col === 'plan_amount' ||
        col === 'expected_commission' ||
        col === 'total_paid' ||
        col === 'total_remaining' ||
        col === 'earned_commission'
      ) {
        return Number(value).toFixed(2)
      }

      // Format dates in ISO format YYYY-MM-DD (AC #5)
      if (
        col === 'start_date' ||
        col === 'contract_expiration_date' ||
        col === 'created_at' ||
        col === 'updated_at'
      ) {
        return String(value).split('T')[0] // Extract date part only
      }

      // Format percentage
      if (col === 'commission_rate_percent') {
        return Number(value).toString()
      }

      return String(value)
    })
  })

  // Generate CSV content with UTF-8 BOM for Excel compatibility
  const csvData = [headers, ...rows]
  const csvContent = stringify(csvData, {
    quoted: true, // Quote all fields to handle commas in data
    quoted_string: true,
  })

  // Add UTF-8 BOM for Excel compatibility
  const bom = '\uFEFF'
  const csvWithBom = bom + csvContent

  // Return CSV response with proper headers (AC #6)
  return new Response(csvWithBom, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  })
}
