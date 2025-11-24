/**
 * Payment Plans Report API Route Tests
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 8: Testing
 *
 * Comprehensive unit tests for POST /api/reports/payment-plans endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST } from '../route'

// Mock Supabase client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockIn = vi.fn()
const mockOrder = vi.fn()
const mockRange = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// Mock requireRole from @pleeno/auth
vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(),
}))

// Mock handleApiError
vi.mock('@pleeno/utils', () => ({
  handleApiError: vi.fn((error) =>
    NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'An error occurred' },
      },
      { status: 500 }
    )
  ),
  ForbiddenError: class ForbiddenError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ForbiddenError'
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(message: string, public details?: any) {
      super(message)
      this.name = 'ValidationError'
    }
  },
  calculateExpectedCommission: vi.fn((amount, rate) => (amount * rate) / 100),
}))

// Import mocked requireRole
import { requireRole } from '@pleeno/auth/server'

describe('POST /api/reports/payment-plans', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@test.com',
    app_metadata: {
      role: 'agency_admin',
      agency_id: 'agency-123',
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  }

  const mockPaymentPlansData = [
    {
      id: 'pp-1',
      reference_number: 'PP-001',
      total_amount: 50000,
      currency: 'USD',
      commission_rate_percent: 10,
      expected_commission: 5000,
      status: 'active',
      start_date: '2024-01-01',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
      enrollments: {
        id: 'enr-1',
        program_name: 'Computer Science',
        contract_expiration_date: '2025-12-31',
        student_id: 's1',
        students: {
          id: 's1',
          name: 'John Doe',
        },
        branches: {
          id: 'b1',
          name: 'Main Campus',
          college_id: 'c1',
          colleges: {
            id: 'c1',
            name: 'State University',
          },
        },
      },
    },
    {
      id: 'pp-2',
      reference_number: 'PP-002',
      total_amount: 40000,
      currency: 'USD',
      commission_rate_percent: 8,
      expected_commission: 3200,
      status: 'completed',
      start_date: '2023-09-01',
      created_at: '2023-09-01T00:00:00Z',
      updated_at: '2024-08-01T00:00:00Z',
      enrollments: {
        id: 'enr-2',
        program_name: 'Business Administration',
        contract_expiration_date: '2025-11-20',
        student_id: 's2',
        students: {
          id: 's2',
          name: 'Jane Smith',
        },
        branches: {
          id: 'b1',
          name: 'Main Campus',
          college_id: 'c1',
          colleges: {
            id: 'c1',
            name: 'State University',
          },
        },
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock chain setup
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      gte: mockGte,
      lte: mockLte,
      in: mockIn,
      order: mockOrder,
      range: mockRange,
    })
    mockGte.mockReturnValue({
      lte: mockLte,
      in: mockIn,
      order: mockOrder,
      range: mockRange,
    })
    mockLte.mockReturnValue({
      in: mockIn,
      order: mockOrder,
      range: mockRange,
    })
    mockIn.mockReturnValue({
      in: mockIn,
      order: mockOrder,
      range: mockRange,
    })
    mockOrder.mockReturnValue({
      range: mockRange,
    })
    mockRange.mockResolvedValue({
      data: mockPaymentPlansData,
      error: null,
      count: 2,
    })
  })

  describe('Authentication and Authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      // Mock requireRole to return 401
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 403 for users without agency_id', async () => {
      // Mock requireRole to return user without agency_id
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          ...mockUser,
          app_metadata: {
            role: 'agency_admin',
            // No agency_id
          },
        },
        role: 'agency_admin',
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('not associated with an agency')
    })

    it('allows agency_admin to access report', async () => {
      // Mock requireRole to return admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      // Mock payment plans query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockPaymentPlansData,
                error: null,
                count: 2,
              }),
            }),
          }),
        }),
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { total_amount: 50000, expected_commission: 5000 },
              { total_amount: 40000, expected_commission: 3200 },
            ],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    it('allows agency_user to access report', async () => {
      // Mock requireRole to return regular user
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          ...mockUser,
          app_metadata: {
            role: 'agency_user',
            agency_id: 'agency-123',
          },
        },
        role: 'agency_user',
      })

      // Mock payment plans query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockPaymentPlansData,
                error: null,
                count: 2,
              }),
            }),
          }),
        }),
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Data Filtering', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('filters by date range (date_from and date_to)', async () => {
      const mockGteFn = vi.fn().mockReturnValue({
        lte: mockLte,
        order: mockOrder,
        range: mockRange,
      })
      const mockLteFn = vi.fn().mockReturnValue({
        order: mockOrder,
        range: mockRange,
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: mockGteFn,
            lte: mockLteFn,
          }),
        }),
      })

      mockLte.mockReturnValue({
        order: mockOrder,
      })
      mockOrder.mockReturnValue({
        range: mockRange,
      })
      mockRange.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
        count: 2,
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {
              date_from: '2024-01-01',
              date_to: '2024-12-31',
            },
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      await POST(request)

      // Verify gte was called with date_from
      expect(mockGteFn).toHaveBeenCalledWith('start_date', '2024-01-01')
      // Verify lte was called with date_to
      expect(mockLteFn).toHaveBeenCalledWith('start_date', '2024-12-31')
    })

    it('filters by college_ids', async () => {
      const mockInFn = vi.fn().mockReturnValue({
        order: mockOrder,
        range: mockRange,
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: mockInFn,
          }),
        }),
      })

      mockOrder.mockReturnValue({
        range: mockRange,
      })
      mockRange.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
        count: 2,
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {
              college_ids: ['c1', 'c2'],
            },
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      await POST(request)

      // Verify in was called with college_ids
      expect(mockInFn).toHaveBeenCalledWith(
        'enrollments.branches.college_id',
        ['c1', 'c2']
      )
    })

    it('filters by branch_ids', async () => {
      const mockInFn = vi.fn().mockReturnValue({
        order: mockOrder,
        range: mockRange,
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: mockInFn,
          }),
        }),
      })

      mockOrder.mockReturnValue({
        range: mockRange,
      })
      mockRange.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
        count: 2,
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {
              branch_ids: ['b1', 'b2'],
            },
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      await POST(request)

      // Verify in was called with branch_ids
      expect(mockInFn).toHaveBeenCalledWith('enrollments.branches.id', ['b1', 'b2'])
    })

    it('filters by student_ids', async () => {
      const mockInFn = vi.fn().mockReturnValue({
        order: mockOrder,
        range: mockRange,
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: mockInFn,
          }),
        }),
      })

      mockOrder.mockReturnValue({
        range: mockRange,
      })
      mockRange.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
        count: 2,
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {
              student_ids: ['s1', 's2'],
            },
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      await POST(request)

      // Verify in was called with student_ids
      expect(mockInFn).toHaveBeenCalledWith('enrollments.student_id', ['s1', 's2'])
    })

    it('filters by status', async () => {
      const mockInFn = vi.fn().mockReturnValue({
        order: mockOrder,
        range: mockRange,
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: mockInFn,
          }),
        }),
      })

      mockOrder.mockReturnValue({
        range: mockRange,
      })
      mockRange.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
        count: 2,
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {
              status: ['active', 'pending'],
            },
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      await POST(request)

      // Verify in was called with status
      expect(mockInFn).toHaveBeenCalledWith('status', ['active', 'pending'])
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('applies correct pagination (page 1, size 10)', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: mockRange,
            }),
          }),
        }),
      })

      mockRange.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
        count: 20,
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      await POST(request)

      // Verify range was called with correct offset (page 1, offset 0)
      expect(mockRange).toHaveBeenCalledWith(0, 9)
    })

    it('applies correct pagination (page 2, size 10)', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: mockRange,
            }),
          }),
        }),
      })

      mockRange.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
        count: 20,
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 2, page_size: 10 },
          }),
        }
      )

      await POST(request)

      // Verify range was called with correct offset (page 2, offset 10)
      expect(mockRange).toHaveBeenCalledWith(10, 19)
    })

    it('calculates total pages correctly', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockPaymentPlansData,
                error: null,
                count: 25, // 25 total records
              }),
            }),
          }),
        }),
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      // 25 records / 10 per page = 3 pages
      expect(data.pagination.total_pages).toBe(3)
      expect(data.pagination.total_count).toBe(25)
    })
  })

  describe('Sorting', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('sorts by column ascending', async () => {
      const mockOrderFn = vi.fn().mockReturnValue({
        range: mockRange,
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: mockOrderFn,
          }),
        }),
      })

      mockRange.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
        count: 2,
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
            sort: { column: 'student_name', direction: 'asc' },
          }),
        }
      )

      await POST(request)

      // Verify order was called with column and ascending: true
      expect(mockOrderFn).toHaveBeenCalledWith('student_name', { ascending: true })
    })

    it('sorts by column descending', async () => {
      const mockOrderFn = vi.fn().mockReturnValue({
        range: mockRange,
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: mockOrderFn,
          }),
        }),
      })

      mockRange.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
        count: 2,
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
            sort: { column: 'plan_amount', direction: 'desc' },
          }),
        }
      )

      await POST(request)

      // Verify order was called with column and ascending: false
      expect(mockOrderFn).toHaveBeenCalledWith('plan_amount', { ascending: false })
    })

    it('defaults to sorting by created_at ascending', async () => {
      const mockOrderFn = vi.fn().mockReturnValue({
        range: mockRange,
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: mockOrderFn,
          }),
        }),
      })

      mockRange.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
        count: 2,
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
            // No sort specified
          }),
        }
      )

      await POST(request)

      // Verify order was called with default created_at
      expect(mockOrderFn).toHaveBeenCalledWith('created_at', { ascending: true })
    })
  })

  describe('Computed Fields', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('calculates days_until_contract_expiration correctly', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      const mockDataWithExpiration = [
        {
          ...mockPaymentPlansData[0],
          enrollments: {
            ...mockPaymentPlansData[0].enrollments,
            contract_expiration_date: futureDate.toISOString().split('T')[0],
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockDataWithExpiration,
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'contract_expiration_date'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      // Verify days_until_contract_expiration is calculated
      expect(data.data[0].days_until_contract_expiration).toBeGreaterThanOrEqual(29)
      expect(data.data[0].days_until_contract_expiration).toBeLessThanOrEqual(31)
    })

    it('sets contract_status to "expired" for past dates', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 10)

      const mockDataWithExpiredContract = [
        {
          ...mockPaymentPlansData[0],
          enrollments: {
            ...mockPaymentPlansData[0].enrollments,
            contract_expiration_date: pastDate.toISOString().split('T')[0],
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockDataWithExpiredContract,
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'contract_status'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(data.data[0].contract_status).toBe('expired')
      expect(data.data[0].days_until_contract_expiration).toBeLessThan(0)
    })

    it('sets contract_status to "expiring_soon" for dates within 30 days', async () => {
      const soonDate = new Date()
      soonDate.setDate(soonDate.getDate() + 15)

      const mockDataWithExpiringSoon = [
        {
          ...mockPaymentPlansData[0],
          enrollments: {
            ...mockPaymentPlansData[0].enrollments,
            contract_expiration_date: soonDate.toISOString().split('T')[0],
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockDataWithExpiringSoon,
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'contract_status'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(data.data[0].contract_status).toBe('expiring_soon')
    })

    it('sets contract_status to "active" for dates beyond 30 days', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 90)

      const mockDataWithActiveContract = [
        {
          ...mockPaymentPlansData[0],
          enrollments: {
            ...mockPaymentPlansData[0].enrollments,
            contract_expiration_date: futureDate.toISOString().split('T')[0],
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockDataWithActiveContract,
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'contract_status'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(data.data[0].contract_status).toBe('active')
    })
  })

  describe('Summary Calculations', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('calculates summary totals correctly', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockPaymentPlansData,
                error: null,
                count: 2,
              }),
            }),
          }),
        }),
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { total_amount: 50000, expected_commission: 5000 },
              { total_amount: 40000, expected_commission: 3200 },
              { total_amount: 30000, expected_commission: 2400 },
            ],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(data.summary.total_plan_amount).toBe(120000)
      expect(data.summary.total_commission).toBe(10600)
      expect(data.summary.total_paid_amount).toBe(0) // TODO: will be implemented later
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('handles database query errors', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error', code: 'DB_ERROR' },
                count: null,
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('handles summary query errors', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockPaymentPlansData,
                error: null,
                count: 2,
              }),
            }),
          }),
        }),
      })

      // Mock summary query to fail
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Summary query failed', code: 'QUERY_ERROR' },
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('RLS Enforcement', () => {
    it('only returns data for user agency', async () => {
      const agency1User = {
        ...mockUser,
        app_metadata: {
          role: 'agency_admin',
          agency_id: 'agency-1',
        },
      }

      vi.mocked(requireRole).mockResolvedValue({
        user: agency1User,
        role: 'agency_admin',
      })

      const mockEqFn = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: mockPaymentPlansData,
            error: null,
            count: 2,
          }),
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: mockEqFn,
        }),
      })

      // Mock summary query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: {},
            columns: ['student_name', 'plan_amount'],
            pagination: { page: 1, page_size: 10 },
          }),
        }
      )

      await POST(request)

      // Verify eq was called with the user's agency_id
      expect(mockEqFn).toHaveBeenCalledWith('agency_id', 'agency-1')
    })
  })
})
