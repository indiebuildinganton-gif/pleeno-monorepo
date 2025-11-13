/**
 * Payment Plan API Integration Tests
 *
 * Tests for the POST and GET /api/payment-plans endpoints
 * Epic 4: Payments Domain
 * Story 4.1: Payment Plan Creation
 * Task 10: Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@payments/app/api/payment-plans/route'
import { GET } from '@payments/app/api/payment-plans/[id]/route'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()
const mockRpc = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

// Mock auth utility
vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(async (request, roles) => {
    const mockUser = {
      id: 'user-123',
      email: 'test@agency.com',
      app_metadata: {
        agency_id: 'agency-1',
      },
    }
    return { user: mockUser }
  }),
}))

// Mock audit logging
vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual('@pleeno/utils')
  return {
    ...actual,
    logAudit: vi.fn(async () => {}),
  }
})

describe('POST /api/payment-plans', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock setup
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      select: mockSelect,
    })

    mockInsert.mockReturnValue({
      select: mockSelect,
    })

    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  it('creates payment plan successfully with valid data', async () => {
    const testEnrollment = {
      id: 'enrollment-123',
      agency_id: 'agency-1',
      program_name: 'Bachelor of Computer Science',
      student: {
        first_name: 'John',
        last_name: 'Doe',
      },
      branch: {
        commission_rate_percent: 15,
        city: 'Sydney',
        college: {
          name: 'University of Sydney',
        },
      },
    }

    const createdPaymentPlan = {
      id: 'payment-plan-123',
      enrollment_id: 'enrollment-123',
      agency_id: 'agency-1',
      total_amount: 10000,
      currency: 'AUD',
      start_date: '2025-01-01',
      commission_rate_percent: 15,
      expected_commission: 1500.0,
      status: 'active',
      notes: 'Test payment plan',
      reference_number: 'INV-001',
      created_at: '2025-01-13T00:00:00Z',
      updated_at: '2025-01-13T00:00:00Z',
    }

    // Mock enrollment lookup
    mockSingle.mockResolvedValueOnce({
      data: testEnrollment,
      error: null,
    })

    // Mock payment plan creation
    mockSingle.mockResolvedValueOnce({
      data: createdPaymentPlan,
      error: null,
    })

    const request = new Request('http://localhost/api/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: 'enrollment-123',
        total_amount: 10000,
        start_date: '2025-01-01',
        notes: 'Test payment plan',
        reference_number: 'INV-001',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.total_amount).toBe(10000)
    expect(data.data.expected_commission).toBe(1500.0)
    expect(data.data.commission_rate_percent).toBe(15)
    expect(data.data.status).toBe('active')
  })

  it('validates total_amount must be greater than 0', async () => {
    const request = new Request('http://localhost/api/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: 'enrollment-123',
        total_amount: -1000,
        start_date: '2025-01-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('validates total_amount must be a number', async () => {
    const request = new Request('http://localhost/api/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: 'enrollment-123',
        total_amount: 'not-a-number',
        start_date: '2025-01-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('validates enrollment_id is required and must be a UUID', async () => {
    const request = new Request('http://localhost/api/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: 'invalid-uuid',
        total_amount: 10000,
        start_date: '2025-01-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('validates start_date is required and in correct format', async () => {
    const request = new Request('http://localhost/api/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: 'enrollment-123',
        total_amount: 10000,
        start_date: 'invalid-date',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('returns 400 if enrollment does not exist', async () => {
    // Mock enrollment lookup returns null
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request('http://localhost/api/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: 'non-existent-enrollment',
        total_amount: 10000,
        start_date: '2025-01-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Enrollment not found')
  })

  it('returns 400 if enrollment belongs to different agency (RLS)', async () => {
    const otherAgencyEnrollment = {
      id: 'enrollment-456',
      agency_id: 'other-agency-id',
      program_name: 'Bachelor of Computer Science',
      student: {
        first_name: 'Jane',
        last_name: 'Smith',
      },
      branch: {
        commission_rate_percent: 15,
        city: 'Melbourne',
        college: {
          name: 'University of Melbourne',
        },
      },
    }

    // Mock enrollment lookup returns enrollment from different agency
    mockSingle.mockResolvedValueOnce({
      data: otherAgencyEnrollment,
      error: null,
    })

    const request = new Request('http://localhost/api/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: 'enrollment-456',
        total_amount: 10000,
        start_date: '2025-01-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('does not belong to your agency')
  })

  it('auto-populates commission_rate from branch', async () => {
    const testEnrollment = {
      id: 'enrollment-123',
      agency_id: 'agency-1',
      program_name: 'Master of Business Administration',
      student: {
        first_name: 'Alice',
        last_name: 'Johnson',
      },
      branch: {
        commission_rate_percent: 20, // Different rate
        city: 'Brisbane',
        college: {
          name: 'University of Queensland',
        },
      },
    }

    const createdPaymentPlan = {
      id: 'payment-plan-456',
      enrollment_id: 'enrollment-123',
      agency_id: 'agency-1',
      total_amount: 5000,
      currency: 'AUD',
      start_date: '2025-02-01',
      commission_rate_percent: 20, // Auto-populated
      expected_commission: 1000.0, // 20% of 5000
      status: 'active',
      notes: null,
      reference_number: null,
      created_at: '2025-01-13T00:00:00Z',
      updated_at: '2025-01-13T00:00:00Z',
    }

    mockSingle.mockResolvedValueOnce({
      data: testEnrollment,
      error: null,
    })

    mockSingle.mockResolvedValueOnce({
      data: createdPaymentPlan,
      error: null,
    })

    const request = new Request('http://localhost/api/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: 'enrollment-123',
        total_amount: 5000,
        start_date: '2025-02-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.data.commission_rate_percent).toBe(20)
    expect(data.data.expected_commission).toBe(1000.0)
  })

  it('calculates commission correctly for various amounts and rates', async () => {
    const testCases = [
      { amount: 10000, rate: 15, expected: 1500.0 },
      { amount: 5000, rate: 20, expected: 1000.0 },
      { amount: 3500, rate: 10, expected: 350.0 },
      { amount: 12345.67, rate: 13.45, expected: 1660.49 },
    ]

    for (const testCase of testCases) {
      vi.clearAllMocks()

      const testEnrollment = {
        id: 'enrollment-123',
        agency_id: 'agency-1',
        program_name: 'Test Program',
        student: { first_name: 'Test', last_name: 'Student' },
        branch: {
          commission_rate_percent: testCase.rate,
          city: 'Sydney',
          college: { name: 'Test University' },
        },
      }

      const createdPaymentPlan = {
        id: 'payment-plan-test',
        enrollment_id: 'enrollment-123',
        agency_id: 'agency-1',
        total_amount: testCase.amount,
        currency: 'AUD',
        start_date: '2025-01-01',
        commission_rate_percent: testCase.rate,
        expected_commission: testCase.expected,
        status: 'active',
        notes: null,
        reference_number: null,
        created_at: '2025-01-13T00:00:00Z',
        updated_at: '2025-01-13T00:00:00Z',
      }

      mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle, eq: mockEq, select: mockSelect })
      mockInsert.mockReturnValue({ select: mockSelect })

      mockSingle.mockResolvedValueOnce({ data: testEnrollment, error: null })
      mockSingle.mockResolvedValueOnce({ data: createdPaymentPlan, error: null })

      const request = new Request('http://localhost/api/payment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: 'enrollment-123',
          total_amount: testCase.amount,
          start_date: '2025-01-01',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.expected_commission).toBe(testCase.expected)
    }
  })

  it('validates notes length (max 10,000 characters)', async () => {
    const longNotes = 'a'.repeat(10001)

    const request = new Request('http://localhost/api/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: 'enrollment-123',
        total_amount: 10000,
        start_date: '2025-01-01',
        notes: longNotes,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('validates reference_number length (max 255 characters)', async () => {
    const longReference = 'a'.repeat(256)

    const request = new Request('http://localhost/api/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: 'enrollment-123',
        total_amount: 10000,
        start_date: '2025-01-01',
        reference_number: longReference,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('returns 400 if branch commission rate is not configured', async () => {
    const testEnrollment = {
      id: 'enrollment-123',
      agency_id: 'agency-1',
      program_name: 'Test Program',
      student: { first_name: 'Test', last_name: 'Student' },
      branch: {
        commission_rate_percent: null, // Not configured
        city: 'Sydney',
        college: { name: 'Test University' },
      },
    }

    mockSingle.mockResolvedValueOnce({
      data: testEnrollment,
      error: null,
    })

    const request = new Request('http://localhost/api/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: 'enrollment-123',
        total_amount: 10000,
        start_date: '2025-01-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('commission rate not configured')
  })

  it('returns 400 if branch commission rate is out of range', async () => {
    const testEnrollment = {
      id: 'enrollment-123',
      agency_id: 'agency-1',
      program_name: 'Test Program',
      student: { first_name: 'Test', last_name: 'Student' },
      branch: {
        commission_rate_percent: 150, // Invalid: > 100
        city: 'Sydney',
        college: { name: 'Test University' },
      },
    }

    mockSingle.mockResolvedValueOnce({
      data: testEnrollment,
      error: null,
    })

    const request = new Request('http://localhost/api/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: 'enrollment-123',
        total_amount: 10000,
        start_date: '2025-01-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('between 0 and 100')
  })
})

describe('GET /api/payment-plans/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@agency.com',
          app_metadata: {
            agency_id: 'agency-1',
          },
        },
      },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
    })
  })

  it('returns payment plan with enrollment details', async () => {
    const paymentPlan = {
      id: 'payment-plan-123',
      enrollment_id: 'enrollment-123',
      agency_id: 'agency-1',
      total_amount: 10000,
      currency: 'AUD',
      start_date: '2025-01-01',
      commission_rate_percent: 15,
      expected_commission: 1500.0,
      status: 'active',
      notes: 'Test payment plan',
      reference_number: 'INV-001',
      created_at: '2025-01-13T00:00:00Z',
      updated_at: '2025-01-13T00:00:00Z',
    }

    const enrollment = {
      id: 'enrollment-123',
      program_name: 'Bachelor of Computer Science',
      status: 'active',
      student: {
        id: 'student-123',
        full_name: 'John Doe',
      },
      branch: {
        id: 'branch-123',
        city: 'Sydney',
        commission_rate_percent: 15,
        college: {
          id: 'college-123',
          name: 'University of Sydney',
        },
      },
    }

    // First call for payment plan
    mockSingle.mockResolvedValueOnce({
      data: paymentPlan,
      error: null,
    })

    // Second call for enrollment
    mockSingle.mockResolvedValueOnce({
      data: enrollment,
      error: null,
    })

    const request = new Request('http://localhost/api/payment-plans/payment-plan-123')
    const response = await GET(request, {
      params: Promise.resolve({ id: 'payment-plan-123' }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('payment-plan-123')
    expect(data.data.enrollment).toBeDefined()
    expect(data.data.enrollment.student).toBeDefined()
    expect(data.data.enrollment.student.first_name).toBe('John')
    expect(data.data.enrollment.student.last_name).toBe('Doe')
    expect(data.data.enrollment.branch).toBeDefined()
    expect(data.data.enrollment.branch.college).toBeDefined()
    expect(data.data.enrollment.branch.college.name).toBe('University of Sydney')
  })

  it('returns 404 if payment plan not found', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request('http://localhost/api/payment-plans/non-existent')
    const response = await GET(request, {
      params: Promise.resolve({ id: 'non-existent' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('not found')
  })

  it('returns 404 if payment plan belongs to different agency (RLS)', async () => {
    // Payment plan from different agency should not be returned due to RLS
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request('http://localhost/api/payment-plans/other-agency-plan')
    const response = await GET(request, {
      params: Promise.resolve({ id: 'other-agency-plan' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('not found')
  })

  it('returns 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new Request('http://localhost/api/payment-plans/payment-plan-123')
    const response = await GET(request, {
      params: Promise.resolve({ id: 'payment-plan-123' }),
    })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Not authenticated')
  })

  it('returns 403 if user has no agency_id', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@agency.com',
          app_metadata: {}, // No agency_id
        },
      },
      error: null,
    })

    const request = new Request('http://localhost/api/payment-plans/payment-plan-123')
    const response = await GET(request, {
      params: Promise.resolve({ id: 'payment-plan-123' }),
    })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('not associated with an agency')
  })

  it('handles missing enrollment gracefully', async () => {
    const paymentPlan = {
      id: 'payment-plan-123',
      enrollment_id: 'enrollment-123',
      agency_id: 'agency-1',
      total_amount: 10000,
      currency: 'AUD',
      start_date: '2025-01-01',
      commission_rate_percent: 15,
      expected_commission: 1500.0,
      status: 'active',
      notes: 'Test payment plan',
      reference_number: 'INV-001',
      created_at: '2025-01-13T00:00:00Z',
      updated_at: '2025-01-13T00:00:00Z',
    }

    // First call for payment plan succeeds
    mockSingle.mockResolvedValueOnce({
      data: paymentPlan,
      error: null,
    })

    // Second call for enrollment fails
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Enrollment not found' },
    })

    const request = new Request('http://localhost/api/payment-plans/payment-plan-123')
    const response = await GET(request, {
      params: Promise.resolve({ id: 'payment-plan-123' }),
    })
    const data = await response.json()

    // Should still return payment plan with null enrollment
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('payment-plan-123')
    expect(data.data.enrollment).toBeNull()
  })
})
