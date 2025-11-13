/**
 * Commission by Country API Route Tests
 *
 * Tests for the GET /api/commission-by-country endpoint
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 4: Create Commission by Country API Route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'

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

describe('GET /api/commission-by-country', () => {
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
        'http://localhost:3000/api/commission-by-country',
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
        'http://localhost:3000/api/commission-by-country',
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

    it('allows agency_admin to access commission by country data', async () => {
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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('allows agency_user to access commission by country data', async () => {
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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Commission Calculations and Country Grouping', () => {
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

    it('calculates commission by country correctly', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      // Mock installments with different countries
      const mockInstallments = [
        // Australia - Current month
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-10',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1500.00',
            enrollment_id: 'enroll-1',
            enrollments: {
              id: 'enroll-1',
              student_id: 'student-1',
              students: {
                id: 'student-1',
                nationality: 'Australia',
              },
            },
          },
        },
        // China - Current month
        {
          id: 'inst-2',
          amount: '8000.00',
          paid_amount: '8000.00',
          paid_date: '2025-02-12',
          generates_commission: true,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            total_amount: '8000.00',
            expected_commission: '1200.00',
            enrollment_id: 'enroll-2',
            enrollments: {
              id: 'enroll-2',
              student_id: 'student-2',
              students: {
                id: 'student-2',
                nationality: 'China',
              },
            },
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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)

      // Check Australia (higher commission)
      const australia = data.data.find((c: any) => c.country === 'Australia')
      expect(australia.commission).toBe(1500)

      // Check China
      const china = data.data.find((c: any) => c.country === 'China')
      expect(china.commission).toBe(1200)

      vi.useRealTimers()
    })

    it('aggregates multiple installments for the same country', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      // Mock multiple installments for same country
      const mockInstallments = [
        // Australia - Installment 1
        {
          id: 'inst-1',
          amount: '5000.00',
          paid_amount: '5000.00',
          paid_date: '2025-02-10',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1500.00',
            enrollment_id: 'enroll-1',
            enrollments: {
              id: 'enroll-1',
              student_id: 'student-1',
              students: {
                id: 'student-1',
                nationality: 'Australia',
              },
            },
          },
        },
        // Australia - Installment 2 (different student)
        {
          id: 'inst-2',
          amount: '5000.00',
          paid_amount: '5000.00',
          paid_date: '2025-02-12',
          generates_commission: true,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            total_amount: '10000.00',
            expected_commission: '1500.00',
            enrollment_id: 'enroll-2',
            enrollments: {
              id: 'enroll-2',
              student_id: 'student-2',
              students: {
                id: 'student-2',
                nationality: 'Australia',
              },
            },
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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(1)

      // Both installments: (5000/10000 * 1500) + (5000/10000 * 1500) = 750 + 750 = 1500
      const australia = data.data[0]
      expect(australia.country).toBe('Australia')
      expect(australia.commission).toBe(1500)

      vi.useRealTimers()
    })

    it('handles NULL nationality as "Unknown"', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        // Student with NULL nationality
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-10',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1500.00',
            enrollment_id: 'enroll-1',
            enrollments: {
              id: 'enroll-1',
              student_id: 'student-1',
              students: {
                id: 'student-1',
                nationality: null,
              },
            },
          },
        },
        // Student with valid nationality
        {
          id: 'inst-2',
          amount: '8000.00',
          paid_amount: '8000.00',
          paid_date: '2025-02-12',
          generates_commission: true,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            total_amount: '8000.00',
            expected_commission: '1200.00',
            enrollment_id: 'enroll-2',
            enrollments: {
              id: 'enroll-2',
              student_id: 'student-2',
              students: {
                id: 'student-2',
                nationality: 'India',
              },
            },
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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(2)

      // Check for "Unknown" country
      const unknown = data.data.find((c: any) => c.country === 'Unknown')
      expect(unknown).toBeDefined()
      expect(unknown.commission).toBe(1500)

      // Check India
      const india = data.data.find((c: any) => c.country === 'India')
      expect(india).toBeDefined()
      expect(india.commission).toBe(1200)

      vi.useRealTimers()
    })

    it('excludes installments that do not generate commission', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        // Commissionable installment
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-10',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1500.00',
            enrollment_id: 'enroll-1',
            enrollments: {
              id: 'enroll-1',
              student_id: 'student-1',
              students: {
                id: 'student-1',
                nationality: 'Australia',
              },
            },
          },
        },
        // Non-commissionable installment
        {
          id: 'inst-2',
          amount: '5000.00',
          paid_amount: '5000.00',
          paid_date: '2025-02-12',
          generates_commission: false,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1500.00',
            enrollment_id: 'enroll-1',
            enrollments: {
              id: 'enroll-1',
              student_id: 'student-1',
              students: {
                id: 'student-1',
                nationality: 'Australia',
              },
            },
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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const australia = data.data[0]

      // Only first installment counted: 10000/10000 * 1500 = 1500
      expect(australia.commission).toBe(1500)

      vi.useRealTimers()
    })
  })

  describe('Percentage Share Calculation', () => {
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

    it('calculates percentage share correctly', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      // Total commission: 1000 + 500 + 300 = 1800
      const mockInstallments = [
        // Country A: 1000 (55.6%)
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-10',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1000.00',
            enrollment_id: 'enroll-1',
            enrollments: {
              id: 'enroll-1',
              student_id: 'student-1',
              students: { id: 'student-1', nationality: 'Australia' },
            },
          },
        },
        // Country B: 500 (27.8%)
        {
          id: 'inst-2',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-11',
          generates_commission: true,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            total_amount: '10000.00',
            expected_commission: '500.00',
            enrollment_id: 'enroll-2',
            enrollments: {
              id: 'enroll-2',
              student_id: 'student-2',
              students: { id: 'student-2', nationality: 'China' },
            },
          },
        },
        // Country C: 300 (16.7%)
        {
          id: 'inst-3',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-12',
          generates_commission: true,
          payment_plan_id: 'plan-3',
          payment_plans: {
            id: 'plan-3',
            total_amount: '10000.00',
            expected_commission: '300.00',
            enrollment_id: 'enroll-3',
            enrollments: {
              id: 'enroll-3',
              student_id: 'student-3',
              students: { id: 'student-3', nationality: 'India' },
            },
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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()

      // Check percentage shares
      const australia = data.data.find((c: any) => c.country === 'Australia')
      const china = data.data.find((c: any) => c.country === 'China')
      const india = data.data.find((c: any) => c.country === 'India')

      expect(australia.percentage_share).toBeCloseTo(55.6, 1)
      expect(china.percentage_share).toBeCloseTo(27.8, 1)
      expect(india.percentage_share).toBeCloseTo(16.7, 1)

      vi.useRealTimers()
    })
  })

  describe('Trend Calculation', () => {
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

    it('calculates up trend correctly', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        // Current month: 1500
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-10',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1500.00',
            enrollment_id: 'enroll-1',
            enrollments: {
              id: 'enroll-1',
              student_id: 'student-1',
              students: { id: 'student-1', nationality: 'Australia' },
            },
          },
        },
        // Previous month: 1000
        {
          id: 'inst-2',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-01-15',
          generates_commission: true,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            total_amount: '10000.00',
            expected_commission: '1000.00',
            enrollment_id: 'enroll-2',
            enrollments: {
              id: 'enroll-2',
              student_id: 'student-2',
              students: { id: 'student-2', nationality: 'Australia' },
            },
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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const country = data.data[0]

      expect(country.trend).toBe('up')

      vi.useRealTimers()
    })

    it('calculates down trend correctly', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        // Current month: 1000
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-10',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1000.00',
            enrollment_id: 'enroll-1',
            enrollments: {
              id: 'enroll-1',
              student_id: 'student-1',
              students: { id: 'student-1', nationality: 'Australia' },
            },
          },
        },
        // Previous month: 1500
        {
          id: 'inst-2',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-01-15',
          generates_commission: true,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            total_amount: '10000.00',
            expected_commission: '1500.00',
            enrollment_id: 'enroll-2',
            enrollments: {
              id: 'enroll-2',
              student_id: 'student-2',
              students: { id: 'student-2', nationality: 'Australia' },
            },
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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const country = data.data[0]

      expect(country.trend).toBe('down')

      vi.useRealTimers()
    })

    it('calculates neutral trend for equal values', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        // Current month: 1000
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-10',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1000.00',
            enrollment_id: 'enroll-1',
            enrollments: {
              id: 'enroll-1',
              student_id: 'student-1',
              students: { id: 'student-1', nationality: 'Australia' },
            },
          },
        },
        // Previous month: 1000
        {
          id: 'inst-2',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-01-15',
          generates_commission: true,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            total_amount: '10000.00',
            expected_commission: '1000.00',
            enrollment_id: 'enroll-2',
            enrollments: {
              id: 'enroll-2',
              student_id: 'student-2',
              students: { id: 'student-2', nationality: 'Australia' },
            },
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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const country = data.data[0]

      expect(country.trend).toBe('neutral')

      vi.useRealTimers()
    })

    it('calculates neutral trend for new countries', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        // Only current month data (new country)
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-10',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1000.00',
            enrollment_id: 'enroll-1',
            enrollments: {
              id: 'enroll-1',
              student_id: 'student-1',
              students: { id: 'student-1', nationality: 'Vietnam' },
            },
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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const country = data.data[0]

      expect(country.trend).toBe('neutral')

      vi.useRealTimers()
    })
  })

  describe('Top 5 Countries Limit', () => {
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

    it('returns maximum of 5 countries', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      // Create 7 countries
      const countries = ['Australia', 'China', 'India', 'Vietnam', 'Nepal', 'Bangladesh', 'Philippines']
      const mockInstallments = countries.map((country, i) => ({
        id: `inst-${i + 1}`,
        amount: '10000.00',
        paid_amount: '10000.00',
        paid_date: '2025-02-10',
        generates_commission: true,
        payment_plan_id: `plan-${i + 1}`,
        payment_plans: {
          id: `plan-${i + 1}`,
          total_amount: '10000.00',
          expected_commission: `${1000 - i * 100}.00`,
          enrollment_id: `enroll-${i + 1}`,
          enrollments: {
            id: `enroll-${i + 1}`,
            student_id: `student-${i + 1}`,
            students: {
              id: `student-${i + 1}`,
              nationality: country,
            },
          },
        },
      }))

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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(5)

      vi.useRealTimers()
    })

    it('sorts countries by current month commission descending', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        // Country C: 500
        {
          id: 'inst-1',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-10',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '500.00',
            enrollment_id: 'enroll-1',
            enrollments: {
              id: 'enroll-1',
              student_id: 'student-1',
              students: { id: 'student-1', nationality: 'India' },
            },
          },
        },
        // Country A: 1500
        {
          id: 'inst-2',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-11',
          generates_commission: true,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            total_amount: '10000.00',
            expected_commission: '1500.00',
            enrollment_id: 'enroll-2',
            enrollments: {
              id: 'enroll-2',
              student_id: 'student-2',
              students: { id: 'student-2', nationality: 'Australia' },
            },
          },
        },
        // Country B: 1000
        {
          id: 'inst-3',
          amount: '10000.00',
          paid_amount: '10000.00',
          paid_date: '2025-02-12',
          generates_commission: true,
          payment_plan_id: 'plan-3',
          payment_plans: {
            id: 'plan-3',
            total_amount: '10000.00',
            expected_commission: '1000.00',
            enrollment_id: 'enroll-3',
            enrollments: {
              id: 'enroll-3',
              student_id: 'student-3',
              students: { id: 'student-3', nationality: 'China' },
            },
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
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()

      // Should be sorted: Australia (1500), China (1000), India (500)
      expect(data.data[0].country).toBe('Australia')
      expect(data.data[0].commission).toBe(1500)
      expect(data.data[1].country).toBe('China')
      expect(data.data[1].commission).toBe(1000)
      expect(data.data[2].country).toBe('India')
      expect(data.data[2].commission).toBe(500)

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
        'http://localhost:3000/api/commission-by-country',
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
    })

    it('returns empty array when no commission data', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/commission-by-country',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(0)
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
        'http://localhost:3000/api/commission-by-country',
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
        'http://localhost:3000/api/commission-by-country',
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
