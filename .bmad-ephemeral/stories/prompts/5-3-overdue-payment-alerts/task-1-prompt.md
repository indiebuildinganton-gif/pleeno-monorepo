# Task 1: Implement Notifications Table and API

## Context
You are implementing Story 5.3: Overdue Payment Alerts - Task 1 of 5.

This task creates the foundational infrastructure for in-app notifications by setting up the database schema, RLS policies, and API routes. This will enable agency users to receive alerts when payments become overdue.

## Story Overview
**As an** Agency User
**I want** to receive in-app notifications for overdue payments
**So that** I'm immediately aware when follow-up action is needed

## Acceptance Criteria for This Task
- AC 1: Given the automated status job has marked installments as overdue, When I log into the application, Then I see a notification/alert for new overdue payments since my last login
- AC 2: And the notification shows the number of overdue installments

## Your Task
Implement the notifications table schema and API routes:

### Subtasks:
1. Create notifications table schema with agency_id, user_id, type, message, link, is_read, created_at
2. Create API route: GET /api/notifications (paginated, filtered by user)
3. Create API route: PATCH /api/notifications/[id]/mark-read
4. Add RLS policies for notifications table
5. Write unit tests for notification API routes

## Technical Specifications

### Database Schema
Create migration file at: `supabase/migrations/004_notifications_domain/001_notifications_schema.sql`

```sql
-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = agency-wide
  type TEXT CHECK (type IN ('overdue_payment', 'due_soon', 'payment_received', 'system')) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,  -- Deep link to relevant page
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

### API Routes

#### GET /api/notifications
File: `apps/shell/app/api/notifications/route.ts`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `is_read` (optional, filter by read status)

**Response:**
```typescript
{
  data: Notification[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

**Implementation Notes:**
- Fetch notifications for current user's agency
- Apply RLS automatically via Supabase client
- Include both agency-wide (user_id IS NULL) and user-specific notifications
- Order by created_at DESC
- Use TanStack Query for caching on frontend

#### PATCH /api/notifications/[id]/mark-read
File: `apps/shell/app/api/notifications/[id]/mark-read/route.ts`

**Request Body:** None (or empty JSON)

**Response:**
```typescript
{
  success: boolean,
  notification: Notification
}
```

**Implementation Notes:**
- Update notification: `is_read = true`, `read_at = now()`
- Verify user has permission (RLS will enforce)
- Return updated notification
- Support optimistic UI updates via TanStack Query

### TypeScript Types
Create shared type definitions (suggest location: `packages/database/types.ts` or `apps/shell/types/notifications.ts`):

```typescript
export type NotificationType = 'overdue_payment' | 'due_soon' | 'payment_received' | 'system';

export interface Notification {
  id: string;
  agency_id: string;
  user_id: string | null;
  type: NotificationType;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface NotificationListResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## Testing Requirements

### Unit Tests
Location: `apps/shell/app/api/notifications/__tests__/`

**Test Cases:**
1. GET /api/notifications
   - Returns paginated notifications for user's agency
   - Filters by is_read status correctly
   - Includes both agency-wide and user-specific notifications
   - Excludes notifications from other agencies (RLS test)
   - Returns correct pagination metadata

2. PATCH /api/notifications/[id]/mark-read
   - Marks notification as read successfully
   - Sets read_at timestamp
   - Returns updated notification
   - Rejects requests for notifications from other agencies (RLS test)
   - Returns 404 for non-existent notification

### Integration Test Ideas
- Create notification in database → fetch via API → verify returned
- Mark notification as read → verify is_read=true and read_at set
- Agency A user cannot see Agency B notifications (RLS enforcement)

## Dependencies
- `@supabase/supabase-js` - Database client
- `@tanstack/react-query` (v5.90.7) - For frontend caching (future tasks)
- Existing RLS patterns from architecture docs

## Success Criteria
- [ ] Notifications table created with all required columns
- [ ] Indexes created for performance optimization
- [ ] RLS policies implemented and tested
- [ ] GET /api/notifications returns paginated results correctly
- [ ] PATCH /api/notifications/[id]/mark-read updates notification successfully
- [ ] Unit tests passing for all API routes
- [ ] RLS policies prevent cross-agency data access

## Context Files Reference
- Story Context: `.bmad-ephemeral/stories/5-3-overdue-payment-alerts.context.xml`
- Story File: `.bmad-ephemeral/stories/5-3-overdue-payment-alerts.md`
- Architecture: `docs/architecture.md` (Multi-Stakeholder Notification System pattern)
- Project Structure: Multi-zone Next.js monorepo (shell zone for notifications)

## Next Steps
After completing this task:
1. Proceed to Task 2: Generate notifications when installments become overdue
2. Update the MANIFEST.md file to mark Task 1 as complete

---

**Remember:** This is a greenfield implementation. There is no existing notification code to reference. Follow the architectural patterns from the context files and maintain consistency with the multi-zone monorepo structure.
