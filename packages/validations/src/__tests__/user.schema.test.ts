/**
 * User Schema Validation Tests
 *
 * Tests for user profile, password, and email validation schemas
 * Epic 2: Agency Configuration & User Management
 * Story 2-4: User Profile Management
 * Task 12: Create validation schemas
 */

import { describe, it, expect } from 'vitest'
import {
  ProfileUpdateSchema,
  PasswordChangeSchema,
  EmailUpdateSchema,
  UserRoleUpdateSchema,
  UserStatusUpdateSchema,
} from '../user.schema'

describe('ProfileUpdateSchema', () => {
  describe('Valid Data', () => {
    it('validates profile update with valid full name', () => {
      const validData = {
        full_name: 'John Doe',
      }

      const result = ProfileUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('validates full name with minimum 2 characters', () => {
      const validData = {
        full_name: 'Jo',
      }

      const result = ProfileUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('validates full name up to 255 characters', () => {
      const longName = 'A'.repeat(255)
      const validData = {
        full_name: longName,
      }

      const result = ProfileUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('trims whitespace from full name', () => {
      const validData = {
        full_name: '  John Doe  ',
      }

      const result = ProfileUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.full_name).toBe('John Doe')
      }
    })

    it('accepts names with special characters', () => {
      const validNames = [
        "O'Brien",
        'Jean-Luc',
        'José García',
        'Müller',
        'Smith Jr.',
        '李明',
        'Σωκράτης',
      ]

      validNames.forEach((name) => {
        const validData = { full_name: name }
        const result = ProfileUpdateSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Invalid Data', () => {
    it('rejects full name with less than 2 characters', () => {
      const invalidData = {
        full_name: 'A',
      }

      const result = ProfileUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('full_name'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('at least 2'))).toBe(true)
      }
    })

    it('rejects full name exceeding 255 characters', () => {
      const tooLongName = 'A'.repeat(256)
      const invalidData = {
        full_name: tooLongName,
      }

      const result = ProfileUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('full_name'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('less than 255'))).toBe(true)
      }
    })

    it('rejects empty full name after trimming', () => {
      const invalidData = {
        full_name: '   ',
      }

      const result = ProfileUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects missing full_name field', () => {
      const invalidData = {}

      const result = ProfileUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('full_name'))).toBe(true)
      }
    })
  })
})

describe('PasswordChangeSchema', () => {
  describe('Valid Data', () => {
    it('validates password change with all requirements met', () => {
      const validData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'NewP@ssw0rd!',
        confirm_password: 'NewP@ssw0rd!',
      }

      const result = PasswordChangeSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('accepts password with minimum 8 characters', () => {
      const validData = {
        current_password: 'OldP@ss1',
        new_password: 'NewP@ss1',
        confirm_password: 'NewP@ss1',
      }

      const result = PasswordChangeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('accepts password with all special characters', () => {
      const specialChars = '!@#$%^&*(),.?":{}|<>'

      specialChars.split('').forEach((char) => {
        const password = `Pass${char}word1`
        const validData = {
          current_password: 'OldP@ssw0rd',
          new_password: password,
          confirm_password: password,
        }

        const result = PasswordChangeSchema.safeParse(validData)
        if (!result.success) {
          console.error(`Special char "${char}" failed:`, result.error)
        }
        expect(result.success).toBe(true)
      })
    })

    it('accepts long passwords', () => {
      const longPassword = 'P@ssword123456789ABCDEFGHIJKLMNOP!'
      const validData = {
        current_password: 'OldP@ssw0rd',
        new_password: longPassword,
        confirm_password: longPassword,
      }

      const result = PasswordChangeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('accepts password with multiple uppercase letters', () => {
      const validData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'NEWP@ssw0rd!',
        confirm_password: 'NEWP@ssw0rd!',
      }

      const result = PasswordChangeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('accepts password with multiple numbers', () => {
      const validData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'NewP@ssw0rd123',
        confirm_password: 'NewP@ssw0rd123',
      }

      const result = PasswordChangeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Data - Password Length', () => {
    it('rejects password with less than 8 characters', () => {
      const invalidData = {
        current_password: 'OldP@ss',
        new_password: 'NewP@1',
        confirm_password: 'NewP@1',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('new_password'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('at least 8'))).toBe(true)
      }
    })
  })

  describe('Invalid Data - Missing Uppercase', () => {
    it('rejects password without uppercase letter', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'newp@ssw0rd1',
        confirm_password: 'newp@ssw0rd1',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('new_password'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('uppercase'))).toBe(true)
      }
    })
  })

  describe('Invalid Data - Missing Lowercase', () => {
    it('rejects password without lowercase letter', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'NEWP@SSW0RD',
        confirm_password: 'NEWP@SSW0RD',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('new_password'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('lowercase'))).toBe(true)
      }
    })
  })

  describe('Invalid Data - Missing Number', () => {
    it('rejects password without number', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'NewP@ssword!',
        confirm_password: 'NewP@ssword!',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('new_password'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('number'))).toBe(true)
      }
    })
  })

  describe('Invalid Data - Missing Special Character', () => {
    it('rejects password without special character', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'NewPassword1',
        confirm_password: 'NewPassword1',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('new_password'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('special character'))).toBe(true)
      }
    })

    it('rejects password with space as special character', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'New Password1',
        confirm_password: 'New Password1',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('special character'))).toBe(true)
      }
    })

    it('rejects password with underscore as only special character', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'New_Password1',
        confirm_password: 'New_Password1',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects password with hyphen as only special character', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'New-Password1',
        confirm_password: 'New-Password1',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid Data - Password Mismatch', () => {
    it('rejects when new_password and confirm_password do not match', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'NewP@ssw0rd1',
        confirm_password: 'DifferentP@ssw0rd1',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('confirm_password'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('do not match'))).toBe(true)
      }
    })

    it('rejects when passwords differ by case', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'NewP@ssw0rd1',
        confirm_password: 'newp@ssw0rd1',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects when passwords differ by whitespace', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'NewP@ssw0rd1',
        confirm_password: 'NewP@ssw0rd1 ',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid Data - Missing Fields', () => {
    it('rejects missing current_password', () => {
      const invalidData = {
        new_password: 'NewP@ssw0rd1',
        confirm_password: 'NewP@ssw0rd1',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('current_password'))).toBe(true)
      }
    })

    it('rejects empty current_password', () => {
      const invalidData = {
        current_password: '',
        new_password: 'NewP@ssw0rd1',
        confirm_password: 'NewP@ssw0rd1',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects missing new_password', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        confirm_password: 'NewP@ssw0rd1',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects missing confirm_password', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'NewP@ssw0rd1',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Multiple Password Validation Errors', () => {
    it('reports all validation errors when password fails multiple requirements', () => {
      const invalidData = {
        current_password: 'OldP@ssw0rd',
        new_password: 'short', // Missing: length, uppercase, number, special char
        confirm_password: 'short',
      }

      const result = PasswordChangeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(4)
        const messages = result.error.issues.map((i) => i.message)
        expect(messages.some((m) => m.includes('at least 8'))).toBe(true)
        expect(messages.some((m) => m.includes('uppercase'))).toBe(true)
        expect(messages.some((m) => m.includes('number'))).toBe(true)
        expect(messages.some((m) => m.includes('special character'))).toBe(true)
      }
    })
  })
})

