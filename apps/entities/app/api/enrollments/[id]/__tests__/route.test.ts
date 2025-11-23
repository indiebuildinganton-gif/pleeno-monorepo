/**
 * Enrollment Detail API Route Tests
 *
 * Integration tests for GET /api/enrollments/[id] and PATCH /api/enrollments/[id] endpoints
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 12: Testing (Final Task)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET, PATCH } from '../route'

// Mock Supabase client methods
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

// Mock createServerClient
vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

// Mock logAudit
vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual('@pleeno/utils')
  return {
    ...actual,
    logAudit: vi.fn(),
  }
})

// Import mocked functions
import { createServerClient } from '@pleeno/database/server'
import { logAudit } from '@pleeno/database'

describe('GET /api/enrollments/[id]', () => {
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

  const mockEnrollment = {
    id: 'enrollment-789',
    program_name: 'Bachelor of Computer Science',
    status: 'active',
    offer_letter_url: 'https://storage.example.com/offer.pdf',
    offer_letter_filename: 'offer.pdf',
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
    student: {
      id: 'student-123',
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      passport_number: 'AB123456',
    },
    branch: {
      id: 'branch-456',
      name: 'Main Campus',
      city: 'Toronto',
      commission_rate_percent: 15,
      college: {
        id: 'college-789',
        name: 'University of Toronto',
        city: 'Toronto',
        country: 'Canada',
      },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: Mock successful authentication
    const mockSupabase = vi.mocked(createServerClient)()
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('returns enrollment detail with student and branch/college data', async () => {
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })
    mockSingle.mockResolvedValue({
      data: mockEnrollment,
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('enrollment-789')
    expect(data.data.student.full_name).toBe('John Doe')
    expect(data.data.branch.college.name).toBe('University of Toronto')
  })

  it('returns 404 when enrollment not found', async () => {
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new NextRequest(
      'http://localhost:3000/api/enrollments/nonexistent-enrollment',
      {
        method: 'GET',
      }
    )

    const response = await GET(request, {
      params: Promise.resolve({ id: 'nonexistent-enrollment' }),
    })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Enrollment not found')
  })

  it('enforces RLS - returns 404 for different agency enrollment', async () => {
    // RLS will not return the enrollment if agency_id doesn't match
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })
    mockSingle.mockResolvedValue({
      data: null,
      error: null,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/enrollments/other-agency-enrollment',
      {
        method: 'GET',
      }
    )

    const response = await GET(request, {
      params: Promise.resolve({ id: 'other-agency-enrollment' }),
    })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('returns 401 for unauthenticated users', async () => {
    const mockSupabase = vi.mocked(createServerClient)()
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: { name: 'AuthError', message: 'Not authenticated' },
    })

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Not authenticated')
  })

  it('returns 403 for users without agency_id', async () => {
    const userWithoutAgency = {
      ...mockUser,
      app_metadata: {
        role: 'agency_admin',
        // Missing agency_id
      },
    }

    const mockSupabase = vi.mocked(createServerClient)()
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: userWithoutAgency },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(403)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('not associated with an agency')
  })
})

describe('PATCH /api/enrollments/[id]', () => {
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

  const mockExistingEnrollment = {
    id: 'enrollment-789',
    agency_id: 'agency-123',
    student_id: 'student-123',
    branch_id: 'branch-456',
    program_name: 'Bachelor of Computer Science',
    status: 'active',
    offer_letter_url: 'https://storage.example.com/offer.pdf',
    offer_letter_filename: 'offer.pdf',
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: Mock successful authentication
    const mockSupabase = vi.mocked(createServerClient)()
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock logAudit to not do anything
    vi.mocked(logAudit).mockResolvedValue()
  })

  it('updates enrollment status successfully', async () => {
    // Mock fetch existing enrollment
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })
    mockSingle.mockResolvedValue({
      data: mockExistingEnrollment,
      error: null,
    })

    // Mock update operation
    const updatedEnrollment = {
      ...mockExistingEnrollment,
      status: 'completed',
      updated_at: '2024-01-15T14:00:00Z',
    }

    mockFrom.mockReturnValueOnce({
      update: mockUpdate,
    })
    mockUpdate.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: updatedEnrollment,
        error: null,
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('completed')

    // Verify audit log was called
    expect(logAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'user-123',
        agencyId: 'agency-123',
        entityType: 'enrollment',
        entityId: 'enrollment-789',
        action: 'update',
        oldValues: { status: 'active' },
        newValues: { status: 'completed' },
      })
    )
  })

  it('allows status change from active to cancelled', async () => {
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })
    mockSingle.mockResolvedValue({
      data: mockExistingEnrollment,
      error: null,
    })

    const updatedEnrollment = {
      ...mockExistingEnrollment,
      status: 'cancelled',
    }

    mockFrom.mockReturnValueOnce({
      update: mockUpdate,
    })
    mockUpdate.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: updatedEnrollment,
        error: null,
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('cancelled')
  })

  it('allows status change from cancelled to active (re-enrollment)', async () => {
    const cancelledEnrollment = {
      ...mockExistingEnrollment,
      status: 'cancelled',
    }

    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })
    mockSingle.mockResolvedValue({
      data: cancelledEnrollment,
      error: null,
    })

    const reactivatedEnrollment = {
      ...cancelledEnrollment,
      status: 'active',
    }

    mockFrom.mockReturnValueOnce({
      update: mockUpdate,
    })
    mockUpdate.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: reactivatedEnrollment,
        error: null,
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('active')
  })

  it('returns 400 for invalid status value', async () => {
    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'invalid_status' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('validation_error')
  })

  it('returns 400 for missing status field', async () => {
    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('validation_error')
  })

  it('returns 404 when enrollment not found', async () => {
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new NextRequest(
      'http://localhost:3000/api/enrollments/nonexistent-enrollment',
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      }
    )

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'nonexistent-enrollment' }),
    })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Enrollment not found')
  })

  it('enforces RLS - prevents updating different agency enrollment', async () => {
    // RLS will not allow fetching enrollment from different agency
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })
    mockSingle.mockResolvedValue({
      data: null,
      error: null,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/enrollments/other-agency-enrollment',
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      }
    )

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'other-agency-enrollment' }),
    })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('returns 401 for unauthenticated users', async () => {
    const mockSupabase = vi.mocked(createServerClient)()
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: { name: 'AuthError', message: 'Not authenticated' },
    })

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Not authenticated')
  })

  it('returns 403 for users without agency_id', async () => {
    const userWithoutAgency = {
      ...mockUser,
      app_metadata: {
        role: 'agency_admin',
        // Missing agency_id
      },
    }

    const mockSupabase = vi.mocked(createServerClient)()
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: userWithoutAgency },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(403)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('not associated with an agency')
  })
})
