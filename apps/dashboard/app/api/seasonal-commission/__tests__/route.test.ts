/**
 * Seasonal Commission API Route Tests
 *
 * Tests for the GET /api/seasonal-commission endpoint
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 2: Create Seasonal Commission API Route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'
import { subMonths, format } from 'date-fns'

// Mock Supabase client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockNot = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()

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

describe('GET /api/seasonal-commission', () => {
  const mockAgency = {
    id: 'agency-123',
    name: 'Test Agency',
    timezone: 'Australia/Brisbane',
    currency: 'AUD',
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
      not: mockNot,
    })
    mockNot.mockReturnValue({
      gte: mockGte,
    })
    mockGte.mockReturnValue({
      lte: mockLte,
    })
  })

  describe('Authentication and Authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      // Mock requireRole to return 401
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

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

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('not associated with an agency')
    })

    it('allows agency_admin to access seasonal commission data', async () => {
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

      // Mock installments query to return empty data
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('allows agency_user to access seasonal commission data', async () => {
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

      // Mock installments query to return empty data
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Commission Calculations', () => {
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

    it('calculates monthly commission correctly', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      // Mock installments with commission data
      const mockInstallments = [
        // January 2025
        {
          id: 'inst-1',
          amount: '5000.00',
          paid_amount: '5000.00',
          paid_date: '2025-01-15',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1500.00',
          },
        },
        // February 2025
        {
          id: 'inst-2',
          amount: '5000.00',
          paid_amount: '5000.00',
          paid_date: '2025-02-10',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1500.00',
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: mockInstallments,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Find January and February data
      const janData = data.data.find((m: any) => m.month === '2025-01')
      const febData = data.data.find((m: any) => m.month === '2025-02')

      // Each installment paid $5000 out of $10000 total = 50% of $1500 = $750
      expect(janData.commission).toBe(750)
      expect(febData.commission).toBe(750)

      vi.useRealTimers()
    })

    it('excludes installments that do not generate commission', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      // Mock installments with one that doesn't generate commission
      const mockInstallments = [
        {
          id: 'inst-1',
          amount: '5000.00',
          paid_amount: '5000.00',
          paid_date: '2025-01-15',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1500.00',
          },
        },
        {
          id: 'inst-2',
          amount: '500.00',
          paid_amount: '500.00',
          paid_date: '2025-01-20',
          generates_commission: false, // Non-commissionable
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1500.00',
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: mockInstallments,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const janData = data.data.find((m: any) => m.month === '2025-01')

      // Only first installment should be counted: $5000 / $10000 * $1500 = $750
      expect(janData.commission).toBe(750)

      vi.useRealTimers()
    })

    it('returns zero commission for months with no paid installments', async () => {
      // Mock requireRole
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

      // Mock empty installments
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(12) // All 12 months

      // All months should have zero commission
      data.data.forEach((monthData: any) => {
        expect(monthData.commission).toBe(0)
      })
    })
  })

  describe('Peak and Quiet Month Detection', () => {
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

    it('identifies top 3 months as peak months', async () => {
      const now = new Date('2025-04-15')
      vi.setSystemTime(now)

      // Create varying commission amounts
      const mockInstallments = [
        // Highest month: January - $3000 commission
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-01-15',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '3000.00',
          },
        },
        // Second highest: February - $2000 commission
        {
          id: 'inst-2',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-10',
          generates_commission: true,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            total_amount: '10000.00',
            expected_commission: '2000.00',
          },
        },
        // Third highest: March - $1500 commission
        {
          id: 'inst-3',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-03-10',
          generates_commission: true,
          payment_plan_id: 'plan-3',
          payment_plans: {
            id: 'plan-3',
            total_amount: '10000.00',
            expected_commission: '1500.00',
          },
        },
        // Regular month: April - $500 commission
        {
          id: 'inst-4',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-04-10',
          generates_commission: true,
          payment_plan_id: 'plan-4',
          payment_plans: {
            id: 'plan-4',
            total_amount: '10000.00',
            expected_commission: '500.00',
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: mockInstallments,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()

      // Check peak months
      const peakMonths = data.data.filter((m: any) => m.is_peak)
      expect(peakMonths).toHaveLength(3)

      const peakMonthKeys = peakMonths.map((m: any) => m.month)
      expect(peakMonthKeys).toContain('2025-01')
      expect(peakMonthKeys).toContain('2025-02')
      expect(peakMonthKeys).toContain('2025-03')

      vi.useRealTimers()
    })

    it('identifies bottom 3 months as quiet months', async () => {
      const now = new Date('2025-04-15')
      vi.setSystemTime(now)

      // Most months will have $0, so they'll be quiet
      const mockInstallments = [
        // Only one month with commission
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-01-15',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '3000.00',
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: mockInstallments,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()

      // Check quiet months
      const quietMonths = data.data.filter((m: any) => m.is_quiet)
      expect(quietMonths).toHaveLength(3)

      // All quiet months should have zero commission
      quietMonths.forEach((month: any) => {
        expect(month.commission).toBe(0)
      })

      vi.useRealTimers()
    })
  })

  describe('Year-over-Year Comparison', () => {
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

    it('calculates positive year-over-year change', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        // January 2025: $1000 commission
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-01-15',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1000.00',
          },
        },
        // January 2024: $500 commission
        {
          id: 'inst-2',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2024-01-15',
          generates_commission: true,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            total_amount: '10000.00',
            expected_commission: '500.00',
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: mockInstallments,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const janData = data.data.find((m: any) => m.month === '2025-01')

      // YoY change: (1000 - 500) / 500 * 100 = 100%
      expect(janData.year_over_year_change).toBe(100)

      vi.useRealTimers()
    })

    it('calculates negative year-over-year change', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        // January 2025: $500 commission
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-01-15',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '500.00',
          },
        },
        // January 2024: $1000 commission
        {
          id: 'inst-2',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2024-01-15',
          generates_commission: true,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            total_amount: '10000.00',
            expected_commission: '1000.00',
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: mockInstallments,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const janData = data.data.find((m: any) => m.month === '2025-01')

      // YoY change: (500 - 1000) / 1000 * 100 = -50%
      expect(janData.year_over_year_change).toBe(-50)

      vi.useRealTimers()
    })

    it('omits year_over_year_change when no historical data', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        // Only 2025 data, no 2024
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-01-15',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1000.00',
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: mockInstallments,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const janData = data.data.find((m: any) => m.month === '2025-01')

      // Should not have year_over_year_change property
      expect(janData.year_over_year_change).toBeUndefined()

      vi.useRealTimers()
    })
  })

  describe('Response Format', () => {
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

      // Mock empty installments
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })
    })

    it('returns correct response structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data).toHaveLength(12) // 12 months
    })

    it('returns correct data structure for each month', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const monthData = data.data[0]

      expect(monthData).toHaveProperty('month')
      expect(monthData).toHaveProperty('commission')
      expect(monthData).toHaveProperty('is_peak')
      expect(monthData).toHaveProperty('is_quiet')
      expect(typeof monthData.month).toBe('string')
      expect(typeof monthData.commission).toBe('number')
      expect(typeof monthData.is_peak).toBe('boolean')
      expect(typeof monthData.is_quiet).toBe('boolean')
    })

    it('returns months in chronological order', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()

      // Check that months are in order
      for (let i = 1; i < data.data.length; i++) {
        const prevMonth = new Date(data.data[i - 1].month + '-01')
        const currMonth = new Date(data.data[i].month + '-01')
        expect(currMonth.getTime()).toBeGreaterThan(prevMonth.getTime())
      }
    })
  })

  describe('Database Errors', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('handles agency fetch error', async () => {
      // Mock agency fetch to fail
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

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('handles installments query error', async () => {
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

      // Mock installments query to fail
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Query failed', code: 'QUERY_ERROR' },
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/seasonal-commission',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })
})
