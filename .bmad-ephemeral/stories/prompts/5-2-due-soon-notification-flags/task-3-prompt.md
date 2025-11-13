# Story 5.2: Due Soon Notification Flags - Task 3

## Story Context

**As an** Agency User
**I want** to see visual indicators for payments due within the next 4 days
**So that** I can proactively follow up before payments become overdue, including weekend and early-week payments

## Task 3: Create student notification system

### Previous Tasks Completion

✅ Task 1 implemented the backend foundation:
- Database schema with configurable threshold
- Query logic for "due soon" calculation
- Agency settings API

✅ Task 2 implemented the UI layer:
- Badge components for visual indicators
- Dashboard widget showing due soon count
- Payment plan views with due soon status
- Filter functionality

### Task Description

Implement the automated student notification system that sends reminder emails/SMS to students 36 hours before their payment is due. This includes database schema for tracking notifications, scheduled job execution, email template creation, and integration with the Resend API.

### Subtasks Checklist

- [ ] Create `student_notifications` table: id, student_id, installment_id, notification_type, sent_at, delivery_status
- [ ] Implement scheduled job to run daily at 5:00 AM Brisbane time (7:00 PM UTC previous day)
- [ ] Query installments due in 36 hours (due_date = CURRENT_DATE + 1 day, accounting for 5 PM cutoff)
- [ ] Integrate with Resend API for email sending
- [ ] Create email template with student name, amount due, due date, payment instructions
- [ ] Log all notifications sent to student_notifications table
- [ ] Add `students.contact_preference` field (email, sms, both) for delivery method
- [ ] Add `students.phone_number` field for SMS delivery (if contact_preference includes SMS)
- [ ] Handle notification errors gracefully (log and retry logic)

### Acceptance Criteria

This task supports:
- **AC6**: Student Notification Requirements: Given an installment is due soon, When 36 hours before the payment cutoff time (5:00 PM Brisbane), Then the student receives an automated reminder notification
- **AC7**: And the notification is sent at 5:00 AM Brisbane time the day before the due date
- **AC8**: And the notification includes: student name, amount due, due date, payment instructions

### Context & Constraints

**Key Constraints:**
- Notification job MUST run at 7:00 PM UTC (5:00 AM Brisbane next day) using pg_cron scheduler
- Unique constraint on student_notifications (installment_id, notification_type) prevents duplicate sends
- Timezone handling: store UTC in database, convert to agency timezone for display/scheduling
- Email templates use React Email syntax, rendered server-side before sending via Resend
- Scheduled jobs implement error handling and logging for failed notification sends

**Interfaces to Implement:**

1. **student_notifications Table Schema** (supabase/migrations/004_notifications_domain/001_notifications_schema.sql):
```sql
CREATE TABLE student_notifications (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  installment_id UUID REFERENCES installments(id),
  agency_id UUID REFERENCES agencies(id),
  notification_type TEXT CHECK (notification_type IN ('due_soon', 'overdue')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivery_status TEXT CHECK (delivery_status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  UNIQUE(installment_id, notification_type)
)
```

2. **sendNotificationEmail** (packages/utils/src/notification-helpers.ts):
```typescript
async function sendNotificationEmail(params: {
  to: string,
  studentName: string,
  amount: number,
  dueDate: Date,
  paymentInstructions: string
}): Promise<{ success: boolean, messageId?: string, error?: string }>
```

### Dependencies

**From Previous Tasks:**
- isDueSoon() utility function
- Agency settings with timezone configuration
- Database schema for installments and students

**External Dependencies:**
- resend (6.4.2) - Email sending API
- @react-email/components (latest) - Email template components
- date-fns-tz (latest) - Timezone handling
- Supabase Edge Functions for scheduled job execution

### Architecture Reference

From [docs/architecture.md](docs/architecture.md):
- **Pattern 1: Multi-Stakeholder Notification System** - Notification rules per agency configuration with recipient types. Event types include installment_due_soon. Notification log prevents duplicates via unique constraint.
- **Background Jobs and Email Integration** - Scheduled jobs use PostgreSQL pg_cron extension calling Supabase Edge Functions. Resend API for email sending with React Email templates.

### File Structure

```
supabase/migrations/002_entities_domain/
└── 003_students_schema.sql          # Add contact fields

supabase/migrations/004_notifications_domain/
└── 001_notifications_schema.sql     # Create notifications table

supabase/functions/notifications/send-due-soon-notifications/
├── index.ts                         # Main notification logic
└── deno.json                        # Deno configuration

emails/
└── payment-reminder.tsx             # React Email template

packages/utils/src/
├── notification-helpers.ts          # Email/SMS sending utilities
└── notification-helpers.test.ts     # Unit tests
```

### Database Migrations

**Migration 1: Add student contact fields**
```sql
-- supabase/migrations/002_entities_domain/003_students_schema.sql
ALTER TABLE students ADD COLUMN contact_preference TEXT
  CHECK (contact_preference IN ('email', 'sms', 'both')) DEFAULT 'email';
ALTER TABLE students ADD COLUMN phone_number TEXT;
```

