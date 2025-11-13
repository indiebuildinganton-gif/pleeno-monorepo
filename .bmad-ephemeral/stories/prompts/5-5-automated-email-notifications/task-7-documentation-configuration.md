# Task 7: Documentation and Configuration

**Story:** 5.5 - Automated Email Notifications (Multi-Stakeholder)

**Acceptance Criteria Addressed:** All ACs

**Prerequisites:** All previous tasks (1-6) must be completed

## Objective

Document the notification system architecture, create admin guides for configuration, provide sample templates, and ensure proper deployment configuration for the Resend API integration.

## Background Context

Good documentation is critical for:
1. **Future developers** understanding the notification system architecture
2. **Agency admins** configuring notification rules and templates
3. **DevOps/deployment** setting up the Resend API correctly
4. **Support team** troubleshooting notification issues

## Subtasks

### 7.1: Update Architecture Documentation

**Location:** `docs/architecture.md`

Add section documenting the notification system:

```markdown
## Notification System

### Overview

The notification system sends automated emails to multiple stakeholders when payment events occur (overdue, due soon, payment received). The system is highly configurable, allowing each agency to control which recipients receive which types of notifications.

### Architecture Components

1. **Database Layer:**
   - `notification_rules`: Stores per-agency rules for who gets notified and when
   - `email_templates`: Stores customizable email templates with variable placeholders
   - `notification_log`: Prevents duplicate sends and provides audit trail
   - `installments.last_notified_date`: Tracks when installment last triggered notifications

2. **Settings UI (Agency Zone):**
   - `/settings/notifications`: Configure notification rules (enable/disable per recipient type)
   - `/settings/email-templates`: Customize email templates with rich text editor

3. **Background Job:**
   - Status update job (from Story 5.1) extended to track newly overdue installments
   - Calls `send-notifications` Edge Function with list of newly overdue IDs

4. **Edge Function:**
   - `supabase/functions/notifications/send-notifications`
   - Processes notification rules for each agency
   - Determines recipients based on recipient type
   - Checks notification_log to prevent duplicates
   - Renders email templates with installment/student/agency data
   - Sends via Resend API
   - Logs successful sends to notification_log

5. **Email Service:**
   - Resend API for email delivery
   - React Email templates for type-safe, component-based email composition
   - Shared utilities for template rendering and placeholder replacement

### Pattern 1: Multi-Stakeholder Notification System

**Problem:** Different stakeholders need different information at different times.

**Solution:** Rule-based notification system with these key features:

- **Configurable Rules:** Each agency can enable/disable notifications per recipient type × event type
- **Duplicate Prevention:** UNIQUE constraint on (installment_id, recipient_type, recipient_email)
- **Idempotent Processing:** `last_notified_date` ensures installments only trigger once per day
- **Template Variables:** Standardized placeholders ({{student_name}}, {{amount}}, etc.)
- **Audit Trail:** Every send logged to notification_log with timestamp

**Recipient Types:**
1. **Agency Users:** Staff who opted in via email_notifications_enabled
2. **Students:** Individual reminders per overdue installment
3. **Colleges:** Summary of overdue payments for students at that college (optional)
4. **Sales Agents:** Alerts for their assigned students (optional)

**Event Types:**
- **overdue:** Sent when installment becomes overdue
- **due_soon:** Sent 36 hours before due date (configurable via trigger_config)
- **payment_received:** Sent when payment is recorded

### Database Schema

#### notification_rules

| Column          | Type      | Description                                    |
|-----------------|-----------|------------------------------------------------|
| id              | UUID      | Primary key                                    |
| agency_id       | UUID      | Foreign key to agencies                        |
| recipient_type  | TEXT      | 'agency_user', 'student', 'college', 'sales_agent' |
| event_type      | TEXT      | 'overdue', 'due_soon', 'payment_received'      |
| is_enabled      | BOOLEAN   | Whether rule is active                         |
| template_id     | UUID      | Foreign key to email_templates                 |
| trigger_config  | JSONB     | Optional config (e.g., advance_hours for due_soon) |

#### email_templates

| Column      | Type   | Description                                  |
|-------------|--------|----------------------------------------------|
| id          | UUID   | Primary key                                  |
| agency_id   | UUID   | Foreign key to agencies                      |
| template_type | TEXT | Template identifier (e.g., 'student_overdue') |
| subject     | TEXT   | Email subject line with placeholders         |
| body_html   | TEXT   | Email HTML body with placeholders            |
| variables   | JSONB  | Placeholder mapping for documentation        |

#### notification_log

| Column          | Type        | Description                          |
|-----------------|-------------|--------------------------------------|
| id              | UUID        | Primary key                          |
| installment_id  | UUID        | Foreign key to installments          |
| recipient_type  | TEXT        | Type of recipient notified           |
| recipient_email | TEXT        | Email address notified               |
| sent_at         | TIMESTAMPTZ | When notification was sent           |

**UNIQUE(installment_id, recipient_type, recipient_email)** - Prevents duplicate sends

### Security Considerations

1. **Email Template Security:**
   - All user-provided HTML sanitized to prevent XSS attacks
   - Only whitelisted HTML tags allowed (<p>, <strong>, <em>, <a>, <ul>, <ol>, <li>)
   - Template editing restricted to Agency Admins only via RLS

2. **Notification Rules:**
   - RLS policies ensure agencies only manage their own rules
   - Email addresses validated before sending
   - Rate limiting: max 100 emails per hour per agency

3. **Resend API:**
   - API key stored in environment variables (never in code)
   - Email sending only via server-side Edge Function
   - Graceful error handling with retry logic

### Performance Optimizations

1. **Batch Processing:**
   - Group installments by agency to minimize database queries
   - Send emails in parallel using Promise.all
   - Exponential backoff for failed sends

2. **Database Indexes:**
   ```sql
   CREATE INDEX idx_notification_rules_agency ON notification_rules(agency_id, is_enabled, recipient_type);
   CREATE INDEX idx_notification_log_installment ON notification_log(installment_id, recipient_email);
   CREATE INDEX idx_installments_last_notified ON installments(last_notified_date);
   CREATE INDEX idx_students_assigned_user ON students(assigned_user_id);
   ```

3. **Caching Strategy:**
   - Cache notification rules per agency (5-minute TTL)
   - Cache email templates per agency (1-hour TTL)
   - Invalidate cache when rules/templates updated

### Deployment Requirements

See [Deployment Guide](#deployment-guide) below.

### Troubleshooting

**Emails not sending:**
1. Check RESEND_API_KEY is set correctly
2. Verify notification rules are enabled for the agency
3. Check notification_log for error entries
4. Verify recipient email addresses are valid
5. Check Resend dashboard for delivery status

**Duplicate emails:**
1. Verify UNIQUE constraint exists on notification_log
2. Check last_notified_date is updating correctly
3. Review Edge Function logs for duplicate processing

**Template rendering issues:**
1. Verify all placeholder variables exist in data
2. Check template syntax ({{variable}}, not {variable})
3. Test template rendering with preview functionality
```

