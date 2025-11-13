# Task 4: Email Sending Service

**Story:** 5.5 - Automated Email Notifications (Multi-Stakeholder)

**Acceptance Criteria Addressed:** AC #5, #7-11

**Prerequisites:** Task 1 (Database Schema) must be completed

## Objective

Set up the email infrastructure using Resend API and create reusable email templates using React Email. This service will be used by the notification job to send emails to various stakeholders.

## Background Context

Resend is a modern email API designed for developers, with excellent support for React Email templates. We'll create:
1. Shared email utility functions for rendering templates and sending emails
2. React Email templates for each notification type
3. Template rendering logic with placeholder replacement
4. Error handling and retry logic

**Key Requirements:**
- Send emails via Resend API
- Use React Email for type-safe, component-based templates
- Support placeholder variable replacement
- Handle errors gracefully with retry logic
- Log all send attempts

## Subtasks

### 4.1: Install Resend and React Email Dependencies

```bash
# Install in the agency app
cd apps/agency
npm install @resend/node resend
npm install @react-email/components react-email --save-dev

# Install in shared packages if creating shared utilities
cd packages/utils
npm install @resend/node
```

### 4.2: Configure Resend API

**Location:** Environment variables

Add to `.env.local` and deployment environment:
```bash
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_APP_URL=https://pleeno.com
```

**Location:** `apps/agency/lib/resend-client.ts`

```typescript
import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)
```

### 4.3: Create Shared Email Utility Functions

**Location:** `packages/utils/src/email-helpers.ts`

```typescript
/**
 * Replace template placeholders with actual data
 * @param template - HTML template string with {{placeholder}} syntax
 * @param variables - Object with placeholder values
 * @returns Rendered HTML string
 */
export function renderTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let rendered = template

  // Replace simple placeholders
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g')
    rendered = rendered.replace(placeholder, String(value ?? ''))
  })

  // Handle conditional sections: {{#if condition}}...{{/if}}
  rendered = rendered.replace(
    /{{#if (\w+)}}(.*?){{\/if}}/gs,
    (match, condition, content) => {
      return variables[condition] ? content : ''
    }
  )

  // Handle loops: {{#each items}}...{{/each}}
  rendered = rendered.replace(
    /{{#each (\w+)}}(.*?){{\/each}}/gs,
    (match, arrayName, itemTemplate) => {
      const array = variables[arrayName]
      if (!Array.isArray(array)) return ''

      return array
        .map(item => {
          let itemHtml = itemTemplate
          Object.entries(item).forEach(([key, value]) => {
            itemHtml = itemHtml.replace(
              new RegExp(`{{${key}}}`, 'g'),
              String(value ?? '')
            )
          })
          return itemHtml
        })
        .join('')
    }
  )

  return rendered
}

/**
 * Send email via Resend
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - HTML email body
 * @param from - Sender email (optional, defaults to agency email)
 * @returns Resend API response
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = 'notifications@pleeno.com'
}: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const response = await resend.emails.send({
      from,
      to,
      subject,
      html
    })

    return { success: true, data: response }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(amount)
}

/**
 * Format date
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date))
}
```

### 4.4: Create React Email Templates

**Location:** `emails/` directory (in workspace root or `apps/agency/emails/`)

#### Payment Reminder Template (Student Overdue)

**File:** `emails/payment-reminder.tsx`

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components'

interface PaymentReminderProps {
  studentName: string
  amount: string
  dueDate: string
  collegeName: string
  branchName?: string
  paymentInstructions: string
  agencyName: string
  agencyEmail: string
  agencyPhone: string
}

