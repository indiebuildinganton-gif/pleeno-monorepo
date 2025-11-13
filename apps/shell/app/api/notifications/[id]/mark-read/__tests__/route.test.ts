/**
 * Notification Mark Read API Route Tests
 *
 * Tests for the PATCH /api/notifications/[id]/mark-read endpoint
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '../route'
import type { Notification } from '@/types/notifications'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

describe('PATCH /api/notifications/[id]/mark-read', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock chain
    mockFrom.mockReturnValue({
      update: mockUpdate,
    })
    mockUpdate.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      single: mockSingle,
    })
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new Request('http://localhost:3000/api/notifications/123/mark-read', {
      method: 'PATCH',
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '123' }),
    })

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 for invalid UUID format', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    const request = new Request('http://localhost:3000/api/notifications/invalid-uuid/mark-read', {
      method: 'PATCH',
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'invalid-uuid' }),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid notification ID format')
  })

  it('should mark notification as read successfully', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'
    const updatedNotification: Notification = {
      id: validUuid,
      agency_id: 'agency-123',
      user_id: 'user-123',
      type: 'overdue_payment',
      message: 'Payment is overdue',
      link: '/payments/plans/1',
      is_read: true,
      read_at: '2025-01-13T11:00:00Z',
      created_at: '2025-01-13T10:00:00Z',
      updated_at: '2025-01-13T11:00:00Z',
    }

    mockSingle.mockResolvedValue({
      data: updatedNotification,
      error: null,
    })

    const request = new Request(`http://localhost:3000/api/notifications/${validUuid}/mark-read`, {
      method: 'PATCH',
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: validUuid }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.notification).toEqual(updatedNotification)
    expect(data.notification.is_read).toBe(true)
    expect(data.notification.read_at).not.toBeNull()

    // Verify update was called with correct parameters
    expect(mockFrom).toHaveBeenCalledWith('notifications')
    expect(mockUpdate).toHaveBeenCalledWith({ is_read: true })
    expect(mockEq).toHaveBeenCalledWith('id', validUuid)
  })

  it('should return 404 when notification does not exist', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'

    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows returned' },
    })

    const request = new Request(`http://localhost:3000/api/notifications/${validUuid}/mark-read`, {
      method: 'PATCH',
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: validUuid }),
    })

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Notification not found or access denied')
  })

  it('should return 404 when notification belongs to different agency (RLS enforcement)', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'

    // RLS blocks the query, returning no rows
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows returned' },
    })

    const request = new Request(`http://localhost:3000/api/notifications/${validUuid}/mark-read`, {
      method: 'PATCH',
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: validUuid }),
    })

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Notification not found or access denied')
  })

  it('should return 500 when database update fails', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'

    mockSingle.mockResolvedValue({
      data: null,
      error: {
        code: 'PGRST000',
        message: 'Database connection failed',
      },
    })

    const request = new Request(`http://localhost:3000/api/notifications/${validUuid}/mark-read`, {
      method: 'PATCH',
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: validUuid }),
    })

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to update notification')
  })

  it('should work with agency-wide notifications (user_id IS NULL)', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'
    const agencyWideNotification: Notification = {
      id: validUuid,
      agency_id: 'agency-123',
      user_id: null, // Agency-wide notification
      type: 'system',
      message: 'System maintenance completed',
      link: null,
      is_read: true,
      read_at: '2025-01-13T11:00:00Z',
      created_at: '2025-01-13T10:00:00Z',
      updated_at: '2025-01-13T11:00:00Z',
    }

    mockSingle.mockResolvedValue({
      data: agencyWideNotification,
      error: null,
    })

    const request = new Request(`http://localhost:3000/api/notifications/${validUuid}/mark-read`, {
      method: 'PATCH',
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: validUuid }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.notification.user_id).toBeNull()
    expect(data.notification.is_read).toBe(true)
  })

  it('should handle already-read notifications without error', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'
    const alreadyReadNotification: Notification = {
      id: validUuid,
      agency_id: 'agency-123',
      user_id: 'user-123',
      type: 'overdue_payment',
      message: 'Payment is overdue',
      link: '/payments/plans/1',
      is_read: true,
      read_at: '2025-01-13T10:30:00Z', // Already has read_at
      created_at: '2025-01-13T10:00:00Z',
      updated_at: '2025-01-13T11:00:00Z',
    }

    mockSingle.mockResolvedValue({
      data: alreadyReadNotification,
      error: null,
    })

    const request = new Request(`http://localhost:3000/api/notifications/${validUuid}/mark-read`, {
      method: 'PATCH',
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: validUuid }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.notification.is_read).toBe(true)
  })

  it('should validate UUID case-insensitively', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { agency_id: 'agency-123' },
        },
      },
      error: null,
    })

    // Uppercase UUID should be valid
    const uppercaseUuid = '550E8400-E29B-41D4-A716-446655440000'
    const notification: Notification = {
      id: uppercaseUuid.toLowerCase(),
      agency_id: 'agency-123',
      user_id: 'user-123',
      type: 'overdue_payment',
      message: 'Payment is overdue',
      link: '/payments/plans/1',
      is_read: true,
      read_at: '2025-01-13T11:00:00Z',
      created_at: '2025-01-13T10:00:00Z',
      updated_at: '2025-01-13T11:00:00Z',
    }

    mockSingle.mockResolvedValue({
      data: notification,
      error: null,
    })

    const request = new Request(
      `http://localhost:3000/api/notifications/${uppercaseUuid}/mark-read`,
      { method: 'PATCH' }
    )

    const response = await PATCH(request, {
      params: Promise.resolve({ id: uppercaseUuid }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
