/**
 * Logout API Route Tests
 *
 * Tests for the /api/auth/logout endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../logout/route'

// Mock Supabase client
const mockSignOut = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signOut: mockSignOut,
    },
  })),
}))

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should logout successfully', async () => {
    mockSignOut.mockResolvedValue({
      error: null,
    })

    const response = await POST()
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('should handle logout errors', async () => {
    mockSignOut.mockResolvedValue({
      error: { message: 'Failed to sign out' },
    })

    const response = await POST()
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.error).toBe('Logout failed')
  })

  it('should handle unexpected errors', async () => {
    mockSignOut.mockRejectedValue(new Error('Unexpected error'))

    const response = await POST()
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.error).toBe('Internal server error')
  })
})
