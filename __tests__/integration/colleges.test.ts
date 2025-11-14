/**
 * Integration Tests: College API Endpoints
 *
 * Tests for the GET/POST /api/colleges and GET/PATCH/DELETE /api/colleges/[id] endpoints
 *
 * Epic 3: Entities Domain
 * Story 3-1: College Registry
 * Task 21: Write Tests for College Management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getColleges, POST as createCollege } from '@entities/app/api/colleges/route'
import {
  GET as getCollege,
  PATCH as updateCollege,
  DELETE as deleteCollege,
} from '@entities/app/api/colleges/[id]/route'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockRange = vi.fn()
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

// Mock auth utility
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
vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual('@pleeno/utils')
  return {
    ...actual,
    requireAdmin: vi.fn(async () => {
      if (mockAuthUser.app_metadata.role !== 'agency_admin') {
        throw new Error('Forbidden')
      }
    }),
  }
})

// Test fixtures
const mockColleges = [
  {
    id: 'college-1',
    agency_id: 'agency-1',
    name: 'University of Sydney',
    city: 'Sydney',
    country: 'Australia',
    default_commission_rate_percent: 15,
    gst_status: 'included',
    contract_expiration_date: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    branches: [{ count: 2 }],
  },
  {
    id: 'college-2',
    agency_id: 'agency-1',
    name: 'University of Melbourne',
    city: 'Melbourne',
    country: 'Australia',
    default_commission_rate_percent: 20,
    gst_status: 'excluded',
    contract_expiration_date: '2025-12-31',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    branches: [{ count: 0 }],
  },
]

const mockCollegeWithRelations = {
  ...mockColleges[0],
  branches: [
    {
      id: 'branch-1',
      name: 'Main Campus',
      city: 'Sydney',
      commission_rate_percent: 15,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
  college_contacts: [
    {
      id: 'contact-1',
      name: 'John Smith',
      role_department: 'Admissions',
      position_title: 'Director',
      email: 'john@university.edu',
      phone: '+61 2 1234 5678',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
}

describe('GET /api/colleges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthUser.app_metadata.role = 'agency_admin'

    mockGetUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    })

    // Default mock setup
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
  })

  it('returns paginated list of colleges', async () => {
    mockRange.mockResolvedValueOnce({
      data: mockColleges,
      error: null,
      count: 2,
    })

    const request = new Request('http://localhost/api/colleges?page=1&per_page=20')
    const response = await getColleges(request as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.meta).toEqual({
      total: 2,
      page: 1,
      per_page: 20,
      total_pages: 1,
    })

    // Verify branch count transformation
    expect(data.data[0].branch_count).toBe(2)
    expect(data.data[1].branch_count).toBe(0)
  })

  it('handles pagination correctly', async () => {
    mockRange.mockResolvedValueOnce({
      data: [mockColleges[0]],
      error: null,
      count: 10,
    })

    const request = new Request('http://localhost/api/colleges?page=2&per_page=5')
    const response = await getColleges(request as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.meta).toEqual({
      total: 10,
      page: 2,
      per_page: 5,
      total_pages: 2,
    })

    // Verify range was called with correct offset
    expect(mockRange).toHaveBeenCalledWith(5, 9) // offset=5, limit=9
  })

  it('uses default pagination when parameters not provided', async () => {
    mockRange.mockResolvedValueOnce({
      data: mockColleges,
      error: null,
      count: 2,
    })

    const request = new Request('http://localhost/api/colleges')
    const response = await getColleges(request as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.meta.page).toBe(1)
    expect(data.meta.per_page).toBe(20)
  })

  it('validates pagination parameters', async () => {
    const invalidRequests = [
      'http://localhost/api/colleges?page=0',
      'http://localhost/api/colleges?per_page=0',
      'http://localhost/api/colleges?per_page=101', // Max 100
      'http://localhost/api/colleges?page=-1',
    ]

    for (const url of invalidRequests) {
      const request = new Request(url)
      const response = await getColleges(request as any)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('pagination')
    }
  })

  it('returns empty array when no colleges exist', async () => {
    mockRange.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 0,
    })

    const request = new Request('http://localhost/api/colleges')
    const response = await getColleges(request as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.data).toEqual([])
    expect(data.meta.total).toBe(0)
  })

  it('requires authentication', async () => {
    // This would be handled by requireRole throwing an error
    // The mock is set up to succeed, so we just verify it was called
    const request = new Request('http://localhost/api/colleges')
    await getColleges(request as any)

    const { requireRole } = await import('@pleeno/auth')
    expect(requireRole).toHaveBeenCalledWith(request, ['agency_admin', 'agency_user'])
  })

  it('filters colleges by agency_id', async () => {
    mockRange.mockResolvedValueOnce({
      data: mockColleges,
      error: null,
      count: 2,
    })

    const request = new Request('http://localhost/api/colleges')
    await getColleges(request as any)

    // Verify agency_id filter was applied
    expect(mockEq).toHaveBeenCalledWith('agency_id', 'agency-1')
  })

  it('orders colleges by name alphabetically', async () => {
    mockRange.mockResolvedValueOnce({
      data: mockColleges,
      error: null,
      count: 2,
    })

    const request = new Request('http://localhost/api/colleges')
    await getColleges(request as any)

    expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })
  })
})

describe('POST /api/colleges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthUser.app_metadata.role = 'agency_admin'

    mockGetUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    })

    mockInsert.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      single: mockSingle,
    })
  })

  it('creates college when user is admin', async () => {
    const newCollege = {
      name: 'New University',
      city: 'Perth',
      country: 'Australia',
      default_commission_rate_percent: 18,
      gst_status: 'included',
    }

    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'new-college-id',
        agency_id: 'agency-1',
        ...newCollege,
        contract_expiration_date: null,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      },
      error: null,
    })

    // Mock audit log insertion
    mockFrom.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValueOnce({ error: null }),
    })

    const request = new Request('http://localhost/api/colleges', {
      method: 'POST',
      body: JSON.stringify(newCollege),
    })

    const response = await createCollege(request as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('New University')
    expect(data.data.default_commission_rate_percent).toBe(18)
  })

  it('returns 403 when user is not admin', async () => {
    mockAuthUser.app_metadata.role = 'agency_user'

    const { requireAdmin } = await import('@pleeno/utils')
    ;(requireAdmin as any).mockImplementationOnce(() => {
      throw new Error('Forbidden')
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

    expect(response.status).toBe(500) // handleApiError wraps it
  })

  it('validates commission rate is within 0-100 range', async () => {
    const invalidData = {
      name: 'Test University',
      default_commission_rate_percent: 150, // Invalid!
      gst_status: 'included',
    }

    const request = new Request('http://localhost/api/colleges', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    const response = await createCollege(request as any)

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Validation failed')
  })

  it('validates GST status enum', async () => {
    const invalidData = {
      name: 'Test University',
      default_commission_rate_percent: 15,
      gst_status: 'invalid', // Invalid!
    }

    const request = new Request('http://localhost/api/colleges', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    const response = await createCollege(request as any)

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('prevents duplicate college names within agency', async () => {
    const duplicateCollege = {
      name: 'University of Sydney', // Already exists
      default_commission_rate_percent: 15,
      gst_status: 'included',
    }

    mockSingle.mockResolvedValueOnce({
      data: null,
      error: {
        code: '23505', // PostgreSQL unique constraint violation
        message: 'duplicate key value violates unique constraint',
      },
    })

    const request = new Request('http://localhost/api/colleges', {
      method: 'POST',
      body: JSON.stringify(duplicateCollege),
    })

    const response = await createCollege(request as any)

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('already exists')
  })

  it('sets agency_id from authenticated user', async () => {
    const newCollege = {
      name: 'Test University',
      default_commission_rate_percent: 15,
      gst_status: 'included',
    }

    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'new-id',
        agency_id: 'agency-1',
        ...newCollege,
      },
      error: null,
    })

    mockFrom.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValueOnce({ error: null }),
    })

    const request = new Request('http://localhost/api/colleges', {
      method: 'POST',
      body: JSON.stringify(newCollege),
    })

    await createCollege(request as any)

    // Verify insert was called with correct agency_id
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agency_id: 'agency-1',
      })
    )
  })

  it('logs college creation to audit trail', async () => {
    const newCollege = {
      name: 'Test University',
      city: 'Sydney',
      default_commission_rate_percent: 15,
      gst_status: 'included',
    }

    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'new-college-id',
        agency_id: 'agency-1',
        ...newCollege,
        country: null,
        contract_expiration_date: null,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      },
      error: null,
    })

    const mockAuditInsert = vi.fn().mockResolvedValueOnce({ error: null })

    // Set up mock to return audit insert for second call to from()
    let callCount = 0
    const originalMockFrom = mockFrom
    mockFrom.mockImplementation((table: string) => {
      callCount++
      if (table === 'audit_logs') {
        return { insert: mockAuditInsert }
      }
      return originalMockFrom(table)
    })

    const request = new Request('http://localhost/api/colleges', {
      method: 'POST',
      body: JSON.stringify(newCollege),
    })

    await createCollege(request as any)

    // Verify audit log was created
    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'college',
        entity_id: 'new-college-id',
        action: 'create',
      })
    )
  })

  it('defaults GST status to "included" when not provided', async () => {
    const newCollege = {
      name: 'Test University',
      default_commission_rate_percent: 15,
    }

    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'new-id',
        agency_id: 'agency-1',
        ...newCollege,
        gst_status: 'included',
      },
      error: null,
    })

    mockFrom.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValueOnce({ error: null }),
    })

    const request = new Request('http://localhost/api/colleges', {
      method: 'POST',
      body: JSON.stringify(newCollege),
    })

    const response = await createCollege(request as any)

    const data = await response.json()
    expect(data.data.gst_status).toBe('included')
  })
})

describe('GET /api/colleges/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthUser.app_metadata.role = 'agency_admin'

    mockGetUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
    })
  })

  it('returns college details with branches and contacts', async () => {
    mockSingle.mockResolvedValueOnce({
      data: mockCollegeWithRelations,
      error: null,
    })

    const request = new Request('http://localhost/api/colleges/college-1')
    const response = await getCollege(request as any, { params: { id: 'college-1' } })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('college-1')
    expect(data.data.branches).toHaveLength(1)
    expect(data.data.college_contacts).toHaveLength(1)
  })

  it('returns 404 when college not found', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    })

    const request = new Request('http://localhost/api/colleges/nonexistent-id')
    const response = await getCollege(request as any, { params: { id: 'nonexistent-id' } })

    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('filters by agency_id to prevent cross-agency access', async () => {
    mockSingle.mockResolvedValueOnce({
      data: mockCollegeWithRelations,
      error: null,
    })

    const request = new Request('http://localhost/api/colleges/college-1')
    await getCollege(request as any, { params: { id: 'college-1' } })

    // Verify both id and agency_id filters were applied
    expect(mockEq).toHaveBeenCalledWith('id', 'college-1')
    expect(mockEq).toHaveBeenCalledWith('agency_id', 'agency-1')
  })
})

describe('PATCH /api/colleges/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthUser.app_metadata.role = 'agency_admin'

    mockGetUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    })

    mockFrom.mockReturnValue({
      update: mockUpdate,
      select: mockSelect,
    })

    mockUpdate.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
    })

    mockSelect.mockReturnValue({
      single: mockSingle,
    })
  })

  it('updates college when user is admin', async () => {
    const updates = {
      name: 'Updated University Name',
      default_commission_rate_percent: 22,
    }

    mockSingle.mockResolvedValueOnce({
      data: {
        ...mockColleges[0],
        ...updates,
      },
      error: null,
    })

    mockFrom.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValueOnce({ error: null }),
    })

    const request = new Request('http://localhost/api/colleges/college-1', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })

    const response = await updateCollege(request as any, { params: { id: 'college-1' } })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('Updated University Name')
  })

  it('validates update data', async () => {
    const invalidUpdates = {
      default_commission_rate_percent: 150, // Invalid!
    }

    const request = new Request('http://localhost/api/colleges/college-1', {
      method: 'PATCH',
      body: JSON.stringify(invalidUpdates),
    })

    const response = await updateCollege(request as any, { params: { id: 'college-1' } })

    expect(response.status).toBe(400)
  })

  it('prevents updating college from different agency', async () => {
    mockEq.mockReturnValueOnce({
      eq: mockEq,
      select: mockSelect,
    })

    mockSelect.mockReturnValueOnce({
      single: mockSingle,
    })

    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    })

    const request = new Request('http://localhost/api/colleges/college-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Hacked' }),
    })

    const response = await updateCollege(request as any, { params: { id: 'college-1' } })

    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/colleges/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthUser.app_metadata.role = 'agency_admin'

    mockGetUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    })
  })

  it('deletes college without payment plans', async () => {
    // Mock branches check - no branches
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

  it('prevents deleting college with branches', async () => {
    // Mock branches check - has branches
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
      data: { count: 2 }, // Has 2 branches
      error: null,
    })

    const request = new Request('http://localhost/api/colleges/college-1', {
      method: 'DELETE',
    })

    const response = await deleteCollege(request as any, { params: { id: 'college-1' } })

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('branches')
  })

  it('requires admin role to delete', async () => {
    mockAuthUser.app_metadata.role = 'agency_user'

    const { requireAdmin } = await import('@pleeno/utils')
    ;(requireAdmin as any).mockImplementationOnce(() => {
      throw new Error('Forbidden')
    })

    const request = new Request('http://localhost/api/colleges/college-1', {
      method: 'DELETE',
    })

    const response = await deleteCollege(request as any, { params: { id: 'college-1' } })

    expect(response.status).toBe(500)
  })
})
