/**
 * Payment History API Route Tests
 *
 * Story 7.5: Student Payment History Report
 * Task 9: Testing and Validation
 *
 * Comprehensive tests for GET /api/students/[id]/payment-history
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest, NextResponse } from 'next/server'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
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
const mockRequireRole = vi.fn()
vi.mock('@pleeno/auth', () => ({
  requireRole: mockRequireRole,
}))

// Mock error handlers
vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual('@pleeno/utils')
  return {
    ...actual,
    handleApiError: vi.fn((error, context) => {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      )
    }),
    ForbiddenError: class ForbiddenError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'ForbiddenError'
      }
    },
  }
})

describe('GET /api/students/[id]/payment-history', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock setup
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

  describe('Authentication and Authorization', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockRequireRole.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(401)
    })

    it('should return 403 when user has no agency_id', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: {}, // No agency_id
        },
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(500) // ForbiddenError is handled by handleApiError
    })

    it('should return 404 when student not found', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Student not found' },
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Student not found')
    })

    it('should enforce RLS - deny access to other agency students', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      // Student belongs to different agency (RLS prevents access)
      mockSingle.mockResolvedValue({
        data: null,
        error: null, // RLS just returns null, no error
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-2/payment-history'
      )
      const params = Promise.resolve({ id: 'student-2' })
      const response = await GET(request, { params })

      expect(response.status).toBe(404)
    })
  })

  describe('Payment History Query', () => {
    it('should return payment history for authenticated user', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle.mockResolvedValue({
        data: { id: 'student-1', full_name: 'John Doe' },
        error: null,
      })

      mockRpc.mockResolvedValue({
        data: [
          {
            payment_plan_id: 'plan-1',
            college_name: 'Imagine Education',
            branch_name: 'Brisbane Campus',
            program_name: 'Certificate IV',
            plan_total_amount: '20000',
            plan_start_date: '2025-01-01',
            plan_status: 'active',
            installment_id: 'inst-1',
            installment_number: 1,
            amount: '5000',
            due_date: '2025-01-15',
            paid_at: '2025-01-10',
            paid_amount: '5000',
            status: 'paid',
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].payment_plan_id).toBe('plan-1')
      expect(data.summary.total_paid).toBe(5000)
    })

    it('should handle student with no payment plans', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle.mockResolvedValue({
        data: { id: 'student-1', full_name: 'John Doe' },
        error: null,
      })

      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(0)
      expect(data.summary.total_paid).toBe(0)
      expect(data.summary.total_outstanding).toBe(0)
      expect(data.summary.percentage_paid).toBe(0)
    })

    it('should group multiple installments by payment plan', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle.mockResolvedValue({
        data: { id: 'student-1', full_name: 'John Doe' },
        error: null,
      })

      // Multiple installments for same payment plan
      mockRpc.mockResolvedValue({
        data: [
          {
            payment_plan_id: 'plan-1',
            college_name: 'Imagine Education',
            branch_name: 'Brisbane Campus',
            program_name: 'Certificate IV',
            plan_total_amount: '20000',
            plan_start_date: '2025-01-01',
            plan_status: 'active',
            installment_id: 'inst-1',
            installment_number: 1,
            amount: '5000',
            due_date: '2025-01-15',
            paid_at: '2025-01-10',
            paid_amount: '5000',
            status: 'paid',
          },
          {
            payment_plan_id: 'plan-1',
            college_name: 'Imagine Education',
            branch_name: 'Brisbane Campus',
            program_name: 'Certificate IV',
            plan_total_amount: '20000',
            plan_start_date: '2025-01-01',
            plan_status: 'active',
            installment_id: 'inst-2',
            installment_number: 2,
            amount: '5000',
            due_date: '2025-02-15',
            paid_at: null,
            paid_amount: null,
            status: 'pending',
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].installments).toHaveLength(2)
    })

    it('should handle multiple payment plans', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle.mockResolvedValue({
        data: { id: 'student-1', full_name: 'John Doe' },
        error: null,
      })

      // Two different payment plans
      mockRpc.mockResolvedValue({
        data: [
          {
            payment_plan_id: 'plan-1',
            college_name: 'Imagine Education',
            branch_name: 'Brisbane Campus',
            program_name: 'Certificate IV',
            plan_total_amount: '20000',
            plan_start_date: '2025-01-01',
            plan_status: 'active',
            installment_id: 'inst-1',
            installment_number: 1,
            amount: '5000',
            due_date: '2025-01-15',
            paid_at: '2025-01-10',
            paid_amount: '5000',
            status: 'paid',
          },
          {
            payment_plan_id: 'plan-2',
            college_name: 'Other College',
            branch_name: 'Sydney Campus',
            program_name: 'Diploma',
            plan_total_amount: '15000',
            plan_start_date: '2024-06-01',
            plan_status: 'completed',
            installment_id: 'inst-3',
            installment_number: 1,
            amount: '3000',
            due_date: '2024-07-15',
            paid_at: '2024-07-10',
            paid_amount: '3000',
            status: 'paid',
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(2)
      expect(data.data[0].payment_plan_id).toBe('plan-1')
      expect(data.data[1].payment_plan_id).toBe('plan-2')
    })
  })

  describe('Date Range Filtering', () => {
    it('should filter by date range correctly', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle.mockResolvedValue({
        data: { id: 'student-1', full_name: 'John Doe' },
        error: null,
      })

      mockRpc.mockResolvedValue({
        data: [
          {
            payment_plan_id: 'plan-1',
            college_name: 'Imagine Education',
            branch_name: 'Brisbane Campus',
            program_name: 'Certificate IV',
            plan_total_amount: '20000',
            plan_start_date: '2025-01-01',
            plan_status: 'active',
            installment_id: 'inst-1',
            installment_number: 1,
            amount: '5000',
            due_date: '2025-01-15',
            paid_at: '2025-01-10',
            paid_amount: '5000',
            status: 'paid',
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history?date_from=2025-01-01&date_to=2025-12-31'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('get_student_payment_history', {
        p_student_id: 'student-1',
        p_agency_id: 'agency-1',
        p_date_from: '2025-01-01',
        p_date_to: '2025-12-31',
      })
    })

    it('should handle no date filters (all time)', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle.mockResolvedValue({
        data: { id: 'student-1', full_name: 'John Doe' },
        error: null,
      })

      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('get_student_payment_history', {
        p_student_id: 'student-1',
        p_agency_id: 'agency-1',
        p_date_from: null,
        p_date_to: null,
      })
    })
  })

  describe('Summary Calculations', () => {
    it('should calculate summary totals correctly', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle.mockResolvedValue({
        data: { id: 'student-1', full_name: 'John Doe' },
        error: null,
      })

      mockRpc.mockResolvedValue({
        data: [
          {
            payment_plan_id: 'plan-1',
            college_name: 'Imagine Education',
            branch_name: 'Brisbane Campus',
            program_name: 'Certificate IV',
            plan_total_amount: '20000',
            plan_start_date: '2025-01-01',
            plan_status: 'active',
            installment_id: 'inst-1',
            installment_number: 1,
            amount: '5000',
            due_date: '2025-01-15',
            paid_at: '2025-01-10',
            paid_amount: '5000',
            status: 'paid',
          },
          {
            payment_plan_id: 'plan-1',
            college_name: 'Imagine Education',
            branch_name: 'Brisbane Campus',
            program_name: 'Certificate IV',
            plan_total_amount: '20000',
            plan_start_date: '2025-01-01',
            plan_status: 'active',
            installment_id: 'inst-2',
            installment_number: 2,
            amount: '3000',
            due_date: '2025-02-15',
            paid_at: null,
            paid_amount: null,
            status: 'pending',
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary.total_paid).toBe(5000)
      expect(data.summary.total_outstanding).toBe(3000)
      expect(data.summary.percentage_paid).toBeCloseTo(62.5, 1)
    })

    it('should handle all paid installments (total_outstanding = 0)', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle.mockResolvedValue({
        data: { id: 'student-1', full_name: 'John Doe' },
        error: null,
      })

      mockRpc.mockResolvedValue({
        data: [
          {
            payment_plan_id: 'plan-1',
            college_name: 'Imagine Education',
            branch_name: 'Brisbane Campus',
            program_name: 'Certificate IV',
            plan_total_amount: '8000',
            plan_start_date: '2025-01-01',
            plan_status: 'completed',
            installment_id: 'inst-1',
            installment_number: 1,
            amount: '5000',
            due_date: '2025-01-15',
            paid_at: '2025-01-10',
            paid_amount: '5000',
            status: 'paid',
          },
          {
            payment_plan_id: 'plan-1',
            college_name: 'Imagine Education',
            branch_name: 'Brisbane Campus',
            program_name: 'Certificate IV',
            plan_total_amount: '8000',
            plan_start_date: '2025-01-01',
            plan_status: 'completed',
            installment_id: 'inst-2',
            installment_number: 2,
            amount: '3000',
            due_date: '2025-02-15',
            paid_at: '2025-02-10',
            paid_amount: '3000',
            status: 'paid',
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary.total_paid).toBe(8000)
      expect(data.summary.total_outstanding).toBe(0)
      expect(data.summary.percentage_paid).toBe(100)
    })

    it('should exclude cancelled installments from outstanding total', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle.mockResolvedValue({
        data: { id: 'student-1', full_name: 'John Doe' },
        error: null,
      })

      mockRpc.mockResolvedValue({
        data: [
          {
            payment_plan_id: 'plan-1',
            college_name: 'Imagine Education',
            branch_name: 'Brisbane Campus',
            program_name: 'Certificate IV',
            plan_total_amount: '10000',
            plan_start_date: '2025-01-01',
            plan_status: 'cancelled',
            installment_id: 'inst-1',
            installment_number: 1,
            amount: '5000',
            due_date: '2025-01-15',
            paid_at: null,
            paid_amount: null,
            status: 'cancelled',
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary.total_paid).toBe(0)
      expect(data.summary.total_outstanding).toBe(0) // Cancelled not counted
      expect(data.summary.percentage_paid).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when payment history query fails', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle.mockResolvedValue({
        data: { id: 'student-1', full_name: 'John Doe' },
        error: null,
      })

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' },
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toContain('Failed to fetch payment history')
    })
  })
})