export default function PaymentReminder({
  studentName,
  amount,
  dueDate,
  collegeName,
  branchName,
  paymentInstructions,
  agencyName,
  agencyEmail,
  agencyPhone
}: PaymentReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment Reminder - {collegeName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Reminder</Heading>

          <Text style={text}>Dear {studentName},</Text>

          <Text style={text}>
            This is a friendly reminder that your payment of{' '}
            <strong>{amount}</strong> for {collegeName}
            {branchName && ` (${branchName})`} was due on{' '}
            <strong>{dueDate}</strong>.
          </Text>

          <Section style={box}>
            <Heading as="h2" style={h2}>
              Payment Instructions
            </Heading>
            <Text style={text}>{paymentInstructions}</Text>
          </Section>

          <Text style={text}>
            If you have already made this payment, please disregard this
            message.
          </Text>

          <Text style={text}>
            For questions, please contact us:
            <br />
            Email: {agencyEmail}
            <br />
            Phone: {agencyPhone}
          </Text>

          <Text style={footer}>
            Thank you,
            <br />
            {agencyName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px'
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '16px 0'
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0'
}

const box = {
  backgroundColor: '#f6f9fc',
  borderRadius: '4px',
  padding: '20px'
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '32px'
}
```

#### College Notification Template

**File:** `emails/commission-alert.tsx`

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components'

interface CommissionAlertProps {
  collegeName: string
  students: Array<{
    name: string
    amount: string
    dueDate: string
  }>
  agencyName: string
  viewLink: string
}

export default function CommissionAlert({
  collegeName,
  students,
  agencyName,
  viewLink
}: CommissionAlertProps) {
  return (
    <Html>
      <Head />
      <Preview>Overdue Payment Summary - {collegeName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Overdue Payment Summary</Heading>

          <Text style={text}>Dear {collegeName} Team,</Text>

          <Text style={text}>
            The following students have overdue payments:
          </Text>

          <Section style={box}>
            {students.map((student, idx) => (
              <Text key={idx} style={listItem}>
                • {student.name} - {student.amount} (Due: {student.dueDate})
              </Text>
            ))}
          </Section>

          <Text style={text}>
            Please coordinate with students as needed.
          </Text>

          <Section style={buttonContainer}>
            <Link href={viewLink} style={button}>
              View Details
            </Link>
          </Section>

          <Text style={footer}>
            {agencyName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles (similar to above, plus button styles)
const main = { /* ... */ }
const container = { /* ... */ }
const h1 = { /* ... */ }
const text = { /* ... */ }
const box = { /* ... */ }
const listItem = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '8px 0'
}
const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0'
}
const button = {
  backgroundColor: '#0070f3',
  borderRadius: '4px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 24px',
  textDecoration: 'none'
}
const footer = { /* ... */ }
```

#### Sales Agent Notification Template

**File:** `emails/overdue-notification.tsx`

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components'

interface OverdueNotificationProps {
  recipientType: 'sales_agent' | 'agency_admin'
  studentName?: string
  amount?: string
  dueDate?: string
  studentEmail?: string
  studentPhone?: string
  installments?: Array<{
    studentName: string
    collegeName: string
    amount: string
    dueDate: string
  }>
  viewLink: string
  agencyName: string
}

export default function OverdueNotification({
  recipientType,
  studentName,
  amount,
  dueDate,
  studentEmail,
  studentPhone,
  installments,
  viewLink,
  agencyName
}: OverdueNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {recipientType === 'sales_agent'
          ? `Action Required - Overdue Payment for ${studentName}`
          : `New Overdue Payments - ${installments?.length || 0} students`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {recipientType === 'sales_agent' ? (
            <>
              <Heading style={h1}>Action Required</Heading>
              <Text style={text}>Hi,</Text>
              <Text style={text}>
                Your assigned student <strong>{studentName}</strong> has an
                overdue payment:
              </Text>
              <Section style={box}>
                <Text style={listItem}>Amount: {amount}</Text>
                <Text style={listItem}>Due Date: {dueDate}</Text>
                <Text style={listItem}>
                  Contact: {studentEmail}, {studentPhone}
                </Text>
              </Section>
            </>
          ) : (
            <>
              <Heading style={h1}>New Overdue Payments</Heading>
              <Text style={text}>Dear Admin,</Text>
              <Text style={text}>
                The following payments became overdue today:
              </Text>
              <Section style={box}>
                {installments?.map((inst, idx) => (
                  <Text key={idx} style={listItem}>
                    • {inst.studentName} ({inst.collegeName}) - {inst.amount}{' '}
                    (Due: {inst.dueDate})
                  </Text>
                ))}
              </Section>
            </>
          )}

          <Section style={buttonContainer}>
            <Link href={viewLink} style={button}>
              {recipientType === 'sales_agent'
                ? 'View Student Profile'
                : 'View All Overdue Payments'}
            </Link>
          </Section>

          <Text style={footer}>{agencyName}</Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles (same as above)
```

### 4.5: Create Email Rendering API Endpoint (Optional)

**Location:** `apps/agency/app/api/email/preview/route.ts`

Useful for testing templates:

```typescript
import { render } from '@react-email/render'
import PaymentReminder from '@/emails/payment-reminder'

export async function POST(request: Request) {
  const props = await request.json()

  const html = render(<PaymentReminder {...props} />)

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
```

## Testing Requirements

1. **Unit Tests:**
   - Test `renderTemplate()` with various placeholder patterns
   - Test conditional sections and loops
   - Test `formatCurrency()` and `formatDate()`
   - Test `sendEmail()` with mocked Resend client

2. **Integration Tests:**
   - Send test email to real address
   - Verify email delivery via Resend dashboard
   - Test error handling for invalid email addresses
   - Test retry logic for failed sends

3. **Template Tests:**
   - Render each React Email template
   - Verify all props render correctly
   - Test with missing optional props
   - Preview templates in browser using `@react-email/preview`

## Files to Create/Modify

**Create:**
- `apps/agency/lib/resend-client.ts`
- `packages/utils/src/email-helpers.ts`
- `emails/payment-reminder.tsx`
- `emails/commission-alert.tsx`
- `emails/overdue-notification.tsx`
- `apps/agency/app/api/email/preview/route.ts` (optional)

**Modify:**
- `.env.local` (add RESEND_API_KEY)
- `package.json` (add dependencies)

## Definition of Done

- [ ] Resend SDK installed and configured
- [ ] React Email installed with all templates created
- [ ] Email utility functions implemented and tested
- [ ] Template rendering works with placeholder replacement
- [ ] Test emails sent successfully via Resend
- [ ] All React Email templates render correctly
- [ ] Error handling implemented for failed sends
- [ ] Environment variables documented

## References

- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Task 4]
- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Email Template Variables]
- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)

---

**Previous Task:** Task 3 - Email Template Management UI
**Next Task:** Task 5 - Notification Job Extension
