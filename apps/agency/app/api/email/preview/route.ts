import { render } from '@react-email/components'
import { NextRequest, NextResponse } from 'next/server'
import { createElement } from 'react'
import PaymentReminder from '@/emails/payment-reminder'
import CommissionAlert from '@/emails/commission-alert'
import OverdueNotification from '@/emails/overdue-notification'

/**
 * Email Preview API Endpoint
 *
 * This endpoint allows testing and previewing email templates by rendering
 * them with provided props. Useful for development and testing.
 *
 * @example
 * POST /api/email/preview
 * {
 *   "template": "payment-reminder",
 *   "props": {
 *     "studentName": "John Doe",
 *     "amount": "$1,234.56",
 *     "dueDate": "15 January 2025",
 *     "collegeName": "Test College",
 *     "paymentInstructions": "Pay via bank transfer",
 *     "agencyName": "Test Agency",
 *     "agencyEmail": "test@agency.com",
 *     "agencyPhone": "123-456-7890"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template, props } = body

    if (!template || !props) {
      return NextResponse.json(
        { error: 'Missing template or props' },
        { status: 400 }
      )
    }

    let html: string

    // Render the appropriate template based on the template name
    switch (template) {
      case 'payment-reminder':
        html = await render(createElement(PaymentReminder, props))
        break
      case 'commission-alert':
        html = await render(createElement(CommissionAlert, props))
        break
      case 'overdue-notification':
        html = await render(createElement(OverdueNotification, props))
        break
      default:
        return NextResponse.json(
          { error: `Unknown template: ${template}` },
          { status: 400 }
        )
    }

    // Return HTML response for preview in browser
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('Error rendering email template:', error)
    return NextResponse.json(
      {
        error: 'Failed to render template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to show available templates and example usage
 */
export async function GET() {
  return NextResponse.json({
    message: 'Email Preview API',
    usage: 'POST to this endpoint with { template, props }',
    availableTemplates: [
      {
        name: 'payment-reminder',
        description: 'Send payment reminders to students',
        requiredProps: [
          'studentName',
          'amount',
          'dueDate',
          'collegeName',
          'paymentInstructions',
          'agencyName',
          'agencyEmail',
          'agencyPhone'
        ],
        optionalProps: ['branchName']
      },
      {
        name: 'commission-alert',
        description: 'Alert colleges about overdue student payments',
        requiredProps: [
          'collegeName',
          'students',
          'agencyName',
          'viewLink'
        ]
      },
      {
        name: 'overdue-notification',
        description: 'Notify sales agents or admins about overdue payments',
        requiredProps: [
          'recipientType',
          'viewLink',
          'agencyName'
        ],
        conditionalProps: {
          sales_agent: ['studentName', 'amount', 'dueDate', 'studentEmail', 'studentPhone'],
          agency_admin: ['installments']
        }
      }
    ],
    example: {
      method: 'POST',
      url: '/api/email/preview',
      body: {
        template: 'payment-reminder',
        props: {
          studentName: 'John Doe',
          amount: '$1,234.56',
          dueDate: '15 January 2025',
          collegeName: 'Test College',
          branchName: 'Sydney Campus',
          paymentInstructions: 'Please transfer to account: 123-456-789',
          agencyName: 'Test Agency',
          agencyEmail: 'hello@testagency.com',
          agencyPhone: '+61 2 1234 5678'
        }
      }
    }
  })
}
