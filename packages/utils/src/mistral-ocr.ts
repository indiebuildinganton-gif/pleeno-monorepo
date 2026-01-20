/**
 * Mistral OCR Client for Payment Plan Document Extraction
 *
 * Provides AI-powered extraction of payment plan data from uploaded
 * PDF or image documents (scanned paper payment plans).
 *
 * Two-Stage Pipeline:
 * 1. Stage 1: mistral-ocr-latest -> Raw text extraction
 * 2. Stage 2: pixtral-12b-latest -> Structured JSON parsing
 *
 * Epic 4: Payments Domain
 * Story: Payment Plan OCR Upload
 */

import { Mistral } from '@mistralai/mistralai'

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Error codes for OCR processing failures
 */
export enum OCRErrorCode {
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_IMAGE_FORMAT = 'INVALID_IMAGE_FORMAT',
  NO_EXTRACTABLE_TEXT = 'NO_EXTRACTABLE_TEXT',
  TIMEOUT = 'TIMEOUT',
  PARSING_FAILED = 'PARSING_FAILED',
}

/**
 * Base OCR error class
 */
export class OCRError extends Error {
  constructor(
    message: string,
    public code: OCRErrorCode,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'OCRError'
  }
}

export class OCRRateLimitError extends OCRError {
  constructor(message: string = 'Mistral API rate limit exceeded') {
    super(message, OCRErrorCode.RATE_LIMIT_EXCEEDED, true)
    this.name = 'OCRRateLimitError'
  }
}

export class OCRTimeoutError extends OCRError {
  constructor(message: string = 'OCR processing timeout') {
    super(message, OCRErrorCode.TIMEOUT, true)
    this.name = 'OCRTimeoutError'
  }
}

export class OCRParsingError extends OCRError {
  constructor(message: string = 'Failed to parse OCR response') {
    super(message, OCRErrorCode.PARSING_FAILED, false)
    this.name = 'OCRParsingError'
  }
}

// ============================================================================
// Types
// ============================================================================

/**
 * Individual installment extracted from document
 */
export interface ExtractedInstallment {
  installment_number: number
  amount: number | null
  due_date: string | null
}

/**
 * Confidence scores for each extracted field (0-1)
 */
export interface PaymentPlanConfidenceScores {
  student_name: number
  course_name: number
  total_course_value: number
  commission_rate: number
  course_start_date: number
  course_end_date: number
  initial_payment_amount: number
  initial_payment_due_date: number
  number_of_installments: number
  payment_frequency: number
  materials_cost: number
  admin_fees: number
  other_fees: number
  first_payment_due_date: number
  gst_inclusive: number
  installments: number
  overall: number
}

/**
 * Result from payment plan document extraction
 */
export interface PaymentPlanOCRResult {
  // Student and course info
  student_name: string | null
  course_name: string | null
  total_course_value: number | null
  commission_rate: number | null // Decimal 0-1
  course_start_date: string | null // YYYY-MM-DD
  course_end_date: string | null // YYYY-MM-DD

  // Payment structure
  initial_payment_amount: number | null
  initial_payment_due_date: string | null // YYYY-MM-DD
  number_of_installments: number | null
  payment_frequency: 'monthly' | 'quarterly' | 'custom' | null

  // Non-commissionable fees
  materials_cost: number | null
  admin_fees: number | null
  other_fees: number | null

  // Payment schedule
  first_payment_due_date: string | null // YYYY-MM-DD
  gst_inclusive: boolean | null

  // Individual installments if specified in document
  installments: ExtractedInstallment[] | null

  // Confidence scores
  confidence_scores: PaymentPlanConfidenceScores

  // Raw text for debugging
  raw_text: string
}

/**
 * Provider invocation metadata for audit trail
 */
export interface ProviderInvocation {
  providerName: string
  modelName: string
  invocationSequence: number
  costUsd: number
  responseTimeMs: number
  fallbackTriggered: boolean
}

/**
 * Error details for failed OCR operations
 */
export interface OCRErrorDetails {
  errorCode: OCRErrorCode
  errorMessage: string
  manualReviewRequired: boolean
}

/**
 * Processing status enum
 */
