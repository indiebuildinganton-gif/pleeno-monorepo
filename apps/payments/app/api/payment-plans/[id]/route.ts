/**
 * Payment Plan Detail API - Get Operation
 *
 * This endpoint provides detailed payment plan information with related data.
 *
 * Epic 4: Payments Domain
 * Story 4.1: Payment Plan Creation
 * Task 03: Payment Plan API Routes
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'

/**
 * GET /api/payment-plans/[id]
 *
 * Returns detailed information about a specific payment plan including:
 * - Payment plan details
 * - Associated enrollment with student, branch, and college information
 *
 * The response includes joined data for a complete payment plan view.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "enrollment_id": "uuid",
 *     "agency_id": "uuid",
 *     "total_amount": 10000.50,
 *     "currency": "AUD",
 *     "start_date": "2025-01-15",
 *     "commission_rate_percent": 15,
 *     "expected_commission": 1500.08,
 *     "status": "active",
 *     "notes": "Optional notes",
 *     "reference_number": "REF-123",
 *     "created_at": "2025-01-13T...",
 *     "updated_at": "2025-01-13T...",
 *     "enrollment": {
 *       "id": "uuid",
 *       "program_name": "Bachelor of Computer Science",
 *       "status": "active",
 *       "student": {
 *         "id": "uuid",
 *         "first_name": "John",
 *         "last_name": "Doe"
 *       },
 *       "branch": {
 *         "id": "uuid",
 *         "city": "Sydney",
 *         "commission_rate_percent": 15,
 *         "college": {
 *           "id": "uuid",
 *           "name": "University of Sydney"
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not authorized
 * - 404: Payment plan not found or belongs to different agency (RLS)
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure payment plan belongs to user's agency
 * - Returns 404 if payment plan not found or belongs to different agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing payment plan ID
 * @returns Payment plan detail with enrollment or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createServerClient()

    // SECURITY BOUNDARY: Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    // Get user's agency_id
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Fetch payment plan with RLS enforcement
    const { data: paymentPlan, error: paymentPlanError } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('id', id)
      .eq('agency_id', userAgencyId) // Explicit agency check
      .single()

    if (paymentPlanError || !paymentPlan) {
      throw new ValidationError('Payment plan not found')
    }

    // Fetch enrollment with joined student, branch, and college data
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        program_name,
        status,
        student:students (
          id,
          full_name
        ),
        branch:branches (
          id,
          city,
          commission_rate_percent,
          college:colleges (
            id,
            name
          )
        )
      `
      )
      .eq('id', paymentPlan.enrollment_id)
      .eq('agency_id', userAgencyId)
      .single()

    if (enrollmentError) {
      console.error('Failed to fetch enrollment:', enrollmentError)
      // Don't fail the request, just return payment plan without enrollment details
    }

    // Parse student full_name into first_name and last_name for response format
    let studentData = null
    if (enrollment?.student) {
      const fullName = enrollment.student.full_name || ''
      const nameParts = fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      studentData = {
        id: enrollment.student.id,
        first_name: firstName,
        last_name: lastName,
      }
    }

    // Combine payment plan data with enrollment
    const paymentPlanWithEnrollment = {
      ...paymentPlan,
      enrollment: enrollment
        ? {
            id: enrollment.id,
            program_name: enrollment.program_name,
            status: enrollment.status,
            student: studentData,
            branch: enrollment.branch,
          }
        : null,
    }

    return createSuccessResponse(paymentPlanWithEnrollment)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/payment-plans/${id}`,
    })
  }
}
