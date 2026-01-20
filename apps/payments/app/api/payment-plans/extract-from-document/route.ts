/**
 * Payment Plan Document Extraction API
 *
 * OCR-powered extraction of payment plan data from uploaded PDF/image documents.
 * Uses MistralAI's two-stage pipeline for high-accuracy extraction.
 *
 * Epic 4: Payments Domain
 * Story: Payment Plan OCR Upload
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  logAudit,
  MistralOCRClient,
  ProcessingStatus,
  ValidationError,
  ForbiddenError,
} from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'
import { uploadDocument, generateUniqueFilename } from '@pleeno/utils'

/**
 * Vercel Serverless Function Configuration
 * Extended timeout for OCR processing which can take 30-60 seconds for PDFs
 */
export const maxDuration = 60 // seconds (Pro plan limit)

/**
 * POST /api/payment-plans/extract-from-document
 *
 * Extracts payment plan data from an uploaded PDF or image document
 * using AI-powered OCR.
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Body:
 *   - file: File (required) - PDF, JPEG, or PNG (max 10MB)
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "extraction": {
 *       "student_name": "John Doe",
 *       "course_name": "Bachelor of Business",
 *       "total_course_value": 25000,
 *       "commission_rate": 0.15,
 *       "course_start_date": "2025-02-01",
 *       "course_end_date": "2026-12-01",
 *       "initial_payment_amount": 5000,
 *       "initial_payment_due_date": "2025-01-15",
 *       "number_of_installments": 10,
 *       "payment_frequency": "monthly",
 *       "materials_cost": 500,
 *       "admin_fees": 100,
 *       "other_fees": 0,
 *       "first_payment_due_date": "2025-03-01",
 *       "gst_inclusive": true,
 *       "installments": [...],
 *       "confidence_scores": {
 *         "student_name": 0.95,
 *         "course_name": 0.90,
 *         ...
 *         "overall": 0.85
 *       },
 *       "raw_text": "..."
 *     },
 *     "document_path": "payment-plan-documents/{agency_id}/{filename}",
 *     "processing_time_ms": 2500,
 *     "cost_usd": 0.002
 *   }
 * }
 *
 * Error responses:
 * - 400: Invalid file type or validation error
 * - 401: Not authenticated
 * - 403: Not authorized or subscription tier too low
 * - 413: File too large
 * - 429: Rate limit exceeded
 * - 504: Processing timeout
 * - 500: Extraction failed
 *
 * Security:
 * - Requires authentication
 * - Gated by subscription_tier (premium or enterprise only)
 * - File type validation (PDF, JPEG, PNG only)
 * - File size limit: 10MB
 * - All extractions logged for audit
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // SUBSCRIPTION TIER CHECK: Verify agency has premium or enterprise tier
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, name, subscription_tier')
      .eq('id', userAgencyId)
      .single()

    if (agencyError || !agency) {
      throw new ForbiddenError('Agency not found')
    }

    // Allow override for testing via environment variable
    const allowOverride = process.env.ALLOW_AI_EXTRACTION_OVERRIDE === 'true'

    if (agency.subscription_tier === 'basic' && !allowOverride) {
      throw new ForbiddenError(
        'AI document extraction is a premium feature. Please upgrade your subscription to access this feature.'
      )
    }

    // Verify Mistral API key is configured
    if (!process.env.MISTRAL_API_KEY) {
      console.error('Mistral API key not configured')
      throw new Error('AI extraction service is not configured. Please contact support.')
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    // Validate file is present
    if (!file) {
      throw new ValidationError('File is required')
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedMimeTypes.includes(file.type)) {
      throw new ValidationError(
        `Invalid file type. Only PDF, JPEG, and PNG files are supported. Received: ${file.type}`
      )
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        `File size must be less than 10MB. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determine MIME type for OCR client
    const mimeType = file.type as 'application/pdf' | 'image/jpeg' | 'image/png'

    // Upload document to Supabase Storage for audit trail
    let documentPath: string | undefined
    try {
      const uniqueFilename = generateUniqueFilename(file.name)
      documentPath = `${userAgencyId}/${uniqueFilename}`

      // Create a File object from the buffer for uploadDocument
      const uploadFile = new File([buffer], file.name, { type: file.type })

      const { error: uploadError } = await supabase.storage
        .from('payment-plan-documents')
        .upload(documentPath, uploadFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        // Log but don't fail - document storage is for audit, not critical path
        console.warn('Failed to upload document for audit trail:', uploadError)
        documentPath = undefined
      }
    } catch (uploadErr) {
      console.warn('Document upload error:', uploadErr)
      documentPath = undefined
    }

    // Initialize MistralOCRClient and extract data
    const ocrClient = new MistralOCRClient({
      apiKey: process.env.MISTRAL_API_KEY,
      timeoutMs: 60000, // 60 seconds for larger documents
    })

    const ocrResult = await ocrClient.extractFromBuffer(buffer, mimeType)

    // Handle extraction failure
    if (ocrResult.processingStatus === ProcessingStatus.FAILED) {
      // Map error codes to HTTP status codes
      const errorCode = ocrResult.error?.errorCode || 'PROVIDER_UNAVAILABLE'
      let httpStatus = 500
      let userMessage = 'Failed to extract data from document. Please try again or enter data manually.'

      switch (errorCode) {
        case 'RATE_LIMIT_EXCEEDED':
          httpStatus = 429
          userMessage = 'Service is temporarily busy. Please wait a moment and try again.'
          break
        case 'TIMEOUT':
          httpStatus = 504
          userMessage = 'Document processing took too long. Please try with a smaller or clearer document.'
          break
        case 'NO_EXTRACTABLE_TEXT':
          httpStatus = 400
          userMessage = 'No text could be extracted from the document. Please ensure the document is clear and readable.'
          break
        case 'INVALID_IMAGE_FORMAT':
          httpStatus = 400
          userMessage = 'Invalid document format. Please upload a PDF, JPEG, or PNG file.'
          break
        case 'PARSING_FAILED':
          httpStatus = 500
          userMessage = 'Failed to parse the extracted data. Please try again or enter data manually.'
          break
      }

      // Log failed extraction to audit trail
      await logAudit(supabase, {
        userId: user.id,
        agencyId: userAgencyId,
        entityType: 'ai_extraction',
        entityId: documentPath || '',
        action: 'create',
        metadata: {
          extraction_status: 'failed',
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          error_code: errorCode,
          error_message: ocrResult.error?.errorMessage,
          processing_time_ms: ocrResult.totalProcessingTimeMs,
          cost_usd: ocrResult.totalCostUsd,
          provider_invocations: ocrResult.providerInvocations,
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorCode,
            message: userMessage,
            manual_review_required: ocrResult.error?.manualReviewRequired ?? true,
          },
        },
        { status: httpStatus }
      )
    }

    // Successful extraction
    const extraction = ocrResult.result!

    // Log successful extraction to audit trail
    await logAudit(supabase, {
      userId: user.id,
      agencyId: userAgencyId,
      entityType: 'ai_extraction',
      entityId: documentPath || '',
      action: 'create',
      metadata: {
        extraction_status: 'success',
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        processing_time_ms: ocrResult.totalProcessingTimeMs,
        cost_usd: ocrResult.totalCostUsd,
        provider_invocations: ocrResult.providerInvocations,
        extracted_fields: {
          has_student_name: !!extraction.student_name,
          has_course_name: !!extraction.course_name,
          has_total_course_value: extraction.total_course_value !== null,
          has_commission_rate: extraction.commission_rate !== null,
          has_course_dates: !!extraction.course_start_date && !!extraction.course_end_date,
          has_initial_payment: extraction.initial_payment_amount !== null,
          has_installments: extraction.number_of_installments !== null,
          installments_extracted: extraction.installments?.length || 0,
        },
        confidence_scores: extraction.confidence_scores,
        has_low_confidence_fields: extraction.confidence_scores.overall < 0.5,
      },
    })

    // Return extraction result
    return NextResponse.json(
      {
        success: true,
        data: {
          extraction,
          document_path: documentPath,
          processing_time_ms: ocrResult.totalProcessingTimeMs,
          cost_usd: ocrResult.totalCostUsd,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: '/api/payment-plans/extract-from-document',
    })
  }
}
