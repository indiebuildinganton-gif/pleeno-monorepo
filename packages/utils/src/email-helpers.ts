import { Resend } from 'resend'
import InvitationEmail from '../../../emails/invitation'
import StudentImportNotification from '../../../emails/student-import-notification'
import PaymentReminderEmail from '../../../emails/payment-reminder'

// Initialize Resend with API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Interface for sending invitation emails
 */
interface SendInvitationEmailParams {
  to: string
  token: string
  agencyName: string
  inviterName: string
  assignedTasks: Array<{ task_name: string; description: string }>
  taskIds: string[]
}

/**
 * Sends an invitation email to a new user
 *
 * @param params - The email parameters
 * @param params.to - Recipient email address
 * @param params.token - Unique invitation token (UUID)
 * @param params.agencyName - Name of the agency inviting the user
 * @param params.inviterName - Name of the person sending the invitation
 * @param params.assignedTasks - Array of tasks assigned to the user
 * @param params.taskIds - Array of task IDs to encode in the URL
 * @returns Promise resolving to the email send result
 * @throws Error if email sending fails
 *
 * @example
 * ```typescript
 * await sendInvitationEmail({
 *   to: 'newuser@example.com',
 *   token: 'abc-123-def-456',
 *   agencyName: 'Education Agency Inc',
 *   inviterName: 'John Smith',
 *   assignedTasks: [
 *     { task_name: 'Data Entry', description: 'Enter student information' }
 *   ],
 *   taskIds: ['task-uuid-1', 'task-uuid-2']
 * })
 * ```
 */
