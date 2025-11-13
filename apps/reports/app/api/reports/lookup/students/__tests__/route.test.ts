/**
 * Students Lookup API Route Tests
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 8: Testing
 *
 * Tests for GET /api/reports/lookup/students endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'

// Mock Supabase client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockIlike = vi.fn()
const mockLimit = vi.fn()
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
  ValidationError: class ValidationError extends Error {
    constructor(message: string, public details?: any) {
      super(message)
      this.name = 'ValidationError'
    }
  },
}))

// Import mocked requireRole
import { requireRole } from '@pleeno/auth'

describe('GET /api/reports/lookup/students', () => {
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

  const mockStudentsData = [
    {
      id: 's1',
      name: 'John Doe',
      enrollments: [
        {
          branches: {
            colleges: {
              name: 'State University',
            },
          },
        },
      ],
    },
    {
      id: 's2',
      name: 'Jane Smith',
      enrollments: [
        {
          branches: {
            colleges: {
              name: 'Tech College',
            },
          },
        },
      ],
    },
    {
      id: 's3',
      name: 'Bob Johnson',
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
      ilike: mockIlike,
    })
    mockIlike.mockReturnValue({
      limit: mockLimit,
    })
    mockLimit.mockReturnValue({
      order: mockOrder,
    })
    mockOrder.mockResolvedValue({
      data: mockStudentsData,
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
        'http://localhost:3000/api/reports/lookup/students?search=John',
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
        'http://localhost:3000/api/reports/lookup/students?search=John',
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

    it('allows agency_admin to access students', async () => {
      // Mock requireRole to return admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=John',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('allows agency_user to access students', async () => {
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
        'http://localhost:3000/api/reports/lookup/students?search=John',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Search Validation', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('rejects search with less than 2 characters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=J',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('at least 2 characters')
    })

    it('rejects request with no search parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('accepts search with exactly 2 characters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=Jo',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('accepts search with more than 2 characters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=John',
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

    it('searches students by name (case-insensitive)', async () => {
      const mockIlikeFn = vi.fn().mockReturnValue({
        limit: mockLimit,
      })

      mockEq.mockReturnValue({
        ilike: mockIlikeFn,
      })

      mockLimit.mockReturnValue({
        order: mockOrder,
      })

      mockOrder.mockResolvedValue({
        data: [mockStudentsData[0]],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=John',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify ilike was called with search pattern
      expect(mockIlikeFn).toHaveBeenCalledWith('name', '%John%')
    })

    it('limits results to 50', async () => {
      const mockLimitFn = vi.fn().mockReturnValue({
        order: mockOrder,
      })

      mockIlike.mockReturnValue({
        limit: mockLimitFn,
      })

      mockOrder.mockResolvedValue({
        data: mockStudentsData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=John',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify limit was called with 50
      expect(mockLimitFn).toHaveBeenCalledWith(50)
    })

    it('includes college name from enrollment', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=John',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data[0]).toEqual({
        id: 's1',
        name: 'John Doe',
        college_name: 'State University',
      })
      expect(data[1]).toEqual({
        id: 's2',
        name: 'Jane Smith',
        college_name: 'Tech College',
      })
    })

    it('handles students with no enrollments', async () => {
      mockOrder.mockResolvedValue({
        data: [mockStudentsData[2]],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=Bob',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data[0]).toEqual({
        id: 's3',
        name: 'Bob Johnson',
        college_name: 'N/A',
      })
    })

    it('handles students with missing college data', async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: 's4',
            name: 'Alice Williams',
            enrollments: [
              {
                branches: null,
              },
            ],
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=Alice',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data[0].college_name).toBe('N/A')
    })

    it('sorts students by name alphabetically', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=John',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify order was called with name and ascending
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('returns empty array when no students match', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=NonExistent',
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
    it('only returns students for user agency', async () => {
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
        ilike: mockIlike,
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEqFn,
        }),
      })

      mockIlike.mockReturnValue({
        limit: mockLimit,
      })
      mockLimit.mockReturnValue({
        order: mockOrder,
      })
      mockOrder.mockResolvedValue({
        data: mockStudentsData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=John',
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
        'http://localhost:3000/api/reports/lookup/students?search=John',
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
        'http://localhost:3000/api/reports/lookup/students?search=John',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('college_name')
      expect(typeof data[0].name).toBe('string')
      expect(typeof data[0].college_name).toBe('string')
    })

    it('uses first enrollment college when multiple enrollments exist', async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: 's5',
            name: 'Charlie Brown',
            enrollments: [
              {
                branches: {
                  colleges: {
                    name: 'First College',
                  },
                },
              },
              {
                branches: {
                  colleges: {
                    name: 'Second College',
                  },
                },
              },
            ],
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/lookup/students?search=Charlie',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const data = await response.json()

      // Should use the first enrollment's college
      expect(data[0].college_name).toBe('First College')
    })
  })
})