export enum ProcessingStatus {
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

/**
 * Complete OCR processing response
 */
export interface OCRProcessingResult {
  processingStatus: ProcessingStatus
  result?: PaymentPlanOCRResult
  providerInvocations: ProviderInvocation[]
  error?: OCRErrorDetails
  totalProcessingTimeMs: number
  totalCostUsd: number
}

/**
 * Options for MistralOCRClient initialization
 */
export interface MistralOCRClientOptions {
  apiKey?: string
  timeoutMs?: number
  maxRetries?: number
  initialRetryDelayMs?: number
  maxRetryDelayMs?: number
}

// ============================================================================
// MistralOCRClient
// ============================================================================

/**
 * Mistral OCR Client for payment plan document extraction.
 *
 * Features:
 * - Two-stage OCR pipeline (text extraction + structured parsing)
 * - Automatic retry with exponential backoff
 * - Cost tracking per API call
 * - Timeout handling (30s default)
 * - Rate limit detection and retry
 *
 * Pricing (as of 2025-01):
 * - Stage 1 (mistral-ocr-latest): $0.001/page
 * - Stage 2 (pixtral-12b-latest): $0.15/1M tokens
 */
export class MistralOCRClient {
  private client: Mistral
  private options: Required<MistralOCRClientOptions>

  // Cost constants (per Mistral pricing)
  private readonly COST_PER_PAGE_OCR = 0.001 // $0.001/page
  private readonly COST_PER_1M_TOKENS_PIXTRAL = 0.15 // $0.15/1M tokens

  constructor(options: MistralOCRClientOptions = {}) {
    this.options = {
      apiKey: options.apiKey || process.env.MISTRAL_API_KEY || '',
      timeoutMs: options.timeoutMs || 30000,
      maxRetries: options.maxRetries || 3,
      initialRetryDelayMs: options.initialRetryDelayMs || 1000,
      maxRetryDelayMs: options.maxRetryDelayMs || 4000,
    }

    if (!this.options.apiKey) {
      throw new Error(
        'Mistral API key not configured. Set MISTRAL_API_KEY environment variable or pass apiKey option.'
      )
    }

    this.client = new Mistral({
      apiKey: this.options.apiKey,
    })

    console.log('[MistralOCRClient] Initialized with timeout:', this.options.timeoutMs, 'ms')
  }

  /**
   * Extract payment plan data from document buffer.
   *
   * @param buffer - File buffer (PDF or image)
   * @param mimeType - MIME type of the file
   * @returns OCR processing result with extracted data
   */
  async extractFromBuffer(
    buffer: Buffer,
    mimeType: 'application/pdf' | 'image/jpeg' | 'image/png'
  ): Promise<OCRProcessingResult> {
    const startTime = Date.now()
    const providerInvocations: ProviderInvocation[] = []

    try {
      console.log(`[MistralOCRClient] Processing document (${mimeType}, ${buffer.length} bytes)`)

      // Stage 1: Extract raw text with Mistral OCR
      const { rawText, stage1Invocation } = await this.stageOneExtractText(buffer, mimeType)
      providerInvocations.push(stage1Invocation)

      // Check if any text was extracted
      if (!rawText || rawText.trim().length === 0) {
        console.warn('[MistralOCRClient] No text extracted from document')

        return {
          processingStatus: ProcessingStatus.FAILED,
          providerInvocations,
          error: {
            errorCode: OCRErrorCode.NO_EXTRACTABLE_TEXT,
            errorMessage: 'No text content extracted from document. The file may be blank or unreadable.',
            manualReviewRequired: true,
          },
          totalProcessingTimeMs: Date.now() - startTime,
          totalCostUsd: stage1Invocation.costUsd,
        }
      }

      // Stage 2: Parse structured content with Pixtral
      const { result, stage2Invocation } = await this.stageTwoParseStructure(buffer, mimeType, rawText)
      providerInvocations.push(stage2Invocation)

      // Add raw text to result
      result.raw_text = rawText

      const totalCost = providerInvocations.reduce((sum, inv) => sum + inv.costUsd, 0)
      const totalTime = Date.now() - startTime

      console.log(
        `[MistralOCRClient] Successfully processed document: ` +
          `${rawText.length} chars, cost=$${totalCost.toFixed(4)}, time=${totalTime}ms`
      )

      return {
        processingStatus: ProcessingStatus.COMPLETED,
        result,
        providerInvocations,
        totalProcessingTimeMs: totalTime,
        totalCostUsd: totalCost,
      }
    } catch (error) {
      const totalTime = Date.now() - startTime
      const totalCost = providerInvocations.reduce((sum, inv) => sum + inv.costUsd, 0)

      console.error('[MistralOCRClient] Error processing document:', error)

      const errorDetails = this.convertErrorToDetails(error)

      return {
        processingStatus: ProcessingStatus.FAILED,
        providerInvocations,
        error: errorDetails,
        totalProcessingTimeMs: totalTime,
        totalCostUsd: totalCost,
      }
    }
  }

