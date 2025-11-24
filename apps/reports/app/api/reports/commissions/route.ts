/**
 * Commissions Report API Route
 *
 * Story 7.4: Commission Report by College
 * Task 2: Implement Commission Report API Route
 *
 * This endpoint generates commission reports grouped by college and branch with:
 * - Date range filtering (required: date_from, date_to)
 * - Optional city filtering
 * - Aggregated commission data (earned, outstanding)
 * - Drill-down student payment plan details
 * - RLS enforcement (automatic agency filtering)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'
import { handleApiError, ForbiddenError, ValidationError } from '@pleeno/utils'
import type {
  CommissionsReportRequest,
  CommissionsReportResponse,
  CommissionReportRow,
  CommissionsSummary,
} from '../../../types/commissions-report'

/**
 * POST /api/reports/commissions
 *
 * Generates a commission report grouped by college and branch with filtering and summaries.
 *
 * Request body: CommissionsReportRequest
 * - date_from: string (required, ISO date format YYYY-MM-DD)
 * - date_to: string (required, ISO date format YYYY-MM-DD)
 * - city?: string (optional city filter)
 *
 * Response: CommissionsReportResponse with data and summary
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS automatically filters by agency_id
 * - All queries scoped to user's agency
 *
 * @param request - Next.js request object
 * @returns Commission report data or error response
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
    const body: CommissionsReportRequest = await request.json()

    // Validate required fields
    if (!body.date_from || !body.date_to) {
      throw new ValidationError('Date range is required', {
        errors: {
          date_from: !body.date_from ? ['Start date is required'] : undefined,
          date_to: !body.date_to ? ['End date is required'] : undefined,
        },
      })
    }

    // Validate date format (basic check)
    const dateFromValid = /^\d{4}-\d{2}-\d{2}$/.test(body.date_from)
    const dateToValid = /^\d{4}-\d{2}-\d{2}$/.test(body.date_to)

    if (!dateFromValid || !dateToValid) {
      throw new ValidationError('Invalid date format. Expected YYYY-MM-DD', {
        errors: {
          date_from: !dateFromValid ? ['Invalid date format'] : undefined,
          date_to: !dateToValid ? ['Invalid date format'] : undefined,
        },
      })
    }

    // Validate date range (date_from should be before or equal to date_to)
    if (new Date(body.date_from) > new Date(body.date_to)) {
      throw new ValidationError('Start date must be before or equal to end date', {
        errors: {
          date_from: ['Start date must be before or equal to end date'],
        },
      })
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Call the database function to get commission report
    const { data: reportData, error } = await supabase.rpc('get_commission_report', {
      p_agency_id: userAgencyId,
      p_date_from: body.date_from,
      p_date_to: body.date_to,
      p_city: body.city || null,
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

    // Calculate summary totals
    const summary: CommissionsSummary = {
      total_paid: data.reduce((sum, row) => sum + row.total_paid, 0),
      total_earned: data.reduce((sum, row) => sum + row.earned_commission, 0),
      total_outstanding: data.reduce((sum, row) => sum + row.outstanding_commission, 0),
    }

    // Prepare response
    const response: CommissionsReportResponse = {
      data,
      summary,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/reports/commissions',
    })
  }
}
