/**
 * Branch Enrollments API - List Operation
 *
 * This endpoint provides enrollment listing for a specific branch.
 * Returns all enrolled students at this branch with student and college information.
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

/**
 * GET /api/branches/[id]/enrollments
 *
 * Returns all enrollments for a specific branch including:
 * - Enrollment information (program, status, offer letter)
 * - Associated student details
 * - Parent college information
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "enrollment-uuid",
 *       "program_name": "Computer Science",
 *       "status": "active",
 *       "offer_letter_url": "https://...",
 *       "offer_letter_filename": "offer.pdf",
 *       "created_at": "2023-01-01T00:00:00Z",
 *       "updated_at": "2023-01-01T00:00:00Z",
 *       "student": {
 *         "id": "student-uuid",
 *         "full_name": "John Doe",
 *         "email": "john@example.com",
 *         "phone": "+1234567890",
 *         "passport_number": "AB123456",
 *         "visa_status": "approved"
 *       }
 *     }
 *   ]
 * }
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure branch and enrollments belong to user's agency
 * - Returns 404 if branch not found or belongs to different agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing branch ID
 * @returns List of enrollments for the branch
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

    // First verify that the branch exists and belongs to the user's agency
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .eq('id', id)
      .eq('agency_id', userAgencyId)
      .single()

    if (branchError || !branch) {
      throw new ValidationError('Branch not found')
    }

    // Fetch enrollments for this branch with joined student data
    const { data: enrollments, error: enrollmentsError } = await supabase
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
          passport_number,
          visa_status
        )
      `
      )
      .eq('branch_id', id)
      .eq('agency_id', userAgencyId)
      .order('created_at', { ascending: false })

    if (enrollmentsError) {
      console.error('Failed to fetch enrollments:', enrollmentsError)
      throw new Error('Failed to fetch enrollments')
    }

    return createSuccessResponse(enrollments || [])
  } catch (error) {
    return handleApiError(error, {
      path: `/api/branches/${id}/enrollments`,
    })
  }
}
