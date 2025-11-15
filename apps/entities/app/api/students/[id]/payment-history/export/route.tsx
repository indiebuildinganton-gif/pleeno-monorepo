/**
 * Student Payment History PDF Export API Route
 *
 * Story 7.5: Student Payment History Report
 * Task 5: Implement PDF Export API Route
 *
 * This endpoint exports student payment history to PDF format with:
 * - Student details and agency branding
 * - Payment plans grouped with installments
 * - Summary totals (paid, outstanding, percentage)
 * - Optional date range filtering
 * - RLS enforcement (automatic agency filtering)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import {
  handleApiError,
  ForbiddenError,
  ValidationError,
  generatePDF,
  fetchAgencyLogo,
  generateTimestampedFilename,
} from '@pleeno/utils'
import { StudentPaymentStatementPDF } from '@/components/StudentPaymentStatementPDF'

/**
 * GET /api/students/[id]/payment-history/export
 *
 * Exports student payment history to PDF format.
 *
 * Route parameters:
 * - id: Student UUID
 *
 * Query parameters:
 * - format: "pdf" (required)
 * - date_from: ISO date string YYYY-MM-DD (optional, defaults to 1970-01-01)
 * - date_to: ISO date string YYYY-MM-DD (optional, defaults to today)
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS automatically filters by agency_id
 * - All queries scoped to user's agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters with student id
 * @returns PDF file download or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get student ID from route params
    const { id: studentId } = await params

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')
    const date_from = searchParams.get('date_from') || '1970-01-01'
    const date_to =
      searchParams.get('date_to') || new Date().toISOString().split('T')[0]

    // Validate format parameter
    if (format !== 'pdf') {
      throw new ValidationError(
        'Invalid format parameter. Only "pdf" is supported.'
      )
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Fetch student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name, passport_number, email')
      .eq('id', studentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch agency info for PDF header
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('name, logo_url, contact_email, contact_phone')
      .eq('id', userAgencyId)
      .single()

    if (agencyError || !agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      )
    }

    // Fetch agency logo if available and convert to data URL
    const logoDataUrl = await fetchAgencyLogo(agency.logo_url)

    // Fetch payment history using the database function
    const { data: paymentHistoryData, error: historyError } = await supabase.rpc(
      'get_student_payment_history',
      {
        p_student_id: studentId,
        p_agency_id: userAgencyId,
        p_date_from: date_from,
        p_date_to: date_to,
      }
    )

    if (historyError) {
      console.error('Payment history error:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch payment history' },
        { status: 500 }
      )
    }

    // Group installments by payment plan
    const paymentPlansMap = new Map<string, any>()

    if (paymentHistoryData && paymentHistoryData.length > 0) {
      paymentHistoryData.forEach((row: any) => {
        const planId = row.payment_plan_id

        if (!paymentPlansMap.has(planId)) {
          paymentPlansMap.set(planId, {
            payment_plan_id: planId,
            college_name: row.college_name,
            branch_name: row.branch_name,
            program_name: row.program_name,
            plan_total_amount: parseFloat(row.plan_total_amount),
            plan_start_date: row.plan_start_date,
            installments: [],
          })
        }

        // Add installment if it exists
        if (row.installment_id) {
          paymentPlansMap.get(planId)!.installments.push({
            installment_id: row.installment_id,
            installment_number: row.installment_number,
            amount: parseFloat(row.amount),
            due_date: row.due_date,
            paid_at: row.paid_at,
            paid_amount: row.paid_amount ? parseFloat(row.paid_amount) : null,
            status: row.status,
          })
        }
      })
    }

    const paymentHistory = Array.from(paymentPlansMap.values())

    // Calculate summary
    let total_paid = 0
    let total_outstanding = 0

    paymentHistory.forEach((plan) => {
      plan.installments.forEach((inst: any) => {
        if (inst.paid_amount) {
          total_paid += inst.paid_amount
        }
        if (!inst.paid_at && inst.status !== 'cancelled') {
          total_outstanding += inst.amount
        }
      })
    })

    const total = total_paid + total_outstanding
    const percentage_paid = total > 0 ? (total_paid / total) * 100 : 0

    const summary = {
      total_paid,
      total_outstanding,
      percentage_paid,
    }

    // Generate PDF using shared utility
    const pdfDocument = (
      <StudentPaymentStatementPDF
        student={student}
        paymentHistory={paymentHistory}
        summary={summary}
        filters={{ date_from, date_to }}
        agency={{ ...agency, logo_url: logoDataUrl }}
      />
    )

    // Render PDF to stream using shared utility
    const stream = await generatePDF(pdfDocument)

    // Generate filename using shared utility
    const filename = generateTimestampedFilename('payment_statement', student.full_name)

    // Set response headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Cache-Control', 'no-cache')

    // Return PDF stream
    return new NextResponse(stream as any, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return handleApiError(error, {
      path: `/api/students/${(await params).id}/payment-history/export`,
    })
  }
}
