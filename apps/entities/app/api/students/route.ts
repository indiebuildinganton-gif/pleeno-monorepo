/**
 * Student API - List and Create Operations
 *
 * This endpoint provides student listing with search/pagination and student creation.
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
  ForbiddenError,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { logActivity, logAudit } from '@pleeno/database'
import { requireRole } from '@pleeno/auth'
import { StudentCreateSchema } from '@pleeno/validations'

/**
 * GET /api/students
 *
 * Returns a paginated list of students with optional search functionality.
 * Supports searching by name, email, phone, or passport number.
 *
 * Query parameters:
 * - search: string (optional) - Search term for filtering students
 * - page: number (optional, default: 1) - Page number for pagination
 * - per_page: number (optional, default: 20) - Number of items per page
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [...student objects...],
 *   "meta": {
 *     "total": 100,
 *     "page": 1,
 *     "per_page": 20,
 *     "total_pages": 5
 *   }
 * }
 *
 * Security:
 * - Requires authentication
 * - RLS policies automatically filter by agency_id
 * - All queries are scoped to the user's agency
 *
 * @param request - Next.js request object
 * @returns Paginated list of students or error response
 */
export async function GET(request: NextRequest) {
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

    // Create Supabase client
    const supabase = await createServerClient()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = parseInt(searchParams.get('per_page') || '20', 10)

    // Validate pagination parameters
    if (page < 1 || perPage < 1 || perPage > 100) {
      throw new ValidationError('Invalid pagination parameters')
    }

    // Calculate offset for pagination
    const offset = (page - 1) * perPage

    // Build query with RLS-enforced agency filtering and enrollment data
    // Join with student_enrollments, colleges, and branches to get latest enrollment info
    // Using LEFT JOIN (no !inner) to include students without enrollments
    let query = supabase
      .from('students')
      .select(
        `
        *,
        student_enrollments(
          id,
          college_id,
          branch_id,
          enrollment_date,
          colleges(
            id,
            name
          ),
          branches(
            id,
            name,
            city
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('agency_id', userAgencyId)

    // Add search filter if provided
    if (search.trim()) {
      // Search across multiple fields
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,passport_number.ilike.%${search}%`
      )
    }

    // Apply pagination and ordering
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + perPage - 1)

    const { data: studentsRaw, error, count } = await query

    if (error) {
      console.error('Failed to fetch students:', error)
      throw new Error('Failed to fetch students')
    }

    // Transform the data to include only the latest enrollment
    const students = studentsRaw?.map((student: any) => {
      const enrollments = student.student_enrollments || []
      // Get the most recent enrollment (sort by enrollment_date desc)
      const sortedEnrollments = enrollments.sort(
        (a: any, b: any) =>
          new Date(b.enrollment_date).getTime() - new Date(a.enrollment_date).getTime()
      )
      const latestEnrollment = sortedEnrollments.length > 0 ? sortedEnrollments[0] : null

      return {
        ...student,
        // Remove the nested enrollments array and flatten the latest enrollment
        student_enrollments: undefined,
        latest_enrollment: latestEnrollment
          ? {
              college_name: latestEnrollment.colleges?.name || null,
              branch_name: latestEnrollment.branches?.name || null,
              branch_city: latestEnrollment.branches?.city || null,
            }
          : null,
      }
    })

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / perPage) : 0

    // Return paginated response with metadata
    return createSuccessResponse(
      students || [],
      {
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: totalPages,
      }
    )
  } catch (error) {
    return handleApiError(error, {
      path: '/api/students',
    })
  }
}

/**
 * POST /api/students
 *
 * Creates a new student with the provided information.
 * Validates required fields and handles unique constraint violations.
 *
 * Request body:
 * {
 *   "full_name": "John Doe",              // Required
 *   "passport_number": "AB123456",        // Required (unique per agency)
 *   "email": "john@example.com",          // Optional
 *   "phone": "+1234567890",               // Optional
 *   "visa_status": "in_process",          // Optional: in_process|approved|denied|expired
 *   "date_of_birth": "1995-01-01",        // Optional: YYYY-MM-DD format
 *   "nationality": "USA"                  // Optional
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {...student object...}
 * }
 *
 * Error responses:
 * - 400: Validation error or duplicate passport number
 * - 401: Not authenticated
 * - 403: Not authorized
 *
 * Security:
 * - Requires authentication
 * - RLS policies automatically set agency_id
 * - Passport number must be unique within agency
 * - All operations logged to audit_logs
 *
 * @param request - Next.js request object
 * @returns Created student object or error response
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    const result = StudentCreateSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validatedData = result.data

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Create student record
    // RLS policies will enforce agency_id filtering
    const { data: student, error: insertError } = await supabase
      .from('students')
      .insert({
        agency_id: userAgencyId,
        full_name: validatedData.full_name,
        passport_number: validatedData.passport_number,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        visa_status: validatedData.visa_status || null,
        date_of_birth: validatedData.date_of_birth || null,
        nationality: validatedData.nationality || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create student:', insertError)

      // Check for duplicate passport number constraint violation
      // PostgreSQL unique constraint violation code: 23505
      if (insertError.code === '23505') {
        throw new ValidationError(
          'A student with this passport number already exists in your agency'
        )
      }

      throw new Error('Failed to create student')
    }

    if (!student) {
      throw new Error('Student not found after creation')
    }

    // Log student creation to audit trail
    await logAudit(supabase, {
      userId: user.id,
      agencyId: userAgencyId,
      entityType: 'student',
      entityId: student.id,
      action: 'create',
      newValues: {
        full_name: student.full_name,
        passport_number: student.passport_number,
        email: student.email,
        phone: student.phone,
        visa_status: student.visa_status,
        date_of_birth: student.date_of_birth,
        nationality: student.nationality,
      },
    })

    // Log activity for Recent Activity Feed (Story 6.4)
    await logActivity(supabase, {
      agencyId: userAgencyId,
      userId: user.id,
      entityType: 'student',
      entityId: student.id,
      action: 'created',
      description: `added new student ${student.full_name}`,
      metadata: {
        student_name: student.full_name,
        student_id: student.id,
        passport_number: student.passport_number,
      },
    })

    // Return standardized success response
    return createSuccessResponse(student)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/students',
    })
  }
}
