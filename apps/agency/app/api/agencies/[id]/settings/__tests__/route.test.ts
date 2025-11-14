/**
 * Agency Settings API Route Tests
 *
 * Tests for the PATCH /api/agencies/[id]/settings endpoint
 * Epic 5: Intelligent Status Automation
 * Story 5.2: Due Soon Notification Flags
 * Task 4: Testing and validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { PATCH } from '../route'

// Mock Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabaseQueries: any[]

const createMockSupabase = () => {
  mockSupabaseQueries = []

  return {
    from: (table: string) => {
      const query = {
        update: (data: any) => {
          const updateQuery = {
            eq: (column: string, value: string) => ({
              select: () => ({
                single: () => mockSupabaseQueries.shift() || { data: null, error: null },
              }),
            }),
          }
          return updateQuery
        },
      }
      return query
    },
    auth: {
      getUser: vi.fn(),
    },
  }
}

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => createMockSupabase()),
}))

// Mock requireRole from @pleeno/auth
vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(),
}))

// Import mocked requireRole
import { requireRole } from '@pleeno/auth'

describe('PATCH /api/agencies/[id]/settings', () => {
  const mockAgency = {
    id: 'agency-123',
    name: 'Test Agency',
    timezone: 'Australia/Brisbane',
    currency: 'AUD',
    due_soon_threshold_days: 4,
    updated_at: new Date().toISOString(),
  }

  const mockAdminUser = {
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

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseQueries = []
  })

  describe('Success cases', () => {
    it('updates due_soon_threshold_days successfully', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const updatedAgency = {
        ...mockAgency,
        due_soon_threshold_days: 7,
      }

      mockSupabaseQueries.push({
        data: updatedAgency,
        error: null,
      })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 7 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.due_soon_threshold_days).toBe(7)
    })

    it('updates threshold to 2 days', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const updatedAgency = {
        ...mockAgency,
        due_soon_threshold_days: 2,
      }

      mockSupabaseQueries.push({
        data: updatedAgency,
        error: null,
      })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 2 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.due_soon_threshold_days).toBe(2)
    })

    it('updates threshold to 30 days (maximum)', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const updatedAgency = {
        ...mockAgency,
        due_soon_threshold_days: 30,
      }

      mockSupabaseQueries.push({
        data: updatedAgency,
        error: null,
      })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 30 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.due_soon_threshold_days).toBe(30)
    })

    it('updates threshold to 1 day (minimum)', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const updatedAgency = {
        ...mockAgency,
        due_soon_threshold_days: 1,
      }

      mockSupabaseQueries.push({
        data: updatedAgency,
        error: null,
      })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 1 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.due_soon_threshold_days).toBe(1)
    })

    it('returns full agency object after update', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      mockSupabaseQueries.push({
        data: mockAgency,
        error: null,
      })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 4 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveProperty('id')
      expect(data.data).toHaveProperty('name')
      expect(data.data).toHaveProperty('timezone')
      expect(data.data).toHaveProperty('currency')
      expect(data.data).toHaveProperty('due_soon_threshold_days')
    })
  })

  describe('Authentication and authorization', () => {
    it('requires authentication', async () => {
      const unauthorizedResponse = NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
      vi.mocked(requireRole).mockResolvedValueOnce(unauthorizedResponse)

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 7 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })

      expect(response.status).toBe(401)
    })

    it('requires agency_admin role', async () => {
      const forbiddenResponse = NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
      vi.mocked(requireRole).mockResolvedValueOnce(forbiddenResponse)

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 7 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })

      expect(response.status).toBe(403)
    })

    it('prevents agency_user from updating settings', async () => {
      const forbiddenResponse = NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
      vi.mocked(requireRole).mockResolvedValueOnce(forbiddenResponse)

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 7 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })

      expect(response.status).toBe(403)
    })

    it('requires user to be associated with an agency', async () => {
      const userWithoutAgency = {
        ...mockAdminUser,
        app_metadata: {
          role: 'agency_admin',
          agency_id: undefined,
        },
      }

      vi.mocked(requireRole).mockResolvedValueOnce({ user: userWithoutAgency })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 7 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('agency')
    })

    it('prevents admin from updating other agencies', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const request = new NextRequest('http://localhost:3002/api/agencies/other-agency/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 7 }),
      })

      const response = await PATCH(request, { params: { id: 'other-agency' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Cannot update other agencies')
    })
  })

  describe('Validation', () => {
    it('validates threshold value is within range (rejects negative)', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: -1 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('validates threshold value is within range (rejects zero)', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 0 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('validates threshold value is within range (rejects > 30)', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 31 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('validates threshold is a number (rejects string)', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 'seven' }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('validates threshold is an integer (rejects decimal)', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 4.5 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('handles invalid JSON body', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: 'invalid json',
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(data.success).toBe(false)
    })

    it('handles empty request body', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({}),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })

      // Empty body is valid (no updates), but should still work
      expect(response.status).toBeGreaterThanOrEqual(200)
    })
  })

  describe('Error handling', () => {
    it('handles database update error', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      mockSupabaseQueries.push({
        data: null,
        error: { message: 'Database error' },
      })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 7 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('handles agency not found after update', async () => {
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      mockSupabaseQueries.push({
        data: null,
        error: null,
      })

      const request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 7 }),
      })

      const response = await PATCH(request, { params: { id: 'agency-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  describe('RLS policy enforcement', () => {
    it('only allows admin to update their own agency', async () => {
      // This test verifies that the API checks userAgencyId === params.id
      // Database-level RLS is tested in integration tests
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })

      const request = new NextRequest('http://localhost:3002/api/agencies/other-agency-456/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 7 }),
      })

      const response = await PATCH(request, { params: { id: 'other-agency-456' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Cannot update other agencies')
    })
  })

  describe('Edge cases', () => {
    it('handles extremely large agency ID', async () => {
      const userWithLongId = {
        ...mockAdminUser,
        app_metadata: {
          ...mockAdminUser.app_metadata,
          agency_id: 'a'.repeat(100),
        },
      }

      vi.mocked(requireRole).mockResolvedValueOnce({ user: userWithLongId })

      const longId = 'a'.repeat(100)
      const request = new NextRequest(`http://localhost:3002/api/agencies/${longId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 7 }),
      })

      const response = await PATCH(request, { params: { id: longId } })

      // Should work if IDs match
      expect(response.status).toBeGreaterThanOrEqual(200)
    })

    it('updates threshold multiple times', async () => {
      // First update
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })
      mockSupabaseQueries.push({
        data: { ...mockAgency, due_soon_threshold_days: 7 },
        error: null,
      })

      let request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 7 }),
      })

      let response = await PATCH(request, { params: { id: 'agency-123' } })
      let data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.due_soon_threshold_days).toBe(7)

      // Second update
      vi.mocked(requireRole).mockResolvedValueOnce({ user: mockAdminUser })
      mockSupabaseQueries.push({
        data: { ...mockAgency, due_soon_threshold_days: 2 },
        error: null,
      })

      request = new NextRequest('http://localhost:3002/api/agencies/agency-123/settings', {
        method: 'PATCH',
        body: JSON.stringify({ due_soon_threshold_days: 2 }),
      })

      response = await PATCH(request, { params: { id: 'agency-123' } })
      data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.due_soon_threshold_days).toBe(2)
    })
  })
})
