# Story 5-1: Automated Status Detection Job - Implementation Guide

## Overview

**Story ID**: 5-1
**Title**: Automated Status Detection Job
**Total Tasks**: 10
**Location**: `.bmad-ephemeral/stories/prompts/5-1-automated-status-detection-job/`

## Story Summary

Implement a scheduled job that runs daily to automatically update installment statuses, marking overdue payments without manual intervention. Uses pg_cron + Supabase Edge Functions with timezone-aware processing.

## Generated Files

This workflow has generated the following prompt files:

1. **task-01-prompt.md** - Create Status Update Database Function (includes manifest creation)
2. **task-02-prompt.md** - Create Jobs Log Table
3. **task-03-prompt.md** - Create Supabase Edge Function
4. **task-04-prompt.md** - Configure pg_cron Schedule
5. **task-05-prompt.md** - Implement API Key Authentication
6. **task-06-prompt.md** - Add Agency Timezone and Cutoff Time Fields
7. **task-07-prompt.md** - Testing
8. **task-08-prompt.md** - Monitoring and Alerting Setup
9. **task-09-prompt.md** - Migration File Creation
10. **task-10-prompt.md** - Documentation

## Usage Instructions

### Step 1: Setup
1. Open Claude Code Web (https://claude.ai)
2. Navigate to this directory: `.bmad-ephemeral/stories/prompts/5-1-automated-status-detection-job/`

### Step 2: Execute Tasks Sequentially
Execute tasks in order, as each builds on the previous:

1. **Start with Task 1**:
   - Open `task-01-prompt.md`
   - Copy the entire contents
   - Paste into Claude Code Web
   - Follow the instructions
   - **IMPORTANT**: Task 1 will create `MANIFEST.md` - verify it's created

2. **Continue with Tasks 2-10**:
   - For each task:
     - Open the task prompt file (e.g., `task-02-prompt.md`)
     - Copy the entire contents
     - Paste into Claude Code Web
     - Follow the instructions
     - Update the manifest when complete

### Step 3: Track Progress
- After completing each task, update `MANIFEST.md`
- Mark task status: "Not Started" → "In Progress" → "Completed"
- Add completion date and implementation notes
- This helps track progress and provides context for later tasks

### Step 4: Verify Completion
After all tasks are complete:
- Run the test suite (Task 7)
- Manually test pg_cron scheduling (Task 7)
- Verify all acceptance criteria are met
- Update the overall story status in the manifest

## Manifest Tracking

The manifest file (`MANIFEST.md`) is created by Task 1 and tracks:
- Overall story status
- Individual task progress (status, dates, notes)
- Implementation notes

**Location**: `.bmad-ephemeral/stories/prompts/5-1-automated-status-detection-job/MANIFEST.md`

**Update after each task**:
- Set previous task to "Completed" with date
- Set current task to "In Progress" with date
- Add any relevant notes

## Task Dependencies

Tasks must be completed in order due to dependencies:

```
Task 1 (SQL Function)
   ↓
Task 2 (Jobs Log Table) ← Referenced by Task 3
   ↓
Task 3 (Edge Function) ← Calls Task 1, logs to Task 2
   ↓
Task 4 (pg_cron Schedule) ← Invokes Task 3
   ↓
Task 5 (API Key Auth) ← Integrates into Task 3 & 4
   ↓
Task 6 (Agency Timezone Fields) ← Used by Task 1
   ↓
Task 7 (Testing) ← Tests all previous tasks
   ↓
Task 8 (Monitoring) ← Monitors Task 2's jobs_log
   ↓
Task 9 (Migration File) ← Combines Tasks 1, 2, 4, 6
   ↓
Task 10 (Documentation) ← Documents all tasks
```

## Acceptance Criteria

All tasks work together to satisfy these criteria:

1. **Automated Status Detection** - Pending installments past due date + cutoff time marked as overdue (Tasks 1, 6)
2. **Scheduled Execution** - Job runs daily at 7:00 AM UTC via pg_cron (Task 4)
3. **Execution Logging and Monitoring** - All executions logged with details (Tasks 2, 8)
4. **Reliability and Error Handling** - Retries on transient errors, atomic updates (Task 3)
5. **Security and Access Control** - API key authentication protects endpoint (Task 5)

## Tips for Success

1. **Follow the order**: Tasks build on each other - don't skip ahead
2. **Update the manifest**: Keep track of progress and notes
3. **Test as you go**: Verify each component works before moving forward
4. **Reference the context**: Full story context is in `.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml`
5. **Check architecture**: Review `docs/architecture.md` Pattern 3 for detailed architecture

## Key Files Created

By the end of implementation, you will have created:

### Database
- `supabase/migrations/004_notifications_domain/001_jobs_infrastructure.sql` - Main migration file
  - `update_installment_statuses()` SQL function
  - `jobs_log` table
  - pg_cron extension and schedule
  - Agency table updates (timezone, cutoff_time fields)

### Backend
- `supabase/functions/update-installment-statuses/index.ts` - Edge Function
- `supabase/functions/update-installment-statuses/deno.json` - Dependencies config

### Tests
- `supabase/tests/update_installment_statuses.test.sql` - SQL function tests
- `supabase/functions/update-installment-statuses/test/index.test.ts` - Edge Function tests
- `__tests__/integration/jobs/status-update.test.ts` - Integration tests

### Documentation
- Updated `docs/architecture.md` with operational procedures
- Monitoring and alerting setup guide
- Troubleshooting procedures

## Need Help?

- **Full context**: `.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml`
- **Architecture docs**: `docs/architecture.md` (Pattern 3: Automated Status State Machine)
- **Epic breakdown**: `docs/epics.md` (Story 5.1 section)
- **PRD**: `docs/PRD.md` (Epic 5: Intelligent Status Automation)

---

**Ready to start?** Open `task-01-prompt.md` and paste it into Claude Code Web!
