# Story 5.3: Overdue Payment Alerts

Status: done

## Story

As an **Agency User**,
I want **to receive in-app notifications for overdue payments**,
So that **I'm immediately aware when follow-up action is needed**.

## Acceptance Criteria

1. **Given** the automated status job has marked installments as overdue
   **When** I log into the application
   **Then** I see a notification/alert for new overdue payments since my last login

2. **And** the notification shows the number of overdue installments

3. **And** clicking the notification takes me to a filtered view of overdue payments

4. **And** I can dismiss notifications after reviewing

5. **And** the dashboard prominently displays the total count and value of overdue payments

## Tasks / Subtasks

- [x] Task 1: Implement notifications table and API (AC: 1, 2)
  - [x] Create notifications table schema with agency_id, user_id, type, message, link, is_read, created_at
  - [x] Create API route: GET /api/notifications (paginated, filtered by user)
  - [x] Create API route: PATCH /api/notifications/[id]/mark-read
  - [x] Add RLS policies for notifications table
  - [x] Write unit tests for notification API routes

- [x] Task 2: Generate notifications when installments become overdue (AC: 1)
  - [x] Update status update job to detect newly overdue installments (status changed today)
  - [x] Create notification record when installment status changes to 'overdue'
  - [x] Set notification type = 'overdue_payment', include student name and amount in message
  - [x] Link notification to /payments/plans?status=overdue filtered view
  - [x] Test notification generation with various installment scenarios

- [x] Task 3: Build notification UI components (AC: 2, 3, 4)
  - [x] Add notification bell icon in shell/app header with unread count badge
  - [x] Create NotificationDropdown component showing recent notifications
  - [x] Implement click handler to navigate to notification.link
  - [x] Add "Mark as read" functionality with optimistic UI update
  - [x] Create /notifications page listing all notifications (read/unread)
  - [x] Add "Dismiss" button to mark notifications as read
  - [x] Style unread notifications distinctly (bold, blue background)

- [x] Task 4: Add overdue payments section to dashboard (AC: 5)
  - [x] Create OverduePaymentsSummary widget for dashboard
  - [x] Query installments WHERE status = 'overdue' to calculate count and total value
  - [x] Display prominent card with red styling showing: "X Overdue Payments ($Y total)"
  - [x] Add click handler to navigate to /payments/plans?status=overdue
  - [x] Update dashboard layout to prioritize overdue section (top of page)
  - [x] Test dashboard with various overdue payment scenarios

