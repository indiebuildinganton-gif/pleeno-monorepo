# Story 5.2: Due Soon Notification Flags

Status: ready-for-dev

## Story

As an **Agency User**,
I want **to see visual indicators for payments due within the next 4 days**,
So that **I can proactively follow up before payments become overdue, including weekend and early-week payments**.

## Acceptance Criteria

1. **Given** installments exist with upcoming due dates
   **When** I view payment plans or the dashboard
   **Then** installments due within 4 days are flagged as "due soon"

2. **And** "due soon" installments display with a warning badge/color

3. **And** the dashboard shows a count of "due soon" installments

4. **And** I can filter the payment plans list to show only plans with "due soon" installments

5. **And** the threshold (4 days) is configurable per agency

6. **Student Notification Requirements:**
   **Given** an installment is due soon
   **When** 36 hours before the payment cutoff time (5:00 PM Brisbane)
   **Then** the student receives an automated reminder notification

7. **And** the notification is sent at 5:00 AM Brisbane time the day before the due date

8. **And** the notification includes: student name, amount due, due date, payment instructions

## Tasks / Subtasks

- [ ] Task 1: Implement "due soon" computed field logic (AC: 1, 5)
  - [ ] Add agencies.due_soon_threshold_days field (default: 4)
  - [ ] Create database function or query logic: `is_due_soon = (due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL 'N days') AND status = 'pending'`
  - [ ] Update RLS policies to ensure proper filtering
  - [ ] Add agencies settings API route: PATCH /api/agencies/[id]/settings for threshold configuration

- [ ] Task 2: Update UI to display "due soon" badges (AC: 2, 3, 4)
  - [ ] Add "due soon" badge component with yellow/amber color coding
  - [ ] Update payment plan list UI to show "due soon" status
  - [ ] Update payment plan detail UI to show "due soon" for individual installments
  - [ ] Add dashboard widget showing count of "due soon" installments
  - [ ] Implement filter for payment plans list to show only "due soon" plans
  - [ ] Ensure consistent color coding: yellow/amber for "due soon", red for "overdue"

- [ ] Task 3: Create student notification system (AC: 6, 7, 8)
  - [ ] Create student_notifications table: id, student_id, installment_id, notification_type, sent_at, delivery_status
  - [ ] Implement scheduled job to run daily at 5:00 AM Brisbane time (7:00 PM UTC previous day)
  - [ ] Query installments due in 36 hours (due_date = CURRENT_DATE + 1 day, accounting for 5 PM cutoff)
  - [ ] Integrate with Resend API for email sending
  - [ ] Create email template with student name, amount due, due date, payment instructions
  - [ ] Log all notifications sent to student_notifications table
  - [ ] Add students.contact_preference field (email, sms, both) for delivery method
  - [ ] Add students.phone_number field for SMS delivery (if contact_preference includes SMS)
  - [ ] Handle notification errors gracefully (log and retry logic)

- [ ] Task 4: Testing and validation
  - [ ] Unit tests for is_due_soon calculation logic
  - [ ] Integration tests for notification sending job
  - [ ] Test with different due_soon_threshold_days values (2, 4, 7 days)
  - [ ] Test notification timing (ensure 5:00 AM Brisbane / 7:00 PM UTC execution)
  - [ ] Test with various timezone scenarios
  - [ ] Verify badge colors and dashboard counts update correctly

## Dev Notes

### Architecture Context

This story implements the "due soon" detection layer on top of the automated status detection system (Story 5.1). The key innovation is proactive flagging BEFORE payments become overdue, enabling agencies to take preventive action.

**Pattern: Configurable Threshold Detection**
- Uses agency-level configuration (`due_soon_threshold_days`) for flexibility
- Default 4-day window includes weekend/early-week payments
- Agencies can adjust based on their collection cycles

**Pattern: Time-Based Notification Scheduling**
- 36-hour advance notice calculated as: `due_date - 1 day` at `5:00 AM Brisbane time`
- Scheduled job uses UTC (7:00 PM UTC = 5:00 AM Brisbane next day)
- Notification timing designed for maximum visibility (early morning email)

### Key Technical Decisions

1. **"Due Soon" as Computed Field vs Status:**
   - Decision: Use computed query logic, NOT a distinct status enum
   - Rationale: `is_due_soon` is a temporary flag, not a persistent state
   - Installments remain in "pending" status until overdue or paid
   - Query-time calculation: `due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL 'N days'`