export async function sendInvitationEmail({
  to,
  token,
  agencyName,
  inviterName,
  assignedTasks,
  taskIds,
}: SendInvitationEmailParams): Promise<{ id: string }> {
  // Validate required environment variables
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set. Email sending is disabled.')
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL environment variable is not set. Cannot generate invitation link.'
    )
  }

  // Build the acceptance URL with token and encoded task IDs
  const tasksParam = encodeURIComponent(JSON.stringify(taskIds))
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${token}?tasks=${tasksParam}`

  try {
    // Send email via Resend API
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Pleeno <noreply@pleeno.com>',
      to,
      subject: `You're invited to join ${agencyName} on Pleeno`,
      react: InvitationEmail({
        agencyName,
        inviterName,
        assignedTasks,
        acceptUrl,
      }),
    })

    if (error) {
      throw new Error(`Failed to send invitation email: ${error.message}`)
    }

    if (!data?.id) {
      throw new Error('Email sent but no ID returned from Resend')
    }

    return { id: data.id }
  } catch (error) {
    // Log error for debugging (uses existing logger utility)
    console.error('Error sending invitation email:', {
      to,
      agencyName,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    // Re-throw with more context
    throw new Error(
      `Failed to send invitation email to ${to}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Interface for incomplete student records in import notification
 */
interface IncompleteStudent {
  id: string
  full_name: string
  passport_number: string
  missing_fields: string[]
}

/**
 * Interface for sending student import notification emails
 */
interface SendStudentImportNotificationParams {
  to: string
  agencyName: string
  totalImported: number
  incompleteStudents: IncompleteStudent[]
}

/**
 * Sends a notification email after student CSV import completion
 * Includes summary of imported students and lists incomplete records with edit links
 *
 * @param params - The email parameters
 * @param params.to - Recipient email address (agency admin)
 * @param params.agencyName - Name of the agency
 * @param params.totalImported - Total number of students imported
 * @param params.incompleteStudents - Array of students missing critical data (especially phone)
 * @returns Promise resolving to the email send result
 * @throws Error if email sending fails
 *
 * @example
 * ```typescript
 * await sendStudentImportNotification({
 *   to: 'admin@agency.com',
 *   agencyName: 'Education Agency Inc',
 *   totalImported: 25,
 *   incompleteStudents: [
 *     {
 *       id: 'student-uuid-1',
 *       full_name: 'John Doe',
 *       passport_number: 'AB123456',
 *       missing_fields: ['phone', 'email']
 *     }
 *   ]
 * })
 * ```
 */
export async function sendStudentImportNotification({
  to,
  agencyName,
  totalImported,
  incompleteStudents,
}: SendStudentImportNotificationParams): Promise<{ id: string }> {
  // Validate required environment variables
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set. Email sending is disabled.')
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL environment variable is not set. Cannot generate student edit links.'
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  try {
    // Send email via Resend API
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Pleeno <noreply@pleeno.com>',
      to,
      subject: `Student Import Complete - ${totalImported} students imported${incompleteStudents.length > 0 ? ` (${incompleteStudents.length} incomplete)` : ''}`,
      react: StudentImportNotification({
        agencyName,
        totalImported,
        incompleteStudents,
        appUrl,
      }),
    })

    if (error) {
      throw new Error(`Failed to send student import notification: ${error.message}`)
    }

    if (!data?.id) {
      throw new Error('Email sent but no ID returned from Resend')
    }

    return { id: data.id }
  } catch (error) {
    // Log error for debugging
    console.error('Error sending student import notification:', {
      to,
      agencyName,
      totalImported,
      incompleteCount: incompleteStudents.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    // Re-throw with more context
    throw new Error(
      `Failed to send student import notification to ${to}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Interface for sending payment reminder emails to students
 */
interface SendPaymentReminderEmailParams {
  to: string
  studentName: string
  amount: number
  dueDate: string
  paymentInstructions: string
  agencyName: string
  agencyContactEmail?: string
  agencyContactPhone?: string
}

/**
 * Result of sending a payment reminder email
 */
interface SendPaymentReminderEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Sends a payment reminder email to a student
 * Sent 36 hours before payment due date as part of automated notification system
 *
 * @param params - The email parameters
 * @param params.to - Student email address
 * @param params.studentName - Student's full name
 * @param params.amount - Payment amount due
 * @param params.dueDate - Formatted due date string (e.g., "January 15, 2025")
 * @param params.paymentInstructions - Instructions for how to make payment
 * @param params.agencyName - Name of the agency
 * @param params.agencyContactEmail - Optional agency contact email for support
 * @param params.agencyContactPhone - Optional agency contact phone for support
 * @returns Promise resolving to send result with success status and message ID or error
 *
 * @example
 * ```typescript
 * const result = await sendPaymentReminderEmail({
 *   to: 'student@example.com',
 *   studentName: 'John Doe',
 *   amount: 1500.00,
 *   dueDate: 'January 15, 2025',
 *   paymentInstructions: 'Please transfer to account: 123-456-789',
 *   agencyName: 'Education Agency Inc',
 *   agencyContactEmail: 'support@agency.com',
 *   agencyContactPhone: '+61 7 1234 5678'
 * })
 * ```
 */
export async function sendPaymentReminderEmail(
  params: SendPaymentReminderEmailParams
): Promise<SendPaymentReminderEmailResult> {
  const {
    to,
    studentName,
    amount,
    dueDate,
    paymentInstructions,
    agencyName,
    agencyContactEmail,
    agencyContactPhone,
  } = params

  // Validate required environment variables
  if (!process.env.RESEND_API_KEY) {
    const errorMsg = 'RESEND_API_KEY environment variable is not set. Email sending is disabled.'
    console.error(errorMsg)
    return {
      success: false,
      error: errorMsg,
    }
  }

  try {
    // Send email via Resend API
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Pleeno <noreply@pleeno.com>',
      to,
      subject: `Payment Reminder: $${amount.toFixed(2)} due on ${dueDate}`,
      react: PaymentReminderEmail({
        studentName,
        amount,
        dueDate,
        paymentInstructions,
        agencyName,
        agencyContactEmail,
        agencyContactPhone,
      }),
    })

    if (error) {
      const errorMsg = `Failed to send payment reminder email: ${error.message}`
      console.error(errorMsg, {
        to,
        studentName,
        amount,
        dueDate,
      })
      return {
        success: false,
        error: errorMsg,
      }
    }

    if (!data?.id) {
      const errorMsg = 'Email sent but no ID returned from Resend'
      console.error(errorMsg)
      return {
        success: false,
        error: errorMsg,
      }
    }

    console.log('Payment reminder email sent successfully', {
      messageId: data.id,
      to,
      studentName,
      amount,
      dueDate,
    })

    return {
      success: true,
      messageId: data.id,
    }
  } catch (error) {
    // Log error for debugging
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown error sending payment reminder'
    console.error('Error sending payment reminder email:', {
      to,
      studentName,
      amount,
      dueDate,
      error: errorMsg,
    })

    return {
      success: false,
      error: errorMsg,
    }
  }
}
