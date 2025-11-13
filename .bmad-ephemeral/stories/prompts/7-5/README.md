# Story 7-5: Student Payment History Report - Implementation Guide

**Story ID**: 7-5
**Story Title**: Student Payment History Report
**Total Tasks**: 9

## Overview

This directory contains task-specific development prompts for implementing Student Payment History Report functionality in Pleeno. Each task is broken down into manageable subtasks with clear acceptance criteria, context, and implementation guidelines.

## Generated Files

All prompt files are located in `.bmad-ephemeral/stories/prompts/7-5/`:

1. **task-1-prompt.md** - Add Payment History Section to Student Detail Page (includes manifest creation)
2. **task-2-prompt.md** - Implement Payment History API Route
3. **task-3-prompt.md** - Display Payment History Timeline
4. **task-4-prompt.md** - Create Student Payment Statement PDF Template
5. **task-5-prompt.md** - Implement PDF Export API Route
6. **task-6-prompt.md** - Add Date Range Filtering
7. **task-7-prompt.md** - Reuse Export Utilities from Story 7.2 and 7.4
8. **task-8-prompt.md** - Add Payment History Link from Student List
9. **task-9-prompt.md** - Testing and Validation (comprehensive test coverage)

## Usage Instructions

### Step 1: Prepare Your Environment

