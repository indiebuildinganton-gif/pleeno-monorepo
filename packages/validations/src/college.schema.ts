import { z } from 'zod'

/**
 * GST status enum values
 * Matches the database CHECK constraint on colleges.gst_status
 */
export const GstStatusEnum = z.enum(['included', 'excluded'], {
  errorMap: () => ({ message: 'GST status must be either "included" or "excluded"' }),
})

/**
 * Zod schema for creating a new college
 * Used for validating college creation requests
 *
 * Required fields:
 * - name: College name (unique per agency)
 * - default_commission_rate_percent: Commission rate (0-100)
 * - gst_status: GST inclusion status
 *
 * Optional fields:
 * - city: Primary city where college is located
 * - country: Country where college is located
 * - contract_expiration_date: Date when contract expires
 */
export const CollegeCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'College name is required')
    .max(255, 'College name must be less than 255 characters')
    .trim(),
  city: z
    .string()
    .max(255, 'City must be less than 255 characters')
    .trim()
    .optional()
    .nullable(),
  country: z
    .string()
    .max(255, 'Country must be less than 255 characters')
    .trim()
    .optional()
    .nullable(),
  default_commission_rate_percent: z
    .number()
    .min(0, 'Commission rate must be at least 0%')
    .max(100, 'Commission rate must not exceed 100%'),
  gst_status: GstStatusEnum.default('included'),
  contract_expiration_date: z
    .string()
    .date('Invalid date format. Use YYYY-MM-DD')
    .optional()
    .nullable(),
})

/**
 * TypeScript type inferred from the CollegeCreateSchema
 * Use this type for type-safe college creation operations
 */
export type CollegeCreate = z.infer<typeof CollegeCreateSchema>

/**
 * Zod schema for updating an existing college
 * All fields are optional - partial updates allowed
 */
export const CollegeUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'College name cannot be empty')
    .max(255, 'College name must be less than 255 characters')
    .trim()
    .optional(),
  city: z
    .string()
    .max(255, 'City must be less than 255 characters')
    .trim()
    .optional()
    .nullable(),
  country: z
    .string()
    .max(255, 'Country must be less than 255 characters')
    .trim()
    .optional()
    .nullable(),
  default_commission_rate_percent: z
    .number()
    .min(0, 'Commission rate must be at least 0%')
    .max(100, 'Commission rate must not exceed 100%')
    .optional(),
  gst_status: GstStatusEnum.optional(),
  contract_expiration_date: z
    .string()
    .date('Invalid date format. Use YYYY-MM-DD')
    .optional()
    .nullable(),
})

/**
 * TypeScript type inferred from the CollegeUpdateSchema
 * Use this type for type-safe college update operations
 */
export type CollegeUpdate = z.infer<typeof CollegeUpdateSchema>

/**
 * College response type (matches database schema)
 */
export const CollegeSchema = z.object({
  id: z.string().uuid(),
  agency_id: z.string().uuid(),
  name: z.string(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  default_commission_rate_percent: z.number().nullable(),
  gst_status: z.string(),
  contract_expiration_date: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * TypeScript type inferred from the CollegeSchema
 */
export type College = z.infer<typeof CollegeSchema>
