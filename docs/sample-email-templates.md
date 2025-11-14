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
