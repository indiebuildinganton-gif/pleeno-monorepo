/**
 * Integration Test: Status Job Creates Notifications
 *
 * Tests that the status update job creates overdue payment notifications
 * when installments become overdue.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const FUNCTION_API_KEY = process.env.SUPABASE_FUNCTION_KEY || ''

describe('Status Job Notification Generation', () => {
  let supabase: SupabaseClient
  let testAgencyId: string
  let testStudentId: string
  let testPaymentPlanId: string
  let testInstallmentId: string
  let cleanup: Array<() => Promise<void>> = []

  beforeEach(() => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    cleanup = []
  })

  afterEach(async () => {
    // Clean up test data in reverse order
    for (const fn of cleanup.reverse()) {
      await fn()
    }
  })

  // ===================================================================
  // Helper Functions
  // ===================================================================

  async function createTestAgency(name: string, timezone = 'Australia/Brisbane') {
    const { data, error } = await supabase
      .from('agencies')
      .insert({
        name,
        timezone,
        overdue_cutoff_time: '17:00:00',
      })
      .select()
      .single()

    if (error) throw error
    testAgencyId = data.id
    cleanup.push(async () => {
      await supabase.from('agencies').delete().eq('id', data.id)
    })
    return data
  }

  async function createTestStudent(agencyId: string) {
    const { data, error } = await supabase
      .from('students')
      .insert({
        agency_id: agencyId,
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@example.com',
      })
      .select()
      .single()

    if (error) throw error
    testStudentId = data.id
    cleanup.push(async () => {
      await supabase.from('students').delete().eq('id', data.id)
    })
    return data
  }

  async function createTestPaymentPlan(agencyId: string, studentId: string, status = 'active') {
    const { data, error } = await supabase
      .from('payment_plans')
      .insert({
        agency_id: agencyId,
        student_id: studentId,
        status,
        expected_commission: 1000,
      })
      .select()
      .single()

    if (error) throw error
    testPaymentPlanId = data.id
    cleanup.push(async () => {
      await supabase.from('payment_plans').delete().eq('id', data.id)
    })
    return data
  }

  async function createTestInstallment(
    paymentPlanId: string,
    status: string,
    daysOffset: number
  ) {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysOffset)

    const { data, error } = await supabase
      .from('installments')
      .insert({
        payment_plan_id: paymentPlanId,
        status,
        student_due_date: dueDate.toISOString().split('T')[0],
        amount: 500,
      })
      .select()
      .single()

    if (error) throw error
    testInstallmentId = data.id
    cleanup.push(async () => {
      await supabase.from('installments').delete().eq('id', data.id)
    })
    return data
  }

  async function invokeStatusUpdater() {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-installment-statuses`, {
      method: 'POST',
      headers: {
        'X-API-Key': FUNCTION_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Status updater failed: ${response.statusText}`)
    }

    return response.json()
  }

  // ===================================================================
  // Tests
  // ===================================================================

  it('should create notification when installment becomes overdue', async () => {
    // Setup: Create test data
    const agency = await createTestAgency('Test Notification Agency')
    const student = await createTestStudent(agency.id)
    const plan = await createTestPaymentPlan(agency.id, student.id, 'active')
    const installment = await createTestInstallment(plan.id, 'pending', -1) // Yesterday

    // Execute: Invoke status updater
    const result = await invokeStatusUpdater()

    expect(result.success).toBe(true)
    expect(result.recordsUpdated).toBeGreaterThan(0)

    // Verify: Installment marked as overdue
    const { data: updatedInstallment } = await supabase
      .from('installments')
      .select('status')
      .eq('id', installment.id)
      .single()

    expect(updatedInstallment?.status).toBe('overdue')

    // Verify: Notification created
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('agency_id', agency.id)
      .eq('type', 'overdue_payment')

    expect(notifications).toBeDefined()
    expect(notifications!.length).toBeGreaterThan(0)

    const notification = notifications![0]
    expect(notification.message).toContain('John Smith')
    expect(notification.message).toContain('500')
    expect(notification.link).toBe('/payments/plans?status=overdue')
    expect(notification.is_read).toBe(false)

    // Clean up notification
    await supabase.from('notifications').delete().eq('id', notification.id)
  }, 30000)

  it('should not create duplicate notifications', async () => {
    // Setup: Create test data
    const agency = await createTestAgency('Test Dedup Agency')
    const student = await createTestStudent(agency.id)
    const plan = await createTestPaymentPlan(agency.id, student.id, 'active')
    await createTestInstallment(plan.id, 'pending', -1) // Yesterday

    // Execute: Invoke job twice
    await invokeStatusUpdater()
    await invokeStatusUpdater()

    // Verify: Only one notification created
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('agency_id', agency.id)
      .eq('type', 'overdue_payment')

    expect(notifications).toBeDefined()
    expect(notifications!.length).toBe(1)

    // Clean up notification
    await supabase.from('notifications').delete().eq('id', notifications![0].id)
  }, 30000)

  it('should not create notification for inactive payment plan', async () => {
    // Setup: Create test data with cancelled plan
    const agency = await createTestAgency('Test Inactive Plan Agency')
    const student = await createTestStudent(agency.id)
    const plan = await createTestPaymentPlan(agency.id, student.id, 'cancelled')
    await createTestInstallment(plan.id, 'pending', -1) // Yesterday

    // Execute: Invoke status updater
    await invokeStatusUpdater()

    // Verify: No notification created for cancelled plan
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('agency_id', agency.id)
      .eq('type', 'overdue_payment')

    expect(notifications).toBeDefined()
    expect(notifications!.length).toBe(0)
  }, 30000)

  it('should not create notification for future installments', async () => {
    // Setup: Create test data with future installment
    const agency = await createTestAgency('Test Future Installment Agency')
    const student = await createTestStudent(agency.id)
    const plan = await createTestPaymentPlan(agency.id, student.id, 'active')
    const installment = await createTestInstallment(plan.id, 'pending', 7) // Next week

    // Execute: Invoke status updater
    await invokeStatusUpdater()

    // Verify: Installment still pending
    const { data: updatedInstallment } = await supabase
      .from('installments')
      .select('status')
      .eq('id', installment.id)
      .single()

    expect(updatedInstallment?.status).toBe('pending')

    // Verify: No notification created
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('agency_id', agency.id)
      .eq('type', 'overdue_payment')

    expect(notifications).toBeDefined()
    expect(notifications!.length).toBe(0)
  }, 30000)

  it('should not create notification for already overdue installment', async () => {
    // Setup: Create test data with already overdue installment
    const agency = await createTestAgency('Test Already Overdue Agency')
    const student = await createTestStudent(agency.id)
    const plan = await createTestPaymentPlan(agency.id, student.id, 'active')
    const installment = await createTestInstallment(plan.id, 'overdue', -5) // 5 days ago, already overdue

    // Execute: Invoke status updater
    await invokeStatusUpdater()

    // Verify: Installment still overdue
    const { data: updatedInstallment } = await supabase
      .from('installments')
      .select('status')
      .eq('id', installment.id)
      .single()

    expect(updatedInstallment?.status).toBe('overdue')

    // Verify: No new notification created (would already exist from first time)
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('agency_id', agency.id)
      .eq('type', 'overdue_payment')

    // Should be 0 because we didn't create one initially
    expect(notifications).toBeDefined()
    expect(notifications!.length).toBe(0)
  }, 30000)
})
