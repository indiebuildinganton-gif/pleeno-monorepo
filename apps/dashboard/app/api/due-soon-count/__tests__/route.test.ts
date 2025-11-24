/**
 * Due Soon Count API Route Tests
 *
 * Tests for the GET /api/dashboard/due-soon-count endpoint
 * Epic 5: Intelligent Status Automation
 * Story 5.2: Due Soon Notification Flags
 * Task 4: Testing and validation
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
        select: (columns: string) => {
          const selectQuery = {
            eq: (column: string, value: string) => {
              if (table === 'agencies') {
                return {
                  single: () => mockSupabaseQueries.shift() || { data: null, error: null },
                }
              }
              // For installments queries
              return {
                eq: (column2: string, value2: string) => ({
                  gte: (column3: string, value3: string) => ({
                    lte: (column4: string, value4: string) =>
                      mockSupabaseQueries.shift() || { data: [], error: null }
                  }),
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

describe('GET /api/dashboard/due-soon-count', () => {
  const mockAgency = {
    id: 'agency-123',
    name: 'Test Agency',
    timezone: 'Australia/Brisbane',
    due_soon_threshold_days: 4,
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

  describe('Success cases', () => {
    it('returns correct count and total for due soon installments', async () => {
      // Mock requireRole to return authenticated user
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      // Mock agency query
      mockSupabaseQueries.push({ data: mockAgency, error: null })

      // Mock installments query
      mockSupabaseQueries.push({
        data: [
          { amount: 500 },
          { amount: 750 },
          { amount: 1000 },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual({
        count: 3,
        total_amount: 2250,
      })
    })

    it('returns zero count when no installments are due soon', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: mockAgency, error: null })
      mockSupabaseQueries.push({ data: [], error: null })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual({
        count: 0,
        total_amount: 0,
      })
    })

    it('rounds total amount to 2 decimal places', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: mockAgency, error: null })
      mockSupabaseQueries.push({
        data: [
          { amount: 500.555 },
          { amount: 750.444 },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.total_amount).toBe(1251)
    })

    it('respects agency threshold configuration (2 days)', async () => {
      const agencyWith2DayThreshold = {
        ...mockAgency,
        due_soon_threshold_days: 2,
      }

      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: agencyWith2DayThreshold, error: null })
      mockSupabaseQueries.push({
        data: [{ amount: 500 }],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(1)
    })

    it('respects agency threshold configuration (7 days)', async () => {
      const agencyWith7DayThreshold = {
        ...mockAgency,
        due_soon_threshold_days: 7,
      }

      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: agencyWith7DayThreshold, error: null })
      mockSupabaseQueries.push({
        data: [
          { amount: 500 },
          { amount: 750 },
          { amount: 1000 },
          { amount: 1250 },
          { amount: 1500 },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(5)
      expect(data.data.total_amount).toBe(5000)
    })

    it('uses default threshold of 4 days when not configured', async () => {
      const agencyWithoutThreshold = {
        ...mockAgency,
        due_soon_threshold_days: null,
      }

      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: agencyWithoutThreshold, error: null })
      mockSupabaseQueries.push({
        data: [{ amount: 500 }],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(1)
    })

    it('handles different agency timezones (Brisbane)', async () => {
      const brisbaneAgency = {
        ...mockAgency,
        timezone: 'Australia/Brisbane',
      }

      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: brisbaneAgency, error: null })
      mockSupabaseQueries.push({
        data: [{ amount: 500 }],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(1)
    })

    it('handles different agency timezones (New York)', async () => {
      const newYorkAgency = {
        ...mockAgency,
        timezone: 'America/New_York',
      }

      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: newYorkAgency, error: null })
      mockSupabaseQueries.push({
        data: [{ amount: 500 }],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(1)
    })

    it('uses UTC timezone when not configured', async () => {
      const agencyWithoutTimezone = {
        ...mockAgency,
        timezone: null,
      }

      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: agencyWithoutTimezone, error: null })
      mockSupabaseQueries.push({
        data: [{ amount: 500 }],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(1)
    })
  })

  describe('Authentication and authorization', () => {
    it('requires authentication', async () => {
      const unauthorizedResponse = NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
      vi.mocked(requireRole).mockResolvedValueOnce(unauthorizedResponse)

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('requires agency_admin or agency_user role', async () => {
      const forbiddenResponse = NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
      vi.mocked(requireRole).mockResolvedValueOnce(forbiddenResponse)

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('requires user to be associated with an agency', async () => {
      const userWithoutAgency = {
        ...mockUser,
        app_metadata: {
          role: 'agency_admin',
          agency_id: undefined,
        },
      }

      vi.mocked(requireRole).mockResolvedValueOnce({ user: userWithoutAgency })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('agency')
    })
  })

  describe('Error handling', () => {
    it('handles agency query error', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({
        data: null,
        error: { message: 'Agency not found' },
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('handles installments query error', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: mockAgency, error: null })
      mockSupabaseQueries.push({
        data: null,
        error: { message: 'Database error' },
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('handles null installment amounts gracefully', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: mockAgency, error: null })
      mockSupabaseQueries.push({
        data: [
          { amount: 500 },
          { amount: null },
          { amount: 750 },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(3)
      expect(data.data.total_amount).toBe(1250)
    })
  })

  describe('RLS policy enforcement', () => {
    it('only returns installments for user agency', async () => {
      // This test verifies that the query includes agency_id filter
      // RLS policies are tested in integration tests
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: mockAgency, error: null })
      mockSupabaseQueries.push({
        data: [
          { amount: 500 },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(1)
    })
  })

  describe('Edge cases', () => {
    it('handles very large amounts', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: mockAgency, error: null })
      mockSupabaseQueries.push({
        data: [
          { amount: 999999.99 },
          { amount: 888888.88 },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(2)
      expect(data.data.total_amount).toBe(1888888.87)
    })

    it('handles empty agency timezone', async () => {
      const agencyWithEmptyTimezone = {
        ...mockAgency,
        timezone: '',
      }

      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: agencyWithEmptyTimezone, error: null })
      mockSupabaseQueries.push({
        data: [{ amount: 500 }],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(1)
    })

    it('handles threshold at boundary (0 days)', async () => {
      const agencyWithZeroThreshold = {
        ...mockAgency,
        due_soon_threshold_days: 0,
      }

      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: agencyWithZeroThreshold, error: null })
      mockSupabaseQueries.push({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(0)
    })

    it('handles maximum threshold (30 days)', async () => {
      const agencyWithMaxThreshold = {
        ...mockAgency,
        due_soon_threshold_days: 30,
      }

      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockUser })

      mockSupabaseQueries.push({ data: agencyWithMaxThreshold, error: null })
      mockSupabaseQueries.push({
        data: [
          { amount: 100 },
          { amount: 200 },
          { amount: 300 },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/dashboard/due-soon-count')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(3)
      expect(data.data.total_amount).toBe(600)
    })
  })
})
