# Story 5.5: Automated Email Notifications (Multi-Stakeholder)

Status: ready-for-dev

## Story

As an **Agency Admin**,
I want **configurable email notifications for overdue payments sent to multiple stakeholders**,
so that **the right people are alerted and can take action based on our agency's process**.

## Acceptance Criteria

1. **Given** I am an Agency Admin configuring notification settings
   **When** I set up email notification rules
   **Then** I can enable/disable notifications for different recipient types:
   - Agency admins and users
   - Students (overdue payment reminders)
   - Colleges (optional, using agency-defined template)
   - Sales agents/account managers assigned to students (optional)

2. **And** I can create custom email templates for college notifications

3. **And** I can configure which events trigger notifications (overdue, due soon, payment received)

4. **And** I can assign sales agents/account managers to students for targeted notifications

5. **And** emails are sent only once per installment per recipient when it first becomes overdue

6. **And** each recipient type has independent enable/disable settings

7. **Given** the daily status job detects new overdue payments
   **When** notifications are enabled
   **Then** emails are sent according to configured rules

8. **Agency Admin/User Emails:**
   - Summary of all newly overdue installments
   - Includes student names, colleges, amounts, and due dates
   - Includes link to view overdue payments in the app

9. **Student Emails:**
   - Individual email per overdue installment
   - Payment amount, due date, payment instructions
   - Agency contact information

10. **College Emails (Optional):**
    - Uses agency-defined custom template
    - Summary of overdue payments for students at that college
    - Can include any custom fields configured by agency

11. **Sales Agent Emails (Optional):**
    - Notification when their assigned student has overdue payment
    - Student name, amount, due date, contact information
    - Link to student profile in the app

## Tasks / Subtasks

