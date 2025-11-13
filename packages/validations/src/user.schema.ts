import { z } from 'zod'

/**
 * Zod schema for user profile updates
 * Used for validating profile information updates (name)
 */
export const ProfileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters')
    .trim(),
})

/**
 * TypeScript type inferred from the ProfileUpdateSchema
 * Use this type for type-safe profile update operations
 */
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>
