/**
 * Commission by School API Route Tests
 *
 * Tests for the GET /api/commission-by-school endpoint
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 3: Create Commission by School API Route
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

describe('GET /api/commission-by-school', () => {
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
        'http://localhost:3000/api/commission-by-school',
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
        'http://localhost:3000/api/commission-by-school',
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

    it('allows agency_admin to access commission by school data', async () => {
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
        'http://localhost:3000/api/commission-by-school',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('allows agency_user to access commission by school data', async () => {
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
        'http://localhost:3000/api/commission-by-school',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Commission Calculations and School Grouping', () => {
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

    it('calculates commission by school correctly', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      // Mock installments with different schools
      const mockInstallments = [
        // University of Sydney - Current month
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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: {
                  id: 'college-1',
                  name: 'University of Sydney',
                },
              },
            },
          },
        },
        // University of Melbourne - Current month
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
              branch_id: 'branch-2',
              branches: {
                id: 'branch-2',
                college_id: 'college-2',
                colleges: {
                  id: 'college-2',
                  name: 'University of Melbourne',
                },
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
        'http://localhost:3000/api/commission-by-school',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)

      // Check University of Sydney (higher commission)
      const sydney = data.data.find(
        (s: any) => s.college_name === 'University of Sydney'
      )
      expect(sydney.commission).toBe(1500)
      expect(sydney.college_id).toBe('college-1')

      // Check University of Melbourne
      const melbourne = data.data.find(
        (s: any) => s.college_name === 'University of Melbourne'
      )
      expect(melbourne.commission).toBe(1200)
      expect(melbourne.college_id).toBe('college-2')

      vi.useRealTimers()
    })

    it('aggregates multiple installments for the same school', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      // Mock multiple installments for same school
      const mockInstallments = [
        // University of Sydney - Installment 1
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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: {
                  id: 'college-1',
                  name: 'University of Sydney',
                },
              },
            },
          },
        },
        // University of Sydney - Installment 2
        {
          id: 'inst-2',
          amount: '5000.00',
          paid_amount: '5000.00',
          paid_date: '2025-02-12',
          generates_commission: true,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            total_amount: '10000.00',
            expected_commission: '1500.00',
            enrollment_id: 'enroll-1',
            enrollments: {
              id: 'enroll-1',
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: {
                  id: 'college-1',
                  name: 'University of Sydney',
                },
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
        'http://localhost:3000/api/commission-by-school',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(1)

      // Both installments: (5000/10000 * 1500) + (5000/10000 * 1500) = 750 + 750 = 1500
      const sydney = data.data[0]
      expect(sydney.college_name).toBe('University of Sydney')
      expect(sydney.commission).toBe(1500)

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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: {
                  id: 'college-1',
                  name: 'University of Sydney',
                },
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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: {
                  id: 'college-1',
                  name: 'University of Sydney',
                },
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
        'http://localhost:3000/api/commission-by-school',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const sydney = data.data[0]

      // Only first installment counted: 10000/10000 * 1500 = 1500
      expect(sydney.commission).toBe(1500)

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
        // School 1: 1000 (55.6%)
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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: { id: 'college-1', name: 'School A' },
              },
            },
          },
        },
        // School 2: 500 (27.8%)
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
              branch_id: 'branch-2',
              branches: {
                id: 'branch-2',
                college_id: 'college-2',
                colleges: { id: 'college-2', name: 'School B' },
              },
            },
          },
        },
        // School 3: 300 (16.7%)
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
              branch_id: 'branch-3',
              branches: {
                id: 'branch-3',
                college_id: 'college-3',
                colleges: { id: 'college-3', name: 'School C' },
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
        'http://localhost:3000/api/commission-by-school',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()

      // Check percentage shares
      const schoolA = data.data.find((s: any) => s.college_name === 'School A')
      const schoolB = data.data.find((s: any) => s.college_name === 'School B')
      const schoolC = data.data.find((s: any) => s.college_name === 'School C')

      expect(schoolA.percentage_share).toBeCloseTo(55.6, 1)
      expect(schoolB.percentage_share).toBeCloseTo(27.8, 1)
      expect(schoolC.percentage_share).toBeCloseTo(16.7, 1)

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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: { id: 'college-1', name: 'University A' },
              },
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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: { id: 'college-1', name: 'University A' },
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
        'http://localhost:3000/api/commission-by-school',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const university = data.data[0]

      expect(university.trend).toBe('up')

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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: { id: 'college-1', name: 'University A' },
              },
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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: { id: 'college-1', name: 'University A' },
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
        'http://localhost:3000/api/commission-by-school',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const university = data.data[0]

      expect(university.trend).toBe('down')

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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: { id: 'college-1', name: 'University A' },
              },
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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: { id: 'college-1', name: 'University A' },
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
        'http://localhost:3000/api/commission-by-school',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const university = data.data[0]

      expect(university.trend).toBe('neutral')

      vi.useRealTimers()
    })

    it('calculates neutral trend for new schools', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        // Only current month data (new school)
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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-1',
                colleges: { id: 'college-1', name: 'New University' },
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
        'http://localhost:3000/api/commission-by-school',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const university = data.data[0]

      expect(university.trend).toBe('neutral')

      vi.useRealTimers()
    })
  })

  describe('Top 5 Schools Limit', () => {
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

    it('returns maximum of 5 schools', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      // Create 7 schools
      const mockInstallments = Array.from({ length: 7 }, (_, i) => ({
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
            branch_id: `branch-${i + 1}`,
            branches: {
              id: `branch-${i + 1}`,
              college_id: `college-${i + 1}`,
              colleges: {
                id: `college-${i + 1}`,
                name: `University ${String.fromCharCode(65 + i)}`,
              },
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
        'http://localhost:3000/api/commission-by-school',
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

    it('sorts schools by current month commission descending', async () => {
      const now = new Date('2025-02-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        // School C: 500
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
              branch_id: 'branch-1',
              branches: {
                id: 'branch-1',
                college_id: 'college-3',
                colleges: { id: 'college-3', name: 'School C' },
              },
            },
          },
        },
        // School A: 1500
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
              branch_id: 'branch-2',
              branches: {
                id: 'branch-2',
                college_id: 'college-1',
                colleges: { id: 'college-1', name: 'School A' },
              },
            },
          },
        },
        // School B: 1000
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
              branch_id: 'branch-3',
              branches: {
                id: 'branch-3',
                college_id: 'college-2',
                colleges: { id: 'college-2', name: 'School B' },
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
        'http://localhost:3000/api/commission-by-school',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()

      // Should be sorted: School A (1500), School B (1000), School C (500)
      expect(data.data[0].college_name).toBe('School A')
      expect(data.data[0].commission).toBe(1500)
      expect(data.data[1].college_name).toBe('School B')
      expect(data.data[1].commission).toBe(1000)
      expect(data.data[2].college_name).toBe('School C')
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
        'http://localhost:3000/api/commission-by-school',
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
        'http://localhost:3000/api/commission-by-school',
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
        'http://localhost:3000/api/commission-by-school',
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
        'http://localhost:3000/api/commission-by-school',
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