- [ ] **Task 1: Database Schema for Notification System** (AC: #1-6)
  - [ ] Add `users.email_notifications_enabled` field (BOOLEAN DEFAULT false)
  - [ ] Add `students.assigned_user_id` field (FK to users) for sales agent assignment
  - [ ] Create `notification_rules` table with fields:
    - id (UUID, primary key)
    - agency_id (FK to agencies)
    - recipient_type (ENUM: 'agency_user', 'student', 'college', 'sales_agent')
    - event_type (ENUM: 'overdue', 'due_soon', 'payment_received')
    - is_enabled (BOOLEAN)
    - custom_template (TEXT/HTML, nullable)
  - [ ] Create `email_templates` table with fields:
    - id (UUID, primary key)
    - agency_id (FK to agencies)
    - template_type (ENUM: 'student_overdue', 'college_overdue', 'sales_agent_overdue', 'agency_admin_overdue')
    - subject (TEXT)
    - body_html (TEXT)
    - variables (JSONB for placeholder mapping)
  - [ ] Add `installments.last_notified_date` field (TIMESTAMPTZ) to prevent duplicate emails
  - [ ] Create migration file in `supabase/migrations/004_notifications_domain/`
  - [ ] Apply RLS policies to new tables

- [ ] **Task 2: Notification Settings UI** (AC: #1-4)
  - [ ] Create `/agency/settings/notifications` page in agency zone
  - [ ] Build notification rules configuration form:
    - Checkboxes for each recipient type (agency_user, student, college, sales_agent)
    - Dropdowns for event types (overdue, due_soon, payment_received)
    - Enable/disable toggles per rule
  - [ ] Implement API routes:
    - GET /api/notification-rules
    - POST /api/notification-rules
    - PATCH /api/notification-rules/[id]
    - DELETE /api/notification-rules/[id]
  - [ ] Add sales agent assignment field to student edit form
  - [ ] Add email preferences section to `/agency/profile` page

- [ ] **Task 3: Email Template Management UI** (AC: #2)
  - [ ] Create `/agency/settings/email-templates` page
  - [ ] Build template editor UI with:
    - Rich text editor for HTML email body
    - Subject line input
    - Variable placeholders helper ({{student_name}}, {{amount}}, {{due_date}}, etc.)
    - Preview functionality
  - [ ] Implement API routes:
    - GET /api/email-templates
    - POST /api/email-templates
    - PATCH /api/email-templates/[id]
    - DELETE /api/email-templates/[id]
  - [ ] Provide default templates for each type (student_overdue, college_overdue, sales_agent_overdue, agency_admin_overdue)
  - [ ] Allow agencies to customize default templates

- [ ] **Task 4: Email Sending Service** (AC: #5, #7-11)
  - [ ] Set up Resend API integration (install @resend/node)
  - [ ] Create shared email utilities in `packages/utils/src/email-helpers.ts`:
    - renderTemplate(template, variables) - Replace placeholders with actual data
    - sendEmail(to, subject, html) - Send via Resend
  - [ ] Create React Email templates in `emails/` directory:
    - invitation.tsx
    - payment-reminder.tsx (student overdue)
    - commission-alert.tsx (college notification)
    - overdue-notification.tsx (agency admin/sales agent)
  - [ ] Configure Resend API key in environment variables

- [ ] **Task 5: Notification Job - Extend Status Update Function** (AC: #5, #7-11)
  - [ ] Extend the existing status update job (from Story 5.1) to track newly overdue installments
  - [ ] Modify `update_installment_statuses()` SQL function to:
    - Track which installments changed to 'overdue' status today
    - Return list of newly overdue installment IDs
  - [ ] Create Supabase Edge Function: `send-notifications`
    - Location: `supabase/functions/notifications/send-notifications/index.ts`
    - Called by status update job after status transitions
  - [ ] Implement notification logic in Edge Function:
    - Query notification_rules to determine which emails to send
    - For each enabled recipient type:
      - Agency users: query users with email_notifications_enabled = true
      - Students: get student email from students table
      - Colleges: get contact_email from colleges table
      - Sales agents: get user email from students.assigned_user_id
    - Check installments.last_notified_date to prevent duplicate sends
    - Render appropriate email template with installment data
    - Send email via Resend API
    - Update installments.last_notified_date after successful send
  - [ ] Add error handling and retry logic for failed emails
  - [ ] Log all notification attempts to notification_log table

- [ ] **Task 6: Testing** (AC: All)
  - [ ] Write unit tests for email template rendering utility
  - [ ] Test variable placeholder replacement ({{student_name}}, etc.)
  - [ ] Write integration tests for notification rules API routes
  - [ ] Test enabling/disabling rules, creating/editing templates
  - [ ] Write Edge Function tests for send-notifications
  - [ ] Mock Resend API and verify correct emails sent to correct recipients
  - [ ] Test duplicate prevention: verify last_notified_date logic
  - [ ] Test end-to-end: trigger status update → verify notifications sent

- [ ] **Task 7: Documentation and Configuration** (AC: All)
  - [ ] Document notification system in architecture.md
  - [ ] Add sample email templates to repository
  - [ ] Create admin guide for configuring notification rules
  - [ ] Add environment variable documentation for RESEND_API_KEY
  - [ ] Update deployment checklist to include Resend setup

## Dev Notes

### Architecture Context

**Multi-Stakeholder Notification System:**
This story implements a sophisticated notification pattern that sends different emails to different stakeholders based on configurable rules. The system must:
- Support 4 distinct recipient types with different message formats
- Prevent duplicate notifications (once per installment per recipient)
- Allow time-based pre-notifications (due soon emails sent 36 hours before)
- Handle conditional sending (only if enabled per agency)
- Track all notifications for audit purposes

**Key Components:**
1. **Database Layer:** notification_rules, email_templates, notification_log tables
2. **Settings UI:** Agency admin configures rules and templates
3. **Background Job:** Extends status update job to trigger notifications
4. **Edge Function:** Processes notification rules and sends emails
5. **Email Service:** Resend API with React Email templates

**Novel Pattern Reference:**
[Source: docs/architecture.md#Pattern 1: Multi-Stakeholder Notification System] - Complete implementation details for this pattern

### Database Schema Design

**Notification Rules Table:**
```sql
CREATE TABLE notification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  recipient_type TEXT CHECK (recipient_type IN ('agency_user', 'student', 'college', 'sales_agent')),
  event_type TEXT CHECK (event_type IN ('overdue', 'due_soon', 'payment_received')),
  is_enabled BOOLEAN DEFAULT false,
  template_id UUID REFERENCES email_templates(id),
  trigger_config JSONB,  -- { advance_hours?: 36, trigger_time?: "05:00", timezone?: "Australia/Brisbane" }
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Email Templates Table:**
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  template_type TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables JSONB,  -- { "student_name": "{{student.name}}", "amount": "{{installment.amount}}" }
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Notification Log Table (Prevents Duplicates):**
```sql
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installment_id UUID REFERENCES installments(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(installment_id, recipient_type, recipient_email)
);
```

**Student Assignment Field:**
```sql
ALTER TABLE students ADD COLUMN assigned_user_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT false;
ALTER TABLE installments ADD COLUMN last_notified_date TIMESTAMPTZ;
```

### Edge Function Implementation

**Location:** `supabase/functions/notifications/send-notifications/index.ts`

**Function Flow:**
1. Receive newly overdue installment IDs from status update job
2. Query notification_rules for enabled rules
3. For each rule, determine recipients based on recipient_type
4. Check notification_log to prevent duplicate sends
5. Render email template with installment/student/agency data
6. Send email via Resend API
7. Log successful send to notification_log
8. Update installments.last_notified_date

**Example Code Structure:**
```typescript
export async function sendNotifications(event: NotificationEvent) {
  const rules = await supabase
    .from('notification_rules')
    .select('*, email_templates(*)')
    .eq('agency_id', event.agency_id)
    .eq('event_type', event.event_type)
    .eq('is_enabled', true)

  for (const rule of rules.data) {
    const recipients = await getRecipients(rule.recipient_type, event)

    for (const recipient of recipients) {
      // Check if already sent
      const { data: existingLog } = await supabase
        .from('notification_log')
        .select('id')
        .eq('installment_id', event.installment_id)
        .eq('recipient_type', rule.recipient_type)
        .eq('recipient_email', recipient.email)
        .single()

      if (existingLog) continue  // Already sent, skip

      // Render template with data
      const emailContent = renderTemplate(rule.email_templates, {
        student: event.student,
        installment: event.installment,
        agency: event.agency
      })

      // Send via Resend
      await resend.emails.send({
        from: event.agency.contact_email,
        to: recipient.email,
        subject: emailContent.subject,
        html: emailContent.html
      })

      // Log the send
      await supabase.from('notification_log').insert({
        installment_id: event.installment_id,
        recipient_type: rule.recipient_type,
        recipient_email: recipient.email
      })
    }
  }
}
```

### Email Template Variables

**Available Placeholders:**
- `{{student_name}}` - Student full name
- `{{student_email}}` - Student email
- `{{student_phone}}` - Student phone
- `{{amount}}` - Installment amount (formatted as currency)
- `{{due_date}}` - Student due date (formatted)
- `{{college_name}}` - College name
- `{{branch_name}}` - Branch name
- `{{agency_name}}` - Agency name
- `{{agency_email}}` - Agency contact email
- `{{agency_phone}}` - Agency contact phone
- `{{payment_instructions}}` - Custom payment instructions (from agency settings)
- `{{view_link}}` - Link to view payment plan or student profile in app

### Security Considerations

**Email Template Security:**
- Sanitize all user-provided template HTML to prevent XSS
- Validate template variables to ensure they exist before rendering
- Restrict template editing to Agency Admins only

**Notification Rules:**
- RLS policies ensure agencies only manage their own rules
- Validate recipient email addresses before sending
- Rate limit email sending to prevent abuse (max 100 emails per hour per agency)

**Resend API:**
- Store API key in environment variables (never in code)
- Use server-side Edge Function for email sending (not client-side)
- Handle Resend API errors gracefully (log and retry failed sends)

### Testing Standards

**Unit Tests:**
- Test template rendering utility: verify placeholders replaced correctly
- Test recipient lookup logic: verify correct emails retrieved for each recipient type
- Test duplicate prevention: verify notification_log UNIQUE constraint works

**Integration Tests:**
- Test notification rules CRUD: create, read, update, delete rules
- Test email template CRUD: create, read, update, delete templates
- Test Edge Function: mock Resend API, verify emails sent to correct recipients

**E2E Tests (Playwright):**
- Admin configures notification rule → trigger status update → verify email sent
- Test notification settings UI: enable/disable rules, create templates
- Test sales agent assignment: assign agent to student → trigger overdue → verify agent receives email

### Performance Considerations

**Batch Email Sending:**
- Send emails in batches to avoid rate limits
- Use async/await with Promise.all for parallel sending
- Implement exponential backoff for failed sends

**Database Queries:**
- Add indexes on notification_rules (agency_id, is_enabled, recipient_type)
- Add indexes on notification_log (installment_id, recipient_email)
- Add index on installments (last_notified_date) for efficient queries

**Caching:**
- Cache notification rules per agency (5-minute TTL)
- Cache email templates per agency (1-hour TTL)
- Invalidate cache when rules/templates updated

### Learnings from Previous Story (Story 5.4)

**From Story 5.4 (Status: ready-for-dev)**

Story 5.4 has not been implemented yet, so no completion notes or file list available. However, relevant context:

- **Dashboard Integration:** Story 5.4 creates the payment status dashboard widget that displays overdue counts. Story 5.5 extends this by adding email notifications for overdue payments.
- **API Patterns:** Follow the API route patterns established in Story 5.4 for dashboard endpoints
- **RLS Policies:** Reuse RLS policy patterns for agency_id filtering on notification_rules and email_templates tables
- **TanStack Query:** Use TanStack Query for notification settings UI (similar to dashboard data fetching)

[Source: stories/5-4-payment-status-dashboard-widget.md]

### Project Structure Notes

**Notification Settings UI:**
```
apps/agency/
├── app/
│   ├── settings/
│   │   ├── notifications/
│   │   │   └── page.tsx                  # Notification rules configuration
│   │   └── email-templates/
│   │       └── page.tsx                  # Email template editor
│   ├── api/
│   │   ├── notification-rules/
│   │   │   └── route.ts                  # CRUD for notification rules
│   │   └── email-templates/
│   │       └── route.ts                  # CRUD for email templates
```

**Edge Functions:**
```
supabase/functions/
├── notifications/
│   └── send-notifications/
│       ├── index.ts                      # Main notification sending logic
│       └── deno.json                     # Deno configuration
```

**Email Templates:**
```
emails/
├── payment-reminder.tsx                  # Student overdue notification
├── commission-alert.tsx                  # College notification
├── overdue-notification.tsx              # Agency admin/sales agent notification
└── invitation.tsx                        # User invitation (existing)
```

### Deployment Considerations

**Resend API Setup:**
1. Sign up for Resend account: https://resend.com
2. Create API key in Resend dashboard
3. Add RESEND_API_KEY to environment variables in Vercel
4. Verify domain for sending emails (e.g., noreply@pleeno.com)

**Edge Function Deployment:**
```bash
supabase functions deploy send-notifications
```

**Environment Variables:**
```bash
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://pleeno.com  # For generating links in emails
```

**Testing in Development:**
- Use Resend test mode for development
- Configure webhook to receive delivery/bounce notifications
- Monitor Resend dashboard for email delivery status

### References

- [Source: docs/architecture.md#Pattern 1: Multi-Stakeholder Notification System] - Complete architecture pattern
- [Source: docs/architecture.md#Email Integration] - Resend integration details
- [Source: docs/architecture.md#Database to Frontend] - API patterns and RLS
- [Source: docs/epics.md#Story 5.5] - Acceptance criteria and business requirements
- [Source: docs/architecture.md#Notifications Domain] - Database schema design

## Dev Agent Record

### Context Reference

- [5-5-automated-email-notifications-multi-stakeholder.context.xml](.bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