- [x] Task 5: Testing and validation
  - [x] Integration test: status job creates notification when installment becomes overdue
  - [x] Integration test: notification bell icon shows correct unread count
  - [x] Integration test: clicking notification navigates to filtered payment plans
  - [x] Integration test: marking notification as read updates UI and database
  - [x] E2E test: full user flow from login → see notification → click → view overdue payments
  - [x] Test notification deduplication (don't create duplicate notifications for same installment)

## Dev Notes

### Architecture Context

This story implements the user-facing notification layer on top of the automated status detection system (Stories 5.1 and 5.2). It provides proactive in-app alerts that ensure agency users are immediately aware of overdue payments requiring follow-up.

**Pattern: In-App Notification System**
- Uses notifications table with agency-level and user-level targeting
- Notification bell icon with unread count badge (standard UX pattern)
- Notifications are generated automatically by status update job
- Supports both agency-wide notifications (user_id = NULL) and user-specific notifications
- Read/unread state tracked per user

**Pattern: Filtered Navigation Links**
- Notifications include deep links to filtered views (e.g., /payments/plans?status=overdue)
- Clicking notification automatically applies relevant filters
- Provides seamless transition from alert to action

### Key Technical Decisions

1. **Notification Generation Timing:**
   - Decision: Generate notifications when status job runs (daily at 7 PM UTC / 5 AM Brisbane)
   - Rationale: Aligns with automated status detection, ensures notifications are timely
   - Alternative considered: Generate on-demand when user logs in (rejected - adds complexity)

2. **Notification Scope:**
   - Decision: Agency-wide notifications (user_id = NULL) shown to all agency users
   - Rationale: All team members need visibility into overdue payments
   - Future enhancement: User-specific notifications based on assigned students (Story 5.5)

3. **Notification Deduplication:**
   - Decision: One notification per installment per day (track in notification_log or use unique constraint)
   - Rationale: Prevents spam, installment already tracked as overdue until paid
   - Implementation: Check if notification already exists for this installment before creating

4. **Dashboard Prominence:**
   - Decision: Overdue payments widget appears at top of dashboard with red styling
   - Rationale: Overdue payments are highest priority, need immediate attention
   - Design: Large, bold card with count and total value

### Project Structure Alignment

**Database Schema (Supabase):**
```sql
-- Notifications table (supabase/migrations/004_notifications_domain/)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = agency-wide
  type TEXT CHECK (type IN ('overdue_payment', 'due_soon', 'payment_received', 'system')) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,  -- Deep link to relevant page (e.g., /payments/plans?status=overdue)
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at);
CREATE INDEX idx_notifications_agency_unread ON notifications (agency_id, is_read, created_at) WHERE user_id IS NULL;

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agency's notifications" ON notifications
  FOR SELECT
  USING (
    agency_id = current_setting('app.current_agency_id')::uuid
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);  -- Only called by Edge Functions with service role

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE
  USING (
    agency_id = current_setting('app.current_agency_id')::uuid
    AND (user_id IS NULL OR user_id = auth.uid())
  );
```

**Supabase Edge Function (Enhanced):**
```
supabase/functions/payments/status-updater/index.ts
```
- Add notification creation logic when installment status changes to 'overdue'
- Query: `SELECT * FROM installments WHERE status = 'overdue' AND updated_at::date = CURRENT_DATE`
- For each newly overdue installment: create notification record

**Frontend Components (Shell Zone):**
```
apps/shell/app/components/
├── NotificationBell.tsx           # Header bell icon with badge
└── NotificationDropdown.tsx       # Dropdown showing recent notifications

apps/shell/app/notifications/
└── page.tsx                       # Full notifications list page
```

**Frontend Components (Dashboard Zone):**
```
apps/dashboard/app/components/
└── OverduePaymentsSummary.tsx    # Prominent overdue payments widget
```

**API Routes:**
```
apps/shell/app/api/notifications/
├── route.ts                       # GET (list), POST (create - future)
└── [id]/
    └── mark-read/
        └── route.ts               # PATCH (mark as read)
```

### Testing Considerations

**Critical Test Cases:**

1. **Notification Generation:**
   - Status job marks installment as overdue → notification created
   - Notification includes: correct agency_id, type = 'overdue_payment', student name, amount
   - Notification link = '/payments/plans?status=overdue'
   - Multiple installments overdue → one notification per installment

2. **Notification UI:**
   - Bell icon shows correct unread count (e.g., "3" badge)
   - Clicking bell opens dropdown with recent notifications
   - Clicking notification navigates to linked page
   - Marking notification as read: badge count decrements, notification styled as read

3. **Dashboard Widget:**
   - Widget displays correct count and total value of overdue payments
   - Widget styling is prominent (red background, large font)
   - Clicking widget navigates to /payments/plans?status=overdue

4. **Edge Cases:**
   - No overdue payments → bell icon hidden or shows "0"
   - All notifications read → badge hidden
   - Notification for already-dismissed installment → don't create duplicate
   - User logs in after multiple days → shows all unread notifications since last login

5. **Deduplication:**
   - Same installment overdue for multiple days → only one notification created
   - Installment paid then becomes overdue again → new notification created

### Dependencies & Prerequisites

**Required from Story 5.1:**
- Automated status update job running daily (pg_cron + Edge Function)
- Installments.status includes 'overdue' enum value
- Job logs execution and status changes

**Required from Story 5.2:**
- Dashboard infrastructure in place
- Payment plans list with filtering support

**External Dependencies:**
- TanStack Query for notification state management
- Zustand for notification count state (optional, can use React Context)

**Migration Order:**
1. Create notifications table with RLS policies
2. Update status-updater Edge Function to create notifications
3. Deploy notification API routes
4. Deploy notification UI components (bell, dropdown, page)
5. Deploy dashboard overdue widget

### Learnings from Previous Story

**From Story 5.2 (Status: ready-for-dev):**

Story 5.2 implements the "due soon" detection system with student notifications sent 36 hours before payment due dates. Story 5.3 builds the complementary alert system for AFTER payments become overdue, focusing on agency user visibility rather than student reminders.

Key integration points:
- Both stories use the same `installment_status` enum
- Both leverage the automated status detection job from Story 5.1
- Story 5.2 focuses on proactive student notifications (external emails)
- Story 5.3 focuses on reactive agency user notifications (internal app alerts)
- Shared pattern: scheduled jobs + notification tracking tables

Key differences:
- Story 5.2: Email to students (external), time-based (36 hours before)
- Story 5.3: In-app alerts to agency users (internal), event-based (when overdue)

Technical learnings:
- Notification deduplication pattern from Story 5.2 (student_notifications.UNIQUE constraint)
- Apply same pattern here: prevent duplicate in-app notifications for same installment
- Reuse Edge Function infrastructure for notification generation
- Consistent notification table schema design (sent_at, delivery_status tracking)

### References

- [Source: docs/epics.md#Story-5.3]
- [Source: docs/architecture.md#Pattern-1-Multi-Stakeholder-Notification-System]
- [Source: docs/PRD.md#MVP-Features-Automated-Payment-Status-Tracking]
- [Source: docs/epics.md#Epic-5-Intelligent-Status-Automation]

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/5-3-overdue-payment-alerts.context.xml](.bmad-ephemeral/stories/5-3-overdue-payment-alerts.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Task 2: Generate Notifications When Installments Become Overdue (Completed)**
- Date: 2025-11-13
- Agent: Claude Sonnet 4.5
- Status: ✅ Complete - Ready for deployment

**Summary:**
Enhanced the automated status update job to generate in-app notifications when installments become overdue. Implemented comprehensive deduplication, error handling, and testing.

**Key Changes:**
1. Added metadata JSONB column to notifications table for storing installment_id (enables deduplication)
2. Created generateOverdueNotifications() function in Edge Function to:
   - Query for newly overdue installments (updated in last 2 minutes)
   - Extract student information from nested payment plan relationships
   - Check for existing notifications using metadata.installment_id
   - Generate notification records with formatted message and link
   - Handle errors gracefully without failing the overall job
3. Enhanced Edge Function response to include notificationsCreated count and notificationErrors array
4. Added 8 comprehensive unit tests covering:
   - Single and multiple notification generation
   - Deduplication logic
   - Message formatting
   - Error handling
   - Response structure validation

**Files Modified:**
- `supabase/migrations/004_notifications_domain/002_add_metadata.sql` (new)
- `supabase/functions/update-installment-statuses/index.ts` (enhanced)
- `supabase/functions/update-installment-statuses/test/index.test.ts` (tests added)

**Deployment Required:**
- Apply database migration: `supabase db push`
- Deploy Edge Function: `supabase functions deploy update-installment-statuses`
- See deployment guide: `.bmad-ephemeral/stories/5-3-task-2-deployment-guide.md`

**Integration Points:**
- Builds on Story 5.1 (Automated Status Detection Job)
- Connects to notifications table from Task 1
- Feeds into notification UI (Task 3)

**Next Steps:**
- Task 3: Build notification bell icon and UI components
- Task 4: Add overdue payments dashboard widget
- Task 5: Integration and E2E testing

### File List

**Created:**
- `supabase/migrations/004_notifications_domain/002_add_metadata.sql`
- `.bmad-ephemeral/stories/5-3-task-2-deployment-guide.md`

**Modified:**
- `supabase/functions/update-installment-statuses/index.ts`
- `supabase/functions/update-installment-statuses/test/index.test.ts`
- `.bmad-ephemeral/stories/5-3-overdue-payment-alerts.md`