  /**
   * Stage 1: Extract raw text using Mistral OCR.
   */
  private async stageOneExtractText(
    buffer: Buffer,
    mimeType: string
  ): Promise<{ rawText: string; stage1Invocation: ProviderInvocation }> {
    const stageStart = Date.now()

    console.log('[MistralOCRClient] Stage 1: Starting OCR text extraction')

    try {
      const base64Data = buffer.toString('base64')
      const dataUri = `data:${mimeType};base64,${base64Data}`

      console.log(`[MistralOCRClient] Stage 1: Base64 encoded, data URI length: ${dataUri.length} chars`)
      console.log(`[MistralOCRClient] Stage 1: Calling Mistral OCR API...`)

      const ocrResponse = await this.retryWithBackoff(async () => {
        const startApiCall = Date.now()
        console.log(`[MistralOCRClient] Stage 1: API call started at ${new Date().toISOString()}`)

        const response = await this.client.ocr.complete({
          model: 'mistral-ocr-latest',
          document: {
            type: 'image_url',
            imageUrl: dataUri,
          },
          includeImageBase64: false,
        })

        console.log(`[MistralOCRClient] Stage 1: API call completed in ${Date.now() - startApiCall}ms`)
        return response
      })

      let rawText = ''
      const pages = ocrResponse.pages

      for (const page of pages) {
        rawText += page.markdown + '\n\n'
      }

      rawText = rawText.trim()

      const cost = this.COST_PER_PAGE_OCR * Math.max(1, pages.length)
      const duration = Date.now() - stageStart

      console.log(
        `[MistralOCRClient] Stage 1 complete: ${rawText.length} chars, ` +
          `${pages.length} pages, cost=$${cost.toFixed(4)}, time=${duration}ms`
      )

      return {
        rawText,
        stage1Invocation: {
          providerName: 'MistralOCR',
          modelName: 'mistral-ocr-latest',
          invocationSequence: 1,
          costUsd: cost,
          responseTimeMs: duration,
          fallbackTriggered: false,
        },
      }
    } catch (error) {
      console.error('[MistralOCRClient] Stage 1 failed:', error)
      throw this.wrapApiError(error, 'Stage 1 OCR extraction')
    }
  }

  /**
   * Stage 2: Parse structured payment plan content using Pixtral.
   */
  private async stageTwoParseStructure(
    buffer: Buffer,
    mimeType: string,
    rawText: string
  ): Promise<{ result: PaymentPlanOCRResult; stage2Invocation: ProviderInvocation }> {
    const stageStart = Date.now()

    console.log('[MistralOCRClient] Stage 2: Starting structured parsing')

    try {
      const base64Data = buffer.toString('base64')
      const dataUri = `data:${mimeType};base64,${base64Data}`

      const prompt = this.createPaymentPlanExtractionPrompt(rawText)

      const chatResponse = await this.retryWithBackoff(async () => {
        const response = await this.client.chat.complete({
          model: 'pixtral-12b-latest',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', imageUrl: dataUri },
              ],
            },
          ],
        })
        return response
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const content = (chatResponse as any).choices?.[0]?.message?.content || ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usage = (chatResponse as any).usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      }

      const result = this.parsePaymentPlanResponse(content, rawText)

      const totalTokens = usage.totalTokens || 0
      const cost = (this.COST_PER_1M_TOKENS_PIXTRAL * totalTokens) / 1_000_000
      const duration = Date.now() - stageStart

      console.log(
        `[MistralOCRClient] Stage 2 complete: ${totalTokens} tokens, ` +
          `cost=$${cost.toFixed(4)}, time=${duration}ms`
      )

