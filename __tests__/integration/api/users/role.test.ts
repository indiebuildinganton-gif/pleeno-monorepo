/**
 * User Role Change API Integration Tests
 *
 * Tests for the PATCH /api/users/[id]/role endpoint
 * Epic 2: Agency Configuration & User Management
 * Story 2.3: User Management Interface
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '@/app/api/users/[id]/role/route'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockUpdate = vi.fn()
const mockRpc = vi.fn()

vi.mock('@pleeno/database', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

describe('PATCH /api/users/[id]/role', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock setup
    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      select: mockSelect,
    })

    mockUpdate.mockReturnValue({
      eq: mockEq,
    })

    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  it('should allow admin to change user role', async () => {
    const adminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
    }

    const currentUserData = {
      id: 'admin-123',
      role: 'agency_admin',
      agency_id: 'agency-1',
    }

    const targetUserId = 'user-456'
    const updatedUser = {
      id: targetUserId,
      email: 'user@test.com',
      role: 'agency_admin',
      agency_id: 'agency-1',
    }

    // Mock auth
    mockGetUser.mockResolvedValue({
      data: { user: adminUser },
      error: null,
    })

    // Mock current user lookup
    mockSingle.mockResolvedValueOnce({
      data: currentUserData,
      error: null,
    })

    // Mock admin count check (for ensuring not removing last admin)
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 2,
              error: null,
            }),
          }),
        }),
      }),
    })

    // Mock update operation
    mockFrom.mockReturnValueOnce({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedUser,
                error: null,
              }),
            }),
          }),
        }),
      }),
    })

    const request = new Request('http://localhost/api/users/123/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'agency_admin' }),
    })

    const response = await PATCH(request, { params: { id: targetUserId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.role).toBe('agency_admin')
  })

  it('should reject non-admin users (403)', async () => {
    const regularUser = {
      id: 'user-123',
      email: 'user@test.com',
    }

    const currentUserData = {
      id: 'user-123',
      role: 'agency_user',
      agency_id: 'agency-1',
    }

    // Mock auth
    mockGetUser.mockResolvedValue({
      data: { user: regularUser },
      error: null,
    })

    // Mock current user lookup
    mockSingle.mockResolvedValue({
      data: currentUserData,
      error: null,
    })

    const request = new Request('http://localhost/api/users/123/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'agency_admin' }),
    })

    const response = await PATCH(request, { params: { id: 'user-456' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Admin access required')
  })

  it('should reject unauthenticated requests (401)', async () => {
    // Mock auth failure
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new Request('http://localhost/api/users/123/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'agency_admin' }),
    })

    const response = await PATCH(request, { params: { id: 'user-456' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Not authenticated')
  })

  it('should prevent removing last admin from agency (400)', async () => {
    const adminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
    }

    const currentUserData = {
      id: 'admin-123',
      role: 'agency_admin',
      agency_id: 'agency-1',
    }

    // Mock auth
    mockGetUser.mockResolvedValue({
      data: { user: adminUser },
      error: null,
    })

    // Mock current user lookup
    mockSingle.mockResolvedValue({
      data: currentUserData,
      error: null,
    })

    // Mock admin count check - only 1 admin
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 1,
              error: null,
            }),
          }),
        }),
      }),
    })

    const request = new Request('http://localhost/api/users/123/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'agency_user' }),
    })

    const response = await PATCH(request, { params: { id: 'admin-123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('last admin')
  })

  it('should validate request body with invalid role', async () => {
    const adminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
    }

    const currentUserData = {
      id: 'admin-123',
      role: 'agency_admin',
      agency_id: 'agency-1',
    }

    // Mock auth
    mockGetUser.mockResolvedValue({
      data: { user: adminUser },
      error: null,
    })

    // Mock current user lookup
    mockSingle.mockResolvedValue({
      data: currentUserData,
      error: null,
    })

    const request = new Request('http://localhost/api/users/123/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'invalid_role' }),
    })

    const response = await PATCH(request, { params: { id: 'user-456' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should set audit context before updating', async () => {
    const adminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
    }

    const currentUserData = {
      id: 'admin-123',
      role: 'agency_admin',
      agency_id: 'agency-1',
    }

    const updatedUser = {
      id: 'user-456',
      email: 'user@test.com',
      role: 'agency_admin',
      agency_id: 'agency-1',
    }

    // Mock auth
    mockGetUser.mockResolvedValue({
      data: { user: adminUser },
      error: null,
    })

    // Mock current user lookup
    mockSingle.mockResolvedValueOnce({
      data: currentUserData,
      error: null,
    })

    // Mock admin count
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 2,
              error: null,
            }),
          }),
        }),
      }),
    })

    // Mock update operation
    mockFrom.mockReturnValueOnce({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedUser,
                error: null,
              }),
            }),
          }),
        }),
      }),
    })

    const request = new Request('http://localhost/api/users/123/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'agency_admin' }),
    })

    await PATCH(request, { params: { id: 'user-456' } })

    // Verify RPC was called to set audit context
    expect(mockRpc).toHaveBeenCalledWith('set_config', {
      setting: 'app.current_user_id',
      value: 'admin-123',
    })
  })
})