2. **Student Notification System:**
   - Uses separate `student_notifications` table for tracking
   - Prevents duplicate sends via unique constraint on (installment_id, notification_type)
   - Integrates with Resend API (established in Epic 5 technical stack)
   - Email template references: `emails/payment-reminder.tsx`

3. **Timezone Handling:**
   - Brisbane timezone (Australia/Brisbane) used for scheduling
   - UTC stored in database, converted for display
   - Scheduled job: pg_cron at `0 19 * * *` (7 PM UTC = 5 AM Brisbane)

### Project Structure Alignment

**Database Schema (Supabase):**
```sql
-- Add to agencies table (supabase/migrations/001_agency_domain/)
ALTER TABLE agencies ADD COLUMN due_soon_threshold_days INT DEFAULT 4;

-- Add to students table (supabase/migrations/002_entities_domain/)
ALTER TABLE students ADD COLUMN contact_preference TEXT CHECK (contact_preference IN ('email', 'sms', 'both')) DEFAULT 'email';
ALTER TABLE students ADD COLUMN phone_number TEXT;

-- Create student_notifications table (supabase/migrations/004_notifications_domain/)
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
```

**Supabase Edge Function:**
```
supabase/functions/notifications/send-due-soon-notifications/
├── index.ts          # Main notification logic
└── deno.json         # Deno configuration
```

**Frontend Components:**
```
apps/dashboard/app/components/
├── DueSoonWidget.tsx      # Dashboard widget showing count
└── DueSoonBadge.tsx       # Reusable badge component

apps/payments/app/plans/components/
└── InstallmentStatusBadge.tsx  # Updated to show "due soon"
```

**Shared Utilities:**
```
packages/utils/src/
├── date-helpers.ts        # isDueSoon() helper function
└── notification-helpers.ts # Email/SMS sending utilities
```

### Testing Considerations

**Critical Test Cases:**
1. **Threshold Boundary Testing:**
   - Installment due in 3 days (within 4-day threshold) → should flag as due soon
   - Installment due in 5 days (outside 4-day threshold) → should NOT flag
   - Installment due tomorrow → should flag AND trigger notification

2. **Notification Timing:**
   - Job runs at 7:00 PM UTC → queries installments due 36 hours ahead
   - Installment due tomorrow at 5:00 PM Brisbane → email sent today at 5:00 AM
   - Test with various due_date values to ensure correct calculation

3. **Status Interactions:**
   - Only "pending" installments flagged as due soon (not "overdue" or "paid")
   - Installment transitions from "pending" → "overdue" after 5 PM on due date (Story 5.1)
   - "Due soon" flag disappears once installment becomes "overdue"

4. **Edge Cases:**
   - Multiple installments due for same student → separate notifications
   - Installment paid before notification sent → skip notification
   - Email delivery failure → log error, retry logic

### Dependencies & Prerequisites

**Required from Story 5.1:**
- Installment status enum includes "pending" and "overdue"
- Automated status detection job running (hourly via pg_cron)
- Agencies table with timezone field

**External Dependencies:**
- Resend API integration (Epic 5 notification infrastructure)
- React Email templates setup
- Supabase Edge Functions configured

**Migration Order:**
1. Add agencies.due_soon_threshold_days field
2. Add student notification fields (contact_preference, phone_number)
3. Create student_notifications table
4. Deploy Edge Function for notification sending
5. Schedule pg_cron job for daily execution

### Previous Story Context

**From Story 5.1 (Status: drafted):**
Story 5.1 establishes the foundation for automated status detection, implementing the scheduled job that transitions installment statuses based on date thresholds. Story 5.2 builds on this by adding a proactive "due soon" layer that flags payments BEFORE they become overdue.

Key integration points:
- Both stories use the same `installment_status` enum
- Both rely on `agencies.timezone` for correct date calculations
- Story 5.2's "due soon" logic complements Story 5.1's "overdue" detection
- Shared pattern: scheduled jobs via pg_cron + Supabase Edge Functions

### References

- [Source: docs/epics.md#Story-5.2]
- [Source: docs/architecture.md#Pattern-3-Automated-Status-State-Machine]
- [Source: docs/architecture.md#Pattern-1-Multi-Stakeholder-Notification-System]
- [Source: docs/PRD.md#MVP-Features-Automated-Payment-Status-Tracking]

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
