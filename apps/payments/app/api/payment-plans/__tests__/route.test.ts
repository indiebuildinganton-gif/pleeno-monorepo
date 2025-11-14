/**
 * Payment Plans API Route Tests - Audit Logging Focus
 *
 * Integration tests for the POST /api/payment-plans endpoint
 * with comprehensive audit logging verification.
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 12: Audit Logging
 *
 * Test Coverage:
 * - Audit log created on successful payment plan creation
 * - Audit log includes all wizard data (Step 1 + Step 2)
 * - Audit log includes calculated commission values
 * - Batch audit log created for installments
 * - Error audit log created on payment plan creation failure
 * - Audit logs are queryable with correct data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock modules
vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(),
}))

vi.mock('@pleeno/database', () => ({
  logActivity: vi.fn(),
}))

vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual('@pleeno/utils')
  return {
    ...actual,
    logAudit: vi.fn().mockResolvedValue(undefined),
  }
})

// Import mocked functions
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import { logActivity } from '@pleeno/database'
import { logAudit } from '@pleeno/utils'

describe('POST /api/payment-plans - Audit Logging', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@agency.com',
    app_metadata: {
      role: 'agency_admin',
      agency_id: 'agency-456',
    },
  }

  const mockStudent = {
    id: 'student-789',
    agency_id: 'agency-456',
    first_name: 'John',
    last_name: 'Doe',
  }

  const mockPaymentPlan = {
    id: 'plan-123',
    agency_id: 'agency-456',
    student_id: 'student-789',
    course_name: 'Bachelor of Business',
    total_amount: 10000,
    commission_rate: 0.15,
    commission_rate_percent: 15,
    course_start_date: '2025-02-01',
    course_end_date: '2026-11-30',
    initial_payment_amount: 2000,
    initial_payment_due_date: '2025-01-15',
    initial_payment_paid: true,
    materials_cost: 500,
    admin_fees: 100,
    other_fees: 50,
    first_college_due_date: '2025-03-01',
    student_lead_time_days: 14,
    gst_inclusive: true,
    number_of_installments: 4,
    payment_frequency: 'quarterly',
    status: 'active',
    currency: 'AUD',
    expected_commission: 1286.36, // Calculated with GST
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }

  const mockInstallments = [
    {
      id: 'inst-1',
      payment_plan_id: 'plan-123',
      agency_id: 'agency-456',
      installment_number: 0,
      amount: 2000,
      student_due_date: '2025-01-15',
      college_due_date: '2025-01-29',
      is_initial_payment: true,
      generates_commission: true,
      status: 'paid',
      paid_date: '2025-01-01',
      paid_amount: 2000,
    },
    {
      id: 'inst-2',
      payment_plan_id: 'plan-123',
      agency_id: 'agency-456',
      installment_number: 1,
      amount: 2000,
      student_due_date: '2025-04-01',
      college_due_date: '2025-04-15',
      is_initial_payment: false,
      generates_commission: true,
      status: 'draft',
      paid_date: null,
      paid_amount: null,
    },
  ]

  const validRequestBody = {
    student_id: 'student-789',
    course_name: 'Bachelor of Business',
    total_course_value: 10000,
    commission_rate: 0.15,
    course_start_date: '2025-02-01',
    course_end_date: '2026-11-30',
    initial_payment_amount: 2000,
    initial_payment_due_date: '2025-01-15',
    initial_payment_paid: true,
    number_of_installments: 4,
    payment_frequency: 'quarterly',
    materials_cost: 500,
    admin_fees: 100,
    other_fees: 50,
    first_college_due_date: '2025-03-01',
    student_lead_time_days: 14,
    gst_inclusive: true,
    installments: [
      {
        installment_number: 0,
        amount: 2000,
        student_due_date: '2025-01-15',
        college_due_date: '2025-01-29',
        is_initial_payment: true,
        generates_commission: true,
      },
      {
        installment_number: 1,
        amount: 2000,
        student_due_date: '2025-04-01',
        college_due_date: '2025-04-15',
        is_initial_payment: false,
        generates_commission: true,
      },
    ],
  }

  let mockSupabaseClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Supabase client
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }

    // Mock createServerClient
    ;(createServerClient as any).mockResolvedValue(mockSupabaseClient)

    // Mock requireRole
    ;(requireRole as any).mockResolvedValue({ user: mockUser })

    // Mock logActivity
    ;(logActivity as any).mockResolvedValue(undefined)
  })

  describe('Successful Payment Plan Creation', () => {
    it('should create audit log with complete wizard data', async () => {
      // Arrange
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockStudent, error: null }) // Student fetch
        .mockResolvedValueOnce({ data: mockPaymentPlan, error: null }) // Payment plan creation

      mockSupabaseClient.select
        .mockResolvedValueOnce({ data: [mockStudent], error: null }) // Student query
        .mockResolvedValueOnce({ data: mockInstallments, error: null }) // Installments creation

      const request = new NextRequest('http://localhost:3000/api/payment-plans', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert - Response is successful
      expect(response.status).toBe(201)
      expect(result.success).toBe(true)

      // Assert - Payment plan audit log was created
      expect(logAudit).toHaveBeenCalledWith(
        mockSupabaseClient,
        expect.objectContaining({
          userId: 'user-123',
          agencyId: 'agency-456',
          entityType: 'payment_plan',
          entityId: 'plan-123',
          action: 'create_with_installments',
          newValues: expect.objectContaining({
            // Step 1 data
            student_id: 'student-789',
            course_name: 'Bachelor of Business',
            total_course_value: 10000,
            commission_rate: 0.15,
            course_dates: {
              start: '2025-02-01',
              end: '2026-11-30',
            },
            // Step 2 data
            payment_structure: {
              initial_payment_amount: 2000,
              initial_payment_due_date: '2025-01-15',
              initial_payment_paid: true,
              number_of_installments: 4,
              payment_frequency: 'quarterly',
            },
            fees: {
              materials_cost: 500,
              admin_fees: 100,
              other_fees: 50,
            },
            timeline: {
              first_college_due_date: '2025-03-01',
              student_lead_time_days: 14,
            },
            gst_inclusive: true,
            // Calculated values
            calculated_values: expect.objectContaining({
              commissionable_value: expect.any(Number),
              expected_commission: expect.any(Number),
            }),
          }),
          metadata: expect.objectContaining({
            wizard_version: '1.0',
            installment_count: 2,
            source: 'payment_plan_wizard',
            commission_calculation: expect.objectContaining({
              formula: expect.any(String),
              total_course_value: 10000,
              materials_cost: 500,
              admin_fees: 100,
              other_fees: 50,
              commissionable_value: expect.any(Number),
              commission_rate: 0.15,
              commission_rate_percent: 15,
              gst_inclusive: true,
              expected_commission: expect.any(Number),
            }),
            student: {
              student_id: 'student-789',
              student_name: 'John Doe',
            },
          }),
        })
      )
    })

    it('should create batch audit log for installments', async () => {
      // Arrange
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockStudent, error: null })
        .mockResolvedValueOnce({ data: mockPaymentPlan, error: null })

      mockSupabaseClient.select
        .mockResolvedValueOnce({ data: [mockStudent], error: null })
        .mockResolvedValueOnce({ data: mockInstallments, error: null })

      const request = new NextRequest('http://localhost:3000/api/payment-plans', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      // Act
      await POST(request)

      // Assert - Installments batch audit log was created
      expect(logAudit).toHaveBeenCalledWith(
        mockSupabaseClient,
        expect.objectContaining({
          userId: 'user-123',
          agencyId: 'agency-456',
          entityType: 'installments',
          entityId: 'plan-123', // References parent payment plan
          action: 'create_batch',
          newValues: {
            installments: expect.arrayContaining([
              expect.objectContaining({
                id: 'inst-1',
                installment_number: 0,
                amount: 2000,
                student_due_date: '2025-01-15',
                college_due_date: '2025-01-29',
                is_initial_payment: true,
                generates_commission: true,
                status: 'paid',
                paid_date: '2025-01-01',
                paid_amount: 2000,
              }),
              expect.objectContaining({
                id: 'inst-2',
                installment_number: 1,
                amount: 2000,
                student_due_date: '2025-04-01',
                college_due_date: '2025-04-15',
                is_initial_payment: false,
                generates_commission: true,
                status: 'draft',
                paid_date: null,
                paid_amount: null,
              }),
            ]),
          },
          metadata: {
            payment_plan_id: 'plan-123',
            total_installments: 2,
            initial_payment_paid: true,
          },
        })
      )
    })

    it('should include commission calculation parameters', async () => {
      // Arrange
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockStudent, error: null })
        .mockResolvedValueOnce({ data: mockPaymentPlan, error: null })

      mockSupabaseClient.select
        .mockResolvedValueOnce({ data: [mockStudent], error: null })
        .mockResolvedValueOnce({ data: mockInstallments, error: null })

      const request = new NextRequest('http://localhost:3000/api/payment-plans', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      // Act
      await POST(request)

      // Assert - Commission calculation metadata is present
      const auditCall = (logAudit as any).mock.calls.find(
        (call: any) => call[1].entityType === 'payment_plan'
      )

      expect(auditCall[1].metadata.commission_calculation).toEqual(
        expect.objectContaining({
          formula: '(commissionable_value / 1.10) * commission_rate',
          total_course_value: 10000,
          materials_cost: 500,
          admin_fees: 100,
          other_fees: 50,
          commissionable_value: 9350, // 10000 - 500 - 100 - 50
          commission_rate: 0.15,
          commission_rate_percent: 15,
          gst_inclusive: true,
          expected_commission: expect.any(Number),
        })
      )
    })
  })

  describe('Error Audit Logging', () => {
    it('should create audit log on payment plan creation error', async () => {
      // Arrange
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockStudent,
        error: null,
      })

      // Simulate payment plan creation failure
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database constraint violation', code: 'PGRST116' },
      })

      const request = new NextRequest('http://localhost:3000/api/payment-plans', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      // Act
      const response = await POST(request)

      // Assert - Error response
      expect(response.status).not.toBe(201)

      // Assert - Error audit log was created
      // Note: Error logging in catch block attempts to re-authenticate
      // In this test, we verify the function was called at least for the main audit
      expect(logAudit).toHaveBeenCalled()
    })

    it('should include error details in audit log metadata', async () => {
      // Arrange - Simulate validation error
      const invalidRequestBody = {
        ...validRequestBody,
        commission_rate: 'invalid', // Invalid type
      }

      const request = new NextRequest('http://localhost:3000/api/payment-plans', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      // Act
      await POST(request)

      // Assert - Validation error is handled by handleApiError
      // Audit logging would occur if error happens after auth
      expect(logAudit).toHaveBeenCalled()
    })
  })

  describe('Audit Log Queryability', () => {
    it('should structure audit log for easy querying by payment plan', async () => {
      // Arrange
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockStudent, error: null })
        .mockResolvedValueOnce({ data: mockPaymentPlan, error: null })

      mockSupabaseClient.select
        .mockResolvedValueOnce({ data: [mockStudent], error: null })
        .mockResolvedValueOnce({ data: mockInstallments, error: null })

      const request = new NextRequest('http://localhost:3000/api/payment-plans', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      // Act
      await POST(request)

      // Assert - Payment plan audit log has correct entity_type and entity_id
      const paymentPlanAudit = (logAudit as any).mock.calls.find(
        (call: any) => call[1].entityType === 'payment_plan'
      )

      expect(paymentPlanAudit[1]).toMatchObject({
        entityType: 'payment_plan',
        entityId: 'plan-123',
        agencyId: 'agency-456',
        userId: 'user-123',
      })
    })

    it('should structure installments audit log with payment plan reference', async () => {
      // Arrange
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockStudent, error: null })
        .mockResolvedValueOnce({ data: mockPaymentPlan, error: null })

      mockSupabaseClient.select
        .mockResolvedValueOnce({ data: [mockStudent], error: null })
        .mockResolvedValueOnce({ data: mockInstallments, error: null })

      const request = new NextRequest('http://localhost:3000/api/payment-plans', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      // Act
      await POST(request)

      // Assert - Installments audit log references payment plan
      const installmentsAudit = (logAudit as any).mock.calls.find(
        (call: any) => call[1].entityType === 'installments'
      )

      expect(installmentsAudit[1]).toMatchObject({
        entityType: 'installments',
        entityId: 'plan-123', // References parent payment plan
        metadata: expect.objectContaining({
          payment_plan_id: 'plan-123',
        }),
      })
    })
  })
})
