/**
 * Payment Status Summary API Route Tests
 *
 * Tests for the GET /api/dashboard/payment-status-summary endpoint
 * Epic 5: Payment Plans & Installment Tracking
 * Story 5.4: Payment Status Dashboard Widget
 * Task 5: Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'

// Mock Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabaseQueries: any[]

const createMockSupabase = () => {
  mockSupabaseQueries = []

  return {
    from: (table: string) => {
      const query = {
        select: (_columns: string) => {
          const selectQuery = {
            eq: (_column: string, _value: string) => {
              if (table === 'agencies') {
                return {
                  single: () => mockSupabaseQueries.shift() || { data: null, error: null },
                }
              }
              // For installments queries
              return {
                eq: (_column2: string, _value2: string) => {
                  // Check if this is a query with gte/lte (due_soon query)
                  const result = mockSupabaseQueries.shift()
                  if (result && result.hasGte) {
                    return {
                      gte: () => ({
                        lte: () => result,
                      }),
                    }
                  }
                  return result || { data: [], error: null }
                },
                gte: (_column2: string, _value2: string) => ({
                  data: mockSupabaseQueries.shift() || [],
                  error: null,
                }),
              }
            },
          }
          return selectQuery
        },
      }
      return query
    },
    auth: {
      getUser: vi.fn(),
    },
  }
}

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => createMockSupabase()),
}))

// Mock requireRole from @pleeno/auth
vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(),
}))

// Import mocked requireRole
import { requireRole } from '@pleeno/auth/server'

describe('GET /api/dashboard/payment-status-summary', () => {
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
    mockSupabaseQueries = []
  })

  describe('Authentication and Authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      // Mock requireRole to return 401
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
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
        'http://localhost:3000/api/dashboard/payment-status-summary',
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

    it('allows agency_admin to access payment status summary', async () => {
      // Mock requireRole to return admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      // Setup query results
      mockSupabaseQueries = [
        { data: mockAgency, error: null }, // Agency fetch
        { data: [], error: null }, // Pending
        { data: [], error: null, hasGte: true }, // Due soon
        { data: [], error: null }, // Overdue
        { data: [], error: null }, // Paid
      ]

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('allows agency_user to access payment status summary', async () => {
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

      // Setup query results
      mockSupabaseQueries = [
        { data: mockAgency, error: null }, // Agency fetch
        { data: [], error: null }, // Pending
        { data: [], error: null, hasGte: true }, // Due soon
        { data: [], error: null }, // Overdue
        { data: [], error: null }, // Paid
      ]

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Payment Status Calculations', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('calculates pending installments correctly', async () => {
      // Setup query results
      mockSupabaseQueries = [
        { data: mockAgency, error: null }, // Agency fetch
        {
          data: [{ amount: '1000.00' }, { amount: '2000.50' }, { amount: '3000.00' }],
          error: null,
        }, // Pending
        { data: [], error: null, hasGte: true }, // Due soon
        { data: [], error: null }, // Overdue
        { data: [], error: null }, // Paid
      ]

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.pending.count).toBe(3)
      expect(data.data.pending.total_amount).toBe(6000.5)
    })

    it('calculates due soon installments correctly', async () => {
      // Setup query results
      mockSupabaseQueries = [
        { data: mockAgency, error: null }, // Agency fetch
        { data: [], error: null }, // Pending
        {
          data: [{ amount: '500.00' }, { amount: '750.25' }],
          error: null,
          hasGte: true,
        }, // Due soon
        { data: [], error: null }, // Overdue
        { data: [], error: null }, // Paid
      ]

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.due_soon.count).toBe(2)
      expect(data.data.due_soon.total_amount).toBe(1250.25)
    })

    it('calculates overdue installments correctly', async () => {
      // Setup query results
      mockSupabaseQueries = [
        { data: mockAgency, error: null }, // Agency fetch
        { data: [], error: null }, // Pending
        { data: [], error: null, hasGte: true }, // Due soon
        {
          data: [{ amount: '1500.00' }, { amount: '2500.00' }, { amount: '3000.00' }],
          error: null,
        }, // Overdue
        { data: [], error: null }, // Paid
      ]

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.overdue.count).toBe(3)
      expect(data.data.overdue.total_amount).toBe(7000)
    })

    it('calculates paid this month installments correctly', async () => {
      // Setup query results
      mockSupabaseQueries = [
        { data: mockAgency, error: null }, // Agency fetch
        { data: [], error: null }, // Pending
        { data: [], error: null, hasGte: true }, // Due soon
        { data: [], error: null }, // Overdue
        {
          data: [
            { amount: '5000.00' },
            { amount: '7500.50' },
            { amount: '10000.00' },
            { amount: '12000.00' },
          ],
          error: null,
        }, // Paid
      ]

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.paid_this_month.count).toBe(4)
      expect(data.data.paid_this_month.total_amount).toBe(34500.5)
    })

    it('returns zero values when no data exists', async () => {
      // Setup query results
      mockSupabaseQueries = [
        { data: mockAgency, error: null }, // Agency fetch
        { data: [], error: null }, // Pending
        { data: [], error: null, hasGte: true }, // Due soon
        { data: [], error: null }, // Overdue
        { data: [], error: null }, // Paid
      ]

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.pending.count).toBe(0)
      expect(data.data.pending.total_amount).toBe(0)
      expect(data.data.due_soon.count).toBe(0)
      expect(data.data.due_soon.total_amount).toBe(0)
      expect(data.data.overdue.count).toBe(0)
      expect(data.data.overdue.total_amount).toBe(0)
      expect(data.data.paid_this_month.count).toBe(0)
      expect(data.data.paid_this_month.total_amount).toBe(0)
    })

    it('rounds amounts to 2 decimal places', async () => {
      // Setup query results
      mockSupabaseQueries = [
        { data: mockAgency, error: null }, // Agency fetch
        {
          data: [{ amount: '1000.123' }, { amount: '2000.456' }],
          error: null,
        }, // Pending
        { data: [], error: null, hasGte: true }, // Due soon
        { data: [], error: null }, // Overdue
        { data: [], error: null }, // Paid
      ]

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      // 1000.123 + 2000.456 = 3000.579, rounded to 3000.58
      expect(data.data.pending.total_amount).toBe(3000.58)
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
      // Setup query results with error
      mockSupabaseQueries = [
        {
          data: null,
          error: { message: 'Database error', code: 'DB_ERROR' },
        }, // Agency fetch error
      ]

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('handles pending installments query error', async () => {
      // Setup query results
      mockSupabaseQueries = [
        { data: mockAgency, error: null }, // Agency fetch success
        {
          data: null,
          error: { message: 'Query failed', code: 'QUERY_ERROR' },
        }, // Pending query error
      ]

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('handles due soon installments query error', async () => {
      // Setup query results
      mockSupabaseQueries = [
        { data: mockAgency, error: null }, // Agency fetch success
        { data: [], error: null }, // Pending success
        {
          data: null,
          error: { message: 'Query failed', code: 'QUERY_ERROR' },
          hasGte: true,
        }, // Due soon query error
      ]

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
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

  describe('Response Format', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      // Setup query results
      mockSupabaseQueries = [
        { data: mockAgency, error: null }, // Agency fetch
        { data: [], error: null }, // Pending
        { data: [], error: null, hasGte: true }, // Due soon
        { data: [], error: null }, // Overdue
        { data: [], error: null }, // Paid
      ]
    })

    it('returns correct response structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('pending')
      expect(data.data).toHaveProperty('due_soon')
      expect(data.data).toHaveProperty('overdue')
      expect(data.data).toHaveProperty('paid_this_month')
    })

    it('returns numeric values for counts and amounts', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(typeof data.data.pending.count).toBe('number')
      expect(typeof data.data.pending.total_amount).toBe('number')
      expect(typeof data.data.due_soon.count).toBe('number')
      expect(typeof data.data.due_soon.total_amount).toBe('number')
      expect(typeof data.data.overdue.count).toBe('number')
      expect(typeof data.data.overdue.total_amount).toBe('number')
      expect(typeof data.data.paid_this_month.count).toBe('number')
      expect(typeof data.data.paid_this_month.total_amount).toBe('number')
    })

    it('includes all required category properties', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/payment-status-summary',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()

      // Check pending category
      expect(data.data.pending).toHaveProperty('count')
      expect(data.data.pending).toHaveProperty('total_amount')

      // Check due_soon category
      expect(data.data.due_soon).toHaveProperty('count')
      expect(data.data.due_soon).toHaveProperty('total_amount')

      // Check overdue category
      expect(data.data.overdue).toHaveProperty('count')
      expect(data.data.overdue).toHaveProperty('total_amount')

      // Check paid_this_month category
      expect(data.data.paid_this_month).toHaveProperty('count')
      expect(data.data.paid_this_month).toHaveProperty('total_amount')
    })
  })
})
