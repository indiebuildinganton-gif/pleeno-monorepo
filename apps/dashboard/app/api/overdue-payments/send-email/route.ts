/**
 * Send Email Reminder API - Send payment reminder email to student
 *
 * This endpoint sends a payment reminder email to a student for an overdue installment.
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
  sendPaymentReminderEmail,
  formatCurrency,
  formatDate,
} from '@pleeno/utils/server'
import { createServerClientFromRequest } from '@pleeno/database/server'
import { requireRole, getUserAgencyId } from '@pleeno/auth/server'

// Disable caching for authenticated routes
export const revalidate = 0
export const dynamic = 'force-dynamic'

/**
 * Request body validation schema
 */
const SendEmailSchema = z.object({
  installmentId: z.string().uuid(),
  studentId: z.string().uuid(),
})

/**
 * POST /api/overdue-payments/send-email
 *
 * Sends a payment reminder email to a student for an overdue installment.
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
 *     "message": "Email sent successfully",
 *     "messageId": "resend-message-id",
 *     "sentTo": "student@example.com"
 *   }
 * }
 *
 * Response (200 - Already Sent):
 * {
 *   "success": false,
 *   "message": "Email already sent 3 hours ago. Please wait 24 hours between sends.",
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
    const validationResult = SendEmailSchema.safeParse(body)

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
              email
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

    // Check if student has email
    if (!student.email) {
      throw new BadRequestError('Student does not have an email address on file')
    }

    // Fetch agency details for email content
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencies')
      .select('name, contact_email, contact_phone')
      .eq('id', userAgencyId)
      .single()

    if (agencyError || !agencyData) {
      throw new Error('Failed to fetch agency details')
    }

    // =================================================================
    // STEP 2: CHECK 24-HOUR COOLDOWN
    // =================================================================
    // Query student_notifications to check if email was sent within last 24 hours

    const cooldownHours = 24
    const cooldownDate = new Date()
    cooldownDate.setHours(cooldownDate.getHours() - cooldownHours)

    const { data: recentNotifications, error: notificationError } = await supabase
      .from('student_notifications')
      .select('sent_at')
      .eq('installment_id', installmentId)
      .eq('student_id', studentId)
      .eq('channel', 'email')
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
          message: `Email already sent ${hoursSinceLastSend} hours ago. Please wait 24 hours between sends.`,
          data: {
            lastSentAt: lastSent.toISOString(),
          },
        },
        { status: 200 }
      )
    }

    // =================================================================
    // STEP 3: SEND EMAIL
    // =================================================================

    const emailResult = await sendPaymentReminderEmail({
      to: student.email,
      studentName: student.full_name,
      amount: Number(installmentData.amount),
      dueDate: formatDate(installmentData.student_due_date),
      paymentInstructions: 'Please contact us to arrange payment.',
      agencyName: agencyData.name,
      agencyContactEmail: agencyData.contact_email || undefined,
      agencyContactPhone: agencyData.contact_phone || undefined,
    })

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email')
    }

    // =================================================================
    // STEP 4: RECORD NOTIFICATION
    // =================================================================

    const { error: insertError } = await supabase.from('student_notifications').insert({
      student_id: studentId,
      installment_id: installmentId,
      agency_id: userAgencyId,
      notification_type: 'overdue',
      channel: 'email',
      recipient_email: student.email,
      provider_name: 'resend',
      provider_message_id: emailResult.messageId,
      delivery_status: 'sent',
      sent_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('Failed to record notification:', insertError)
      // Don't fail the request if recording fails - email was still sent
    }

    // =================================================================
    // RETURN SUCCESS RESPONSE
    // =================================================================

    return createSuccessResponse({
      message: `Email sent successfully to ${student.full_name}`,
      messageId: emailResult.messageId,
      sentTo: student.email,
    })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/overdue-payments/send-email',
    })
  }
}
