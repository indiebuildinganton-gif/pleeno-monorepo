/**
 * Signup API Route Tests
 *
 * Tests for the /api/auth/signup endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../signup/route'

// Mock Supabase client
const mockSignUp = vi.fn()
const mockUpdateUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
      updateUser: mockUpdateUser,
    },
    from: mockFrom,
  })),
}))

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock chain for database operations
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    })
    mockInsert.mockReturnValue({
      select: mockSelect,
    })
    mockSingle.mockResolvedValue({
      data: { id: 'agency-123', name: 'Test Agency' },
      error: null,
    })
  })

  it('should create user with valid data (first user becomes admin)', async () => {
    // Mock first user scenario
    mockSelect.mockReturnValueOnce({
      // First call is for checking user count
      eq: vi.fn(),
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockResolvedValue({ count: 0, error: null }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn(),
          }),
        }
      }
      if (table === 'agencies') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'agency-123', name: 'Test Agency' },
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: mockSelect, insert: mockInsert }
    })

    mockSignUp.mockResolvedValue({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          app_metadata: {},
        },
        session: { access_token: 'token' },
      },
      error: null,
    })

    mockUpdateUser.mockResolvedValue({
      error: null,
    })

    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'Test User',
        agency_name: 'Test Agency',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.session).toBeDefined()
  })

  it('should reject weak password', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'weak',
        full_name: 'Test User',
        agency_name: 'Test Agency',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  it('should reject invalid email', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'Password123!',
        full_name: 'Test User',
        agency_name: 'Test Agency',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should require full name', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        full_name: '',
        agency_name: 'Test Agency',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should require agency name', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'Test User',
        agency_name: '',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should reject password without uppercase', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        agency_name: 'Test Agency',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should reject password without lowercase', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'PASSWORD123',
        full_name: 'Test User',
        agency_name: 'Test Agency',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should reject password without number', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'PasswordABC',
        full_name: 'Test User',
        agency_name: 'Test Agency',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should handle auth signup errors', async () => {
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: 'Email already registered' },
    })

    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockResolvedValue({ count: 0, error: null }),
      insert: vi.fn(),
    }))

    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'Test User',
        agency_name: 'Test Agency',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Email already registered')
  })
})
