# Story 6.4 Execution Manifest

**Story:** Recent Activity Feed

**Epic:** 6 - Business Intelligence Dashboard

**Status:** drafted

**Generated:** 2025-11-13

---

## Task Execution Checklist

Use this manifest to track your progress as you execute each task sequentially in Claude Code Web.

### Database Setup

- [ ] **Task 1:** Create Activity Log Database Schema
  - File: `task-1-database-schema.md`
  - Deliverables:
    - `supabase/migrations/YYYYMMDD_create_activity_log.sql`
  - Status: Not started

### Backend Implementation

- [ ] **Task 2:** Implement Activity Logging in Existing API Routes
  - File: `task-2-activity-logging.md`
  - Deliverables:
    - `packages/database/src/activity-logger.ts`
    - Modified API routes in payments, entities zones
  - Status: Not started

- [ ] **Task 3:** Create Activity Feed API Route
  - File: `task-3-activity-feed-api.md`
  - Route: `GET /api/activity-log?limit=20`
  - Deliverable: `apps/dashboard/app/api/activity-log/route.ts`
  - Status: Not started

### Frontend Components

- [ ] **Task 4:** Create ActivityFeed Component
  - File: `task-4-activity-feed-component.md`
  - Deliverables:
    - `apps/dashboard/app/components/ActivityFeed.tsx`
    - `apps/dashboard/app/components/ActivityCard.tsx`
  - Status: Not started

- [ ] **Task 5:** Implement Auto-Refresh for Real-Time Feel
  - File: `task-5-auto-refresh.md`
  - Deliverable: Enhanced ActivityFeed with auto-refresh
  - Status: Not started

- [ ] **Task 6:** Make Activities Clickable
  - File: `task-6-clickable-activities.md`
  - Deliverable: Enhanced ActivityCard with navigation
  - Status: Not started

### Integration

- [ ] **Task 7:** Integrate into Dashboard Page
  - File: `task-7-dashboard-integration.md`
  - Deliverable: `apps/dashboard/app/page.tsx`
  - Status: Not started

### Testing

- [ ] **Task 8:** Testing
  - File: `task-8-testing.md`
  - Deliverables:
    - API route tests
    - Activity logger tests
    - Component tests
    - Integration tests
  - Status: Not started

---

## Execution Instructions

1. **Sequential Execution:** Execute tasks in order (1→8)
2. **Copy-Paste Prompts:** Copy the content of each task file and paste into Claude Code Web
3. **Mark Progress:** Check off tasks as you complete them
4. **Verify Before Next:** Test each task's deliverable before moving to the next
5. **Context File:** Reference `.bmad-ephemeral/stories/6-4-recent-activity-feed.md` for full story context

## Acceptance Criteria Summary

1. ✅ Dashboard displays chronological feed of recent activities
2. ✅ Payments recorded shown in feed
3. ✅ New payment plans created shown in feed
4. ✅ New students added shown in feed
5. ✅ New enrollments added shown in feed
6. ✅ Installments marked as overdue shown in feed
7. ✅ Each activity shows: timestamp, action description, user who performed it
8. ✅ Feed shows most recent 20 activities

## Story Completion Checklist

- [ ] All 8 tasks completed
- [ ] All tests passing
- [ ] Activity feed loads and displays correctly
- [ ] Activities clickable and navigate correctly
- [ ] Auto-refresh working (60 second interval)
- [ ] RLS enforcement verified (no cross-agency data access)
- [ ] Responsive on mobile and desktop
- [ ] Code reviewed and merged

---

**Next Steps:**
1. Open Claude Code Web
2. Navigate to `docs/stories/prompts/6-4-recent-activity-feed/`
3. Start with `task-1-database-schema.md`
4. Copy the full content and paste into Claude Code Web
5. Let Claude Code implement the task
6. Verify implementation works
7. Check off task in this manifest
8. Move to next task

**Story File:** [6-4-recent-activity-feed.md](.bmad-ephemeral/stories/6-4-recent-activity-feed.md)