### 7.2: Create Admin Configuration Guide

**Location:** `docs/admin-guide-notifications.md`

```markdown
# Notification System - Admin Guide

This guide explains how to configure the automated email notification system for your agency.

## Overview

The notification system sends automated emails to different stakeholders when payment events occur:
- **Students** receive payment reminders
- **Agency staff** receive overdue payment summaries
- **Colleges** receive overdue payment lists for their students (optional)
- **Sales agents** receive alerts for their assigned students (optional)

## Configuring Notification Rules

1. Navigate to **Settings → Notifications**

2. For each recipient type, you'll see toggles for different event types:
   - **Overdue:** Sent when payment becomes overdue
   - **Due Soon:** Sent 36 hours before payment is due
   - **Payment Received:** Sent when payment is recorded

3. Enable the notifications you want by toggling them on

4. Click **Save Notification Settings**

### Recommended Configuration

**For most agencies:**
- ✅ Students - Overdue: **ON**
- ✅ Agency Users - Overdue: **ON**
- ❌ Students - Due Soon: OFF (optional, can reduce support burden)
- ❌ Colleges: OFF (only enable if your colleges want these notifications)
- ❌ Sales Agents: OFF (only enable if you have assigned sales agents)

## Customizing Email Templates

1. Navigate to **Settings → Email Templates**

2. Select the template type you want to customize:
   - **Student Overdue Payment**
   - **College Notification**
   - **Sales Agent Alert**
   - **Agency Admin Summary**

3. Click **Edit Template**

4. Customize the subject line and email body

5. Use variable placeholders to insert dynamic data:
   - `{{student_name}}` - Student's full name
   - `{{amount}}` - Payment amount (formatted as currency)
   - `{{due_date}}` - Due date (formatted)
   - `{{college_name}}` - College name
   - `{{agency_name}}` - Your agency name
   - `{{agency_email}}` - Your agency contact email
   - `{{payment_instructions}}` - Payment instructions from agency settings

6. Click **Preview** to see how the email will look

7. Click **Save Template**

### Example: Student Overdue Template

**Subject:**
```
Payment Reminder - {{college_name}}
```

**Body:**
```html
<p>Dear {{student_name}},</p>

