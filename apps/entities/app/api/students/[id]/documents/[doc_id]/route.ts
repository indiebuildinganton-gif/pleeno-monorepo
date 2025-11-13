/**
 * Student Document API - Download and Delete Operations
 *
 * This endpoint provides individual document operations including:
 * - File download from Supabase Storage
 * - File deletion from Storage and database
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 04: Student Documents API (file upload/download with Supabase Storage)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  downloadDocument,
  deleteDocument,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'

/**
 * GET /api/students/[id]/documents/[doc_id]
 *
 * Downloads a specific document file from Supabase Storage.
 *
 * Response (200):
 * - Content-Type: application/pdf | image/jpeg | image/png
 * - Body: File binary data
 * - Headers:
 *   - Content-Disposition: attachment; filename="original-filename.pdf"
 *   - Content-Length: file size in bytes
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not authorized or document not found
 * - 404: File not found in storage
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure document belongs to user's agency
 * - Validates student belongs to user's agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing student ID and document ID
 * @returns File binary data or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; doc_id: string }> }
) {
  const { id: studentId, doc_id: docId } = await params
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

    // Fetch document metadata with RLS enforcement
    const { data: document, error: docError } = await supabase
      .from('student_documents')
      .select('*')
      .eq('id', docId)
      .eq('student_id', studentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (docError || !document) {
      throw new ForbiddenError('Document not found or access denied')
    }

    // Download file from Supabase Storage
    const fileBlob = await downloadDocument(supabase, document.file_path)

    // Determine content type based on file extension
    const ext = document.file_name.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    if (ext === 'pdf') {
      contentType = 'application/pdf'
    } else if (ext === 'jpg' || ext === 'jpeg') {
      contentType = 'image/jpeg'
    } else if (ext === 'png') {
      contentType = 'image/png'
    }

    // Return file with appropriate headers
    return new NextResponse(fileBlob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${document.file_name}"`,
        'Content-Length': document.file_size?.toString() || '',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${studentId}/documents/${docId}`,
    })
  }
}

/**
 * DELETE /api/students/[id]/documents/[doc_id]
 *
 * Deletes a document from both Supabase Storage and the database.
 * This is a hard delete operation.
 *
 * Response (200):
 * {
 *   "success": true
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not authorized or document not found
 * - 404: Document not found
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure document belongs to user's agency
 * - Audit log entry created before deletion
 * - File removed from Storage before database record
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing student ID and document ID
 * @returns Success response or error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; doc_id: string }> }
) {
  const { id: studentId, doc_id: docId } = await params
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

    // Fetch document metadata with RLS enforcement
    const { data: document, error: docError } = await supabase
      .from('student_documents')
      .select('*')
      .eq('id', docId)
      .eq('student_id', studentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (docError || !document) {
      throw new ForbiddenError('Document not found or access denied')
    }

    // Log deletion before removing the record
    await supabase.from('audit_logs').insert({
      entity_type: 'student_document',
      entity_id: docId,
      user_id: user.id,
      action: 'delete',
      changes_json: {
        student_id: studentId,
        document_type: document.document_type,
        file_name: document.file_name,
        file_path: document.file_path,
      },
    })

    // Delete file from Supabase Storage
    await deleteDocument(supabase, document.file_path)

    // Delete database record
    const { error: deleteError } = await supabase
      .from('student_documents')
      .delete()
      .eq('id', docId)
      .eq('agency_id', userAgencyId)

    if (deleteError) {
      console.error('Failed to delete document record:', deleteError)
      throw new Error('Failed to delete document')
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${studentId}/documents/${docId}`,
    })
  }
}
