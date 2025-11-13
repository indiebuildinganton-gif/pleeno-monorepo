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
