/**
 * College Schema Validation Tests
 *
 * Tests for college creation, update, and validation schemas
 * Epic 3: Entities Domain
 * Story 3-1: College Registry
 * Task 21: Write Tests for College Management
 */

import { describe, it, expect } from 'vitest'
import {
  CollegeCreateSchema,
  CollegeUpdateSchema,
  GstStatusEnum,
} from '../college.schema'

describe('GstStatusEnum', () => {
  describe('Valid Data', () => {
    it('validates "included" status', () => {
      const result = GstStatusEnum.safeParse('included')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('included')
      }
    })

    it('validates "excluded" status', () => {
      const result = GstStatusEnum.safeParse('excluded')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('excluded')
      }
    })
  })

  describe('Invalid Data', () => {
    it('rejects invalid GST status values', () => {
      const invalidStatuses = ['invalid', 'INCLUDED', 'EXCLUDED', 'yes', 'no', '']

      invalidStatuses.forEach((status) => {
        const result = GstStatusEnum.safeParse(status)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('included')
          expect(result.error.issues[0].message).toContain('excluded')
        }
      })
    })
  })
})

describe('CollegeCreateSchema', () => {
  describe('Valid Data', () => {
    it('validates college creation with all required fields', () => {
      const validData = {
        name: 'University of Sydney',
        default_commission_rate_percent: 15,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('University of Sydney')
        expect(result.data.default_commission_rate_percent).toBe(15)
        expect(result.data.gst_status).toBe('included')
      }
    })

    it('validates college creation with all fields', () => {
      const validData = {
        name: 'University of Melbourne',
        city: 'Melbourne',
        country: 'Australia',
        default_commission_rate_percent: 20,
        gst_status: 'excluded' as const,
        contract_expiration_date: '2025-12-31',
      }

      const result = CollegeCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('trims whitespace from name', () => {
      const validData = {
        name: '  University of Sydney  ',
        default_commission_rate_percent: 15,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('University of Sydney')
      }
    })

    it('trims whitespace from city and country', () => {
      const validData = {
        name: 'Test University',
        city: '  Sydney  ',
        country: '  Australia  ',
        default_commission_rate_percent: 15,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.city).toBe('Sydney')
        expect(result.data.country).toBe('Australia')
      }
    })

    it('accepts commission rate at minimum boundary (0)', () => {
      const validData = {
        name: 'Test University',
        default_commission_rate_percent: 0,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('accepts commission rate at maximum boundary (100)', () => {
      const validData = {
        name: 'Test University',
        default_commission_rate_percent: 100,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('accepts decimal commission rates', () => {
      const validData = {
        name: 'Test University',
        default_commission_rate_percent: 15.5,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.default_commission_rate_percent).toBe(15.5)
      }
    })

    it('defaults GST status to "included" when not provided', () => {
      const validData = {
        name: 'Test University',
        default_commission_rate_percent: 15,
      }

      const result = CollegeCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.gst_status).toBe('included')
      }
    })

    it('accepts null for optional fields', () => {
      const validData = {
        name: 'Test University',
        city: null,
        country: null,
        default_commission_rate_percent: 15,
        gst_status: 'included' as const,
        contract_expiration_date: null,
      }

      const result = CollegeCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('accepts valid date format YYYY-MM-DD', () => {
      const validData = {
        name: 'Test University',
        default_commission_rate_percent: 15,
        gst_status: 'included' as const,
        contract_expiration_date: '2025-12-31',
      }

      const result = CollegeCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Data - Name Validation', () => {
    it('rejects empty name', () => {
      const invalidData = {
        name: '',
        default_commission_rate_percent: 15,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('required'))).toBe(true)
      }
    })

    it('rejects missing name field', () => {
      const invalidData = {
        default_commission_rate_percent: 15,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
      }
    })

    it('rejects name exceeding 255 characters', () => {
      const invalidData = {
        name: 'A'.repeat(256),
        default_commission_rate_percent: 15,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('less than 255'))).toBe(true)
      }
    })

    it('rejects whitespace-only name', () => {
      const invalidData = {
        name: '   ',
        default_commission_rate_percent: 15,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid Data - Commission Rate Validation', () => {
    it('rejects commission rate below 0', () => {
      const invalidData = {
        name: 'Test University',
        default_commission_rate_percent: -1,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('default_commission_rate_percent'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('at least 0'))).toBe(true)
      }
    })

    it('rejects commission rate above 100', () => {
      const invalidData = {
        name: 'Test University',
        default_commission_rate_percent: 101,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('default_commission_rate_percent'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('not exceed 100'))).toBe(true)
      }
    })

    it('rejects missing commission rate', () => {
      const invalidData = {
        name: 'Test University',
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('default_commission_rate_percent'))).toBe(true)
      }
    })

    it('rejects non-numeric commission rate', () => {
      const invalidData = {
        name: 'Test University',
        default_commission_rate_percent: 'fifteen' as any,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid Data - GST Status Validation', () => {
    it('rejects invalid GST status', () => {
      const invalidData = {
        name: 'Test University',
        default_commission_rate_percent: 15,
        gst_status: 'invalid' as any,
      }

      const result = CollegeCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('gst_status'))).toBe(true)
      }
    })
  })

  describe('Invalid Data - Date Validation', () => {
    it('rejects invalid date format', () => {
      const invalidDates = [
        '31/12/2025',      // DD/MM/YYYY
        '12-31-2025',      // MM-DD-YYYY
        '2025/12/31',      // YYYY/MM/DD
        '2025-13-01',      // Invalid month
        '2025-12-32',      // Invalid day
        'not-a-date',
      ]

      invalidDates.forEach((date) => {
        const invalidData = {
          name: 'Test University',
          default_commission_rate_percent: 15,
          gst_status: 'included' as const,
          contract_expiration_date: date,
        }

        const result = CollegeCreateSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.message.includes('YYYY-MM-DD'))).toBe(true)
        }
      })
    })
  })

  describe('Invalid Data - City and Country Validation', () => {
    it('rejects city exceeding 255 characters', () => {
      const invalidData = {
        name: 'Test University',
        city: 'A'.repeat(256),
        default_commission_rate_percent: 15,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('city'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('less than 255'))).toBe(true)
      }
    })

    it('rejects country exceeding 255 characters', () => {
      const invalidData = {
        name: 'Test University',
        country: 'A'.repeat(256),
        default_commission_rate_percent: 15,
        gst_status: 'included' as const,
      }

      const result = CollegeCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('country'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('less than 255'))).toBe(true)
      }
    })
  })
})

