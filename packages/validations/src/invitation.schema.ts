import { z } from 'zod'

/**
 * Validation schema for user invitation creation
 *
 * This schema validates the request body when an agency admin
 * creates a new user invitation.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.2: User Invitation and Task Assignment System
 * Task 04: Implement user invitation API route
 */

/**
 * User role types that can be assigned to invited users
 */
export type InvitedUserRole = 'agency_admin' | 'agency_user'

/**
 * Zod schema for invitation creation
 *
 * Validates:
 * - email: Required, valid email format
 * - role: Required, must be 'agency_admin' or 'agency_user'
 * - task_ids: Optional array of UUIDs from master_tasks table
 */
export const InvitationCreateSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase(), // Normalize email to lowercase
  role: z.enum(['agency_admin', 'agency_user'], {
    errorMap: () => ({
      message: 'Role must be either "agency_admin" or "agency_user"',
    }),
  }),
  task_ids: z
    .array(
      z.string().uuid('Each task ID must be a valid UUID')
    )
    .optional()
    .default([]), // Default to empty array if not provided
})

/**
 * TypeScript type inferred from the InvitationCreateSchema
 * Use this type for type-safe invitation creation operations
 */
export type InvitationCreate = z.infer<typeof InvitationCreateSchema>

/**
 * Zod schema for task assignment management
 *
 * Used when updating task assignments for existing users.
 * Replaces all current task assignments with the new list.
 */
export const UserTaskAssignmentSchema = z.object({
  task_ids: z.array(
    z.string().uuid('Each task ID must be a valid UUID')
  ),
})

/**
 * TypeScript type inferred from the UserTaskAssignmentSchema
 * Use this type for type-safe task assignment operations
 */
export type UserTaskAssignment = z.infer<typeof UserTaskAssignmentSchema>

/**
 * Zod schema for invitation acceptance (signup)
 *
 * Used when an invited user accepts their invitation and creates their account.
 * Validates the signup form fields.
 */
export const InvitationAcceptanceSchema = z.object({
  token: z.string().uuid('Invalid invitation token format'),
  full_name: z.string().min(1, 'Full name is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})

/**
 * TypeScript type inferred from the InvitationAcceptanceSchema
 * Use this type for type-safe invitation acceptance operations
 */
export type InvitationAcceptance = z.infer<typeof InvitationAcceptanceSchema>
