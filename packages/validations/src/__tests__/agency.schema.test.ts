/**
 * Agency Schema Validation Tests
 *
 * Tests for agency profile validation schema
 * Epic 2: Agency Configuration & User Management
 * Story 2-1: Agency Profile Setup
 * Task 7: Write Tests for Agency Settings Feature
 */

import { describe, it, expect } from 'vitest'
import { AgencyUpdateSchema, SUPPORTED_CURRENCIES, SUPPORTED_TIMEZONES } from '../agency.schema'

describe('AgencyUpdateSchema', () => {
  describe('Valid Data', () => {
    it('validates complete agency data with all fields', () => {
      const validData = {
        name: 'Test Agency',
        contact_email: 'admin@test.com',
        contact_phone: '+61 400 000 000',
        currency: 'AUD',
        timezone: 'Australia/Brisbane',
      }

      const result = AgencyUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('validates agency data without optional phone number', () => {
      const validData = {
        name: 'Test Agency',
        contact_email: 'admin@test.com',
        currency: 'AUD',
        timezone: 'Australia/Brisbane',
      }

      const result = AgencyUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('accepts all supported currencies', () => {
      const currencies = ['AUD', 'USD', 'EUR', 'GBP', 'NZD', 'CAD']

      currencies.forEach((currency) => {
        const validData = {
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency,
          timezone: 'Australia/Brisbane',
        }

        const result = AgencyUpdateSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('accepts various valid timezone formats', () => {
      const timezones = [
        'UTC',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
      ]

      timezones.forEach((timezone) => {
        const validData = {
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone,
        }

        const result = AgencyUpdateSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('accepts various valid phone number formats', () => {
      const phoneNumbers = [
        '+61 400 000 000',
        '+1 555 123 4567',
        '+44 20 7946 0958',
        '+81 3 1234 5678',
        '1234567890',
      ]

      phoneNumbers.forEach((phone) => {
        const validData = {
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          contact_phone: phone,
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }

        const result = AgencyUpdateSchema.safeParse(validData)
        if (!result.success) {
          console.error(`Phone number "${phone}" failed validation:`, result.error)
        }
        expect(result.success).toBe(true)
      })
    })

    it('accepts long agency names up to 255 characters', () => {
      const longName = 'A'.repeat(255)
      const validData = {
        name: longName,
        contact_email: 'admin@test.com',
        currency: 'AUD',
        timezone: 'Australia/Brisbane',
      }

      const result = AgencyUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Agency Name', () => {
    it('rejects empty agency name', () => {
      const invalidData = {
        name: '',
        contact_email: 'admin@test.com',
        currency: 'AUD',
        timezone: 'Australia/Brisbane',
      }

      const result = AgencyUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('required'))).toBe(true)
      }
    })

    it('rejects missing agency name', () => {
      const invalidData = {
        contact_email: 'admin@test.com',
        currency: 'AUD',
        timezone: 'Australia/Brisbane',
      }

      const result = AgencyUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
      }
    })

    it('rejects agency name exceeding 255 characters', () => {
      const tooLongName = 'A'.repeat(256)
      const invalidData = {
        name: tooLongName,
        contact_email: 'admin@test.com',
        currency: 'AUD',
        timezone: 'Australia/Brisbane',
      }

      const result = AgencyUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('less than 255'))).toBe(true)
      }
    })
  })

  describe('Invalid Email', () => {
    it('rejects missing email', () => {
      const invalidData = {
        name: 'Test Agency',
        currency: 'AUD',
        timezone: 'Australia/Brisbane',
      }

      const result = AgencyUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('contact_email'))).toBe(true)
      }
    })

    it('rejects invalid email format', () => {
      const invalidEmails = [
        'not-an-email',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
        'double@@domain.com',
      ]

      invalidEmails.forEach((email) => {
        const invalidData = {
          name: 'Test Agency',
          contact_email: email,
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }

        const result = AgencyUpdateSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('contact_email'))).toBe(true)
          expect(result.error.issues.some((i) => i.message.includes('email'))).toBe(true)
        }
      })
    })

    it('rejects empty email', () => {
      const invalidData = {
        name: 'Test Agency',
        contact_email: '',
        currency: 'AUD',
        timezone: 'Australia/Brisbane',
      }

      const result = AgencyUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid Phone Number', () => {
    it('rejects invalid phone formats', () => {
      const invalidPhones = ['abc123', 'too-many-letters', '++1234567890', '12']

      invalidPhones.forEach((phone) => {
        const invalidData = {
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          contact_phone: phone,
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }

        const result = AgencyUpdateSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('contact_phone'))).toBe(true)
          expect(result.error.issues.some((i) => i.message.includes('phone'))).toBe(true)
        }
      })
    })
  })

  describe('Invalid Currency', () => {
    it('rejects missing currency', () => {
      const invalidData = {
        name: 'Test Agency',
        contact_email: 'admin@test.com',
        timezone: 'Australia/Brisbane',
      }

      const result = AgencyUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('currency'))).toBe(true)
      }
    })

    it('rejects invalid currency codes', () => {
      const invalidCurrencies = ['XXX', 'INVALID', 'JPY', 'CNY', 'BRL']

      invalidCurrencies.forEach((currency) => {
        const invalidData = {
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency,
          timezone: 'Australia/Brisbane',
        }

        const result = AgencyUpdateSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('currency'))).toBe(true)
          expect(result.error.issues.some((i) => i.message.includes('AUD, USD, EUR'))).toBe(true)
        }
      })
    })

    it('rejects lowercase currency codes', () => {
      const invalidData = {
        name: 'Test Agency',
        contact_email: 'admin@test.com',
        currency: 'aud',
        timezone: 'Australia/Brisbane',
      }

      const result = AgencyUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid Timezone', () => {
    it('rejects missing timezone', () => {
      const invalidData = {
        name: 'Test Agency',
        contact_email: 'admin@test.com',
        currency: 'AUD',
      }

      const result = AgencyUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('timezone'))).toBe(true)
      }
    })

    it('rejects invalid timezone identifiers', () => {
      const invalidTimezones = [
        'Invalid/Timezone',
        'EST',
        'PST',
        'GMT+10',
        'America/InvalidCity',
        'NotATimezone',
      ]

      invalidTimezones.forEach((timezone) => {
        const invalidData = {
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone,
        }

        const result = AgencyUpdateSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('timezone'))).toBe(true)
          expect(result.error.issues.some((i) => i.message.includes('IANA'))).toBe(true)
        }
      })
    })
  })

  describe('Multiple Validation Errors', () => {
    it('reports all validation errors when multiple fields are invalid', () => {
      const invalidData = {
        name: '',
        contact_email: 'not-an-email',
        contact_phone: 'invalid',
        currency: 'INVALID',
        timezone: 'Invalid/Timezone',
      }

      const result = AgencyUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        // Should have errors for all fields
        expect(result.error.issues.length).toBeGreaterThanOrEqual(5)
        expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
        expect(result.error.issues.some((i) => i.path.includes('contact_email'))).toBe(true)
        expect(result.error.issues.some((i) => i.path.includes('contact_phone'))).toBe(true)
        expect(result.error.issues.some((i) => i.path.includes('currency'))).toBe(true)
        expect(result.error.issues.some((i) => i.path.includes('timezone'))).toBe(true)
      }
    })

    it('reports errors with descriptive messages', () => {
      const invalidData = {
        name: '',
        contact_email: 'invalid',
        currency: 'XXX',
        timezone: 'BadTZ',
      }

      const result = AgencyUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message)
        expect(messages.some((m) => m.includes('required'))).toBe(true)
        expect(messages.some((m) => m.includes('email'))).toBe(true)
        expect(messages.some((m) => m.includes('Currency'))).toBe(true)
        expect(messages.some((m) => m.includes('Timezone'))).toBe(true)
      }
    })
  })

  describe('Exported Constants', () => {
    it('exports SUPPORTED_CURRENCIES array', () => {
      expect(SUPPORTED_CURRENCIES).toBeDefined()
      expect(Array.isArray(SUPPORTED_CURRENCIES)).toBe(true)
      expect(SUPPORTED_CURRENCIES.length).toBe(6)
      expect(SUPPORTED_CURRENCIES).toContain('AUD')
      expect(SUPPORTED_CURRENCIES).toContain('USD')
      expect(SUPPORTED_CURRENCIES).toContain('EUR')
      expect(SUPPORTED_CURRENCIES).toContain('GBP')
      expect(SUPPORTED_CURRENCIES).toContain('NZD')
      expect(SUPPORTED_CURRENCIES).toContain('CAD')
    })

    it('exports SUPPORTED_TIMEZONES array', () => {
      expect(SUPPORTED_TIMEZONES).toBeDefined()
      expect(Array.isArray(SUPPORTED_TIMEZONES)).toBe(true)
      expect(SUPPORTED_TIMEZONES.length).toBeGreaterThan(0)
      expect(SUPPORTED_TIMEZONES).toContain('UTC')
      expect(SUPPORTED_TIMEZONES).toContain('America/New_York')
      expect(SUPPORTED_TIMEZONES).toContain('Europe/London')
      expect(SUPPORTED_TIMEZONES).toContain('Asia/Tokyo')
      expect(SUPPORTED_TIMEZONES).toContain('Australia/Brisbane')
    })
  })
})
