/**
 * Enrollment Helper Utilities
 *
 * Helper functions for creating and managing enrollments,
 * including duplicate detection and reuse logic.
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 5: Payment Plan Creation Integration
 */

import type { EnrollmentCreate } from '@pleeno/validations'

/**
 * API response structure for enrollment operations
 */
export interface EnrollmentResponse {
  id: string
  student_id: string
  branch_id: string
  program_name: string
  offer_letter_url: string | null
  offer_letter_filename: string | null
  status: string
  created_at: string
  updated_at: string
  is_existing?: boolean // Flag to indicate if enrollment was reused
}

/**
 * API success response wrapper
 */
export interface EnrollmentApiResponse {
  success: boolean
  data: EnrollmentResponse
  message?: string
}

/**
 * Find or create an enrollment for a student-branch-program combination
 *
 * This function implements the duplicate enrollment handling logic:
 * 1. Checks if an active enrollment exists for the given student/branch/program
 * 2. If found, returns the existing enrollment
 * 3. If not found, creates a new enrollment
 *
 * The server-side API handles the duplicate detection logic, so this
 * function primarily acts as a typed wrapper around the API call.
 *
 * @param student_id - UUID of the student
 * @param branch_id - UUID of the college branch
 * @param program_name - Name of the program/course
 * @returns Promise resolving to enrollment data with is_existing flag
 * @throws Error if the API request fails
 *
 * @example
 * ```tsx
 * const enrollment = await findOrCreateEnrollment(
 *   'student-uuid',
 *   'branch-uuid',
 *   'Bachelor of Computer Science'
 * )
 *
 * if (enrollment.is_existing) {
 *   console.log('Reusing existing enrollment:', enrollment.id)
 * } else {
 *   console.log('Created new enrollment:', enrollment.id)
 * }
 * ```
 */
export async function findOrCreateEnrollment(
  student_id: string,
  branch_id: string,
  program_name: string
): Promise<EnrollmentResponse> {
  const enrollmentData: EnrollmentCreate = {
    student_id,
    branch_id,
    program_name,
  }

  const response = await fetch('/api/enrollments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enrollmentData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    const errorMessage =
      errorData?.error?.message || errorData?.message || 'Failed to create enrollment'
    throw new Error(errorMessage)
  }

  const result: EnrollmentApiResponse = await response.json()
  return result.data
}

/**
 * Upload an offer letter file for an enrollment
 *
 * @param enrollment_id - UUID of the enrollment
 * @param file - File object to upload (PDF, JPEG, or PNG)
 * @returns Promise resolving to updated enrollment data
 * @throws Error if the upload fails
 *
 * @example
 * ```tsx
 * const file = document.getElementById('offer-letter-input').files[0]
 * const updatedEnrollment = await uploadOfferLetter(enrollmentId, file)
 * console.log('Offer letter uploaded:', updatedEnrollment.offer_letter_url)
 * ```
 */
export async function uploadOfferLetter(
  enrollment_id: string,
  file: File
): Promise<EnrollmentResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`/api/enrollments/${enrollment_id}/offer-letter`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json()
    const errorMessage =
      errorData?.error?.message || errorData?.message || 'Failed to upload offer letter'
    throw new Error(errorMessage)
  }

  const result: EnrollmentApiResponse = await response.json()
  return result.data
}

/**
 * Create enrollment with offer letter in a single transaction
 *
 * This is a convenience function that combines findOrCreateEnrollment
 * and uploadOfferLetter into a single operation.
 *
 * @param student_id - UUID of the student
 * @param branch_id - UUID of the college branch
 * @param program_name - Name of the program/course
 * @param offerLetterFile - Optional file to upload as offer letter
 * @returns Promise resolving to enrollment data
 * @throws Error if enrollment creation or file upload fails
 *
 * @example
 * ```tsx
 * const enrollment = await createEnrollmentWithOfferLetter(
 *   studentId,
 *   branchId,
 *   'Master of Business Administration',
 *   offerLetterFile
 * )
 * ```
 */
export async function createEnrollmentWithOfferLetter(
  student_id: string,
  branch_id: string,
  program_name: string,
  offerLetterFile?: File
): Promise<EnrollmentResponse> {
  // Step 1: Create or find enrollment
  const enrollment = await findOrCreateEnrollment(student_id, branch_id, program_name)

  // Step 2: Upload offer letter if provided
  if (offerLetterFile) {
    const updatedEnrollment = await uploadOfferLetter(enrollment.id, offerLetterFile)
    return updatedEnrollment
  }

  return enrollment
}
