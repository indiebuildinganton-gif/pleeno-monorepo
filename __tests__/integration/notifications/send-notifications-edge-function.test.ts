/**
 * Integration Test: Send Notifications Edge Function
 *
 * Tests the send-notifications edge function logic including:
 * - Email sending to correct recipients
 * - Duplicate prevention via notification log
 * - Error handling for failed sends
 * - Template rendering and data preparation
 * - Notification rules processing
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 6: Testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const FUNCTION_API_KEY = process.env.SUPABASE_FUNCTION_KEY || ''

describe('Send Notifications Edge Function', () => {
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
        contact_email: 'agency@example.com',
        contact_phone: '1300123456',
        payment_instructions: 'Bank transfer details...',
      })
      .select()
      .single()

    if (error) throw error
    cleanup.push(async () => {
      await supabase.from('agencies').delete().eq('id', data.id)
    })
    return data
  }

  async function createTestCollege(name: string) {
    const { data, error } = await supabase
      .from('colleges')
      .insert({
        name,
        contact_email: 'college@example.com',
      })
      .select()
      .single()

    if (error) throw error
    cleanup.push(async () => {
      await supabase.from('colleges').delete().eq('id', data.id)
    })
    return data
  }

  async function createTestBranch(collegeId: string, name: string) {
    const { data, error } = await supabase
      .from('branches')
      .insert({
        college_id: collegeId,
        name,
        city: 'Brisbane',
        state: 'QLD',
        country: 'Australia',
      })
      .select()
      .single()

    if (error) throw error
    cleanup.push(async () => {
      await supabase.from('branches').delete().eq('id', data.id)
    })
    return data
  }

  async function createTestStudent(agencyId: string, email: string, firstName: string, lastName: string) {
    const { data, error } = await supabase
      .from('students')
      .insert({
        agency_id: agencyId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: '0400123456',
      })
      .select()
      .single()

    if (error) throw error
    cleanup.push(async () => {
      await supabase.from('students').delete().eq('id', data.id)
    })
    return data
  }

  async function createTestUser(agencyId: string, email: string, name: string) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        agency_id: agencyId,
        email,
        name,
        role: 'agency_user',
        email_notifications_enabled: true,
      })
      .select()
      .single()

    if (error) throw error
    cleanup.push(async () => {
      await supabase.from('users').delete().eq('id', data.id)
    })
    return data
  }

  async function createTestEnrollment(agencyId: string, studentId: string, branchId: string) {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        agency_id: agencyId,
        student_id: studentId,
        branch_id: branchId,
        course_name: 'Test Course',
        start_date: '2025-01-01',
      })
      .select()
      .single()

    if (error) throw error
    cleanup.push(async () => {
      await supabase.from('enrollments').delete().eq('id', data.id)
    })
    return data
  }

  async function createTestPaymentPlan(agencyId: string, enrollmentId: string) {
    const { data, error } = await supabase
      .from('payment_plans')
      .insert({
        agency_id: agencyId,
        enrollment_id: enrollmentId,
        status: 'active',
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

  async function createTestInstallment(paymentPlanId: string, branchId: string, status: string, daysOffset: number) {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysOffset)

    const { data, error } = await supabase
      .from('installments')
      .insert({
        payment_plan_id: paymentPlanId,
        branch_id: branchId,
        status,
        student_due_date: dueDate.toISOString().split('T')[0],
        agency_amount: 1500,
        amount: 1500,
      })
      .select()
      .single()

    if (error) throw error
    cleanup.push(async () => {
      await supabase.from('installments').delete().eq('id', data.id)
    })
    return data
  }

  async function createNotificationRule(
    agencyId: string,
    recipientType: string,
    eventType: string,
    isEnabled: boolean = true,
    templateId?: string
  ) {
    const { data, error } = await supabase
      .from('notification_rules')
      .insert({
        agency_id: agencyId,
        recipient_type: recipientType,
        event_type: eventType,
        is_enabled: isEnabled,
        template_id: templateId,
      })
      .select()
      .single()

    if (error) throw error
    cleanup.push(async () => {
      await supabase.from('notification_rules').delete().eq('id', data.id)
    })
    return data
  }

  async function createEmailTemplate(agencyId: string, templateType: string) {
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        agency_id: agencyId,
        template_type: templateType,
        subject: 'Payment Reminder: {{student_name}} - {{amount}}',
        body_html: '<p>Dear {{student_name}}, you owe {{amount}} due on {{due_date}}</p>',
      })
      .select()
      .single()

    if (error) throw error
    cleanup.push(async () => {
      await supabase.from('email_templates').delete().eq('id', data.id)
    })
    return data
  }

  async function invokeNotificationFunction(installmentIds: string[], eventType: string) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-notifications`, {
      method: 'POST',
      headers: {
        'X-API-Key': FUNCTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        installmentIds,
        eventType,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Notification function failed: ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  async function getNotificationLog(installmentId: string) {
    const { data, error } = await supabase
      .from('notification_log')
      .select('*')
      .eq('installment_id', installmentId)

    if (error) throw error
    return data
  }

  async function cleanupNotificationLog(agencyId: string) {
    // Clean up through installments relation
    const { data: installments } = await supabase
      .from('installments')
      .select('id, payment_plan:payment_plans!inner(agency_id)')
      .eq('payment_plan.agency_id', agencyId)

    if (installments) {
      const installmentIds = installments.map(i => i.id)
      await supabase.from('notification_log').delete().in('installment_id', installmentIds)
    }
  }

  // ===================================================================
  // Tests
  // ===================================================================

  it('should send email to student when enabled', async () => {
    // Setup: Create full test data chain
    const agency = await createTestAgency('Test Agency')
    const college = await createTestCollege('Test College')
    const branch = await createTestBranch(college.id, 'Test Branch')
    const student = await createTestStudent(agency.id, 'student@example.com', 'John', 'Doe')
    const enrollment = await createTestEnrollment(agency.id, student.id, branch.id)
    const plan = await createTestPaymentPlan(agency.id, enrollment.id)
    const installment = await createTestInstallment(plan.id, branch.id, 'overdue', -1)

    // Create notification rule for students
    await createNotificationRule(agency.id, 'student', 'overdue', true)

    // Execute: Invoke notification function
    const result = await invokeNotificationFunction([installment.id], 'overdue')

    // Verify: Check results
    expect(result.success).toBe(true)
    expect(result.processed).toBe(1)
    expect(result.summary.sent).toBeGreaterThan(0)

    // Verify: Notification log entry created
    const logs = await getNotificationLog(installment.id)
    expect(logs.length).toBeGreaterThan(0)
    expect(logs[0].recipient_email).toBe('student@example.com')
    expect(logs[0].recipient_type).toBe('student')

    await cleanupNotificationLog(agency.id)
  }, 30000)

  it('should send email to agency users when enabled', async () => {
    // Setup: Create test data
    const agency = await createTestAgency('Test Agency 2')
    const college = await createTestCollege('Test College 2')
    const branch = await createTestBranch(college.id, 'Test Branch 2')
    const student = await createTestStudent(agency.id, 'student2@example.com', 'Jane', 'Smith')
    const agencyUser = await createTestUser(agency.id, 'user@agency.com', 'Agency User')
    const enrollment = await createTestEnrollment(agency.id, student.id, branch.id)
    const plan = await createTestPaymentPlan(agency.id, enrollment.id)
    const installment = await createTestInstallment(plan.id, branch.id, 'overdue', -1)

    // Create notification rule for agency users
    await createNotificationRule(agency.id, 'agency_user', 'overdue', true)

    // Execute: Invoke notification function
    const result = await invokeNotificationFunction([installment.id], 'overdue')

    // Verify: Check results
    expect(result.success).toBe(true)
    expect(result.summary.sent).toBeGreaterThan(0)

    // Verify: Notification log entry created for agency user
    const logs = await getNotificationLog(installment.id)
    const agencyUserLog = logs.find(log => log.recipient_email === 'user@agency.com')
    expect(agencyUserLog).toBeDefined()
    expect(agencyUserLog?.recipient_type).toBe('agency_user')

    await cleanupNotificationLog(agency.id)
  }, 30000)

  it('should prevent duplicate sends via notification log', async () => {
    // Setup: Create test data
    const agency = await createTestAgency('Test Dedup Agency')
    const college = await createTestCollege('Test Dedup College')
    const branch = await createTestBranch(college.id, 'Test Dedup Branch')
    const student = await createTestStudent(agency.id, 'student3@example.com', 'Bob', 'Johnson')
    const enrollment = await createTestEnrollment(agency.id, student.id, branch.id)
    const plan = await createTestPaymentPlan(agency.id, enrollment.id)
    const installment = await createTestInstallment(plan.id, branch.id, 'overdue', -1)

    // Create notification rule
    await createNotificationRule(agency.id, 'student', 'overdue', true)

    // Execute: Invoke function twice
    const result1 = await invokeNotificationFunction([installment.id], 'overdue')
    const result2 = await invokeNotificationFunction([installment.id], 'overdue')

    // Verify: First send successful
    expect(result1.success).toBe(true)
    expect(result1.summary.sent).toBeGreaterThan(0)

    // Verify: Second send skipped
    expect(result2.success).toBe(true)
    expect(result2.summary.skipped).toBeGreaterThan(0)

    // Verify: Only one log entry
    const logs = await getNotificationLog(installment.id)
    const studentLogs = logs.filter(log => log.recipient_email === 'student3@example.com')
    expect(studentLogs.length).toBe(1)

    await cleanupNotificationLog(agency.id)
  }, 30000)

  it('should skip when no enabled notification rules exist', async () => {
    // Setup: Create test data without notification rules
    const agency = await createTestAgency('Test No Rules Agency')
    const college = await createTestCollege('Test No Rules College')
    const branch = await createTestBranch(college.id, 'Test No Rules Branch')
    const student = await createTestStudent(agency.id, 'student4@example.com', 'Alice', 'Williams')
    const enrollment = await createTestEnrollment(agency.id, student.id, branch.id)
    const plan = await createTestPaymentPlan(agency.id, enrollment.id)
    const installment = await createTestInstallment(plan.id, branch.id, 'overdue', -1)

    // Execute: Invoke function without rules
    const result = await invokeNotificationFunction([installment.id], 'overdue')

    // Verify: All skipped
    expect(result.success).toBe(true)
    expect(result.summary.skipped).toBe(1)
    expect(result.summary.sent).toBe(0)

    // Verify: No notification logs
    const logs = await getNotificationLog(installment.id)
    expect(logs.length).toBe(0)
  }, 30000)

  it('should update last_notified_date after successful send', async () => {
    // Setup: Create test data
    const agency = await createTestAgency('Test Last Notified Agency')
    const college = await createTestCollege('Test Last Notified College')
    const branch = await createTestBranch(college.id, 'Test Last Notified Branch')
    const student = await createTestStudent(agency.id, 'student5@example.com', 'Charlie', 'Brown')
    const enrollment = await createTestEnrollment(agency.id, student.id, branch.id)
    const plan = await createTestPaymentPlan(agency.id, enrollment.id)
    const installment = await createTestInstallment(plan.id, branch.id, 'overdue', -1)

    // Create notification rule
    await createNotificationRule(agency.id, 'student', 'overdue', true)

    // Verify: No last_notified_date initially
    let { data: beforeInstallment } = await supabase
      .from('installments')
      .select('last_notified_date')
      .eq('id', installment.id)
      .single()

    expect(beforeInstallment?.last_notified_date).toBeNull()

    // Execute: Invoke function
    await invokeNotificationFunction([installment.id], 'overdue')

    // Verify: last_notified_date is set
    const { data: afterInstallment } = await supabase
      .from('installments')
      .select('last_notified_date')
      .eq('id', installment.id)
      .single()

    expect(afterInstallment?.last_notified_date).not.toBeNull()
    expect(new Date(afterInstallment!.last_notified_date!).getTime()).toBeGreaterThan(
      new Date().getTime() - 60000
    ) // Within last minute

    await cleanupNotificationLog(agency.id)
  }, 30000)

  it('should handle empty installmentIds array gracefully', async () => {
    // Execute: Invoke function with empty array
    const result = await invokeNotificationFunction([], 'overdue')

    // Verify: Success response with zero processed
    expect(result.processed).toBe(0)
    expect(result.message).toContain('No installments to process')
  }, 30000)

  it('should handle multiple installments in single call', async () => {
    // Setup: Create multiple installments
    const agency = await createTestAgency('Test Multi Agency')
    const college = await createTestCollege('Test Multi College')
    const branch = await createTestBranch(college.id, 'Test Multi Branch')
    const student1 = await createTestStudent(agency.id, 'student6@example.com', 'Diana', 'Prince')
    const student2 = await createTestStudent(agency.id, 'student7@example.com', 'Bruce', 'Wayne')
    const enrollment1 = await createTestEnrollment(agency.id, student1.id, branch.id)
    const enrollment2 = await createTestEnrollment(agency.id, student2.id, branch.id)
    const plan1 = await createTestPaymentPlan(agency.id, enrollment1.id)
    const plan2 = await createTestPaymentPlan(agency.id, enrollment2.id)
    const installment1 = await createTestInstallment(plan1.id, branch.id, 'overdue', -1)
    const installment2 = await createTestInstallment(plan2.id, branch.id, 'overdue', -2)

    // Create notification rule
    await createNotificationRule(agency.id, 'student', 'overdue', true)

    // Execute: Invoke function with both installments
    const result = await invokeNotificationFunction([installment1.id, installment2.id], 'overdue')

    // Verify: Both processed
    expect(result.success).toBe(true)
    expect(result.processed).toBe(2)
    expect(result.summary.sent).toBe(2)

    // Verify: Logs for both
    const logs1 = await getNotificationLog(installment1.id)
    const logs2 = await getNotificationLog(installment2.id)
    expect(logs1.length).toBeGreaterThan(0)
    expect(logs2.length).toBeGreaterThan(0)

    await cleanupNotificationLog(agency.id)
  }, 30000)

  it('should use custom template when configured', async () => {
    // Setup: Create test data with custom template
    const agency = await createTestAgency('Test Template Agency')
    const college = await createTestCollege('Test Template College')
    const branch = await createTestBranch(college.id, 'Test Template Branch')
    const student = await createTestStudent(agency.id, 'student8@example.com', 'Clark', 'Kent')
    const enrollment = await createTestEnrollment(agency.id, student.id, branch.id)
    const plan = await createTestPaymentPlan(agency.id, enrollment.id)
    const installment = await createTestInstallment(plan.id, branch.id, 'overdue', -1)

    // Create custom template
    const template = await createEmailTemplate(agency.id, 'student_overdue')

    // Create notification rule linked to template
    await createNotificationRule(agency.id, 'student', 'overdue', true, template.id)

    // Execute: Invoke function
    const result = await invokeNotificationFunction([installment.id], 'overdue')

    // Verify: Email sent
    expect(result.success).toBe(true)
    expect(result.summary.sent).toBeGreaterThan(0)

    // Verify: Log contains template_id
    const logs = await getNotificationLog(installment.id)
    expect(logs[0].template_id).toBe(template.id)

    await cleanupNotificationLog(agency.id)
  }, 30000)
})
