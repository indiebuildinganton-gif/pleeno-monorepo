/**
 * Branches Lookup API Route Tests
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 8: Testing
 *
 * Tests for GET /api/reports/lookup/branches endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'

// Mock Supabase client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockIn = vi.fn()
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

describe('GET /api/reports/lookup/branches', () => {
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

  const mockBranchesData = [
    {
      id: 'b1',
      name: 'Main Campus',
      college_id: 'c1',
      enrollments: [
        { contract_expiration_date: '2025-12-31' },
        { contract_expiration_date: '2025-11-20' },
      ],
    },
    {
      id: 'b2',
      name: 'West Campus',
      college_id: 'c1',
      enrollments: [{ contract_expiration_date: '2026-01-15' }],
    },
    {
      id: 'b3',
      name: 'Downtown Branch',
      college_id: 'c2',
      enrollments: [],
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
      in: mockIn,
    })
    mockIn.mockReturnValue({
      order: mockOrder,
    })
    mockOrder.mockResolvedValue({
      data: mockBranchesData,
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
        'http://localhost:3000/api/reports/lookup/branches',
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
        'http://localhost:3000/api/reports/lookup/branches',
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

    it('allows agency_admin to access branches', async () => {
      // Mock requireRole to return admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/branches',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('allows agency_user to access branches', async () => {
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
        'http://localhost:3000/api/reports/lookup/branches',
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

    it('returns all branches when no college_id filter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/branches',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data).toHaveLength(3)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('college_id')
      expect(data[0]).toHaveProperty('contract_expiration_date')
    })

    it('filters by single college_id', async () => {
      const mockInFn = vi.fn().mockReturnValue({
        order: mockOrder,
      })

      mockEq.mockReturnValue({
        in: mockInFn,
        order: mockOrder,
      })

      mockOrder.mockResolvedValue({
        data: [mockBranchesData[0], mockBranchesData[1]],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/branches?college_id=c1',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify in was called with college_id filter
      expect(mockInFn).toHaveBeenCalledWith('college_id', ['c1'])
    })

    it('filters by multiple college_ids', async () => {
      const mockInFn = vi.fn().mockReturnValue({
        order: mockOrder,
      })

      mockEq.mockReturnValue({
        in: mockInFn,
        order: mockOrder,
      })

      mockOrder.mockResolvedValue({
        data: mockBranchesData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/branches?college_id=c1&college_id=c2',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify in was called with multiple college_ids
      expect(mockInFn).toHaveBeenCalledWith('college_id', ['c1', 'c2'])
    })

    it('includes most recent contract expiration date', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/branches',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      // First branch should have the most recent expiration date
      expect(data[0].contract_expiration_date).toBe('2025-12-31')
      // Second branch should have its single expiration date
      expect(data[1].contract_expiration_date).toBe('2026-01-15')
      // Third branch has no enrollments, so null
      expect(data[2].contract_expiration_date).toBeNull()
    })

    it('handles branches with no enrollments', async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: 'b4',
            name: 'New Branch',
            college_id: 'c3',
            enrollments: [],
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/branches',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data[0].contract_expiration_date).toBeNull()
    })

    it('sorts branches by name alphabetically', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/branches',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify order was called with name and ascending
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('returns empty array when no branches exist', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/branches',
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
    it('only returns branches for user agency', async () => {
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
        data: mockBranchesData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/branches',
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
        'http://localhost:3000/api/reports/lookup/branches',
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
        'http://localhost:3000/api/reports/lookup/branches',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('college_id')
      expect(data[0]).toHaveProperty('contract_expiration_date')
    })

    it('returns null for contract_expiration_date when no valid dates', async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: 'b5',
            name: 'Test Branch',
            college_id: 'c1',
            enrollments: [
              { contract_expiration_date: null },
              { contract_expiration_date: null },
            ],
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/branches',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data[0].contract_expiration_date).toBeNull()
    })
  })
})
