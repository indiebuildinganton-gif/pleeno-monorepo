import { z } from 'zod'

/**
 * Schema for updating user role
 */
export const UserRoleUpdateSchema = z.object({
  role: z.enum(['agency_admin', 'agency_user'], {
    errorMap: () => ({ message: 'Role must be either agency_admin or agency_user' })
  })
})

export type UserRoleUpdate = z.infer<typeof UserRoleUpdateSchema>

/**
 * Schema for updating user status
 */
export const UserStatusUpdateSchema = z.object({
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Status must be either active or inactive' })
  })
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
  updated_at: z.string().datetime()
})

export type User = z.infer<typeof UserSchema>
