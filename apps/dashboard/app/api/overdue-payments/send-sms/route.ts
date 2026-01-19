/**
 * Send SMS Reminder API - Send payment reminder SMS to student
 *
 * This endpoint sends a payment reminder SMS to a student for an overdue installment.
 * Includes 24-hour cooldown to prevent spam.
 *
 * Epic 6: Dashboard Enhancements
 * Story: Send Email and SMS Reminders for Overdue Payments
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  handleApiError,
  createSuccessResponse,
  ForbiddenError,
  BadRequestError,
  sendPaymentReminderSms,
} from '@pleeno/utils/server'
import { createServerClientFromRequest } from '@pleeno/database/server'
import { requireRole, getUserAgencyId } from '@pleeno/auth/server'

// Disable caching for authenticated routes
export const revalidate = 0
export const dynamic = 'force-dynamic'

/**
 * Request body validation schema
 */
const SendSmsSchema = z.object({
  installmentId: z.string().uuid(),
  studentId: z.string().uuid(),
})

/**
 * POST /api/overdue-payments/send-sms
 *
 * Sends a payment reminder SMS to a student for an overdue installment.
 * Enforces 24-hour cooldown between sends to prevent spam.
 *
 * Request Body:
 * {
 *   "installmentId": "uuid",
 *   "studentId": "uuid"
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "message": "SMS sent successfully",
 *     "messageId": "twilio-message-id",
 *     "sentTo": "+61412345678"
 *   }
 * }
 *
 * Response (200 - Already Sent):
 * {
 *   "success": false,
 *   "message": "SMS already sent 3 hours ago. Please wait 24 hours between sends.",
 *   "data": {
 *     "lastSentAt": "2024-12-15T10:00:00Z"
 *   }
 * }
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - Verifies installment and student belong to user's agency
 * - 24-hour cooldown enforced via student_notifications table
 *
 * @param request - Next.js request object
 * @returns Success response with message ID or error response
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Get user's agency_id from JWT metadata
    const userAgencyId = getUserAgencyId(user)

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = SendSmsSchema.safeParse(body)

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', {
        errors: validationResult.error.errors,
      })
    }

    const { installmentId, studentId } = validationResult.data

    // Create Supabase client from request
    const supabase = createServerClientFromRequest(request)

    // =================================================================
    // STEP 1: VERIFY OWNERSHIP AND FETCH DATA
    // =================================================================
    // Fetch installment with student and agency details
    // Verify both installment and student belong to user's agency

    const { data: installmentData, error: installmentError } = await supabase
      .from('installments')
      .select(`
        id,
        amount,
        student_due_date,
        installment_number,
        agency_id,
        payment_plans!inner (
          enrollments!inner (
            students!inner (
              id,
              full_name,
              phone
            )
          )
        )
      `)
      .eq('id', installmentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (installmentError || !installmentData) {
      throw new ForbiddenError('Installment not found or access denied')
    }

    const student = installmentData.payment_plans.enrollments.students

    // Verify student ID matches
    if (student.id !== studentId) {
      throw new ForbiddenError('Student ID does not match installment')
    }

    // Check if student has phone number
    if (!student.phone) {
      throw new BadRequestError('Student does not have a phone number on file')
    }

    // Fetch agency details for SMS content
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencies')
      .select('name')
      .eq('id', userAgencyId)
      .single()

    if (agencyError || !agencyData) {
      throw new Error('Failed to fetch agency details')
    }

    // =================================================================
    // STEP 2: CHECK 24-HOUR COOLDOWN
    // =================================================================
    // Query student_notifications to check if SMS was sent within last 24 hours

    const cooldownHours = 24
    const cooldownDate = new Date()
    cooldownDate.setHours(cooldownDate.getHours() - cooldownHours)

    const { data: recentNotifications, error: notificationError } = await supabase
      .from('student_notifications')
      .select('sent_at')
      .eq('installment_id', installmentId)
      .eq('student_id', studentId)
      .eq('channel', 'sms')
      .gte('sent_at', cooldownDate.toISOString())
      .order('sent_at', { ascending: false })
      .limit(1)

    if (notificationError) {
      console.error('Failed to check recent notifications:', notificationError)
      throw new Error('Failed to check recent notifications')
    }

    if (recentNotifications && recentNotifications.length > 0) {
      const lastSent = new Date(recentNotifications[0].sent_at)
      const hoursSinceLastSend = Math.floor(
        (Date.now() - lastSent.getTime()) / (1000 * 60 * 60)
      )

      return NextResponse.json(
        {
          success: false,
          message: `SMS already sent ${hoursSinceLastSend} hours ago. Please wait 24 hours between sends.`,
          data: {
            lastSentAt: lastSent.toISOString(),
          },
        },
        { status: 200 }
      )
    }

    // =================================================================
    // STEP 3: SEND SMS
    // =================================================================

    // Get student's first name (everything before the first space)
    const studentFirstName = student.full_name.split(' ')[0]

    // Format due date as short format (e.g., "Dec 15")
    const dueDate = new Date(installmentData.student_due_date)
    const shortDate = dueDate.toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
    })

    const smsResult = await sendPaymentReminderSms({
      to: student.phone,
      studentFirstName,
      amount: Number(installmentData.amount),
      dueDate: shortDate,
      agencyName: agencyData.name,
    })

    if (!smsResult.success) {
      throw new Error(smsResult.error || 'Failed to send SMS')
    }

    // =================================================================
    // STEP 4: RECORD NOTIFICATION
    // =================================================================

    const { error: insertError } = await supabase.from('student_notifications').insert({
      student_id: studentId,
      installment_id: installmentId,
      agency_id: userAgencyId,
      notification_type: 'overdue',
      channel: 'sms',
      recipient_phone: student.phone,
      provider_name: 'twilio',
      provider_message_id: smsResult.messageId,
      delivery_status: 'sent',
      sent_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('Failed to record notification:', insertError)
      // Don't fail the request if recording fails - SMS was still sent
    }

    // =================================================================
    // RETURN SUCCESS RESPONSE
    // =================================================================

    return createSuccessResponse({
      message: `SMS sent successfully to ${student.full_name}`,
      messageId: smsResult.messageId,
      sentTo: student.phone,
    })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/overdue-payments/send-sms',
    })
  }
}