<p>This is a friendly reminder that your payment of <strong>{{amount}}</strong>
for {{college_name}} was due on <strong>{{due_date}}</strong>.</p>

<p><strong>Payment Instructions:</strong><br>
{{payment_instructions}}</p>

<p>If you have already made this payment, please disregard this message.</p>

<p>For questions, contact us at {{agency_email}}.</p>

<p>Thank you,<br>
{{agency_name}}</p>
```

## Assigning Sales Agents

If you have sales agents or account managers who should be notified when their assigned students have overdue payments:

1. Navigate to **Students → [Student Name] → Edit**

2. In the **Assigned Sales Agent** dropdown, select the user

3. Click **Save**

4. Ensure the sales agent has notifications enabled in their profile:
   - Navigate to **Profile → Settings**
   - Enable **Receive email notifications**

## Email Notification Preferences (Staff)

Each agency staff member can control whether they receive overdue payment notifications:

1. Navigate to **Profile → Settings**

2. Toggle **Receive email notifications for overdue payments**

3. Click **Save**

## Troubleshooting

### Not Receiving Notifications

1. **Check notification rules are enabled:** Settings → Notifications
2. **Verify email address is correct:** Profile → Settings
3. **Check spam folder:** Notifications may be filtered by email provider
4. **Contact support:** If issue persists, contact technical support

### Duplicate Notifications

The system is designed to prevent duplicate notifications. Each installment will only trigger one email per recipient per event. If you're receiving duplicates, contact technical support.

### Emails Going to Spam

If emails are going to spam folders:
1. Add the sender email to your contacts/safe senders list
2. Ask your IT department to whitelist the sender domain
3. Contact support to review email authentication (SPF, DKIM)

## Best Practices

1. **Test templates before enabling:** Preview templates to ensure they look correct
2. **Start with minimal notifications:** Enable only student and agency user overdue notifications initially
3. **Update payment instructions:** Ensure payment instructions are set in agency settings before enabling notifications
4. **Monitor email delivery:** Check notification logs periodically to ensure emails are sending
5. **Communicate with stakeholders:** Let students, colleges, and sales agents know they'll be receiving automated notifications
```

### 7.3: Create Sample Email Templates

**Location:** `docs/sample-email-templates.md`

```markdown
# Sample Email Templates

This document provides sample email templates for each notification type. Use these as starting points for customizing your agency's notifications.

## Student Overdue Payment

**Subject:**
```
Payment Reminder - {{college_name}}
```

**Body:**
```html
<p>Dear {{student_name}},</p>

