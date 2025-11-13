/**
 * Student Notes API - List and Create Operations
 *
 * This endpoint provides note listing and creation for students.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 03: Student Notes API
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
import { NoteCreateSchema } from '@pleeno/validations'

/**
 * GET /api/students/[id]/notes
 *
 * Returns all notes for a specific student with user attribution.
 * Notes are ordered by creation date (newest first).
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "note-uuid",
 *       "content": "Note content here",
 *       "created_at": "2024-01-01T00:00:00Z",
 *       "updated_at": "2024-01-01T00:00:00Z",
 *       "user": {
 *         "id": "user-uuid",
 *         "full_name": "John Doe",
 *         "email": "john@example.com"
 *       }
 *     }
 *   ]
 * }
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure notes belong to user's agency
 * - Student must belong to user's agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing student ID
 * @returns List of notes with user attribution or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
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

    // Verify student exists and belongs to user's agency
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (studentError || !student) {
      throw new ValidationError('Student not found')
    }

    // Fetch notes with user attribution
    // RLS policies will enforce agency filtering
    const { data: notes, error: notesError } = await supabase
      .from('student_notes')
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        user:users (
          id,
          full_name,
          email
        )
      `
      )
      .eq('student_id', studentId)
      .eq('agency_id', userAgencyId)
      .order('created_at', { ascending: false })

    if (notesError) {
      console.error('Failed to fetch notes:', notesError)
      throw new Error('Failed to fetch notes')
    }

    return createSuccessResponse(notes || [])
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${studentId}/notes`,
    })
  }
}

/**
 * POST /api/students/[id]/notes
 *
 * Creates a new note for a student.
 * Content is limited to 2,000 characters (enforced by schema and database).
 *
 * Request body:
 * {
 *   "content": "Note content here (max 2000 characters)"
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "note-uuid",
 *     "student_id": "student-uuid",
 *     "user_id": "user-uuid",
 *     "agency_id": "agency-uuid",
 *     "content": "Note content here",
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "updated_at": "2024-01-01T00:00:00Z"
 *   }
 * }
 *
 * Error responses:
 * - 400: Validation error (missing content or exceeds 2000 chars)
 * - 401: Not authenticated
 * - 403: Not authorized
 * - 404: Student not found
 *
 * Security:
 * - Requires authentication
 * - RLS policies automatically set agency_id
 * - Student must belong to user's agency
 * - Note creation logged to audit_logs
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing student ID
 * @returns Created note object or error response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
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
    const result = NoteCreateSchema.safeParse(body)

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

    // Verify student exists and belongs to user's agency
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('id', studentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (studentError || !student) {
      throw new ValidationError('Student not found')
    }

    // Create note record
    // RLS policies will enforce agency_id filtering
    const { data: note, error: insertError } = await supabase
      .from('student_notes')
      .insert({
        student_id: studentId,
        user_id: user.id,
        agency_id: userAgencyId,
        content: validatedData.content,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create note:', insertError)
      throw new Error('Failed to create note')
    }

    if (!note) {
      throw new Error('Note not found after creation')
    }

    // Log note creation to audit trail
    await supabase.from('audit_logs').insert({
      entity_type: 'student_note',
      entity_id: note.id,
      user_id: user.id,
      action: 'create',
      changes_json: {
        student_id: studentId,
        student_name: student.full_name,
        content_length: validatedData.content.length,
      },
    })

    return createSuccessResponse(note)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${studentId}/notes`,
    })
  }
}
