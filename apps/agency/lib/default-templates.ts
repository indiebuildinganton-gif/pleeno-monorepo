/**
 * Default Email Templates
 *
 * Provides default email templates for each notification type.
 * These templates serve as starting points for agencies to customize their
 * notification emails.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 3: Email Template Management UI
 */

export interface EmailTemplate {
  subject: string
  body_html: string
  template_type: string
  variables: Record<string, string>
}

/**
 * Available template variables with their descriptions
 */
export const TEMPLATE_VARIABLES = {
  student_name: '{{student_name}}',
  student_email: '{{student_email}}',
  student_phone: '{{student_phone}}',
  amount: '{{amount}}',
  due_date: '{{due_date}}',
  college_name: '{{college_name}}',
  branch_name: '{{branch_name}}',
  agency_name: '{{agency_name}}',
  agency_email: '{{agency_email}}',
  agency_phone: '{{agency_phone}}',
  payment_instructions: '{{payment_instructions}}',
  view_link: '{{view_link}}',
  count: '{{count}}',
} as const

/**
 * Default template for student overdue payment notifications
 */
export const STUDENT_OVERDUE_TEMPLATE: EmailTemplate = {
  template_type: 'student_overdue',
  subject: 'Payment Reminder - {{college_name}}',
  body_html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <p>Dear {{student_name}},</p>

  <p>This is a friendly reminder that your payment of <strong>{{amount}}</strong> was due on <strong>{{due_date}}</strong>.</p>

  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold;">Payment Instructions:</p>
    <p style="margin: 10px 0 0 0;">{{payment_instructions}}</p>
  </div>

  <p>If you have already made this payment, please disregard this message.</p>

  <p>For questions, contact us at <a href="mailto:{{agency_email}}">{{agency_email}}</a> or {{agency_phone}}.</p>

  <p>Thank you,<br>{{agency_name}}</p>
</div>
  `.trim(),
  variables: {
    student_name: 'Student full name',
    amount: 'Installment amount (formatted as currency)',
    due_date: 'Payment due date (formatted)',
    college_name: 'College name',
    payment_instructions: 'Custom payment instructions',
    agency_email: 'Agency contact email',
    agency_phone: 'Agency contact phone',
    agency_name: 'Agency name',
  },
}

/**
 * Default template for college overdue payment summary
 */
export const COLLEGE_OVERDUE_TEMPLATE: EmailTemplate = {
  template_type: 'college_overdue',
  subject: 'Overdue Payment Summary - {{college_name}}',
  body_html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <p>Dear {{college_name}} Team,</p>

  <p>The following students have overdue payments that require attention:</p>

  <div style="background-color: #fff4e6; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
    <p style="margin: 0; color: #e65100;">This is an automated summary of overdue payments for students at your institution.</p>
  </div>

  <p>For detailed information and to view all overdue payments, please visit:</p>
  <p><a href="{{view_link}}" style="color: #1976d2;">View Overdue Payments Dashboard</a></p>

  <p>Please coordinate with students as needed to resolve these outstanding payments.</p>

  <p>Best regards,<br>{{agency_name}}</p>
</div>
  `.trim(),
  variables: {
    college_name: 'College name',
    agency_name: 'Agency name',
    view_link: 'Link to overdue payments dashboard',
  },
}

/**
 * Default template for sales agent overdue payment alert
 */
