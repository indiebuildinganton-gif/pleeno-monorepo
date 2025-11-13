/**
 * Enrollments API Route Tests
 *
 * Integration tests for the POST /api/enrollments endpoint
 * with focus on duplicate enrollment handling logic
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 10: Duplicate Enrollment Handling Logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST, GET } from '../route'

// Mock Supabase client methods
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()

// Mock createServerClient
vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

// Mock requireRole
vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(),
}))

// Mock logActivity
vi.mock('@pleeno/database', () => ({
  logActivity: vi.fn(),
}))

// Import mocked functions
import { requireRole } from '@pleeno/auth'
import { logActivity } from '@pleeno/database'

describe('POST /api/enrollments - Duplicate Enrollment Handling', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@agency.com',
    app_metadata: {
      role: 'agency_admin',
      agency_id: 'agency-123',
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-15T12:00:00Z',
    role: 'authenticated',
    updated_at: '2024-01-15T12:00:00Z',
  }

  const mockEnrollmentData = {
    student_id: '550e8400-e29b-41d4-a716-446655440001',
    branch_id: '550e8400-e29b-41d4-a716-446655440002',
    program_name: 'Bachelor of Computer Science',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: Mock successful authentication
    vi.mocked(requireRole).mockResolvedValue({
      user: mockUser,
      role: 'agency_admin',
    })

    // Default: Mock logActivity to not do anything
    vi.mocked(logActivity).mockResolvedValue()
  })

  describe('Duplicate Enrollment Detection', () => {
    it('creates new enrollment when none exists', async () => {
      // Mock: No existing enrollment found
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      // Mock: Successful enrollment creation
      const mockNewEnrollment = {
        id: 'enrollment-new-123',
        agency_id: 'agency-123',
        student_id: mockEnrollmentData.student_id,
        branch_id: mockEnrollmentData.branch_id,
        program_name: mockEnrollmentData.program_name,
        status: 'active',
        offer_letter_url: null,
        offer_letter_filename: null,
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      }

      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      })
      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNewEnrollment,
          error: null,
        }),
      })

      // Mock: Fetch enrollment details for activity logging
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            student: { full_name: 'John Doe' },
            branch: { college: { name: 'University of Example' } },
          },
          error: null,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify(mockEnrollmentData),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.is_existing).toBe(false)
      expect(data.data.id).toBe('enrollment-new-123')
      expect(data.data.status).toBe('active')
    })

    it('reuses existing active enrollment (duplicate detection)', async () => {
      const mockExistingEnrollment = {
        id: 'enrollment-existing-999',
        agency_id: 'agency-123',
        student_id: mockEnrollmentData.student_id,
        branch_id: mockEnrollmentData.branch_id,
        program_name: mockEnrollmentData.program_name,
        status: 'active',
        offer_letter_url: 'https://storage.example.com/offer.pdf',
        offer_letter_filename: 'offer.pdf',
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:00:00Z',
      }

      // Mock: Existing active enrollment found
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockExistingEnrollment,
          error: null,
        }),
      })

      // Mock: Audit log insert for reuse action
      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify(mockEnrollmentData),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.is_existing).toBe(true)
      expect(data.data.id).toBe('enrollment-existing-999')
      expect(data.data.status).toBe('active')
      expect(data.data.offer_letter_url).toBe('https://storage.example.com/offer.pdf')

      // Verify no new enrollment was created (insert not called)
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('creates new enrollment when existing is cancelled', async () => {
      // Mock: Existing cancelled enrollment found (not reused)
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null, // API only returns active enrollments in duplicate check
          error: null,
        }),
      })

      // Mock: New enrollment creation
      const mockNewEnrollment = {
        id: 'enrollment-new-after-cancel-555',
        agency_id: 'agency-123',
        student_id: mockEnrollmentData.student_id,
        branch_id: mockEnrollmentData.branch_id,
        program_name: mockEnrollmentData.program_name,
        status: 'active',
        offer_letter_url: null,
        offer_letter_filename: null,
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      }

      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      })
      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNewEnrollment,
          error: null,
        }),
      })

      // Mock: Fetch enrollment details for activity logging
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            student: { full_name: 'Jane Smith' },
            branch: { college: { name: 'Tech University' } },
          },
          error: null,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify(mockEnrollmentData),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.is_existing).toBe(false)
      expect(data.data.status).toBe('active')
      expect(data.data.id).toBe('enrollment-new-after-cancel-555')
    })

    it('creates separate enrollments for different programs', async () => {
      const program1 = 'Bachelor of Computer Science'
      const program2 = 'Master of Business Administration'

      // First enrollment - no existing
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      const mockEnrollment1 = {
        id: 'enrollment-program1-111',
        agency_id: 'agency-123',
        student_id: mockEnrollmentData.student_id,
        branch_id: mockEnrollmentData.branch_id,
        program_name: program1,
        status: 'active',
        offer_letter_url: null,
        offer_letter_filename: null,
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      }

      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      })
      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockEnrollment1,
          error: null,
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            student: { full_name: 'Student Name' },
            branch: { college: { name: 'College Name' } },
          },
          error: null,
        }),
      })

      const request1 = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify({
          ...mockEnrollmentData,
          program_name: program1,
        }),
      })

      const response1 = await POST(request1)
      const data1 = await response1.json()

      expect(data1.data.id).toBe('enrollment-program1-111')
      expect(data1.data.program_name).toBe(program1)
      expect(data1.is_existing).toBe(false)

      // Second enrollment - different program, should create new
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null, // No existing for program2
          error: null,
        }),
      })

      const mockEnrollment2 = {
        id: 'enrollment-program2-222',
        agency_id: 'agency-123',
        student_id: mockEnrollmentData.student_id,
        branch_id: mockEnrollmentData.branch_id,
        program_name: program2,
        status: 'active',
        offer_letter_url: null,
        offer_letter_filename: null,
        created_at: '2024-01-15T12:05:00Z',
        updated_at: '2024-01-15T12:05:00Z',
      }

      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      })
      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockEnrollment2,
          error: null,
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            student: { full_name: 'Student Name' },
            branch: { college: { name: 'College Name' } },
          },
          error: null,
        }),
      })

      const request2 = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify({
          ...mockEnrollmentData,
          program_name: program2,
        }),
      })

      const response2 = await POST(request2)
      const data2 = await response2.json()

      expect(data2.data.id).toBe('enrollment-program2-222')
      expect(data2.data.program_name).toBe(program2)
      expect(data2.is_existing).toBe(false)
    })
  })

  describe('Multiple Payment Plans Support', () => {
    it('allows multiple payment plans to link to same enrollment', async () => {
      const mockExistingEnrollment = {
        id: 'enrollment-shared-777',
        agency_id: 'agency-123',
        student_id: mockEnrollmentData.student_id,
        branch_id: mockEnrollmentData.branch_id,
        program_name: mockEnrollmentData.program_name,
        status: 'active',
        offer_letter_url: null,
        offer_letter_filename: null,
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:00:00Z',
      }

      // First payment plan creation - creates enrollment
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      })
      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockExistingEnrollment,
          error: null,
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            student: { full_name: 'Test Student' },
            branch: { college: { name: 'Test College' } },
          },
          error: null,
        }),
      })

      const request1 = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify(mockEnrollmentData),
      })

      const response1 = await POST(request1)
      const data1 = await response1.json()
      expect(data1.data.id).toBe('enrollment-shared-777')
      expect(data1.is_existing).toBe(false)

      // Second payment plan creation - reuses same enrollment
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockExistingEnrollment,
          error: null,
        }),
      })

      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      const request2 = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify(mockEnrollmentData),
      })

      const response2 = await POST(request2)
      const data2 = await response2.json()
      expect(data2.data.id).toBe('enrollment-shared-777')
      expect(data2.is_existing).toBe(true)
    })
  })

  describe('Validation and Error Handling', () => {
    it('returns 400 for invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify({
          student_id: '550e8400-e29b-41d4-a716-446655440001',
          // Missing required branch_id and program_name
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.type).toBe('validation_error')
    })

    it('returns 400 for invalid student_id (foreign key violation)', async () => {
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      })
      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: '23503',
            message: 'Foreign key violation',
          },
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify({
          student_id: '550e8400-e29b-41d4-a716-999999999999', // Valid UUID but doesn't exist
          branch_id: mockEnrollmentData.branch_id,
          program_name: mockEnrollmentData.program_name,
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Invalid student_id or branch_id')
    })

    it('returns 401 for unauthenticated users', async () => {
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify(mockEnrollmentData),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 403 for users without agency_id', async () => {
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          ...mockUser,
          app_metadata: {
            role: 'agency_admin',
            // Missing agency_id
          },
        },
        role: 'agency_admin',
      })

      const request = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify(mockEnrollmentData),
      })

      const response = await POST(request)
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('not associated with an agency')
    })
  })

  describe('Audit Logging', () => {
    it('logs audit trail for new enrollment creation', async () => {
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      const mockNewEnrollment = {
        id: 'enrollment-audit-123',
        agency_id: 'agency-123',
        student_id: mockEnrollmentData.student_id,
        branch_id: mockEnrollmentData.branch_id,
        program_name: mockEnrollmentData.program_name,
        status: 'active',
        offer_letter_url: null,
        offer_letter_filename: null,
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      }

      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      })
      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNewEnrollment,
          error: null,
        }),
      })

      // Mock audit log insert
      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            student: { full_name: 'Audit Test' },
            branch: { college: { name: 'Audit College' } },
          },
          error: null,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify(mockEnrollmentData),
      })

      await POST(request)

      // Verify logActivity was called for activity feed
      expect(logActivity).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          agencyId: 'agency-123',
          userId: 'user-123',
          entityType: 'enrollment',
          entityId: 'enrollment-audit-123',
          action: 'created',
        })
      )
    })

    it('logs audit trail for enrollment reuse', async () => {
      const mockExistingEnrollment = {
        id: 'enrollment-reuse-audit-456',
        agency_id: 'agency-123',
        student_id: mockEnrollmentData.student_id,
        branch_id: mockEnrollmentData.branch_id,
        program_name: mockEnrollmentData.program_name,
        status: 'active',
        offer_letter_url: null,
        offer_letter_filename: null,
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:00:00Z',
      }

      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockExistingEnrollment,
          error: null,
        }),
      })

      // Mock audit log insert for reuse
      const mockAuditInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })
      mockFrom.mockReturnValueOnce({
        insert: mockAuditInsert,
      })

      const request = new NextRequest('http://localhost:3000/api/enrollments', {
        method: 'POST',
        body: JSON.stringify(mockEnrollmentData),
      })

      await POST(request)

      // Verify audit log was created for reuse action
      expect(mockAuditInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'enrollment',
          entity_id: 'enrollment-reuse-audit-456',
          user_id: 'user-123',
          action: 'reuse',
        })
      )
    })
  })
})

describe('GET /api/enrollments', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@agency.com',
    app_metadata: {
      role: 'agency_admin',
      agency_id: 'agency-123',
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-15T12:00:00Z',
    role: 'authenticated',
    updated_at: '2024-01-15T12:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(requireRole).mockResolvedValue({
      user: mockUser,
      role: 'agency_admin',
    })
  })

  it('returns list of enrollments for authenticated user', async () => {
    const mockEnrollments = [
      {
        id: 'enrollment-1',
        student: { first_name: 'John', last_name: 'Doe' },
        college: { name: 'University A' },
        branch: { name: 'Main Campus', program_name: 'CS', commission_rate_percent: 15 },
      },
      {
        id: 'enrollment-2',
        student: { first_name: 'Jane', last_name: 'Smith' },
        college: { name: 'University B' },
        branch: { name: 'City Campus', program_name: 'MBA', commission_rate_percent: 20 },
      },
    ]

    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockEnrollments,
        error: null,
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/enrollments', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].id).toBe('enrollment-1')
  })

  it('returns 401 for unauthenticated users', async () => {
    vi.mocked(requireRole).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )

    const request = new NextRequest('http://localhost:3000/api/enrollments', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})
