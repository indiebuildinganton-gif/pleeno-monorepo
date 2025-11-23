/**
 * Offer Letter Upload and Download API
 *
 * This endpoint provides uploading and downloading offer letter documents
 * to/from Supabase Storage with proper validation and audit logging.
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 3: Offer Letter Upload API
 * Task 4: Offer Letter Download API
 * Task 11: Audit Logging
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  validateFile,
  generateUniqueFilename,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { logAudit } from '@pleeno/database'

/**
 * GET /api/enrollments/[id]/offer-letter
 *
 * Downloads or displays an offer letter document for a specific enrollment.
 * The endpoint fetches the document from Supabase Storage and streams it
 * to the client with appropriate headers.
 *
 * Query Parameters:
 * - download: boolean (optional) - If true, sets Content-Disposition to 'attachment'
 *   forcing a download. If false or omitted, sets to 'inline' for browser viewing.
 *
 * Response (200):
 * Returns the file stream with headers:
 * - Content-Type: application/pdf | image/jpeg | image/png (based on file type)
 * - Content-Disposition: attachment; filename="..." | inline; filename="..."
 * - Content-Length: file size in bytes
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not authorized (enrollment belongs to different agency)
 * - 404: Enrollment not found or no offer letter exists
 * - 500: Storage error or file fetch failure
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure enrollment belongs to user's agency
 * - Storage bucket access controlled by RLS policies
 * - Validates enrollment exists and has offer letter before serving
 *
 * @param request - Next.js request object with optional 'download' query param
 * @param params - Route parameters containing enrollment ID
 * @returns File stream with appropriate headers or error response
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

    // Get user's agency_id for RLS enforcement
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Fetch enrollment record to get offer letter URL and filename
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, offer_letter_url, offer_letter_filename')
      .eq('id', id)
      .eq('agency_id', userAgencyId)
      .single()

    if (enrollmentError || !enrollment) {
      throw new ValidationError('Enrollment not found')
    }

    // Check if enrollment has an offer letter
    if (!enrollment.offer_letter_url || !enrollment.offer_letter_filename) {
      throw new ValidationError('No offer letter found for this enrollment')
    }

    // Extract the storage path from the full URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/enrollment-documents/{path}
    // We need just the path part: enrollment-documents/{enrollment_id}/{filename}
    const url = new URL(enrollment.offer_letter_url)
    const pathParts = url.pathname.split('/object/public/')
    if (pathParts.length < 2) {
      console.error('Invalid storage URL format:', enrollment.offer_letter_url)
      throw new Error('Invalid storage URL format')
    }
    const storagePath = pathParts[1]

    // Download file from Supabase Storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('enrollment-documents')
      .download(storagePath.replace('enrollment-documents/', ''))

    if (storageError || !fileData) {
      console.error('Failed to download file from storage:', storageError)
      throw new Error('Failed to retrieve offer letter from storage')
    }

    // Determine Content-Type based on file extension
    const filename = enrollment.offer_letter_filename.toLowerCase()
    let contentType = 'application/octet-stream' // default

    if (filename.endsWith('.pdf')) {
      contentType = 'application/pdf'
    } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
      contentType = 'image/jpeg'
    } else if (filename.endsWith('.png')) {
      contentType = 'image/png'
    }

    // Determine Content-Disposition based on query parameter
    const searchParams = request.nextUrl.searchParams
    const shouldDownload = searchParams.get('download') === 'true'
    const disposition = shouldDownload ? 'attachment' : 'inline'

    // Convert Blob to ArrayBuffer for streaming
    const arrayBuffer = await fileData.arrayBuffer()

    // Return file with appropriate headers
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${enrollment.offer_letter_filename}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    return handleApiError(error, {
      path: `/api/enrollments/${id}/offer-letter`,
    })
  }
}

/**
 * POST /api/enrollments/[id]/offer-letter
 *
 * Uploads an offer letter document for a specific enrollment.
 * The endpoint validates the file, uploads it to Supabase Storage,
 * updates the enrollment record, and logs the action to audit trail.
 *
 * Request body:
 * - FormData with 'file' field containing the document (PDF, JPEG, or PNG)
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "enrollment-uuid",
 *     "offer_letter_url": "https://...",
 *     "offer_letter_filename": "document.pdf"
 *   }
 * }
 *
 * Error responses:
 * - 400: Validation error (invalid file type, size, or missing file)
 * - 401: Not authenticated
 * - 403: Not authorized (enrollment belongs to different agency)
 * - 404: Enrollment not found
 * - 500: Upload or database error
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure enrollment belongs to user's agency
 * - File validation (type and size)
 * - Automatic deletion of old offer letter when uploading new one
 * - Audit logging for document uploads
 *
 * @param request - Next.js request object with FormData containing file
 * @param params - Route parameters containing enrollment ID
 * @returns Updated enrollment object with offer letter details
 */
export async function POST(
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

    // Get user's agency_id for RLS enforcement
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Fetch enrollment record to verify existence and get current offer letter
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, offer_letter_url, agency_id')
      .eq('id', id)
      .eq('agency_id', userAgencyId)
      .single()

    if (enrollmentError || !enrollment) {
      throw new ValidationError('Enrollment not found')
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      throw new ValidationError('No file provided or invalid file format')
    }

    // Validate file (type and size)
    validateFile(file)

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name)
    const storagePath = `${id}/${uniqueFilename}`

    // Delete old offer letter if exists
    if (enrollment.offer_letter_url) {
      try {
        // Extract path from URL
        const url = new URL(enrollment.offer_letter_url)
        const pathParts = url.pathname.split('/object/public/')
        if (pathParts.length >= 2) {
          const oldPath = pathParts[1].replace('enrollment-documents/', '')
          await supabase.storage.from('enrollment-documents').remove([oldPath])
        }
      } catch (deleteError) {
        console.error('Failed to delete old offer letter:', deleteError)
        // Continue with upload even if delete fails
      }
    }

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('enrollment-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('enrollment-documents').getPublicUrl(storagePath)

    // Update enrollment record with offer letter details
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('enrollments')
      .update({
        offer_letter_url: publicUrl,
        offer_letter_filename: file.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('agency_id', userAgencyId)
      .select('id, offer_letter_url, offer_letter_filename')
      .single()

    if (updateError) {
      console.error('Failed to update enrollment:', updateError)
      throw new Error('Failed to update enrollment with offer letter details')
    }

    if (!updatedEnrollment) {
      throw new Error('Enrollment not found after update')
    }

    // Log offer letter upload to audit trail
    await logAudit(supabase, {
      userId: user.id,
      agencyId: userAgencyId,
      entityType: 'enrollment_document',
      entityId: id,
      action: 'create',
      oldValues: enrollment.offer_letter_url
        ? {
            offer_letter_url: enrollment.offer_letter_url,
          }
        : null,
      newValues: {
        offer_letter_url: publicUrl,
        offer_letter_filename: file.name,
        file_size: file.size,
      },
      metadata: {
        operation: 'offer_letter_upload',
        storage_path: storagePath,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: updatedEnrollment,
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: `/api/enrollments/${id}/offer-letter`,
    })
  }
}
