/**
 * Email Verification API Route Tests
 *
 * Tests for the POST /api/users/verify-email endpoint
 *
 * Story 2.4: User Profile Management - Task 5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'

// Mock Supabase client
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

// Mock Admin Auth API
const mockUpdateUserById = vi.fn()

vi.mock('@pleeno/database', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        updateUserById: mockUpdateUserById,
      },
    },
  })),
}))

describe('POST /api/users/verify-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock chain setup
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
    mockUpdate.mockReturnValue({ eq: mockEq })
  })

  it('should verify email with valid token', async () => {
    const now = new Date()
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)

    // Mock user lookup by token
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        email: 'old@example.com',
        pending_email: 'new@example.com',
        updated_at: tenMinutesAgo.toISOString(),
      },
      error: null,
    })

    // Mock user update
    mockEq.mockReturnValueOnce({
      // Return chain for update operation
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      }),
    })

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
    })

    // Mock admin auth update
    mockUpdateUserById.mockResolvedValue({
      data: {},
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/verify-email?token=valid-token-123', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.message).toBe('Email verified successfully')
    expect(data.data.redirect).toBe('/profile')
  })

  it('should reject missing token', async () => {
    const request = new Request('http://localhost:3000/api/users/verify-email', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(data.error.message).toBe('Verification token is required')
  })

  it('should reject invalid token', async () => {
    // Mock user lookup returns no user
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'No rows returned' },
    })

    const request = new Request('http://localhost:3000/api/users/verify-email?token=invalid-token', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(data.error.message).toBe('Invalid verification token')
  })

  it('should reject expired token (older than 1 hour)', async () => {
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    // Mock user lookup with old token
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        email: 'old@example.com',
        pending_email: 'new@example.com',
        updated_at: twoHoursAgo.toISOString(),
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/verify-email?token=expired-token', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(data.error.message).toBe('Verification token has expired')
  })

  it('should reject token with no pending email', async () => {
    const now = new Date()

    // Mock user lookup with no pending email
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        email: 'current@example.com',
        pending_email: null,
        updated_at: now.toISOString(),
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/verify-email?token=token-no-pending', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(data.error.message).toBe('No pending email change found')
  })

  it('should handle database update errors gracefully', async () => {
    const now = new Date()

    // Mock user lookup succeeds
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        email: 'old@example.com',
        pending_email: 'new@example.com',
        updated_at: now.toISOString(),
      },
      error: null,
    })

    // Mock user update fails
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    })

    const request = new Request('http://localhost:3000/api/users/verify-email?token=valid-token', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })

  it('should succeed even if auth update fails', async () => {
    const now = new Date()

    // Mock user lookup by token
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        email: 'old@example.com',
        pending_email: 'new@example.com',
        updated_at: now.toISOString(),
      },
      error: null,
    })

    // Mock user update succeeds
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
    })

    // Mock admin auth update fails (but should not fail the request)
    mockUpdateUserById.mockResolvedValue({
      data: null,
      error: { message: 'Auth update failed' },
    })

    const request = new Request('http://localhost:3000/api/users/verify-email?token=valid-token', {
      method: 'POST',
    })

    const response = await POST(request)
    // Should still succeed since DB update worked
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.message).toBe('Email verified successfully')
  })
})
