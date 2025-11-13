/**
 * Student Documents API - Upload and List Operations
 *
 * This endpoint provides document management for students including:
 * - File uploads to Supabase Storage
 * - Metadata storage in student_documents table
 * - File validation (type and size)
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 04: Student Documents API (file upload/download with Supabase Storage)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  uploadDocument,
  type DocumentType,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'

/**
 * POST /api/students/[id]/documents
 *
 * Uploads a document for a student to Supabase Storage and stores metadata
 * in the student_documents table.
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Body:
 *   - file: File (required) - PDF or image file (max 10MB)
 *   - document_type: string (required) - one of: offer_letter, passport, visa, other
 *
 * Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "document-uuid",
 *     "student_id": "student-uuid",
 *     "document_type": "passport",
 *     "file_name": "passport.pdf",
 *     "file_path": "student-uuid/timestamp-random-passport.pdf",
 *     "file_size": 1234567,
 *     "url": "https://...",
 *     "uploaded_by": "user-uuid",
 *     "uploaded_at": "2024-01-01T00:00:00Z"
 *   }
 * }
 *
 * Error responses:
 * - 400: Validation error (invalid file type, size, or missing fields)
 * - 401: Not authenticated
 * - 403: Not authorized or student not found
 * - 413: File too large
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure student belongs to user's agency
 * - File type validation (PDF, JPEG, PNG only)
 * - File size limit: 10MB
 * - Unique filename generation to prevent conflicts
 *
 * @param request - Next.js request object with FormData
 * @param params - Route parameters containing student ID
 * @returns Created document metadata or error response
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

    // Get user's agency_id
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Verify student exists and belongs to user's agency
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, agency_id')
      .eq('id', studentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (studentError || !student) {
      throw new ForbiddenError('Student not found or access denied')
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentType = formData.get('document_type') as string | null

    // Validate required fields
    if (!file) {
      throw new ValidationError('File is required')
    }

    if (!documentType) {
      throw new ValidationError('Document type is required')
    }

    // Validate document type
    const validDocumentTypes: DocumentType[] = [
      'offer_letter',
      'passport',
      'visa',
      'other',
    ]
    if (!validDocumentTypes.includes(documentType as DocumentType)) {
      throw new ValidationError(
        `Invalid document type. Must be one of: ${validDocumentTypes.join(', ')}`
      )
    }

    // Upload file to Supabase Storage
    // This validates file type and size
    const uploadResult = await uploadDocument(supabase, studentId, file)

    // Store metadata in database
    const { data: documentRecord, error: insertError } = await supabase
      .from('student_documents')
      .insert({
        student_id: studentId,
        agency_id: userAgencyId,
        document_type: documentType as DocumentType,
        file_name: uploadResult.filename,
        file_path: uploadResult.path,
        file_size: uploadResult.size,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (insertError || !documentRecord) {
      console.error('Failed to insert document metadata:', insertError)

      // Clean up uploaded file if database insert fails
      try {
        await supabase.storage
          .from('student-documents')
          .remove([uploadResult.path])
      } catch (cleanupError) {
        console.error('Failed to clean up file after DB error:', cleanupError)
      }

      throw new Error('Failed to save document metadata')
    }

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      entity_type: 'student_document',
      entity_id: documentRecord.id,
      user_id: user.id,
      action: 'create',
      changes_json: {
        student_id: studentId,
        document_type: documentType,
        file_name: uploadResult.filename,
      },
    })

    // Return document metadata with public URL
    const response = {
      ...documentRecord,
      url: uploadResult.url,
    }

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${studentId}/documents`,
    })
  }
}

/**
 * GET /api/students/[id]/documents
 *
 * Lists all documents for a specific student.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "document-uuid",
 *       "student_id": "student-uuid",
 *       "document_type": "passport",
 *       "file_name": "passport.pdf",
 *       "file_path": "student-uuid/timestamp-passport.pdf",
 *       "file_size": 1234567,
 *       "url": "https://...",
 *       "uploaded_by": "user-uuid",
 *       "uploaded_at": "2024-01-01T00:00:00Z",
 *       "uploader": {
 *         "full_name": "John Doe",
 *         "email": "john@example.com"
 *       }
 *     }
 *   ]
 * }
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure documents belong to user's agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing student ID
 * @returns List of documents or error response
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
      .select('id, agency_id')
      .eq('id', studentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (studentError || !student) {
      throw new ForbiddenError('Student not found or access denied')
    }

    // Fetch documents with uploader information
    const { data: documents, error: documentsError } = await supabase
      .from('student_documents')
      .select(
        `
        *,
        uploader:users!student_documents_uploaded_by_fkey (
          full_name,
          email
        )
      `
      )
      .eq('student_id', studentId)
      .eq('agency_id', userAgencyId)
      .order('uploaded_at', { ascending: false })

    if (documentsError) {
      console.error('Failed to fetch documents:', documentsError)
      throw new Error('Failed to fetch documents')
    }

    // Add public URLs to each document
    const documentsWithUrls = (documents || []).map((doc) => ({
      ...doc,
      url: supabase.storage
        .from('student-documents')
        .getPublicUrl(doc.file_path).data.publicUrl,
    }))

    return createSuccessResponse(documentsWithUrls)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${studentId}/documents`,
    })
  }
}
