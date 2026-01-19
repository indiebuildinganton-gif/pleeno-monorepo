import { z } from 'zod'

/**
 * OCR Extraction Validation Schemas
 *
 * Schemas for validating OCR extraction results from payment plan documents.
 *
 * Epic 4: Payments Domain
 * Story: Payment Plan OCR Upload
 */

/**
 * Individual extracted installment schema
 */
export const ExtractedInstallmentSchema = z.object({
  installment_number: z.number().int().min(1),
  amount: z.number().positive().nullable(),
  due_date: z.string().date().nullable(),
})

export type ExtractedInstallment = z.infer<typeof ExtractedInstallmentSchema>

/**
 * Confidence scores schema (0-1 range)
 */
export const PaymentPlanConfidenceScoresSchema = z.object({
  student_name: z.number().min(0).max(1),
  course_name: z.number().min(0).max(1),
  total_course_value: z.number().min(0).max(1),
  commission_rate: z.number().min(0).max(1),
  course_start_date: z.number().min(0).max(1),
  course_end_date: z.number().min(0).max(1),
  initial_payment_amount: z.number().min(0).max(1),
  initial_payment_due_date: z.number().min(0).max(1),
  number_of_installments: z.number().min(0).max(1),
  payment_frequency: z.number().min(0).max(1),
  materials_cost: z.number().min(0).max(1),
  admin_fees: z.number().min(0).max(1),
  other_fees: z.number().min(0).max(1),
  first_payment_due_date: z.number().min(0).max(1),
  gst_inclusive: z.number().min(0).max(1),
  installments: z.number().min(0).max(1),
  overall: z.number().min(0).max(1),
})

export type PaymentPlanConfidenceScores = z.infer<typeof PaymentPlanConfidenceScoresSchema>

/**
 * Payment frequency enum for OCR extraction
 */
export const OCRPaymentFrequencyEnum = z.enum(['monthly', 'quarterly', 'custom'])

export type OCRPaymentFrequency = z.infer<typeof OCRPaymentFrequencyEnum>

/**
 * Complete OCR extraction result schema for payment plans
 */
export const PaymentPlanOCRResultSchema = z.object({
  // Student and course info
  student_name: z.string().nullable(),
  course_name: z.string().nullable(),
  total_course_value: z.number().positive().nullable(),
  commission_rate: z.number().min(0).max(1).nullable(),
  course_start_date: z.string().date().nullable(),
  course_end_date: z.string().date().nullable(),

  // Payment structure
  initial_payment_amount: z.number().nonnegative().nullable(),
  initial_payment_due_date: z.string().date().nullable(),
  number_of_installments: z.number().int().positive().nullable(),
  payment_frequency: OCRPaymentFrequencyEnum.nullable(),

  // Non-commissionable fees
  materials_cost: z.number().nonnegative().nullable(),
  admin_fees: z.number().nonnegative().nullable(),
  other_fees: z.number().nonnegative().nullable(),

  // Payment schedule
  first_payment_due_date: z.string().date().nullable(),
  gst_inclusive: z.boolean().nullable(),

  // Individual installments if specified
  installments: z.array(ExtractedInstallmentSchema).nullable(),

  // Confidence scores
  confidence_scores: PaymentPlanConfidenceScoresSchema,

  // Raw text for debugging
  raw_text: z.string(),
})

export type PaymentPlanOCRResult = z.infer<typeof PaymentPlanOCRResultSchema>

/**
 * Threshold constants for confidence levels
 */
export const CONFIDENCE_THRESHOLDS = {
  /** High confidence - green indicator */
  HIGH: 0.8,
  /** Medium confidence - yellow indicator */
  MEDIUM: 0.5,
  /** Low confidence - red indicator */
  LOW: 0.5,
} as const

/**
 * Get confidence level for a score
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) return 'high'
  if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium'
  return 'low'
}

/**
 * Check if any required fields have low confidence
 */
export function hasLowConfidenceFields(scores: PaymentPlanConfidenceScores): boolean {
  const requiredFields: (keyof PaymentPlanConfidenceScores)[] = [
    'student_name',
    'course_name',
    'total_course_value',
    'commission_rate',
  ]

  return requiredFields.some((field) => scores[field] < CONFIDENCE_THRESHOLDS.MEDIUM)
}

/**
 * Get fields with low confidence
 */
export function getLowConfidenceFields(
  scores: PaymentPlanConfidenceScores
): Array<{ field: string; score: number }> {
  const fields: Array<{ field: string; score: number }> = []

  for (const [key, value] of Object.entries(scores)) {
    if (key !== 'overall' && value < CONFIDENCE_THRESHOLDS.MEDIUM) {
      fields.push({ field: key, score: value })
    }
  }

  return fields.sort((a, b) => a.score - b.score)
}

/**
 * API request schema for document extraction endpoint
 */
export const ExtractFromDocumentRequestSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
      return allowedTypes.includes(file.type)
    },
    { message: 'File must be PDF, JPEG, or PNG' }
  ).refine(
    (file) => file.size <= 10 * 1024 * 1024,
    { message: 'File must be less than 10MB' }
  ),
})

export type ExtractFromDocumentRequest = z.infer<typeof ExtractFromDocumentRequestSchema>

/**
 * API response schema for successful extraction
 */
export const ExtractFromDocumentResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    extraction: PaymentPlanOCRResultSchema,
    document_path: z.string().optional(),
    processing_time_ms: z.number(),
    cost_usd: z.number(),
  }),
})

export type ExtractFromDocumentResponse = z.infer<typeof ExtractFromDocumentResponseSchema>

/**
 * OCR processing status enum
 */
export const OCRProcessingStatusEnum = z.enum(['completed', 'failed', 'partial'])

export type OCRProcessingStatus = z.infer<typeof OCRProcessingStatusEnum>

/**
 * OCR error code enum
 */
export const OCRErrorCodeEnum = z.enum([
  'PROVIDER_UNAVAILABLE',
  'RATE_LIMIT_EXCEEDED',
  'INVALID_IMAGE_FORMAT',
  'NO_EXTRACTABLE_TEXT',
  'TIMEOUT',
  'PARSING_FAILED',
])

export type OCRErrorCode = z.infer<typeof OCRErrorCodeEnum>

/**
 * Error response schema for extraction failures
 */
export const ExtractFromDocumentErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: OCRErrorCodeEnum,
    message: z.string(),
    manual_review_required: z.boolean(),
  }),
})

export type ExtractFromDocumentError = z.infer<typeof ExtractFromDocumentErrorSchema>
