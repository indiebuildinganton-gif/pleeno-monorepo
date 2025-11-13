# Task 2: Notification Settings UI

**Story:** 5.5 - Automated Email Notifications (Multi-Stakeholder)

**Acceptance Criteria Addressed:** AC #1-4

**Prerequisites:** Task 1 (Database Schema) must be completed

## Objective

Build the notification settings interface where agency admins can configure which stakeholders receive emails for different events (overdue, due soon, payment received). Also add sales agent assignment to student management and email preferences to user profiles.

## Background Context

This UI allows agency admins to control the entire notification system behavior. Each recipient type (agency_user, student, college, sales_agent) can be independently enabled/disabled for each event type. This creates a flexible matrix of notification rules.

**Key Requirements:**
- Independent enable/disable for each recipient type × event type combination
- Sales agent assignment on student records
- User-level email notification preferences
- Clean, intuitive UI following the agency zone design patterns

## Subtasks

### 2.1: Create Notification Settings Page

**Location:** `apps/agency/app/settings/notifications/page.tsx`

**UI Components:**
- Page header with title "Notification Settings"
- Section for each recipient type:
  - Agency Users
  - Students
  - Colleges
  - Sales Agents
- For each recipient type, show event type toggles:
  - Overdue payments (send when payment becomes overdue)
  - Due soon (send 36 hours before due date)
  - Payment received (send when payment recorded)
- Each toggle should clearly show enabled/disabled state
- Save button to apply changes

**Design Pattern:**
```tsx
// Notification Settings Page Structure
<PageHeader title="Notification Settings" />
<Form>
  <RecipientTypeSection title="Agency Users">
    <Toggle event="overdue" enabled={...} onChange={...} />
    <Toggle event="due_soon" enabled={...} onChange={...} />
    <Toggle event="payment_received" enabled={...} onChange={...} />
  </RecipientTypeSection>

  <RecipientTypeSection title="Students">
    {/* Same toggle pattern */}
  </RecipientTypeSection>

  {/* Repeat for Colleges and Sales Agents */}

  <Button type="submit">Save Notification Settings</Button>
</Form>
```

### 2.2: Implement API Routes for Notification Rules

**Location:** `apps/agency/app/api/notification-rules/route.ts`

**Endpoints:**
- `GET /api/notification-rules` - Fetch all rules for current agency
- `POST /api/notification-rules` - Create new rule
- `PATCH /api/notification-rules/[id]` - Update existing rule
- `DELETE /api/notification-rules/[id]` - Delete rule

**API Implementation:**
```typescript
// GET /api/notification-rules
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's agency_id
  const { data: profile } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  // Fetch notification rules
  const { data, error } = await supabase
    .from('notification_rules')
    .select('*')
    .eq('agency_id', profile.agency_id)

  return Response.json({ data, error })
}

// POST /api/notification-rules
export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notification_rules')
    .insert({
      agency_id: body.agency_id,
      recipient_type: body.recipient_type,
      event_type: body.event_type,
      is_enabled: body.is_enabled,
      template_id: body.template_id,
      trigger_config: body.trigger_config
    })
    .select()

  return Response.json({ data, error })
}

// Similar for PATCH and DELETE
```

### 2.3: Add Sales Agent Assignment to Student Form

**Location:** `apps/agency/app/students/[id]/edit/page.tsx` (or wherever student edit form exists)

**Changes:**
- Add dropdown field "Assigned Sales Agent"
- Populate dropdown with users from same agency who have appropriate role
- Save to `students.assigned_user_id` field

**UI Component:**
```tsx
<SelectField
  label="Assigned Sales Agent"
  value={student.assigned_user_id}
  onChange={(value) => updateStudent({ assigned_user_id: value })}
>
  <option value="">None</option>
  {salesAgents.map(agent => (
    <option key={agent.id} value={agent.id}>
      {agent.name}
    </option>
  ))}
</SelectField>
```

### 2.4: Add Email Preferences to User Profile

**Location:** `apps/agency/app/profile/page.tsx` (or user settings page)

**Changes:**
- Add checkbox "Receive email notifications for overdue payments"
- Save to `users.email_notifications_enabled` field

**UI Component:**
```tsx
<CheckboxField
  label="Receive email notifications"
  description="Get notified when students have overdue payments"
  checked={user.email_notifications_enabled}
  onChange={(checked) => updateUser({ email_notifications_enabled: checked })}
/>
```

### 2.5: State Management with TanStack Query

Use TanStack Query for data fetching and mutations:

```typescript
// Fetch notification rules
const { data: rules } = useQuery({
  queryKey: ['notification-rules'],
  queryFn: async () => {
    const res = await fetch('/api/notification-rules')
    return res.json()
  }
})

// Update rule mutation
const updateRule = useMutation({
  mutationFn: async (rule: NotificationRule) => {
    const res = await fetch(`/api/notification-rules/${rule.id}`, {
      method: 'PATCH',
      body: JSON.stringify(rule)
    })
    return res.json()
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['notification-rules'])
  }
})
```

## Testing Requirements

1. **Render Tests:**
   - Page renders without errors
   - All recipient type sections display
   - Toggles render with correct state

2. **Interaction Tests:**
   - Toggling notification rule updates state
   - Save button triggers API call
   - Success message displays after save
   - Error handling for failed saves

3. **API Tests:**
   - GET returns rules for current agency only
   - POST creates new rule with correct agency_id
   - PATCH updates existing rule
   - DELETE removes rule
   - Unauthorized users cannot access other agencies' rules

4. **Integration Tests:**
   - Agency admin can configure all notification types
   - Changes persist after page reload
   - Sales agent assignment saves correctly on student record
   - Email preferences toggle works on profile page

## Files to Create/Modify

**Create:**
- `apps/agency/app/settings/notifications/page.tsx`
- `apps/agency/app/api/notification-rules/route.ts`
- `apps/agency/app/api/notification-rules/[id]/route.ts` (for PATCH/DELETE)

**Modify:**
- `apps/agency/app/students/[id]/edit/page.tsx` (or student form component)
- `apps/agency/app/profile/page.tsx` (or user settings page)

## Definition of Done

- [ ] Notification settings page renders with all recipient types
- [ ] Toggles update notification rules in database
- [ ] API routes implement CRUD operations with RLS
- [ ] Sales agent assignment works on student form
- [ ] Email preferences toggle works on profile page
- [ ] All tests passing
- [ ] UI follows agency zone design patterns

## References

- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Task 2]
- [Source: docs/architecture.md#Database to Frontend]
- [Source: .bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.md] (for API patterns)

---

**Previous Task:** Task 1 - Database Schema
**Next Task:** Task 3 - Email Template Management UI
