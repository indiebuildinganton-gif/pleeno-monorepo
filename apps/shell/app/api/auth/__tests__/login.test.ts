/**
 * Login API Route Tests
 *
 * Tests for the /api/auth/login endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../login/route'

// Mock Supabase client
const mockSignInWithPassword = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should login with valid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          app_metadata: { role: 'agency_admin', agency_id: 'agency-123' },
        },
        session: { access_token: 'token', refresh_token: 'refresh' },
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('test@example.com')
    expect(data.session).toBeDefined()
    expect(data.session.access_token).toBe('token')
  })

  it('should reject invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    })

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'WrongPassword',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.error).toBe('Invalid credentials')
  })

  it('should validate email format', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'Password123!',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  it('should require password', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: '',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  it('should require email', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'Password123!',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should handle malformed JSON', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})
