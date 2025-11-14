/**
 * Cash Flow Projection API Route Tests
 *
 * Tests for the GET /api/cash-flow-projection endpoint
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.2: Cash Flow Projection Chart
 * Task 8: Testing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
const mockOrder = vi.fn()

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

describe('GET /api/cash-flow-projection', () => {
  const mockAgency = {
    id: 'agency-123',
    name: 'Test Agency',
    timezone: 'Australia/Sydney',
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
      gte: mockGte,
    })
    mockGte.mockReturnValue({
      lte: mockLte,
    })
    mockLte.mockReturnValue({
      in: mockIn,
    })
    mockIn.mockReturnValue({
      order: mockOrder,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Authentication and Authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      // Mock requireRole to return 401
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/cash-flow-projection',
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
        'http://localhost:3000/api/cash-flow-projection',
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

    it('allows agency_admin to access cash flow data', async () => {
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
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
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
        'http://localhost:3000/api/cash-flow-projection',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('allows agency_user to access cash flow data', async () => {
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
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
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
        'http://localhost:3000/api/cash-flow-projection',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Query Parameters', () => {
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

      // Mock installments query to return empty data
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
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

    it('uses default values when no parameters provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/cash-flow-projection',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('accepts custom days parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/cash-flow-projection?days=30',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('accepts daily groupBy parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/cash-flow-projection?groupBy=day',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('accepts monthly groupBy parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/cash-flow-projection?groupBy=month',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('rejects invalid groupBy parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/cash-flow-projection?groupBy=invalid',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('rejects invalid days parameter (negative)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/cash-flow-projection?days=-10',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('rejects invalid days parameter (exceeds max)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/cash-flow-projection?days=400',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid query parameters')
    })
  })

  describe('Data Grouping and Calculation', () => {
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

    it('groups installments by week correctly', async () => {
      const now = new Date('2025-01-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        {
          id: 'inst-1',
          amount: '2500.00',
          status: 'paid',
          student_due_date: '2025-01-15',
          paid_amount: '2500.00',
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            enrollment_id: 'enr-1',
            enrollments: {
              id: 'enr-1',
              student_id: 'stu-1',
              college_id: 'col-1',
              students: {
                id: 'stu-1',
                full_name: 'John Doe',
              },
              colleges: {
                id: 'col-1',
                name: 'University X',
              },
            },
          },
        },
        {
          id: 'inst-2',
          amount: '3000.00',
          status: 'pending',
          student_due_date: '2025-01-16',
          paid_amount: null,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            enrollment_id: 'enr-2',
            enrollments: {
              id: 'enr-2',
              student_id: 'stu-2',
              college_id: 'col-1',
              students: {
                id: 'stu-2',
                full_name: 'Jane Smith',
              },
              colleges: {
                id: 'col-1',
                name: 'University X',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
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
        'http://localhost:3000/api/cash-flow-projection?groupBy=week',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1) // Both in same week

      const weekData = data.data[0]
      expect(weekData.paid_amount).toBe(2500)
      expect(weekData.expected_amount).toBe(3000)
      expect(weekData.installment_count).toBe(2)
      expect(weekData.installments).toHaveLength(2)
    })

    it('separates paid and expected amounts correctly', async () => {
      const now = new Date('2025-01-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        {
          id: 'inst-1',
          amount: '5000.00',
          status: 'paid',
          student_due_date: '2025-01-20',
          paid_amount: '5000.00',
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            enrollment_id: 'enr-1',
            enrollments: {
              id: 'enr-1',
              student_id: 'stu-1',
              college_id: 'col-1',
              students: {
                id: 'stu-1',
                full_name: 'John Doe',
              },
              colleges: null,
            },
          },
        },
        {
          id: 'inst-2',
          amount: '3000.00',
          status: 'pending',
          student_due_date: '2025-01-20',
          paid_amount: null,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            enrollment_id: 'enr-2',
            enrollments: {
              id: 'enr-2',
              student_id: 'stu-2',
              college_id: 'col-2',
              students: {
                id: 'stu-2',
                full_name: 'Jane Smith',
              },
              colleges: null,
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
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
        'http://localhost:3000/api/cash-flow-projection?groupBy=day',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)

      const dayData = data.data[0]
      expect(dayData.paid_amount).toBe(5000)
      expect(dayData.expected_amount).toBe(3000)
    })

    it('groups by day correctly', async () => {
      const now = new Date('2025-01-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        {
          id: 'inst-1',
          amount: '1000.00',
          status: 'pending',
          student_due_date: '2025-01-20',
          paid_amount: null,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            enrollment_id: 'enr-1',
            enrollments: {
              id: 'enr-1',
              student_id: 'stu-1',
              college_id: 'col-1',
              students: {
                id: 'stu-1',
                full_name: 'John Doe',
              },
              colleges: null,
            },
          },
        },
        {
          id: 'inst-2',
          amount: '2000.00',
          status: 'pending',
          student_due_date: '2025-01-21',
          paid_amount: null,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            enrollment_id: 'enr-2',
            enrollments: {
              id: 'enr-2',
              student_id: 'stu-2',
              college_id: 'col-2',
              students: {
                id: 'stu-2',
                full_name: 'Jane Smith',
              },
              colleges: null,
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
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
        'http://localhost:3000/api/cash-flow-projection?groupBy=day',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2) // Two different days

      expect(data.data[0].date_bucket).toBe('2025-01-20')
      expect(data.data[1].date_bucket).toBe('2025-01-21')
    })

    it('groups by month correctly', async () => {
      const now = new Date('2025-01-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        {
          id: 'inst-1',
          amount: '1000.00',
          status: 'pending',
          student_due_date: '2025-01-20',
          paid_amount: null,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            enrollment_id: 'enr-1',
            enrollments: {
              id: 'enr-1',
              student_id: 'stu-1',
              college_id: 'col-1',
              students: {
                id: 'stu-1',
                full_name: 'John Doe',
              },
              colleges: null,
            },
          },
        },
        {
          id: 'inst-2',
          amount: '2000.00',
          status: 'pending',
          student_due_date: '2025-02-10',
          paid_amount: null,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            enrollment_id: 'enr-2',
            enrollments: {
              id: 'enr-2',
              student_id: 'stu-2',
              college_id: 'col-2',
              students: {
                id: 'stu-2',
                full_name: 'Jane Smith',
              },
              colleges: null,
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
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
        'http://localhost:3000/api/cash-flow-projection?groupBy=month',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2) // Two different months

      expect(data.data[0].date_bucket).toBe('2025-01-01')
      expect(data.data[1].date_bucket).toBe('2025-02-01')
    })

    it('includes installment details in response', async () => {
      const now = new Date('2025-01-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        {
          id: 'inst-1',
          amount: '2500.00',
          status: 'paid',
          student_due_date: '2025-01-20',
          paid_amount: '2500.00',
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            enrollment_id: 'enr-1',
            enrollments: {
              id: 'enr-1',
              student_id: 'stu-1',
              college_id: 'col-1',
              students: {
                id: 'stu-1',
                full_name: 'John Doe',
              },
              colleges: {
                id: 'col-1',
                name: 'University X',
              },
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
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
        'http://localhost:3000/api/cash-flow-projection?groupBy=day',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)

      const dayData = data.data[0]
      expect(dayData.installments).toHaveLength(1)
      expect(dayData.installments[0].student_name).toBe('John Doe')
      expect(dayData.installments[0].amount).toBe(2500)
      expect(dayData.installments[0].status).toBe('paid')
      expect(dayData.installments[0].due_date).toBe('2025-01-20')
      expect(dayData.installments[0].college_name).toBe('University X')
    })

    it('returns empty array when no installments found', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
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
        'http://localhost:3000/api/cash-flow-projection',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('sorts results by date_bucket ascending', async () => {
      const now = new Date('2025-01-15')
      vi.setSystemTime(now)

      const mockInstallments = [
        {
          id: 'inst-2',
          amount: '2000.00',
          status: 'pending',
          student_due_date: '2025-01-25',
          paid_amount: null,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            enrollment_id: 'enr-2',
            enrollments: {
              id: 'enr-2',
              student_id: 'stu-2',
              college_id: 'col-2',
              students: {
                id: 'stu-2',
                full_name: 'Jane Smith',
              },
              colleges: null,
            },
          },
        },
        {
          id: 'inst-1',
          amount: '1000.00',
          status: 'pending',
          student_due_date: '2025-01-20',
          paid_amount: null,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            enrollment_id: 'enr-1',
            enrollments: {
              id: 'enr-1',
              student_id: 'stu-1',
              college_id: 'col-1',
              students: {
                id: 'stu-1',
                full_name: 'John Doe',
              },
              colleges: null,
            },
          },
        },
      ]

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
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
        'http://localhost:3000/api/cash-flow-projection?groupBy=day',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)

      // Should be sorted ascending by date
      expect(data.data[0].date_bucket).toBe('2025-01-20')
      expect(data.data[1].date_bucket).toBe('2025-01-25')
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
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
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
        'http://localhost:3000/api/cash-flow-projection',
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
  })

  describe('Error Handling', () => {
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
        'http://localhost:3000/api/cash-flow-projection',
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
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
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
        'http://localhost:3000/api/cash-flow-projection',
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
