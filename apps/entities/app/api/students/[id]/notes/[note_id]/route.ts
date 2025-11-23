/**
 * Student Note Detail API - Update and Delete Operations
 *
 * This endpoint provides individual note operations including updates and deletion.
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
import { logAudit } from '@pleeno/database'
import { NoteUpdateSchema } from '@pleeno/validations'

/**
 * PATCH /api/students/[id]/notes/[note_id]
 *
 * Updates an existing note's content.
 * Content is limited to 2,000 characters (enforced by schema and database).
 *
 * Request body:
 * {
 *   "content": "Updated note content here (max 2000 characters)"
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
 *     "content": "Updated note content",
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "updated_at": "2024-01-01T01:00:00Z"
 *   }
 * }
 *
 * Error responses:
 * - 400: Validation error (missing content or exceeds 2000 chars)
 * - 401: Not authenticated
 * - 403: Not authorized
 * - 404: Note not found
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure note belongs to user's agency
 * - Note update logged to audit_logs with old and new content
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing student ID and note ID
 * @returns Updated note object or error response
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; note_id: string }> }
) {
  const { id: studentId, note_id: noteId } = await params
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
    const result = NoteUpdateSchema.safeParse(body)

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

    // Fetch existing note for audit log (old values)
    const { data: existingNote, error: fetchError } = await supabase
      .from('student_notes')
      .select('*')
      .eq('id', noteId)
      .eq('student_id', studentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !existingNote) {
      throw new ValidationError('Note not found')
    }

    // Update note record
    // RLS policies will enforce agency_id filtering
    const { data: updatedNote, error: updateError } = await supabase
      .from('student_notes')
      .update({
        content: validatedData.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .eq('agency_id', userAgencyId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update note:', updateError)
      throw new Error('Failed to update note')
    }

    if (!updatedNote) {
      throw new Error('Note not found after update')
    }

    // Log changes to audit trail with old and new content
    if (existingNote.content !== updatedNote.content) {
      await logAudit(supabase, {
        userId: user.id,
        agencyId: userAgencyId,
        entityType: 'student_note',
        entityId: noteId,
        action: 'update',
        oldValues: {
          content: existingNote.content,
        },
        newValues: {
          content: updatedNote.content,
        },
        metadata: {
          student_id: studentId,
        },
      })
    }

    return createSuccessResponse(updatedNote)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${studentId}/notes/${noteId}`,
    })
  }
}

/**
 * DELETE /api/students/[id]/notes/[note_id]
 *
 * Deletes a note from the system.
 * This is a hard delete that permanently removes the note.
 *
 * Response (200):
 * {
 *   "success": true
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not authorized
 * - 404: Note not found
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure note belongs to user's agency
 * - Audit log entry created before deletion
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing student ID and note ID
 * @returns Success response or error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; note_id: string }> }
) {
  const { id: studentId, note_id: noteId } = await params
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

    // Fetch the note for audit log
    const { data: note, error: noteError } = await supabase
      .from('student_notes')
      .select('*')
      .eq('id', noteId)
      .eq('student_id', studentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (noteError || !note) {
      throw new ValidationError('Note not found')
    }

    // Log deletion before removing the record
    // This creates an immutable audit trail of the deletion
    await logAudit(supabase, {
      userId: user.id,
      agencyId: userAgencyId,
      entityType: 'student_note',
      entityId: noteId,
      action: 'delete',
      oldValues: {
        content: note.content,
      },
      metadata: {
        student_id: studentId,
      },
    })

    // Hard delete the note
    const { error: deleteError } = await supabase
      .from('student_notes')
      .delete()
      .eq('id', noteId)
      .eq('agency_id', userAgencyId)

    if (deleteError) {
      console.error('Failed to delete note:', deleteError)
      throw new Error('Failed to delete note')
    }

    // Return success response
    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${studentId}/notes/${noteId}`,
    })
  }
}
