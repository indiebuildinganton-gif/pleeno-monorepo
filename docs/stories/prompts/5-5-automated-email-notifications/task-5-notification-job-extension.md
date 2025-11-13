# Task 5: Notification Job - Extend Status Update Function

**Story:** 5.5 - Automated Email Notifications (Multi-Stakeholder)

**Acceptance Criteria Addressed:** AC #5, #7-11

**Prerequisites:**
- Task 1 (Database Schema) must be completed
- Task 4 (Email Sending Service) must be completed
- Story 5.1 (Status Update Job) must be implemented

## Objective

Extend the existing status update job (from Story 5.1) to track newly overdue installments and trigger email notifications. Create a Supabase Edge Function that processes notification rules and sends emails to the appropriate stakeholders.

## Background Context

Story 5.1 created a daily job that updates installment statuses from "upcoming" to "overdue". We need to:
1. Modify that job to track which installments changed to overdue TODAY
2. Call a new Edge Function with the list of newly overdue installments
3. The Edge Function processes notification rules and sends emails accordingly

**Key Challenge:** Prevent duplicate notifications. Each installment should only trigger emails ONCE per recipient type, even if the status update job runs multiple times.

**Architecture Pattern:** [Source: docs/architecture.md#Pattern 1: Multi-Stakeholder Notification System]

## Subtasks

### 5.1: Modify Status Update SQL Function

**Location:** `supabase/migrations/004_notifications_domain/002_extend_status_update.sql`

**Changes to `update_installment_statuses()` function:**

```sql
-- Extend the existing status update function to return newly overdue installments
CREATE OR REPLACE FUNCTION update_installment_statuses()
RETURNS TABLE(installment_id UUID) AS $$
BEGIN
  -- Update overdue installments and return IDs of newly overdue ones
  RETURN QUERY
  UPDATE installments
  SET status = 'overdue',
      updated_at = NOW()
  WHERE status = 'upcoming'
    AND student_due_date < NOW()
    AND (last_notified_date IS NULL OR last_notified_date::date < CURRENT_DATE)
  RETURNING id;
END;
$$ LANGUAGE plpgsql;
```

**Key Points:**
- Only update installments where `last_notified_date IS NULL` or it's a different day
- Return the IDs of newly overdue installments
- This prevents duplicate processing on subsequent runs

### 5.2: Create Edge Function Directory Structure

```bash
supabase/functions/
└── notifications/
    └── send-notifications/
        ├── index.ts
        └── deno.json
```

### 5.3: Create Supabase Edge Function

**Location:** `supabase/functions/notifications/send-notifications/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@1.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface NotificationEvent {
  installmentIds: string[]
  eventType: 'overdue' | 'due_soon' | 'payment_received'
}

serve(async (req) => {
  try {
    const { installmentIds, eventType }: NotificationEvent = await req.json()

    if (!installmentIds || installmentIds.length === 0) {
      return new Response(JSON.stringify({ message: 'No installments to process' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch installment details with related data
    const { data: installments, error: installmentsError } = await supabase
      .from('installments')
      .select(`
        *,
        payment_plan:payment_plans(
          *,
          student:students(
            *,
            assigned_user:users!students_assigned_user_id_fkey(id, name, email)
          ),
          branch:branches(
            *,
            college:colleges(id, name, contact_email)
          ),
          agency:agencies(id, name, contact_email, contact_phone, payment_instructions)
        )
      `)
      .in('id', installmentIds)

    if (installmentsError) throw installmentsError

    // Group installments by agency for efficient processing
    const installmentsByAgency = groupBy(installments,
      (inst: any) => inst.payment_plan.agency.id
    )

    const results = []

    for (const [agencyId, agencyInstallments] of Object.entries(installmentsByAgency)) {
      // Fetch notification rules for this agency
      const { data: rules, error: rulesError } = await supabase
        .from('notification_rules')
        .select('*, email_templates(*)')
        .eq('agency_id', agencyId)
        .eq('event_type', eventType)
        .eq('is_enabled', true)

      if (rulesError) throw rulesError

      for (const rule of rules || []) {
        const recipients = await getRecipients(rule.recipient_type, agencyInstallments, supabase)

        for (const recipient of recipients) {
          for (const installment of agencyInstallments as any[]) {
            // Check if already notified
            const { data: existingLog } = await supabase
              .from('notification_log')
              .select('id')
              .eq('installment_id', installment.id)
              .eq('recipient_type', rule.recipient_type)
              .eq('recipient_email', recipient.email)
              .single()

            if (existingLog) {
              console.log(`Already notified ${recipient.email} for installment ${installment.id}`)
              continue
            }

            // Prepare email content
            const emailData = prepareEmailData(
              rule.recipient_type,
              installment,
              recipient,
              rule.email_templates
            )

            // Send email
            try {
              const response = await resend.emails.send({
                from: installment.payment_plan.agency.contact_email || 'notifications@pleeno.com',
                to: recipient.email,
                subject: emailData.subject,
                html: emailData.html
              })

              // Log successful send
              await supabase.from('notification_log').insert({
                installment_id: installment.id,
                recipient_type: rule.recipient_type,
                recipient_email: recipient.email
              })

              // Update installment last_notified_date
              await supabase
                .from('installments')
                .update({ last_notified_date: new Date().toISOString() })
                .eq('id', installment.id)

              results.push({
                installmentId: installment.id,
                recipient: recipient.email,
                status: 'sent',
                messageId: response.id
              })
            } catch (emailError) {
              console.error(`Failed to send email to ${recipient.email}:`, emailError)
              results.push({
                installmentId: installment.id,
                recipient: recipient.email,
                status: 'failed',
                error: String(emailError)
              })
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ results, processed: installmentIds.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Notification job error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

// Helper: Get recipients based on recipient type
async function getRecipients(
  recipientType: string,
  installments: any[],
  supabase: any
): Promise<Array<{ email: string; name?: string }>> {
  const firstInstallment = installments[0]
  const agencyId = firstInstallment.payment_plan.agency.id

  switch (recipientType) {
    case 'agency_user': {
      // Get all agency users with notifications enabled
      const { data } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('agency_id', agencyId)
        .eq('email_notifications_enabled', true)
      return data || []
    }

    case 'student': {
      // Get unique students from installments
      const students = new Set()
      return installments
        .map(inst => inst.payment_plan.student)
        .filter(student => {
          if (students.has(student.id)) return false
          students.add(student.id)
          return true
        })
        .map(student => ({
          email: student.email,
          name: student.name
        }))
    }

    case 'college': {
      // Get unique colleges from installments
      const colleges = new Set()
      return installments
        .map(inst => inst.payment_plan.branch.college)
        .filter(college => {
          if (!college.contact_email) return false
          if (colleges.has(college.id)) return false
          colleges.add(college.id)
          return true
        })
        .map(college => ({
          email: college.contact_email,
          name: college.name
        }))
    }

    case 'sales_agent': {
      // Get unique assigned users (sales agents)
      const agents = new Set()
      return installments
        .map(inst => inst.payment_plan.student.assigned_user)
        .filter(agent => {
          if (!agent) return false
          if (agents.has(agent.id)) return false
          agents.add(agent.id)
          return true
        })
        .map(agent => ({
          email: agent.email,
          name: agent.name
        }))
    }

    default:
      return []
  }
}

// Helper: Prepare email content based on recipient type
function prepareEmailData(
  recipientType: string,
  installment: any,
  recipient: any,
  template: any
): { subject: string; html: string } {
  const student = installment.payment_plan.student
  const agency = installment.payment_plan.agency
  const college = installment.payment_plan.branch.college
  const branch = installment.payment_plan.branch

  // Template variables
  const variables = {
    student_name: student.name,
    student_email: student.email,
    student_phone: student.phone,
    amount: formatCurrency(installment.agency_amount),
    due_date: formatDate(installment.student_due_date),
    college_name: college.name,
    branch_name: branch.name,
    agency_name: agency.name,
    agency_email: agency.contact_email,
    agency_phone: agency.contact_phone,
    payment_instructions: agency.payment_instructions || '',
    view_link: `${Deno.env.get('APP_URL')}/payments/${installment.id}`
  }

  // Render template (simple placeholder replacement)
  let subject = template?.subject || 'Payment Reminder'
  let html = template?.body_html || '<p>You have an overdue payment.</p>'

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g')
    subject = subject.replace(placeholder, value)
    html = html.replace(placeholder, value)
  })

  return { subject, html }
}

// Utility: Group array by key
function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((result, item) => {
    const key = keyFn(item)
    if (!result[key]) result[key] = []
    result[key].push(item)
    return result
  }, {} as Record<string, T[]>)
}

// Utility: Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(amount)
}

// Utility: Format date
function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date))
}
```

**File:** `supabase/functions/notifications/send-notifications/deno.json`

```json
{
  "imports": {
    "supabase": "https://esm.sh/@supabase/supabase-js@2",
    "resend": "https://esm.sh/resend@1.0.0"
  }
}
```

### 5.4: Integrate Edge Function with Status Update Job

**Location:** Modify existing status update job (from Story 5.1)

The job should call the Edge Function after updating statuses:

```typescript
// After running update_installment_statuses()
const { data: newlyOverdueIds } = await supabase.rpc('update_installment_statuses')

if (newlyOverdueIds && newlyOverdueIds.length > 0) {
  // Call notification Edge Function
  await fetch(`${supabaseUrl}/functions/v1/notifications/send-notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({
      installmentIds: newlyOverdueIds.map(row => row.installment_id),
      eventType: 'overdue'
    })
  })
}
```

### 5.5: Deploy Edge Function

```bash
# Deploy to Supabase
supabase functions deploy send-notifications

