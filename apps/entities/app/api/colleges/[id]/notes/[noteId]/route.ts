/**
 * Individual College Note API - Update and Delete Operations
 *
 * This endpoint provides note update and delete operations for individual notes.
 * Only the note creator or agency admin can edit/delete notes.
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 18: Create Notes Section Component
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
import { requireRole } from '@pleeno/auth'
import { NoteCreateSchema } from '@pleeno/validations'

/**
 * PATCH /api/colleges/[id]/notes/[noteId]
 *
 * Updates a specific note. Only the note creator or agency admin can update.
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
 * - 400: Validation error
 * - 401: Not authenticated
 * - 403: Not authorized (not creator and not admin)
 * - 404: Note not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    const userAgencyId = user.app_metadata?.agency_id
    const userId = user.id
    const userRole = user.app_metadata?.role

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Validate UUIDs
    const collegeId = params.id
    const noteId = params.noteId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!uuidRegex.test(collegeId)) {
      throw new ValidationError('Invalid college ID format')
    }

    if (!uuidRegex.test(noteId)) {
      throw new ValidationError('Invalid note ID format')
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
    const supabase = await createServerClient()

    // Fetch the existing note to verify ownership
    const { data: existingNote, error: fetchError } = await supabase
      .from('college_notes')
      .select('id, user_id, college_id, agency_id')
      .eq('id', noteId)
      .eq('college_id', collegeId)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !existingNote) {
      console.error('Failed to fetch note:', fetchError)
      throw new NotFoundError('Note not found')
    }

    // Check permissions: only creator or admin can edit
    const isCreator = existingNote.user_id === userId
    const isAdmin = userRole === 'agency_admin'

    if (!isCreator && !isAdmin) {
      throw new ForbiddenError('Only the note creator or admin can edit this note')
    }

    // Update the note
    const { data: updatedNote, error: updateError } = await supabase
      .from('college_notes')
      .update({
        content: validatedData.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
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

    if (updateError || !updatedNote) {
      console.error('Failed to update note:', updateError)
      throw new Error('Failed to update note')
    }

    return createSuccessResponse(updatedNote)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/colleges/${params.id}/notes/${params.noteId}`,
    })
  }
}

/**
 * DELETE /api/colleges/[id]/notes/[noteId]
 *
 * Deletes a specific note. Only the note creator or agency admin can delete.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": null
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not authorized (not creator and not admin)
 * - 404: Note not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    const userAgencyId = user.app_metadata?.agency_id
    const userId = user.id
    const userRole = user.app_metadata?.role

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Validate UUIDs
    const collegeId = params.id
    const noteId = params.noteId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!uuidRegex.test(collegeId)) {
      throw new ValidationError('Invalid college ID format')
    }

    if (!uuidRegex.test(noteId)) {
      throw new ValidationError('Invalid note ID format')
    }

    const supabase = await createServerClient()

    // Fetch the existing note to verify ownership
    const { data: existingNote, error: fetchError } = await supabase
      .from('college_notes')
      .select('id, user_id, college_id, agency_id')
      .eq('id', noteId)
      .eq('college_id', collegeId)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !existingNote) {
      console.error('Failed to fetch note:', fetchError)
      throw new NotFoundError('Note not found')
    }

    // Check permissions: only creator or admin can delete
    const isCreator = existingNote.user_id === userId
    const isAdmin = userRole === 'agency_admin'

    if (!isCreator && !isAdmin) {
      throw new ForbiddenError('Only the note creator or admin can delete this note')
    }

    // Delete the note
    const { error: deleteError } = await supabase
      .from('college_notes')
      .delete()
      .eq('id', noteId)

    if (deleteError) {
      console.error('Failed to delete note:', deleteError)
      throw new Error('Failed to delete note')
    }

    return createSuccessResponse(null)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/colleges/${params.id}/notes/${params.noteId}`,
    })
  }
}
