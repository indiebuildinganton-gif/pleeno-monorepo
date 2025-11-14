/**
 * Activity Feed API Route Tests
 *
 * Tests for the GET /api/activity-log endpoint
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.4: Recent Activity Feed
 * Task 3: Create Activity Feed API Route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'

// Mock Supabase client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

// Mock requireRole from @pleeno/auth
vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(),
}))

// Import mocked requireRole
import { requireRole } from '@pleeno/auth'

describe('GET /api/activity-log', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@test.com',
    app_metadata: {
      role: 'agency_admin',
      agency_id: 'agency-123',
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  }

  const mockActivities = [
    {
      id: 'activity-1',
      entity_type: 'student',
      entity_id: 'student-123',
      action: 'created',
      description: 'John Doe created new student Alice Smith',
      metadata: { student_name: 'Alice Smith' },
      created_at: '2025-11-13T10:30:00Z',
      users: {
        id: 'user-123',
        email: 'john@test.com',
        first_name: 'John',
        last_name: 'Doe',
      },
    },
    {
      id: 'activity-2',
      entity_type: 'installment',
      entity_id: 'installment-456',
      action: 'marked_overdue',
      description: 'System marked installment as overdue for Bob Johnson',
      metadata: { student_name: 'Bob Johnson', amount: 250.0 },
      created_at: '2025-11-13T09:15:00Z',
      users: null, // System action
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock chain setup
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      order: mockOrder,
    })
    mockOrder.mockReturnValue({
      limit: mockLimit,
    })
    mockLimit.mockResolvedValue({
      data: mockActivities,
      error: null,
    })
  })

  describe('Authentication and Authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      // Mock requireRole to return 401
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 403 for users without agency_id', async () => {
      // Mock requireRole to return user without agency_id
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          ...mockUser,
          app_metadata: {
            role: 'agency_admin',
            // No agency_id
          },
        },
        role: 'agency_admin',
      })

      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('not associated with an agency')
    })

    it('allows agency_admin to access activity log', async () => {
      // Mock requireRole to return admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('allows agency_user to access activity log', async () => {
      // Mock requireRole to return regular user
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          ...mockUser,
          app_metadata: {
            role: 'agency_user',
            agency_id: 'agency-123',
          },
        },
        role: 'agency_user',
      })

      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Query Parameters', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('uses default limit of 20 when no limit parameter provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      await GET(request)

      expect(mockLimit).toHaveBeenCalledWith(20)
    })

    it('respects custom limit parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log?limit=5', {
        method: 'GET',
      })

      await GET(request)

      expect(mockLimit).toHaveBeenCalledWith(5)
    })

    it('enforces maximum limit of 100', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log?limit=500', {
        method: 'GET',
      })

      await GET(request)

      expect(mockLimit).toHaveBeenCalledWith(100)
    })

    it('handles invalid limit parameter gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log?limit=invalid', {
        method: 'GET',
      })

      await GET(request)

      // Should default to 20 when NaN
      expect(mockLimit).toHaveBeenCalledWith(20)
    })

    it('handles negative limit parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log?limit=-10', {
        method: 'GET',
      })

      await GET(request)

      // Should use 20 (default) since -10 < 20
      expect(mockLimit).toHaveBeenCalledWith(20)
    })
  })

  describe('Database Queries', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('queries activity_log table with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      await GET(request)

      expect(mockFrom).toHaveBeenCalledWith('activity_log')
      expect(mockSelect).toHaveBeenCalled()
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('includes user join in select query', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      await GET(request)

      const selectCall = mockSelect.mock.calls[0][0]
      expect(selectCall).toContain('users:user_id')
      expect(selectCall).toContain('first_name')
      expect(selectCall).toContain('last_name')
      expect(selectCall).toContain('email')
    })

    it('orders results by created_at DESC', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      await GET(request)

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('returns correct response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('transforms activity data correctly with user info', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      const activity = data.data[0]
      expect(activity).toHaveProperty('id')
      expect(activity).toHaveProperty('timestamp')
      expect(activity).toHaveProperty('action')
      expect(activity).toHaveProperty('description')
      expect(activity).toHaveProperty('user')
      expect(activity).toHaveProperty('entity_type')
      expect(activity).toHaveProperty('entity_id')
      expect(activity).toHaveProperty('metadata')

      // Check user object structure
      expect(activity.user).toHaveProperty('id')
      expect(activity.user).toHaveProperty('name')
      expect(activity.user).toHaveProperty('email')
      expect(activity.user.name).toBe('John Doe')
    })

    it('handles null user for system actions', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      // Second activity has null user (system action)
      const systemActivity = data.data[1]
      expect(systemActivity.user).toBeNull()
      expect(systemActivity.description).toContain('System')
    })

    it('returns empty array when no activities found', async () => {
      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('includes metadata in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      const activity = data.data[0]
      expect(activity.metadata).toHaveProperty('student_name', 'Alice Smith')
    })

    it('handles activities with null metadata', async () => {
      mockLimit.mockResolvedValue({
        data: [
          {
            ...mockActivities[0],
            metadata: null,
          },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      const activity = data.data[0]
      expect(activity.metadata).toEqual({})
    })
  })

  describe('Cache Headers', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('sets Cache-Control header with 1-minute cache', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toContain('s-maxage=60')
      expect(cacheControl).toContain('stale-while-revalidate=30')
    })
  })

  describe('Database Errors', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('handles activity log query error', async () => {
      mockLimit.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      })

      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('User Name Formatting', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('concatenates first_name and last_name', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      const activity = data.data[0]
      expect(activity.user.name).toBe('John Doe')
    })

    it('handles missing last_name', async () => {
      mockLimit.mockResolvedValue({
        data: [
          {
            ...mockActivities[0],
            users: {
              id: 'user-123',
              email: 'john@test.com',
              first_name: 'John',
              last_name: null,
            },
          },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      const activity = data.data[0]
      expect(activity.user.name).toBe('John')
    })

    it('handles missing first_name', async () => {
      mockLimit.mockResolvedValue({
        data: [
          {
            ...mockActivities[0],
            users: {
              id: 'user-123',
              email: 'john@test.com',
              first_name: null,
              last_name: 'Doe',
            },
          },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/activity-log', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      const activity = data.data[0]
      expect(activity.user.name).toBe('Doe')
    })
  })
})
