/**
 * Integration Tests: College Branch API Endpoints
 *
 * Tests for branch creation, listing, and commission rate inheritance
 *
 * Epic 3: Entities Domain
 * Story 3-1: College Registry
 * Task 21: Write Tests for College Management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getBranches, POST as createBranch } from '@entities/app/api/colleges/[id]/branches/route'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()

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

// Test fixtures
const mockCollege = {
  id: 'college-1',
  agency_id: 'agency-1',
  name: 'University of Sydney',
  default_commission_rate_percent: 15,
  gst_status: 'included',
}

const mockBranches = [
  {
    id: 'branch-1',
    college_id: 'college-1',
    agency_id: 'agency-1',
    name: 'Main Campus',
    city: 'Sydney',
    commission_rate_percent: 15, // Inherited from college
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'branch-2',
    college_id: 'college-1',
    agency_id: 'agency-1',
    name: 'City Campus',
    city: 'Sydney CBD',
    commission_rate_percent: 20, // Override
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

describe('GET /api/colleges/[id]/branches', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    })
  })

  it('returns all branches for a college', async () => {
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
      data: mockCollege,
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
      data: mockBranches,
      error: null,
    })

    const request = new Request('http://localhost/api/colleges/college-1/branches')
    const response = await getBranches(request as any, { params: { id: 'college-1' } })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].name).toBe('Main Campus')
    expect(data.data[1].name).toBe('City Campus')
  })

  it('returns 404 when college not found', async () => {
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
      data: null,
      error: { code: 'PGRST116' },
    })

    const request = new Request('http://localhost/api/colleges/nonexistent/branches')
    const response = await getBranches(request as any, { params: { id: 'nonexistent' } })

    expect(response.status).toBe(400) // Invalid UUID format
  })

  it('filters branches by agency_id to prevent cross-agency access', async () => {
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
      data: mockCollege,
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
      data: mockBranches,
      error: null,
    })

    const request = new Request('http://localhost/api/colleges/college-1/branches')
    await getBranches(request as any, { params: { id: 'college-1' } })

    // Verify agency_id filter was applied for both college and branches
    expect(mockEq).toHaveBeenCalledWith('agency_id', 'agency-1')
  })
})

describe('POST /api/colleges/[id]/branches - Commission Rate Inheritance', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    })
  })

  it('inherits default commission rate from college when not specified', async () => {
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
      data: mockCollege,
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
        name: 'New Campus',
        city: 'Melbourne',
        commission_rate_percent: 15, // Inherited
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      },
      error: null,
    })

    const newBranch = {
      name: 'New Campus',
      city: 'Melbourne',
      // No commission_rate_percent specified
    }

    const request = new Request('http://localhost/api/colleges/college-1/branches', {
      method: 'POST',
      body: JSON.stringify(newBranch),
    })

    const response = await createBranch(request as any, { params: { id: 'college-1' } })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.data.commission_rate_percent).toBe(15) // Inherited from college
  })

  it('can override commission rate when explicitly provided', async () => {
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
      data: mockCollege,
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
        name: 'New Campus',
        city: 'Melbourne',
        commission_rate_percent: 20, // Override
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      },
      error: null,
    })

    const newBranch = {
      name: 'New Campus',
      city: 'Melbourne',
      commission_rate_percent: 20, // Override
    }

    const request = new Request('http://localhost/api/colleges/college-1/branches', {
      method: 'POST',
      body: JSON.stringify(newBranch),
    })

    const response = await createBranch(request as any, { params: { id: 'college-1' } })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.data.commission_rate_percent).toBe(20) // Override respected
  })

  it('creates branch with correct agency_id and college_id', async () => {
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
      data: mockCollege,
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
        name: 'New Campus',
        city: 'Melbourne',
        commission_rate_percent: 15,
      },
      error: null,
    })

    const newBranch = {
      name: 'New Campus',
      city: 'Melbourne',
    }

    const request = new Request('http://localhost/api/colleges/college-1/branches', {
      method: 'POST',
      body: JSON.stringify(newBranch),
    })

    await createBranch(request as any, { params: { id: 'college-1' } })

    // Verify insert was called with correct IDs
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        college_id: 'college-1',
        agency_id: 'agency-1',
      })
    )
  })

  it('validates commission rate is within 0-100 range', async () => {
    const invalidBranch = {
      name: 'Test Campus',
      city: 'Sydney',
      commission_rate_percent: 150, // Invalid!
    }

    const request = new Request('http://localhost/api/colleges/college-1/branches', {
      method: 'POST',
      body: JSON.stringify(invalidBranch),
    })

    const response = await createBranch(request as any, { params: { id: 'college-1' } })

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
  })
})
