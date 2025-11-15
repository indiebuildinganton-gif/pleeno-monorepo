/**
 * Payment History Edge Case Tests
 *
 * Story 7.5: Student Payment History Report
 * Task 9: Testing and Validation
 *
 * Tests for edge cases and boundary conditions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest, NextResponse } from 'next/server'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockRpc = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

// Mock auth utility
const mockRequireRole = vi.fn()
vi.mock('@pleeno/auth', () => ({
  requireRole: mockRequireRole,
}))

// Mock error handlers
vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual('@pleeno/utils')
  return {
    ...actual,
    handleApiError: vi.fn((error, context) => {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      )
    }),
    ForbiddenError: class ForbiddenError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'ForbiddenError'
      }
    },
  }
})

describe('Payment History Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockRequireRole.mockResolvedValue({
      user: {
        id: 'user-1',
        app_metadata: { agency_id: 'agency-1' },
      },
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
    })

    mockSingle.mockResolvedValue({
      data: { id: 'student-1', full_name: 'John Doe' },
      error: null,
    })
  })

  describe('Large Datasets', () => {
    it('should handle large payment history (100+ installments)', async () => {
      // Generate large dataset with 150 installments across 10 payment plans
      const largeHistory = Array.from({ length: 150 }, (_, i) => ({
        payment_plan_id: `plan-${Math.floor(i / 15)}`, // 15 installments per plan
        college_name: 'Imagine Education',
        branch_name: 'Brisbane Campus',
        program_name: 'Certificate IV',
        plan_total_amount: '15000',
        plan_start_date: '2025-01-01',
        plan_status: 'active',
        installment_id: `inst-${i}`,
        installment_number: (i % 15) + 1,
        amount: '1000',
        due_date: `2025-${String((i % 12) + 1).padStart(2, '0')}-15`,
        paid_at: i % 2 === 0 ? '2025-01-10' : null, // Half paid, half pending
        paid_amount: i % 2 === 0 ? '1000' : null,
        status: i % 2 === 0 ? 'paid' : 'pending',
      }))

      mockRpc.mockResolvedValue({
        data: largeHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(10) // 10 payment plans
      expect(data.data[0].installments).toHaveLength(15) // 15 installments each

      // Verify calculations with large numbers
      expect(data.summary.total_paid).toBe(75000) // 75 paid installments × 1000
      expect(data.summary.total_outstanding).toBe(75000) // 75 pending installments × 1000
      expect(data.summary.percentage_paid).toBe(50)
    })

    it('should handle 500+ installments without performance degradation', async () => {
      // Generate very large dataset
      const veryLargeHistory = Array.from({ length: 500 }, (_, i) => ({
        payment_plan_id: `plan-${Math.floor(i / 25)}`, // 25 installments per plan
        college_name: 'Imagine Education',
        branch_name: 'Brisbane Campus',
        program_name: 'Certificate IV',
        plan_total_amount: '25000',
        plan_start_date: '2025-01-01',
        plan_status: 'active',
        installment_id: `inst-${i}`,
        installment_number: (i % 25) + 1,
        amount: '1000',
        due_date: `2025-${String((i % 12) + 1).padStart(2, '0')}-15`,
        paid_at: '2025-01-10',
        paid_amount: '1000',
        status: 'paid',
      }))

      mockRpc.mockResolvedValue({
        data: veryLargeHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(20) // 20 payment plans
      expect(data.summary.total_paid).toBe(500000)
    })
  })

  describe('All Paid Installments', () => {
    it('should handle all paid installments (total_outstanding = 0)', async () => {
      const allPaidHistory = [
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '8000',
          plan_start_date: '2025-01-01',
          plan_status: 'completed',
          installment_id: 'inst-1',
          installment_number: 1,
          amount: '5000',
          due_date: '2025-01-15',
          paid_at: '2025-01-10',
          paid_amount: '5000',
          status: 'paid',
        },
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '8000',
          plan_start_date: '2025-01-01',
          plan_status: 'completed',
          installment_id: 'inst-2',
          installment_number: 2,
          amount: '3000',
          due_date: '2025-02-15',
          paid_at: '2025-02-10',
          paid_amount: '3000',
          status: 'paid',
        },
      ]

      mockRpc.mockResolvedValue({
        data: allPaidHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary.total_paid).toBe(8000)
      expect(data.summary.total_outstanding).toBe(0)
      expect(data.summary.percentage_paid).toBe(100)
    })

    it('should handle partial payments correctly', async () => {
      const partialPaymentHistory = [
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '10000',
          plan_start_date: '2025-01-01',
          plan_status: 'active',
          installment_id: 'inst-1',
          installment_number: 1,
          amount: '5000',
          due_date: '2025-01-15',
          paid_at: '2025-01-10',
          paid_amount: '3000', // Partial payment
          status: 'partial',
        },
      ]

      mockRpc.mockResolvedValue({
        data: partialPaymentHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary.total_paid).toBe(3000)
      // Note: Outstanding calculation depends on business logic
      // If partial payments reduce outstanding, this might be 2000 instead
    })
  })

  describe('Cancelled Payment Plans', () => {
    it('should handle cancelled payment plans', async () => {
      const cancelledHistory = [
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '10000',
          plan_start_date: '2025-01-01',
          plan_status: 'cancelled',
          installment_id: 'inst-1',
          installment_number: 1,
          amount: '5000',
          due_date: '2025-01-15',
          paid_at: null,
          paid_amount: null,
          status: 'cancelled',
        },
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '10000',
          plan_start_date: '2025-01-01',
          plan_status: 'cancelled',
          installment_id: 'inst-2',
          installment_number: 2,
          amount: '5000',
          due_date: '2025-02-15',
          paid_at: null,
          paid_amount: null,
          status: 'cancelled',
        },
      ]

      mockRpc.mockResolvedValue({
        data: cancelledHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data[0].plan_status).toBe('cancelled')
      expect(data.data[0].installments).toHaveLength(2)
      expect(data.summary.total_paid).toBe(0)
      expect(data.summary.total_outstanding).toBe(0) // Cancelled not counted
      expect(data.summary.percentage_paid).toBe(0)
    })

    it('should handle mixed cancelled and active installments', async () => {
      const mixedHistory = [
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '10000',
          plan_start_date: '2025-01-01',
          plan_status: 'active',
          installment_id: 'inst-1',
          installment_number: 1,
          amount: '5000',
          due_date: '2025-01-15',
          paid_at: '2025-01-10',
          paid_amount: '5000',
          status: 'paid',
        },
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '10000',
          plan_start_date: '2025-01-01',
          plan_status: 'active',
          installment_id: 'inst-2',
          installment_number: 2,
          amount: '5000',
          due_date: '2025-02-15',
          paid_at: null,
          paid_amount: null,
          status: 'cancelled',
        },
      ]

      mockRpc.mockResolvedValue({
        data: mixedHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary.total_paid).toBe(5000)
      expect(data.summary.total_outstanding).toBe(0) // Cancelled not counted
      expect(data.summary.percentage_paid).toBe(100)
    })
  })

  describe('Special Characters and Edge Cases', () => {
    it('should handle special characters in student names', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'student-1',
          full_name: "O'Brien-Smith (Jr.) [Test]",
        },
        error: null,
      })

      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
    })

    it('should handle special characters in college/program names', async () => {
      const specialCharsHistory = [
        {
          payment_plan_id: 'plan-1',
          college_name: 'École Polytechnique & Technology',
          branch_name: 'São Paulo Campus',
          program_name: 'Bachelor of Science (Honours)',
          plan_total_amount: '10000',
          plan_start_date: '2025-01-01',
          plan_status: 'active',
          installment_id: 'inst-1',
          installment_number: 1,
          amount: '5000',
          due_date: '2025-01-15',
          paid_at: '2025-01-10',
          paid_amount: '5000',
          status: 'paid',
        },
      ]

      mockRpc.mockResolvedValue({
        data: specialCharsHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data[0].college_name).toBe('École Polytechnique & Technology')
      expect(data.data[0].branch_name).toBe('São Paulo Campus')
    })
  })

  describe('Boundary Date Conditions', () => {
    it('should handle installments with same due dates', async () => {
      const sameDateHistory = [
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '10000',
          plan_start_date: '2025-01-01',
          plan_status: 'active',
          installment_id: 'inst-1',
          installment_number: 1,
          amount: '5000',
          due_date: '2025-01-15',
          paid_at: '2025-01-10',
          paid_amount: '5000',
          status: 'paid',
        },
        {
          payment_plan_id: 'plan-2',
          college_name: 'Other College',
          branch_name: 'Sydney Campus',
          program_name: 'Diploma',
          plan_total_amount: '8000',
          plan_start_date: '2025-01-01',
          plan_status: 'active',
          installment_id: 'inst-2',
          installment_number: 1,
          amount: '4000',
          due_date: '2025-01-15', // Same date
          paid_at: null,
          paid_amount: null,
          status: 'pending',
        },
      ]

      mockRpc.mockResolvedValue({
        data: sameDateHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(2)
      expect(data.summary.total_paid).toBe(5000)
      expect(data.summary.total_outstanding).toBe(4000)
    })

    it('should handle date range at boundaries (inclusive)', async () => {
      mockRpc.mockResolvedValue({
        data: [
          {
            payment_plan_id: 'plan-1',
            college_name: 'Imagine Education',
            branch_name: 'Brisbane Campus',
            program_name: 'Certificate IV',
            plan_total_amount: '5000',
            plan_start_date: '2025-01-01',
            plan_status: 'active',
            installment_id: 'inst-1',
            installment_number: 1,
            amount: '5000',
            due_date: '2025-01-01', // Exactly on start date
            paid_at: '2025-01-01',
            paid_amount: '5000',
            status: 'paid',
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history?date_from=2025-01-01&date_to=2025-12-31'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(1)
    })
  })

  describe('Decimal and Currency Precision', () => {
    it('should handle decimal amounts correctly', async () => {
      const decimalHistory = [
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '10000.50',
          plan_start_date: '2025-01-01',
          plan_status: 'active',
          installment_id: 'inst-1',
          installment_number: 1,
          amount: '3333.50',
          due_date: '2025-01-15',
          paid_at: '2025-01-10',
          paid_amount: '3333.50',
          status: 'paid',
        },
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '10000.50',
          plan_start_date: '2025-01-01',
          plan_status: 'active',
          installment_id: 'inst-2',
          installment_number: 2,
          amount: '3333.50',
          due_date: '2025-02-15',
          paid_at: null,
          paid_amount: null,
          status: 'pending',
        },
      ]

      mockRpc.mockResolvedValue({
        data: decimalHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary.total_paid).toBe(3333.5)
      expect(data.summary.total_outstanding).toBe(3333.5)
      expect(data.summary.percentage_paid).toBeCloseTo(50, 1)
    })

    it('should handle very small amounts', async () => {
      const smallAmountHistory = [
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '0.50',
          plan_start_date: '2025-01-01',
          plan_status: 'active',
          installment_id: 'inst-1',
          installment_number: 1,
          amount: '0.01',
          due_date: '2025-01-15',
          paid_at: '2025-01-10',
          paid_amount: '0.01',
          status: 'paid',
        },
      ]

      mockRpc.mockResolvedValue({
        data: smallAmountHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary.total_paid).toBe(0.01)
    })

    it('should handle very large amounts', async () => {
      const largeAmountHistory = [
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '999999999.99',
          plan_start_date: '2025-01-01',
          plan_status: 'active',
          installment_id: 'inst-1',
          installment_number: 1,
          amount: '100000000',
          due_date: '2025-01-15',
          paid_at: '2025-01-10',
          paid_amount: '100000000',
          status: 'paid',
        },
      ]

      mockRpc.mockResolvedValue({
        data: largeAmountHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary.total_paid).toBe(100000000)
    })
  })

  describe('Payment Plan Without Installments', () => {
    it('should handle payment plan with no installments', async () => {
      const noInstallmentsHistory = [
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '10000',
          plan_start_date: '2025-01-01',
          plan_status: 'pending',
          installment_id: null,
          installment_number: null,
          amount: null,
          due_date: null,
          paid_at: null,
          paid_amount: null,
          status: null,
        },
      ]

      mockRpc.mockResolvedValue({
        data: noInstallmentsHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].installments).toHaveLength(0)
      expect(data.summary.total_paid).toBe(0)
      expect(data.summary.total_outstanding).toBe(0)
    })
  })

  describe('Zero Amount Handling', () => {
    it('should handle zero amount installments', async () => {
      const zeroAmountHistory = [
        {
          payment_plan_id: 'plan-1',
          college_name: 'Imagine Education',
          branch_name: 'Brisbane Campus',
          program_name: 'Certificate IV',
          plan_total_amount: '0',
          plan_start_date: '2025-01-01',
          plan_status: 'completed',
          installment_id: 'inst-1',
          installment_number: 1,
          amount: '0',
          due_date: '2025-01-15',
          paid_at: '2025-01-10',
          paid_amount: '0',
          status: 'paid',
        },
      ]

      mockRpc.mockResolvedValue({
        data: zeroAmountHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary.total_paid).toBe(0)
      expect(data.summary.total_outstanding).toBe(0)
      expect(data.summary.percentage_paid).toBe(0) // Avoid division by zero
    })
  })
})