# Set environment variables
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set APP_URL=https://pleeno.com
```

## Testing Requirements

1. **Unit Tests:**
   - Test `getRecipients()` for each recipient type
   - Test `prepareEmailData()` with various templates
   - Test duplicate prevention logic
   - Test groupBy utility function

2. **Integration Tests:**
   - Mock Resend API
   - Test Edge Function with sample installment data
   - Verify correct emails sent to correct recipients
   - Verify notification_log entries created
   - Verify installments.last_notified_date updated

3. **E2E Tests:**
   - Trigger status update job
   - Verify newly overdue installments detected
   - Verify Edge Function called
   - Verify emails sent (check Resend dashboard)
   - Verify no duplicate sends on second run

## Files to Create/Modify

**Create:**
- `supabase/migrations/004_notifications_domain/002_extend_status_update.sql`
- `supabase/functions/notifications/send-notifications/index.ts`
- `supabase/functions/notifications/send-notifications/deno.json`

**Modify:**
- Status update job from Story 5.1 (integrate Edge Function call)

## Definition of Done

- [ ] SQL function returns newly overdue installment IDs
- [ ] Edge Function processes notification rules correctly
- [ ] Emails sent to correct recipients based on rules
- [ ] Duplicate prevention works (notification_log UNIQUE constraint)
- [ ] last_notified_date updated after successful sends
- [ ] Error handling and retry logic implemented
- [ ] Edge Function deployed to Supabase
- [ ] All tests passing

## References

- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Task 5]
- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Edge Function Implementation]
- [Source: docs/architecture.md#Pattern 1: Multi-Stakeholder Notification System]
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)

---

**Previous Task:** Task 4 - Email Sending Service
**Next Task:** Task 6 - Testing
