/**
 * Invitation Helper Utilities
 *
 * Utility functions for working with user invitations.
 * These helpers are used across the application to validate and manage invitations.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.2: User Invitation and Task Assignment System
 * Task 10: Implement invitation expiration validation
 */

/**
 * Invitation object structure
 * Matches the invitations table schema
 */
export interface Invitation {
  expires_at: string | Date
  used_at?: string | Date | null
  [key: string]: unknown
}

/**
 * Checks if an invitation has expired
 *
 * @param invitation - The invitation object with expires_at timestamp
 * @returns true if the invitation has expired, false otherwise
 *
 * @example
 * const invitation = { expires_at: '2024-01-01T00:00:00Z' }
 * const isExpired = isInvitationExpired(invitation)
 * if (isExpired) {
 *   console.log('This invitation has expired')
 * }
 */
export function isInvitationExpired(invitation: Invitation): boolean {
  const now = new Date()
  const expiresAt = new Date(invitation.expires_at)

  // Check if expires_at is in the past (expired)
  return expiresAt < now
}

/**
 * Gets a human-readable expiration status message
 *
 * @param invitation - The invitation object with expires_at timestamp
 * @returns A descriptive message about the invitation status
 *
 * @example
 * const invitation = { expires_at: '2024-01-01T00:00:00Z' }
 * const message = getExpirationMessage(invitation)
 * // Returns: "This invitation has expired. Please request a new invitation from your agency admin."
 */
export function getExpirationMessage(invitation: Invitation): string {
  if (isInvitationExpired(invitation)) {
    return 'This invitation has expired. Please request a new invitation from your agency admin.'
  }

  const now = new Date()
  const expiresAt = new Date(invitation.expires_at)
  const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiration === 1) {
    return 'This invitation expires in 1 day.'
  } else if (daysUntilExpiration <= 7) {
    return `This invitation expires in ${daysUntilExpiration} days.`
  }

  return 'This invitation is valid.'
}

/**
 * Checks if an invitation has already been used
 *
 * @param invitation - The invitation object with used_at timestamp
 * @returns true if the invitation has been used, false otherwise
 *
 * @example
 * const invitation = { used_at: '2024-01-01T00:00:00Z' }
 * const isUsed = isInvitationUsed(invitation)
 * if (isUsed) {
 *   console.log('This invitation has already been used')
 * }
 */
export function isInvitationUsed(invitation: Invitation): boolean {
  return !!invitation.used_at
}

/**
 * Validates an invitation is ready for acceptance
 * Checks both expiration and usage status
 *
 * @param invitation - The invitation object to validate
 * @returns An object with isValid boolean and optional error message
 *
 * @example
 * const invitation = { expires_at: '2025-12-31T23:59:59Z', used_at: null }
 * const validation = validateInvitation(invitation)
 * if (!validation.isValid) {
 *   console.error(validation.error)
 * }
 */
export function validateInvitation(invitation: Invitation): {
  isValid: boolean
  error?: string
} {
  // Check if invitation has already been used
  if (isInvitationUsed(invitation)) {
    return {
      isValid: false,
      error: 'This invitation has already been used and cannot be reused.',
    }
  }

  // Check if invitation has expired
  if (isInvitationExpired(invitation)) {
    return {
      isValid: false,
      error: 'This invitation has expired. Please request a new invitation from your agency admin.',
    }
  }

  return { isValid: true }
}
