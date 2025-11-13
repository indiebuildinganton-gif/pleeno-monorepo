# Story 6.4: Recent Activity Feed

Status: ready-for-dev

## Story

As an **Agency User**,
I want **to see a feed of recent activity in the system**,
so that **I'm aware of what's happening and can stay in sync with my team**.

## Acceptance Criteria

1. **Given** I am viewing the dashboard
   **When** the page loads
   **Then** I see a chronological feed of recent activities such as:

2. **And** payments recorded

3. **And** new payment plans created

4. **And** new students added

5. **And** new enrollments added

6. **And** installments marked as overdue

7. **And** each activity shows: timestamp, action description, user who performed it (if applicable)

8. **And** the feed shows the most recent 20 activities

## Tasks / Subtasks

- [ ] **Task 1: Create Activity Log Database Schema** (AC: #1-8)
  - [ ] Create `activity_log` table with columns:
    - `id` (uuid, primary key)
    - `agency_id` (uuid, foreign key to agencies, not null)
    - `user_id` (uuid, foreign key to users, nullable - system actions have null user)
    - `entity_type` (varchar, not null): "payment", "payment_plan", "student", "enrollment", "installment"
    - `entity_id` (uuid, not null): ID of the affected entity
    - `action` (varchar, not null): "created", "recorded", "updated", "marked_overdue"
    - `description` (text, not null): Human-readable activity description
    - `metadata` (jsonb, nullable): Additional context (student name, amount, etc.)
    - `created_at` (timestamp, not null, default: now())
  - [ ] Add RLS policy: `CREATE POLICY activity_agency_isolation ON activity_log USING (agency_id = auth.uid())`
  - [ ] Create index: `CREATE INDEX idx_activity_log_agency_created ON activity_log(agency_id, created_at DESC)`
  - [ ] Create migration file: `supabase/migrations/YYYYMMDD_create_activity_log.sql`
  - [ ] Test: Verify RLS prevents cross-agency access

- [ ] **Task 2: Implement Activity Logging in Existing API Routes** (AC: #2-6)
  - [ ] Identify API routes that need logging:
    - Payment recording: `POST /api/payments/[id]/record`
    - Payment plan creation: `POST /api/payment-plans`
    - Student creation: `POST /api/students`
    - Enrollment creation: `POST /api/enrollments`
    - Installment overdue marking: Background job in status detection
  - [ ] Create utility function in `packages/database/src/activity-logger.ts`:
    - `logActivity(agency_id, user_id, entity_type, entity_id, action, description, metadata)`
    - Function inserts activity_log record with current timestamp
    - Function handles null user_id for system actions
  - [ ] Add activity logging to each identified route:
    - Payment recorded: "{{user}} recorded payment of {{amount}} for {{student_name}}"
    - Payment plan created: "{{user}} created payment plan for {{student_name}} at {{college_name}}"
    - Student added: "{{user}} added new student {{student_name}}"
    - Enrollment added: "{{user}} enrolled {{student_name}} at {{college_name}}"
    - Installment overdue: "System marked installment {{amount}} as overdue for {{student_name}}"
  - [ ] Store metadata: student_name, college_name, amount, etc. for display
  - [ ] Test: Verify activities are logged with correct descriptions

- [ ] **Task 3: Create Activity Feed API Route** (AC: #1, 7-8)
  - [ ] Create API route: `GET /api/activity-log?limit=20`
  - [ ] Query `activity_log` table:
    - Filter by `agency_id` (auto-applied via RLS)
    - Join with `users` table to get user name (LEFT JOIN, nullable)
    - Order by `created_at DESC`
    - Limit to 20 most recent activities
  - [ ] Return formatted response:
    ```typescript
    interface Activity {
      id: string
      timestamp: string
      action: string
      description: string
      user: { id: string; name: string } | null
      entity_type: string
      entity_id: string
      metadata: Record<string, any>
    }
    ```
  - [ ] Apply 1-minute cache for performance (frequent dashboard access)
  - [ ] Test: Verify only current agency's activities returned

- [ ] **Task 4: Create ActivityFeed Component** (AC: #1, 7-8)
  - [ ] Create React component: `apps/dashboard/app/components/ActivityFeed.tsx`
  - [ ] Use TanStack Query to fetch activities from `/api/activity-log?limit=20`
  - [ ] Display activities in chronological list:
    - Show relative timestamp: "2 hours ago", "yesterday" (use date-fns `formatDistanceToNow`)
    - Show action description
    - Show user name (or "System" if user is null)
    - Use appropriate icon per entity_type: 💰 payment, 📋 plan, 👤 student, 🏫 enrollment, ⚠️ overdue
  - [ ] Style with card layout:
    - Each activity as card with icon, description, user, timestamp
    - Hover effect for better UX
  - [ ] Add "View More" button at bottom (links to full activity log page - future story)
  - [ ] Responsive layout (stacks on mobile, grid on desktop)

- [ ] **Task 5: Implement Auto-Refresh for Real-Time Feel** (AC: #1)
  - [ ] Configure TanStack Query with auto-refetch:
    - `refetchInterval: 60000` (60 seconds)
    - `refetchOnWindowFocus: true`
  - [ ] Add visual indicator when new activities arrive:
    - Show subtle "New Activity" badge when fresh data arrives
    - Smooth transition animation when new items appear
  - [ ] Consider WebSocket for true real-time (future enhancement):
    - Document in Dev Notes as potential improvement
    - Current polling approach sufficient for MVP

- [ ] **Task 6: Make Activities Clickable** (AC: #1)
  - [ ] Make each activity card clickable:
    - Payment recorded → Navigate to `/payments/plans/[plan_id]`
    - Payment plan created → Navigate to `/payments/plans/[plan_id]`
    - Student added → Navigate to `/entities/students/[student_id]`
    - Enrollment added → Navigate to `/entities/students/[student_id]?tab=enrollments`
    - Installment overdue → Navigate to `/payments/plans/[plan_id]`
  - [ ] Use Next.js Link component for navigation
  - [ ] Add hover state to indicate clickability
  - [ ] Add tooltip: "Click to view details"

- [ ] **Task 7: Integrate into Dashboard Page** (AC: #1)
  - [ ] Import ActivityFeed component into `apps/dashboard/app/page.tsx`
  - [ ] Position in sidebar or dedicated section:
    - Option A: Right sidebar (desktop), below charts (mobile)
    - Option B: Bottom section below all widgets
  - [ ] Add section heading: "Recent Activity"
  - [ ] Ensure consistent styling with other dashboard widgets
  - [ ] Verify widget displays correctly on desktop, tablet, and mobile

- [ ] **Task 8: Testing** (AC: All)
  - [ ] Write API route unit tests:
    - Test activity log query returns most recent 20 activities
    - Test activities ordered by created_at DESC
    - Test RLS filtering by agency_id
    - Test user name join (handle null users)
    - Test limit parameter
  - [ ] Write activity logger utility tests:
    - Test logActivity creates activity_log record
    - Test description formatting with metadata
    - Test null user_id handling (system actions)
  - [ ] Write component tests using React Testing Library:
    - Test ActivityFeed renders with mock data
    - Test relative timestamps display correctly
    - Test icons display per entity_type
    - Test clickable activities navigate correctly
    - Test loading state (skeleton)
    - Test error state with retry
    - Test empty state (no activities)
  - [ ] Write integration test:
    - Dashboard loads → Activity feed displays
    - Perform action (record payment) → New activity appears in feed
    - Click activity → Navigate to detail page
  - [ ] Test auto-refresh:
    - Wait 60 seconds → Feed refetches automatically
    - Switch tabs → Feed refetches on return

## Dev Notes

### Architecture Context

**Dashboard Zone:**
- Component lives in `apps/dashboard/app/components/ActivityFeed.tsx`
- API route at `apps/dashboard/app/api/activity-log/route.ts`
- Uses TanStack Query for data fetching with auto-refresh

**Database Schema:**
- New table: `activity_log` (see Task 1 for schema)
- RLS policy enforces agency-level isolation
- Index on `agency_id, created_at DESC` for fast queries

**Activity Logging Pattern:**
- Centralized utility: `packages/database/src/activity-logger.ts`
- Called from existing API routes after successful operations
- Stores metadata (JSON) for rich display context

### Learnings from Previous Story

**From Story 6.3 (Status: ready-for-dev)**

Story 6.3 established the commission breakdown table with TanStack Table, sortable columns, and drill-down links. This story follows similar dashboard widget patterns.

**Key Points for Implementation:**
- Dashboard zone structure and patterns established
- TanStack Query caching configured with appropriate stale times
- Currency formatting utility available in `packages/utils/src/formatters.ts`
- RLS policies auto-filter by agency_id
- Component styling follows Shadcn UI patterns

**Patterns to Reuse:**
- API route structure: Same pattern as `/api/dashboard/commission-by-college`
- Component structure: Follow CommissionBreakdownTable widget pattern
- TanStack Query setup: Similar caching strategy (1-minute for frequent access)
- Loading/error states: Use same skeleton and error UI patterns
- Responsive layout: Follow dashboard grid patterns

**New Patterns Introduced in This Story:**
- **Activity Logging**: New cross-cutting concern affecting multiple zones
- **Auto-Refresh**: Polling pattern for near real-time updates
- **Event-Based Descriptions**: Human-readable activity descriptions with metadata
- **System vs User Actions**: Nullable user_id for automated system actions
- **Relative Timestamps**: "2 hours ago" format using date-fns

### Project Structure Notes

**Component Organization:**
```
apps/dashboard/
├── app/
│   ├── page.tsx                              # Import ActivityFeed
│   ├── api/
│   │   └── activity-log/
│   │       └── route.ts                      # Activity feed API
│   └── components/
│       ├── ActivityFeed.tsx                  # Main feed component
│       └── ActivityCard.tsx                  # Single activity card (optional)
```

**Shared Utilities:**
- Activity logger: `packages/database/src/activity-logger.ts`
  - `logActivity(agency_id, user_id, entity_type, entity_id, action, description, metadata)` - Insert activity record
  - Export types: `ActivityEntityType`, `ActivityAction`
- Date formatting: `packages/utils/src/formatters.ts`
  - Use existing `formatRelativeTime(date)` or add if missing (uses date-fns `formatDistanceToNow`)

**Migration Files:**
- Database migration: `supabase/migrations/YYYYMMDD_create_activity_log.sql`
- Include table creation, RLS policy, and index

### Activity Logging Integration Points

**API Routes to Modify (Add Activity Logging):**

1. **Payment Recording**: `apps/payments/app/api/payments/[id]/record/route.ts`
   ```typescript
   await logActivity(
     agency_id,
     user_id,
     'payment',
     payment_plan_id,
     'recorded',
     `${user_name} recorded payment of ${formatCurrency(amount)} for ${student_name}`,
     { student_name, amount, payment_plan_id }
   )
   ```

2. **Payment Plan Creation**: `apps/payments/app/api/payment-plans/route.ts`
   ```typescript
   await logActivity(
     agency_id,
     user_id,
     'payment_plan',
     plan_id,
     'created',
     `${user_name} created payment plan for ${student_name} at ${college_name}`,
     { student_name, college_name, plan_id }
   )
   ```

3. **Student Creation**: `apps/entities/app/api/students/route.ts`
   ```typescript
   await logActivity(
     agency_id,
     user_id,
     'student',
     student_id,
     'created',
     `${user_name} added new student ${student_name}`,
     { student_name, student_id }
   )
   ```

4. **Enrollment Creation**: `apps/entities/app/api/enrollments/route.ts`
   ```typescript
   await logActivity(
     agency_id,
     user_id,
     'enrollment',
     enrollment_id,
     'created',
     `${user_name} enrolled ${student_name} at ${college_name}`,
     { student_name, college_name, enrollment_id }
   )
   ```

5. **Installment Overdue (System Action)**: Background job or status detection function
   ```typescript
   await logActivity(
     agency_id,
     null, // System action, no user
     'installment',
     installment_id,
     'marked_overdue',
     `System marked installment ${formatCurrency(amount)} as overdue for ${student_name}`,
     { student_name, amount, installment_id, payment_plan_id }
   )
   ```

### Database Query Logic

**Activity Log Query:**

```sql
-- Fetch recent activities with user information
SELECT
  activity_log.id,
  activity_log.entity_type,
  activity_log.entity_id,
  activity_log.action,
  activity_log.description,
  activity_log.metadata,
  activity_log.created_at,
  users.id AS user_id,
  users.name AS user_name,
  users.email AS user_email
FROM activity_log
LEFT JOIN users ON activity_log.user_id = users.id
WHERE activity_log.agency_id = auth.uid()  -- RLS auto-applied
ORDER BY activity_log.created_at DESC
LIMIT 20;
```

**TypeScript Type Definitions:**

```typescript
// packages/database/src/types/activity.ts

export type ActivityEntityType = 'payment' | 'payment_plan' | 'student' | 'enrollment' | 'installment'
export type ActivityAction = 'created' | 'recorded' | 'updated' | 'marked_overdue'

export interface ActivityLog {
  id: string
  agency_id: string
  user_id: string | null
  entity_type: ActivityEntityType
  entity_id: string
  action: ActivityAction
  description: string
  metadata: Record<string, any>
  created_at: string
}

export interface ActivityWithUser extends ActivityLog {
  user: {
    id: string
    name: string
    email: string
  } | null
}
```

### Performance Optimization

**Caching Strategy:**
- API route: 1-minute cache (Next.js `revalidate` or Vercel Edge caching)
- TanStack Query: 1-minute stale time, auto-refresh every 60 seconds
- Consider longer cache for historical activities (only latest 20 change frequently)

**Database Indexes:**
```sql
-- Add index for fast activity log queries
CREATE INDEX idx_activity_log_agency_created ON activity_log(agency_id, created_at DESC);

-- Consider partial index for recent activities (last 30 days)
CREATE INDEX idx_activity_log_recent ON activity_log(agency_id, created_at DESC)
WHERE created_at > NOW() - INTERVAL '30 days';
```

**Query Optimization:**
- Limit to 20 activities (pagination for "View More" in future story)
- Use LEFT JOIN for user (handles null user_id)
- Avoid N+1 queries by joining users in single query

### TanStack Query Configuration

**Query Setup:**

```typescript
const { data: activities, isLoading, error } = useQuery({
  queryKey: ['activities', agency_id],
  queryFn: async () => {
    const res = await fetch('/api/activity-log?limit=20')
    if (!res.ok) throw new Error('Failed to fetch activities')
    return res.json()
  },
  staleTime: 60000, // 1 minute
  refetchInterval: 60000, // Auto-refresh every 60 seconds
  refetchOnWindowFocus: true, // Refetch when user returns to tab
})
```

### ActivityFeed Component Structure

**Component Architecture:**

```typescript
// apps/dashboard/app/components/ActivityFeed.tsx

export function ActivityFeed() {
  const { data: activities, isLoading, error } = useActivities()

  if (isLoading) return <ActivityFeedSkeleton />
  if (error) return <ActivityFeedError onRetry={() => refetch()} />
  if (!activities || activities.length === 0) return <ActivityFeedEmpty />

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Recent Activity</h2>
      <div className="space-y-2">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
      <Button variant="outline" size="sm">View More</Button>
    </div>
  )
}
```

**ActivityCard Component:**

```typescript
function ActivityCard({ activity }: { activity: ActivityWithUser }) {
  const icon = getActivityIcon(activity.entity_type)
  const relativeTime = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
  const userName = activity.user?.name || 'System'

  return (
    <Link
      href={getActivityLink(activity)}
      className="block p-3 rounded-lg border hover:bg-muted transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{activity.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {userName} · {relativeTime}
          </p>
        </div>
      </div>
    </Link>
  )
}
```

**Icon Mapping:**

```typescript
function getActivityIcon(entity_type: ActivityEntityType): string {
  const icons: Record<ActivityEntityType, string> = {
    payment: '💰',
    payment_plan: '📋',
    student: '👤',
    enrollment: '🏫',
    installment: '⚠️',
  }
  return icons[entity_type] || '📝'
}
```

**Link Mapping:**

```typescript
function getActivityLink(activity: ActivityWithUser): string {
  const { entity_type, entity_id, metadata } = activity

  switch (entity_type) {
    case 'payment':
    case 'installment':
      return `/payments/plans/${metadata.payment_plan_id}`
    case 'payment_plan':
      return `/payments/plans/${entity_id}`
    case 'student':
      return `/entities/students/${entity_id}`
    case 'enrollment':
      return `/entities/students/${metadata.student_id}?tab=enrollments`
    default:
      return '/dashboard'
  }
}
```

### Testing Standards

**API Route Tests (Vitest):**
- Mock Supabase client queries
- Test activity log query:
  - Verify query returns most recent 20 activities
  - Verify activities ordered by created_at DESC
  - Verify RLS filtering by agency_id
  - Verify user name join (handle null users)
- Test limit parameter
- Test caching headers

**Activity Logger Tests:**
- Test logActivity creates activity_log record
- Test description formatting with metadata
- Test null user_id handling (system actions)
- Test error handling (database failures)

**Component Tests (React Testing Library):**
- Test ActivityFeed renders with mock data
- Test relative timestamps display correctly ("2 hours ago", "yesterday")
- Test icons display per entity_type
- Test clickable activities navigate correctly
- Test loading state (skeleton UI)
- Test error state with retry button
- Test empty state (no activities message)

**Integration Tests (Playwright):**
- E2E flow: Login → Dashboard → Activity feed visible
- E2E flow: Perform action (record payment) → New activity appears in feed
- E2E flow: Click activity → Navigate to detail page
- Test auto-refresh: Wait 60 seconds → Feed refetches automatically

### Security Considerations

**Row-Level Security:**
- All activity_log queries MUST respect RLS policies (agency_id filtering automatic)
- Use server-side Supabase client (not anon key) in API routes
- JWT auth middleware protects dashboard routes

**Data Privacy:**
- Activity logs only show current user's agency data
- No cross-agency data leakage possible (enforced by RLS)
- User names only visible to users in same agency

**Sensitive Information:**
- Avoid logging sensitive data in description or metadata (passwords, tokens, etc.)
- Store minimal metadata needed for display
- Consider data retention policy (auto-delete old activities after X months)

### User Experience Enhancements

**Empty State:**
- If no activities available:
  - Display message: "No recent activity"
  - Show illustration (empty state icon)
  - Add helpful text: "Activity will appear here as your team works"

**Loading State:**
- Skeleton loader with card shapes (3-4 placeholder cards)
- Smooth transition from skeleton to actual feed

**Error State:**
- Clear error message: "Unable to load recent activity"
- Retry button
- Support contact link

**Visual Indicators:**
- Subtle animation when new activities arrive
- "New Activity" badge when fresh data loads
- Smooth scroll animation when new items appear at top

**Future Enhancements (Document for Later Stories):**
- **Full Activity Log Page**: Dedicated page at `/activity-log` with pagination and filters
- **WebSocket Integration**: True real-time updates using Supabase Realtime subscriptions
- **Activity Filters**: Filter by entity_type, user, date range
- **Activity Search**: Search activities by description or entity name
- **Export to CSV**: Export activity log for auditing

### References

- [Source: docs/epics.md#Story 6.4] - Story acceptance criteria and technical notes
- [Source: docs/architecture.md#Dashboard Zone] - Dashboard component architecture
- [Source: docs/architecture.md#Multi-Tenant Isolation] - RLS policy patterns
- [Source: docs/architecture.md#State Management] - TanStack Query configuration
- [Source: .bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md] - Previous story patterns (dashboard widgets, TanStack Query, responsive layout)

## Dev Agent Record

### Context Reference

- .bmad-ephemeral/stories/6-4-recent-activity-feed.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
