import { z } from 'zod'

/**
 * Zod schema for creating a new branch
 * Used for validating branch creation requests
 *
 * Required fields:
 * - name: Branch name (e.g., "Main Campus", "Downtown Branch")
 * - city: City where this branch is located
 *
 * Optional fields:
 * - commission_rate_percent: Commission rate (0-100), inherits from college if not provided
 */
export const BranchCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Branch name is required')
    .max(255, 'Branch name must be less than 255 characters')
    .trim(),
  city: z
    .string()
    .min(1, 'City is required')
    .max(255, 'City must be less than 255 characters')
    .trim(),
  commission_rate_percent: z
    .number()
    .min(0, 'Commission rate must be at least 0%')
    .max(100, 'Commission rate must not exceed 100%')
    .optional()
    .nullable(),
})

/**
 * TypeScript type inferred from the BranchCreateSchema
 * Use this type for type-safe branch creation operations
 */
export type BranchCreate = z.infer<typeof BranchCreateSchema>

/**
 * Zod schema for updating an existing branch
 * All fields are optional - partial updates allowed
 */
export const BranchUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Branch name cannot be empty')
    .max(255, 'Branch name must be less than 255 characters')
    .trim()
    .optional(),
  city: z
    .string()
    .min(1, 'City cannot be empty')
    .max(255, 'City must be less than 255 characters')
    .trim()
    .optional(),
  commission_rate_percent: z
    .number()
    .min(0, 'Commission rate must be at least 0%')
    .max(100, 'Commission rate must not exceed 100%')
    .optional()
    .nullable(),
})

/**
 * TypeScript type inferred from the BranchUpdateSchema
 * Use this type for type-safe branch update operations
 */
export type BranchUpdate = z.infer<typeof BranchUpdateSchema>

/**
 * Branch response type (matches database schema)
 */
export const BranchSchema = z.object({
  id: z.string().uuid(),
  college_id: z.string().uuid(),
  agency_id: z.string().uuid(),
  name: z.string(),
  city: z.string(),
  commission_rate_percent: z.number().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * TypeScript type inferred from the BranchSchema
 */
export type Branch = z.infer<typeof BranchSchema>
