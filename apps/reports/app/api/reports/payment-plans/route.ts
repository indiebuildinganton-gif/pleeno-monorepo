/**
 * Payment Plans Report API Route
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 3: Create Payment Plans Report API Route
 *
 * This endpoint generates comprehensive payment plans reports with:
 * - Flexible filtering (dates, colleges, branches, students, status, contract expiration)
 * - Server-side pagination
 * - Dynamic sorting
 * - Computed fields (total paid, earned commission, contract expiration tracking)
 * - Summary totals
 * - RLS enforcement (automatic agency filtering)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'
import { handleApiError, ForbiddenError, ValidationError } from '@pleeno/utils'
import { calculateExpectedCommission } from '@pleeno/utils'
import { reportBuilderSchema } from '../../../validations/report-builder.schema'
import type {
  PaymentPlansReportRequest,
  PaymentPlansReportResponse,
  PaymentPlanReportRow,
  ContractStatus,
} from '../../../types/payment-plans-report'

/**
 * POST /api/reports/payment-plans
 *
 * Generates a payment plans report with filtering, pagination, sorting, and summaries.
 *
 * Request body: PaymentPlansReportRequest (validated by Zod schema)
 * Response: PaymentPlansReportResponse with data, pagination, and summary
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS automatically filters by agency_id
 * - All queries scoped to user's agency
 *
 * @param request - Next.js request object
 * @returns Report data or error response
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = reportBuilderSchema.safeParse(body)

    if (!validationResult.success) {
      throw new ValidationError('Validation failed', {
        errors: validationResult.error.flatten().fieldErrors,
      })
    }

    const validatedData: PaymentPlansReportRequest = validationResult.data

    // Create Supabase client
    const supabase = await createServerClient()

    // Extract filters, pagination, and sort
    const { filters, pagination, sort } = validatedData
    const { page, page_size } = pagination

    // Calculate offset for pagination
    const offset = (page - 1) * page_size

    // Build the main query with all joins and computed fields
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
      `,
        { count: 'exact' }
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

    // Apply sorting
    const sortColumn = sort?.column || 'created_at'
    const sortDirection = sort?.direction === 'asc'

    baseQuery = baseQuery.order(sortColumn, { ascending: sortDirection })

    // Apply pagination
    baseQuery = baseQuery.range(offset, offset + page_size - 1)

    // Execute the query
    const { data: paymentPlans, error, count } = await baseQuery

    if (error) {
      console.error('Failed to fetch payment plans:', error)
      throw new Error('Failed to fetch payment plans')
    }

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / page_size) : 0

    // Transform the data and calculate computed fields
    const reportData: PaymentPlanReportRow[] = (paymentPlans || []).map((plan: any) => {
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
      const earnedCommission = calculateExpectedCommission(
        totalPaid,
        plan.commission_rate_percent
      )

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

    // Calculate summary totals (for the entire dataset, not just current page)
    // We need a separate query for this
    const { data: summaryData, error: summaryError } = await supabase
      .from('payment_plans')
      .select('total_amount, expected_commission')
      .eq('agency_id', userAgencyId)

    if (summaryError) {
      console.error('Failed to fetch summary data:', summaryError)
      throw new Error('Failed to calculate summary totals')
    }

    const totalPlanAmount = summaryData?.reduce((sum, plan) => sum + plan.total_amount, 0) || 0
    const totalCommission = summaryData?.reduce((sum, plan) => sum + plan.expected_commission, 0) || 0
    const totalPaidAmount = 0 // TODO: Calculate from installments table when available

    // Prepare response
    const response: PaymentPlansReportResponse = {
      data: filteredData,
      pagination: {
        page,
        page_size,
        total_count: count || 0,
        total_pages: totalPages,
      },
      summary: {
        total_plan_amount: totalPlanAmount,
        total_paid_amount: totalPaidAmount,
        total_commission: totalCommission,
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/reports/payment-plans',
    })
  }
}
