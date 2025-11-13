/**
 * Offer Letter Download API
 *
 * This endpoint provides downloading and serving offer letter documents from
 * Supabase Storage with proper Content-Type and Content-Disposition headers.
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 4: Offer Letter Download API
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'

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
