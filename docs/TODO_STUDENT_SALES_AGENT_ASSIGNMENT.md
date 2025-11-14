# TODO: Sales Agent Assignment on Student Form

**Epic 5: Intelligent Status Automation & Notifications**
**Story 5.5: Automated Email Notifications (Multi-Stakeholder)**
**Task 2: Notification Settings UI - Subtask 2.3**

## Overview

When the student management UI is implemented in the agency app, add a sales agent assignment field to allow agency users to assign a sales representative to each student.

## Database Schema

The database field already exists:
- Table: `students`
- Column: `assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL`

This field is used by the notification system to send notifications to the assigned sales agent for student payment events.

## Implementation Requirements

### 1. Student Form Field

Add a dropdown/select field to the student creation/edit form:

```tsx
<SelectField
  label="Assigned Sales Agent"
  description="Sales agent who manages this student"
  value={student.assigned_user_id}
  onChange={(value) => updateStudent({ assigned_user_id: value })}
>
  <option value="">None (No sales agent assigned)</option>
  {salesAgents.map(agent => (
    <option key={agent.id} value={agent.id}>
      {agent.full_name} ({agent.email})
    </option>
  ))}
</SelectField>
```

### 2. Fetch Sales Agents

Query to fetch sales agents from the same agency:

```typescript
const { data: salesAgents } = await supabase
  .from('users')
  .select('id, full_name, email')
  .eq('agency_id', currentAgencyId)
  .eq('status', 'active')
  .order('full_name')
```

**Note:** You may want to add a specific role or flag for sales agents, or allow any active user to be assigned.

### 3. Validation

Add to the student validation schema in `packages/validations/src/student.schema.ts`:

```typescript
export const StudentUpdateSchema = z.object({
  // ... existing fields ...
  assigned_user_id: z.string().uuid().nullable().optional(),
})
```

### 4. API Integration

Update the student create/update API routes to accept the `assigned_user_id` field:

```typescript
// In student create/update endpoint
const { data: student } = await supabase
  .from('students')
  .update({
    // ... other fields ...
    assigned_user_id: validatedData.assigned_user_id,
  })
  .eq('id', studentId)
```

### 5. UI/UX Considerations

- **Optional Field:** Make the assignment optional (students can exist without an assigned agent)
- **Clear Label:** Use clear labels like "Assigned Sales Agent" or "Account Manager"
- **Filter by Role:** If you implement sales agent roles, filter the dropdown to only show users with that role
- **Auto-complete:** For large teams, consider using an autocomplete/search dropdown instead of a simple select

## Related Files

- Database schema: `supabase/migrations/004_notifications_domain/001_notification_system.sql`
- Notification rules: Already implemented in notification settings page
- Students table: Has the field ready to use

## Testing

When implemented, ensure:
1. Sales agent can be assigned during student creation
2. Sales agent can be updated on existing students
3. Assignment can be removed (set to null)
4. Only users from the same agency appear in the dropdown
5. Notifications are sent to assigned sales agents when configured

## Status

**PENDING IMPLEMENTATION** - Waiting for student management UI to be built in the agency app.

This is documented for reference during future student management feature development.
