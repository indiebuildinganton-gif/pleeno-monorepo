/**
 * Integration Test: Notification Deduplication
 *
 * Tests that the system prevents duplicate notifications from being created
 * for the same installment and properly handles lifecycle transitions.
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

describe('Notification Deduplication', () => {
  let supabase: SupabaseClient
  let cleanup: Array<() => Promise<void>> = []

  beforeEach(() => {
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

  async function createTestAgency(name: string) {
    const { data, error } = await supabase
      .from('agencies')
      .insert({
        name,
        timezone: 'Australia/Brisbane',
        overdue_cutoff_time: '17:00:00',
      })
      .select()
      .single()

    if (error) throw error
    cleanup.push(async () => {
      await supabase.from('agencies').delete().eq('id', data.id)
    })
    return data
  }

  async function createTestStudent(agencyId: string, firstName: string, lastName: string) {
    const { data, error } = await supabase
      .from('students')
      .insert({
        agency_id: agencyId,
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      })
      .select()
      .single()

    if (error) throw error
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

  async function getNotificationsForAgency(agencyId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('type', 'overdue_payment')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async function cleanupNotifications(agencyId: string) {
    await supabase.from('notifications').delete().eq('agency_id', agencyId)
  }

  // ===================================================================
  // Tests
  // ===================================================================

  it('should not create duplicate notifications for same installment', async () => {
    // Setup: Create test data
    const agency = await createTestAgency('Test Dedup Agency')
    const student = await createTestStudent(agency.id, 'John', 'Doe')
    const plan = await createTestPaymentPlan(agency.id, student.id, 'active')
    await createTestInstallment(plan.id, 'pending', -1) // Yesterday

    // Execute: Run job twice
    await invokeStatusUpdater()
    await invokeStatusUpdater()

    // Verify: Only one notification created
    const notifications = await getNotificationsForAgency(agency.id)
    expect(notifications.length).toBe(1)

    await cleanupNotifications(agency.id)
  }, 30000)

  it('should not create duplicate notifications when job runs multiple times', async () => {
    // Setup: Create test data
    const agency = await createTestAgency('Test Multi-Run Agency')
    const student = await createTestStudent(agency.id, 'Jane', 'Smith')
    const plan = await createTestPaymentPlan(agency.id, student.id, 'active')
    await createTestInstallment(plan.id, 'pending', -1) // Yesterday

    // Execute: Run job 5 times
    for (let i = 0; i < 5; i++) {
      await invokeStatusUpdater()
    }

    // Verify: Still only one notification
    const notifications = await getNotificationsForAgency(agency.id)
    expect(notifications.length).toBe(1)

    await cleanupNotifications(agency.id)
  }, 30000)

  it('should create new notification if installment paid then overdue again', async () => {
    // Setup: Create test data
    const agency = await createTestAgency('Test Lifecycle Agency')
    const student = await createTestStudent(agency.id, 'Bob', 'Johnson')
    const plan = await createTestPaymentPlan(agency.id, student.id, 'active')
    const installment = await createTestInstallment(plan.id, 'pending', -1) // Yesterday

    // Execute: Mark overdue → notification created
    await invokeStatusUpdater()

    let notifications = await getNotificationsForAgency(agency.id)
    expect(notifications.length).toBe(1)
    const firstNotificationId = notifications[0].id

    // Mark installment as paid
    await supabase.from('installments').update({ status: 'paid' }).eq('id', installment.id)

    // Mark as overdue again
    await supabase.from('installments').update({ status: 'overdue' }).eq('id', installment.id)

    // Run job again
    await invokeStatusUpdater()

    // Verify: New notification created
    notifications = await getNotificationsForAgency(agency.id)
    expect(notifications.length).toBe(2)

    // Verify both notifications are distinct
    const notificationIds = notifications.map((n) => n.id)
    expect(notificationIds).toContain(firstNotificationId)
    expect(new Set(notificationIds).size).toBe(2) // All unique

    await cleanupNotifications(agency.id)
  }, 30000)

  it('should not create notification for installment that was already overdue', async () => {
    // Setup: Create test data with already overdue installment
    const agency = await createTestAgency('Test Already Overdue Agency')
    const student = await createTestStudent(agency.id, 'Alice', 'Williams')
    const plan = await createTestPaymentPlan(agency.id, student.id, 'active')
    await createTestInstallment(plan.id, 'overdue', -5) // 5 days ago, already overdue

    // Execute: Run job
    await invokeStatusUpdater()

    // Verify: No notification created (was already overdue)
    const notifications = await getNotificationsForAgency(agency.id)
    expect(notifications.length).toBe(0)

    await cleanupNotifications(agency.id)
  }, 30000)

  it('should handle multiple installments with distinct notifications', async () => {
    // Setup: Create multiple installments
    const agency = await createTestAgency('Test Multi-Installment Agency')
    const student1 = await createTestStudent(agency.id, 'Charlie', 'Brown')
    const student2 = await createTestStudent(agency.id, 'Diana', 'Prince')
    const plan1 = await createTestPaymentPlan(agency.id, student1.id, 'active')
    const plan2 = await createTestPaymentPlan(agency.id, student2.id, 'active')

    await createTestInstallment(plan1.id, 'pending', -1) // Yesterday
    await createTestInstallment(plan2.id, 'pending', -2) // 2 days ago

    // Execute: Run job
    await invokeStatusUpdater()

    // Verify: Two distinct notifications created
    const notifications = await getNotificationsForAgency(agency.id)
    expect(notifications.length).toBe(2)

    // Verify notifications are for different students
    const messages = notifications.map((n) => n.message)
    expect(messages.some((m) => m.includes('Charlie Brown'))).toBe(true)
    expect(messages.some((m) => m.includes('Diana Prince'))).toBe(true)

    // Run job again
    await invokeStatusUpdater()

    // Verify: Still only two notifications (no duplicates)
    const notificationsAfter = await getNotificationsForAgency(agency.id)
    expect(notificationsAfter.length).toBe(2)

    await cleanupNotifications(agency.id)
  }, 30000)

  it('should properly deduplicate across multiple agencies', async () => {
    // Setup: Create two agencies with similar data
    const agency1 = await createTestAgency('Test Agency 1')
    const agency2 = await createTestAgency('Test Agency 2')

    const student1 = await createTestStudent(agency1.id, 'John', 'Doe')
    const student2 = await createTestStudent(agency2.id, 'John', 'Doe') // Same name, different agency

    const plan1 = await createTestPaymentPlan(agency1.id, student1.id, 'active')
    const plan2 = await createTestPaymentPlan(agency2.id, student2.id, 'active')

    await createTestInstallment(plan1.id, 'pending', -1)
    await createTestInstallment(plan2.id, 'pending', -1)

    // Execute: Run job
    await invokeStatusUpdater()

    // Verify: Each agency gets one notification
    const notifications1 = await getNotificationsForAgency(agency1.id)
    const notifications2 = await getNotificationsForAgency(agency2.id)

    expect(notifications1.length).toBe(1)
    expect(notifications2.length).toBe(1)

    // Run job again
    await invokeStatusUpdater()

    // Verify: Still one notification per agency
    const notifications1After = await getNotificationsForAgency(agency1.id)
    const notifications2After = await getNotificationsForAgency(agency2.id)

    expect(notifications1After.length).toBe(1)
    expect(notifications2After.length).toBe(1)

    await cleanupNotifications(agency1.id)
    await cleanupNotifications(agency2.id)
  }, 30000)

  it('should not create notification if installment becomes pending again', async () => {
    // Setup: Create test data
    const agency = await createTestAgency('Test Pending Revert Agency')
    const student = await createTestStudent(agency.id, 'Eva', 'Martinez')
    const plan = await createTestPaymentPlan(agency.id, student.id, 'active')
    const installment = await createTestInstallment(plan.id, 'pending', -1)

    // Execute: Mark overdue
    await invokeStatusUpdater()

    let notifications = await getNotificationsForAgency(agency.id)
    expect(notifications.length).toBe(1)

    // Revert to pending (e.g., payment arrangement made)
    await supabase.from('installments').update({ status: 'pending' }).eq('id', installment.id)

    // Run job again
    await invokeStatusUpdater()

    // Verify: No new notification (back to pending state)
    notifications = await getNotificationsForAgency(agency.id)
    expect(notifications.length).toBe(1) // Still just the original

    await cleanupNotifications(agency.id)
  }, 30000)
})
