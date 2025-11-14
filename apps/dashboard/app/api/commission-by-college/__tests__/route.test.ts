/**
 * Commission by College API Route Tests
 *
 * Tests for the GET /api/commission-by-college endpoint
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.3: Commission Breakdown by College
 * Task 1: Create Commission Breakdown API Route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'

// Mock Supabase client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockIn = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

// Mock requireRole from @pleeno/auth
vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(),
}))

// Import mocked requireRole
import { requireRole } from '@pleeno/auth'

describe('GET /api/commission-by-college', () => {
  const mockAgency = {
    id: 'agency-123',
    name: 'Test Agency',
    timezone: 'Australia/Brisbane',
    currency: 'AUD',
    gst_rate: 0.1, // 10% GST
  }

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
      single: mockSingle,
      gte: mockGte,
      in: mockIn,
    })
    mockGte.mockReturnValue({
      lte: mockLte,
    })
    mockIn.mockReturnValue({
      eq: mockEq,
    })
  })

  describe('Authentication and Authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      // Mock requireRole to return 401
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
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

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('not associated with an agency')
    })

    it('allows agency_admin to access commission breakdown data', async () => {
      // Mock requireRole to return admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      // Mock agency fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          }),
        }),
      })

      // Mock payment plans query to return empty data
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('allows agency_user to access commission breakdown data', async () => {
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

      // Mock agency fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          }),
        }),
      })

      // Mock payment plans query to return empty data
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Commission Aggregation by College/Branch', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      // Mock agency fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          }),
        }),
      })
    })

    it('aggregates commission by college and branch correctly', async () => {
      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '1500.00',
          gst_inclusive: false,
          created_at: '2025-01-15',
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
        {
          id: 'plan-2',
          total_amount: '8000.00',
          expected_commission: '1200.00',
          gst_inclusive: false,
          created_at: '2025-01-16',
          enrollments: {
            id: 'enroll-2',
            branches: {
              id: 'branch-2',
              name: 'Melbourne Campus',
              city: 'Melbourne',
              colleges: {
                id: 'college-2',
                name: 'University of Melbourne',
              },
            },
          },
        },
      ]

      // Mock payment plans fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPaymentPlans,
            error: null,
          }),
        }),
      })

      // Mock installments fetch (fully paid)
      const mockInstallments = [
        { payment_plan_id: 'plan-1', paid_amount: '10000.00', status: 'paid' },
        { payment_plan_id: 'plan-2', paid_amount: '8000.00', status: 'paid' },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockInstallments,
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)

      // Check University of Sydney
      const sydney = data.data.find((item: any) => item.college_name === 'University of Sydney')
      expect(sydney).toBeDefined()
      expect(sydney.branch_name).toBe('Sydney Campus')
      expect(sydney.branch_city).toBe('Sydney')
      expect(sydney.total_expected_commission).toBe(1500)
      expect(sydney.total_earned_commission).toBe(1500) // Fully paid
      expect(sydney.outstanding_commission).toBe(0)
      expect(sydney.payment_plan_count).toBe(1)

      // Check University of Melbourne
      const melbourne = data.data.find(
        (item: any) => item.college_name === 'University of Melbourne'
      )
      expect(melbourne).toBeDefined()
      expect(melbourne.branch_name).toBe('Melbourne Campus')
      expect(melbourne.total_earned_commission).toBe(1200)
    })

    it('groups multiple payment plans for same college/branch', async () => {
      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '1500.00',
          gst_inclusive: false,
          created_at: '2025-01-15',
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
        {
          id: 'plan-2',
          total_amount: '8000.00',
          expected_commission: '1200.00',
          gst_inclusive: false,
          created_at: '2025-01-16',
          enrollments: {
            id: 'enroll-2',
            branches: {
              id: 'branch-1', // Same branch
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1', // Same college
                name: 'University of Sydney',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPaymentPlans,
            error: null,
          }),
        }),
      })

      const mockInstallments = [
        { payment_plan_id: 'plan-1', paid_amount: '10000.00', status: 'paid' },
        { payment_plan_id: 'plan-2', paid_amount: '8000.00', status: 'paid' },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockInstallments,
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1) // Grouped into one entry

      const sydney = data.data[0]
      expect(sydney.college_name).toBe('University of Sydney')
      expect(sydney.branch_name).toBe('Sydney Campus')
      expect(sydney.total_expected_commission).toBe(2700) // 1500 + 1200
      expect(sydney.total_earned_commission).toBe(2700) // Fully paid
      expect(sydney.payment_plan_count).toBe(2)
    })

    it('calculates earned commission proportionally for partial payments', async () => {
      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '1500.00',
          gst_inclusive: false,
          created_at: '2025-01-15',
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPaymentPlans,
            error: null,
          }),
        }),
      })

      // Only 50% paid
      const mockInstallments = [
        { payment_plan_id: 'plan-1', paid_amount: '5000.00', status: 'paid' },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockInstallments,
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const sydney = data.data[0]

      expect(sydney.total_expected_commission).toBe(1500)
      expect(sydney.total_earned_commission).toBe(750) // 50% of 1500
      expect(sydney.outstanding_commission).toBe(750)
    })

    it('sorts results by earned commission descending', async () => {
      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '500.00',
          gst_inclusive: false,
          created_at: '2025-01-15',
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Campus A',
              city: 'City A',
              colleges: {
                id: 'college-1',
                name: 'College A',
              },
            },
          },
        },
        {
          id: 'plan-2',
          total_amount: '10000.00',
          expected_commission: '1500.00',
          gst_inclusive: false,
          created_at: '2025-01-16',
          enrollments: {
            id: 'enroll-2',
            branches: {
              id: 'branch-2',
              name: 'Campus B',
              city: 'City B',
              colleges: {
                id: 'college-2',
                name: 'College B',
              },
            },
          },
        },
        {
          id: 'plan-3',
          total_amount: '10000.00',
          expected_commission: '1000.00',
          gst_inclusive: false,
          created_at: '2025-01-17',
          enrollments: {
            id: 'enroll-3',
            branches: {
              id: 'branch-3',
              name: 'Campus C',
              city: 'City C',
              colleges: {
                id: 'college-3',
                name: 'College C',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPaymentPlans,
            error: null,
          }),
        }),
      })

      const mockInstallments = [
        { payment_plan_id: 'plan-1', paid_amount: '10000.00', status: 'paid' },
        { payment_plan_id: 'plan-2', paid_amount: '10000.00', status: 'paid' },
        { payment_plan_id: 'plan-3', paid_amount: '10000.00', status: 'paid' },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockInstallments,
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(3)

      // Should be sorted: College B (1500), College C (1000), College A (500)
      expect(data.data[0].college_name).toBe('College B')
      expect(data.data[0].total_earned_commission).toBe(1500)
      expect(data.data[1].college_name).toBe('College C')
      expect(data.data[1].total_earned_commission).toBe(1000)
      expect(data.data[2].college_name).toBe('College A')
      expect(data.data[2].total_earned_commission).toBe(500)
    })
  })

  describe('GST Calculation', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          }),
        }),
      })
    })

    it('calculates GST correctly for gst_inclusive=true', async () => {
      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '1100.00',
          gst_inclusive: true, // GST is included
          created_at: '2025-01-15',
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPaymentPlans,
            error: null,
          }),
        }),
      })

      const mockInstallments = [
        { payment_plan_id: 'plan-1', paid_amount: '10000.00', status: 'paid' },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockInstallments,
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const sydney = data.data[0]

      // GST inclusive: GST = 1100 / (1 + 0.1) * 0.1 = 100
      expect(sydney.total_earned_commission).toBe(1100)
      expect(sydney.total_gst).toBe(100)
      expect(sydney.total_with_gst).toBe(1200)
    })

    it('calculates GST correctly for gst_inclusive=false', async () => {
      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '1000.00',
          gst_inclusive: false, // GST is not included
          created_at: '2025-01-15',
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPaymentPlans,
            error: null,
          }),
        }),
      })

      const mockInstallments = [
        { payment_plan_id: 'plan-1', paid_amount: '10000.00', status: 'paid' },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockInstallments,
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const sydney = data.data[0]

      // GST exclusive: GST = 1000 * 0.1 = 100
      expect(sydney.total_earned_commission).toBe(1000)
      expect(sydney.total_gst).toBe(100)
      expect(sydney.total_with_gst).toBe(1100)
    })

    it('handles mixed GST settings correctly', async () => {
      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '1100.00',
          gst_inclusive: true,
          created_at: '2025-01-15',
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
        {
          id: 'plan-2',
          total_amount: '10000.00',
          expected_commission: '1000.00',
          gst_inclusive: false,
          created_at: '2025-01-16',
          enrollments: {
            id: 'enroll-2',
            branches: {
              id: 'branch-1', // Same branch
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1', // Same college
                name: 'University of Sydney',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPaymentPlans,
            error: null,
          }),
        }),
      })

      const mockInstallments = [
        { payment_plan_id: 'plan-1', paid_amount: '10000.00', status: 'paid' },
        { payment_plan_id: 'plan-2', paid_amount: '10000.00', status: 'paid' },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockInstallments,
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const sydney = data.data[0]

      // Plan 1: GST = 1100 / 1.1 * 0.1 = 100
      // Plan 2: GST = 1000 * 0.1 = 100
      // Total GST = 200
      expect(sydney.total_earned_commission).toBe(2100)
      expect(sydney.total_gst).toBe(200)
      expect(sydney.total_with_gst).toBe(2300)
    })
  })

  describe('Time Period Filtering', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          }),
        }),
      })
    })

    it('filters by year when period=year', async () => {
      const now = new Date('2025-06-15')
      vi.setSystemTime(now)

      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '1500.00',
          gst_inclusive: false,
          created_at: '2025-01-15', // This year
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: mockPaymentPlans,
                error: null,
              }),
            }),
          }),
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/commission-by-college?period=year',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      vi.useRealTimers()
    })

    it('filters by quarter when period=quarter', async () => {
      const now = new Date('2025-05-15') // Q2
      vi.setSystemTime(now)

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/commission-by-college?period=quarter',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      vi.useRealTimers()
    })

    it('filters by month when period=month', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/commission-by-college?period=month',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      vi.useRealTimers()
    })

    it('does not filter when period=all', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/commission-by-college?period=all',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('defaults to "all" when period is not specified', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('College and Branch Filtering', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          }),
        }),
      })
    })

    it('filters by college_id when provided', async () => {
      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '1500.00',
          gst_inclusive: false,
          created_at: '2025-01-15',
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
        {
          id: 'plan-2',
          total_amount: '8000.00',
          expected_commission: '1200.00',
          gst_inclusive: false,
          created_at: '2025-01-16',
          enrollments: {
            id: 'enroll-2',
            branches: {
              id: 'branch-2',
              name: 'Melbourne Campus',
              city: 'Melbourne',
              colleges: {
                id: 'college-2',
                name: 'University of Melbourne',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPaymentPlans,
            error: null,
          }),
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  payment_plan_id: 'plan-1',
                  paid_amount: '10000.00',
                  status: 'paid',
                },
              ],
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/commission-by-college?college_id=college-1',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].college_id).toBe('college-1')
      expect(data.data[0].college_name).toBe('University of Sydney')
    })

    it('filters by branch_id when provided', async () => {
      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '1500.00',
          gst_inclusive: false,
          created_at: '2025-01-15',
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
        {
          id: 'plan-2',
          total_amount: '8000.00',
          expected_commission: '1200.00',
          gst_inclusive: false,
          created_at: '2025-01-16',
          enrollments: {
            id: 'enroll-2',
            branches: {
              id: 'branch-2',
              name: 'Melbourne Campus',
              city: 'Melbourne',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPaymentPlans,
            error: null,
          }),
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  payment_plan_id: 'plan-2',
                  paid_amount: '8000.00',
                  status: 'paid',
                },
              ],
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/commission-by-college?branch_id=branch-2',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].branch_id).toBe('branch-2')
      expect(data.data[0].branch_name).toBe('Melbourne Campus')
    })

    it('filters by both college_id and branch_id when both provided', async () => {
      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '1500.00',
          gst_inclusive: false,
          created_at: '2025-01-15',
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPaymentPlans,
            error: null,
          }),
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  payment_plan_id: 'plan-1',
                  paid_amount: '10000.00',
                  status: 'paid',
                },
              ],
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/commission-by-college?college_id=college-1&branch_id=branch-1',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].college_id).toBe('college-1')
      expect(data.data[0].branch_id).toBe('branch-1')
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          }),
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })
    })

    it('returns correct response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('returns empty array when no commission data', async () => {
      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(0)
    })

    it('rounds numeric values to 2 decimal places', async () => {
      vi.clearAllMocks()

      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      // Mock agency fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          }),
        }),
      })

      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '1333.33',
          gst_inclusive: false,
          created_at: '2025-01-15',
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
      ]

      // Mock payment plans fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPaymentPlans,
            error: null,
          }),
        }),
      })

      // Mock installments fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  payment_plan_id: 'plan-1',
                  paid_amount: '10000.00',
                  status: 'paid',
                },
              ],
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(1)
      const sydney = data.data[0]

      // Check that values are rounded to 2 decimal places
      expect(sydney.total_commissions).toBe(1333.33)
      expect(sydney.total_gst).toBe(133.33)
      expect(sydney.total_with_gst).toBe(1466.66)
      expect(sydney.total_expected_commission).toBe(1333.33)
      expect(sydney.total_earned_commission).toBe(1333.33)
    })
  })

  describe('Database Errors', () => {
    it('handles agency fetch error', async () => {
      vi.clearAllMocks()

      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      // Mock agency fetch with error
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: 'DB_ERROR' },
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('handles payment plans query error', async () => {
      vi.clearAllMocks()

      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      // Mock agency fetch success
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          }),
        }),
      })

      // Mock payment plans fetch error
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Query failed', code: 'QUERY_ERROR' },
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('handles installments query error gracefully', async () => {
      vi.clearAllMocks()

      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      // Mock agency fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          }),
        }),
      })

      // Mock payment plans with some data
      const mockPaymentPlans = [
        {
          id: 'plan-1',
          total_amount: '10000.00',
          expected_commission: '1500.00',
          gst_inclusive: false,
          created_at: '2025-01-15',
          enrollments: {
            id: 'enroll-1',
            branches: {
              id: 'branch-1',
              name: 'Sydney Campus',
              city: 'Sydney',
              colleges: {
                id: 'college-1',
                name: 'University of Sydney',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPaymentPlans,
            error: null,
          }),
        }),
      })

      // Mock installments query error
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Installments query failed', code: 'QUERY_ERROR' },
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/commission-by-college', {
        method: 'GET',
      })

      // Should handle installments error gracefully (logged but not thrown)
      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      // Should return commission data without installments data
      expect(data.data).toHaveLength(1)
      expect(data.data[0].total_earned_commission).toBe(0) // No installments = no earned commission
    })
  })
})
