import { z } from 'zod'

/**
 * Email validation regex
 * Basic email format validation following RFC 5322 simplified pattern
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Phone validation regex
 * Accepts various international formats including:
 * - +1234567890
 * - +1 234 567 8900
 * - (123) 456-7890
 * - 123-456-7890
 * - 1234567890
 */
const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/

/**
 * Zod schema for creating a new college contact
 * Used for validating contact creation requests
 *
 * Required fields:
 * - name: Contact person's full name
 *
 * Optional fields:
 * - role_department: Role or department (e.g., "Admissions", "International Office")
 * - position_title: Job title (e.g., "Director of International Admissions")
 * - email: Email address (validated format if provided)
 * - phone: Phone number (validated format if provided)
 */
export const ContactCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Contact name is required')
    .max(255, 'Contact name must be less than 255 characters')
    .trim(),
  role_department: z
    .string()
    .max(255, 'Role/department must be less than 255 characters')
    .trim()
    .optional()
    .nullable(),
  position_title: z
    .string()
    .max(255, 'Position title must be less than 255 characters')
    .trim()
    .optional()
    .nullable(),
  email: z
    .string()
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .refine((val) => !val || emailRegex.test(val), {
      message: 'Invalid email format',
    })
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(50, 'Phone number must be less than 50 characters')
    .trim()
    .refine((val) => !val || phoneRegex.test(val), {
      message: 'Invalid phone format',
    })
    .optional()
    .nullable(),
})

/**
 * TypeScript type inferred from the ContactCreateSchema
 * Use this type for type-safe contact creation operations
 */
export type ContactCreate = z.infer<typeof ContactCreateSchema>

/**
 * Zod schema for updating an existing college contact
 * All fields are optional - partial updates allowed
 */
export const ContactUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Contact name cannot be empty')
    .max(255, 'Contact name must be less than 255 characters')
    .trim()
    .optional(),
  role_department: z
    .string()
    .max(255, 'Role/department must be less than 255 characters')
    .trim()
    .optional()
    .nullable(),
  position_title: z
    .string()
    .max(255, 'Position title must be less than 255 characters')
    .trim()
    .optional()
    .nullable(),
  email: z
    .string()
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .refine((val) => !val || emailRegex.test(val), {
      message: 'Invalid email format',
    })
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(50, 'Phone number must be less than 50 characters')
    .trim()
    .refine((val) => !val || phoneRegex.test(val), {
      message: 'Invalid phone format',
    })
    .optional()
    .nullable(),
})

/**
 * TypeScript type inferred from the ContactUpdateSchema
 * Use this type for type-safe contact update operations
 */
export type ContactUpdate = z.infer<typeof ContactUpdateSchema>

/**
 * Contact response type (matches database schema)
 */
export const ContactSchema = z.object({
  id: z.string().uuid(),
  college_id: z.string().uuid(),
  agency_id: z.string().uuid(),
  name: z.string(),
  role_department: z.string().nullable(),
  position_title: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * TypeScript type inferred from the ContactSchema
 */
export type Contact = z.infer<typeof ContactSchema>
