/**
 * AI Extraction API - Extract Student Data from Offer Letters (Premium Feature)
 *
 * This endpoint provides AI-powered extraction of student, college, program,
 * and payment data from PDF offer letters.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 07: AI Extraction API (Premium Feature)
 */

import { NextRequest } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import OpenAI from 'openai'
import * as pdfParse from 'pdf-parse'
import { compareTwoStrings } from 'string-similarity'

// Initialize OpenAI client lazily to avoid build-time errors
let openai: OpenAI | null = null
function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

/**
 * Extraction result structure
 */
interface ExtractionResult {
  student: {
    name: string | null
    passport_number: string | null
  }
  college: {
    name: string | null
    branch: string | null
    city: string | null
  }
  program: {
    name: string | null
    start_date: string | null
    end_date: string | null
  }
  payment: {
    total_amount: number | null
    currency: string | null
    schedule: Array<{
      due_date: string
      amount: number
      description: string
    }>
  }
  confidence_scores: {
    student_name: number
    passport_number: number
    college_name: number
    branch_name: number
    program_name: number
    payment_total: number
  }
}

/**
 * Fuzzy match result
 */
interface FuzzyMatchResult {
  id: string
  name: string
  similarity: number
}

/**
 * POST /api/students/extract-from-offer-letter
 *
 * Extracts structured student data from a PDF offer letter using AI.
 * This is a premium feature gated by subscription tier.
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Body:
 *   - file: File (required) - PDF offer letter (max 10MB)
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "student": {
 *       "name": "John Doe",
 *       "passport_number": "AB123456"
 *     },
 *     "college": {
 *       "name": "University of Sydney",
 *       "branch": "Main Campus",
 *       "city": "Sydney",
 *       "matched_college_id": "college-uuid",  // If fuzzy match found
 *       "matched_branch_id": "branch-uuid"     // If fuzzy match found
 *     },
 *     "program": {
 *       "name": "Bachelor of Computer Science",
 *       "start_date": "2024-02-01",
 *       "end_date": "2027-12-01"
 *     },
 *     "payment": {
 *       "total_amount": 45000,
 *       "currency": "AUD",
 *       "schedule": [
 *         {
 *           "due_date": "2024-01-15",
 *           "amount": 15000,
 *           "description": "First semester payment"
 *         }
 *       ]
 *     },
 *     "confidence_scores": {
 *       "student_name": 0.95,
 *       "passport_number": 0.90,
 *       "college_name": 0.85,
 *       ...
 *     }
 *   }
 * }
 *
 * Error responses:
 * - 400: Invalid file or validation error
 * - 401: Not authenticated
 * - 403: Not authorized or subscription tier too low
 * - 413: File too large
 * - 500: Extraction failed
 *
 * Security:
 * - Requires authentication
 * - Gated by subscription_tier (premium or enterprise only)
 * - File type validation (PDF only)
 * - File size limit: 10MB
 * - All extractions logged for analytics
 *
 * @param request - Next.js request object with FormData
 * @returns Extracted data with confidence scores or error response
 */
