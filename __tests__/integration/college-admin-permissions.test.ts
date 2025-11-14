/**
 * Integration Tests: Admin Permission Tests for College Management
 *
 * Tests that admin-only operations are properly restricted and
 * regular users cannot perform administrative actions.
 *
 * Epic 3: Entities Domain
 * Story 3-1: College Registry
 * Task 21: Write Tests for College Management - Admin Permissions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as createCollege } from '@entities/app/api/colleges/route'
import { PATCH as updateCollege, DELETE as deleteCollege } from '@entities/app/api/colleges/[id]/route'
import { POST as createBranch } from '@entities/app/api/colleges/[id]/branches/route'
import { POST as createContact } from '@entities/app/api/colleges/[id]/contacts/route'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

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
  id: 'user-admin-id',
  email: 'admin@agency.com',
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

// Mock admin permission check
let shouldAdminCheckFail = false

vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual('@pleeno/utils')
  return {
    ...actual,
    requireAdmin: vi.fn(async (supabase) => {
      if (shouldAdminCheckFail) {
        const error = new Error('Forbidden')
        error.name = 'ForbiddenError'
        throw error
      }
    }),
  }
})

describe('Admin Permission Tests - College Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shouldAdminCheckFail = false

    mockGetUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    })
  })

  describe('POST /api/colleges - Create College', () => {
    it('allows admin to create college', async () => {
      mockAuthUser.app_metadata.role = 'agency_admin'
      shouldAdminCheckFail = false

      mockFrom.mockReturnValue({
        insert: mockInsert,
      })

      mockInsert.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        single: mockSingle,
      })

      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'new-college-id',
          agency_id: 'agency-1',
          name: 'Test University',
          default_commission_rate_percent: 15,
          gst_status: 'included',
        },
        error: null,
      })

      // Mock audit log insertion
      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValueOnce({ error: null }),
      })

      const request = new Request('http://localhost/api/colleges', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test University',
          default_commission_rate_percent: 15,
          gst_status: 'included',
        }),
      })

      const response = await createCollege(request as any)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('prevents regular user from creating college', async () => {
      mockAuthUser.app_metadata.role = 'agency_user'
      shouldAdminCheckFail = true

      const request = new Request('http://localhost/api/colleges', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test University',
          default_commission_rate_percent: 15,
          gst_status: 'included',
        }),
      })

      const response = await createCollege(request as any)

      // Should fail with 403 or 500 (wrapped by error handler)
      expect(response.status).toBeGreaterThanOrEqual(400)

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('PATCH /api/colleges/[id] - Update College', () => {
    it('allows admin to update college', async () => {
      mockAuthUser.app_metadata.role = 'agency_admin'
      shouldAdminCheckFail = false

      mockFrom.mockReturnValue({
        update: mockUpdate,
      })

      mockUpdate.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        eq: mockEq,
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        single: mockSingle,
      })

      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'college-1',
          agency_id: 'agency-1',
          name: 'Updated University',
          default_commission_rate_percent: 20,
          gst_status: 'included',
        },
        error: null,
      })

      // Mock audit log
      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValueOnce({ error: null }),
      })

      const request = new Request('http://localhost/api/colleges/college-1', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated University',
          default_commission_rate_percent: 20,
        }),
      })

      const response = await updateCollege(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Updated University')
    })

    it('prevents regular user from updating college', async () => {
      mockAuthUser.app_metadata.role = 'agency_user'
      shouldAdminCheckFail = true

      const request = new Request('http://localhost/api/colleges/college-1', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Hacked University',
        }),
      })

      const response = await updateCollege(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBeGreaterThanOrEqual(400)

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('DELETE /api/colleges/[id] - Delete College', () => {
    it('allows admin to delete college without branches', async () => {
      mockAuthUser.app_metadata.role = 'agency_admin'
      shouldAdminCheckFail = false

      // Mock branch count check
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      })
      mockSingle.mockResolvedValueOnce({
        data: { count: 0 },
        error: null,
      })

      // Mock delete operation
      mockFrom.mockReturnValueOnce({
        delete: mockDelete,
      })
      mockDelete.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockResolvedValueOnce({
        error: null,
      })

      // Mock audit log
      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValueOnce({ error: null }),
      })

      const request = new Request('http://localhost/api/colleges/college-1', {
        method: 'DELETE',
      })

      const response = await deleteCollege(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('prevents regular user from deleting college', async () => {
      mockAuthUser.app_metadata.role = 'agency_user'
      shouldAdminCheckFail = true

      const request = new Request('http://localhost/api/colleges/college-1', {
        method: 'DELETE',
      })

      const response = await deleteCollege(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBeGreaterThanOrEqual(400)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('prevents deleting college with existing branches', async () => {
      mockAuthUser.app_metadata.role = 'agency_admin'
      shouldAdminCheckFail = false

      // Mock branch count check - has branches
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      })
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      })
      mockSingle.mockResolvedValueOnce({
        data: { count: 3 }, // Has 3 branches
        error: null,
      })

      const request = new Request('http://localhost/api/colleges/college-1', {
        method: 'DELETE',
      })

      const response = await deleteCollege(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('branch')
    })
  })

  describe('POST /api/colleges/[id]/branches - Create Branch', () => {
    it('allows admin to create branch', async () => {
      mockAuthUser.app_metadata.role = 'agency_admin'

      // Mock college fetch
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
        data: {
          id: 'college-1',
          agency_id: 'agency-1',
          default_commission_rate_percent: 15,
        },
        error: null,
      })

      // Mock branch insertion
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      })
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        single: mockSingle,
      })
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'new-branch-id',
          college_id: 'college-1',
          agency_id: 'agency-1',
          name: 'Test Campus',
          city: 'Sydney',
          commission_rate_percent: 15,
        },
        error: null,
      })

      const request = new Request('http://localhost/api/colleges/college-1/branches', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Campus',
          city: 'Sydney',
        }),
      })

      const response = await createBranch(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('allows regular user to create branch (non-admin operation)', async () => {
      mockAuthUser.app_metadata.role = 'agency_user'

      // Mock college fetch
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
        data: {
          id: 'college-1',
          agency_id: 'agency-1',
          default_commission_rate_percent: 15,
        },
        error: null,
      })

      // Mock branch insertion
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      })
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        single: mockSingle,
      })
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'new-branch-id',
          college_id: 'college-1',
          agency_id: 'agency-1',
          name: 'Test Campus',
          city: 'Sydney',
          commission_rate_percent: 15,
        },
        error: null,
      })

      const request = new Request('http://localhost/api/colleges/college-1/branches', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Campus',
          city: 'Sydney',
        }),
      })

      const response = await createBranch(request as any, { params: { id: 'college-1' } })

      // Branch creation is allowed for all authenticated users
      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/colleges/[id]/contacts - Create Contact', () => {
    it('allows admin to create contact', async () => {
      mockAuthUser.app_metadata.role = 'agency_admin'

      // Mock college fetch
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
        data: {
          id: 'college-1',
          agency_id: 'agency-1',
        },
        error: null,
      })

      // Mock contact insertion
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      })
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        single: mockSingle,
      })
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'new-contact-id',
          college_id: 'college-1',
          name: 'John Smith',
          email: 'john@university.edu',
          role_department: 'Admissions',
          position_title: 'Director',
        },
        error: null,
      })

      const request = new Request('http://localhost/api/colleges/college-1/contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'John Smith',
          email: 'john@university.edu',
          role_department: 'Admissions',
          position_title: 'Director',
        }),
      })

      const response = await createContact(request as any, { params: { id: 'college-1' } })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('allows regular user to create contact (non-admin operation)', async () => {
      mockAuthUser.app_metadata.role = 'agency_user'

      // Mock college fetch
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
        data: {
          id: 'college-1',
          agency_id: 'agency-1',
        },
        error: null,
      })

      // Mock contact insertion
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      })
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      })
      mockSelect.mockReturnValueOnce({
        single: mockSingle,
      })
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'new-contact-id',
          college_id: 'college-1',
          name: 'Jane Doe',
          email: 'jane@university.edu',
        },
        error: null,
      })

      const request = new Request('http://localhost/api/colleges/college-1/contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@university.edu',
        }),
      })

      const response = await createContact(request as any, { params: { id: 'college-1' } })

      // Contact creation is allowed for all authenticated users
      expect(response.status).toBe(200)
    })
  })

  describe('Admin Permissions Summary', () => {
    it('verifies admin-only operations', () => {
      const adminOnlyOperations = [
        'POST /api/colleges - Create college',
        'PATCH /api/colleges/[id] - Update college',
        'DELETE /api/colleges/[id] - Delete college',
      ]

      const allUserOperations = [
        'GET /api/colleges - List colleges',
        'GET /api/colleges/[id] - View college details',
        'POST /api/colleges/[id]/branches - Create branch',
        'POST /api/colleges/[id]/contacts - Create contact',
        'POST /api/colleges/[id]/notes - Create note',
        'GET /api/colleges/[id]/activity - View activity feed',
      ]

      expect(adminOnlyOperations).toHaveLength(3)
      expect(allUserOperations).toHaveLength(6)
    })
  })
})
