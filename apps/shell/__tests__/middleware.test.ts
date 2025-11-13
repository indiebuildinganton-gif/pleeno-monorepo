/**
 * Middleware Tests
 *
 * Tests for Next.js authentication middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { middleware } from '../middleware'
import { NextRequest } from 'next/server'

// Mock Supabase SSR
const mockGetUser = vi.fn()
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users from /dashboard to /login', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new NextRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(response.status).toBe(307) // Redirect
      const location = response.headers.get('location')
      expect(location).toContain('/login')
      expect(location).toContain('redirectTo=%2Fdashboard')
    })

    it('should redirect unauthenticated users from /agency to /login', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new NextRequest('http://localhost:3000/agency')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      const location = response.headers.get('location')
      expect(location).toContain('/login')
      expect(location).toContain('redirectTo=%2Fagency')
    })

    it('should redirect unauthenticated users from /entities to /login', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new NextRequest('http://localhost:3000/entities')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      const location = response.headers.get('location')
      expect(location).toContain('/login')
    })

    it('should redirect unauthenticated users from /payments to /login', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new NextRequest('http://localhost:3000/payments')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      const location = response.headers.get('location')
      expect(location).toContain('/login')
    })

    it('should redirect unauthenticated users from /reports to /login', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new NextRequest('http://localhost:3000/reports')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      const location = response.headers.get('location')
      expect(location).toContain('/login')
    })

    it('should allow authenticated users to access /dashboard', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            app_metadata: { role: 'agency_admin' },
          },
        },
      })

      const request = new NextRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Auth Routes', () => {
    it('should allow unauthenticated access to /login', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new NextRequest('http://localhost:3000/login')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should allow unauthenticated access to /signup', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new NextRequest('http://localhost:3000/signup')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should redirect authenticated users from /login to /dashboard', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            app_metadata: { role: 'agency_admin' },
          },
        },
      })

      const request = new NextRequest('http://localhost:3000/login')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      const location = response.headers.get('location')
      expect(location).toContain('/dashboard')
    })

    it('should redirect authenticated users from /signup to /dashboard', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            app_metadata: { role: 'agency_admin' },
          },
        },
      })

      const request = new NextRequest('http://localhost:3000/signup')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      const location = response.headers.get('location')
      expect(location).toContain('/dashboard')
    })
  })

  describe('Redirect URL Preservation', () => {
    it('should preserve original URL in redirectTo param', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new NextRequest('http://localhost:3000/dashboard/settings')
      const response = await middleware(request)

      const location = response.headers.get('location')
      expect(location).toContain('redirectTo=%2Fdashboard%2Fsettings')
    })
  })

  describe('Public Routes', () => {
    it('should allow public access to root path', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new NextRequest('http://localhost:3000/')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })
  })
})
