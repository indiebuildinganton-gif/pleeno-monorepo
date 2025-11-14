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
