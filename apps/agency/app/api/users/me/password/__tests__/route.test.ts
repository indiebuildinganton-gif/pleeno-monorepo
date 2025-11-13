/**
 * Password Change API Route Tests
 *
 * Tests for the PATCH /api/users/me/password endpoint
 *
 * Story 2.4: User Profile Management - Task 15
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '../route'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockUpdateUser = vi.fn()
const mockInsert = vi.fn()
const mockFrom = vi.fn()

vi.mock('@pleeno/database', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      updateUser: mockUpdateUser,
    },
    from: mockFrom,
  })),
}))

describe('PATCH /api/users/me/password', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock chain setup for audit_log
    mockFrom.mockReturnValue({ insert: mockInsert })
    mockInsert.mockResolvedValue({ data: {}, error: null })
  })

  it('should change password with correct current password', async () => {
    const userId = 'user-123'
    const userEmail = 'user@example.com'

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: userId, email: userEmail },
      },
      error: null,
    })

    // Mock successful current password verification
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: userId, email: userEmail } },
      error: null,
    })

    // Mock successful password update
    mockUpdateUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'OldPass123!',
        new_password: 'NewPass456!',
        confirm_password: 'NewPass456!',
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.message).toBe('Password changed successfully')

    // Verify current password was checked
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: userEmail,
      password: 'OldPass123!',
    })

    // Verify new password was set
    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: 'NewPass456!',
    })

    // Verify audit log was created
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'user',
        entity_id: userId,
        user_id: userId,
        action: 'password_changed',
        changes_json: expect.objectContaining({
          timestamp: expect.any(String),
        }),
      })
    )
  })

  it('should fail with incorrect current password', async () => {
    const userId = 'user-123'
    const userEmail = 'user@example.com'

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: userId, email: userEmail },
      },
      error: null,
    })

    // Mock failed current password verification
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })

    const request = new Request('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'WrongPassword!',
        new_password: 'NewPass456!',
        confirm_password: 'NewPass456!',
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(data.error.message).toBe('Current password is incorrect')

    // Verify password was NOT updated
    expect(mockUpdateUser).not.toHaveBeenCalled()

    // Verify audit log was NOT created
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('should reject password shorter than 8 characters', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@example.com' },
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'OldPass123!',
        new_password: 'Short1!', // Only 7 characters
        confirm_password: 'Short1!',
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should reject password without uppercase letter', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@example.com' },
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'OldPass123!',
        new_password: 'newpass456!', // No uppercase
        confirm_password: 'newpass456!',
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should reject password without lowercase letter', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@example.com' },
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'OldPass123!',
        new_password: 'NEWPASS456!', // No lowercase
        confirm_password: 'NEWPASS456!',
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should reject password without number', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@example.com' },
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'OldPass123!',
        new_password: 'NewPassword!', // No number
        confirm_password: 'NewPassword!',
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should reject password without special character', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@example.com' },
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'OldPass123!',
        new_password: 'NewPass456', // No special character
        confirm_password: 'NewPass456',
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should reject when passwords do not match', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@example.com' },
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'OldPass123!',
        new_password: 'NewPass456!',
        confirm_password: 'DifferentPass789!', // Doesn't match
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should reject unauthenticated requests', async () => {
    // Mock no authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new Request('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'OldPass123!',
        new_password: 'NewPass456!',
        confirm_password: 'NewPass456!',
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('should handle password update errors gracefully', async () => {
    const userId = 'user-123'
    const userEmail = 'user@example.com'

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: userId, email: userEmail },
      },
      error: null,
    })

    // Mock successful current password verification
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: userId, email: userEmail } },
      error: null,
    })

    // Mock failed password update
    mockUpdateUser.mockResolvedValue({
      data: null,
      error: { message: 'Password update failed' },
    })

    const request = new Request('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'OldPass123!',
        new_password: 'NewPass456!',
        confirm_password: 'NewPass456!',
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('should not log password values in audit trail', async () => {
    const userId = 'user-123'
    const userEmail = 'user@example.com'

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: userId, email: userEmail },
      },
      error: null,
    })

    // Mock successful current password verification
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: userId, email: userEmail } },
      error: null,
    })

    // Mock successful password update
    mockUpdateUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'OldPass123!',
        new_password: 'NewPass456!',
        confirm_password: 'NewPass456!',
      }),
    })

    await PATCH(request)

    // Verify audit log does NOT contain password values
    const auditCall = mockInsert.mock.calls[0][0]
    const changesJson = JSON.stringify(auditCall.changes_json)
    expect(changesJson).not.toContain('OldPass123!')
    expect(changesJson).not.toContain('NewPass456!')
    expect(auditCall.changes_json).toHaveProperty('timestamp')
    expect(auditCall.changes_json).not.toHaveProperty('password')
    expect(auditCall.changes_json).not.toHaveProperty('old_password')
    expect(auditCall.changes_json).not.toHaveProperty('new_password')
  })

  it('should accept password with all required character types', async () => {
    const userId = 'user-123'
    const userEmail = 'user@example.com'

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: userId, email: userEmail },
      },
      error: null,
    })

    // Mock successful current password verification
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: userId, email: userEmail } },
      error: null,
    })

    // Mock successful password update
    mockUpdateUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'OldPass123!',
        new_password: 'Aa1!bbbb', // 8 chars, upper, lower, number, special
        confirm_password: 'Aa1!bbbb',
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
