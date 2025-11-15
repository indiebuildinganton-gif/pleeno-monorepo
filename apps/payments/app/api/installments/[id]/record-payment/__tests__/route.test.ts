/**
 * Record Payment API Tests
 *
 * Unit and integration tests for POST /api/installments/[id]/record-payment
 * Tests payment recording, status updates, commission calculation, and validation
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 1: Record Payment API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock Supabase client methods
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockUpdate = vi.fn()

// Mock activity logger
vi.mock('@pleeno/database/activity-logger', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}))

// Mock audit logger
vi.mock('@pleeno/database/audit-logger', () => ({
  logPaymentAudit: vi.fn().mockResolvedValue(undefined),
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

// Mock createServerClient
vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

// Import mocked functions
import { createServerClient } from '@pleeno/database/server'
import { logActivity } from '@pleeno/database/activity-logger'
import { logPaymentAudit } from '@pleeno/database/audit-logger'

describe('POST /api/installments/[id]/record-payment', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@agency.com',
    app_metadata: {
      role: 'agency_admin',
      agency_id: 'agency-123',
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-15T12:00:00Z',
    role: 'authenticated',
    updated_at: '2024-01-15T12:00:00Z',
  }

  const mockUserData = {
    first_name: 'John',
    last_name: 'Doe',
  }

  const mockInstallment = {
    id: 'installment-123',
    payment_plan_id: 'plan-123',
    agency_id: 'agency-123',
    installment_number: 1,
    amount: 1000,
    status: 'pending',
    paid_date: null,
    paid_amount: null,
    payment_notes: null,
    payment_plans: {
      id: 'plan-123',
      agency_id: 'agency-123',
      total_amount: 10000,
      expected_commission: 1500,
    },
  }

  const validRequestBody = {
    paid_date: '2025-01-15',
    paid_amount: 1000,
    notes: 'Payment received via bank transfer',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: Mock successful authentication
    const supabaseMock = vi.mocked(createServerClient)
    supabaseMock.mockReturnValue({
      from: mockFrom,
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any)
  })

  describe('Successful Payment Recording', () => {
    it('should successfully record a full payment and update status to paid', async () => {
      // Mock installment fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockInstallment,
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock installment update
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...mockInstallment,
                  paid_date: '2025-01-15',
                  paid_amount: 1000,
                  status: 'paid',
                  payment_notes: 'Payment received via bank transfer',
                },
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock fetch all installments
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: 'installment-123', status: 'paid', paid_amount: 1000, amount: 1000 },
              { id: 'installment-124', status: 'pending', paid_amount: null, amount: 1000 },
            ],
            error: null,
          }),
        }),
      })

      // Mock payment plan update
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'plan-123',
                  status: 'active',
                  earned_commission: 150, // (1000 / 10000) * 1500
                },
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock user data fetch for activity logging
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/installments/installment-123/record-payment', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'installment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.installment.status).toBe('paid')
      expect(data.data.installment.paid_amount).toBe(1000)
      expect(data.data.installment.paid_date).toBe('2025-01-15')
      expect(data.data.installment.payment_notes).toBe('Payment received via bank transfer')
      expect(data.data.payment_plan.earned_commission).toBe(150)
      expect(logActivity).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          agencyId: 'agency-123',
          userId: 'user-123',
          entityType: 'installment',
          entityId: 'installment-123',
          action: 'recorded',
        })
      )
      expect(logPaymentAudit).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          agencyId: 'agency-123',
          userId: 'user-123',
          installmentId: 'installment-123',
          oldValues: expect.objectContaining({
            status: 'pending',
            paid_date: null,
            paid_amount: null,
            payment_notes: null,
          }),
          newValues: expect.objectContaining({
            status: 'paid',
            paid_date: '2025-01-15',
            paid_amount: 1000,
            payment_notes: 'Payment received via bank transfer',
          }),
        })
      )
    })

    it('should successfully record a partial payment and update status to partial', async () => {
      const partialPaymentBody = {
        paid_date: '2025-01-15',
        paid_amount: 500, // Half payment
        notes: 'Partial payment received',
      }

      // Mock installment fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockInstallment,
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock installment update
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...mockInstallment,
                  paid_date: '2025-01-15',
                  paid_amount: 500,
                  status: 'partial',
                  payment_notes: 'Partial payment received',
                },
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock fetch all installments
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: 'installment-123', status: 'partial', paid_amount: 500, amount: 1000 },
              { id: 'installment-124', status: 'pending', paid_amount: null, amount: 1000 },
            ],
            error: null,
          }),
        }),
      })

      // Mock payment plan update
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'plan-123',
                  status: 'active',
                  earned_commission: 75, // (500 / 10000) * 1500
                },
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock user data fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/installments/installment-123/record-payment', {
        method: 'POST',
        body: JSON.stringify(partialPaymentBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'installment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.installment.status).toBe('partial')
      expect(data.data.installment.paid_amount).toBe(500)
      expect(data.data.payment_plan.status).toBe('active')
    })

    it('should mark payment plan as completed when all installments are paid', async () => {
      // Mock installment fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockInstallment,
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock installment update
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...mockInstallment,
                  paid_date: '2025-01-15',
                  paid_amount: 1000,
                  status: 'paid',
                  payment_notes: 'Final payment',
                },
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock fetch all installments - all paid
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: 'installment-123', status: 'paid', paid_amount: 1000, amount: 1000 },
              { id: 'installment-124', status: 'paid', paid_amount: 1000, amount: 1000 },
            ],
            error: null,
          }),
        }),
      })

      // Mock payment plan update with completed status
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'plan-123',
                  status: 'completed',
                  earned_commission: 300, // (2000 / 10000) * 1500
                },
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock user data fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/installments/installment-123/record-payment', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'installment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.payment_plan.status).toBe('completed')
    })
  })

  describe('Validation Errors', () => {
    it('should reject payment date in the future', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 10)
      const futureDateStr = futureDate.toISOString().split('T')[0]

      const invalidBody = {
        paid_date: futureDateStr,
        paid_amount: 1000,
      }

      const request = new NextRequest('http://localhost:3000/api/installments/installment-123/record-payment', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'installment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Invalid request body')
    })

    it('should reject negative payment amount', async () => {
      const invalidBody = {
        paid_date: '2025-01-15',
        paid_amount: -100,
      }

      const request = new NextRequest('http://localhost:3000/api/installments/installment-123/record-payment', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'installment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should reject payment amount exceeding 110% of installment amount', async () => {
      // Mock installment fetch
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockInstallment,
                error: null,
              }),
            }),
          }),
        }),
      })

      const invalidBody = {
        paid_date: '2025-01-15',
        paid_amount: 1200, // Exceeds 1000 * 1.1 = 1100
      }

      const request = new NextRequest('http://localhost:3000/api/installments/installment-123/record-payment', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'installment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Payment amount cannot exceed')
    })

    it('should reject notes longer than 500 characters', async () => {
      const invalidBody = {
        paid_date: '2025-01-15',
        paid_amount: 1000,
        notes: 'a'.repeat(501),
      }

      const request = new NextRequest('http://localhost:3000/api/installments/installment-123/record-payment', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'installment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock authentication failure
      const supabaseMock = vi.mocked(createServerClient)
      supabaseMock.mockReturnValue({
        from: mockFrom,
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/installments/installment-123/record-payment', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'installment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Not authenticated')
    })

    it('should return 403 if user has no agency_id', async () => {
      // Mock user without agency_id
      const supabaseMock = vi.mocked(createServerClient)
      supabaseMock.mockReturnValue({
        from: mockFrom,
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                ...mockUser,
                app_metadata: {
                  role: 'user',
                  // No agency_id
                },
              },
            },
            error: null,
          }),
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/installments/installment-123/record-payment', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'installment-123' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('User not associated with an agency')
    })

    it('should return 404 if installment not found', async () => {
      // Mock installment not found
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/installments/installment-999/record-payment', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'installment-999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Installment not found')
    })
  })
})