      return {
        result,
        stage2Invocation: {
          providerName: 'Pixtral12B',
          modelName: 'pixtral-12b-latest',
          invocationSequence: 2,
          costUsd: cost,
          responseTimeMs: duration,
          fallbackTriggered: false,
        },
      }
    } catch (error) {
      console.error('[MistralOCRClient] Stage 2 failed:', error)
      throw this.wrapApiError(error, 'Stage 2 structured parsing')
    }
  }

  /**
   * Create extraction prompt for payment plan documents.
   */
  private createPaymentPlanExtractionPrompt(rawText: string): string {
    return `You are an expert data extraction assistant for payment plan documents used by education agencies.
Extract the following fields from this payment plan document. Analyze both the image and the OCR text provided.

**Raw OCR Text (for reference):**
${rawText.substring(0, 2000)}${rawText.length > 2000 ? '...' : ''}

**Required Fields to Extract:**
- student_name: Full name of the student
- course_name: Name of the course/program
- total_course_value: Total course fee amount (number only, no currency symbols)
- commission_rate: Agency commission percentage (convert to decimal 0-1, e.g., 15% = 0.15)
- course_start_date: Course start date (YYYY-MM-DD format)
- course_end_date: Course end date (YYYY-MM-DD format)

**Optional Payment Fields:**
- initial_payment_amount: Upfront/deposit amount (number only)
- initial_payment_due_date: When initial payment is due (YYYY-MM-DD)
- number_of_installments: Total number of installments after initial payment
- payment_frequency: "monthly", "quarterly", or "custom"
- materials_cost: Non-commissionable materials cost (number only)
- admin_fees: Non-commissionable admin fees (number only)
- other_fees: Other non-commissionable fees (number only)
- first_payment_due_date: First regular installment date (YYYY-MM-DD)
- gst_inclusive: Whether amounts include GST (true/false)
- installments: Array of individual installments if specified, each with:
  - installment_number: 1, 2, 3, etc.
  - amount: Payment amount (number)
  - due_date: Payment due date (YYYY-MM-DD)

**Return JSON with this exact structure:**
{
  "student_name": "string or null",
  "course_name": "string or null",
  "total_course_value": number or null,
  "commission_rate": number 0-1 or null,
  "course_start_date": "YYYY-MM-DD or null",
  "course_end_date": "YYYY-MM-DD or null",
  "initial_payment_amount": number or null,
  "initial_payment_due_date": "YYYY-MM-DD or null",
  "number_of_installments": number or null,
  "payment_frequency": "monthly"|"quarterly"|"custom" or null,
  "materials_cost": number or null,
  "admin_fees": number or null,
  "other_fees": number or null,
  "first_payment_due_date": "YYYY-MM-DD or null",
  "gst_inclusive": boolean or null,
  "installments": [{"installment_number": 1, "amount": number, "due_date": "YYYY-MM-DD"}] or null,
  "confidence_scores": {
    "student_name": 0.0-1.0,
    "course_name": 0.0-1.0,
    "total_course_value": 0.0-1.0,
    "commission_rate": 0.0-1.0,
    "course_start_date": 0.0-1.0,
    "course_end_date": 0.0-1.0,
    "initial_payment_amount": 0.0-1.0,
    "initial_payment_due_date": 0.0-1.0,
    "number_of_installments": 0.0-1.0,
    "payment_frequency": 0.0-1.0,
    "materials_cost": 0.0-1.0,
    "admin_fees": 0.0-1.0,
    "other_fees": 0.0-1.0,
    "first_payment_due_date": 0.0-1.0,
    "gst_inclusive": 0.0-1.0,
    "installments": 0.0-1.0,
    "overall": 0.0-1.0
  }
}

**Rules:**
- Use null for fields that cannot be found or confidently extracted
- Confidence scores should reflect certainty (1.0 = certain, 0.0 = guessing)
- Convert all amounts to numbers (remove $ signs, commas, etc.)
- Convert percentages to decimals (15% = 0.15)
- Use YYYY-MM-DD format for all dates
- Return JSON only, no markdown code blocks

Return JSON:`
  }

  /**
   * Parse JSON response from Pixtral.
   */
  private parsePaymentPlanResponse(responseContent: string, rawText: string): PaymentPlanOCRResult {
    try {
      let jsonStr = responseContent.trim()

      // Strip markdown code blocks if present
      if (jsonStr.includes('```json')) {
        const start = jsonStr.indexOf('```json') + 7
        const end = jsonStr.indexOf('```', start)
        jsonStr = jsonStr.substring(start, end).trim()
      } else if (jsonStr.includes('```')) {
        const start = jsonStr.indexOf('```') + 3
        const end = jsonStr.indexOf('```', start)
        jsonStr = jsonStr.substring(start, end).trim()
      }

      const parsed = JSON.parse(jsonStr)

      // Normalize and validate the parsed data
      return {
        student_name: this.normalizeString(parsed.student_name),
        course_name: this.normalizeString(parsed.course_name),
        total_course_value: this.normalizeNumber(parsed.total_course_value),
        commission_rate: this.normalizeNumber(parsed.commission_rate),
        course_start_date: this.normalizeDate(parsed.course_start_date),
        course_end_date: this.normalizeDate(parsed.course_end_date),
        initial_payment_amount: this.normalizeNumber(parsed.initial_payment_amount),
        initial_payment_due_date: this.normalizeDate(parsed.initial_payment_due_date),
        number_of_installments: this.normalizeInteger(parsed.number_of_installments),
        payment_frequency: this.normalizePaymentFrequency(parsed.payment_frequency),
        materials_cost: this.normalizeNumber(parsed.materials_cost),
        admin_fees: this.normalizeNumber(parsed.admin_fees),
        other_fees: this.normalizeNumber(parsed.other_fees),
        first_payment_due_date: this.normalizeDate(parsed.first_payment_due_date),
        gst_inclusive: this.normalizeBoolean(parsed.gst_inclusive),
        installments: this.normalizeInstallments(parsed.installments),
        confidence_scores: this.normalizeConfidenceScores(parsed.confidence_scores),
        raw_text: rawText,
      }
    } catch (error) {
      console.error('[MistralOCRClient] Failed to parse response:', error)
      console.error('Response content:', responseContent)

      // Return empty result on parse failure
      return this.createEmptyResult(rawText)
    }
  }

  private normalizeString(value: unknown): string | null {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
    return null
  }

  private normalizeNumber(value: unknown): number | null {
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      return value
    }
    if (typeof value === 'string') {
      const cleaned = value.replace(/[$,\s]/g, '')
      const num = parseFloat(cleaned)
      if (!isNaN(num) && isFinite(num)) {
        return num
      }
    }
    return null
  }

  private normalizeInteger(value: unknown): number | null {
    const num = this.normalizeNumber(value)
    if (num !== null) {
      return Math.round(num)
    }
    return null
  }

  private normalizeDate(value: unknown): string | null {
    if (typeof value !== 'string' || !value) {
      return null
    }
    // Validate YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (dateRegex.test(value)) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return value
      }
    }
    return null
  }

  private normalizePaymentFrequency(value: unknown): 'monthly' | 'quarterly' | 'custom' | null {
    if (typeof value === 'string') {
      const lower = value.toLowerCase()
      if (lower === 'monthly') return 'monthly'
      if (lower === 'quarterly') return 'quarterly'
      if (lower === 'custom') return 'custom'
    }
    return null
  }

  private normalizeBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
      return value
    }
    if (typeof value === 'string') {
      const lower = value.toLowerCase()
      if (lower === 'true' || lower === 'yes') return true
      if (lower === 'false' || lower === 'no') return false
    }
    return null
  }

  private normalizeInstallments(value: unknown): ExtractedInstallment[] | null {
    if (!Array.isArray(value) || value.length === 0) {
      return null
    }

    const installments: ExtractedInstallment[] = []
    for (const item of value) {
      if (typeof item === 'object' && item !== null) {
        installments.push({
          installment_number: this.normalizeInteger(item.installment_number) ?? installments.length + 1,
          amount: this.normalizeNumber(item.amount),
          due_date: this.normalizeDate(item.due_date),
        })
      }
    }

    return installments.length > 0 ? installments : null
  }

  private normalizeConfidenceScores(value: unknown): PaymentPlanConfidenceScores {
    const defaultScores: PaymentPlanConfidenceScores = {
      student_name: 0,
      course_name: 0,
      total_course_value: 0,
      commission_rate: 0,
      course_start_date: 0,
      course_end_date: 0,
      initial_payment_amount: 0,
      initial_payment_due_date: 0,
      number_of_installments: 0,
      payment_frequency: 0,
      materials_cost: 0,
      admin_fees: 0,
      other_fees: 0,
      first_payment_due_date: 0,
      gst_inclusive: 0,
      installments: 0,
      overall: 0,
    }

    if (typeof value !== 'object' || value === null) {
      return defaultScores
    }

    const parsed = value as Record<string, unknown>

    for (const key of Object.keys(defaultScores)) {
      const score = this.normalizeNumber(parsed[key])
      if (score !== null && score >= 0 && score <= 1) {
        (defaultScores as Record<string, number>)[key] = score
      }
    }

    return defaultScores
  }

  private createEmptyResult(rawText: string): PaymentPlanOCRResult {
    return {
      student_name: null,
      course_name: null,
      total_course_value: null,
      commission_rate: null,
      course_start_date: null,
      course_end_date: null,
      initial_payment_amount: null,
      initial_payment_due_date: null,
      number_of_installments: null,
      payment_frequency: null,
      materials_cost: null,
      admin_fees: null,
      other_fees: null,
      first_payment_due_date: null,
      gst_inclusive: null,
      installments: null,
      confidence_scores: {
        student_name: 0,
        course_name: 0,
        total_course_value: 0,
        commission_rate: 0,
        course_start_date: 0,
        course_end_date: 0,
        initial_payment_amount: 0,
        initial_payment_due_date: 0,
        number_of_installments: 0,
        payment_frequency: 0,
        materials_cost: 0,
        admin_fees: 0,
        other_fees: 0,
        first_payment_due_date: 0,
        gst_inclusive: 0,
        installments: 0,
        overall: 0,
      },
      raw_text: rawText,
    }
  }

  /**
   * Retry async operation with exponential backoff.
   */
  private async retryWithBackoff<T>(operation: () => Promise<T>, attempt: number = 0): Promise<T> {
    try {
      console.log(`[MistralOCRClient] Attempt ${attempt + 1}: Starting with ${this.options.timeoutMs}ms timeout`)
      return await this.withTimeout(operation(), this.options.timeoutMs)
    } catch (error) {
      console.error(`[MistralOCRClient] Attempt ${attempt + 1} failed:`, error)
      const isLastAttempt = attempt >= this.options.maxRetries - 1
      const isRetryable = this.isRetryableError(error)

      if (!isRetryable || isLastAttempt) {
        console.error('[MistralOCRClient] Max retries exhausted or non-retryable error:', error)
        throw error
      }

      const baseDelay = this.options.initialRetryDelayMs
      const maxDelay = this.options.maxRetryDelayMs
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)

      console.warn(
        `[MistralOCRClient] Retry attempt ${attempt + 1}/${this.options.maxRetries} after ${delay}ms delay`
      )

      await new Promise((resolve) => setTimeout(resolve, delay))

      return this.retryWithBackoff(operation, attempt + 1)
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new OCRTimeoutError(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ])
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof OCRTimeoutError) return true
    if (error instanceof OCRRateLimitError) return true

    const errorStr = String(error).toLowerCase()

    if (errorStr.includes('rate limit') || errorStr.includes('429')) return true
    if (errorStr.includes('503') || errorStr.includes('service unavailable')) return true
    if (errorStr.includes('timeout') || errorStr.includes('etimedout')) return true

    return false
  }

  private wrapApiError(error: unknown, context: string): OCRError {
    const errorStr = String(error).toLowerCase()

    if (errorStr.includes('rate limit') || errorStr.includes('429')) {
      return new OCRRateLimitError(`${context}: Mistral API rate limit exceeded`)
    }

    if (errorStr.includes('timeout') || errorStr.includes('etimedout')) {
      return new OCRTimeoutError(`${context}: Request timeout`)
    }

    if (errorStr.includes('503') || errorStr.includes('service unavailable')) {
      return new OCRError(`${context}: Mistral API service unavailable`, OCRErrorCode.PROVIDER_UNAVAILABLE, true)
    }

    if (errorStr.includes('401') || errorStr.includes('unauthorized')) {
      return new OCRError(
        `${context}: Authentication failed. Check API key.`,
        OCRErrorCode.PROVIDER_UNAVAILABLE,
        false
      )
    }

    return new OCRError(
      `${context}: ${error instanceof Error ? error.message : String(error)}`,
      OCRErrorCode.PROVIDER_UNAVAILABLE,
      false
    )
  }

  private convertErrorToDetails(error: unknown): OCRErrorDetails {
    if (error instanceof OCRError) {
      return {
        errorCode: error.code,
        errorMessage: error.message,
        manualReviewRequired: !error.retryable,
      }
    }

    return {
      errorCode: OCRErrorCode.PROVIDER_UNAVAILABLE,
      errorMessage: error instanceof Error ? error.message : String(error),
      manualReviewRequired: true,
    }
  }
}
