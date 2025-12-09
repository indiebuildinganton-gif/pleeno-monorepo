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
    console.log('Validated request data:', JSON.stringify(validatedData, null, 2))

    // Create Supabase client
    const supabase = await createServerClient()

    // Extract filters, pagination, and sort
    const { filters, pagination, sort } = validatedData
    const { page, page_size } = pagination

    // Calculate offset for pagination
    const offset = (page - 1) * page_size

    // Build the main query - fetch payment plans first
    // Note: Using simpler query to avoid PostgREST join ambiguity with students_2
    let baseQuery = supabase
      .from('payment_plans')
      .select('*, enrollments(id, program_name, student_id, branch_id)', { count: 'exact' })
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

    // Note: Cannot filter on nested relationships directly in PostgREST
    // Need to filter on payment_plans table columns that reference enrollments
    // Since payment_plans has enrollment_id, we'll need to do a subquery approach
    // or filter the results in-memory after fetching

    // For now, we'll fetch all matching payment_plans and filter in-memory
    // TODO: Optimize this with a more efficient query structure if needed

    // Apply sorting
    const sortColumn = sort?.column || 'created_at'
    const sortDirection = sort?.direction === 'asc'

    baseQuery = baseQuery.order(sortColumn, { ascending: sortDirection })

    // Apply pagination
    baseQuery = baseQuery.range(offset, offset + page_size - 1)

    // Execute the query
    const { data: paymentPlans, error, count } = await baseQuery

    if (error) {
      console.error('Failed to fetch payment plans:', JSON.stringify(error, null, 2))
      console.error('Error details:', error.message, error.details, error.hint, error.code)
      throw new Error(`Failed to fetch payment plans: ${error.message || error.details || 'Unknown error'}`)
    }

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / page_size) : 0

    // Fetch related data separately to avoid PostgREST join issues
    // Get unique student IDs, branch IDs
    const studentIds = [...new Set(paymentPlans?.map((p: any) => p.enrollments?.student_id).filter(Boolean))]
    const branchIds = [...new Set(paymentPlans?.map((p: any) => p.enrollments?.branch_id).filter(Boolean))]

    // Fetch students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, full_name')
      .in('id', studentIds.length > 0 ? studentIds : [''])

    if (studentsError) {
      console.error('Failed to fetch students:', studentsError)
      throw new Error('Failed to fetch student data')
    }

    // Fetch branches with colleges
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name, college_id, colleges(id, name, contract_expiration_date)')
      .in('id', branchIds.length > 0 ? branchIds : [''])

    if (branchesError) {
      console.error('Failed to fetch branches:', branchesError)
      throw new Error('Failed to fetch branch data')
    }

    // Create lookup maps
    const studentMap = new Map(students?.map((s) => [s.id, s]) || [])
    const branchMap = new Map(branches?.map((b) => [b.id, b]) || [])

    // Transform the data and calculate computed fields
    const reportData: PaymentPlanReportRow[] = (paymentPlans || [])
      .map((plan: any) => {
        const enrollment = plan.enrollments
        if (!enrollment) return null // Skip if no enrollment data

        const student = studentMap.get(enrollment.student_id)
        const branch = branchMap.get(enrollment.branch_id)
        const college = (branch as any)?.colleges

        if (!student || !branch || !college) return null // Skip if missing related data

        // Calculate contract expiration details
        let daysUntilExpiration: number | null = null
        let contractStatus: ContractStatus | null = null

        if (college.contract_expiration_date) {
          const expirationDate = new Date(college.contract_expiration_date)
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
          student_name: (student as any).full_name,
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
          contract_expiration_date: college.contract_expiration_date,
          days_until_contract_expiration: daysUntilExpiration,
          contract_status: contractStatus,
          start_date: plan.start_date,
          created_at: plan.created_at,
          updated_at: plan.updated_at,
        }
      })
      .filter((row): row is PaymentPlanReportRow => row !== null)

    // Apply filters after transformation (for nested relationships and computed fields)
    let filteredData = reportData

    // Filter by student IDs
    if (filters.student_ids && filters.student_ids.length > 0) {
      filteredData = filteredData.filter((row) => filters.student_ids!.includes(row.student_id))
    }

    // Filter by branch IDs
    if (filters.branch_ids && filters.branch_ids.length > 0) {
      filteredData = filteredData.filter((row) =>
        row.branch_id ? filters.branch_ids!.includes(row.branch_id) : false
      )
    }

    // Filter by college IDs
    if (filters.college_ids && filters.college_ids.length > 0) {
      filteredData = filteredData.filter((row) => filters.college_ids!.includes(row.college_id))
    }

    // Filter by contract expiration dates
    if (filters.contract_expiration_from || filters.contract_expiration_to) {
      filteredData = filteredData.filter((row) => {
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
