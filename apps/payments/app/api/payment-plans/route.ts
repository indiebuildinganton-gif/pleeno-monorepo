/**
 * Payment Plan API - Create Operation
 *
 * This endpoint provides payment plan creation with validation and auto-population.
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
  ForbiddenError,
  calculateExpectedCommission,
  logAudit,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { logActivity } from '@pleeno/database'
import { requireRole } from '@pleeno/auth'
import { PaymentPlanCreateSchema } from '@pleeno/validations'

/**
 * POST /api/payment-plans
 *
 * Creates a new payment plan with auto-population of agency_id and commission_rate.
 *
 * Request body:
 * {
 *   "enrollment_id": "uuid",           // Required: Must exist and belong to same agency
 *   "total_amount": 10000.50,          // Required: Must be > 0
 *   "start_date": "2025-01-15",        // Required: ISO date format (YYYY-MM-DD)
 *   "notes": "Optional notes",         // Optional: Max 10,000 characters
 *   "reference_number": "REF-123"      // Optional: Max 255 characters
 * }
 *
 * Response (201 Created):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "enrollment_id": "uuid",
 *     "agency_id": "uuid",              // Auto-populated from session
 *     "total_amount": 10000.50,
 *     "currency": "AUD",
 *     "start_date": "2025-01-15",
 *     "commission_rate_percent": 15,    // Auto-populated from branch
 *     "expected_commission": 1500.08,   // Auto-calculated
 *     "status": "active",
 *     "notes": "Optional notes",
 *     "reference_number": "REF-123",
 *     "created_at": "2025-01-13T...",
 *     "updated_at": "2025-01-13T..."
 *   }
 * }
 *
 * Error responses:
 * - 400: Validation error (invalid fields, enrollment not found, enrollment from different agency)
 * - 401: Not authenticated
 * - 403: Not authorized
 *
 * Security:
 * - Requires authentication with agency_admin or agency_user role
 * - RLS policies automatically enforce agency_id filtering
 * - Validates enrollment belongs to same agency
 * - Commission rate auto-populated from branch (prevents manipulation)
 *
 * @param request - Next.js request object
 * @returns Created payment plan object or error response
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
    const result = PaymentPlanCreateSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validatedData = result.data

    // Create Supabase client
    const supabase = await createServerClient()

    // VALIDATION: Verify enrollment exists and belongs to same agency
    // Also fetch commission_rate_percent from branch for auto-population
    // Fetch additional details for audit trail metadata
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        agency_id,
        program_name,
        student:students (
          first_name,
          last_name
        ),
        branch:branches (
          commission_rate_percent,
          city,
          college:colleges (
            name
          )
        )
      `
      )
      .eq('id', validatedData.enrollment_id)
      .single()

    if (enrollmentError || !enrollment) {
      throw new ValidationError('Enrollment not found', {
        errors: {
          enrollment_id: ['Enrollment with this ID does not exist'],
        },
      })
    }

    // SECURITY: Verify enrollment belongs to same agency
    if (enrollment.agency_id !== userAgencyId) {
      throw new ValidationError('Enrollment not found', {
        errors: {
          enrollment_id: [
            'Enrollment does not belong to your agency or does not exist',
          ],
        },
      })
    }

    // Extract commission rate from branch
    const commissionRatePercent = enrollment.branch?.commission_rate_percent

    if (commissionRatePercent === null || commissionRatePercent === undefined) {
      throw new ValidationError(
        'Branch commission rate not configured for this enrollment'
      )
    }

    // VALIDATION: Verify commission rate is within valid range (0-100)
    if (commissionRatePercent < 0 || commissionRatePercent > 100) {
      throw new ValidationError(
        'Branch commission rate must be between 0 and 100 percent'
      )
    }

    // Calculate expected commission
    const expectedCommission = calculateExpectedCommission(
      validatedData.total_amount,
      commissionRatePercent
    )

    // Create payment plan record
    // RLS policies will enforce agency_id filtering
    const { data: paymentPlan, error: insertError } = await supabase
      .from('payment_plans')
      .insert({
        enrollment_id: validatedData.enrollment_id,
        agency_id: userAgencyId,
        total_amount: validatedData.total_amount,
        currency: 'AUD', // Default currency
        start_date: validatedData.start_date,
        commission_rate_percent: commissionRatePercent,
        expected_commission: expectedCommission,
        status: 'active',
        notes: validatedData.notes || null,
        reference_number: validatedData.reference_number || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create payment plan:', insertError)
      throw new Error('Failed to create payment plan')
    }

    if (!paymentPlan) {
      throw new Error('Payment plan not found after creation')
    }

    // Log payment plan creation to audit trail with comprehensive details
    // This provides transparency for commission calculations and compliance tracking
    await logAudit(supabase, {
      userId: user.id,
      agencyId: userAgencyId,
      entityType: 'payment_plan',
      entityId: paymentPlan.id,
      action: 'create',
      newValues: {
        enrollment_id: paymentPlan.enrollment_id,
        total_amount: paymentPlan.total_amount,
        currency: paymentPlan.currency,
        start_date: paymentPlan.start_date,
        commission_rate_percent: paymentPlan.commission_rate_percent,
        expected_commission: paymentPlan.expected_commission,
        status: paymentPlan.status,
        notes: paymentPlan.notes,
        reference_number: paymentPlan.reference_number,
      },
      metadata: {
        // Include commission calculation parameters for transparency
        commission_calculation: {
          formula: 'total_amount * (commission_rate_percent / 100)',
          total_amount: paymentPlan.total_amount,
          commission_rate_percent: paymentPlan.commission_rate_percent,
          expected_commission: paymentPlan.expected_commission,
        },
        // Include enrollment context for audit trail
        enrollment: {
          enrollment_id: enrollment.id,
          student_name: enrollment.student
            ? `${enrollment.student.first_name} ${enrollment.student.last_name}`
            : 'Unknown',
          college_name: enrollment.branch?.college?.name || 'Unknown',
          branch_city: enrollment.branch?.city || 'Unknown',
          program_name: enrollment.program_name || 'Unknown',
        },
      },
    })

    // Log activity for Recent Activity Feed (Story 6.4)
    const studentName = enrollment.student
      ? `${enrollment.student.first_name} ${enrollment.student.last_name}`
      : 'Unknown Student'
    const collegeName = enrollment.branch?.college?.name || 'Unknown College'

    await logActivity(supabase, {
      agencyId: userAgencyId,
      userId: user.id,
      entityType: 'payment_plan',
      entityId: paymentPlan.id,
      action: 'created',
      description: `created payment plan for ${studentName} at ${collegeName}`,
      metadata: {
        student_name: studentName,
        college_name: collegeName,
        plan_id: paymentPlan.id,
        total_amount: paymentPlan.total_amount,
        currency: paymentPlan.currency,
      },
    })

    // Return standardized success response with 201 status
    return NextResponse.json(
      {
        success: true,
        data: paymentPlan,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: '/api/payment-plans',
    })
  }
}
