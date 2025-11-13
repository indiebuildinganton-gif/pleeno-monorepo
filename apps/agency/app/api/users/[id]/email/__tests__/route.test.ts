/**
 * Email Change API Route Tests (Admin)
 *
 * Tests for the PATCH /api/users/{id}/email endpoint
 *
 * Story 2.4: User Profile Management - Task 15
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '../route'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

// Mock Resend email service
const mockSendEmail = vi.fn()

vi.mock('@pleeno/database', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: mockSendEmail,
    },
  })),
}))

describe('PATCH /api/users/{id}/email', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock chain setup
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
    mockUpdate.mockReturnValue({ eq: mockEq })

    // Mock successful email sending by default
    mockSendEmail.mockResolvedValue({ id: 'email-123' })

    // Mock crypto.randomUUID
    global.crypto = {
      randomUUID: vi.fn(() => 'mock-uuid-token-123'),
    } as any
  })

  it('should allow admin to initiate email change', async () => {
    const adminId = 'admin-123'
    const targetUserId = 'user-456'
    const agencyId = 'agency-123'

    // Mock authenticated admin
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: adminId, email: 'admin@example.com' },
      },
      error: null,
    })

    // Mock admin role check
    mockSingle
      .mockResolvedValueOnce({
        data: { role: 'agency_admin', agency_id: agencyId },
        error: null,
      })
      // Mock email not in use check
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows returned' },
      })

    // Mock update user with pending email
    mockEq.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({
        data: {
          full_name: 'John Doe',
          email: 'old@example.com',
        },
        error: null,
      }),
    })

    const request = new Request(`http://localhost:3000/api/users/${targetUserId}/email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' }),
    })

    const response = await PATCH(request, { params: { id: targetUserId } })
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.message).toBe('Verification email sent')

    // Verify verification token was generated
    expect(crypto.randomUUID).toHaveBeenCalled()

    // Verify update was called with pending email and token
    expect(mockUpdate).toHaveBeenCalledWith({
      pending_email: 'new@example.com',
      email_verification_token: 'mock-uuid-token-123',
    })

    // Verify verification email was sent
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@pleeno.com',
        to: 'new@example.com',
        subject: 'Verify your new email address',
        html: expect.stringContaining('mock-uuid-token-123'),
      })
    )
  })

  it('should reject non-admin users', async () => {
    const regularUserId = 'user-123'

    // Mock authenticated regular user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: regularUserId, email: 'user@example.com' },
      },
      error: null,
    })

    // Mock regular user role check
    mockSingle.mockResolvedValueOnce({
      data: { role: 'agency_user', agency_id: 'agency-123' },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/user-456/email', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' }),
    })

    const response = await PATCH(request, { params: { id: 'user-456' } })
    expect(response.status).toBe(403)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
    expect(data.error.message).toBe('Admin access required')

    // Verify email was NOT sent
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('should reject unauthenticated requests', async () => {
    // Mock no authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new Request('http://localhost:3000/api/users/user-456/email', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' }),
    })

    const response = await PATCH(request, { params: { id: 'user-456' } })
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('should reject duplicate email addresses', async () => {
    const adminId = 'admin-123'
    const agencyId = 'agency-123'

    // Mock authenticated admin
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: adminId, email: 'admin@example.com' },
      },
      error: null,
    })

    // Mock admin role check
    mockSingle
      .mockResolvedValueOnce({
        data: { role: 'agency_admin', agency_id: agencyId },
        error: null,
      })
      // Mock email already exists
      .mockResolvedValueOnce({
        data: { id: 'other-user-789' },
        error: null,
      })

    const request = new Request('http://localhost:3000/api/users/user-456/email', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'existing@example.com' }),
    })

    const response = await PATCH(request, { params: { id: 'user-456' } })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(data.error.message).toBe('Email address is already in use')

    // Verify email was NOT sent
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('should validate email format', async () => {
    const adminId = 'admin-123'

    // Mock authenticated admin
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: adminId, email: 'admin@example.com' },
      },
      error: null,
    })

    // Mock admin role check
    mockSingle.mockResolvedValueOnce({
      data: { role: 'agency_admin', agency_id: 'agency-123' },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/user-456/email', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email' }), // Invalid format
    })

    const response = await PATCH(request, { params: { id: 'user-456' } })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should enforce agency isolation (RLS)', async () => {
    const adminId = 'admin-123'
    const targetUserId = 'user-456'
    const agencyId = 'agency-123'

    // Mock authenticated admin
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: adminId, email: 'admin@example.com' },
      },
      error: null,
    })

    // Mock admin role check
    mockSingle
      .mockResolvedValueOnce({
        data: { role: 'agency_admin', agency_id: agencyId },
        error: null,
      })
      // Mock email not in use
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows returned' },
      })

    // Mock update fails (RLS prevents cross-agency update)
    mockEq.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' }, // RLS blocks the update
      }),
    })

    const request = new Request(`http://localhost:3000/api/users/${targetUserId}/email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' }),
    })

    const response = await PATCH(request, { params: { id: targetUserId } })
    expect(response.status).toBe(500)

    // Verify the update included agency_id check
    expect(mockEq).toHaveBeenCalledWith('agency_id', agencyId)
  })

  it('should generate unique verification token', async () => {
    const adminId = 'admin-123'
    const targetUserId = 'user-456'
    const agencyId = 'agency-123'

    // Mock authenticated admin
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: adminId, email: 'admin@example.com' },
      },
      error: null,
    })

    // Mock admin role check
    mockSingle
      .mockResolvedValueOnce({
        data: { role: 'agency_admin', agency_id: agencyId },
        error: null,
      })
      // Mock email not in use
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows returned' },
      })

    // Mock successful update
    mockEq.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({
        data: {
          full_name: 'John Doe',
          email: 'old@example.com',
        },
        error: null,
      }),
    })

    const request = new Request(`http://localhost:3000/api/users/${targetUserId}/email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' }),
    })

    await PATCH(request, { params: { id: targetUserId } })

    // Verify crypto.randomUUID was called to generate token
    expect(crypto.randomUUID).toHaveBeenCalled()

    // Verify token was stored in database
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        email_verification_token: 'mock-uuid-token-123',
      })
    )
  })

  it('should include verification link in email', async () => {
    const adminId = 'admin-123'
    const targetUserId = 'user-456'
    const agencyId = 'agency-123'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.pleeno.com'

    // Mock authenticated admin
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: adminId, email: 'admin@example.com' },
      },
      error: null,
    })

    // Mock admin role check
    mockSingle
      .mockResolvedValueOnce({
        data: { role: 'agency_admin', agency_id: agencyId },
        error: null,
      })
      // Mock email not in use
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows returned' },
      })

    // Mock successful update
    mockEq.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({
        data: {
          full_name: 'John Doe',
          email: 'old@example.com',
        },
        error: null,
      }),
    })

    const request = new Request(`http://localhost:3000/api/users/${targetUserId}/email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' }),
    })

    await PATCH(request, { params: { id: targetUserId } })

    // Verify email contains verification link
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('https://app.pleeno.com/verify-email?token=mock-uuid-token-123'),
      })
    )
  })

  it('should handle email sending errors gracefully', async () => {
    const adminId = 'admin-123'
    const targetUserId = 'user-456'
    const agencyId = 'agency-123'

    // Mock authenticated admin
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: adminId, email: 'admin@example.com' },
      },
      error: null,
    })

    // Mock admin role check
    mockSingle
      .mockResolvedValueOnce({
        data: { role: 'agency_admin', agency_id: agencyId },
        error: null,
      })
      // Mock email not in use
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows returned' },
      })

    // Mock successful update
    mockEq.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({
        data: {
          full_name: 'John Doe',
          email: 'old@example.com',
        },
        error: null,
      }),
    })

    // Mock email sending failure
    mockSendEmail.mockRejectedValue(new Error('Email service unavailable'))

    const request = new Request(`http://localhost:3000/api/users/${targetUserId}/email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' }),
    })

    const response = await PATCH(request, { params: { id: targetUserId } })
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('should convert email to lowercase', async () => {
    const adminId = 'admin-123'
    const targetUserId = 'user-456'
    const agencyId = 'agency-123'

    // Mock authenticated admin
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: adminId, email: 'admin@example.com' },
      },
      error: null,
    })

    // Mock admin role check
    mockSingle
      .mockResolvedValueOnce({
        data: { role: 'agency_admin', agency_id: agencyId },
        error: null,
      })
      // Mock email not in use
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows returned' },
      })

    // Mock successful update
    mockEq.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({
        data: {
          full_name: 'John Doe',
          email: 'old@example.com',
        },
        error: null,
      }),
    })

    const request = new Request(`http://localhost:3000/api/users/${targetUserId}/email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'NEW@EXAMPLE.COM' }), // Uppercase email
    })

    await PATCH(request, { params: { id: targetUserId } })

    // Verify email was converted to lowercase
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        pending_email: 'new@example.com', // Should be lowercase
      })
    )

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'new@example.com', // Should be lowercase
      })
    )
  })

  it('should handle user not found error', async () => {
    const adminId = 'admin-123'
    const targetUserId = 'nonexistent-user'
    const agencyId = 'agency-123'

    // Mock authenticated admin
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: adminId, email: 'admin@example.com' },
      },
      error: null,
    })

    // Mock admin role check
    mockSingle
      .mockResolvedValueOnce({
        data: { role: 'agency_admin', agency_id: agencyId },
        error: null,
      })
      // Mock email not in use
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows returned' },
      })

    // Mock update returns no user (user not found or wrong agency)
    mockEq.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null, // No error, just no data
      }),
    })

    const request = new Request(`http://localhost:3000/api/users/${targetUserId}/email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' }),
    })

    const response = await PATCH(request, { params: { id: targetUserId } })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(data.error.message).toBe('User not found or not in your agency')
  })
})
