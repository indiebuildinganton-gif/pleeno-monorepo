# Task 3: Email Template Management UI

**Story:** 5.5 - Automated Email Notifications (Multi-Stakeholder)

**Acceptance Criteria Addressed:** AC #2

**Prerequisites:** Task 1 (Database Schema) must be completed

## Objective

Build the email template editor where agency admins can customize the content of notification emails for each recipient type. The editor should support HTML email composition with variable placeholders and provide preview functionality.

## Background Context

Different stakeholder groups need different email formats:
- **Students:** Payment reminders with amount, due date, payment instructions
- **Colleges:** Summary of overdue payments for students at that college
- **Sales Agents:** Alert when their assigned student has overdue payment
- **Agency Admins:** Summary of all newly overdue installments

Each agency should be able to customize these templates while using standardized variable placeholders.

## Subtasks

### 3.1: Create Email Template Management Page

**Location:** `apps/agency/app/settings/email-templates/page.tsx`

**UI Structure:**
```tsx
<PageHeader title="Email Templates" />

<TemplateList>
  {/* List of existing templates with edit/preview buttons */}
  <TemplateCard
    type="student_overdue"
    title="Student Overdue Payment"
    description="Sent to students when payment becomes overdue"
    onEdit={() => openEditor('student_overdue')}
    onPreview={() => showPreview('student_overdue')}
  />

  {/* Repeat for other template types */}
</TemplateList>

<Button onClick={() => openEditor()}>Create New Template</Button>
```

### 3.2: Build Template Editor Component

**Location:** `apps/agency/components/email-template-editor.tsx`

**Features:**
- Rich text editor for HTML email body (use TipTap, Quill, or similar)
- Subject line input field
- Variable placeholder helper/picker
- Preview pane showing rendered email
- Save/Cancel buttons

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
- `{{payment_instructions}}` - Custom payment instructions
- `{{view_link}}` - Link to payment plan/student profile

**UI Component Structure:**
```tsx
<TemplateEditor>
  <FormField label="Template Type">
    <Select value={templateType}>
      <option value="student_overdue">Student Overdue Payment</option>
      <option value="college_overdue">College Notification</option>
      <option value="sales_agent_overdue">Sales Agent Alert</option>
      <option value="agency_admin_overdue">Agency Admin Summary</option>
    </Select>
  </FormField>

  <FormField label="Subject Line">
    <Input
      value={subject}
      onChange={setSubject}
      placeholder="Overdue Payment Reminder"
    />
  </FormField>

  <FormField label="Email Body">
    <RichTextEditor
      value={bodyHtml}
      onChange={setBodyHtml}
      toolbar={['bold', 'italic', 'link', 'bulletList']}
    />
  </FormField>

  <PlaceholderHelper>
    <p>Available Variables (click to insert):</p>
    {PLACEHOLDERS.map(placeholder => (
      <Chip
        key={placeholder}
        onClick={() => insertPlaceholder(placeholder)}
      >
        {placeholder}
      </Chip>
    ))}
  </PlaceholderHelper>

  <PreviewPane>
    <h3>Preview</h3>
    <EmailPreview html={renderTemplate(bodyHtml, SAMPLE_DATA)} />
  </PreviewPane>

  <ButtonGroup>
    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
    <Button onClick={onSave}>Save Template</Button>
  </ButtonGroup>
</TemplateEditor>
```

### 3.3: Implement API Routes for Email Templates

**Location:** `apps/agency/app/api/email-templates/route.ts`

**Endpoints:**
- `GET /api/email-templates` - Fetch all templates for agency
- `POST /api/email-templates` - Create new template
- `PATCH /api/email-templates/[id]` - Update existing template
- `DELETE /api/email-templates/[id]` - Delete template

**API Implementation:**
```typescript
// GET /api/email-templates
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('agency_id', profile.agency_id)

  return Response.json({ data, error })
}

// POST /api/email-templates
export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createClient()

  // Sanitize HTML to prevent XSS
  const cleanHtml = sanitizeHtml(body.body_html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
    allowedAttributes: { 'a': ['href'] }
  })

  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      agency_id: body.agency_id,
      template_type: body.template_type,
      subject: body.subject,
      body_html: cleanHtml,
      variables: body.variables
    })
    .select()

  return Response.json({ data, error })
}

// Similar for PATCH and DELETE
```

### 3.4: Create Default Email Templates

**Location:** `apps/agency/lib/default-templates.ts`

Provide default templates for each type:

