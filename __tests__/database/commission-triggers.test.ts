/**
 * Commission Calculation Triggers Tests
 *
 * Tests database triggers that automatically calculate commissionable_value and expected_commission
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 13: Testing - Database Trigger Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServerClient } from '@pleeno/database/server'

describe('Commission Calculation Triggers', () => {
  let supabase: any

  const testAgencyId = 'test-agency-123'
  const testStudentId = 'test-student-456'

  beforeEach(async () => {
    supabase = createServerClient()

    // Set up test data
    // Note: This requires proper test database setup
  })

  afterEach(async () => {
    // Clean up test data
  })

  describe('INSERT Trigger - Auto-calculate on new payment plan', () => {
    it('calculates commissionable_value on insert', async () => {
      test.skip() // Skip until test database is configured

      const newPaymentPlan = {
        agency_id: testAgencyId,
        student_id: testStudentId,
        course_name: 'Bachelor of Business',
        total_amount: 10000,
        commission_rate_percent: 15,
        materials_cost: 500,
        admin_fees: 200,
        other_fees: 100,
        gst_inclusive: true,
        status: 'active',
      }

      const { data, error } = await supabase
        .from('payment_plans')
        .insert(newPaymentPlan)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()

      // Commissionable value should be auto-calculated
      // 10000 - 500 - 200 - 100 = 9200
      expect(data.commissionable_value).toBe(9200)
    })

    it('calculates expected_commission on insert (GST inclusive)', async () => {
      test.skip() // Skip until test database is configured

      const newPaymentPlan = {
        agency_id: testAgencyId,
        student_id: testStudentId,
        course_name: 'Bachelor of Business',
        total_amount: 10000,
        commission_rate_percent: 15,
        materials_cost: 500,
        admin_fees: 200,
        other_fees: 100,
        gst_inclusive: true,
        status: 'active',
      }

      const { data, error } = await supabase
        .from('payment_plans')
        .insert(newPaymentPlan)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()

      // Expected commission = commissionable_value * (commission_rate_percent / 100)
      // = 9200 * 0.15 = 1380
      expect(data.expected_commission).toBe(1380)
    })

    it('calculates expected_commission on insert (GST exclusive)', async () => {
      test.skip() // Skip until test database is configured

      const newPaymentPlan = {
        agency_id: testAgencyId,
        student_id: testStudentId,
        course_name: 'Bachelor of Business',
        total_amount: 10000,
        commission_rate_percent: 15,
        materials_cost: 500,
        admin_fees: 200,
        other_fees: 100,
        gst_inclusive: false, // GST exclusive
        status: 'active',
      }

      const { data, error } = await supabase
        .from('payment_plans')
        .insert(newPaymentPlan)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()

      // Expected commission (GST exclusive):
      // base = commissionable_value / 1.10 = 9200 / 1.10 = 8363.64
      // commission = base * (commission_rate_percent / 100) = 8363.64 * 0.15 = 1254.55
      expect(data.expected_commission).toBeCloseTo(1254.55, 2)
    })

    it('handles zero commission rate', async () => {
      test.skip() // Skip until test database is configured

      const newPaymentPlan = {
        agency_id: testAgencyId,
        student_id: testStudentId,
        course_name: 'Bachelor of Business',
        total_amount: 10000,
        commission_rate_percent: 0,
        materials_cost: 0,
        admin_fees: 0,
        other_fees: 0,
        gst_inclusive: true,
        status: 'active',
      }

      const { data, error } = await supabase
        .from('payment_plans')
        .insert(newPaymentPlan)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.expected_commission).toBe(0)
    })

    it('handles payment plan with no fees', async () => {
      test.skip() // Skip until test database is configured

      const newPaymentPlan = {
        agency_id: testAgencyId,
        student_id: testStudentId,
        course_name: 'Bachelor of Business',
        total_amount: 10000,
        commission_rate_percent: 15,
        materials_cost: 0,
        admin_fees: 0,
        other_fees: 0,
        gst_inclusive: true,
        status: 'active',
      }

      const { data, error } = await supabase
        .from('payment_plans')
        .insert(newPaymentPlan)
        .select()
        .single()

      expect(error).toBeNull()

      // Commissionable value = total (no fees)
      expect(data.commissionable_value).toBe(10000)

      // Expected commission = 10000 * 0.15 = 1500
      expect(data.expected_commission).toBe(1500)
    })

    it('handles null fees as zero', async () => {
      test.skip() // Skip until test database is configured

      const newPaymentPlan = {
        agency_id: testAgencyId,
        student_id: testStudentId,
        course_name: 'Bachelor of Business',
        total_amount: 10000,
        commission_rate_percent: 15,
        // Fees not provided (null in database)
        gst_inclusive: true,
        status: 'active',
      }

      const { data, error } = await supabase
        .from('payment_plans')
        .insert(newPaymentPlan)
        .select()
        .single()

      expect(error).toBeNull()

      // Should treat null fees as 0
      expect(data.commissionable_value).toBe(10000)
      expect(data.expected_commission).toBe(1500)
    })
  })

  describe('UPDATE Trigger - Recalculate on changes', () => {
    it('recalculates commissionable_value when materials_cost changes', async () => {
      test.skip() // Skip until test database is configured

      // First, insert a payment plan
      const { data: insertedPlan } = await supabase
        .from('payment_plans')
        .insert({
          agency_id: testAgencyId,
          student_id: testStudentId,
          total_amount: 10000,
          commission_rate_percent: 15,
          materials_cost: 500,
          admin_fees: 200,
          other_fees: 100,
          gst_inclusive: true,
          status: 'active',
        })
        .select()
        .single()

      // Initial: 10000 - 500 - 200 - 100 = 9200
      expect(insertedPlan.commissionable_value).toBe(9200)

      // Now update materials_cost
      const { data: updatedPlan, error } = await supabase
        .from('payment_plans')
        .update({ materials_cost: 1000 })
        .eq('id', insertedPlan.id)
        .select()
        .single()

      expect(error).toBeNull()

      // Commissionable value should be recalculated
      // 10000 - 1000 - 200 - 100 = 8700
      expect(updatedPlan.commissionable_value).toBe(8700)

      // Commission should also be recalculated
      // 8700 * 0.15 = 1305
      expect(updatedPlan.expected_commission).toBe(1305)
    })

    it('recalculates expected_commission when gst_inclusive changes', async () => {
      test.skip() // Skip until test database is configured

      // Insert with GST inclusive
      const { data: insertedPlan } = await supabase
        .from('payment_plans')
        .insert({
          agency_id: testAgencyId,
          student_id: testStudentId,
          total_amount: 10000,
          commission_rate_percent: 15,
          materials_cost: 0,
          admin_fees: 0,
          other_fees: 0,
          gst_inclusive: true,
          status: 'active',
        })
        .select()
        .single()

      // Initial commission (GST inclusive): 10000 * 0.15 = 1500
      expect(insertedPlan.expected_commission).toBe(1500)

      // Toggle GST to exclusive
      const { data: updatedPlan, error } = await supabase
        .from('payment_plans')
        .update({ gst_inclusive: false })
        .eq('id', insertedPlan.id)
        .select()
        .single()

      expect(error).toBeNull()

      // Commission should be recalculated (GST exclusive)
      // (10000 / 1.10) * 0.15 = 1363.64
      expect(updatedPlan.expected_commission).toBeCloseTo(1363.64, 2)
    })

    it('recalculates when commission_rate_percent changes', async () => {
      test.skip() // Skip until test database is configured

      // Insert with 15% commission
      const { data: insertedPlan } = await supabase
        .from('payment_plans')
        .insert({
          agency_id: testAgencyId,
          student_id: testStudentId,
          total_amount: 10000,
          commission_rate_percent: 15,
          materials_cost: 0,
          admin_fees: 0,
          other_fees: 0,
          gst_inclusive: true,
          status: 'active',
        })
        .select()
        .single()

      expect(insertedPlan.expected_commission).toBe(1500)

      // Change commission rate to 20%
      const { data: updatedPlan, error } = await supabase
        .from('payment_plans')
        .update({ commission_rate_percent: 20 })
        .eq('id', insertedPlan.id)
        .select()
        .single()

      expect(error).toBeNull()

      // Commission should be recalculated: 10000 * 0.20 = 2000
      expect(updatedPlan.expected_commission).toBe(2000)
    })

    it('recalculates when total_amount changes', async () => {
      test.skip() // Skip until test database is configured

      // Insert
      const { data: insertedPlan } = await supabase
        .from('payment_plans')
        .insert({
          agency_id: testAgencyId,
          student_id: testStudentId,
          total_amount: 10000,
          commission_rate_percent: 15,
          materials_cost: 500,
          admin_fees: 0,
          other_fees: 0,
          gst_inclusive: true,
          status: 'active',
        })
        .select()
        .single()

      // Initial: 10000 - 500 = 9500, commission = 9500 * 0.15 = 1425
      expect(insertedPlan.commissionable_value).toBe(9500)
      expect(insertedPlan.expected_commission).toBe(1425)

      // Change total amount
      const { data: updatedPlan, error } = await supabase
        .from('payment_plans')
        .update({ total_amount: 15000 })
        .eq('id', insertedPlan.id)
        .select()
        .single()

      expect(error).toBeNull()

      // Recalculated: 15000 - 500 = 14500, commission = 14500 * 0.15 = 2175
      expect(updatedPlan.commissionable_value).toBe(14500)
      expect(updatedPlan.expected_commission).toBe(2175)
    })

    it('does not recalculate when irrelevant fields change', async () => {
      test.skip() // Skip until test database is configured

      // Insert
      const { data: insertedPlan } = await supabase
        .from('payment_plans')
        .insert({
          agency_id: testAgencyId,
          student_id: testStudentId,
          total_amount: 10000,
          commission_rate_percent: 15,
          materials_cost: 0,
          admin_fees: 0,
          other_fees: 0,
          gst_inclusive: true,
          status: 'active',
        })
        .select()
        .single()

      const originalCommission = insertedPlan.expected_commission

      // Update irrelevant field (status)
      const { data: updatedPlan, error } = await supabase
        .from('payment_plans')
        .update({ status: 'completed' })
        .eq('id', insertedPlan.id)
        .select()
        .single()

      expect(error).toBeNull()

      // Commission should remain unchanged
      expect(updatedPlan.expected_commission).toBe(originalCommission)
    })
  })

  describe('Edge Cases', () => {
    it('handles fees exceeding total amount (commissionable value = 0)', async () => {
      test.skip() // Skip until test database is configured

      const newPaymentPlan = {
        agency_id: testAgencyId,
        student_id: testStudentId,
        total_amount: 1000,
        commission_rate_percent: 15,
        materials_cost: 500,
        admin_fees: 300,
        other_fees: 300, // Total fees = 1100 > 1000
        gst_inclusive: true,
        status: 'active',
      }

      const { data, error } = await supabase
        .from('payment_plans')
        .insert(newPaymentPlan)
        .select()
        .single()

      expect(error).toBeNull()

      // Commissionable value should be 0 (or negative clamped to 0)
      expect(data.commissionable_value).toBe(0)

      // Expected commission should be 0
      expect(data.expected_commission).toBe(0)
    })

    it('handles very large amounts with precision', async () => {
      test.skip() // Skip until test database is configured

      const newPaymentPlan = {
        agency_id: testAgencyId,
        student_id: testStudentId,
        total_amount: 100000.99,
        commission_rate_percent: 15.75,
        materials_cost: 1234.56,
        admin_fees: 567.89,
        other_fees: 123.45,
        gst_inclusive: true,
        status: 'active',
      }

      const { data, error } = await supabase
        .from('payment_plans')
        .insert(newPaymentPlan)
        .select()
        .single()

      expect(error).toBeNull()

      // Should handle decimal precision correctly
      const expectedCommissionableValue = 100000.99 - 1234.56 - 567.89 - 123.45
      expect(data.commissionable_value).toBeCloseTo(expectedCommissionableValue, 2)

      const expectedCommission = expectedCommissionableValue * 0.1575
      expect(data.expected_commission).toBeCloseTo(expectedCommission, 2)
    })
  })

  describe('Trigger Formula Verification', () => {
    it('matches JavaScript calculateCommissionableValue() exactly', async () => {
      test.skip() // Skip until test database is configured

      // Import the JavaScript implementation
      const { calculateCommissionableValue } = await import(
        '@pleeno/utils/src/commission-calculator'
      )

      const total = 10000
      const materials = 500
      const admin = 200
      const other = 100

      // Calculate using JavaScript
      const jsResult = calculateCommissionableValue(total, materials, admin, other)

      // Insert into database (trigger calculates)
      const { data } = await supabase
        .from('payment_plans')
        .insert({
          agency_id: testAgencyId,
          student_id: testStudentId,
          total_amount: total,
          commission_rate_percent: 15,
          materials_cost: materials,
          admin_fees: admin,
          other_fees: other,
          gst_inclusive: true,
          status: 'active',
        })
        .select()
        .single()

      // Results should match exactly
      expect(data.commissionable_value).toBe(jsResult)
    })

    it('matches JavaScript calculateExpectedCommission() exactly (GST inclusive)', async () => {
      test.skip() // Skip until test database is configured

      const { calculateExpectedCommission, calculateCommissionableValue } = await import(
        '@pleeno/utils/src/commission-calculator'
      )

      const total = 10000
      const materials = 500
      const commissionRate = 0.15

      // Calculate using JavaScript
      const commissionableValue = calculateCommissionableValue(total, materials, 0, 0)
      const jsResult = calculateExpectedCommission(commissionableValue, commissionRate, true)

      // Insert into database
      const { data } = await supabase
        .from('payment_plans')
        .insert({
          agency_id: testAgencyId,
          student_id: testStudentId,
          total_amount: total,
          commission_rate_percent: 15,
          materials_cost: materials,
          admin_fees: 0,
          other_fees: 0,
          gst_inclusive: true,
          status: 'active',
        })
        .select()
        .single()

      // Results should match exactly
      expect(data.expected_commission).toBe(jsResult)
    })

    it('matches JavaScript calculateExpectedCommission() exactly (GST exclusive)', async () => {
      test.skip() // Skip until test database is configured

      const { calculateExpectedCommission, calculateCommissionableValue } = await import(
        '@pleeno/utils/src/commission-calculator'
      )

      const total = 10000
      const materials = 500
      const commissionRate = 0.15

      // Calculate using JavaScript
      const commissionableValue = calculateCommissionableValue(total, materials, 0, 0)
      const jsResult = calculateExpectedCommission(commissionableValue, commissionRate, false)

      // Insert into database
      const { data } = await supabase
        .from('payment_plans')
        .insert({
          agency_id: testAgencyId,
          student_id: testStudentId,
          total_amount: total,
          commission_rate_percent: 15,
          materials_cost: materials,
          admin_fees: 0,
          other_fees: 0,
          gst_inclusive: false,
          status: 'active',
        })
        .select()
        .single()

      // Results should match exactly (within floating point tolerance)
      expect(data.expected_commission).toBeCloseTo(jsResult, 2)
    })
  })
})
