# Story 5.2: Due Soon Notification Flags - Implementation Guide

## Overview

**Story ID**: 5-2
**Story Title**: Due Soon Notification Flags
**Total Tasks**: 4

This directory contains task-specific development prompts for implementing the "Due Soon Notification Flags" feature. The prompts are designed to be executed sequentially in Claude Code Web, with each task building on the previous one.

## Generated Files

All prompt files are located in: `.bmad-ephemeral/stories/prompts/5-2-due-soon-notification-flags/`

- **[task-1-prompt.md](task-1-prompt.md)** - Implement "due soon" computed field logic
- **[task-2-prompt.md](task-2-prompt.md)** - Update UI to display "due soon" badges
- **[task-3-prompt.md](task-3-prompt.md)** - Create student notification system
- **[task-4-prompt.md](task-4-prompt.md)** - Testing and validation
- **MANIFEST.md** - Implementation tracking (created by Task 1)
- **README.md** - This file

## Story Summary

**User Story:**
> As an **Agency User**, I want **to see visual indicators for payments due within the next 4 days**, so that **I can proactively follow up before payments become overdue, including weekend and early-week payments**.

**Key Features:**
- Visual "due soon" badges with yellow/amber color coding
- Dashboard widget showing count of upcoming payments
- Configurable threshold (default: 4 days)
- Automated student notifications 36 hours before due date
- Email reminders sent at 5:00 AM Brisbane time
- Filter functionality to show only "due soon" payment plans

## Usage Instructions

