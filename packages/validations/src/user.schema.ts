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

/**
 * Zod schema for password changes
 * Enforces password security requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const PasswordChangeSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirm_password: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

/**
 * TypeScript type inferred from the PasswordChangeSchema
 * Use this type for type-safe password change operations
 */
export type PasswordChange = z.infer<typeof PasswordChangeSchema>

/**
 * Zod schema for email updates by admin
 * Used when an admin wants to change a user's email address
 * Triggers email verification workflow
 */
export const EmailUpdateSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
})

/**
 * TypeScript type inferred from the EmailUpdateSchema
 * Use this type for type-safe email update operations
 */
export type EmailUpdate = z.infer<typeof EmailUpdateSchema>

/**
 * Schema for updating user role
 */
export const UserRoleUpdateSchema = z.object({
  role: z.enum(['agency_admin', 'agency_user'], {
    errorMap: () => ({ message: 'Role must be either agency_admin or agency_user' }),
  }),
})

export type UserRoleUpdate = z.infer<typeof UserRoleUpdateSchema>

/**
 * Schema for updating user status
 */
export const UserStatusUpdateSchema = z.object({
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Status must be either active or inactive' }),
  }),
})

export type UserStatusUpdate = z.infer<typeof UserStatusUpdateSchema>

/**
 * User response type (matches database schema)
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  role: z.enum(['agency_admin', 'agency_user']),
  status: z.enum(['active', 'inactive']),
  agency_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type User = z.infer<typeof UserSchema>
