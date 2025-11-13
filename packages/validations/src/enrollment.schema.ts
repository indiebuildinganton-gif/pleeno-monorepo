import { z } from 'zod'

/**
 * Enrollment status enum values
 * Matches the database ENUM type: enrollment_status
 */
export const EnrollmentStatusEnum = z.enum(['active', 'completed', 'cancelled'], {
  errorMap: () => ({ message: 'Enrollment status must be one of: active, completed, cancelled' }),
})

/**
 * Zod schema for creating a new enrollment
 * Used for validating enrollment creation requests
 *
 * Required fields:
 * - student_id: UUID of the student being enrolled
 * - branch_id: UUID of the college branch
 * - program_name: Name of the program/course
 *
 * Optional fields:
 * - offer_letter_file: File to upload as offer letter (handled separately via upload API)
 */
export const EnrollmentCreateSchema = z.object({
  student_id: z
    .string()
    .uuid('Student ID must be a valid UUID')
    .min(1, 'Student ID is required'),
  branch_id: z
    .string()
    .uuid('Branch ID must be a valid UUID')
    .min(1, 'Branch ID is required'),
  program_name: z
    .string()
    .min(1, 'Program name is required')
    .max(255, 'Program name must be less than 255 characters')
    .trim(),
})

/**
 * TypeScript type inferred from the EnrollmentCreateSchema
 * Use this type for type-safe enrollment creation operations
 */
export type EnrollmentCreate = z.infer<typeof EnrollmentCreateSchema>

/**
 * Zod schema for updating an existing enrollment
 * Only status can be updated via PATCH
 */
export const EnrollmentUpdateSchema = z.object({
  status: EnrollmentStatusEnum,
})

/**
 * TypeScript type inferred from the EnrollmentUpdateSchema
 * Use this type for type-safe enrollment update operations
 */
export type EnrollmentUpdate = z.infer<typeof EnrollmentUpdateSchema>

/**
 * Enrollment response type (matches database schema)
 */
export const EnrollmentSchema = z.object({
  id: z.string().uuid(),
  agency_id: z.string().uuid(),
  student_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  program_name: z.string(),
  offer_letter_url: z.string().nullable(),
  offer_letter_filename: z.string().nullable(),
  status: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * TypeScript type inferred from the EnrollmentSchema
 */
export type Enrollment = z.infer<typeof EnrollmentSchema>