```typescript
export const DEFAULT_TEMPLATES = {
  student_overdue: {
    subject: "Payment Reminder - {{college_name}}",
    body_html: `
      <p>Dear {{student_name}},</p>
      <p>This is a friendly reminder that your payment of <strong>{{amount}}</strong>
      was due on <strong>{{due_date}}</strong>.</p>
      <p><strong>Payment Instructions:</strong><br>{{payment_instructions}}</p>
      <p>If you have already made this payment, please disregard this message.</p>
      <p>For questions, contact us at {{agency_email}} or {{agency_phone}}.</p>
      <p>Thank you,<br>{{agency_name}}</p>
    `
  },

  college_overdue: {
    subject: "Overdue Payment Summary - {{college_name}}",
    body_html: `
      <p>Dear {{college_name}} Team,</p>
      <p>The following students have overdue payments:</p>
      <ul>
        {{#students}}
        <li>{{name}} - {{amount}} (Due: {{due_date}})</li>
        {{/students}}
      </ul>
      <p>Please coordinate with students as needed.</p>
      <p>{{agency_name}}</p>
    `
  },

  sales_agent_overdue: {
    subject: "Action Required - Overdue Payment for {{student_name}}",
    body_html: `
      <p>Hi,</p>
      <p>Your assigned student <strong>{{student_name}}</strong> has an overdue payment:</p>
      <ul>
        <li>Amount: {{amount}}</li>
        <li>Due Date: {{due_date}}</li>
        <li>Contact: {{student_email}}, {{student_phone}}</li>
      </ul>
      <p><a href="{{view_link}}">View Student Profile</a></p>
      <p>{{agency_name}}</p>
    `
  },

  agency_admin_overdue: {
    subject: "New Overdue Payments - {{count}} students",
    body_html: `
      <p>Dear Admin,</p>
      <p>The following payments became overdue today:</p>
      <ul>
        {{#installments}}
        <li>{{student_name}} ({{college_name}}) - {{amount}} (Due: {{due_date}})</li>
        {{/installments}}
      </ul>
      <p><a href="{{view_link}}">View All Overdue Payments</a></p>
      <p>Pleeno Payment Tracking</p>
    `
  }
}
```

### 3.5: Template Preview Functionality

**Location:** `apps/agency/lib/template-preview.ts`

Implement placeholder replacement for preview:

```typescript
export function renderTemplate(template: string, data: Record<string, any>): string {
  let rendered = template

  // Replace simple placeholders
  Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`
    rendered = rendered.replace(new RegExp(placeholder, 'g'), data[key])
  })

  // Handle loops (e.g., {{#students}}...{{/students}})
  // For preview, just show sample data
  rendered = rendered.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, listName, content) => {
    if (data[listName] && Array.isArray(data[listName])) {
      return data[listName].map(item => {
        let itemHtml = content
        Object.keys(item).forEach(key => {
          itemHtml = itemHtml.replace(new RegExp(`{{${key}}}`, 'g'), item[key])
        })
        return itemHtml
      }).join('')
    }
    return ''
  })

  return rendered
}

export const SAMPLE_PREVIEW_DATA = {
  student_name: "John Doe",
  student_email: "john@example.com",
  student_phone: "0400 123 456",
  amount: "$1,500.00",
  due_date: "15 May 2025",
  college_name: "Example University",
  branch_name: "Brisbane Campus",
  agency_name: "Education Agency",
  agency_email: "contact@agency.com",
  agency_phone: "1300 123 456",
  payment_instructions: "Bank transfer to: BSB 123-456, Account 12345678",
  view_link: "https://pleeno.com/payments/12345"
}
```

## Testing Requirements

1. **Render Tests:**
   - Template list page renders
   - Template editor opens and displays form
   - Placeholder helper shows all available variables
   - Preview pane renders correctly

2. **Interaction Tests:**
   - Clicking placeholder inserts it at cursor position
   - Subject line updates in real-time
   - Body HTML updates in real-time
   - Preview updates as template changes
   - Save button triggers API call
   - Default templates load correctly

3. **API Tests:**
   - GET returns templates for current agency only
   - POST creates new template with sanitized HTML
   - PATCH updates existing template
   - DELETE removes template
   - HTML sanitization prevents XSS attacks

4. **Security Tests:**
   - Malicious HTML is stripped (e.g., `<script>` tags)
   - Only allowed HTML tags/attributes permitted
   - Template access restricted by agency_id

## Files to Create/Modify

**Create:**
- `apps/agency/app/settings/email-templates/page.tsx`
- `apps/agency/components/email-template-editor.tsx`
- `apps/agency/app/api/email-templates/route.ts`
- `apps/agency/app/api/email-templates/[id]/route.ts`
- `apps/agency/lib/default-templates.ts`
- `apps/agency/lib/template-preview.ts`

## Definition of Done

- [ ] Email template list page renders with all template types
- [ ] Template editor supports rich text editing
- [ ] Placeholder helper inserts variables correctly
- [ ] Preview functionality renders template with sample data
- [ ] API routes implement CRUD operations with RLS
- [ ] Default templates provided for all recipient types
- [ ] HTML sanitization prevents XSS
- [ ] All tests passing

## References

- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Task 3]
- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Email Template Variables]
- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Security Considerations]

---

**Previous Task:** Task 2 - Notification Settings UI
**Next Task:** Task 4 - Email Sending Service
