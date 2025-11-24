/**
 * Note Detail API - Update and Delete Operations
 *
 * This endpoint provides note update and deletion operations with
 * content validation and user ownership checks.
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
import { NoteUpdateSchema } from '@pleeno/validations'

/**
 * PATCH /api/notes/[id]
 *
 * Updates a note's content. Users can update their own notes,
 * and admins can update any notes in their agency.
 * Content is limited to 2000 characters.
 *
 * Request body:
 * {
 *   "content": "Updated note content..."  // Required, max 2000 characters
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "college_id": "uuid",
 *     "user_id": "uuid",
 *     "agency_id": "uuid",
 *     "content": "Updated note content...",
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
 * - 400: Validation error (content too long, etc.)
 * - 401: Not authenticated
 * - 403: Not authorized (not owner and not admin, or different agency)
 * - 404: Note not found
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - Users can only update their own notes unless they are admins
 * - RLS policies automatically enforce agency_id filtering
 * - Content length validated (max 2000 characters)
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing note id
 * @returns Updated note object or error response
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user, role } = authResult

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id
    const userId = user.id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Validate UUID format
    const noteId = params.id
    if (
      !noteId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        noteId
      )
    ) {
      throw new ValidationError('Invalid note ID format')
    }

    // Parse and validate request body
    const body = await request.json()
    const result = NoteUpdateSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validatedData = result.data

    // Check if there's anything to update
    if (!validatedData.content) {
      throw new ValidationError('No content to update')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // First, fetch the current note to verify ownership
    const { data: currentNote, error: fetchError } = await supabase
      .from('college_notes')
      .select('id, user_id, agency_id, content, college_id')
      .eq('id', noteId)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !currentNote) {
      console.error('Failed to fetch note:', fetchError)

      if (fetchError?.code === 'PGRST116') {
        throw new NotFoundError('Note not found')
      }

      throw new Error('Failed to fetch note')
    }

    // Check ownership: User must own the note OR be an admin
    const isOwner = currentNote.user_id === userId
    const isAdmin = role === 'agency_admin'

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You can only edit your own notes')
    }

    // Update note
    // RLS policies will enforce agency_id filtering
    const { data: updatedNote, error: updateError } = await supabase
      .from('college_notes')
      .update({
        content: validatedData.content,
      })
      .eq('id', noteId)
      .eq('agency_id', userAgencyId)
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

    if (updateError) {
      console.error('Failed to update note:', updateError)
      throw new Error('Failed to update note')
    }

    if (!updatedNote) {
      throw new Error('Note not found after update')
    }

    // Return standardized success response
    return createSuccessResponse(updatedNote)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/notes/${params.id}`,
    })
  }
}

/**
 * DELETE /api/notes/[id]
 *
 * Deletes a note. Users can delete their own notes,
 * and admins can delete any notes in their agency.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Note deleted successfully"
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not authorized (not owner and not admin, or different agency)
 * - 404: Note not found
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - Users can only delete their own notes unless they are admins
 * - RLS policies automatically enforce agency_id filtering
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing note id
 * @returns Success message or error response
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user, role } = authResult

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id
    const userId = user.id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Validate UUID format
    const noteId = params.id
    if (
      !noteId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        noteId
      )
    ) {
      throw new ValidationError('Invalid note ID format')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // First, verify the note exists, belongs to the user's agency, and check ownership
    const { data: note, error: fetchError } = await supabase
      .from('college_notes')
      .select('id, user_id, content, college_id')
      .eq('id', noteId)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !note) {
      console.error('Failed to fetch note:', fetchError)

      if (fetchError?.code === 'PGRST116') {
        throw new NotFoundError('Note not found')
      }

      throw new Error('Failed to fetch note')
    }

    // Check ownership: User must own the note OR be an admin
    const isOwner = note.user_id === userId
    const isAdmin = role === 'agency_admin'

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You can only delete your own notes')
    }

    // Delete the note
    const { error: deleteError } = await supabase
      .from('college_notes')
      .delete()
      .eq('id', noteId)
      .eq('agency_id', userAgencyId)

    if (deleteError) {
      console.error('Failed to delete note:', deleteError)
      throw new Error('Failed to delete note')
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Note deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: `/api/notes/${params.id}`,
    })
  }
}
