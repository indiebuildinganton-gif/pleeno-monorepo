import { useMutation } from '@tanstack/react-query'
import { useToast } from '@pleeno/ui'
import type { PaymentPlanOCRResult, OCRErrorCode } from '@pleeno/validations'
import { getApiUrl } from '@/hooks/useApiUrl'

/**
 * API Response type for successful extraction
 */
interface ExtractFromDocumentSuccessResponse {
  success: true
  data: {
    extraction: PaymentPlanOCRResult
    document_path?: string
    processing_time_ms: number
    cost_usd: number
  }
}

/**
 * API Response type for failed extraction
 */
interface ExtractFromDocumentErrorResponse {
  success: false
  error: {
    code: OCRErrorCode
    message: string
    manual_review_required: boolean
  }
}

type ExtractFromDocumentResponse =
  | ExtractFromDocumentSuccessResponse
  | ExtractFromDocumentErrorResponse

/**
 * Hook return type with extraction data
 */
export interface ExtractFromDocumentResult {
  extraction: PaymentPlanOCRResult
  documentPath?: string
  processingTimeMs: number
  costUsd: number
}

/**
 * TanStack Query mutation hook for extracting payment plan data from documents
 *
 * Features:
 * - POST multipart/form-data to /api/payment-plans/extract-from-document
 * - Handles success with toast notification
 * - Handles various error types (rate limit, timeout, no text, etc.)
 * - Returns extraction result with confidence scores
 *
 * Usage:
 * ```tsx
 * const { mutate, isPending, data, error } = useExtractFromDocument()
 *
 * const handleFileSelect = (file: File) => {
 *   mutate(file, {
 *     onSuccess: (result) => {
 *       // Navigate to review screen with extracted data
 *       setExtractionResult(result)
 *     }
 *   })
 * }
 *
 * <DocumentUpload
 *   onFileSelect={handleFileSelect}
 *   isExtracting={isPending}
 * />
 * ```
 *
 * Epic 4: Payments Domain
 * Story: Payment Plan OCR Upload
 *
 * @returns TanStack Query mutation object
 */
export function useExtractFromDocument() {
  const { addToast } = useToast()

  return useMutation<ExtractFromDocumentResult, Error, File>({
    mutationFn: async (file: File): Promise<ExtractFromDocumentResult> => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(getApiUrl('/api/payment-plans/extract-from-document'), {
        method: 'POST',
        body: formData,
      })

      const result: ExtractFromDocumentResponse = await response.json()

      if (!response.ok || !result.success) {
        const errorResult = result as ExtractFromDocumentErrorResponse
        const errorMessage = errorResult.error?.message || 'Failed to extract data from document'

        // Add specific error handling based on error code
        if (errorResult.error?.code === 'RATE_LIMIT_EXCEEDED') {
          throw new Error('Service is busy. Please wait a moment and try again.')
        }
        if (errorResult.error?.code === 'TIMEOUT') {
          throw new Error('Processing took too long. Please try with a smaller or clearer document.')
        }
        if (errorResult.error?.code === 'NO_EXTRACTABLE_TEXT') {
          throw new Error('No text could be extracted. Please ensure the document is clear and readable.')
        }

        throw new Error(errorMessage)
      }

      const successResult = result as ExtractFromDocumentSuccessResponse

      return {
        extraction: successResult.data.extraction,
        documentPath: successResult.data.document_path,
        processingTimeMs: successResult.data.processing_time_ms,
        costUsd: successResult.data.cost_usd,
      }
    },

    onSuccess: (result) => {
      // Determine toast message based on overall confidence
      const overallConfidence = result.extraction.confidence_scores.overall

      if (overallConfidence >= 0.8) {
        addToast({
          title: 'Document extracted successfully',
          description: 'High confidence extraction. Please review the data.',
          variant: 'success',
        })
      } else if (overallConfidence >= 0.5) {
        addToast({
          title: 'Document extracted',
          description: 'Some fields have lower confidence. Please review carefully.',
          variant: 'warning',
        })
      } else {
        addToast({
          title: 'Document extracted with warnings',
          description: 'Many fields have low confidence. Please verify all data.',
          variant: 'warning',
        })
      }
    },

    onError: (error: Error) => {
      addToast({
        title: 'Extraction failed',
        description: error.message,
        variant: 'error',
      })
    },
  })
}

/**
 * Check if extraction has low confidence fields that need attention
 */
export function hasLowConfidenceFields(extraction: PaymentPlanOCRResult): boolean {
  const requiredFields: (keyof PaymentPlanOCRResult['confidence_scores'])[] = [
    'student_name',
    'course_name',
    'total_course_value',
    'commission_rate',
  ]

  return requiredFields.some((field) => extraction.confidence_scores[field] < 0.5)
}

/**
 * Get list of fields with low confidence
 */
export function getLowConfidenceFieldNames(extraction: PaymentPlanOCRResult): string[] {
  const fieldLabels: Record<keyof PaymentPlanOCRResult['confidence_scores'], string> = {
    student_name: 'Student Name',
    course_name: 'Course Name',
    total_course_value: 'Total Course Value',
    commission_rate: 'Commission Rate',
    course_start_date: 'Course Start Date',
    course_end_date: 'Course End Date',
    initial_payment_amount: 'Initial Payment',
    initial_payment_due_date: 'Initial Payment Due Date',
    number_of_installments: 'Number of Installments',
    payment_frequency: 'Payment Frequency',
    materials_cost: 'Materials Cost',
    admin_fees: 'Admin Fees',
    other_fees: 'Other Fees',
    first_payment_due_date: 'First Payment Due Date',
    gst_inclusive: 'GST Inclusive',
    installments: 'Installments',
    overall: 'Overall',
  }

  const lowConfidenceFields: string[] = []

  for (const [key, value] of Object.entries(extraction.confidence_scores)) {
    if (key !== 'overall' && value < 0.5) {
      lowConfidenceFields.push(fieldLabels[key as keyof typeof fieldLabels])
    }
  }

  return lowConfidenceFields
}
