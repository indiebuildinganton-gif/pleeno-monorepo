/**
 * Unit Tests: Student Schema Validation
 *
 * Tests Zod schema validation for student create/update operations
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 17: Testing - Unit Tests
 */

import { describe, it, expect } from 'vitest'
import {
  StudentCreateSchema,
  StudentUpdateSchema,
  NoteCreateSchema,
  NoteUpdateSchema,
  VisaStatusEnum,
} from '@pleeno/validations'

describe('StudentCreateSchema', () => {
  describe('valid data', () => {
    it('accepts valid student with all fields', () => {
      const validStudent = {
        full_name: 'John Doe',
        passport_number: 'AB123456',
        email: 'john.doe@email.com',
        phone: '+1-416-555-0123',
        visa_status: 'approved',
        date_of_birth: '1995-06-15',
        nationality: 'Canadian',
      }

      const result = StudentCreateSchema.safeParse(validStudent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.full_name).toBe('John Doe')
        expect(result.data.passport_number).toBe('AB123456')
        expect(result.data.email).toBe('john.doe@email.com')
      }
    })

    it('accepts valid student with only required fields', () => {
      const validStudent = {
        full_name: 'Jane Doe',
        passport_number: 'CD789012',
      }

      const result = StudentCreateSchema.safeParse(validStudent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.full_name).toBe('Jane Doe')
        expect(result.data.passport_number).toBe('CD789012')
        expect(result.data.email).toBeUndefined()
        expect(result.data.phone).toBeUndefined()
      }
    })

    it('trims whitespace from string fields', () => {
      const studentWithWhitespace = {
        full_name: '  John Doe  ',
        passport_number: '  AB123456  ',
        email: '  john@email.com  ',
        phone: '  +1-416-555-0123  ',
        nationality: '  Canadian  ',
      }

      const result = StudentCreateSchema.safeParse(studentWithWhitespace)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.full_name).toBe('John Doe')
        expect(result.data.passport_number).toBe('AB123456')
        expect(result.data.email).toBe('john@email.com')
        expect(result.data.phone).toBe('+1-416-555-0123')
        expect(result.data.nationality).toBe('Canadian')
      }
    })

    it('converts email to lowercase', () => {
      const studentWithUppercaseEmail = {
        full_name: 'John Doe',
        passport_number: 'AB123456',
        email: 'JOHN.DOE@EMAIL.COM',
      }

      const result = StudentCreateSchema.safeParse(studentWithUppercaseEmail)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('john.doe@email.com')
      }
    })

    it('accepts null values for optional fields', () => {
      const studentWithNulls = {
        full_name: 'John Doe',
        passport_number: 'AB123456',
        email: null,
        phone: null,
        visa_status: null,
        date_of_birth: null,
        nationality: null,
      }

      const result = StudentCreateSchema.safeParse(studentWithNulls)
      expect(result.success).toBe(true)
    })
  })

  describe('full_name validation', () => {
    it('rejects empty full_name', () => {
      const invalidStudent = {
        full_name: '',
        passport_number: 'AB123456',
      }

      const result = StudentCreateSchema.safeParse(invalidStudent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Full name is required')
      }
    })

    it('rejects full_name longer than 255 characters', () => {
      const invalidStudent = {
        full_name: 'a'.repeat(256),
        passport_number: 'AB123456',
      }

      const result = StudentCreateSchema.safeParse(invalidStudent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 255 characters')
      }
    })

    it('rejects missing full_name', () => {
      const invalidStudent = {
        passport_number: 'AB123456',
      }

      const result = StudentCreateSchema.safeParse(invalidStudent)
      expect(result.success).toBe(false)
    })

    it('accepts full_name exactly 255 characters', () => {
      const validStudent = {
        full_name: 'a'.repeat(255),
        passport_number: 'AB123456',
      }

      const result = StudentCreateSchema.safeParse(validStudent)
      expect(result.success).toBe(true)
    })
  })

  describe('passport_number validation', () => {
    it('rejects empty passport_number', () => {
      const invalidStudent = {
        full_name: 'John Doe',
        passport_number: '',
      }

      const result = StudentCreateSchema.safeParse(invalidStudent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Passport number is required')
      }
    })

    it('rejects passport_number longer than 50 characters', () => {
      const invalidStudent = {
        full_name: 'John Doe',
        passport_number: 'a'.repeat(51),
      }

      const result = StudentCreateSchema.safeParse(invalidStudent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 50 characters')
      }
    })

    it('rejects missing passport_number', () => {
      const invalidStudent = {
        full_name: 'John Doe',
      }

      const result = StudentCreateSchema.safeParse(invalidStudent)
      expect(result.success).toBe(false)
    })

    it('accepts passport_number exactly 50 characters', () => {
      const validStudent = {
        full_name: 'John Doe',
        passport_number: 'a'.repeat(50),
      }

      const result = StudentCreateSchema.safeParse(validStudent)
      expect(result.success).toBe(true)
    })
  })

  describe('email validation', () => {
    it('rejects invalid email format', () => {
      const invalidStudent = {
        full_name: 'John Doe',
        passport_number: 'AB123456',
        email: 'not-an-email',
      }

      const result = StudentCreateSchema.safeParse(invalidStudent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email')
      }
    })

    it('rejects email longer than 255 characters', () => {
      const longEmail = 'a'.repeat(245) + '@email.com'
      const invalidStudent = {
        full_name: 'John Doe',
        passport_number: 'AB123456',
        email: longEmail,
      }

      const result = StudentCreateSchema.safeParse(invalidStudent)
      expect(result.success).toBe(false)
    })

    it('accepts valid email formats', () => {
      const validEmails = [
        'simple@email.com',
        'first.last@email.com',
        'user+tag@email.co.uk',
        'user_name@email-domain.com',
      ]

      validEmails.forEach((email) => {
        const student = {
          full_name: 'John Doe',
          passport_number: 'AB123456',
          email,
        }
        const result = StudentCreateSchema.safeParse(student)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('phone validation', () => {
    it('rejects phone longer than 50 characters', () => {
      const invalidStudent = {
        full_name: 'John Doe',
        passport_number: 'AB123456',
        phone: '1'.repeat(51),
      }

      const result = StudentCreateSchema.safeParse(invalidStudent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 50 characters')
      }
    })

    it('accepts various phone formats', () => {
      const validPhones = [
        '+1-416-555-0123',
        '4165550123',
        '+61 3 5555 0123',
        '(416) 555-0123',
      ]

      validPhones.forEach((phone) => {
        const student = {
          full_name: 'John Doe',
          passport_number: 'AB123456',
          phone,
        }
        const result = StudentCreateSchema.safeParse(student)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('visa_status validation', () => {
    it('accepts valid visa statuses', () => {
      const validStatuses = ['in_process', 'approved', 'denied', 'expired']

      validStatuses.forEach((status) => {
        const student = {
          full_name: 'John Doe',
          passport_number: 'AB123456',
          visa_status: status,
        }
        const result = StudentCreateSchema.safeParse(student)
        expect(result.success).toBe(true)
      })
    })

    it('rejects invalid visa status', () => {
      const invalidStudent = {
        full_name: 'John Doe',
        passport_number: 'AB123456',
        visa_status: 'invalid_status',
      }

      const result = StudentCreateSchema.safeParse(invalidStudent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Visa status must be one of')
      }
    })
  })

  describe('date_of_birth validation', () => {
    it('accepts valid date format YYYY-MM-DD', () => {
      const validStudent = {
        full_name: 'John Doe',
        passport_number: 'AB123456',
        date_of_birth: '1995-06-15',
      }

      const result = StudentCreateSchema.safeParse(validStudent)
      expect(result.success).toBe(true)
    })

    it('rejects invalid date format', () => {
      const invalidFormats = ['15/06/1995', '1995-6-15', '06-15-1995', 'not-a-date']

      invalidFormats.forEach((date) => {
        const student = {
          full_name: 'John Doe',
          passport_number: 'AB123456',
          date_of_birth: date,
        }
        const result = StudentCreateSchema.safeParse(student)
        expect(result.success).toBe(false)
      })
    })

    it('rejects invalid dates like 2025-13-45', () => {
      const invalidStudent = {
        full_name: 'John Doe',
        passport_number: 'AB123456',
        date_of_birth: '2025-13-45',
      }

      const result = StudentCreateSchema.safeParse(invalidStudent)
      expect(result.success).toBe(false)
    })
  })

  describe('nationality validation', () => {
    it('rejects nationality longer than 100 characters', () => {
      const invalidStudent = {
        full_name: 'John Doe',
        passport_number: 'AB123456',
        nationality: 'a'.repeat(101),
      }

      const result = StudentCreateSchema.safeParse(invalidStudent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 100 characters')
      }
    })

    it('accepts nationality exactly 100 characters', () => {
      const validStudent = {
        full_name: 'John Doe',
        passport_number: 'AB123456',
        nationality: 'a'.repeat(100),
      }

      const result = StudentCreateSchema.safeParse(validStudent)
      expect(result.success).toBe(true)
    })
  })
})

describe('StudentUpdateSchema', () => {
  it('accepts partial updates with only one field', () => {
    const partialUpdate = {
      full_name: 'Updated Name',
    }

    const result = StudentUpdateSchema.safeParse(partialUpdate)
    expect(result.success).toBe(true)
  })

  it('accepts empty object (no updates)', () => {
    const noUpdate = {}

    const result = StudentUpdateSchema.safeParse(noUpdate)
    expect(result.success).toBe(true)
  })

  it('rejects empty strings for provided fields', () => {
    const invalidUpdate = {
      full_name: '',
    }

    const result = StudentUpdateSchema.safeParse(invalidUpdate)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot be empty')
    }
  })

  it('validates all fields same as create schema', () => {
    const invalidUpdate = {
      email: 'not-an-email',
      visa_status: 'invalid_status',
      date_of_birth: 'invalid-date',
    }

    const result = StudentUpdateSchema.safeParse(invalidUpdate)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0)
    }
  })
})

describe('NoteCreateSchema', () => {
  it('accepts valid note with content', () => {
    const validNote = {
      content: 'This is a valid note about the student.',
    }

    const result = NoteCreateSchema.safeParse(validNote)
    expect(result.success).toBe(true)
  })

  it('rejects empty content', () => {
    const invalidNote = {
      content: '',
    }

    const result = NoteCreateSchema.safeParse(invalidNote)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Note content is required')
    }
  })

  it('rejects content longer than 2000 characters', () => {
    const invalidNote = {
      content: 'a'.repeat(2001),
    }

    const result = NoteCreateSchema.safeParse(invalidNote)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 2000 characters')
    }
  })

  it('accepts content exactly 2000 characters', () => {
    const validNote = {
      content: 'a'.repeat(2000),
    }

    const result = NoteCreateSchema.safeParse(validNote)
    expect(result.success).toBe(true)
  })

  it('trims whitespace from content', () => {
    const noteWithWhitespace = {
      content: '  Valid note content  ',
    }

    const result = NoteCreateSchema.safeParse(noteWithWhitespace)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe('Valid note content')
    }
  })

  it('rejects missing content', () => {
    const invalidNote = {}

    const result = NoteCreateSchema.safeParse(invalidNote)
    expect(result.success).toBe(false)
  })
})

describe('NoteUpdateSchema', () => {
  it('accepts valid note update', () => {
    const validUpdate = {
      content: 'Updated note content',
    }

    const result = NoteUpdateSchema.safeParse(validUpdate)
    expect(result.success).toBe(true)
  })

  it('rejects empty content', () => {
    const invalidUpdate = {
      content: '',
    }

    const result = NoteUpdateSchema.safeParse(invalidUpdate)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot be empty')
    }
  })

  it('rejects content longer than 2000 characters', () => {
    const invalidUpdate = {
      content: 'a'.repeat(2001),
    }

    const result = NoteUpdateSchema.safeParse(invalidUpdate)
    expect(result.success).toBe(false)
  })
})

describe('VisaStatusEnum', () => {
  it('validates all allowed visa statuses', () => {
    const validStatuses = ['in_process', 'approved', 'denied', 'expired']

    validStatuses.forEach((status) => {
      const result = VisaStatusEnum.safeParse(status)
      expect(result.success).toBe(true)
    })
  })

  it('rejects invalid visa statuses', () => {
    const invalidStatuses = ['pending', 'active', 'rejected', 'cancelled', 'unknown']

    invalidStatuses.forEach((status) => {
      const result = VisaStatusEnum.safeParse(status)
      expect(result.success).toBe(false)
    })
  })

  it('provides custom error message for invalid status', () => {
    const result = VisaStatusEnum.safeParse('invalid')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Visa status must be one of: in_process, approved, denied, expired'
      )
    }
  })
})
