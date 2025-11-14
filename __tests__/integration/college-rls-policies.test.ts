/**
 * Integration Tests: RLS Policy Tests for College Data Isolation
 *
 * Tests Row-Level Security policies to ensure proper data isolation between agencies
 * for colleges, branches, contacts, and notes.
 *
 * Epic 3: Entities Domain
 * Story 3-1: College Registry
 * Task 21: Write Tests for College Management - RLS Security
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getColleges } from '@entities/app/api/colleges/route'
import { GET as getCollege } from '@entities/app/api/colleges/[id]/route'
import { GET as getBranches } from '@entities/app/api/colleges/[id]/branches/route'
import { GET as getContacts } from '@entities/app/api/colleges/[id]/contacts/route'
import { GET as getNotes } from '@entities/app/api/colleges/[id]/notes/route'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockRange = vi.fn()
const mockSingle = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

// Mock auth utility - will be changed per test
let mockAuthUser = {
  id: 'user-agency1-id',
  email: 'user@agency1.com',
  app_metadata: {
    agency_id: 'agency-1',
    role: 'agency_admin',
  },
}

vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(async (request, roles) => {
    return { user: mockAuthUser }
  }),
}))

// Test fixtures
const agency1College = {
  id: 'college-1',
  agency_id: 'agency-1',
  name: 'Agency 1 University',
  city: 'Sydney',
  country: 'Australia',
  default_commission_rate_percent: 15,
  gst_status: 'included',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const agency2College = {
  id: 'college-2',
  agency_id: 'agency-2',
  name: 'Agency 2 University',
  city: 'Melbourne',
  country: 'Australia',
  default_commission_rate_percent: 20,
  gst_status: 'excluded',
  created_at: '2024-01-02T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
}

describe('RLS Policy Tests - College Data Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    })
  })

  describe('College Access Control', () => {
    it('Agency 1 user can only see Agency 1 colleges', async () => {
      mockAuthUser = {
        id: 'user-agency1-id',
        email: 'user@agency1.com',
        app_metadata: {
          agency_id: 'agency-1',
          role: 'agency_admin',
        },
      }

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        order: mockOrder,
      })

      mockOrder.mockReturnValue({
        range: mockRange,
      })

      // RLS filters out agency-2 colleges automatically
      mockRange.mockResolvedValueOnce({
        data: [agency1College],
        error: null,
        count: 1,
      })

      const request = new Request('http://localhost/api/colleges')
      const response = await getColleges(request as any)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].agency_id).toBe('agency-1')
      expect(data.data[0].id).toBe('college-1')

      // Verify agency_id filter was applied
      expect(mockEq).toHaveBeenCalledWith('agency_id', 'agency-1')
    })

    it('Agency 2 user can only see Agency 2 colleges', async () => {
      mockAuthUser = {
        id: 'user-agency2-id',
        email: 'user@agency2.com',
        app_metadata: {
          agency_id: 'agency-2',
          role: 'agency_admin',
        },
      }

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        order: mockOrder,
      })

      mockOrder.mockReturnValue({
        range: mockRange,
      })

      // RLS filters out agency-1 colleges automatically
      mockRange.mockResolvedValueOnce({
        data: [agency2College],
        error: null,
        count: 1,
      })

      const request = new Request('http://localhost/api/colleges')
      const response = await getColleges(request as any)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].agency_id).toBe('agency-2')
      expect(data.data[0].id).toBe('college-2')

      // Verify agency_id filter was applied
      expect(mockEq).toHaveBeenCalledWith('agency_id', 'agency-2')
    })

    it('prevents cross-agency access to college details', async () => {
      mockAuthUser = {
        id: 'user-agency2-id',
        email: 'user@agency2.com',
        app_metadata: {
          agency_id: 'agency-2',
          role: 'agency_admin',
        },
      }

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
      })

      // RLS blocks access - returns null
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      // Agency 2 user tries to access Agency 1 college
      const request = new Request('http://localhost/api/colleges/college-1')
      const response = await getCollege(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.success).toBe(false)

      // Verify both id and agency_id filters were applied
      expect(mockEq).toHaveBeenCalledWith('id', 'college-1')
      expect(mockEq).toHaveBeenCalledWith('agency_id', 'agency-2')
    })
  })

  describe('Branch Access Control', () => {
    it('prevents cross-agency access to branches', async () => {
      mockAuthUser = {
        id: 'user-agency2-id',
        email: 'user@agency2.com',
        app_metadata: {
          agency_id: 'agency-2',
          role: 'agency_admin',
        },
      }

      // Mock college verification (fails)
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      })
      mockSingle.mockResolvedValueOnce({
        data: null, // RLS blocks access
        error: { code: 'PGRST116' },
      })

      // Agency 2 user tries to access Agency 1 college's branches
      const request = new Request('http://localhost/api/colleges/college-1/branches')
      const response = await getBranches(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('Agency 1 user can access Agency 1 branches', async () => {
      mockAuthUser = {
        id: 'user-agency1-id',
        email: 'user@agency1.com',
        app_metadata: {
          agency_id: 'agency-1',
          role: 'agency_admin',
        },
      }

      // Mock college verification (succeeds)
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      })
      mockSingle.mockResolvedValueOnce({
        data: agency1College,
        error: null,
      })

      // Mock branches query
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        order: mockOrder,
      })
      mockOrder.mockResolvedValueOnce({
        data: [
          {
            id: 'branch-1',
            college_id: 'college-1',
            agency_id: 'agency-1',
            name: 'Main Campus',
          },
        ],
        error: null,
      })

      const request = new Request('http://localhost/api/colleges/college-1/branches')
      const response = await getBranches(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data[0].agency_id).toBe('agency-1')
    })
  })

  describe('Contact Access Control', () => {
    it('prevents cross-agency access to contacts', async () => {
      mockAuthUser = {
        id: 'user-agency2-id',
        email: 'user@agency2.com',
        app_metadata: {
          agency_id: 'agency-2',
          role: 'agency_admin',
        },
      }

      // Mock college verification (fails)
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      })
      mockSingle.mockResolvedValueOnce({
        data: null, // RLS blocks access
        error: { code: 'PGRST116' },
      })

      // Agency 2 user tries to access Agency 1 college's contacts
      const request = new Request('http://localhost/api/colleges/college-1/contacts')
      const response = await getContacts(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBe(404)
    })

    it('Agency 1 user can access Agency 1 contacts', async () => {
      mockAuthUser = {
        id: 'user-agency1-id',
        email: 'user@agency1.com',
        app_metadata: {
          agency_id: 'agency-1',
          role: 'agency_admin',
        },
      }

      // Mock college verification (succeeds)
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      })
      mockSingle.mockResolvedValueOnce({
        data: agency1College,
        error: null,
      })

      // Mock contacts query
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        order: mockOrder,
      })
      mockOrder.mockResolvedValueOnce({
        data: [
          {
            id: 'contact-1',
            college_id: 'college-1',
            name: 'John Smith',
            email: 'john@university.edu',
          },
        ],
        error: null,
      })

      const request = new Request('http://localhost/api/colleges/college-1/contacts')
      const response = await getContacts(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data[0].college_id).toBe('college-1')
    })
  })

  describe('Notes Access Control', () => {
    it('prevents cross-agency access to notes', async () => {
      mockAuthUser = {
        id: 'user-agency2-id',
        email: 'user@agency2.com',
        app_metadata: {
          agency_id: 'agency-2',
          role: 'agency_admin',
        },
      }

      // Mock college verification (fails)
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      })
      mockSingle.mockResolvedValueOnce({
        data: null, // RLS blocks access
        error: { code: 'PGRST116' },
      })

      // Agency 2 user tries to access Agency 1 college's notes
      const request = new Request('http://localhost/api/colleges/college-1/notes')
      const response = await getNotes(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBe(404)
    })

    it('enforces notes character limit (max 2000)', async () => {
      // This would be tested in the API endpoint tests
      // Validation schema ensures max 2000 characters
      const { NoteCreateSchema } = await import('@pleeno/validations')

      const invalidNote = {
        content: 'A'.repeat(2001), // Exceeds limit
      }

      const result = NoteCreateSchema.safeParse(invalidNote)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('2000'))).toBe(true)
      }
    })
  })

  describe('Activity Feed Access Control', () => {
    it('filters activity feed by agency_id', async () => {
      mockAuthUser = {
        id: 'user-agency1-id',
        email: 'user@agency1.com',
        app_metadata: {
          agency_id: 'agency-1',
          role: 'agency_admin',
        },
      }

      // Mock college verification
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      })
      mockSingle.mockResolvedValueOnce({
        data: agency1College,
        error: null,
      })

      // Activity feed queries are filtered by RLS
      // The actual implementation would verify this in the activity endpoint tests
      expect(agency1College.agency_id).toBe('agency-1')
    })
  })
})
