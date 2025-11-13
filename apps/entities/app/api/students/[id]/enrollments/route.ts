/**
 * Student Enrollments API - List Operation
 *
 * This endpoint provides enrollment listing for a specific student.
 * Returns all enrollments with branch and college information.
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
 * GET /api/students/[id]/enrollments
 *
 * Returns all enrollments for a specific student including:
 * - Enrollment information (program, status, offer letter)
 * - Associated branch and college details
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
 *       "branch": {
 *         "id": "branch-uuid",
 *         "name": "Main Campus",
 *         "city": "Toronto",
 *         "commission_rate_percent": 15,
 *         "college": {
 *           "id": "college-uuid",
 *           "name": "University of Toronto",
 *           "city": "Toronto",
 *           "country": "Canada"
 *         }
 *       }
 *     }
 *   ]
 * }
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure student and enrollments belong to user's agency
 * - Returns 404 if student not found or belongs to different agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing student ID
 * @returns List of enrollments for the student
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

    // First verify that the student exists and belongs to the user's agency
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', id)
      .eq('agency_id', userAgencyId)
      .single()

    if (studentError || !student) {
      throw new ValidationError('Student not found')
    }

    // Fetch enrollments for this student with joined branch and college data
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
      .eq('student_id', id)
      .eq('agency_id', userAgencyId)
      .order('created_at', { ascending: false })

    if (enrollmentsError) {
      console.error('Failed to fetch enrollments:', enrollmentsError)
      throw new Error('Failed to fetch enrollments')
    }

    return createSuccessResponse(enrollments || [])
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${id}/enrollments`,
    })
  }
}
