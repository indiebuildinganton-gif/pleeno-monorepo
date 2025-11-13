/**
 * Permission Utilities Tests
 *
 * Tests for role-based access control helper functions
 */

import { describe, it, expect } from 'vitest'
import { hasRole, hasAnyRole, isAgencyAdmin, getUserRole } from '../utils/permissions'
import type { User } from '@supabase/supabase-js'

/**
 * Helper to create mock users with specific roles
 */
const createMockUser = (role: string, agencyId = 'agency-123'): User => ({
  id: '123',
  email: 'test@example.com',
  app_metadata: { role, agency_id: agencyId },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString(),
})

describe('Permission Utils', () => {
  describe('hasRole', () => {
    it('should return true for matching role', () => {
      const user = createMockUser('agency_admin')
      expect(hasRole(user, 'agency_admin')).toBe(true)
    })

    it('should return false for non-matching role', () => {
      const user = createMockUser('agency_user')
      expect(hasRole(user, 'agency_admin')).toBe(false)
    })

    it('should return false for null user', () => {
      expect(hasRole(null, 'agency_admin')).toBe(false)
    })

    it('should grant admin access to everything', () => {
      const admin = createMockUser('agency_admin')
      expect(hasRole(admin, 'agency_admin')).toBe(true)
      expect(hasRole(admin, 'agency_user')).toBe(true)
    })

    it('should deny regular user access to admin role', () => {
      const user = createMockUser('agency_user')
      expect(hasRole(user, 'agency_admin')).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('should return true if user has any of the roles', () => {
      const user = createMockUser('agency_user')
      expect(hasAnyRole(user, ['agency_admin', 'agency_user'])).toBe(true)
    })

    it('should return false if user has none of the roles', () => {
      const user = createMockUser('agency_user')
      expect(hasAnyRole(user, ['agency_admin'])).toBe(false)
    })

    it('should return true for admin with any role list', () => {
      const admin = createMockUser('agency_admin')
      expect(hasAnyRole(admin, ['agency_admin', 'agency_user'])).toBe(true)
    })

    it('should return false for null user', () => {
      expect(hasAnyRole(null, ['agency_admin', 'agency_user'])).toBe(false)
    })

    it('should return false for empty role list', () => {
      const user = createMockUser('agency_user')
      expect(hasAnyRole(user, [])).toBe(false)
    })
  })

  describe('isAgencyAdmin', () => {
    it('should return true for admin', () => {
      const admin = createMockUser('agency_admin')
      expect(isAgencyAdmin(admin)).toBe(true)
    })

    it('should return false for non-admin', () => {
      const user = createMockUser('agency_user')
      expect(isAgencyAdmin(user)).toBe(false)
    })

    it('should return false for null user', () => {
      expect(isAgencyAdmin(null)).toBe(false)
    })
  })

  describe('getUserRole', () => {
    it('should return user role for admin', () => {
      const user = createMockUser('agency_admin')
      expect(getUserRole(user)).toBe('agency_admin')
    })

    it('should return user role for agency user', () => {
      const user = createMockUser('agency_user')
      expect(getUserRole(user)).toBe('agency_user')
    })

    it('should return null for no user', () => {
      expect(getUserRole(null)).toBe(null)
    })

    it('should return null for user without role metadata', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        role: 'authenticated',
        updated_at: new Date().toISOString(),
      } as User
      expect(getUserRole(user)).toBe(null)
    })
  })
})
