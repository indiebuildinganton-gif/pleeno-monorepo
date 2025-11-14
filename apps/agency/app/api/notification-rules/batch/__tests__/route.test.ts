/**
 * Notification Rules Batch Update API Tests
 *
 * Tests for the POST /api/notification-rules/batch endpoint
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 2: Notification Settings UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock dependencies
const mockRequireRole = vi.fn()
const mockUpsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@pleeno/auth', () => ({
  requireRole: (...args: any[]) => mockRequireRole(...args),
}))

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual<typeof import('@pleeno/utils')>('@pleeno/utils')
  return {
    ...actual,
    handleApiError: actual.handleApiError,
    createSuccessResponse: actual.createSuccessResponse,
    ValidationError: actual.ValidationError,
    ForbiddenError: actual.ForbiddenError,
  }
})

describe('POST /api/notification-rules/batch', () => {
  const mockAgencyId = 'agency-123'
  const mockUserId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock chain setup
    mockFrom.mockReturnValue({ upsert: mockUpsert })
    mockUpsert.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ single: mockSingle })
  })

  it('should update multiple notification rules successfully', async () => {
    // Mock authenticated admin
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    // Mock successful upserts
    mockSingle
      .mockResolvedValueOnce({
        data: {
          id: 'rule-1',
          agency_id: mockAgencyId,
          recipient_type: 'agency_user',
          event_type: 'overdue',
          is_enabled: true,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: 'rule-2',
          agency_id: mockAgencyId,
          recipient_type: 'student',
          event_type: 'due_soon',
          is_enabled: false,
        },
        error: null,
      })

    const request = new NextRequest('http://localhost:3000/api/notification-rules/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: [
          {
            recipient_type: 'agency_user',
            event_type: 'overdue',
            is_enabled: true,
          },
          {
            recipient_type: 'student',
            event_type: 'due_soon',
            is_enabled: false,
          },
        ],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.updated_count).toBe(2)
    expect(data.data.rules).toHaveLength(2)
  })

  it('should require agency_admin role', async () => {
    // Mock role check failure
    mockRequireRole.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    )

    const request = new NextRequest('http://localhost:3000/api/notification-rules/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: [
          {
            recipient_type: 'agency_user',
            event_type: 'overdue',
            is_enabled: true,
          },
        ],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('should validate request body schema', async () => {
    // Mock authenticated admin
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    // Invalid request - missing is_enabled
    const request = new NextRequest('http://localhost:3000/api/notification-rules/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: [
          {
            recipient_type: 'agency_user',
            event_type: 'overdue',
            // missing is_enabled
          },
        ],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should validate recipient_type enum', async () => {
    // Mock authenticated admin
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    // Invalid recipient_type
    const request = new NextRequest('http://localhost:3000/api/notification-rules/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: [
          {
            recipient_type: 'invalid_type',
            event_type: 'overdue',
            is_enabled: true,
          },
        ],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should validate event_type enum', async () => {
    // Mock authenticated admin
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    // Invalid event_type
    const request = new NextRequest('http://localhost:3000/api/notification-rules/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: [
          {
            recipient_type: 'agency_user',
            event_type: 'invalid_event',
            is_enabled: true,
          },
        ],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should reject users without agency_id', async () => {
    // Mock authenticated user without agency_id
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: {}, // No agency_id
      },
    })

    const request = new NextRequest('http://localhost:3000/api/notification-rules/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: [
          {
            recipient_type: 'agency_user',
            event_type: 'overdue',
            is_enabled: true,
          },
        ],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })

  it('should use upsert with correct conflict resolution', async () => {
    // Mock authenticated admin
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    // Mock successful upsert
    mockSingle.mockResolvedValue({
      data: {
        id: 'rule-1',
        agency_id: mockAgencyId,
        recipient_type: 'agency_user',
        event_type: 'overdue',
        is_enabled: true,
      },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/notification-rules/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: [
          {
            recipient_type: 'agency_user',
            event_type: 'overdue',
            is_enabled: true,
          },
        ],
      }),
    })

    await POST(request)

    // Verify upsert was called with correct onConflict
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agency_id: mockAgencyId,
        recipient_type: 'agency_user',
        event_type: 'overdue',
        is_enabled: true,
      }),
      {
        onConflict: 'agency_id,recipient_type,event_type',
      }
    )
  })

  it('should handle database errors gracefully', async () => {
    // Mock authenticated admin
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    // Mock database error
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: 'DB_ERROR' },
    })

    const request = new NextRequest('http://localhost:3000/api/notification-rules/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: [
          {
            recipient_type: 'agency_user',
            event_type: 'overdue',
            is_enabled: true,
          },
        ],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('should handle empty rules array', async () => {
    // Mock authenticated admin
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    const request = new NextRequest('http://localhost:3000/api/notification-rules/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: [],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.updated_count).toBe(0)
  })
})
