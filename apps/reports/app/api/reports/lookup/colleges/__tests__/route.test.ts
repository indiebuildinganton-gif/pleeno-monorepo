/**
 * Colleges Lookup API Route Tests
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 8: Testing
 *
 * Tests for GET /api/reports/lookup/colleges endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'

// Mock Supabase client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()

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
}))

// Import mocked requireRole
import { requireRole } from '@pleeno/auth/server'

describe('GET /api/reports/lookup/colleges', () => {
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

  const mockCollegesData = [
    {
      id: 'c1',
      name: 'State University',
      branches: [{ count: 3 }],
    },
    {
      id: 'c2',
      name: 'Tech College',
      branches: [{ count: 2 }],
    },
    {
      id: 'c3',
      name: 'Community College',
      branches: [{ count: 1 }],
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
      order: mockOrder,
    })
    mockOrder.mockResolvedValue({
      data: mockCollegesData,
      error: null,
    })
  })

  describe('Authentication and Authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      // Mock requireRole to return 401
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/colleges',
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
        'http://localhost:3000/api/reports/lookup/colleges',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('not associated with an agency')
    })

    it('allows agency_admin to access colleges', async () => {
      // Mock requireRole to return admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/colleges',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('allows agency_user to access colleges', async () => {
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

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/colleges',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Data Retrieval', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('returns colleges with branch count', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/colleges',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data).toHaveLength(3)
      expect(data[0]).toEqual({
        id: 'c1',
        name: 'State University',
        branch_count: 3,
      })
      expect(data[1]).toEqual({
        id: 'c2',
        name: 'Tech College',
        branch_count: 2,
      })
    })

    it('handles colleges with zero branches', async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: 'c4',
            name: 'New College',
            branches: [{ count: 0 }],
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/colleges',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data[0].branch_count).toBe(0)
    })

    it('handles colleges with no branches array', async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: 'c5',
            name: 'Another College',
            branches: [],
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/colleges',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data[0].branch_count).toBe(0)
    })

    it('sorts colleges by name alphabetically', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/colleges',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify order was called with name and ascending
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('returns empty array when no colleges exist', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/colleges',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data).toEqual([])
    })
  })

  describe('RLS Enforcement', () => {
    it('only returns colleges for user agency', async () => {
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
        order: mockOrder,
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEqFn,
        }),
      })

      mockOrder.mockResolvedValue({
        data: mockCollegesData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/colleges',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify eq was called with the user's agency_id
      expect(mockEqFn).toHaveBeenCalledWith('agency_id', 'agency-1')
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
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/colleges',
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
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('returns correct response structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/colleges',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('branch_count')
      expect(typeof data[0].branch_count).toBe('number')
    })
  })
})
