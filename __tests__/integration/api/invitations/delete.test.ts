/**
 * Invitation Delete API Integration Tests
 *
 * Tests for the DELETE /api/invitations/[id] endpoint
 * Epic 2: Agency Configuration & User Management
 * Story 2.3: User Management Interface
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DELETE } from '@/app/api/invitations/[id]/route'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockDelete = vi.fn()
const mockInsert = vi.fn()

vi.mock('@pleeno/database', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

describe('DELETE /api/invitations/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock setup
    mockFrom.mockReturnValue({
      select: mockSelect,
      delete: mockDelete,
      insert: mockInsert,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
    })

    mockDelete.mockReturnValue({
      eq: mockEq,
    })

    mockInsert.mockReturnValue({
      select: mockSelect,
    })
  })

  it('should allow admin to delete pending invitation', async () => {
    const adminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
    }

    const currentUserData = {
      id: 'admin-123',
      role: 'agency_admin',
      agency_id: 'agency-1',
    }

    const invitation = {
      id: 'invitation-1',
      email: 'newuser@test.com',
      token: 'token-123',
      expires_at: '2025-11-20T00:00:00Z',
      used_at: null,
      agency_id: 'agency-1',
      invited_by: 'admin-123',
      role: 'agency_user',
      created_at: '2025-11-13T00:00:00Z',
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

    // Mock invitation lookup
    mockSingle.mockResolvedValueOnce({
      data: invitation,
      error: null,
    })

    // Mock audit log insert
    mockInsert.mockResolvedValue({
      data: null,
      error: null,
    })

    // Mock delete operation
    mockEq.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const request = new Request('http://localhost/api/invitations/123', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await DELETE(request, Promise.resolve({ id: 'invitation-1' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should prevent deleting used invitation (400)', async () => {
    const adminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
    }

    const currentUserData = {
      id: 'admin-123',
      role: 'agency_admin',
      agency_id: 'agency-1',
    }

    const usedInvitation = {
      id: 'invitation-1',
      email: 'newuser@test.com',
      token: 'token-123',
      expires_at: '2025-11-20T00:00:00Z',
      used_at: '2025-11-13T00:00:00Z', // Already used
      agency_id: 'agency-1',
      invited_by: 'admin-123',
      role: 'agency_user',
      created_at: '2025-11-13T00:00:00Z',
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

    // Mock invitation lookup
    mockSingle.mockResolvedValueOnce({
      data: usedInvitation,
      error: null,
    })

    const request = new Request('http://localhost/api/invitations/123', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await DELETE(request, Promise.resolve({ id: 'invitation-1' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Cannot delete used invitation')
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

    const request = new Request('http://localhost/api/invitations/123', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await DELETE(request, Promise.resolve({ id: 'invitation-1' }))
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

    const request = new Request('http://localhost/api/invitations/123', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await DELETE(request, Promise.resolve({ id: 'invitation-1' }))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Not authenticated')
  })

  it('should return error if invitation not found (400)', async () => {
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
    mockSingle.mockResolvedValueOnce({
      data: currentUserData,
      error: null,
    })

    // Mock invitation not found
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request('http://localhost/api/invitations/123', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await DELETE(request, Promise.resolve({ id: 'invitation-1' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Invitation not found')
  })

  it('should log deletion in audit trail before deleting', async () => {
    const adminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
    }

    const currentUserData = {
      id: 'admin-123',
      role: 'agency_admin',
      agency_id: 'agency-1',
    }

    const invitation = {
      id: 'invitation-1',
      email: 'newuser@test.com',
      token: 'token-123',
      expires_at: '2025-11-20T00:00:00Z',
      used_at: null,
      agency_id: 'agency-1',
      invited_by: 'admin-123',
      role: 'agency_user',
      created_at: '2025-11-13T00:00:00Z',
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

    // Mock invitation lookup
    mockSingle.mockResolvedValueOnce({
      data: invitation,
      error: null,
    })

    // Mock audit log insert
    mockInsert.mockResolvedValue({
      data: null,
      error: null,
    })

    // Mock delete operation
    mockEq.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const request = new Request('http://localhost/api/invitations/123', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    await DELETE(request, Promise.resolve({ id: 'invitation-1' }))

    // Verify audit log was called
    expect(mockInsert).toHaveBeenCalledWith({
      entity_type: 'invitation',
      entity_id: 'invitation-1',
      user_id: 'admin-123',
      action: 'delete',
      changes_json: {
        email: 'newuser@test.com',
        role: 'agency_user',
        created_at: '2025-11-13T00:00:00Z',
        expires_at: '2025-11-20T00:00:00Z',
      },
    })
  })
})
