/**
 * Notification Rules API Tests - GET endpoint
 *
 * Tests for the GET /api/notification-rules endpoint
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 6: Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

// Mock dependencies
const mockRequireRole = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSelect = vi.fn()
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
  }
})

describe('GET /api/notification-rules', () => {
  const mockAgencyId = 'agency-123'
  const mockUserId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock chain setup
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ order: mockOrder })
  })

  it('should return rules for current agency only', async () => {
    // Mock authenticated user
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    // Mock successful fetch
    mockOrder
      .mockReturnValueOnce({ order: mockOrder }) // First order call
      .mockResolvedValueOnce({
        data: [
          {
            id: 'rule-1',
            agency_id: mockAgencyId,
            recipient_type: 'student',
            event_type: 'overdue',
            is_enabled: true,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          {
            id: 'rule-2',
            agency_id: mockAgencyId,
            recipient_type: 'agency_user',
            event_type: 'due_soon',
            is_enabled: false,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ],
        error: null,
      })

    const request = new NextRequest('http://localhost:3000/api/notification-rules', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].agency_id).toBe(mockAgencyId)
    expect(data.data[1].agency_id).toBe(mockAgencyId)

    // Verify query was filtered by agency_id
    expect(mockEq).toHaveBeenCalledWith('agency_id', mockAgencyId)
  })

  it('should require authenticated user', async () => {
    // Mock authentication failure
    mockRequireRole.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    )

    const request = new NextRequest('http://localhost:3000/api/notification-rules', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(401)
  })

  it('should allow agency_user and agency_admin roles', async () => {
    // Mock agency_user role
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    mockOrder
      .mockReturnValueOnce({ order: mockOrder })
      .mockResolvedValueOnce({ data: [], error: null })

    const request = new NextRequest('http://localhost:3000/api/notification-rules', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(200)

    // Verify requireRole was called with correct roles
    expect(mockRequireRole).toHaveBeenCalledWith(request, ['agency_admin', 'agency_user'])
  })

  it('should reject users without agency_id', async () => {
    // Mock authenticated user without agency_id
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: {}, // No agency_id
      },
    })

    const request = new NextRequest('http://localhost:3000/api/notification-rules', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(403)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
    expect(data.error.message).toContain('not associated with an agency')
  })

  it('should handle database errors gracefully', async () => {
    // Mock authenticated user
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    // Mock database error
    mockOrder
      .mockReturnValueOnce({ order: mockOrder })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' },
      })

    const request = new NextRequest('http://localhost:3000/api/notification-rules', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('should return empty array when no rules exist', async () => {
    // Mock authenticated user
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    // Mock empty result
    mockOrder
      .mockReturnValueOnce({ order: mockOrder })
      .mockResolvedValueOnce({ data: [], error: null })

    const request = new NextRequest('http://localhost:3000/api/notification-rules', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('should order results by recipient_type and event_type', async () => {
    // Mock authenticated user
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    const mockOrderChain = vi.fn()
    mockOrder
      .mockReturnValueOnce({ order: mockOrderChain }) // First order call returns chained order
      .mockImplementation(() => ({ order: mockOrderChain }))

    mockOrderChain.mockResolvedValueOnce({ data: [], error: null })

    const request = new NextRequest('http://localhost:3000/api/notification-rules', {
      method: 'GET',
    })

    await GET(request)

    // Verify ordering was applied
    expect(mockOrder).toHaveBeenCalledWith('recipient_type', { ascending: true })
    expect(mockOrderChain).toHaveBeenCalledWith('event_type', { ascending: true })
  })

  it('should return null data as empty array', async () => {
    // Mock authenticated user
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    // Mock null result (database returns null instead of empty array)
    mockOrder
      .mockReturnValueOnce({ order: mockOrder })
      .mockResolvedValueOnce({ data: null, error: null })

    const request = new NextRequest('http://localhost:3000/api/notification-rules', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('should handle rules with all recipient types', async () => {
    // Mock authenticated user
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    // Mock rules for all recipient types
    mockOrder
      .mockReturnValueOnce({ order: mockOrder })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'rule-1',
            agency_id: mockAgencyId,
            recipient_type: 'student',
            event_type: 'overdue',
            is_enabled: true,
          },
          {
            id: 'rule-2',
            agency_id: mockAgencyId,
            recipient_type: 'agency_user',
            event_type: 'overdue',
            is_enabled: true,
          },
          {
            id: 'rule-3',
            agency_id: mockAgencyId,
            recipient_type: 'college',
            event_type: 'overdue',
            is_enabled: true,
          },
          {
            id: 'rule-4',
            agency_id: mockAgencyId,
            recipient_type: 'sales_agent',
            event_type: 'overdue',
            is_enabled: true,
          },
        ],
        error: null,
      })

    const request = new NextRequest('http://localhost:3000/api/notification-rules', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(4)

    const recipientTypes = data.data.map((rule: any) => rule.recipient_type)
    expect(recipientTypes).toContain('student')
    expect(recipientTypes).toContain('agency_user')
    expect(recipientTypes).toContain('college')
    expect(recipientTypes).toContain('sales_agent')
  })

  it('should handle rules with all event types', async () => {
    // Mock authenticated user
    mockRequireRole.mockResolvedValue({
      user: {
        id: mockUserId,
        app_metadata: { agency_id: mockAgencyId },
      },
    })

    // Mock rules for all event types
    mockOrder
      .mockReturnValueOnce({ order: mockOrder })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'rule-1',
            agency_id: mockAgencyId,
            recipient_type: 'student',
            event_type: 'overdue',
            is_enabled: true,
          },
          {
            id: 'rule-2',
            agency_id: mockAgencyId,
            recipient_type: 'student',
            event_type: 'due_soon',
            is_enabled: true,
          },
          {
            id: 'rule-3',
            agency_id: mockAgencyId,
            recipient_type: 'student',
            event_type: 'payment_received',
            is_enabled: true,
          },
        ],
        error: null,
      })

    const request = new NextRequest('http://localhost:3000/api/notification-rules', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(3)

    const eventTypes = data.data.map((rule: any) => rule.event_type)
    expect(eventTypes).toContain('overdue')
    expect(eventTypes).toContain('due_soon')
    expect(eventTypes).toContain('payment_received')
  })
})