- Open Claude Code Web (https://claude.ai/code)
- Have your project workspace ready
- Ensure you have the story context file: `.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml`

### Step 2: Start with Task 1

1. Open `task-1-prompt.md`
2. Copy the **entire contents** of the file
3. Paste into Claude Code Web
4. Execute the task
5. **IMPORTANT**: Task 1 will create `manifest.md` to track your progress

### Step 3: Verify Manifest Creation

After Task 1 completes:
1. Check that `manifest.md` was created at `.bmad-ephemeral/stories/prompts/7-5/manifest.md`
2. Verify Task 1 status is marked as "In Progress"
3. This manifest will track your progress through all 9 tasks

### Step 4: Continue with Task 2

1. Open `task-2-prompt.md`
2. Copy the entire contents
3. Paste into Claude Code Web
4. Execute the task
5. Update manifest - mark Task 1 as "Completed", Task 2 as "In Progress"

### Step 5: Repeat for Each Task

Continue sequentially through tasks 3-9:
- Execute each task in order (dependencies matter!)
- Update manifest after each task completion
- Add implementation notes for future reference

### Step 6: Final Testing

Task 9 is dedicated to comprehensive testing:
- Unit tests
- Integration tests
- E2E tests
- Edge cases
- Performance validation

## Manifest Tracking

### Location
`.bmad-ephemeral/stories/prompts/7-5/manifest.md` (created by Task 1)

### Purpose
- Track progress through all 9 tasks
- Record completion dates
- Capture implementation notes and decisions
- Provide audit trail of development process

### How to Use
After completing each task:
1. Open manifest.md
2. Update previous task status to "Completed" with date
3. Update current task status to "In Progress" with date
4. Add any relevant implementation notes

## Task Dependencies

Tasks should be executed in order due to these dependencies:

```
Task 1: Payment History Section UI
  ↓
Task 2: Payment History API Route (provides data for UI)
  ↓
Task 3: Timeline Display Component (renders API data)
  ↓
Task 4: PDF Template Component (reusable PDF structure)
  ↓
Task 5: PDF Export API Route (uses PDF template)
  ↓
Task 6: Date Range Filtering (enhances UI and API)
  ↓
Task 7: Reuse Export Utilities (refactor for consistency)
  ↓
Task 8: Navigation Links (integrates feature)
  ↓
Task 9: Testing (validates everything)
```

## Acceptance Criteria

All tasks contribute to meeting these acceptance criteria:

1. ✅ **AC #1**: Given I am viewing a student's detail page, When I request a payment history report, Then I see a chronological list of all payment plans and installments for that student
2. ✅ **AC #2**: And each entry shows: date, payment plan, college/branch, amount, payment status, paid date
3. ✅ **AC #3**: And the report shows total paid to date and total outstanding
4. ✅ **AC #4**: And the report is exportable to PDF for sharing with the student
5. ✅ **AC #5**: And the PDF is formatted as a clear payment statement
6. ✅ **AC #6**: And I can filter by date range (all time, this year, custom)

## Key Technical Components

### NPM Packages Required
- `@react-pdf/renderer` (^4.3.1) - PDF generation
- `@supabase/supabase-js` (latest) - Database queries
- `@supabase/ssr` (latest) - Server-Side Rendering utilities
- `date-fns` (^4.1.0) - Date formatting
- `date-fns-tz` (latest) - Timezone support
- `lucide-react` - Icons (ChevronDown, ChevronRight)

### Files Created/Modified
- `apps/entities/app/students/[id]/page.tsx` - Student detail page with Payment History tab
- `apps/entities/app/students/[id]/components/PaymentHistorySection.tsx` - Payment History UI
- `apps/entities/app/students/[id]/components/PaymentHistoryTimeline.tsx` - Timeline display
- `apps/entities/app/api/students/[id]/payment-history/route.ts` - Payment history API
- `apps/entities/app/api/students/[id]/payment-history/export/route.ts` - PDF export API
- `apps/entities/app/components/StudentPaymentStatementPDF.tsx` - PDF template
- `packages/utils/src/pdf-generator.ts` - PDF utilities (from Story 7.4)
- `packages/utils/src/formatters.ts` - Currency and date formatters
- `packages/database/src/queries/student-payment-history.ts` - Payment history queries
- `supabase/migrations/XXX_create_student_payment_history_function.sql` - Database function

## Tips for Success

### Execute in Order
Tasks have dependencies - don't skip ahead! Task 2 needs Task 1 to be complete, Task 3 builds on Task 2, etc.

### Update Manifest Regularly
Keep the manifest up-to-date after each task. It helps you track progress and serves as a development log.

### Reference Story Context
If you need more context, refer to the story context file:
`.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml`

### Reuse Patterns from Story 7.4
Story 7.4 (Commission Report) established PDF export patterns. Task 7 focuses on reusing these utilities for consistency.

### Test as You Go
Don't wait until Task 9 to start testing. Each task includes testing guidelines - use them!

### Ask Questions
If something is unclear in a prompt, ask Claude Code for clarification. The prompts are comprehensive but may need interpretation.

## Troubleshooting

### Manifest Not Created
- Ensure Task 1 completed successfully
- Check file permissions in `.bmad-ephemeral/stories/prompts/7-5/`
- Create manually using template from task-1-prompt.md

### Dependencies Not Found
- Run `npm install` or `pnpm install` in project root
- Check package.json for @react-pdf/renderer and date-fns
- Install manually if needed: `pnpm add @react-pdf/renderer date-fns date-fns-tz`

### API Route Not Working
- Verify Task 1 and 2 completed and files were created
- Check Next.js server is running
- Review API route logs for errors

### PDF Not Generating
- Check browser console for errors
- Verify API route returns 200 status
- Check @react-pdf/renderer is installed correctly
- Verify agency logo is accessible (if using logo_url)

### RLS Issues
- Ensure user is authenticated and has agency_id in user_metadata
- Verify RLS policies exist on students, enrollments, payment_plans, installments tables
- Check Supabase logs for RLS violations

## Progress Tracking

As you complete tasks, update this checklist:

- [ ] Task 1: Add Payment History Section to Student Detail Page
- [ ] Task 2: Implement Payment History API Route
- [ ] Task 3: Display Payment History Timeline
- [ ] Task 4: Create Student Payment Statement PDF Template
- [ ] Task 5: Implement PDF Export API Route
- [ ] Task 6: Add Date Range Filtering
- [ ] Task 7: Reuse Export Utilities from Story 7.2 and 7.4
- [ ] Task 8: Add Payment History Link from Student List
- [ ] Task 9: Testing and Validation

## Final Steps

After completing all 9 tasks:

1. ✅ All tests pass
2. ✅ All acceptance criteria verified
3. ✅ Manual testing completed
4. ✅ Update story status to "completed"
5. ✅ Update `.bmad-ephemeral/sprint-status.yaml`
6. ✅ Prepare demo for stakeholders
7. ✅ Document any learnings or issues

## Good Luck!

You're implementing a comprehensive student payment history report with professional PDF statements, timeline visualization, date range filtering, and multi-tenant security. Take it one task at a time, keep your manifest updated, and test thoroughly.

**Remember**: Quality over speed. It's better to complete each task correctly than to rush through and create technical debt.

---

**Generated by**: BMM execute-dev-story-claude-code-web workflow
**Date**: 2025-11-13
**Story Context**: `.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml`
