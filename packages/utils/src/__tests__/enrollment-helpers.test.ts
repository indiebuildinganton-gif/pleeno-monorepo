/**
 * Enrollment Helpers Tests
 *
 * Unit tests for enrollment helper functions including duplicate detection,
 * offer letter upload, and combined enrollment creation operations.
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 10: Duplicate Enrollment Handling Logic
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  findOrCreateEnrollment,
  uploadOfferLetter,
  createEnrollmentWithOfferLetter,
  type EnrollmentResponse,
} from '../enrollment-helpers'

// Mock fetch API
global.fetch = vi.fn()

describe('Enrollment Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('findOrCreateEnrollment', () => {
    const mockStudentId = 'student-123'
    const mockBranchId = 'branch-456'
    const mockProgramName = 'Bachelor of Computer Science'

    it('creates new enrollment when none exists', async () => {
      const mockEnrollment: EnrollmentResponse = {
        id: 'enrollment-789',
        student_id: mockStudentId,
        branch_id: mockBranchId,
        program_name: mockProgramName,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        is_existing: false,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockEnrollment,
        }),
      } as Response)

      const result = await findOrCreateEnrollment(mockStudentId, mockBranchId, mockProgramName)

      expect(fetch).toHaveBeenCalledWith('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: mockStudentId,
          branch_id: mockBranchId,
          program_name: mockProgramName,
        }),
      })

      expect(result).toEqual(mockEnrollment)
      expect(result.is_existing).toBe(false)
    })

    it('reuses existing active enrollment', async () => {
      const mockExistingEnrollment: EnrollmentResponse = {
        id: 'existing-enrollment-999',
        student_id: mockStudentId,
        branch_id: mockBranchId,
        program_name: mockProgramName,
        offer_letter_url: 'https://storage.example.com/offer-letter.pdf',
        offer_letter_filename: 'offer-letter.pdf',
        status: 'active',
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:00:00Z',
        is_existing: true,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockExistingEnrollment,
        }),
      } as Response)

      const result = await findOrCreateEnrollment(mockStudentId, mockBranchId, mockProgramName)

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockExistingEnrollment)
      expect(result.is_existing).toBe(true)
      expect(result.id).toBe('existing-enrollment-999')
    })

    it('creates new enrollment when existing is cancelled', async () => {
      // When the API finds a cancelled enrollment, it creates a new one
      const mockNewEnrollment: EnrollmentResponse = {
        id: 'new-enrollment-111',
        student_id: mockStudentId,
        branch_id: mockBranchId,
        program_name: mockProgramName,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        is_existing: false,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockNewEnrollment,
        }),
      } as Response)

      const result = await findOrCreateEnrollment(mockStudentId, mockBranchId, mockProgramName)

      expect(result.is_existing).toBe(false)
      expect(result.id).toBe('new-enrollment-111')
      expect(result.status).toBe('active')
    })

    it('throws error when API returns non-ok response', async () => {
      const errorMessage = 'Invalid student_id or branch_id'

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { message: errorMessage },
        }),
      } as Response)

      await expect(
        findOrCreateEnrollment(mockStudentId, mockBranchId, mockProgramName)
      ).rejects.toThrow(errorMessage)
    })

    it('throws error when API returns error without structured error object', async () => {
      const errorMessage = 'Failed to create enrollment'

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: errorMessage,
        }),
      } as Response)

      await expect(
        findOrCreateEnrollment(mockStudentId, mockBranchId, mockProgramName)
      ).rejects.toThrow(errorMessage)
    })

    it('throws default error when API returns no error message', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response)

      await expect(
        findOrCreateEnrollment(mockStudentId, mockBranchId, mockProgramName)
      ).rejects.toThrow('Failed to create enrollment')
    })

    it('handles different program names correctly', async () => {
      const programNames = [
        'Bachelor of Computer Science',
        'Master of Business Administration',
        'PhD in Engineering',
        'Diploma in Data Science',
      ]

      for (const programName of programNames) {
        const mockEnrollment: EnrollmentResponse = {
          id: `enrollment-${programName}`,
          student_id: mockStudentId,
          branch_id: mockBranchId,
          program_name: programName,
          offer_letter_url: null,
          offer_letter_filename: null,
          status: 'active',
          created_at: '2024-01-15T12:00:00Z',
          updated_at: '2024-01-15T12:00:00Z',
          is_existing: false,
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockEnrollment,
          }),
        } as Response)

        const result = await findOrCreateEnrollment(mockStudentId, mockBranchId, programName)
        expect(result.program_name).toBe(programName)
      }
    })
  })

  describe('uploadOfferLetter', () => {
    const mockEnrollmentId = 'enrollment-789'
    const mockFile = new File(['test content'], 'offer-letter.pdf', { type: 'application/pdf' })

    it('uploads offer letter successfully', async () => {
      const mockUpdatedEnrollment: EnrollmentResponse = {
        id: mockEnrollmentId,
        student_id: 'student-123',
        branch_id: 'branch-456',
        program_name: 'Bachelor of Computer Science',
        offer_letter_url: 'https://storage.example.com/offer-letter.pdf',
        offer_letter_filename: 'offer-letter.pdf',
        status: 'active',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:05:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUpdatedEnrollment,
        }),
      } as Response)

      const result = await uploadOfferLetter(mockEnrollmentId, mockFile)

      expect(fetch).toHaveBeenCalledWith(
        `/api/enrollments/${mockEnrollmentId}/offer-letter`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      )

      expect(result).toEqual(mockUpdatedEnrollment)
      expect(result.offer_letter_url).toBe('https://storage.example.com/offer-letter.pdf')
      expect(result.offer_letter_filename).toBe('offer-letter.pdf')
    })

    it('throws error when upload fails', async () => {
      const errorMessage = 'File too large. Maximum size is 10MB'

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { message: errorMessage },
        }),
      } as Response)

      await expect(uploadOfferLetter(mockEnrollmentId, mockFile)).rejects.toThrow(errorMessage)
    })

    it('throws default error when upload fails without error message', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response)

      await expect(uploadOfferLetter(mockEnrollmentId, mockFile)).rejects.toThrow(
        'Failed to upload offer letter'
      )
    })

    it('handles different file types', async () => {
      const fileTypes = [
        { name: 'offer.pdf', type: 'application/pdf' },
        { name: 'offer.jpg', type: 'image/jpeg' },
        { name: 'offer.png', type: 'image/png' },
      ]

      for (const fileType of fileTypes) {
        const file = new File(['content'], fileType.name, { type: fileType.type })
        const mockUpdatedEnrollment: EnrollmentResponse = {
          id: mockEnrollmentId,
          student_id: 'student-123',
          branch_id: 'branch-456',
          program_name: 'Bachelor of Computer Science',
          offer_letter_url: `https://storage.example.com/${fileType.name}`,
          offer_letter_filename: fileType.name,
          status: 'active',
          created_at: '2024-01-15T12:00:00Z',
          updated_at: '2024-01-15T12:05:00Z',
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockUpdatedEnrollment,
          }),
        } as Response)

        const result = await uploadOfferLetter(mockEnrollmentId, file)
        expect(result.offer_letter_filename).toBe(fileType.name)
      }
    })
  })

  describe('createEnrollmentWithOfferLetter', () => {
    const mockStudentId = 'student-123'
    const mockBranchId = 'branch-456'
    const mockProgramName = 'Bachelor of Computer Science'
    const mockFile = new File(['test content'], 'offer-letter.pdf', { type: 'application/pdf' })

    it('creates enrollment and uploads offer letter', async () => {
      const mockEnrollment: EnrollmentResponse = {
        id: 'enrollment-789',
        student_id: mockStudentId,
        branch_id: mockBranchId,
        program_name: mockProgramName,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      }

      const mockUpdatedEnrollment: EnrollmentResponse = {
        ...mockEnrollment,
        offer_letter_url: 'https://storage.example.com/offer-letter.pdf',
        offer_letter_filename: 'offer-letter.pdf',
        updated_at: '2024-01-15T12:05:00Z',
      }

      // Mock enrollment creation
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockEnrollment,
        }),
      } as Response)

      // Mock offer letter upload
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUpdatedEnrollment,
        }),
      } as Response)

      const result = await createEnrollmentWithOfferLetter(
        mockStudentId,
        mockBranchId,
        mockProgramName,
        mockFile
      )

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockUpdatedEnrollment)
      expect(result.offer_letter_url).toBe('https://storage.example.com/offer-letter.pdf')
    })

    it('creates enrollment without offer letter when file is not provided', async () => {
      const mockEnrollment: EnrollmentResponse = {
        id: 'enrollment-789',
        student_id: mockStudentId,
        branch_id: mockBranchId,
        program_name: mockProgramName,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockEnrollment,
        }),
      } as Response)

      const result = await createEnrollmentWithOfferLetter(
        mockStudentId,
        mockBranchId,
        mockProgramName
      )

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockEnrollment)
      expect(result.offer_letter_url).toBeNull()
    })

    it('reuses existing enrollment and uploads offer letter', async () => {
      const mockExistingEnrollment: EnrollmentResponse = {
        id: 'existing-enrollment-999',
        student_id: mockStudentId,
        branch_id: mockBranchId,
        program_name: mockProgramName,
        offer_letter_url: 'https://storage.example.com/old-offer.pdf',
        offer_letter_filename: 'old-offer.pdf',
        status: 'active',
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:00:00Z',
        is_existing: true,
      }

      const mockUpdatedEnrollment: EnrollmentResponse = {
        ...mockExistingEnrollment,
        offer_letter_url: 'https://storage.example.com/new-offer.pdf',
        offer_letter_filename: 'new-offer.pdf',
        updated_at: '2024-01-15T12:05:00Z',
      }

      // Mock finding existing enrollment
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockExistingEnrollment,
        }),
      } as Response)

      // Mock offer letter upload (replaces old file)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUpdatedEnrollment,
        }),
      } as Response)

      const result = await createEnrollmentWithOfferLetter(
        mockStudentId,
        mockBranchId,
        mockProgramName,
        mockFile
      )

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(result.offer_letter_filename).toBe('new-offer.pdf')
    })

    it('throws error when enrollment creation fails', async () => {
      const errorMessage = 'Invalid branch_id'

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { message: errorMessage },
        }),
      } as Response)

      await expect(
        createEnrollmentWithOfferLetter(mockStudentId, mockBranchId, mockProgramName, mockFile)
      ).rejects.toThrow(errorMessage)
    })

    it('throws error when offer letter upload fails', async () => {
      const mockEnrollment: EnrollmentResponse = {
        id: 'enrollment-789',
        student_id: mockStudentId,
        branch_id: mockBranchId,
        program_name: mockProgramName,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      }

      const uploadError = 'File upload failed'

      // Mock successful enrollment creation
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockEnrollment,
        }),
      } as Response)

      // Mock failed offer letter upload
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { message: uploadError },
        }),
      } as Response)

      await expect(
        createEnrollmentWithOfferLetter(mockStudentId, mockBranchId, mockProgramName, mockFile)
      ).rejects.toThrow(uploadError)
    })
  })

  describe('Duplicate Enrollment Scenarios', () => {
    const mockStudentId = 'student-123'
    const mockBranchId = 'branch-456'
    const mockProgramName = 'Bachelor of Computer Science'

    it('handles multiple payment plans for same enrollment', async () => {
      // First payment plan creates enrollment
      const mockEnrollment: EnrollmentResponse = {
        id: 'enrollment-789',
        student_id: mockStudentId,
        branch_id: mockBranchId,
        program_name: mockProgramName,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        is_existing: false,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockEnrollment,
        }),
      } as Response)

      const result1 = await findOrCreateEnrollment(mockStudentId, mockBranchId, mockProgramName)
      expect(result1.is_existing).toBe(false)
      expect(result1.id).toBe('enrollment-789')

      // Second payment plan reuses existing enrollment
      const mockExistingEnrollment: EnrollmentResponse = {
        ...mockEnrollment,
        is_existing: true,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockExistingEnrollment,
        }),
      } as Response)

      const result2 = await findOrCreateEnrollment(mockStudentId, mockBranchId, mockProgramName)
      expect(result2.is_existing).toBe(true)
      expect(result2.id).toBe('enrollment-789')
    })

    it('allows different programs for same student-branch', async () => {
      const program1 = 'Bachelor of Computer Science'
      const program2 = 'Master of Business Administration'

      // Create enrollment for first program
      const mockEnrollment1: EnrollmentResponse = {
        id: 'enrollment-111',
        student_id: mockStudentId,
        branch_id: mockBranchId,
        program_name: program1,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        is_existing: false,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockEnrollment1,
        }),
      } as Response)

      const result1 = await findOrCreateEnrollment(mockStudentId, mockBranchId, program1)
      expect(result1.id).toBe('enrollment-111')
      expect(result1.program_name).toBe(program1)

      // Create enrollment for second program (different enrollment)
      const mockEnrollment2: EnrollmentResponse = {
        id: 'enrollment-222',
        student_id: mockStudentId,
        branch_id: mockBranchId,
        program_name: program2,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        is_existing: false,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockEnrollment2,
        }),
      } as Response)

      const result2 = await findOrCreateEnrollment(mockStudentId, mockBranchId, program2)
      expect(result2.id).toBe('enrollment-222')
      expect(result2.program_name).toBe(program2)
      expect(result2.id).not.toBe(result1.id)
    })
  })
})
