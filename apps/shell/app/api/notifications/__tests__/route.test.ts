/**
 * Notifications API Route Tests
 *
 * Tests for the GET /api/notifications endpoint
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import type { Notification } from '@/types/notifications'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockRange = vi.fn()
const mockFrom = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock chain
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      order: mockOrder,
    })
    mockOrder.mockReturnValue({
      range: mockRange,
    })
    mockRange.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      eq: mockEq,
    })
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new Request('http://localhost:3000/api/notifications')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should return paginated notifications with default parameters', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    const mockNotifications: Notification[] = [
      {
        id: 'notif-1',
        agency_id: 'agency-123',
        user_id: 'user-123',
        type: 'overdue_payment',
        message: 'Payment is overdue',
        link: '/payments/plans/1',
        is_read: false,
        read_at: null,
        created_at: '2025-01-13T10:00:00Z',
        updated_at: '2025-01-13T10:00:00Z',
      },
    ]

    mockRange.mockResolvedValue({
      data: mockNotifications,
      error: null,
      count: 1,
    })

    const request = new Request('http://localhost:3000/api/notifications')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.data).toEqual(mockNotifications)
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    })

    // Verify query was built correctly
    expect(mockFrom).toHaveBeenCalledWith('notifications')
    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact' })
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(mockRange).toHaveBeenCalledWith(0, 19) // page 1, limit 20
  })

  it('should filter by is_read=false', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    mockEq.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    const request = new Request('http://localhost:3000/api/notifications?is_read=false')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockEq).toHaveBeenCalledWith('is_read', false)
  })

  it('should filter by is_read=true', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    mockEq.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    const request = new Request('http://localhost:3000/api/notifications?is_read=true')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockEq).toHaveBeenCalledWith('is_read', true)
  })

  it('should handle custom page and limit parameters', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    mockRange.mockResolvedValue({
      data: [],
      error: null,
      count: 100,
    })

    const request = new Request('http://localhost:3000/api/notifications?page=3&limit=10')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.pagination).toEqual({
      page: 3,
      limit: 10,
      total: 100,
      totalPages: 10,
    })

    // Verify offset calculation: (page - 1) * limit = (3 - 1) * 10 = 20
    expect(mockRange).toHaveBeenCalledWith(20, 29) // offset 20, limit 10
  })

  it('should enforce maximum limit of 100', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    mockRange.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    const request = new Request('http://localhost:3000/api/notifications?limit=500')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.pagination.limit).toBe(100)
    expect(mockRange).toHaveBeenCalledWith(0, 99) // 0 to 99 = 100 items
  })

  it('should enforce minimum page of 1', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    mockRange.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    const request = new Request('http://localhost:3000/api/notifications?page=0')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.pagination.page).toBe(1)
  })

  it('should return empty array when no notifications exist', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    mockRange.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    const request = new Request('http://localhost:3000/api/notifications')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.data).toEqual([])
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    })
  })

  it('should return 500 when database query fails', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    mockRange.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' },
      count: null,
    })

    const request = new Request('http://localhost:3000/api/notifications')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()

    expect(data.error).toBe('Failed to fetch notifications')
  })

  it('should include both agency-wide and user-specific notifications', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    const mockNotifications: Notification[] = [
      {
        id: 'notif-1',
        agency_id: 'agency-123',
        user_id: null, // Agency-wide
        type: 'system',
        message: 'System maintenance scheduled',
        link: null,
        is_read: false,
        read_at: null,
        created_at: '2025-01-13T10:00:00Z',
        updated_at: '2025-01-13T10:00:00Z',
      },
      {
        id: 'notif-2',
        agency_id: 'agency-123',
        user_id: 'user-123', // User-specific
        type: 'overdue_payment',
        message: 'Payment is overdue',
        link: '/payments/plans/1',
        is_read: false,
        read_at: null,
        created_at: '2025-01-13T09:00:00Z',
        updated_at: '2025-01-13T09:00:00Z',
      },
    ]

    mockRange.mockResolvedValue({
      data: mockNotifications,
      error: null,
      count: 2,
    })

    const request = new Request('http://localhost:3000/api/notifications')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.data).toHaveLength(2)
    expect(data.data[0].user_id).toBeNull() // Agency-wide
    expect(data.data[1].user_id).toBe('user-123') // User-specific
  })
})
