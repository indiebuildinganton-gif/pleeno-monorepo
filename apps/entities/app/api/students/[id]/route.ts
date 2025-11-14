/**
 * Student Detail API - Get, Update, and Delete Operations
 *
 * This endpoint provides individual student operations including detail view,
 * updates, and deletion.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 02: Student API Routes (CRUD endpoints with search)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  logAudit,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { StudentUpdateSchema } from '@pleeno/validations'

/**
 * GET /api/students/[id]
 *
 * Returns detailed information about a specific student including:
 * - Student basic information
 * - Associated enrollments with college and branch details
 *
 * The response includes joined data for a complete student profile view.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     ...student fields...,
 *     "enrollments": [
 *       {
 *         "id": "enrollment-uuid",
 *         "program_name": "Computer Science",
 *         "status": "active",
 *         "branch": {
 *           "id": "branch-uuid",
 *           "name": "Main Campus",
 *           "city": "Toronto",
 *           "college": {
 *             "id": "college-uuid",
 *             "name": "University of Toronto"
 *           }
 *         }
 *       }
 *     ]
 *   }
 * }
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure student belongs to user's agency
 * - Returns 404 if student not found or belongs to different agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing student ID
 * @returns Student detail with enrollments or error response
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

    // Fetch student with RLS enforcement
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('agency_id', userAgencyId) // Explicit agency check
      .single()

    if (studentError || !student) {
      throw new ValidationError('Student not found')
    }

    // Fetch enrollments with joined branch and college data
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

    if (enrollmentsError) {
      console.error('Failed to fetch enrollments:', enrollmentsError)
      // Don't fail the request, just return empty enrollments
    }

    // Combine student data with enrollments
    const studentWithEnrollments = {
      ...student,
      enrollments: enrollments || [],
    }

    return createSuccessResponse(studentWithEnrollments)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${id}`,
    })
  }
}

/**
 * PATCH /api/students/[id]
 *
 * Updates an existing student's information.
 * Supports partial updates - only provided fields are updated.
 *
 * Request body (all fields optional):
 * {
 *   "full_name": "John Doe Updated",
 *   "passport_number": "AB123456",
 *   "email": "newemail@example.com",
 *   "phone": "+1234567890",
 *   "visa_status": "approved",
 *   "date_of_birth": "1995-01-01",
 *   "nationality": "Canada"
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {...updated student object...}
 * }
 *
 * Error responses:
 * - 400: Validation error or duplicate passport number
 * - 401: Not authenticated
 * - 403: Not authorized
 * - 404: Student not found
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure student belongs to user's agency
 * - Passport number uniqueness enforced per agency
 * - All changes logged to audit_logs with old and new values
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing student ID
 * @returns Updated student object or error response
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
    const result = StudentUpdateSchema.safeParse(body)

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

    // Fetch existing student for audit log (old values)
    const { data: existingStudent, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !existingStudent) {
      throw new ValidationError('Student not found')
    }

    // Update student record
    // RLS policies will enforce agency_id filtering
    const { data: updatedStudent, error: updateError } = await supabase
      .from('students')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('agency_id', userAgencyId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update student:', updateError)

      // Check for duplicate passport number constraint violation
      if (updateError.code === '23505') {
        throw new ValidationError(
          'A student with this passport number already exists in your agency'
        )
      }

      throw new Error('Failed to update student')
    }

    if (!updatedStudent) {
      throw new Error('Student not found after update')
    }

    // Log changes to audit trail with old and new values
    const oldValues: Record<string, any> = {}
    const newValues: Record<string, any> = {}
    let hasChanges = false

    Object.keys(validatedData).forEach((key) => {
      const oldValue = existingStudent[key as keyof typeof existingStudent]
      const newValue = updatedStudent[key as keyof typeof updatedStudent]
      if (oldValue !== newValue) {
        oldValues[key] = oldValue
        newValues[key] = newValue
        hasChanges = true
      }
    })

    // Only log if there are actual changes
    if (hasChanges) {
      await logAudit(supabase, {
        userId: user.id,
        agencyId: userAgencyId,
        entityType: 'student',
        entityId: id,
        action: 'update',
        oldValues,
        newValues,
      })
    }

    return createSuccessResponse(updatedStudent)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${id}`,
    })
  }
}

/**
 * DELETE /api/students/[id]
 *
 * Deletes a student from the system.
 * This is a hard delete that will cascade to related records per database constraints.
 *
 * Related records that will be deleted:
 * - Student documents
 * - Student notes
 * - Enrollments
 * - Payment plans (via enrollment cascade)
 *
 * Response (200):
 * {
 *   "success": true
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not authorized (only admins can delete)
 * - 404: Student not found
 *
 * Security:
 * - Only agency_admin can delete students
 * - RLS policies ensure student belongs to user's agency
 * - Audit log entry created before deletion
 * - Cascading deletes handled by database constraints
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing student ID
 * @returns Success response or error
 */
export async function DELETE(
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

    // SECURITY BOUNDARY: Verify user is an agency admin
    // Only admins should be able to delete students
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'agency_admin') {
      throw new ForbiddenError('Admin access required to delete students')
    }

    // Get user's agency_id
    const userAgencyId = currentUser.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Fetch the student for audit log
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('agency_id', userAgencyId)
      .single()

    if (studentError || !student) {
      throw new ValidationError('Student not found')
    }

    // Log deletion before removing the record
    // This creates an immutable audit trail of the deletion
    await logAudit(supabase, {
      userId: user.id,
      agencyId: userAgencyId,
      entityType: 'student',
      entityId: id,
      action: 'delete',
      oldValues: {
        full_name: student.full_name,
        passport_number: student.passport_number,
        email: student.email,
        phone: student.phone,
        visa_status: student.visa_status,
        date_of_birth: student.date_of_birth,
        nationality: student.nationality,
      },
    })

    // Hard delete the student
    // Database CASCADE constraints will handle related records
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', id)
      .eq('agency_id', userAgencyId)

    if (deleteError) {
      console.error('Failed to delete student:', deleteError)
      throw new Error('Failed to delete student')
    }

    // Return success response
    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${id}`,
    })
  }
}
