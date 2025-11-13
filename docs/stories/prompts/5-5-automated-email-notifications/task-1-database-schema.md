# Task 1: Database Schema for Notification System

**Story:** 5.5 - Automated Email Notifications (Multi-Stakeholder)

**Acceptance Criteria Addressed:** AC #1-6

## Objective

Create the complete database schema for the multi-stakeholder notification system, including notification rules, email templates, notification logging, and required user/student fields.

## Background Context

This is the foundation for a sophisticated notification system that will send different types of emails to different stakeholders (agency users, students, colleges, sales agents) based on configurable rules. The schema must:

- Support 4 distinct recipient types with independent enable/disable settings
- Prevent duplicate notifications using a log table with UNIQUE constraints
- Allow time-based pre-notifications (e.g., "due soon" emails 36 hours before)
- Track all notifications for audit purposes
- Store customizable email templates with variable placeholders

**Key Reference:** [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Database Schema Design]

## Subtasks

### 1.1: Add User and Student Fields

Add fields to existing tables:

- `users.email_notifications_enabled` (BOOLEAN DEFAULT false)
- `students.assigned_user_id` (FK to users) for sales agent assignment
- `installments.last_notified_date` (TIMESTAMPTZ) to prevent duplicate emails

### 1.2: Create notification_rules Table

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

### 1.3: Create email_templates Table

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

### 1.4: Create notification_log Table

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

### 1.5: Create Migration File

Create migration at: `supabase/migrations/004_notifications_domain/001_notification_system.sql`

Include:
- All table creations
- ALTER TABLE statements for users, students, installments
- Indexes for performance (see Performance Considerations below)
- Comments explaining the purpose of each table

### 1.6: Apply RLS Policies

Add Row Level Security policies:

**notification_rules:**
- Agency admins can CRUD their own agency's rules
- Agency users can SELECT their own agency's rules

**email_templates:**
- Agency admins can CRUD their own agency's templates
- Agency users can SELECT their own agency's templates

**notification_log:**
- Agency admins can SELECT their own agency's logs
- System can INSERT logs (via service role)

## Performance Considerations

Add indexes:
```sql
CREATE INDEX idx_notification_rules_agency ON notification_rules(agency_id, is_enabled, recipient_type);
CREATE INDEX idx_notification_log_installment ON notification_log(installment_id, recipient_email);
CREATE INDEX idx_installments_last_notified ON installments(last_notified_date);
CREATE INDEX idx_students_assigned_user ON students(assigned_user_id);
```

## Testing Requirements

After creating the migration:

1. Run migration locally: `supabase migration up`
2. Verify all tables created: Check Supabase dashboard
3. Test RLS policies:
   - Agency admin can create/read/update/delete rules and templates
   - Agency user can read rules and templates
   - Agency user CANNOT create/update/delete rules and templates
4. Test UNIQUE constraint on notification_log (attempt duplicate insert should fail)
5. Test CASCADE deletes (deleting agency should delete all rules/templates)

## Files to Create/Modify

- `supabase/migrations/004_notifications_domain/001_notification_system.sql` (CREATE)

## Definition of Done

- [ ] All tables created with correct schema
- [ ] RLS policies applied and tested
- [ ] Indexes created for performance
- [ ] Migration runs successfully without errors
- [ ] RLS policies tested with different user roles
- [ ] UNIQUE constraint on notification_log tested

## References

- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Database Schema Design]
- [Source: docs/architecture.md#Pattern 1: Multi-Stakeholder Notification System]
- [Source: docs/architecture.md#Notifications Domain]

---

**Next Task:** Task 2 - Notification Settings UI
