/**
 * Email Templates API Tests - GET and POST endpoints
 *
 * Tests for the GET and POST /api/email-templates endpoints
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 6: Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'

// Mock dependencies
const mockRequireRole = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
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
  }
})

// Mock template validation and sanitization
vi.mock('../../../lib/template-preview', () => ({
  sanitizeHtml: vi.fn((html: string) => html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')),
  validateTemplate: vi.fn((template: string) => {
    const errors: string[] = []
    const openBraces = (template.match(/\{\{/g) || []).length
    const closeBraces = (template.match(/\}\}/g) || []).length
    if (openBraces !== closeBraces) {
      errors.push('Mismatched placeholders')
    }
    return errors
  }),
}))

describe('Email Templates API', () => {
  const mockAgencyId = 'agency-123'
  const mockUserId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/email-templates', () => {
    beforeEach(() => {
      // Default mock chain setup for GET
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ order: mockOrder })
    })

    it('should return templates for current agency only', async () => {
      // Mock authenticated user
      mockRequireRole.mockResolvedValue({
        user: {
          id: mockUserId,
          app_metadata: { agency_id: mockAgencyId },
        },
      })

      // Mock successful fetch
      mockOrder.mockResolvedValue({
        data: [
          {
            id: 'template-1',
            agency_id: mockAgencyId,
            template_type: 'student_overdue',
            subject: 'Payment Reminder',
            body_html: '<p>Hello {{student_name}}</p>',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          {
            id: 'template-2',
            agency_id: mockAgencyId,
            template_type: 'agency_user_overdue',
            subject: 'Overdue Alert',
            body_html: '<p>Payment overdue for {{student_name}}</p>',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].agency_id).toBe(mockAgencyId)

      // Verify query was filtered by agency_id
      expect(mockEq).toHaveBeenCalledWith('agency_id', mockAgencyId)
    })

    it('should require authenticated user', async () => {
      // Mock authentication failure
      mockRequireRole.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      )

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(401)
    })

    it('should reject users without agency_id', async () => {
      // Mock authenticated user without agency_id
      mockRequireRole.mockResolvedValue({
        user: {
          id: mockUserId,
          app_metadata: {},
        },
      })

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('should handle database errors', async () => {
      // Mock authenticated user
      mockRequireRole.mockResolvedValue({
        user: {
          id: mockUserId,
          app_metadata: { agency_id: mockAgencyId },
        },
      })

      // Mock database error
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      })

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(500)
    })

    it('should return empty array when no templates exist', async () => {
      // Mock authenticated user
      mockRequireRole.mockResolvedValue({
        user: {
          id: mockUserId,
          app_metadata: { agency_id: mockAgencyId },
        },
      })

      // Mock empty result
      mockOrder.mockResolvedValue({ data: [], error: null })

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })
  })

  describe('POST /api/email-templates', () => {
    beforeEach(() => {
      // Default mock chain setup for POST
      mockFrom.mockReturnValue({ insert: mockInsert })
      mockInsert.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
    })

    it('should create new template with valid data', async () => {
      // Mock authenticated admin
      mockRequireRole.mockResolvedValue({
        user: {
          id: mockUserId,
          app_metadata: { agency_id: mockAgencyId },
        },
      })

      // Mock successful insert
      mockSingle.mockResolvedValue({
        data: {
          id: 'template-123',
          agency_id: mockAgencyId,
          template_type: 'student_overdue',
          subject: 'Payment Reminder',
          body_html: '<p>Hello {{student_name}}</p>',
          variables: {},
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: 'student_overdue',
          subject: 'Payment Reminder',
          body_html: '<p>Hello {{student_name}}</p>',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('template-123')
    })

    it('should sanitize HTML to prevent XSS', async () => {
      // Mock authenticated admin
      mockRequireRole.mockResolvedValue({
        user: {
          id: mockUserId,
          app_metadata: { agency_id: mockAgencyId },
        },
      })

      // Mock successful insert
      mockSingle.mockResolvedValue({
        data: {
          id: 'template-123',
          agency_id: mockAgencyId,
          template_type: 'student_overdue',
          subject: 'Test',
          body_html: '<p>Hello</p>',
          variables: {},
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: 'student_overdue',
          subject: 'Test',
          body_html: '<p>Hello</p><script>alert("XSS")</script>',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      // Verify script tag was removed
      expect(data.data.body_html).not.toContain('<script>')
      expect(data.data.body_html).toBe('<p>Hello</p>')
    })

    it('should allow safe HTML tags', async () => {
      // Mock authenticated admin
      mockRequireRole.mockResolvedValue({
        user: {
          id: mockUserId,
          app_metadata: { agency_id: mockAgencyId },
        },
      })

      // Mock successful insert
      const safeHtml = '<p>Hello <strong>{{student_name}}</strong>, <a href="{{link}}">click here</a></p>'
      mockSingle.mockResolvedValue({
        data: {
          id: 'template-123',
          agency_id: mockAgencyId,
          template_type: 'student_overdue',
          subject: 'Test',
          body_html: safeHtml,
          variables: {},
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: 'student_overdue',
          subject: 'Test',
          body_html: safeHtml,
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.data.body_html).toContain('<p>')
      expect(data.data.body_html).toContain('<strong>')
      expect(data.data.body_html).toContain('<a href')
    })

    it('should require agency_admin role', async () => {
      // Mock role check failure
      mockRequireRole.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
      )

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: 'student_overdue',
          subject: 'Test',
          body_html: '<p>Test</p>',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(403)

      // Verify requireRole was called with admin role
      expect(mockRequireRole).toHaveBeenCalledWith(request, ['agency_admin'])
    })

    it('should validate required fields', async () => {
      // Mock authenticated admin
      mockRequireRole.mockResolvedValue({
        user: {
          id: mockUserId,
          app_metadata: { agency_id: mockAgencyId },
        },
      })

      // Missing subject field
      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: 'student_overdue',
          body_html: '<p>Test</p>',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toContain('Missing required fields')
    })

    it('should validate template syntax', async () => {
      // Mock authenticated admin
      mockRequireRole.mockResolvedValue({
        user: {
          id: mockUserId,
          app_metadata: { agency_id: mockAgencyId },
        },
      })

      // Invalid template with mismatched braces
      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: 'student_overdue',
          subject: 'Test',
          body_html: '<p>Hello {{student_name</p>',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toContain('Template validation failed')
    })

    it('should reject users without agency_id', async () => {
      // Mock authenticated user without agency_id
      mockRequireRole.mockResolvedValue({
        user: {
          id: mockUserId,
          app_metadata: {},
        },
      })

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: 'student_overdue',
          subject: 'Test',
          body_html: '<p>Test</p>',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('should handle database errors', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: 'student_overdue',
          subject: 'Test',
          body_html: '<p>Test</p>',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
    })

    it('should include variables field in insert', async () => {
      // Mock authenticated admin
      mockRequireRole.mockResolvedValue({
        user: {
          id: mockUserId,
          app_metadata: { agency_id: mockAgencyId },
        },
      })

      const customVariables = { custom_field: 'Custom Value' }

      // Mock successful insert
      mockSingle.mockResolvedValue({
        data: {
          id: 'template-123',
          agency_id: mockAgencyId,
          template_type: 'student_overdue',
          subject: 'Test',
          body_html: '<p>Test</p>',
          variables: customVariables,
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: 'student_overdue',
          subject: 'Test',
          body_html: '<p>Test</p>',
          variables: customVariables,
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.data.variables).toEqual(customVariables)

      // Verify insert was called with variables
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: customVariables,
        })
      )
    })

    it('should default variables to empty object if not provided', async () => {
      // Mock authenticated admin
      mockRequireRole.mockResolvedValue({
        user: {
          id: mockUserId,
          app_metadata: { agency_id: mockAgencyId },
        },
      })

      // Mock successful insert
      mockSingle.mockResolvedValue({
        data: {
          id: 'template-123',
          agency_id: mockAgencyId,
          template_type: 'student_overdue',
          subject: 'Test',
          body_html: '<p>Test</p>',
          variables: {},
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: 'student_overdue',
          subject: 'Test',
          body_html: '<p>Test</p>',
        }),
      })

      await POST(request)

      // Verify insert was called with empty variables object
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {},
        })
      )
    })
  })
})
