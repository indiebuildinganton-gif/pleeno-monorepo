/**
 * KPI Metrics API Route Tests
 *
 * Tests for the GET /api/kpis endpoint
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 1: Create KPI Metrics API Route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'

// Mock Supabase client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
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

describe('GET /api/kpis', () => {
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
      lte: mockLte,
    })
    mockLte.mockReturnValue({
      single: mockSingle,
    })
  })

  describe('Authentication and Authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      // Mock requireRole to return 401
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest('http://localhost:3000/api/kpis', {
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

      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('not associated with an agency')
    })

    it('allows agency_admin to access KPI metrics', async () => {
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

      // Mock all subsequent queries to return empty data
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0,
            }),
            data: [],
            error: null,
            count: 0,
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('allows agency_user to access KPI metrics', async () => {
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

      // Mock all subsequent queries to return empty data
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0,
            }),
            data: [],
            error: null,
            count: 0,
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('KPI Calculations', () => {
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

    it('calculates active students correctly', async () => {
      // Mock current enrollments
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { student_id: 'student-1' },
                { student_id: 'student-2' },
                { student_id: 'student-1' }, // Duplicate
              ],
              error: null,
            }),
          }),
        }),
      })

      // Mock current payment plans (count)
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 5,
              error: null,
            }),
          }),
        }),
      })

      // Mock outstanding amount
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { total_amount: '10000.00' },
                { total_amount: '15000.50' },
              ],
              error: null,
            }),
          }),
        }),
      })

      // Mock earned commission
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { expected_commission: '1500.00' },
              { expected_commission: '2250.00' },
            ],
            error: null,
          }),
        }),
      })

      // Mock previous month data
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [],
              count: 0,
              error: null,
            }),
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [],
                count: 0,
                error: null,
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.active_students).toBe(2) // Unique students
      expect(data.data.active_payment_plans).toBe(5)
      expect(data.data.outstanding_amount).toBe(25000.5)
      expect(data.data.earned_commission).toBe(3750)
    })

    it('returns zero values when no data exists', async () => {
      // Mock all queries to return empty data
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [],
              count: 0,
              error: null,
            }),
            eq: vi.fn().mockResolvedValue({
              data: [],
              count: 0,
              error: null,
            }),
            single: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.active_students).toBe(0)
      expect(data.data.active_payment_plans).toBe(0)
      expect(data.data.outstanding_amount).toBe(0)
      expect(data.data.earned_commission).toBe(0)
      expect(data.data.collection_rate).toBe(0)
    })
  })

  describe('Trend Calculations', () => {
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

    it('calculates "up" trend when current > previous', async () => {
      // Current month: 3 students
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { student_id: 'student-1' },
                { student_id: 'student-2' },
                { student_id: 'student-3' },
              ],
              error: null,
            }),
          }),
        }),
      })

      // Mock other current metrics
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
          }),
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

      // Previous month: 1 student
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [{ student_id: 'student-1' }],
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock other previous metrics
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [],
              count: 2,
              error: null,
            }),
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [],
                count: 2,
                error: null,
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.trends.active_students).toBe('up')
      expect(data.data.trends.active_payment_plans).toBe('up')
    })

    it('calculates "down" trend when current < previous', async () => {
      // Current month: 1 student
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ student_id: 'student-1' }],
              error: null,
            }),
          }),
        }),
      })

      // Mock other current metrics
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
          }),
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

      // Previous month: 3 students
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [
                  { student_id: 'student-1' },
                  { student_id: 'student-2' },
                  { student_id: 'student-3' },
                ],
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock other previous metrics
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [],
              count: 5,
              error: null,
            }),
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [],
                count: 5,
                error: null,
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.trends.active_students).toBe('down')
      expect(data.data.trends.active_payment_plans).toBe('down')
    })

    it('calculates "neutral" trend when current === previous', async () => {
      // Current month: 2 students
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ student_id: 'student-1' }, { student_id: 'student-2' }],
              error: null,
            }),
          }),
        }),
      })

      // Mock other current metrics
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
          }),
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

      // Previous month: 2 students (same)
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [{ student_id: 'student-1' }, { student_id: 'student-2' }],
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock other previous metrics
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [],
              count: 3,
              error: null,
            }),
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [],
                count: 3,
                error: null,
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.trends.active_students).toBe('neutral')
      expect(data.data.trends.active_payment_plans).toBe('neutral')
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

      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('handles enrollments query error', async () => {
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

      // Mock enrollments query to fail
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query failed', code: 'QUERY_ERROR' },
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

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

      // Mock all queries to return empty data
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [],
              count: 0,
              error: null,
            }),
            eq: vi.fn().mockResolvedValue({
              data: [],
              count: 0,
              error: null,
            }),
          }),
        }),
      })
    })

    it('returns correct response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('active_students')
      expect(data.data).toHaveProperty('active_payment_plans')
      expect(data.data).toHaveProperty('outstanding_amount')
      expect(data.data).toHaveProperty('earned_commission')
      expect(data.data).toHaveProperty('collection_rate')
      expect(data.data).toHaveProperty('trends')
      expect(data.data.trends).toHaveProperty('active_students')
      expect(data.data.trends).toHaveProperty('active_payment_plans')
      expect(data.data.trends).toHaveProperty('outstanding_amount')
      expect(data.data.trends).toHaveProperty('earned_commission')
      expect(data.data.trends).toHaveProperty('collection_rate')
    })

    it('returns numeric values for metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(typeof data.data.active_students).toBe('number')
      expect(typeof data.data.active_payment_plans).toBe('number')
      expect(typeof data.data.outstanding_amount).toBe('number')
      expect(typeof data.data.earned_commission).toBe('number')
      expect(typeof data.data.collection_rate).toBe('number')
    })

    it('returns valid trend values', async () => {
      const request = new NextRequest('http://localhost:3000/api/kpis', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      const validTrends = ['up', 'down', 'neutral']
      expect(validTrends).toContain(data.data.trends.active_students)
      expect(validTrends).toContain(data.data.trends.active_payment_plans)
      expect(validTrends).toContain(data.data.trends.outstanding_amount)
      expect(validTrends).toContain(data.data.trends.earned_commission)
      expect(validTrends).toContain(data.data.trends.collection_rate)
    })
  })
})
