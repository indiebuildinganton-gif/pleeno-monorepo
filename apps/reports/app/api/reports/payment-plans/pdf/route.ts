/**
 * Payment Plans PDF Export API Route
 *
 * Story 7.3: PDF Export Functionality
 * Task 6: Add Summary Totals Section
 *
 * This endpoint exports payment plans reports to PDF format with:
 * - Flexible filtering (dates, colleges, branches, students, status, contract expiration)
 * - Professional formatting with logo and metadata
 * - Data table with pagination
 * - Summary totals section on last page (Task 6 specific)
 * - RLS enforcement (automatic agency filtering)
 */

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import { handleApiError, ForbiddenError, ValidationError } from '@pleeno/utils'
import { calculateExpectedCommission } from '@pleeno/utils'
import { logReportExport } from '@pleeno/database/activity-logger'
import { PDFReportDocument, generatePDFFilename, type PDFTableColumn } from '@pleeno/ui'
import type {
  PaymentPlanReportRow,
  ContractStatus,
  PaymentPlanStatus,
} from '../../../types/payment-plans-report'

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
 * Column definitions for PDF table
 */
const PDF_COLUMNS: PDFTableColumn[] = [
  { key: 'reference_number', label: 'Reference', width: '10%', align: 'left' },
  { key: 'student_name', label: 'Student', width: '15%', align: 'left' },
  { key: 'college_name', label: 'College', width: '15%', align: 'left' },
  { key: 'branch_name', label: 'Branch', width: '12%', align: 'left' },
  { key: 'program_name', label: 'Program', width: '15%', align: 'left' },
  { key: 'plan_amount', label: 'Plan Amount', width: '10%', align: 'right', format: 'currency' },
  {
    key: 'expected_commission',
    label: 'Expected Comm.',
    width: '10%',
    align: 'right',
    format: 'currency',
  },
  {
    key: 'earned_commission',
    label: 'Earned Comm.',
    width: '10%',
    align: 'right',
    format: 'currency',
  },
  { key: 'status', label: 'Status', width: '8%', align: 'left' },
]

/**
 * Transform raw payment plan data into report format
 *
 * @param paymentPlans - Raw payment plan data from database
 * @param filters - Export filters (for contract expiration filtering)
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
      today.setHours(0, 0, 0, 0)

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

    // Calculate payment tracking
    const totalPaid = 0 // TODO: Sum from installments table when available
    const totalRemaining = plan.total_amount - totalPaid
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
 * GET /api/reports/payment-plans/pdf
 *
 * Exports payment plans report to PDF format with summary totals (Task 6).
 *
 * Query parameters:
 * - date_from, date_to: ISO date strings (optional)
 * - college_id, branch_id, student_id: UUIDs (optional, can be multiple)
 * - status[]: Array of payment status strings (optional)
 * - contract_expiration_from, contract_expiration_to: ISO date strings (optional)
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS automatically filters by agency_id
 * - All queries scoped to user's agency
 *
 * @param request - Next.js request object
 * @returns PDF file download or error response
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url)

    // Extract filters
    const filters: ExportFilters = {
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

    // Create Supabase client
    const supabase = await createServerClient()

    // Build query for all payment plans
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

    // Sort by start date descending
    baseQuery = baseQuery.order('start_date', { ascending: false })

    // Execute the query
    const { data: paymentPlans, error } = await baseQuery

    if (error) {
      console.error('Failed to fetch payment plans for PDF export:', error)
      throw new Error('Failed to fetch payment plans')
    }

    if (!paymentPlans || paymentPlans.length === 0) {
      // Return PDF with empty data message
      const filteredData: PaymentPlanReportRow[] = []

      // Generate PDF
      const pdfDocument = PDFReportDocument({
        header: {
          title: 'Payment Plans Report',
          subtitle: 'Commission Tracking and Analysis',
          generatedAt: new Date(),
          agencyName: user.app_metadata?.agency_name || 'Agency',
        },
        columns: PDF_COLUMNS,
        data: filteredData,
        currency: 'AUD',
        rowsPerPage: 30,
      })

      const pdfBuffer = await renderToBuffer(pdfDocument)
      const filename = generatePDFFilename('payment_plans')

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Transform the data
    const filteredData = transformPaymentPlansData(paymentPlans, filters)

    // Log export activity asynchronously
    logReportExport({
      client: supabase,
      agencyId: userAgencyId,
      userId: user.id,
      reportType: 'payment_plans',
      format: 'pdf',
      rowCount: filteredData.length,
      filters,
      columns: PDF_COLUMNS.map((c) => c.key),
    }).catch((error) => {
      console.error('Failed to log export activity:', error)
    })

    // Generate PDF using PDFReportDocument component
    // This includes the summary totals section on the last page (Task 6)
    const pdfDocument = PDFReportDocument({
      header: {
        title: 'Payment Plans Report',
        subtitle: 'Commission Tracking and Analysis',
        generatedAt: new Date(),
        agencyName: user.app_metadata?.agency_name || 'Agency',
      },
      columns: PDF_COLUMNS,
      data: filteredData,
      currency: filteredData[0]?.currency || 'AUD',
      rowsPerPage: 30,
    })

    // Render PDF to buffer
    const pdfBuffer = await renderToBuffer(pdfDocument)

    // Generate filename with timestamp
    const filename = generatePDFFilename('payment_plans')

    // Return PDF response
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/reports/payment-plans/pdf',
    })
  }
}
