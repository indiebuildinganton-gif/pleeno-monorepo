# Task 2: Generate Notifications When Installments Become Overdue

## Context
You are implementing Story 5.3: Overdue Payment Alerts - Task 2 of 5.

This task extends the automated status update job (from Story 5.1) to generate in-app notifications when installments become overdue. This bridges the backend status detection system with the user-facing notification system built in Task 1.

## Story Overview
**As an** Agency User
**I want** to receive in-app notifications for overdue payments
**So that** I'm immediately aware when follow-up action is needed

## Prerequisites
- Task 1 completed: Notifications table and API routes exist
- Story 5.1 completed: Automated status update job running (pg_cron + Edge Function)
- Installments.status includes 'overdue' enum value

## Acceptance Criteria for This Task
- AC 1: Given the automated status job has marked installments as overdue, When I log into the application, Then I see a notification/alert for new overdue payments since my last login

## Your Task
Update the status update job to detect newly overdue installments and generate notifications:

### Subtasks:
1. Update status update job to detect newly overdue installments (status changed today)
2. Create notification record when installment status changes to 'overdue'
3. Set notification type = 'overdue_payment', include student name and amount in message
4. Link notification to /payments/plans?status=overdue filtered view
5. Test notification generation with various installment scenarios

## Technical Specifications

### Edge Function Update
File: `supabase/functions/payments/status-updater/index.ts`

**Current Behavior (from Story 5.1):**
- Scheduled job runs daily at 7 PM UTC (5 AM Brisbane time)
- Updates installment statuses based on due dates
- Marks installments as 'overdue' when due_date < today and status != 'paid'

**Enhanced Behavior:**
- After marking installments as overdue, query for newly overdue installments
- Create notification record for each newly overdue installment
- Prevent duplicate notifications (deduplication pattern)

### Implementation Pattern

```typescript
// After status update logic...

// Query for newly overdue installments (status changed today)
const { data: newlyOverdueInstallments, error } = await supabase
  .from('installments')
  .select(`
    id,
    amount,
    due_date,
    payment_plan:payment_plans (
      id,
      student:students (
        id,
        first_name,
        last_name
      ),
      agency_id
    )
  `)
  .eq('status', 'overdue')
  .gte('updated_at', new Date().toISOString().split('T')[0]) // Today
  .lt('updated_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]); // Before tomorrow

// Generate notification for each newly overdue installment
for (const installment of newlyOverdueInstallments) {
  const student = installment.payment_plan.student;
  const studentName = `${student.first_name} ${student.last_name}`;

  // Check for existing notification (deduplication)
  const { data: existingNotification } = await supabase
    .from('notifications')
    .select('id')
    .eq('type', 'overdue_payment')
    .eq('agency_id', installment.payment_plan.agency_id)
    .contains('message', installment.id) // Or use separate tracking table
    .single();

  if (!existingNotification) {
    // Create notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        agency_id: installment.payment_plan.agency_id,
        user_id: null, // Agency-wide notification
        type: 'overdue_payment',
        message: `Payment overdue: ${studentName} - $${installment.amount.toFixed(2)} due ${new Date(installment.due_date).toLocaleDateString()}`,
        link: '/payments/plans?status=overdue',
        is_read: false
      });

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }
  }
}
```

### Notification Message Format
**Template:** `Payment overdue: {Student Name} - ${Amount} due {Due Date}`

**Examples:**
- `Payment overdue: John Smith - $500.00 due 11/10/2025`
- `Payment overdue: Sarah Johnson - $1,250.00 due 11/08/2025`

### Deduplication Strategy
**Options:**

1. **Check existing notifications (recommended for MVP):**
   - Query notifications table for existing notification with same installment_id
   - Requires adding `installment_id` column to notifications table (optional)
   - Alternative: Check if message contains installment.id

2. **Separate tracking table (Story 5.2 pattern):**
   - Create `notification_log` table with unique constraint on (installment_id, notification_type)
   - More scalable but adds complexity

**Recommended Approach for MVP:**
Add `metadata` JSONB column to notifications table to store `{ installment_id: uuid }`, then check for existing notification with same installment_id.

### Migration Enhancement (if needed)
File: `supabase/migrations/004_notifications_domain/002_add_metadata.sql`

```sql
-- Add metadata column for storing structured data (installment_id, etc.)
ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for metadata queries
CREATE INDEX idx_notifications_metadata ON notifications USING GIN (metadata);
```

### Edge Function Deployment
After updating the Edge Function:

```bash
supabase functions deploy payments/status-updater
```

## Testing Requirements

### Unit Tests
Location: `supabase/functions/payments/status-updater/__tests__/`

**Test Cases:**
1. Notification generation for newly overdue installment
   - Given: Installment marked overdue today
   - When: Status update job runs
   - Then: Notification created with correct agency_id, type, message, link

2. Multiple overdue installments
   - Given: 3 installments marked overdue today
   - When: Status update job runs
   - Then: 3 notifications created (one per installment)

3. Deduplication
   - Given: Installment already has overdue notification
   - When: Status update job runs again
   - Then: No duplicate notification created

4. Installment paid then overdue again
   - Given: Installment paid (notification dismissed), then overdue again
   - When: Status update job runs
   - Then: New notification created

5. Message formatting
   - Given: Student name "John Smith", amount $500.00, due date 2025-11-10
   - When: Notification created
   - Then: Message = "Payment overdue: John Smith - $500.00 due 11/10/2025"

### Integration Test
- Manually mark installment as overdue → trigger Edge Function → verify notification in database
- Use Supabase dashboard or SQL query to inspect notifications table

### Manual Testing Checklist
- [ ] Deploy updated Edge Function
- [ ] Mark test installment as overdue (set due_date to past, status = 'overdue')
- [ ] Manually trigger Edge Function: `supabase functions invoke payments/status-updater`
- [ ] Query notifications table: verify new notification exists
- [ ] Verify notification message includes student name and amount
- [ ] Verify notification link = '/payments/plans?status=overdue'
- [ ] Re-run Edge Function: verify no duplicate notification created

## Error Handling
- Log errors when notification creation fails (don't block status update)
- Continue processing remaining installments if one fails
- Return summary in Edge Function response: `{ installmentsProcessed: X, notificationsCreated: Y, errors: [] }`

## Success Criteria
- [ ] Status update job detects newly overdue installments
- [ ] Notification created for each newly overdue installment
- [ ] Notification message includes student name and amount
- [ ] Notification link navigates to filtered payment plans view
- [ ] Deduplication prevents duplicate notifications
- [ ] Edge Function deployed and running successfully
- [ ] Tests passing for notification generation logic

## Context Files Reference
- Story Context: `.bmad-ephemeral/stories/5-3-overdue-payment-alerts.context.xml`
- Story 5.1: Automated Status Detection Job (prerequisite)
- Story 5.2: Due Soon Notification Flags (deduplication pattern reference)
- Architecture: `docs/architecture.md` (Multi-Stakeholder Notification System)

## Next Steps
After completing this task:
1. Proceed to Task 3: Build notification UI components
2. Update the MANIFEST.md file to mark Task 2 as complete

---

**Key Integration Point:** This task bridges the backend automation (Story 5.1) with the frontend notification system (Task 1). The status job now acts as both a status updater AND a notification generator.
