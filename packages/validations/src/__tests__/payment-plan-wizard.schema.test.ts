/**
 * Payment Plan Wizard Schema Validation Tests
 *
 * Comprehensive tests for wizard step schemas and combined validation
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 11: Validation Schema
 */

import { describe, it, expect } from 'vitest'
import {
  step1Schema,
  step2Schema,
  installmentSchema,
  paymentPlanWizardSchema,
  type Step1FormData,
  type Step2FormData,
  type InstallmentData,
  type PaymentPlanWizardData,
} from '../payment-plan-wizard.schema'
import { PaymentFrequencyEnum } from '../payment-plan.schema'

describe('Payment Plan Wizard Schemas', () => {
  // ============================================================================
  // STEP 1 SCHEMA TESTS
  // ============================================================================
  describe('step1Schema', () => {
    const validStep1Data: Step1FormData = {
      student_id: '123e4567-e89b-12d3-a456-426614174000',
      course_name: 'Bachelor of Computer Science',
      total_course_value: 50000,
      commission_rate: 0.15,
      course_start_date: new Date('2025-03-01'),
      course_end_date: new Date('2028-12-31'),
    }

    it('should validate correct step 1 data', () => {
      const result = step1Schema.safeParse(validStep1Data)
      expect(result.success).toBe(true)
    })

    it('should fail when student_id is missing', () => {
      const invalidData = { ...validStep1Data }
      delete (invalidData as any).student_id

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('student_id')
      }
    })

    it('should fail when student_id is not a valid UUID', () => {
      const invalidData = { ...validStep1Data, student_id: 'not-a-uuid' }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid student ID')
      }
    })

    it('should fail when course_name is empty', () => {
      const invalidData = { ...validStep1Data, course_name: '' }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Course name is required')
      }
    })

    it('should fail when course_name exceeds 200 characters', () => {
      const invalidData = { ...validStep1Data, course_name: 'A'.repeat(201) }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Course name too long')
      }
    })

    it('should accept course_name at exactly 200 characters', () => {
      const validData = { ...validStep1Data, course_name: 'A'.repeat(200) }

      const result = step1Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should fail when total_course_value is negative', () => {
      const invalidData = { ...validStep1Data, total_course_value: -100 }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Total course value must be positive')
      }
    })

    it('should fail when total_course_value is zero', () => {
      const invalidData = { ...validStep1Data, total_course_value: 0 }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Total course value must be positive')
      }
    })

    it('should accept positive total_course_value', () => {
      const validData = { ...validStep1Data, total_course_value: 0.01 }

      const result = step1Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should fail when commission_rate is negative', () => {
      const invalidData = { ...validStep1Data, commission_rate: -0.1 }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Commission rate cannot be negative')
      }
    })

    it('should fail when commission_rate exceeds 1', () => {
      const invalidData = { ...validStep1Data, commission_rate: 1.5 }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Commission rate cannot exceed 100%')
      }
    })

    it('should accept commission_rate of 0 (0%)', () => {
      const validData = { ...validStep1Data, commission_rate: 0 }

      const result = step1Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept commission_rate of 1 (100%)', () => {
      const validData = { ...validStep1Data, commission_rate: 1 }

      const result = step1Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should coerce string dates to Date objects', () => {
      const dataWithStringDates = {
        ...validStep1Data,
        course_start_date: '2025-03-01',
        course_end_date: '2028-12-31',
      }

      const result = step1Schema.safeParse(dataWithStringDates)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.course_start_date).toBeInstanceOf(Date)
        expect(result.data.course_end_date).toBeInstanceOf(Date)
      }
    })

    it('should fail when course_end_date is before course_start_date', () => {
      const invalidData = {
        ...validStep1Data,
        course_start_date: new Date('2025-12-31'),
        course_end_date: new Date('2025-01-01'),
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Course end date must be after start date')
        expect(result.error.issues[0].path).toContain('course_end_date')
      }
    })

    it('should fail when course_end_date equals course_start_date', () => {
      const invalidData = {
        ...validStep1Data,
        course_start_date: new Date('2025-03-01'),
        course_end_date: new Date('2025-03-01'),
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Course end date must be after start date')
      }
    })

    it('should pass when course_end_date is one day after course_start_date', () => {
      const validData = {
        ...validStep1Data,
        course_start_date: new Date('2025-03-01'),
        course_end_date: new Date('2025-03-02'),
      }

      const result = step1Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  // ============================================================================
  // STEP 2 SCHEMA TESTS
  // ============================================================================
  describe('step2Schema', () => {
    const validStep2Data: Step2FormData = {
      initial_payment_amount: 5000,
      initial_payment_due_date: new Date('2025-02-15'),
      initial_payment_paid: false,
      number_of_installments: 8,
      payment_frequency: 'quarterly',
      materials_cost: 500,
      admin_fees: 250,
      other_fees: 100,
      first_college_due_date: new Date('2025-03-15'),
      student_lead_time_days: 14,
      gst_inclusive: true,
    }

    it('should validate correct step 2 data', () => {
      const result = step2Schema.safeParse(validStep2Data)
      expect(result.success).toBe(true)
    })

    it('should default initial_payment_amount to 0 if not provided', () => {
      const dataWithoutInitialPayment = { ...validStep2Data }
      delete (dataWithoutInitialPayment as any).initial_payment_amount
      dataWithoutInitialPayment.initial_payment_due_date = null

      const result = step2Schema.safeParse(dataWithoutInitialPayment)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.initial_payment_amount).toBe(0)
      }
    })

    it('should fail when initial_payment_amount is negative', () => {
      const invalidData = { ...validStep2Data, initial_payment_amount: -100 }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Initial payment cannot be negative')
      }
    })

    it('should accept initial_payment_amount of 0', () => {
      const validData = {
        ...validStep2Data,
        initial_payment_amount: 0,
        initial_payment_due_date: null,
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should fail when initial_payment_amount > 0 but due_date is null', () => {
      const invalidData = {
        ...validStep2Data,
        initial_payment_amount: 1000,
        initial_payment_due_date: null,
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Initial payment due date is required when amount is specified'
        )
        expect(result.error.issues[0].path).toContain('initial_payment_due_date')
      }
    })

    it('should pass when initial_payment_amount is 0 and due_date is null', () => {
      const validData = {
        ...validStep2Data,
        initial_payment_amount: 0,
        initial_payment_due_date: null,
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should default initial_payment_paid to false', () => {
      const dataWithoutPaidFlag = { ...validStep2Data }
      delete (dataWithoutPaidFlag as any).initial_payment_paid

      const result = step2Schema.safeParse(dataWithoutPaidFlag)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.initial_payment_paid).toBe(false)
      }
    })

    it('should fail when number_of_installments is less than 1', () => {
      const invalidData = { ...validStep2Data, number_of_installments: 0 }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Must have at least 1 installment')
      }
    })

    it('should fail when number_of_installments exceeds 24', () => {
      const invalidData = { ...validStep2Data, number_of_installments: 25 }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Cannot exceed 24 installments')
      }
    })

    it('should fail when number_of_installments is not an integer', () => {
      const invalidData = { ...validStep2Data, number_of_installments: 5.5 }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Number of installments must be an integer')
      }
    })

    it('should accept number_of_installments of 1', () => {
      const validData = { ...validStep2Data, number_of_installments: 1 }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept number_of_installments of 24', () => {
      const validData = { ...validStep2Data, number_of_installments: 24 }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept valid payment_frequency values', () => {
      const frequencies: Array<'monthly' | 'quarterly' | 'custom'> = ['monthly', 'quarterly', 'custom']

      frequencies.forEach((freq) => {
        const validData = { ...validStep2Data, payment_frequency: freq }
        const result = step2Schema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('should fail when payment_frequency is invalid', () => {
      const invalidData = { ...validStep2Data, payment_frequency: 'yearly' }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Payment frequency must be monthly, quarterly, or custom'
        )
      }
    })

    it('should fail when materials_cost is negative', () => {
      const invalidData = { ...validStep2Data, materials_cost: -50 }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Materials cost cannot be negative')
      }
    })

    it('should fail when admin_fees is negative', () => {
      const invalidData = { ...validStep2Data, admin_fees: -50 }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Admin fees cannot be negative')
      }
    })

    it('should fail when other_fees is negative', () => {
      const invalidData = { ...validStep2Data, other_fees: -50 }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Other fees cannot be negative')
      }
    })

    it('should default materials_cost to 0', () => {
      const dataWithoutMaterialsCost = { ...validStep2Data }
      delete (dataWithoutMaterialsCost as any).materials_cost

      const result = step2Schema.safeParse(dataWithoutMaterialsCost)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.materials_cost).toBe(0)
      }
    })

    it('should default admin_fees to 0', () => {
      const dataWithoutAdminFees = { ...validStep2Data }
      delete (dataWithoutAdminFees as any).admin_fees

      const result = step2Schema.safeParse(dataWithoutAdminFees)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.admin_fees).toBe(0)
      }
    })

    it('should default other_fees to 0', () => {
      const dataWithoutOtherFees = { ...validStep2Data }
      delete (dataWithoutOtherFees as any).other_fees

      const result = step2Schema.safeParse(dataWithoutOtherFees)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.other_fees).toBe(0)
      }
    })

    it('should fail when student_lead_time_days is negative', () => {
      const invalidData = { ...validStep2Data, student_lead_time_days: -5 }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Lead time cannot be negative')
      }
    })

    it('should fail when student_lead_time_days is not an integer', () => {
      const invalidData = { ...validStep2Data, student_lead_time_days: 5.5 }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Lead time must be an integer')
      }
    })

    it('should accept student_lead_time_days of 0', () => {
      const validData = { ...validStep2Data, student_lead_time_days: 0 }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should default gst_inclusive to true', () => {
      const dataWithoutGST = { ...validStep2Data }
      delete (dataWithoutGST as any).gst_inclusive

      const result = step2Schema.safeParse(dataWithoutGST)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.gst_inclusive).toBe(true)
      }
    })

    it('should coerce date strings for first_college_due_date', () => {
      const dataWithStringDate = {
        ...validStep2Data,
        first_college_due_date: '2025-03-15',
      }

      const result = step2Schema.safeParse(dataWithStringDate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.first_college_due_date).toBeInstanceOf(Date)
      }
    })
  })

  // ============================================================================
  // INSTALLMENT SCHEMA TESTS
  // ============================================================================
  describe('installmentSchema', () => {
    const validInstallment: InstallmentData = {
      installment_number: 1,
      amount: 6250,
      student_due_date: new Date('2025-03-01'),
      college_due_date: new Date('2025-03-15'),
      is_initial_payment: false,
      generates_commission: true,
    }

    it('should validate correct installment data', () => {
      const result = installmentSchema.safeParse(validInstallment)
      expect(result.success).toBe(true)
    })

    it('should accept installment_number of 0 (for initial payment)', () => {
      const validData = { ...validInstallment, installment_number: 0, is_initial_payment: true }

      const result = installmentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should fail when installment_number is negative', () => {
      const invalidData = { ...validInstallment, installment_number: -1 }

      const result = installmentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should fail when installment_number is not an integer', () => {
      const invalidData = { ...validInstallment, installment_number: 1.5 }

      const result = installmentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should fail when amount is zero', () => {
      const invalidData = { ...validInstallment, amount: 0 }

      const result = installmentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Installment amount must be positive')
      }
    })

    it('should fail when amount is negative', () => {
      const invalidData = { ...validInstallment, amount: -100 }

      const result = installmentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Installment amount must be positive')
      }
    })

    it('should accept small positive amounts', () => {
      const validData = { ...validInstallment, amount: 0.01 }

      const result = installmentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should coerce date strings for student_due_date and college_due_date', () => {
      const dataWithStringDates = {
        ...validInstallment,
        student_due_date: '2025-03-01',
        college_due_date: '2025-03-15',
      }

      const result = installmentSchema.safeParse(dataWithStringDates)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.student_due_date).toBeInstanceOf(Date)
        expect(result.data.college_due_date).toBeInstanceOf(Date)
      }
    })

    it('should accept is_initial_payment as true or false', () => {
      const withTrue = { ...validInstallment, is_initial_payment: true }
      const withFalse = { ...validInstallment, is_initial_payment: false }

      expect(installmentSchema.safeParse(withTrue).success).toBe(true)
      expect(installmentSchema.safeParse(withFalse).success).toBe(true)
    })

    it('should accept generates_commission as true or false', () => {
      const withTrue = { ...validInstallment, generates_commission: true }
      const withFalse = { ...validInstallment, generates_commission: false }

      expect(installmentSchema.safeParse(withTrue).success).toBe(true)
      expect(installmentSchema.safeParse(withFalse).success).toBe(true)
    })
  })

  // ============================================================================
  // COMBINED PAYMENT PLAN WIZARD SCHEMA TESTS
  // ============================================================================
  describe('paymentPlanWizardSchema', () => {
    const validWizardData: PaymentPlanWizardData = {
      // Step 1
      student_id: '123e4567-e89b-12d3-a456-426614174000',
      course_name: 'Bachelor of Computer Science',
      total_course_value: 50000,
      commission_rate: 0.15,
      course_start_date: new Date('2025-03-01'),
      course_end_date: new Date('2028-12-31'),
      // Step 2
      initial_payment_amount: 5000,
      initial_payment_due_date: new Date('2025-02-15'),
      initial_payment_paid: false,
      number_of_installments: 8,
      payment_frequency: 'quarterly',
      materials_cost: 500,
      admin_fees: 250,
      other_fees: 100,
      first_college_due_date: new Date('2025-03-15'),
      student_lead_time_days: 14,
      gst_inclusive: true,
      // Installments
      installments: [
        {
          installment_number: 0,
          amount: 5000,
          student_due_date: new Date('2025-02-15'),
          college_due_date: new Date('2025-03-01'),
          is_initial_payment: true,
          generates_commission: false,
        },
        {
          installment_number: 1,
          amount: 5625,
          student_due_date: new Date('2025-03-01'),
          college_due_date: new Date('2025-03-15'),
          is_initial_payment: false,
          generates_commission: true,
        },
        {
          installment_number: 2,
          amount: 5625,
          student_due_date: new Date('2025-06-01'),
          college_due_date: new Date('2025-06-15'),
          is_initial_payment: false,
          generates_commission: true,
        },
        {
          installment_number: 3,
          amount: 5625,
          student_due_date: new Date('2025-09-01'),
          college_due_date: new Date('2025-09-15'),
          is_initial_payment: false,
          generates_commission: true,
        },
        {
          installment_number: 4,
          amount: 5625,
          student_due_date: new Date('2025-12-01'),
          college_due_date: new Date('2025-12-15'),
          is_initial_payment: false,
          generates_commission: true,
        },
        {
          installment_number: 5,
          amount: 5625,
          student_due_date: new Date('2026-03-01'),
          college_due_date: new Date('2026-03-15'),
          is_initial_payment: false,
          generates_commission: true,
        },
        {
          installment_number: 6,
          amount: 5625,
          student_due_date: new Date('2026-06-01'),
          college_due_date: new Date('2026-06-15'),
          is_initial_payment: false,
          generates_commission: true,
        },
        {
          installment_number: 7,
          amount: 5625,
          student_due_date: new Date('2026-09-01'),
          college_due_date: new Date('2026-09-15'),
          is_initial_payment: false,
          generates_commission: true,
        },
        {
          installment_number: 8,
          amount: 5625,
          student_due_date: new Date('2026-12-01'),
          college_due_date: new Date('2026-12-15'),
          is_initial_payment: false,
          generates_commission: true,
        },
      ],
    }

    it('should validate complete valid wizard data', () => {
      const result = paymentPlanWizardSchema.safeParse(validWizardData)
      expect(result.success).toBe(true)
    })

    it('should fail when installments array is empty', () => {
      const invalidData = { ...validWizardData, installments: [] }

      const result = paymentPlanWizardSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Must have at least one installment')
      }
    })

    it('should fail when total fees equal total course value', () => {
      const invalidData = {
        ...validWizardData,
        materials_cost: 20000,
        admin_fees: 20000,
        other_fees: 10000,
        // Total fees = 50000 = total_course_value
      }

      const result = paymentPlanWizardSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Total fees cannot exceed or equal total course value'
        )
        expect(result.error.issues[0].path).toContain('materials_cost')
      }
    })

    it('should fail when total fees exceed total course value', () => {
      const invalidData = {
        ...validWizardData,
        materials_cost: 30000,
        admin_fees: 20000,
        other_fees: 5000,
        // Total fees = 55000 > 50000
      }

      const result = paymentPlanWizardSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Total fees cannot exceed or equal total course value'
        )
      }
    })

    it('should pass when total fees are less than total course value', () => {
      const validData = {
        ...validWizardData,
        materials_cost: 500,
        admin_fees: 250,
        other_fees: 100,
        // Total fees = 850 < 50000
      }

      const result = paymentPlanWizardSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should fail when installment sum does not match total course value (difference > 1 cent)', () => {
      const invalidData = {
        ...validWizardData,
        installments: [
          {
            installment_number: 1,
            amount: 25000,
            student_due_date: new Date('2025-03-01'),
            college_due_date: new Date('2025-03-15'),
            is_initial_payment: false,
            generates_commission: true,
          },
          {
            installment_number: 2,
            amount: 25000.05, // Total = 50000.05 (difference = 0.05 > 0.01)
            student_due_date: new Date('2025-06-01'),
            college_due_date: new Date('2025-06-15'),
            is_initial_payment: false,
            generates_commission: true,
          },
        ],
      }

      const result = paymentPlanWizardSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Installment amounts must sum to total course value'
        )
        expect(result.error.issues[0].path).toContain('installments')
      }
    })

    it('should pass when installment sum matches exactly', () => {
      const validData = {
        ...validWizardData,
        installments: [
          {
            installment_number: 1,
            amount: 25000,
            student_due_date: new Date('2025-03-01'),
            college_due_date: new Date('2025-03-15'),
            is_initial_payment: false,
            generates_commission: true,
          },
          {
            installment_number: 2,
            amount: 25000,
            student_due_date: new Date('2025-06-01'),
            college_due_date: new Date('2025-06-15'),
            is_initial_payment: false,
            generates_commission: true,
          },
        ],
      }

      const result = paymentPlanWizardSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should pass when installment sum difference is within 1 cent tolerance', () => {
      const validData = {
        ...validWizardData,
        installments: [
          {
            installment_number: 1,
            amount: 25000,
            student_due_date: new Date('2025-03-01'),
            college_due_date: new Date('2025-03-15'),
            is_initial_payment: false,
            generates_commission: true,
          },
          {
            installment_number: 2,
            amount: 25000.005, // Total = 50000.005 (difference = 0.005 < 0.01)
            student_due_date: new Date('2025-06-01'),
            college_due_date: new Date('2025-06-15'),
            is_initial_payment: false,
            generates_commission: true,
          },
        ],
      }

      const result = paymentPlanWizardSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should inherit step 1 validation (course end date after start date)', () => {
      const invalidData = {
        ...validWizardData,
        course_start_date: new Date('2028-12-31'),
        course_end_date: new Date('2025-03-01'),
      }

      const result = paymentPlanWizardSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Course end date must be after start date')
      }
    })

    it('should inherit step 2 validation (initial payment due date required)', () => {
      const invalidData = {
        ...validWizardData,
        initial_payment_amount: 5000,
        initial_payment_due_date: null,
      }

      const result = paymentPlanWizardSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Initial payment due date is required when amount is specified'
        )
      }
    })

    it('should handle wizard with no initial payment', () => {
      const validDataNoInitial: PaymentPlanWizardData = {
        ...validWizardData,
        initial_payment_amount: 0,
        initial_payment_due_date: null,
        installments: [
          {
            installment_number: 1,
            amount: 50000,
            student_due_date: new Date('2025-03-01'),
            college_due_date: new Date('2025-03-15'),
            is_initial_payment: false,
            generates_commission: true,
          },
        ],
      }

      const result = paymentPlanWizardSchema.safeParse(validDataNoInitial)
      expect(result.success).toBe(true)
    })

    it('should validate with mixed string and Date inputs', () => {
      const mixedData = {
        ...validWizardData,
        course_start_date: '2025-03-01',
        course_end_date: '2028-12-31',
        initial_payment_due_date: '2025-02-15',
        first_college_due_date: '2025-03-15',
        installments: validWizardData.installments.map((inst) => ({
          ...inst,
          student_due_date: inst.student_due_date.toISOString(),
          college_due_date: inst.college_due_date.toISOString(),
        })),
      }

      const result = paymentPlanWizardSchema.safeParse(mixedData)
      expect(result.success).toBe(true)
    })
  })

  // ============================================================================
  // PAYMENT FREQUENCY ENUM TESTS
  // ============================================================================
  describe('PaymentFrequencyEnum', () => {
    it('should accept monthly', () => {
      const result = PaymentFrequencyEnum.safeParse('monthly')
      expect(result.success).toBe(true)
    })

    it('should accept quarterly', () => {
      const result = PaymentFrequencyEnum.safeParse('quarterly')
      expect(result.success).toBe(true)
    })

    it('should accept custom', () => {
      const result = PaymentFrequencyEnum.safeParse('custom')
      expect(result.success).toBe(true)
    })

    it('should reject invalid frequency', () => {
      const result = PaymentFrequencyEnum.safeParse('yearly')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Payment frequency must be monthly, quarterly, or custom'
        )
      }
    })

    it('should reject empty string', () => {
      const result = PaymentFrequencyEnum.safeParse('')
      expect(result.success).toBe(false)
    })
  })
})
