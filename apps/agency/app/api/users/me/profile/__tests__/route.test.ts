/**
 * Profile Update API Route Tests
 *
 * Tests for the PATCH /api/users/me/profile endpoint
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

vi.mock('@pleeno/database', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

describe('PATCH /api/users/me/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock chain setup
    mockFrom.mockReturnValue({ update: mockUpdate })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ single: mockSingle })
  })

  it('should update user full name successfully', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@example.com' },
      },
      error: null,
    })

    // Mock successful update
    mockSingle.mockResolvedValue({
      data: {
        id: 'user-123',
        email: 'user@example.com',
        full_name: 'John Doe Updated',
        role: 'agency_user',
        status: 'active',
        agency_id: 'agency-123',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'John Doe Updated' }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.full_name).toBe('John Doe Updated')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'John Doe Updated',
        updated_at: expect.any(String),
      })
    )
  })

  it('should reject unauthenticated requests', async () => {
    // Mock no authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new Request('http://localhost:3000/api/users/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'John Doe' }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
    expect(data.error.message).toBe('Not authenticated')
  })

  it('should validate full_name is required', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@example.com' },
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: '' }), // Empty name
    })

    const response = await PATCH(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should validate full_name max length', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@example.com' },
      },
      error: null,
    })

    // Create a name longer than 255 characters
    const longName = 'a'.repeat(256)

    const request = new Request('http://localhost:3000/api/users/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: longName }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should trim whitespace from full_name', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@example.com' },
      },
      error: null,
    })

    // Mock successful update
    mockSingle.mockResolvedValue({
      data: {
        id: 'user-123',
        full_name: 'John Doe',
        email: 'user@example.com',
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: '  John Doe  ' }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(200)

    // Verify the update was called with trimmed name
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'John Doe',
      })
    )
  })

  it('should handle database errors gracefully', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@example.com' },
      },
      error: null,
    })

    // Mock database error
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: 'DB_ERROR' },
    })

    const request = new Request('http://localhost:3000/api/users/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'John Doe' }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('should reject invalid JSON body', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@example.com' },
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    })

    const response = await PATCH(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('should only update the current user (RLS enforcement)', async () => {
    // Mock authenticated user
    const currentUserId = 'user-123'
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: currentUserId, email: 'user@example.com' },
      },
      error: null,
    })

    // Mock successful update
    mockSingle.mockResolvedValue({
      data: {
        id: currentUserId,
        full_name: 'John Doe',
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/users/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'John Doe' }),
    })

    await PATCH(request)

    // Verify update was called with current user's ID
    expect(mockEq).toHaveBeenCalledWith('id', currentUserId)
  })
})