describe('CollegeUpdateSchema', () => {
  describe('Valid Data', () => {
    it('validates partial update with single field', () => {
      const validData = {
        name: 'Updated University Name',
      }

      const result = CollegeUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Updated University Name')
      }
    })

    it('validates partial update with multiple fields', () => {
      const validData = {
        name: 'Updated University',
        city: 'Perth',
        default_commission_rate_percent: 18,
      }

      const result = CollegeUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('validates update with all fields', () => {
      const validData = {
        name: 'Updated University',
        city: 'Brisbane',
        country: 'Australia',
        default_commission_rate_percent: 22,
        gst_status: 'excluded' as const,
        contract_expiration_date: '2026-06-30',
      }

      const result = CollegeUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('validates empty update object', () => {
      const validData = {}

      const result = CollegeUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('validates commission rate update at boundaries', () => {
      const validData1 = { default_commission_rate_percent: 0 }
      const validData2 = { default_commission_rate_percent: 100 }

      const result1 = CollegeUpdateSchema.safeParse(validData1)
      const result2 = CollegeUpdateSchema.safeParse(validData2)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })

    it('allows null values for optional fields', () => {
      const validData = {
        city: null,
        country: null,
        contract_expiration_date: null,
      }

      const result = CollegeUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Data', () => {
    it('rejects empty name', () => {
      const invalidData = {
        name: '',
      }

      const result = CollegeUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
        expect(result.error.issues.some((i) => i.message.includes('cannot be empty'))).toBe(true)
      }
    })

    it('rejects name exceeding 255 characters', () => {
      const invalidData = {
        name: 'A'.repeat(256),
      }

      const result = CollegeUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects commission rate below 0', () => {
      const invalidData = {
        default_commission_rate_percent: -5,
      }

      const result = CollegeUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects commission rate above 100', () => {
      const invalidData = {
        default_commission_rate_percent: 150,
      }

      const result = CollegeUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects invalid GST status', () => {
      const invalidData = {
        gst_status: 'maybe' as any,
      }

      const result = CollegeUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects invalid date format', () => {
      const invalidData = {
        contract_expiration_date: '31-12-2025',
      }

      const result = CollegeUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects city exceeding 255 characters', () => {
      const invalidData = {
        city: 'A'.repeat(256),
      }

      const result = CollegeUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects country exceeding 255 characters', () => {
      const invalidData = {
        country: 'A'.repeat(256),
      }

      const result = CollegeUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
