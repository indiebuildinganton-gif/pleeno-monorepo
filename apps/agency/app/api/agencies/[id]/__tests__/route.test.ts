/**
 * Agency Update API Route Tests
 *
 * Tests for the PATCH /api/agencies/[id] endpoint
 * Epic 2: Agency Configuration & User Management
 * Story 2-1: Agency Profile Setup
 * Task 7: Write Tests for Agency Settings Feature
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { PATCH } from '../route'

// Mock Supabase client
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

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

describe('PATCH /api/agencies/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock chain setup
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

  describe('Authentication and Authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      // Mock requireRole to return 401
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 403 for non-admin users', async () => {
      // Mock requireRole to return 403
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
      )

      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.error).toContain('Forbidden')
    })

    it('allows agency_admin to update their own agency', async () => {
      // Mock requireRole to return admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          id: 'admin-user-123',
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
        },
        role: 'agency_admin',
      })

      // Mock successful database update
      mockSingle.mockResolvedValue({
        data: {
          id: 'agency-123',
          name: 'Updated Agency',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Agency',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Updated Agency')
    })

    it('prevents cross-agency updates (RLS)', async () => {
      // Mock requireRole to return admin user for agency-1
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          id: 'admin-user-123',
          email: 'admin@agency1.com',
          app_metadata: {
            role: 'agency_admin',
            agency_id: 'agency-1',
          },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          role: 'authenticated',
          updated_at: new Date().toISOString(),
        },
        role: 'agency_admin',
      })

      // User tries to update agency-2 (different agency)
      const request = new NextRequest('http://localhost:3000/api/agencies/agency-2', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Hacked Agency',
          contact_email: 'hacker@test.com',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-2' } })
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Cannot update other agencies')
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          id: 'admin-user-123',
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
        },
        role: 'agency_admin',
      })
    })

    it('rejects empty agency name', async () => {
      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: '',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('rejects invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Test Agency',
          contact_email: 'not-an-email',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('rejects invalid currency', async () => {
      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency: 'INVALID',
          timezone: 'Australia/Brisbane',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('rejects invalid timezone', async () => {
      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone: 'Invalid/Timezone',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('rejects invalid phone number format', async () => {
      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          contact_phone: 'invalid-phone',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('accepts valid data without optional phone', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'agency-123',
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('reports multiple validation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: '',
          contact_email: 'invalid-email',
          currency: 'XXX',
          timezone: 'BadTZ',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.details.errors).toBeDefined()
    })
  })

  describe('Successful Updates', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          id: 'admin-user-123',
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
        },
        role: 'agency_admin',
      })
    })

    it('updates agency with all fields', async () => {
      const updatedAgency = {
        id: 'agency-123',
        name: 'Updated Agency',
        contact_email: 'new@test.com',
        contact_phone: '+61 400 000 000',
        currency: 'USD',
        timezone: 'America/New_York',
        updated_at: new Date().toISOString(),
      }

      mockSingle.mockResolvedValue({
        data: updatedAgency,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Agency',
          contact_email: 'new@test.com',
          contact_phone: '+61 400 000 000',
          currency: 'USD',
          timezone: 'America/New_York',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedAgency)
      expect(data.data.name).toBe('Updated Agency')
      expect(data.data.contact_email).toBe('new@test.com')
      expect(data.data.currency).toBe('USD')
      expect(data.data.timezone).toBe('America/New_York')
    })

    it('updates agency with various supported currencies', async () => {
      const currencies = ['AUD', 'USD', 'EUR', 'GBP', 'NZD', 'CAD']

      for (const currency of currencies) {
        mockSingle.mockResolvedValue({
          data: {
            id: 'agency-123',
            name: 'Test Agency',
            contact_email: 'admin@test.com',
            currency,
            timezone: 'Australia/Brisbane',
          },
          error: null,
        })

        const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
          method: 'PATCH',
          body: JSON.stringify({
            name: 'Test Agency',
            contact_email: 'admin@test.com',
            currency,
            timezone: 'Australia/Brisbane',
          }),
        })

        const response = await PATCH(request, { params: { id: 'agency-123' } })
        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data.data.currency).toBe(currency)
      }
    })

    it('updates agency with various supported timezones', async () => {
      const timezones = [
        'UTC',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
      ]

      for (const timezone of timezones) {
        mockSingle.mockResolvedValue({
          data: {
            id: 'agency-123',
            name: 'Test Agency',
            contact_email: 'admin@test.com',
            currency: 'AUD',
            timezone,
          },
          error: null,
        })

        const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
          method: 'PATCH',
          body: JSON.stringify({
            name: 'Test Agency',
            contact_email: 'admin@test.com',
            currency: 'AUD',
            timezone,
          }),
        })

        const response = await PATCH(request, { params: { id: 'agency-123' } })
        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data.data.timezone).toBe(timezone)
      }
    })
  })

  describe('Database Errors', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          id: 'admin-user-123',
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
        },
        role: 'agency_admin',
      })
    })

    it('handles database update error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      })

      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('handles agency not found after update', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          id: 'admin-user-123',
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
        },
        role: 'agency_admin',
      })
    })

    it('handles user without agency_id', async () => {
      // Mock requireRole to return user without agency_id
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          id: 'admin-user-123',
          email: 'admin@test.com',
          app_metadata: {
            role: 'agency_admin',
            // No agency_id
          },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          role: 'authenticated',
          updated_at: new Date().toISOString(),
        },
        role: 'agency_admin',
      })

      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Test Agency',
          contact_email: 'admin@test.com',
          currency: 'AUD',
          timezone: 'Australia/Brisbane',
        }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('not associated with an agency')
    })

    it('handles malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/agencies/agency-123', {
        method: 'PATCH',
        body: 'invalid json',
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })
})