<p>This is a friendly reminder that your payment of <strong>{{amount}}</strong>
for {{college_name}} {{#if branch_name}}({{branch_name}}){{/if}} was due on
<strong>{{due_date}}</strong>.</p>

<p><strong>Payment Instructions:</strong><br>
{{payment_instructions}}</p>

<p>If you have already made this payment, please disregard this message.</p>

<p>For questions, please contact us:</p>
<ul>
  <li>Email: {{agency_email}}</li>
  <li>Phone: {{agency_phone}}</li>
</ul>

<p>Thank you,<br>
{{agency_name}}</p>
```

## Student Due Soon

**Subject:**
```
Payment Due Soon - {{college_name}}
```

**Body:**
```html
<p>Dear {{student_name}},</p>

<p>This is a reminder that your payment of <strong>{{amount}}</strong>
for {{college_name}} is due on <strong>{{due_date}}</strong> (in 36 hours).</p>

<p><strong>Payment Instructions:</strong><br>
{{payment_instructions}}</p>

<p>Please ensure payment is received by the due date to avoid late fees.</p>

<p>For questions, contact us at {{agency_email}} or {{agency_phone}}.</p>

<p>Thank you,<br>
{{agency_name}}</p>
```

## College Notification

**Subject:**
```
Overdue Payment Summary - {{college_name}}
```

**Body:**
```html
<p>Dear {{college_name}} Team,</p>

<p>The following students have overdue payments:</p>

<table style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background: #f0f0f0;">
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Student</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Amount</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Due Date</th>
    </tr>
  </thead>
  <tbody>
    {{#each students}}
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">{{name}}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">{{amount}}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">{{due_date}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<p>Please coordinate with students as needed to ensure payments are received.</p>

<p>For questions, contact us at {{agency_email}}.</p>

<p>Best regards,<br>
{{agency_name}}</p>
```

## Sales Agent Alert

**Subject:**
```
Action Required - Overdue Payment for {{student_name}}
```

**Body:**
```html
<p>Hi,</p>

<p>Your assigned student <strong>{{student_name}}</strong> has an overdue payment:</p>

<ul>
  <li><strong>Amount:</strong> {{amount}}</li>
  <li><strong>Due Date:</strong> {{due_date}}</li>
  <li><strong>College:</strong> {{college_name}}</li>
  <li><strong>Contact:</strong> {{student_email}}, {{student_phone}}</li>
</ul>

<p><a href="{{view_link}}" style="background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Student Profile</a></p>

<p>Please reach out to the student to follow up on this overdue payment.</p>

<p>{{agency_name}}</p>
```

## Agency Admin Summary

**Subject:**
```
New Overdue Payments - {{count}} students
```

**Body:**
```html
<p>Dear Admin,</p>

<p>The following payments became overdue today:</p>

<table style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background: #f0f0f0;">
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Student</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">College</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Amount</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Due Date</th>
    </tr>
  </thead>
  <tbody>
    {{#each installments}}
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">{{student_name}}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">{{college_name}}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">{{amount}}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">{{due_date}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<p><a href="{{view_link}}" style="background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View All Overdue Payments</a></p>

<p>Pleeno Payment Tracking</p>
```

## Variable Reference

All templates support these placeholders:

| Placeholder              | Description                           | Example                     |
|--------------------------|---------------------------------------|-----------------------------|
| `{{student_name}}`       | Student full name                     | John Doe                    |
| `{{student_email}}`      | Student email                         | john@example.com            |
| `{{student_phone}}`      | Student phone                         | 0400 123 456                |
| `{{amount}}`             | Payment amount (formatted)            | $1,500.00                   |
| `{{due_date}}`           | Due date (formatted)                  | 15 May 2025                 |
| `{{college_name}}`       | College name                          | Example University          |
| `{{branch_name}}`        | Branch name (if applicable)           | Brisbane Campus             |
| `{{agency_name}}`        | Agency name                           | Education Agency            |
| `{{agency_email}}`       | Agency contact email                  | contact@agency.com          |
| `{{agency_phone}}`       | Agency contact phone                  | 1300 123 456                |
| `{{payment_instructions}}` | Payment instructions from settings  | Bank transfer to: BSB...    |
| `{{view_link}}`          | Link to view in app                   | https://pleeno.com/pay/...  |

## Conditional Sections

Use `{{#if variable}}...{{/if}}` for conditional content:

```html
{{#if branch_name}}
<p>Branch: {{branch_name}}</p>
{{/if}}
```

## Loops

Use `{{#each items}}...{{/each}}` for repeating content:

```html
{{#each students}}
<li>{{name}} - {{amount}}</li>
{{/each}}
```
```

### 7.4: Create Deployment Checklist

**Location:** `docs/deployment-notifications.md`

```markdown
# Notification System - Deployment Guide

## Prerequisites

1. **Resend Account:**
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain (e.g., pleeno.com)
   - Generate API key

2. **Domain Verification:**
   - Add DNS records provided by Resend
   - Verify SPF, DKIM, and DMARC records
   - Test email sending from verified domain

## Environment Variables

Add these environment variables to your deployment:

### Production (.env.production or Vercel)

```bash
# Resend API
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Application URL (for generating links in emails)
NEXT_PUBLIC_APP_URL=https://pleeno.com

# Supabase (should already be set)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

### Development (.env.local)

```bash
# Use Resend test mode for development
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Migration

1. **Run notification system migration:**
   ```bash
   supabase migration up
   ```

2. **Verify tables created:**
   ```bash
   supabase db ls
   ```
   Should see:
   - notification_rules
   - email_templates
   - notification_log

3. **Verify RLS policies:**
   ```sql
   SELECT tablename, policyname FROM pg_policies
   WHERE tablename IN ('notification_rules', 'email_templates', 'notification_log');
   ```

## Edge Function Deployment

1. **Deploy send-notifications function:**
   ```bash
   supabase functions deploy send-notifications
   ```

2. **Set secrets:**
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   supabase secrets set APP_URL=https://pleeno.com
   ```

3. **Test function:**
   ```bash
   curl -i --location --request POST \
     'https://xxxxx.supabase.co/functions/v1/notifications/send-notifications' \
     --header 'Authorization: Bearer YOUR_ANON_KEY' \
     --header 'Content-Type: application/json' \
     --data '{"installmentIds":[],"eventType":"overdue"}'
   ```

## Verification Steps

### 1. Test Email Sending

```bash
# Send test email via Resend dashboard
# Or use the preview API endpoint
curl -X POST https://pleeno.com/api/email/preview \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Test User","amount":"$100"}'
```

### 2. Test Notification Rules

1. Login as agency admin
2. Navigate to Settings → Notifications
3. Enable student overdue notifications
4. Create a test installment with due date in the past
5. Run status update job manually
6. Verify email sent to student

### 3. Test Duplicate Prevention

1. Run status update job twice
2. Check notification_log table
3. Verify only one entry per installment/recipient

### 4. Monitor Resend Dashboard

1. Login to Resend dashboard
2. Navigate to Logs
3. Verify emails are being delivered
4. Check bounce/complaint rates

## Troubleshooting

### Emails Not Sending

**Check 1: Verify RESEND_API_KEY**
```bash
supabase secrets list
```

**Check 2: Check Edge Function logs**
```bash
supabase functions logs send-notifications
```

**Check 3: Verify domain authentication**
- Login to Resend dashboard
- Check domain verification status
- Ensure SPF/DKIM records are correct

### High Bounce Rate

1. **Verify recipient email addresses:**
   - Check students table for invalid emails
   - Remove test/fake emails

2. **Update email templates:**
   - Avoid spammy words (free, win, click here)
   - Include plain text version
   - Add unsubscribe link

3. **Monitor sender reputation:**
   - Check Resend dashboard for sender score
   - Reduce send volume if needed

## Rate Limits

**Resend Free Tier:**
- 100 emails/day
- 3,000 emails/month

**Resend Pro Tier:**
- 50,000 emails/month
- Higher sending rate

**Application Rate Limits:**
- Max 100 emails per hour per agency (configurable in Edge Function)

## Monitoring

### Metrics to Track

1. **Email delivery rate:** % of emails successfully delivered
2. **Bounce rate:** % of emails bounced
3. **Complaint rate:** % of emails marked as spam
4. **Open rate:** % of emails opened (if tracking enabled)

### Alerts to Configure

1. **High bounce rate:** > 5%
2. **High complaint rate:** > 0.1%
3. **Failed sends:** > 10 consecutive failures

## Rollback Plan

If notification system causes issues:

1. **Disable notifications:**
   ```sql
   UPDATE notification_rules SET is_enabled = false;
   ```

2. **Disable status update job:**
   - Comment out Edge Function call in status update job
   - Redeploy job

3. **Revert database migration:**
   ```bash
   supabase migration down
   ```

## Support Contacts

- **Resend Support:** support@resend.com
- **Technical Issues:** [Your support email]
- **Emergency Contact:** [Your on-call number]
```

### 7.5: Update Environment Variable Documentation

**Location:** `.env.example`

Add:

```bash
# Email Notifications (Story 5.5)
RESEND_API_KEY=re_your_resend_api_key_here
NEXT_PUBLIC_APP_URL=https://pleeno.com
```

## Files to Create/Modify

**Create:**
- `docs/admin-guide-notifications.md`
- `docs/sample-email-templates.md`
- `docs/deployment-notifications.md`

**Modify:**
- `docs/architecture.md` (add notification system section)
- `.env.example` (add RESEND_API_KEY)
- `README.md` (add link to notification docs)

## Definition of Done

- [ ] Architecture documentation updated with notification system
- [ ] Admin configuration guide created
- [ ] Sample email templates documented
- [ ] Deployment checklist created
- [ ] Environment variables documented
- [ ] README updated with links to docs

## References

- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Task 7]
- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Deployment Considerations]

---

**Previous Task:** Task 6 - Testing

**🎉 Story 5.5 Complete! All tasks finished.**
