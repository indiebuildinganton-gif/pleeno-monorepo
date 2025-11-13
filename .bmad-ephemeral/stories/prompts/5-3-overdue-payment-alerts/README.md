# Story 5.3: Overdue Payment Alerts - Implementation Prompts

## Overview
This directory contains task-specific prompts for implementing Story 5.3: Overdue Payment Alerts. Each prompt is designed to be copy-pasted into Claude Code Web for sequential execution.

## Story Summary
**As an** Agency User
**I want** to receive in-app notifications for overdue payments
**So that** I'm immediately aware when follow-up action is needed

## Acceptance Criteria
1. Given the automated status job has marked installments as overdue, When I log into the application, Then I see a notification/alert for new overdue payments since my last login
2. And the notification shows the number of overdue installments
3. And clicking the notification takes me to a filtered view of overdue payments
4. And I can dismiss notifications after reviewing
5. And the dashboard prominently displays the total count and value of overdue payments

## Task Breakdown

### Task 1: Implement Notifications Table and API
**File:** [task-1-prompt.md](task-1-prompt.md)

**Scope:**
- Create notifications table schema with RLS policies
- Implement GET /api/notifications (paginated)
- Implement PATCH /api/notifications/[id]/mark-read
- Write unit tests for API routes

**Estimated Time:** 2-3 hours

**Dependencies:** None (greenfield implementation)

---

### Task 2: Generate Notifications When Installments Become Overdue
**File:** [task-2-prompt.md](task-2-prompt.md)

**Scope:**
- Update status update job to detect newly overdue installments
- Create notification records when status changes to 'overdue'
- Implement deduplication logic
- Test notification generation

**Estimated Time:** 2-3 hours

**Dependencies:**
- Task 1 (notifications table must exist)
- Story 5.1 (automated status update job)

---

### Task 3: Build Notification UI Components
**File:** [task-3-prompt.md](task-3-prompt.md)

**Scope:**
- Create NotificationBell component with unread count badge
- Create NotificationDropdown component
- Create /notifications page
- Implement mark as read functionality with optimistic updates

**Estimated Time:** 3-4 hours

**Dependencies:**
- Task 1 (API routes must exist)
- Task 2 (notifications being generated)

---

### Task 4: Add Overdue Payments Section to Dashboard
**File:** [task-4-prompt.md](task-4-prompt.md)

**Scope:**
- Create OverduePaymentsSummary widget
- Query and display count/total value of overdue payments
- Implement click navigation to filtered view
- Update dashboard layout

**Estimated Time:** 2 hours

**Dependencies:**
- Tasks 1-3 (notification system operational)

---

### Task 5: Testing and Validation
**File:** [task-5-prompt.md](task-5-prompt.md)

**Scope:**
- Integration tests for notification generation
- Integration tests for UI components
- E2E test for complete user flow
- Deduplication testing
- Manual testing validation

**Estimated Time:** 3-4 hours

**Dependencies:**
- Tasks 1-4 (all features implemented)

---

## How to Use These Prompts

### Sequential Execution (Recommended)
1. Open Claude Code Web (https://code.claude.ai or similar)
2. Start with Task 1 prompt
3. Copy the entire content of `task-1-prompt.md`
4. Paste into Claude Code Web
5. Let Claude implement the task
6. Review and test the implementation
7. Mark Task 1 as complete in MANIFEST.md
8. Repeat for Tasks 2-5

### Parallel Execution (Advanced)
If you have multiple Claude Code Web instances or team members:
- Tasks 1 and 2 can be done in parallel (Task 2 will need Task 1 to be deployed)
- Task 3 requires Tasks 1-2 complete
- Task 4 can be done in parallel with Task 3
- Task 5 requires all previous tasks complete

### Context Switching
Each prompt is self-contained with:
- Full story context
- Relevant acceptance criteria
- Technical specifications
- Testing requirements
- Dependencies and prerequisites

This allows you to:
- Stop and resume work at any task boundary
- Hand off tasks to different developers
- Execute tasks in different sessions

## Progress Tracking

Use [MANIFEST.md](MANIFEST.md) to track completion status:
- [ ] = Not started
- [IN PROGRESS] = Currently working
- [x] = Completed

Update the manifest after each task completion.

## Architecture Context

### Multi-Zone Structure
- **Shell Zone:** Notification bell, dropdown, /notifications page
- **Dashboard Zone:** OverduePaymentsSummary widget
- **Supabase:** Notifications table, RLS policies, Edge Function

### Key Patterns
- **In-App Notification System:** Bell icon with badge, dropdown, full page
- **Notification Generation:** Event-driven (status change → notification)
- **Deduplication:** Prevent duplicate notifications per installment
- **RLS Security:** Agency-level isolation, user-level targeting

### Technology Stack
- Next.js 14+ (App Router, Server Actions)
- Supabase (PostgreSQL, RLS, Edge Functions)
- TanStack Query (caching, optimistic updates)
- Tailwind CSS (styling)
- Vitest + Playwright (testing)

## Reference Files
- **Story File:** `.bmad-ephemeral/stories/5-3-overdue-payment-alerts.md`
- **Story Context:** `.bmad-ephemeral/stories/5-3-overdue-payment-alerts.context.xml`
- **Architecture Docs:** `docs/architecture.md`
- **PRD:** `docs/PRD.md`
- **Epic Overview:** `docs/epics.md#Epic-5`

## Success Criteria

### Definition of Done (DoD)
- [ ] All 5 tasks completed
- [ ] All acceptance criteria validated
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Manual testing checklist completed
- [ ] Code reviewed (if team workflow)
- [ ] Deployed to staging environment
- [ ] Documentation updated

### Quality Gates
- TypeScript compilation: 0 errors
- Test coverage: >80% for new code
- RLS policies: All verified with cross-agency tests
- Performance: Notification queries <200ms
- UX: Bell icon badge updates within 60 seconds

## Troubleshooting

### Common Issues

**Issue:** Notification count not updating
- Check TanStack Query refetch interval (60 seconds default)
- Verify API route returns correct data
- Check browser console for errors

**Issue:** Duplicate notifications created
- Verify deduplication logic in status update job
- Check metadata column or notification_log table

**Issue:** RLS blocking notification access
- Verify `current_setting('app.current_agency_id')` is set
- Check RLS policies in Supabase dashboard
- Test with different user roles

**Issue:** Edge Function not triggering
- Verify pg_cron job is scheduled correctly
- Check Edge Function logs in Supabase dashboard
- Test manual invocation with `supabase functions invoke`

## Contact & Support

For questions or issues during implementation:
1. Consult the story context XML file
2. Review architecture documentation
3. Check previous story implementations (5.1, 5.2)
4. Refer to Supabase/Next.js documentation

## Version History
- v1.0 (2025-11-13): Initial prompt generation for Story 5.3
