/**
 * Invitation Resend API Integration Tests
 *
 * Tests for the POST /api/invitations/[id]/resend endpoint
 * Epic 2: Agency Configuration & User Management
 * Story 2.3: User Management Interface
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/invitations/[id]/resend/route'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockUpdate = vi.fn()
const mockInsert = vi.fn()
const mockIn = vi.fn()

// Mock sendInvitationEmail
const mockSendInvitationEmail = vi.fn()

vi.mock('@pleeno/database', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual('@pleeno/utils')
  return {
    ...actual,
    sendInvitationEmail: mockSendInvitationEmail,
  }
})

describe('POST /api/invitations/[id]/resend', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock setup
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
      insert: mockInsert,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
      in: mockIn,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      select: mockSelect,
    })

    mockUpdate.mockReturnValue({
      eq: mockEq,
    })

    mockInsert.mockReturnValue({
      select: mockSelect,
    })

    mockSendInvitationEmail.mockResolvedValue(undefined)
  })

  it('should allow admin to resend pending invitation', async () => {
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
      task_ids: [],
      invited_by_user: { full_name: 'Admin User' },
    }

    const updatedInvitation = {
      ...invitation,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    const agency = {
      name: 'Test Agency',
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

    // Mock update operation
    mockSingle.mockResolvedValueOnce({
      data: updatedInvitation,
      error: null,
    })

    // Mock agency lookup
    mockSingle.mockResolvedValueOnce({
      data: agency,
      error: null,
    })

    // Mock audit log insert
    mockInsert.mockResolvedValue({
      data: null,
      error: null,
    })

    const request = new Request('http://localhost/api/invitations/123/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request, Promise.resolve({ id: 'invitation-1' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockSendInvitationEmail).toHaveBeenCalledWith({
      to: 'newuser@test.com',
      token: 'token-123',
      agencyName: 'Test Agency',
      inviterName: 'Admin User',
      assignedTasks: [],
      taskIds: [],
    })
  })

  it('should prevent resending used invitation (400)', async () => {
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

    const request = new Request('http://localhost/api/invitations/123/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request, Promise.resolve({ id: 'invitation-1' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Cannot resend used invitation')
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

    const request = new Request('http://localhost/api/invitations/123/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request, Promise.resolve({ id: 'invitation-1' }))
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

    const request = new Request('http://localhost/api/invitations/123/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request, Promise.resolve({ id: 'invitation-1' }))
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

    const request = new Request('http://localhost/api/invitations/123/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request, Promise.resolve({ id: 'invitation-1' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Invitation not found')
  })

  it('should extend expiration by 7 days', async () => {
    const adminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
    }

    const currentUserData = {
      id: 'admin-123',
      role: 'agency_admin',
      agency_id: 'agency-1',
    }

    const oldExpiresAt = '2025-11-20T00:00:00Z'
    const invitation = {
      id: 'invitation-1',
      email: 'newuser@test.com',
      token: 'token-123',
      expires_at: oldExpiresAt,
      used_at: null,
      agency_id: 'agency-1',
      invited_by: 'admin-123',
      task_ids: [],
      invited_by_user: { full_name: 'Admin User' },
    }

    const updatedInvitation = {
      ...invitation,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    const agency = {
      name: 'Test Agency',
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

    // Mock update operation
    mockSingle.mockResolvedValueOnce({
      data: updatedInvitation,
      error: null,
    })

    // Mock agency lookup
    mockSingle.mockResolvedValueOnce({
      data: agency,
      error: null,
    })

    // Mock audit log insert
    mockInsert.mockResolvedValue({
      data: null,
      error: null,
    })

    const request = new Request('http://localhost/api/invitations/123/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request, Promise.resolve({ id: 'invitation-1' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify the expiration date was extended
    const newExpiresAt = new Date(data.data.expires_at)
    const now = new Date()
    const daysDiff = (newExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    // Should be approximately 7 days from now (allow 1 day margin for test timing)
    expect(daysDiff).toBeGreaterThan(6)
    expect(daysDiff).toBeLessThan(8)
  })
})