export async function POST(request: NextRequest) {
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

    // SUBSCRIPTION TIER CHECK: Verify agency has premium or enterprise tier
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, name, subscription_tier')
      .eq('id', userAgencyId)
      .single()

    if (agencyError || !agency) {
      throw new ForbiddenError('Agency not found')
    }

    // Check subscription tier
    if (agency.subscription_tier === 'basic') {
      throw new ForbiddenError(
        'AI extraction is a premium feature. Please upgrade your subscription to access this feature.'
      )
    }

    // Verify OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      throw new Error('AI extraction service is not configured. Please contact support.')
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    // Validate required fields
    if (!file) {
      throw new ValidationError('File is required')
    }

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      throw new ValidationError('Only PDF files are supported for extraction')
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        `File size must be less than 10MB. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      )
    }

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let pdfText: string
    try {
      const pdfData = await pdfParse(buffer)
      pdfText = pdfData.text
    } catch (error) {
      console.error('PDF parsing error:', error)
      throw new ValidationError(
        'Failed to extract text from PDF. The file may be corrupted or encrypted.'
      )
    }

    if (!pdfText || pdfText.trim().length === 0) {
      throw new ValidationError(
        'No text content found in PDF. The file may be scanned or image-based.'
      )
    }

    // Use OpenAI GPT-4 to extract structured data
    let extractionResult: ExtractionResult
    try {
      const client = getOpenAIClient()
      const completion = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert data extraction assistant. Extract structured information from offer letters.
Extract the following fields and provide confidence scores (0-1):
- Student: name, passport_number
- College: name, branch, city
- Program: name, start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
- Payment: total_amount (number), currency (3-letter code), schedule (array of installments)

For payment schedule, extract: due_date (YYYY-MM-DD), amount (number), description (string)

Return ONLY a valid JSON object with this exact structure:
{
  "student": {"name": "...", "passport_number": "..."},
  "college": {"name": "...", "branch": "...", "city": "..."},
  "program": {"name": "...", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD"},
  "payment": {
    "total_amount": number,
    "currency": "...",
    "schedule": [{"due_date": "YYYY-MM-DD", "amount": number, "description": "..."}]
  },
  "confidence_scores": {
    "student_name": 0.0-1.0,
    "passport_number": 0.0-1.0,
    "college_name": 0.0-1.0,
    "branch_name": 0.0-1.0,
    "program_name": 0.0-1.0,
    "payment_total": 0.0-1.0
  }
}

If a field is not found, use null. Confidence scores should reflect certainty of extraction.`,
          },
          {
            role: 'user',
            content: `Extract student information from this offer letter:\n\n${pdfText}`,
          },
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from AI extraction service')
      }

      extractionResult = JSON.parse(content) as ExtractionResult
    } catch (error) {
      console.error('AI extraction error:', error)
      throw new Error(
        'Failed to extract data from offer letter. Please try again or enter data manually.'
      )
    }

    // FUZZY MATCHING: Find existing colleges and branches
    const fuzzyMatchResults: {
      matched_college_id?: string
      matched_branch_id?: string
      college_match_score?: number
      branch_match_score?: number
    } = {}

    if (extractionResult.college.name) {
      // Fetch all colleges for the agency
      const { data: colleges } = await supabase
        .from('colleges')
        .select('id, name')
        .eq('agency_id', userAgencyId)

      if (colleges && colleges.length > 0) {
        // Find best match using fuzzy string matching
        const matches = colleges.map((college: { id: string; name: string }) => ({
          id: college.id,
          name: college.name,
          similarity: compareTwoStrings(
            extractionResult.college.name!.toLowerCase(),
            college.name.toLowerCase()
          ),
        }))

        // Sort by similarity descending
        matches.sort((a: FuzzyMatchResult, b: FuzzyMatchResult) => b.similarity - a.similarity)

        // Use match if similarity is above 0.6 (60%)
        const SIMILARITY_THRESHOLD = 0.6
        if (matches[0] && matches[0].similarity >= SIMILARITY_THRESHOLD) {
          fuzzyMatchResults.matched_college_id = matches[0].id
          fuzzyMatchResults.college_match_score = matches[0].similarity

          // If we have a college match and a branch name, try to match the branch
          if (extractionResult.college.branch) {
            const { data: branches } = await supabase
              .from('branches')
              .select('id, name, city')
              .eq('college_id', matches[0].id)
              .eq('agency_id', userAgencyId)

            if (branches && branches.length > 0) {
              const branchMatches = branches.map(
                (branch: { id: string; name: string; city: string | null }) => ({
                  id: branch.id,
                  name: branch.name,
                  similarity: compareTwoStrings(
                    extractionResult.college.branch!.toLowerCase(),
                    branch.name.toLowerCase()
                  ),
                })
              )

              branchMatches.sort(
                (a: FuzzyMatchResult, b: FuzzyMatchResult) => b.similarity - a.similarity
              )

              if (branchMatches[0] && branchMatches[0].similarity >= SIMILARITY_THRESHOLD) {
                fuzzyMatchResults.matched_branch_id = branchMatches[0].id
                fuzzyMatchResults.branch_match_score = branchMatches[0].similarity
              }
            }
          }
        }
      }
    }

    // LOG EXTRACTION METADATA for analytics
    const extractionMetadata = {
      user_id: user.id,
      agency_id: userAgencyId,
      file_name: file.name,
      file_size: file.size,
      pdf_text_length: pdfText.length,
      extraction_timestamp: new Date().toISOString(),
      extracted_fields: {
        has_student_name: !!extractionResult.student.name,
        has_passport: !!extractionResult.student.passport_number,
        has_college: !!extractionResult.college.name,
        has_program: !!extractionResult.program.name,
        has_payment: !!extractionResult.payment.total_amount,
        payment_schedule_items: extractionResult.payment.schedule?.length || 0,
      },
      confidence_scores: extractionResult.confidence_scores,
      fuzzy_matches: {
        college_matched: !!fuzzyMatchResults.matched_college_id,
        branch_matched: !!fuzzyMatchResults.matched_branch_id,
        college_score: fuzzyMatchResults.college_match_score,
        branch_score: fuzzyMatchResults.branch_match_score,
      },
    }

    // Store extraction metadata in audit_logs for analytics
    await supabase.from('audit_logs').insert({
      entity_type: 'ai_extraction',
      entity_id: null, // No specific entity yet since student not created
      user_id: user.id,
      action: 'extract_offer_letter',
      changes_json: extractionMetadata,
    })

    // Combine extraction results with fuzzy match results
    const response = {
      ...extractionResult,
      college: {
        ...extractionResult.college,
        matched_college_id: fuzzyMatchResults.matched_college_id,
        matched_branch_id: fuzzyMatchResults.matched_branch_id,
        college_match_score: fuzzyMatchResults.college_match_score,
        branch_match_score: fuzzyMatchResults.branch_match_score,
      },
    }

    return createSuccessResponse(response)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/students/extract-from-offer-letter',
    })
  }
}
