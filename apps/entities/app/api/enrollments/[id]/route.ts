/**
 * Enrollment Detail API - Get and Update Operations
 *
 * This endpoint provides individual enrollment operations including detail view
 * and status updates.
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 2: Enrollment API Routes
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
import { EnrollmentUpdateSchema } from '@pleeno/validations'

/**
 * GET /api/enrollments/[id]
 *
 * Returns detailed information about a specific enrollment including:
 * - Enrollment basic information
 * - Associated student details
 * - Associated branch and college information
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "enrollment-uuid",
 *     "program_name": "Computer Science",
 *     "status": "active",
 *     "offer_letter_url": "https://...",
 *     "offer_letter_filename": "offer.pdf",
 *     "created_at": "2023-01-01T00:00:00Z",
 *     "updated_at": "2023-01-01T00:00:00Z",
 *     "student": {
 *       "id": "student-uuid",
 *       "full_name": "John Doe",
 *       "email": "john@example.com",
 *       "phone": "+1234567890",
 *       "passport_number": "AB123456"
 *     },
 *     "branch": {
 *       "id": "branch-uuid",
 *       "name": "Main Campus",
 *       "city": "Toronto",
 *       "commission_rate_percent": 15,
 *       "college": {
 *         "id": "college-uuid",
 *         "name": "University of Toronto",
 *         "city": "Toronto",
 *         "country": "Canada"
 *       }
 *     }
 *   }
 * }
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure enrollment belongs to user's agency
 * - Returns 404 if enrollment not found or belongs to different agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing enrollment ID
 * @returns Enrollment detail with student and branch/college data
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

    // Fetch enrollment with joined student and branch/college data
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        program_name,
        status,
        offer_letter_url,
        offer_letter_filename,
        created_at,
        updated_at,
        student:students (
          id,
          full_name,
          email,
          phone,
          passport_number
        ),
        branch:branches (
          id,
          name,
          city,
          commission_rate_percent,
          college:colleges (
            id,
            name,
            city,
            country
          )
        )
      `
      )
      .eq('id', id)
      .eq('agency_id', userAgencyId)
      .single()

    if (enrollmentError || !enrollment) {
      throw new ValidationError('Enrollment not found')
    }

    return createSuccessResponse(enrollment)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/enrollments/${id}`,
    })
  }
}

/**
 * PATCH /api/enrollments/[id]
 *
 * Updates an existing enrollment's status.
 * Only status field can be updated via this endpoint.
 *
 * Request body:
 * {
 *   "status": "completed" | "cancelled" | "active"
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {...updated enrollment object...}
 * }
 *
 * Error responses:
 * - 400: Validation error
 * - 401: Not authenticated
 * - 403: Not authorized
 * - 404: Enrollment not found
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure enrollment belongs to user's agency
 * - All changes logged to audit_logs with old and new values
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing enrollment ID
 * @returns Updated enrollment object or error response
 */
export async function PATCH(
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

    // Parse and validate request body
    const body = await request.json()
    const result = EnrollmentUpdateSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validatedData = result.data

    // Get user's agency_id
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Fetch existing enrollment for audit log (old values)
    const { data: existingEnrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', id)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !existingEnrollment) {
      throw new ValidationError('Enrollment not found')
    }

    // Update enrollment record
    // RLS policies will enforce agency_id filtering
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('enrollments')
      .update({
        status: validatedData.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('agency_id', userAgencyId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update enrollment:', updateError)
      throw new Error('Failed to update enrollment')
    }

    if (!updatedEnrollment) {
      throw new Error('Enrollment not found after update')
    }

    // Log changes to audit trail with old and new values
    const changes: Record<string, { old: any; new: any }> = {}
    if (existingEnrollment.status !== updatedEnrollment.status) {
      changes['status'] = {
        old: existingEnrollment.status,
        new: updatedEnrollment.status,
      }
    }

    // Log to audit trail (always log status changes)
    await supabase.from('audit_logs').insert({
      entity_type: 'enrollment',
      entity_id: id,
      user_id: user.id,
      action: 'update',
      changes_json: changes,
    })

    return createSuccessResponse(updatedEnrollment)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/enrollments/${id}`,
    })
  }
}