export const SALES_AGENT_OVERDUE_TEMPLATE: EmailTemplate = {
  template_type: 'sales_agent_overdue',
  subject: 'Action Required - Overdue Payment for {{student_name}}',
  body_html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <p>Hi,</p>

  <p>Your assigned student <strong>{{student_name}}</strong> has an overdue payment that requires your attention:</p>

  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Amount:</td>
        <td style="padding: 5px 0;">{{amount}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Due Date:</td>
        <td style="padding: 5px 0;">{{due_date}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">College:</td>
        <td style="padding: 5px 0;">{{college_name}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Contact:</td>
        <td style="padding: 5px 0;">
          <a href="mailto:{{student_email}}">{{student_email}}</a>, {{student_phone}}
        </td>
      </tr>
    </table>
  </div>

  <p style="text-align: center; margin: 30px 0;">
    <a href="{{view_link}}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Student Profile</a>
  </p>

  <p>Please reach out to the student to follow up on this overdue payment.</p>

  <p>{{agency_name}}</p>
</div>
  `.trim(),
  variables: {
    student_name: 'Student full name',
    amount: 'Installment amount (formatted as currency)',
    due_date: 'Payment due date (formatted)',
    college_name: 'College name',
    student_email: 'Student email address',
    student_phone: 'Student phone number',
    view_link: 'Link to student profile',
    agency_name: 'Agency name',
  },
}

/**
 * Default template for agency admin overdue payment summary
 */
export const AGENCY_ADMIN_OVERDUE_TEMPLATE: EmailTemplate = {
  template_type: 'agency_admin_overdue',
  subject: 'New Overdue Payments - {{count}} students',
  body_html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Daily Overdue Payment Summary</h2>

  <p>Dear Admin,</p>

  <p>The following payments became overdue and require attention:</p>

  <div style="background-color: #ffebee; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold; color: #c62828;">{{count}} overdue payment(s)</p>
  </div>

  <p style="text-align: center; margin: 30px 0;">
    <a href="{{view_link}}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View All Overdue Payments</a>
  </p>

  <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
    This is an automated notification from Pleeno Payment Tracking System.<br>
    You are receiving this because you are an administrator of {{agency_name}}.
  </p>
</div>
  `.trim(),
  variables: {
    count: 'Number of overdue payments',
    view_link: 'Link to overdue payments dashboard',
    agency_name: 'Agency name',
  },
}

/**
 * Default template for due soon student reminder
 */
export const STUDENT_DUE_SOON_TEMPLATE: EmailTemplate = {
  template_type: 'student_due_soon',
  subject: 'Payment Due Soon - {{college_name}}',
  body_html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <p>Dear {{student_name}},</p>

  <p>This is a friendly reminder that your payment of <strong>{{amount}}</strong> is due on <strong>{{due_date}}</strong>.</p>

  <div style="background-color: #fff4e6; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
    <p style="margin: 0;"><strong>⏰ Upcoming Payment</strong></p>
    <p style="margin: 10px 0 0 0;">Please ensure payment is made by the due date to avoid any late fees or complications with your enrollment.</p>
  </div>

  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold;">Payment Instructions:</p>
    <p style="margin: 10px 0 0 0;">{{payment_instructions}}</p>
  </div>

  <p>If you have any questions or need assistance, please contact us at <a href="mailto:{{agency_email}}">{{agency_email}}</a> or {{agency_phone}}.</p>

  <p>Thank you,<br>{{agency_name}}</p>
</div>
  `.trim(),
  variables: {
    student_name: 'Student full name',
    amount: 'Installment amount (formatted as currency)',
    due_date: 'Payment due date (formatted)',
    college_name: 'College name',
    payment_instructions: 'Custom payment instructions',
    agency_email: 'Agency contact email',
    agency_phone: 'Agency contact phone',
    agency_name: 'Agency name',
  },
}

/**
 * Default template for payment received confirmation
 */
export const PAYMENT_RECEIVED_TEMPLATE: EmailTemplate = {
  template_type: 'payment_received',
  subject: 'Payment Received - {{college_name}}',
  body_html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <p>Dear {{student_name}},</p>

  <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
    <p style="margin: 0; color: #2e7d32;"><strong>✓ Payment Confirmed</strong></p>
    <p style="margin: 10px 0 0 0;">We have received your payment of <strong>{{amount}}</strong> for {{college_name}}.</p>
  </div>

  <p>Thank you for your payment. This confirms that your installment has been successfully processed.</p>

  <p>If you have any questions about your payment or account, please contact us at <a href="mailto:{{agency_email}}">{{agency_email}}</a> or {{agency_phone}}.</p>

  <p>Best regards,<br>{{agency_name}}</p>
</div>
  `.trim(),
  variables: {
    student_name: 'Student full name',
    amount: 'Installment amount (formatted as currency)',
    college_name: 'College name',
    agency_email: 'Agency contact email',
    agency_phone: 'Agency contact phone',
    agency_name: 'Agency name',
  },
}

/**
 * Map of all default templates by type
 */
export const DEFAULT_TEMPLATES: Record<string, EmailTemplate> = {
  student_overdue: STUDENT_OVERDUE_TEMPLATE,
  college_overdue: COLLEGE_OVERDUE_TEMPLATE,
  sales_agent_overdue: SALES_AGENT_OVERDUE_TEMPLATE,
  agency_admin_overdue: AGENCY_ADMIN_OVERDUE_TEMPLATE,
  student_due_soon: STUDENT_DUE_SOON_TEMPLATE,
  payment_received: PAYMENT_RECEIVED_TEMPLATE,
}

/**
 * Template type options for the UI
 */
export const TEMPLATE_TYPE_OPTIONS = [
  { value: 'student_overdue', label: 'Student Overdue Payment' },
  { value: 'student_due_soon', label: 'Student Due Soon Reminder' },
  { value: 'payment_received', label: 'Payment Received Confirmation' },
  { value: 'college_overdue', label: 'College Overdue Summary' },
  { value: 'sales_agent_overdue', label: 'Sales Agent Overdue Alert' },
  { value: 'agency_admin_overdue', label: 'Agency Admin Daily Summary' },
]
