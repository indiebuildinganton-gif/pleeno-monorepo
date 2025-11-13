/**
 * Installment Generation API Tests
 *
 * Unit and integration tests for POST /api/payment-plans/[id]/generate-installments
 * Tests amount distribution, due date calculations, validation, and authentication
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 05: Installment Generation Logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock Supabase client methods
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

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

describe('POST /api/payment-plans/[id]/generate-installments', () => {
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

  const mockPaymentPlan = {
    id: 'plan-123',
    agency_id: 'agency-123',
  }

  const validRequestBody = {
    initial_payment_amount: 1000,
    initial_payment_due_date: '2025-01-15T00:00:00.000Z',
    initial_payment_paid: false,
    number_of_installments: 11,
    payment_frequency: 'monthly' as const,
    first_college_due_date: '2025-02-01T00:00:00.000Z',
    student_lead_time_days: 7,
    materials_cost: 500,
    admin_fees: 300,
    other_fees: 200,
    gst_inclusive: true,
    total_course_value: 10000,
    commission_rate: 0.15,
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

    // Default: Mock payment plan exists
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      single: mockSingle,
    })
    mockSingle.mockResolvedValue({
      data: mockPaymentPlan,
      error: null,
    })
  })

  describe('Amount Distribution', () => {
    it('distributes amounts correctly with initial payment', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify commissionable value calculation
      const expectedCommissionableValue = 10000 - 500 - 300 - 200 // = 9000
      expect(data.data.summary.commissionable_value).toBe(9000)

      // Verify initial payment installment
      const initialPayment = data.data.installments.find((i: any) => i.installment_number === 0)
      expect(initialPayment).toBeDefined()
      expect(initialPayment.amount).toBe(1000)
      expect(initialPayment.is_initial_payment).toBe(true)
      expect(initialPayment.status).toBe('draft')

      // Verify regular installments sum correctly
      const regularInstallments = data.data.installments.filter((i: any) => i.installment_number > 0)
      expect(regularInstallments).toHaveLength(11)

      // Sum of all installments should equal commissionable value
      const totalAmount = data.data.installments.reduce((sum: number, i: any) => sum + i.amount, 0)
      expect(totalAmount).toBeCloseTo(expectedCommissionableValue, 2)
    })

    it('distributes amounts correctly without initial payment', async () => {
      const requestBody = {
        ...validRequestBody,
        initial_payment_amount: 0,
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Should NOT have initial payment installment
      const initialPayment = data.data.installments.find((i: any) => i.installment_number === 0)
      expect(initialPayment).toBeUndefined()

      // Should have 11 regular installments
      expect(data.data.installments).toHaveLength(11)

      // All installments sum to commissionable value
      const totalAmount = data.data.installments.reduce((sum: number, i: any) => sum + i.amount, 0)
      expect(totalAmount).toBeCloseTo(9000, 2)
    })

    it('handles rounding correctly with remainder distribution', async () => {
      // Use values that produce remainder when divided
      const requestBody = {
        ...validRequestBody,
        total_course_value: 10000,
        materials_cost: 0,
        admin_fees: 0,
        other_fees: 0,
        initial_payment_amount: 0,
        number_of_installments: 3,
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()
      const installments = data.data.installments

      // Total should equal exactly 10000
      const totalAmount = installments.reduce((sum: number, i: any) => sum + i.amount, 0)
      expect(totalAmount).toBe(10000)

      // Last installment should have remainder added
      const lastInstallment = installments[installments.length - 1]
      expect(lastInstallment.installment_number).toBe(3)

      // Verify amounts sum exactly (no floating point errors)
      expect(installments[0].amount + installments[1].amount + installments[2].amount).toBe(10000)
    })

    it('handles initial payment paid status correctly', async () => {
      const requestBody = {
        ...validRequestBody,
        initial_payment_paid: true,
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()
      const initialPayment = data.data.installments.find((i: any) => i.installment_number === 0)

      expect(initialPayment.status).toBe('paid')
    })
  })

  describe('Due Date Generation', () => {
    it('generates monthly due dates correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()
      const regularInstallments = data.data.installments.filter((i: any) => i.installment_number > 0)

      // Verify first installment college due date
      expect(regularInstallments[0].college_due_date).toBe('2025-02-01T00:00:00.000Z')

      // Verify second installment is 1 month later
      expect(regularInstallments[1].college_due_date).toBe('2025-03-01T00:00:00.000Z')

      // Verify student due dates are 7 days before college due dates
      const firstCollegeDueDate = new Date(regularInstallments[0].college_due_date)
      const firstStudentDueDate = new Date(regularInstallments[0].student_due_date)
      const daysDiff = Math.round((firstCollegeDueDate.getTime() - firstStudentDueDate.getTime()) / (1000 * 60 * 60 * 24))
      expect(daysDiff).toBe(7)
    })

    it('generates quarterly due dates correctly', async () => {
      const requestBody = {
        ...validRequestBody,
        payment_frequency: 'quarterly' as const,
        number_of_installments: 4,
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()
      const regularInstallments = data.data.installments.filter((i: any) => i.installment_number > 0)

      expect(regularInstallments).toHaveLength(4)

      // Verify first installment
      expect(regularInstallments[0].college_due_date).toBe('2025-02-01T00:00:00.000Z')

      // Verify second installment is 3 months later
      expect(regularInstallments[1].college_due_date).toBe('2025-05-01T00:00:00.000Z')

      // Verify third installment is 3 months after second
      expect(regularInstallments[2].college_due_date).toBe('2025-08-01T00:00:00.000Z')
    })

    it('calculates student due dates with lead time', async () => {
      const requestBody = {
        ...validRequestBody,
        student_lead_time_days: 14, // 2 weeks lead time
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()
      const firstInstallment = data.data.installments.find((i: any) => i.installment_number === 1)

      // Student due date should be 14 days before college due date
      const collegeDueDate = new Date(firstInstallment.college_due_date)
      const studentDueDate = new Date(firstInstallment.student_due_date)
      const daysDiff = Math.round((collegeDueDate.getTime() - studentDueDate.getTime()) / (1000 * 60 * 60 * 24))
      expect(daysDiff).toBe(14)
    })

    it('handles custom frequency with placeholder dates', async () => {
      const requestBody = {
        ...validRequestBody,
        payment_frequency: 'custom' as const,
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()
      const firstInstallment = data.data.installments.find((i: any) => i.installment_number === 1)

      // Custom frequency should have empty date strings (placeholders)
      expect(firstInstallment.student_due_date).toBe('')
      expect(firstInstallment.college_due_date).toBe('')
    })
  })

  describe('Commission Calculations', () => {
    it('calculates expected commission correctly (GST inclusive)', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()

      // Commissionable value = 10000 - 500 - 300 - 200 = 9000
      // GST inclusive: base = 9000
      // Expected commission = 9000 * 0.15 = 1350
      expect(data.data.summary.expected_commission).toBe(1350)
    })

    it('calculates expected commission correctly (GST exclusive)', async () => {
      const requestBody = {
        ...validRequestBody,
        gst_inclusive: false,
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()

      // Commissionable value = 9000
      // GST exclusive: base = 9000 / 1.10 = 8181.82
      // Expected commission = 8181.82 * 0.15 = 1227.27
      expect(data.data.summary.expected_commission).toBeCloseTo(1227.27, 2)
    })

    it('marks all installments as generating commission', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()

      // All installments should generate commission
      data.data.installments.forEach((installment: any) => {
        expect(installment.generates_commission).toBe(true)
      })
    })
  })

  describe('Summary Calculations', () => {
    it('returns correct summary data', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()
      const summary = data.data.summary

      expect(summary.total_course_value).toBe(10000)
      expect(summary.commissionable_value).toBe(9000)
      expect(summary.expected_commission).toBe(1350)
      expect(summary.initial_payment).toBe(1000)
      expect(summary.total_installments).toBe(12) // 1 initial + 11 regular
      expect(summary.amount_per_installment).toBeCloseTo(727.27, 2) // (9000 - 1000) / 11
    })

    it('calculates summary without initial payment', async () => {
      const requestBody = {
        ...validRequestBody,
        initial_payment_amount: 0,
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()
      const summary = data.data.summary

      expect(summary.initial_payment).toBe(0)
      expect(summary.total_installments).toBe(11) // No initial payment
      expect(summary.amount_per_installment).toBeCloseTo(818.18, 2) // 9000 / 11
    })
  })

  describe('Validation', () => {
    it('rejects negative initial payment amount', async () => {
      const requestBody = {
        ...validRequestBody,
        initial_payment_amount: -100,
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.type).toBe('validation_error')
    })

    it('rejects invalid payment frequency', async () => {
      const requestBody = {
        ...validRequestBody,
        payment_frequency: 'weekly' as any,
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.type).toBe('validation_error')
    })

    it('rejects zero or negative number of installments', async () => {
      const requestBody = {
        ...validRequestBody,
        number_of_installments: 0,
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.type).toBe('validation_error')
    })

    it('rejects invalid date formats', async () => {
      const requestBody = {
        ...validRequestBody,
        first_college_due_date: 'invalid-date',
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.type).toBe('validation_error')
    })

    it('rejects commission rate outside 0-1 range', async () => {
      const requestBody = {
        ...validRequestBody,
        commission_rate: 1.5, // 150% is invalid
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.type).toBe('validation_error')
    })

    it('rejects initial payment exceeding commissionable value', async () => {
      const requestBody = {
        ...validRequestBody,
        initial_payment_amount: 15000, // Exceeds commissionable value of 9000
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('cannot exceed commissionable value')
    })

    it('rejects negative student lead time days', async () => {
      const requestBody = {
        ...validRequestBody,
        student_lead_time_days: -5,
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.type).toBe('validation_error')
    })
  })

  describe('Authentication and Authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      const supabaseMock = vi.mocked(createServerClient)
      supabaseMock.mockReturnValue({
        from: mockFrom,
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('authenticated')
    })

    it('returns 403 for users without agency_id', async () => {
      const userWithoutAgency = {
        ...mockUser,
        app_metadata: {
          role: 'agency_admin',
          // Missing agency_id
        },
      }

      const supabaseMock = vi.mocked(createServerClient)
      supabaseMock.mockReturnValue({
        from: mockFrom,
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: userWithoutAgency },
            error: null,
          }),
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('not associated with an agency')
    })

    it('returns 400 for non-existent payment plan', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Payment plan not found' },
      })

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-999/generate-installments', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const params = Promise.resolve({ id: 'plan-999' })
      const response = await POST(request, { params })
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Payment plan not found')
    })

    it('returns 400 when payment plan belongs to different agency', async () => {
      const differentAgencyPlan = {
        id: 'plan-123',
        agency_id: 'agency-999', // Different agency
      }

      mockSingle.mockResolvedValueOnce({
        data: differentAgencyPlan,
        error: null,
      })

      // Mock will fail the second eq check (agency_id mismatch)
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Payment plan not found' },
      })

      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(400)
    })
  })

  describe('Installment Structure', () => {
    it('sets correct installment numbers starting from 0', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()
      const installments = data.data.installments

      // Initial payment should be installment 0
      expect(installments[0].installment_number).toBe(0)
      expect(installments[0].is_initial_payment).toBe(true)

      // Regular installments should be 1..N
      for (let i = 1; i <= 11; i++) {
        expect(installments[i].installment_number).toBe(i)
        expect(installments[i].is_initial_payment).toBe(false)
      }
    })

    it('sets all installments to draft status except paid initial payment', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment-plans/plan-123/generate-installments', {
        method: 'POST',
        body: JSON.stringify({
          ...validRequestBody,
          initial_payment_paid: true,
        }),
      })

      const params = Promise.resolve({ id: 'plan-123' })
      const response = await POST(request, { params })
      expect(response.status).toBe(200)

      const data = await response.json()
      const installments = data.data.installments

      // Initial payment should be 'paid'
      expect(installments[0].status).toBe('paid')

      // Regular installments should be 'draft'
      for (let i = 1; i < installments.length; i++) {
        expect(installments[i].status).toBe('draft')
      }
    })
  })
})