**Migration 2: Create notifications table**
```sql
-- supabase/migrations/004_notifications_domain/001_notifications_schema.sql
CREATE TABLE student_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES installments(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  notification_type TEXT CHECK (notification_type IN ('due_soon', 'overdue')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivery_status TEXT CHECK (delivery_status IN ('sent', 'failed', 'pending')) DEFAULT 'sent',
  error_message TEXT,
  UNIQUE(installment_id, notification_type)
);

-- RLS Policies
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications for their agency"
  ON student_notifications FOR SELECT
  USING (agency_id IN (SELECT agency_id FROM user_agencies WHERE user_id = auth.uid()));
```

**Migration 3: Setup pg_cron job**
```sql
-- Schedule daily job at 7:00 PM UTC (5:00 AM Brisbane)
SELECT cron.schedule(
  'send-due-soon-notifications',
  '0 19 * * *',
  $$
  SELECT net.http_post(
    url:='https://[your-project].supabase.co/functions/v1/send-due-soon-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [service-role-key]"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### Supabase Edge Function Implementation

**supabase/functions/notifications/send-due-soon-notifications/index.ts**

Key logic:
1. Query installments due in 36 hours (CURRENT_DATE + 1 day at 5 PM cutoff)
2. Filter to only pending installments not already notified
3. For each installment:
   - Fetch student contact info
   - Render email template
   - Send via Resend API
   - Log to student_notifications table
4. Handle errors and retry logic

### Email Template

**emails/payment-reminder.tsx**

Should include:
- Personalized greeting with student name
- Clear display of amount due
- Formatted due date (in agency timezone)
- Payment instructions (how to pay)
- Agency contact information
- Professional branding

Example structure:
```tsx
import { Html, Head, Preview, Body, Container, Heading, Text, Button } from '@react-email/components';

interface PaymentReminderEmailProps {
  studentName: string;
  amount: number;
  dueDate: string;
  paymentInstructions: string;
  agencyName: string;
}

export default function PaymentReminderEmail({
  studentName,
  amount,
  dueDate,
  paymentInstructions,
  agencyName
}: PaymentReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment reminder: ${amount} due on {dueDate}</Preview>
      <Body>
        <Container>
          <Heading>Payment Reminder</Heading>
          <Text>Hi {studentName},</Text>
          <Text>
            This is a friendly reminder that your payment of ${amount} is due on {dueDate}.
          </Text>
          <Text>{paymentInstructions}</Text>
          <Text>Thank you,<br/>{agencyName}</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

### Testing Requirements

**Edge Function Tests** (supabase/functions/notifications/send-due-soon-notifications/index.test.ts):
- Test notification job queries correct installments (due in 36 hours)
- Test email sent via Resend mock
- Test notification log prevents duplicate sends with unique constraint
- Test timezone conversion (7 PM UTC = 5 AM Brisbane) for job scheduling
- Test installment paid before notification triggers - verify no email sent
- Test email delivery failure logs error and updates delivery_status to 'failed'

**Integration Tests:**
- Test full flow from installment creation to due soon flag to notification send
- Test with various timezone scenarios
- Test notification timing accuracy

---

## Update Manifest

Before starting implementation, update the manifest file:

`.bmad-ephemeral/stories/prompts/5-2-due-soon-notification-flags/MANIFEST.md`

Update:
1. Mark Task 2 status as "Completed" with completion date
2. Add notes about Task 2 implementation (UI components created)
3. Mark Task 3 status as "In Progress" with start date

---

## Implementation Steps

1. **Update manifest** to mark Task 3 as in progress
2. **Create database migrations**:
   - Add student contact fields
   - Create student_notifications table with RLS
   - Setup pg_cron scheduled job
3. **Create email template** (emails/payment-reminder.tsx)
4. **Implement notification helpers** (packages/utils/src/notification-helpers.ts):
   - sendNotificationEmail function
   - Resend API integration
   - Error handling utilities
5. **Create Supabase Edge Function** (supabase/functions/notifications/send-due-soon-notifications/):
   - Query logic for installments due in 36 hours
   - Email sending with template rendering
   - Notification logging
   - Error handling and retry logic
6. **Test notification system**:
   - Unit tests for helper functions
   - Edge function tests with mocks
   - Manual test with dev environment
7. **Verify pg_cron scheduling** in production
8. **Update manifest** when task complete

## Important Notes

**Timezone Handling:**
- pg_cron job runs at 7:00 PM UTC = 5:00 AM Brisbane next day
- Query installments where `due_date = CURRENT_DATE + INTERVAL '1 day'`
- This accounts for 36-hour advance notice before 5 PM cutoff

**Duplicate Prevention:**
- Unique constraint on (installment_id, notification_type) in database
- Check for existing notification before sending
- If notification exists, skip sending

**Error Handling:**
- Log all notification attempts to student_notifications table
- Set delivery_status to 'failed' on error
- Store error_message for debugging
- Implement retry logic for transient failures

**Resend API Integration:**
- Use service account API key (not user-facing)
- Store API key in Supabase secrets
- Rate limiting considerations (Resend limits)
- Email from address must be verified domain

## Next Steps

After completing Task 3:
1. Update the manifest file - mark Task 3 as "Completed" with today's date
2. Add implementation notes about notification system
3. Move to [task-4-prompt.md](task-4-prompt.md) for comprehensive testing and validation

---

**Source Story**: [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.md](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.md)
**Story Context**: [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml)