### Step 1: Open Claude Code Web
Navigate to [Claude Code Web](https://claude.ai/code) and start a new conversation.

### Step 2: Execute Task 1
1. Open [task-1-prompt.md](task-1-prompt.md)
2. Copy the entire contents
3. Paste into Claude Code Web
4. Follow the prompts to implement Task 1
5. **IMPORTANT**: Task 1 will create [MANIFEST.md](MANIFEST.md) to track progress

### Step 3: Verify Manifest Created
After Task 1 completes, verify that [MANIFEST.md](MANIFEST.md) exists and Task 1 is marked as completed.

### Step 4: Execute Task 2
1. Open [task-2-prompt.md](task-2-prompt.md)
2. Copy the entire contents
3. Paste into Claude Code Web (same conversation or new one)
4. Follow the prompts to implement Task 2
5. Update [MANIFEST.md](MANIFEST.md) when complete

### Step 5: Execute Task 3
1. Open [task-3-prompt.md](task-3-prompt.md)
2. Copy the entire contents
3. Paste into Claude Code Web
4. Follow the prompts to implement Task 3
5. Update [MANIFEST.md](MANIFEST.md) when complete

### Step 6: Execute Task 4
1. Open [task-4-prompt.md](task-4-prompt.md)
2. Copy the entire contents
3. Paste into Claude Code Web
4. Follow the prompts to implement comprehensive testing
5. Update [MANIFEST.md](MANIFEST.md) when complete

### Step 7: Story Complete!
Once all 4 tasks are completed and all tests pass, the story is ready for review and deployment.

## Manifest Tracking

The [MANIFEST.md](MANIFEST.md) file (created by Task 1) tracks:
- Overall story status
- Individual task status (Not Started / In Progress / Completed)
- Start and completion dates for each task
- Implementation notes
- Files created/modified
- Database migrations applied

**Always update the manifest** after completing each task!

## Task Dependencies

Tasks must be executed in order due to dependencies:

1. **Task 1** → Database schema and query logic
2. **Task 2** → UI components (depends on Task 1 backend)
3. **Task 3** → Notification system (depends on Tasks 1-2)
4. **Task 4** → Testing (depends on Tasks 1-3 being complete)

## Key Files to be Created/Modified

### Database Migrations
- `supabase/migrations/001_agency_domain/001_agencies_schema.sql` - Add due_soon_threshold_days
- `supabase/migrations/002_entities_domain/003_students_schema.sql` - Add contact fields
- `supabase/migrations/004_notifications_domain/001_notifications_schema.sql` - Create notifications table

### Backend/API
- `packages/utils/src/date-helpers.ts` - isDueSoon() calculation
- `packages/utils/src/notification-helpers.ts` - Email sending utilities
- `apps/agency/app/api/agencies/[id]/settings/route.ts` - Threshold configuration API
- `apps/dashboard/app/api/dashboard/due-soon-count/route.ts` - Dashboard count API

### Frontend Components
- `apps/dashboard/app/components/DueSoonBadge.tsx` - Reusable badge
- `apps/dashboard/app/components/DueSoonWidget.tsx` - Dashboard widget
- `apps/payments/app/plans/components/InstallmentStatusBadge.tsx` - Update existing

### Supabase Edge Functions
- `supabase/functions/notifications/send-due-soon-notifications/index.ts` - Notification job

### Email Templates
- `emails/payment-reminder.tsx` - React Email template

### Tests
- `packages/utils/src/*.test.ts` - Unit tests
- `apps/dashboard/app/components/*.test.tsx` - Component tests
- `supabase/functions/notifications/send-due-soon-notifications/index.test.ts` - Edge Function tests
- `__tests__/e2e/due-soon-notifications.spec.ts` - E2E tests

## Acceptance Criteria Reference

All tasks work together to satisfy these acceptance criteria:

1. ✅ Installments due within 4 days are flagged as "due soon"
2. ✅ "Due soon" installments display with warning badge/color
3. ✅ Dashboard shows count of "due soon" installments
4. ✅ Filter shows only plans with "due soon" installments
5. ✅ Threshold (4 days) is configurable per agency
6. ✅ Student receives notification 36 hours before due (5 PM cutoff)
7. ✅ Notification sent at 5:00 AM Brisbane time
8. ✅ Notification includes: name, amount, due date, instructions

## Technical Highlights

### Pattern: Computed Field (Not Stored Status)
"Due soon" is calculated query-time using date logic, NOT stored as a status enum. Installments remain "pending" until they become "overdue" or "paid".

### Pattern: Timezone-Aware Scheduling
Notification job runs at 7:00 PM UTC (= 5:00 AM Brisbane next day) using pg_cron scheduler.

### Pattern: Duplicate Prevention
Unique constraint on `(installment_id, notification_type)` prevents sending duplicate notifications.

### Pattern: Multi-Stakeholder Notifications
Foundation for broader notification system that can notify agencies, students, colleges, and sales agents.

## Tips for Success

1. **Execute tasks in order** - Dependencies matter!
2. **Update manifest after each task** - Track your progress
3. **Reference story context** - [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml)
4. **Test thoroughly** - Task 4 includes comprehensive test cases
5. **Color consistency** - Yellow/amber for "due soon", red for "overdue", green for "paid"
6. **Timezone handling** - Always store UTC, convert for display
7. **RLS policies** - All queries must respect agency-scoped data

## Reference Documentation

- **Source Story**: [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.md](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.md)
- **Story Context XML**: [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml)
- **Epic Documentation**: [docs/epics.md](docs/epics.md) - Epic 5: Intelligent Status Automation
- **Architecture Patterns**: [docs/architecture.md](docs/architecture.md)
- **PRD**: [docs/PRD.md](docs/PRD.md) - MVP Features

## Getting Help

If you encounter issues:
1. Check the story context XML for detailed technical decisions
2. Review the architecture documentation for patterns
3. Refer to the manifest for what's been completed
4. Each task prompt includes specific implementation guidance

## Story Completion Checklist

- [ ] Task 1: Backend foundation complete (schema, API, logic)
- [ ] Task 2: UI components complete (badges, widgets, filters)
- [ ] Task 3: Notification system complete (emails, scheduling, logging)
- [ ] Task 4: All tests passing (unit, integration, E2E)
- [ ] Manifest updated with all tasks marked "Completed"
- [ ] Story file updated to "done" status
- [ ] Manual validation performed
- [ ] Ready for code review and deployment

---

Good luck with your implementation, anton! 🚀

Generated by: **BMAD Execute Dev Story Workflow**
Date: 2025-11-13
