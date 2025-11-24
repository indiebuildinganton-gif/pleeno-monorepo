/**
 * College Notes API - List and Create Operations
 *
 * This endpoint provides note listing and creation operations for a specific college
 * with content validation (max 2000 characters).
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 10: Implement Notes API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'
import { NoteCreateSchema } from '@pleeno/validations'

/**
 * GET /api/colleges/[id]/notes
 *
 * Returns all notes for a specific college with user attribution.
 * All data is automatically filtered by RLS based on agency_id.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "college_id": "uuid",
 *       "user_id": "uuid",
 *       "agency_id": "uuid",
 *       "content": "Note content here...",
 *       "created_at": "2024-01-01T00:00:00Z",
 *       "updated_at": "2024-01-01T00:00:00Z",
 *       "user": {
 *         "id": "uuid",
 *         "full_name": "John Doe",
 *         "email": "john@example.com"
 *       }
 *     }
 *   ]
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not authorized (college belongs to different agency)
 * - 404: College not found
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS policies automatically filter by agency_id
 * - College must belong to user's agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing college id
 * @returns List of notes with user attribution or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Validate UUID format
    const collegeId = params.id
    if (
      !collegeId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        collegeId
      )
    ) {
      throw new ValidationError('Invalid college ID format')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // First, verify that the college exists and belongs to the user's agency
    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('id')
      .eq('id', collegeId)
      .eq('agency_id', userAgencyId)
      .single()

    if (collegeError || !college) {
      console.error('Failed to fetch college:', collegeError)

      if (collegeError?.code === 'PGRST116') {
        throw new NotFoundError('College not found')
      }

      throw new Error('Failed to fetch college')
    }

    // Fetch all notes for the college with user information
    // RLS policies will enforce agency filtering
    const { data: notes, error: notesError } = await supabase
      .from('college_notes')
      .select(`
        id,
        college_id,
        user_id,
        agency_id,
        content,
        created_at,
        updated_at,
        user:users!college_notes_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('college_id', collegeId)
      .eq('agency_id', userAgencyId)
      .order('created_at', { ascending: false })

    if (notesError) {
      console.error('Failed to fetch notes:', notesError)
      throw new Error('Failed to fetch notes')
    }

    // Return notes list (may be empty array)
    return createSuccessResponse(notes || [])
  } catch (error) {
    return handleApiError(error, {
      path: `/api/colleges/${params.id}/notes`,
    })
  }
}

/**
 * POST /api/colleges/[id]/notes
 *
 * Creates a new note for a specific college. All authenticated users
 * (both agency_admin and agency_user) can create notes.
 * Content is limited to 2000 characters.
 * User attribution is automatically tracked via user_id.
 *
 * Request body:
 * {
 *   "content": "Note content here..."  // Required, max 2000 characters
 * }
 *
 * Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "college_id": "uuid",
 *     "user_id": "uuid",
 *     "agency_id": "uuid",
 *     "content": "Note content here...",
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "updated_at": "2024-01-01T00:00:00Z",
 *     "user": {
 *       "id": "uuid",
 *       "full_name": "John Doe",
 *       "email": "john@example.com"
 *     }
 *   }
 * }
 *
 * Error responses:
 * - 400: Validation error (missing content, content too long, etc.)
 * - 401: Not authenticated
 * - 403: Not authorized (college belongs to different agency)
 * - 404: College not found
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS policies automatically enforce agency_id filtering
 * - Content length validated (max 2000 characters)
 * - User ID automatically tracked from authenticated session
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing college id
 * @returns Created note object with user information or error response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // SECURITY BOUNDARY: Require authentication (both admin and regular users)
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id
    const userId = user.id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Validate UUID format
    const collegeId = params.id
    if (
      !collegeId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        collegeId
      )
    ) {
      throw new ValidationError('Invalid college ID format')
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

    // Create Supabase client
    const supabase = await createServerClient()

    // First, verify that the college exists and belongs to the user's agency
    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('id, name')
      .eq('id', collegeId)
      .eq('agency_id', userAgencyId)
      .single()

    if (collegeError || !college) {
      console.error('Failed to fetch college:', collegeError)

      if (collegeError?.code === 'PGRST116') {
        throw new NotFoundError('College not found')
      }

      throw new Error('Failed to fetch college')
    }

    // Create the note with user attribution
    // RLS policies will enforce agency_id filtering
    const { data: newNote, error: createError } = await supabase
      .from('college_notes')
      .insert({
        college_id: collegeId,
        user_id: userId,
        agency_id: userAgencyId,
        content: validatedData.content,
      })
      .select(`
        id,
        college_id,
        user_id,
        agency_id,
        content,
        created_at,
        updated_at,
        user:users!college_notes_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (createError) {
      console.error('Failed to create note:', createError)
      throw new Error('Failed to create note')
    }

    if (!newNote) {
      throw new Error('Note not created')
    }

    // Return standardized success response with 201 status
    return NextResponse.json(
      {
        success: true,
        data: newNote,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: `/api/colleges/${params.id}/notes`,
    })
  }
}
