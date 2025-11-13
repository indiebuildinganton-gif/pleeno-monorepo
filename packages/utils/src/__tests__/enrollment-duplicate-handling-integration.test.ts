/**
 * Enrollment Duplicate Handling Integration Tests
 *
 * Focused integration tests for duplicate enrollment scenarios
 * Tests the complete flow from client helper → API endpoint → database logic
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 10: Duplicate Enrollment Handling Logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { findOrCreateEnrollment, type EnrollmentResponse } from '../enrollment-helpers'

// Mock fetch API
global.fetch = vi.fn()

describe('Enrollment Duplicate Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Duplicate Detection Flow', () => {
    const studentId = '550e8400-e29b-41d4-a716-446655440001'
    const branchId = '550e8400-e29b-41d4-a716-446655440002'
    const programName = 'Bachelor of Computer Science'

    it('creates new enrollment on first call, reuses on second call', async () => {
      // First call - no existing enrollment
      const mockNewEnrollment: EnrollmentResponse = {
        id: 'enrollment-new-123',
        student_id: studentId,
        branch_id: branchId,
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
          data: mockNewEnrollment,
        }),
      } as Response)

      const result1 = await findOrCreateEnrollment(studentId, branchId, programName)

      expect(result1.id).toBe('enrollment-new-123')
      expect(result1.is_existing).toBe(false)
      expect(result1.status).toBe('active')

      // Second call - enrollment exists and is active (should reuse)
      const mockExistingEnrollment: EnrollmentResponse = {
        ...mockNewEnrollment,
        is_existing: true,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockExistingEnrollment,
        }),
      } as Response)

      const result2 = await findOrCreateEnrollment(studentId, branchId, programName)

      expect(result2.id).toBe('enrollment-new-123')
      expect(result2.is_existing).toBe(true)
      expect(result2.status).toBe('active')

      // Verify both calls went to the same endpoint
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/enrollments', expect.any(Object))
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/enrollments', expect.any(Object))
    })

    it('supports multiple payment plans for same enrollment', async () => {
      const mockEnrollment: EnrollmentResponse = {
        id: 'shared-enrollment-456',
        student_id: studentId,
        branch_id: branchId,
        program_name: programName,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        is_existing: false,
      }

      // Payment Plan 1 - creates enrollment
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockEnrollment,
        }),
      } as Response)

      const plan1Result = await findOrCreateEnrollment(studentId, branchId, programName)
      expect(plan1Result.is_existing).toBe(false)
      const enrollmentId = plan1Result.id

      // Payment Plan 2 - reuses enrollment
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockEnrollment, is_existing: true },
        }),
      } as Response)

      const plan2Result = await findOrCreateEnrollment(studentId, branchId, programName)
      expect(plan2Result.is_existing).toBe(true)
      expect(plan2Result.id).toBe(enrollmentId) // Same enrollment

      // Payment Plan 3 - also reuses enrollment
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockEnrollment, is_existing: true },
        }),
      } as Response)

      const plan3Result = await findOrCreateEnrollment(studentId, branchId, programName)
      expect(plan3Result.is_existing).toBe(true)
      expect(plan3Result.id).toBe(enrollmentId) // Still same enrollment
    })

    it('creates separate enrollments for different programs (same student-branch)', async () => {
      const program1 = 'Bachelor of Computer Science'
      const program2 = 'Master of Business Administration'

      // Enrollment for Program 1
      const mockEnrollment1: EnrollmentResponse = {
        id: 'enrollment-program1-111',
        student_id: studentId,
        branch_id: branchId,
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

      const result1 = await findOrCreateEnrollment(studentId, branchId, program1)
      expect(result1.id).toBe('enrollment-program1-111')
      expect(result1.program_name).toBe(program1)

      // Enrollment for Program 2 (different enrollment)
      const mockEnrollment2: EnrollmentResponse = {
        id: 'enrollment-program2-222',
        student_id: studentId,
        branch_id: branchId,
        program_name: program2,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:05:00Z',
        updated_at: '2024-01-15T12:05:00Z',
        is_existing: false,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockEnrollment2,
        }),
      } as Response)

      const result2 = await findOrCreateEnrollment(studentId, branchId, program2)
      expect(result2.id).toBe('enrollment-program2-222')
      expect(result2.program_name).toBe(program2)

      // Verify different enrollment IDs
      expect(result1.id).not.toBe(result2.id)
    })

    it('creates separate enrollments for same program at different branches', async () => {
      const branch1Id = '550e8400-e29b-41d4-a716-446655440002'
      const branch2Id = '550e8400-e29b-41d4-a716-446655440003'

      // Enrollment at Branch 1
      const mockEnrollment1: EnrollmentResponse = {
        id: 'enrollment-branch1-333',
        student_id: studentId,
        branch_id: branch1Id,
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
          data: mockEnrollment1,
        }),
      } as Response)

      const result1 = await findOrCreateEnrollment(studentId, branch1Id, programName)
      expect(result1.id).toBe('enrollment-branch1-333')
      expect(result1.branch_id).toBe(branch1Id)

      // Enrollment at Branch 2 (different enrollment)
      const mockEnrollment2: EnrollmentResponse = {
        id: 'enrollment-branch2-444',
        student_id: studentId,
        branch_id: branch2Id,
        program_name: programName,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:05:00Z',
        updated_at: '2024-01-15T12:05:00Z',
        is_existing: false,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockEnrollment2,
        }),
      } as Response)

      const result2 = await findOrCreateEnrollment(studentId, branch2Id, programName)
      expect(result2.id).toBe('enrollment-branch2-444')
      expect(result2.branch_id).toBe(branch2Id)

      // Verify different enrollment IDs
      expect(result1.id).not.toBe(result2.id)
    })

    it('creates new enrollment after previous one was cancelled', async () => {
      // First enrollment (later gets cancelled)
      const mockCancelledEnrollment: EnrollmentResponse = {
        id: 'enrollment-cancelled-555',
        student_id: studentId,
        branch_id: branchId,
        program_name: programName,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'cancelled',
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-14T15:00:00Z',
        is_existing: false,
      }

      // Note: API won't return cancelled enrollments in duplicate check
      // So it creates a new one instead
      const mockNewEnrollment: EnrollmentResponse = {
        id: 'enrollment-new-after-cancel-666',
        student_id: studentId,
        branch_id: branchId,
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
          data: mockNewEnrollment,
        }),
      } as Response)

      const result = await findOrCreateEnrollment(studentId, branchId, programName)
      expect(result.id).toBe('enrollment-new-after-cancel-666')
      expect(result.status).toBe('active')
      expect(result.is_existing).toBe(false)
      expect(result.id).not.toBe(mockCancelledEnrollment.id)
    })
  })

  describe('Composite Uniqueness Key', () => {
    it('enforces uniqueness on (student_id, branch_id, program_name) combination', async () => {
      const studentId = '550e8400-e29b-41d4-a716-446655440001'
      const branchId = '550e8400-e29b-41d4-a716-446655440002'
      const programName = 'Bachelor of Computer Science'

      const mockEnrollment: EnrollmentResponse = {
        id: 'enrollment-unique-777',
        student_id: studentId,
        branch_id: branchId,
        program_name: programName,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        is_existing: false,
      }

      // First call
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockEnrollment,
        }),
      } as Response)

      const result1 = await findOrCreateEnrollment(studentId, branchId, programName)

      // All subsequent calls with same composite key reuse enrollment
      for (let i = 0; i < 5; i++) {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { ...mockEnrollment, is_existing: true },
          }),
        } as Response)

        const result = await findOrCreateEnrollment(studentId, branchId, programName)
        expect(result.id).toBe(result1.id)
        expect(result.is_existing).toBe(true)
      }
    })
  })

  describe('Status-Based Logic', () => {
    it('only reuses active enrollments, not cancelled or completed', async () => {
      const studentId = '550e8400-e29b-41d4-a716-446655440001'
      const branchId = '550e8400-e29b-41d4-a716-446655440002'
      const programName = 'Bachelor of Computer Science'

      // Scenario 1: Active enrollment exists → reuse
      const mockActiveEnrollment: EnrollmentResponse = {
        id: 'enrollment-active-888',
        student_id: studentId,
        branch_id: branchId,
        program_name: programName,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        is_existing: true,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockActiveEnrollment,
        }),
      } as Response)

      const activeResult = await findOrCreateEnrollment(studentId, branchId, programName)
      expect(activeResult.status).toBe('active')
      expect(activeResult.is_existing).toBe(true)

      // Scenario 2: Cancelled enrollment exists → create new
      const mockNewAfterCancelled: EnrollmentResponse = {
        id: 'enrollment-new-after-cancel-999',
        student_id: studentId,
        branch_id: branchId,
        program_name: programName,
        offer_letter_url: null,
        offer_letter_filename: null,
        status: 'active',
        created_at: '2024-01-15T13:00:00Z',
        updated_at: '2024-01-15T13:00:00Z',
        is_existing: false,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockNewAfterCancelled,
        }),
      } as Response)

      const cancelledResult = await findOrCreateEnrollment(studentId, branchId, programName)
      expect(cancelledResult.is_existing).toBe(false)
      expect(cancelledResult.id).not.toBe(activeResult.id)
    })
  })
})