describe('EmailUpdateSchema', () => {
  describe('Valid Data', () => {
    it('validates email update with valid email', () => {
      const validData = {
        email: 'user@example.com',
      }

      const result = EmailUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user@example.com')
      }
    })

    it('converts email to lowercase', () => {
      const validData = {
        email: 'User@Example.COM',
      }

      const result = EmailUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user@example.com')
      }
    })

    it('trims whitespace from email', () => {
      const validData = {
        email: '  user@example.com  ',
      }

      const result = EmailUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user@example.com')
      }
    })

    it('accepts various valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user_name@example.co.uk',
        'user123@subdomain.example.com',
        'a@b.co',
      ]

      validEmails.forEach((email) => {
        const validData = { email }
        const result = EmailUpdateSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('accepts email up to 255 characters', () => {
      // Create a long but valid email (local@domain.com)
      const longLocal = 'a'.repeat(240) // 240 chars
      const longEmail = `${longLocal}@example.com` // Total: 252 chars
      const validData = { email: longEmail }

      const result = EmailUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Data', () => {
    it('rejects invalid email format', () => {
      const invalidEmails = [
        'not-an-email',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
        'double@@domain.com',
        'user@',
        '@example.com',
        'user..name@example.com',
        'user@domain',
      ]

      invalidEmails.forEach((email) => {
        const invalidData = { email }
        const result = EmailUpdateSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true)
          expect(result.error.issues.some((i) => i.message.includes('email'))).toBe(true)
        }
      })
    })

    it('rejects empty email', () => {
      const invalidData = {
        email: '',
      }

      const result = EmailUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects missing email field', () => {
      const invalidData = {}

      const result = EmailUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true)
      }
    })

    it('rejects email exceeding 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com' // > 255 chars
      const invalidData = { email: longEmail }

      const result = EmailUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('less than 255'))).toBe(true)
      }
    })
  })
})

describe('UserRoleUpdateSchema', () => {
  describe('Valid Data', () => {
    it('validates agency_admin role', () => {
      const validData = {
        role: 'agency_admin' as const,
      }

      const result = UserRoleUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('agency_admin')
      }
    })

    it('validates agency_user role', () => {
      const validData = {
        role: 'agency_user' as const,
      }

      const result = UserRoleUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('agency_user')
      }
    })
  })

  describe('Invalid Data', () => {
    it('rejects invalid role', () => {
      const invalidData = {
        role: 'invalid_role',
      }

      const result = UserRoleUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('role'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('agency_admin or agency_user'))).toBe(
          true
        )
      }
    })

    it('rejects missing role field', () => {
      const invalidData = {}

      const result = UserRoleUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

describe('UserStatusUpdateSchema', () => {
  describe('Valid Data', () => {
    it('validates active status', () => {
      const validData = {
        status: 'active' as const,
      }

      const result = UserStatusUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active')
      }
    })

    it('validates inactive status', () => {
      const validData = {
        status: 'inactive' as const,
      }

      const result = UserStatusUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('inactive')
      }
    })
  })

  describe('Invalid Data', () => {
    it('rejects invalid status', () => {
      const invalidData = {
        status: 'invalid_status',
      }

      const result = UserStatusUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('status'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('active or inactive'))).toBe(true)
      }
    })

    it('rejects missing status field', () => {
      const invalidData = {}

      const result = UserStatusUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
