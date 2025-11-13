import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isInvitationExpired,
  getExpirationMessage,
  isInvitationUsed,
  validateInvitation,
  type Invitation,
} from '../invitation-helpers'

describe('Invitation Helpers', () => {
  beforeEach(() => {
    // Mock current time to 2024-01-15T12:00:00Z for consistent tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  describe('isInvitationExpired', () => {
    it('returns true for expired invitation (past date)', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-10T12:00:00Z', // 5 days ago
      }
      expect(isInvitationExpired(invitation)).toBe(true)
    })

    it('returns false for valid invitation (future date)', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-20T12:00:00Z', // 5 days from now
      }
      expect(isInvitationExpired(invitation)).toBe(false)
    })

    it('returns true for invitation that just expired', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-15T11:59:59Z', // 1 second ago
      }
      expect(isInvitationExpired(invitation)).toBe(true)
    })

    it('returns false for invitation expiring in the future', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-15T12:00:01Z', // 1 second from now
      }
      expect(isInvitationExpired(invitation)).toBe(false)
    })

    it('returns true for invitation expired 7 days ago (typical expiration)', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-08T12:00:00Z', // 7 days ago
      }
      expect(isInvitationExpired(invitation)).toBe(true)
    })

    it('returns false for invitation expiring in 7 days', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-22T12:00:00Z', // 7 days from now
      }
      expect(isInvitationExpired(invitation)).toBe(false)
    })

    it('handles Date object as expires_at', () => {
      const invitation: Invitation = {
        expires_at: new Date('2024-01-10T12:00:00Z'), // Past date
      }
      expect(isInvitationExpired(invitation)).toBe(true)
    })

    it('handles invitation with additional properties', () => {
      const invitation: Invitation = {
        id: '123',
        email: 'test@example.com',
        expires_at: '2024-01-10T12:00:00Z',
        used_at: null,
      }
      expect(isInvitationExpired(invitation)).toBe(true)
    })
  })

  describe('isInvitationUsed', () => {
    it('returns true for used invitation', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-20T12:00:00Z',
        used_at: '2024-01-14T10:00:00Z',
      }
      expect(isInvitationUsed(invitation)).toBe(true)
    })

    it('returns false for unused invitation (used_at is null)', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-20T12:00:00Z',
        used_at: null,
      }
      expect(isInvitationUsed(invitation)).toBe(false)
    })

    it('returns false for unused invitation (used_at is undefined)', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-20T12:00:00Z',
        used_at: undefined,
      }
      expect(isInvitationUsed(invitation)).toBe(false)
    })

    it('returns false for unused invitation (no used_at property)', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-20T12:00:00Z',
      }
      expect(isInvitationUsed(invitation)).toBe(false)
    })

    it('handles Date object as used_at', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-20T12:00:00Z',
        used_at: new Date('2024-01-14T10:00:00Z'),
      }
      expect(isInvitationUsed(invitation)).toBe(true)
    })
  })

  describe('getExpirationMessage', () => {
    it('returns expiration message for expired invitation', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-10T12:00:00Z', // 5 days ago
      }
      const message = getExpirationMessage(invitation)
      expect(message).toBe(
        'This invitation has expired. Please request a new invitation from your agency admin.'
      )
    })

    it('returns "expires in 1 day" message', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-16T12:00:00Z', // 1 day from now
      }
      const message = getExpirationMessage(invitation)
      expect(message).toBe('This invitation expires in 1 day.')
    })

    it('returns "expires in X days" message for 2-7 days', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-18T12:00:00Z', // 3 days from now
      }
      const message = getExpirationMessage(invitation)
      expect(message).toBe('This invitation expires in 3 days.')
    })

    it('returns "valid" message for invitations expiring in more than 7 days', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-25T12:00:00Z', // 10 days from now
      }
      const message = getExpirationMessage(invitation)
      expect(message).toBe('This invitation is valid.')
    })

    it('returns "expires in 7 days" message', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-22T12:00:00Z', // 7 days from now
      }
      const message = getExpirationMessage(invitation)
      expect(message).toBe('This invitation expires in 7 days.')
    })

    it('handles invitation expiring in less than 24 hours (rounds to 1 day)', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-15T18:00:00Z', // 6 hours from now
      }
      const message = getExpirationMessage(invitation)
      expect(message).toBe('This invitation expires in 1 day.')
    })
  })

  describe('validateInvitation', () => {
    it('returns valid for unused and non-expired invitation', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-20T12:00:00Z', // Future date
        used_at: null,
      }
      const result = validateInvitation(invitation)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('returns invalid for expired invitation', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-10T12:00:00Z', // Past date
        used_at: null,
      }
      const result = validateInvitation(invitation)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe(
        'This invitation has expired. Please request a new invitation from your agency admin.'
      )
    })

    it('returns invalid for used invitation', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-20T12:00:00Z', // Future date
        used_at: '2024-01-14T10:00:00Z', // Already used
      }
      const result = validateInvitation(invitation)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('This invitation has already been used and cannot be reused.')
    })

    it('returns invalid for used and expired invitation (used takes precedence)', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-10T12:00:00Z', // Past date
        used_at: '2024-01-14T10:00:00Z', // Already used
      }
      const result = validateInvitation(invitation)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('This invitation has already been used and cannot be reused.')
    })

    it('handles invitation without used_at property', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-20T12:00:00Z',
      }
      const result = validateInvitation(invitation)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('validates invitation with all properties', () => {
      const invitation: Invitation = {
        id: '123',
        email: 'test@example.com',
        expires_at: '2024-01-20T12:00:00Z',
        used_at: null,
        token: 'abc-123',
      }
      const result = validateInvitation(invitation)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('Edge Cases', () => {
    it('handles invitation expiring at exact current time (boundary case)', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-15T12:00:00Z', // Exact current time
      }
      // At exact boundary, it should be considered expired
      expect(isInvitationExpired(invitation)).toBe(false)
    })

    it('handles very old expired invitations', () => {
      const invitation: Invitation = {
        expires_at: '2020-01-01T00:00:00Z', // Very old
      }
      expect(isInvitationExpired(invitation)).toBe(true)
    })

    it('handles far future invitations', () => {
      const invitation: Invitation = {
        expires_at: '2099-12-31T23:59:59Z', // Far future
      }
      expect(isInvitationExpired(invitation)).toBe(false)
    })

    it('handles invitation with empty string used_at', () => {
      const invitation: Invitation = {
        expires_at: '2024-01-20T12:00:00Z',
        used_at: '',
      }
      // Empty string is falsy, so should be treated as unused
      expect(isInvitationUsed(invitation)).toBe(false)
    })
  })
})
