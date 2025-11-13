import { z } from 'zod'

/**
 * Visa status enum values
 * Matches the database CHECK constraint on students.visa_status
 */
export const VisaStatusEnum = z.enum(['in_process', 'approved', 'denied', 'expired'], {
  errorMap: () => ({ message: 'Visa status must be one of: in_process, approved, denied, expired' }),
})

/**
 * Zod schema for creating a new student
 * Used for validating student creation requests
 *
 * Required fields:
 * - full_name: Student's full name
 * - passport_number: Unique passport identifier (unique per agency)
 *
 * Optional fields:
 * - email: Student's email address
 * - phone: Student's phone number (primary contact method)
 * - visa_status: Current visa status
 * - date_of_birth: Student's date of birth
 * - nationality: Student's nationality
 */
export const StudentCreateSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters')
    .trim(),
  passport_number: z
    .string()
    .min(1, 'Passport number is required')
    .max(50, 'Passport number must be less than 50 characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim()
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(50, 'Phone number must be less than 50 characters')
    .trim()
    .optional()
    .nullable(),
  visa_status: VisaStatusEnum.optional().nullable(),
  date_of_birth: z
    .string()
    .date('Invalid date format. Use YYYY-MM-DD')
    .optional()
    .nullable(),
  nationality: z
    .string()
    .max(100, 'Nationality must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
})

/**
 * TypeScript type inferred from the StudentCreateSchema
 * Use this type for type-safe student creation operations
 */
export type StudentCreate = z.infer<typeof StudentCreateSchema>

/**
 * Zod schema for updating an existing student
 * All fields are optional - partial updates allowed
 */
export const StudentUpdateSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name cannot be empty')
    .max(255, 'Full name must be less than 255 characters')
    .trim()
    .optional(),
  passport_number: z
    .string()
    .min(1, 'Passport number cannot be empty')
    .max(50, 'Passport number must be less than 50 characters')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim()
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(50, 'Phone number must be less than 50 characters')
    .trim()
    .optional()
    .nullable(),
  visa_status: VisaStatusEnum.optional().nullable(),
  date_of_birth: z
    .string()
    .date('Invalid date format. Use YYYY-MM-DD')
    .optional()
    .nullable(),
  nationality: z
    .string()
    .max(100, 'Nationality must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
})

/**
 * TypeScript type inferred from the StudentUpdateSchema
 * Use this type for type-safe student update operations
 */
export type StudentUpdate = z.infer<typeof StudentUpdateSchema>

/**
 * Student response type (matches database schema)
 */
export const StudentSchema = z.object({
  id: z.string().uuid(),
  agency_id: z.string().uuid(),
  full_name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  passport_number: z.string(),
  date_of_birth: z.string().nullable(),
  nationality: z.string().nullable(),
  visa_status: z.string().nullable(),
  assigned_user_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * TypeScript type inferred from the StudentSchema
 */
export type Student = z.infer<typeof StudentSchema>

/**
 * Zod schema for creating a new student note
 * Used for validating note creation requests
 *
 * Required fields:
 * - content: Note content (max 2000 characters)
 */
export const NoteCreateSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(2000, 'Note content must be less than 2000 characters')
    .trim(),
})

/**
 * TypeScript type inferred from the NoteCreateSchema
 */
export type NoteCreate = z.infer<typeof NoteCreateSchema>

/**
 * Zod schema for updating an existing student note
 * Content field is required for updates
 */
export const NoteUpdateSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content cannot be empty')
    .max(2000, 'Note content must be less than 2000 characters')
    .trim(),
})

/**
 * TypeScript type inferred from the NoteUpdateSchema
 */
export type NoteUpdate = z.infer<typeof NoteUpdateSchema>

/**
 * Student note response type (matches database schema)
 */
export const NoteSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  user_id: z.string().uuid(),
  agency_id: z.string().uuid(),
  content: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * TypeScript type inferred from the NoteSchema
 */
export type Note = z.infer<typeof NoteSchema>
