# Story 7-4: Commission Report by College - Implementation Guide

## Overview

**Story ID**: 7-4
**Title**: Commission Report by College
**Total Tasks**: 8
**Estimated Time**: 6-8 hours (sequential implementation)

**Story Goal**: Create a commission reporting system for agency admins to track commissions owed by colleges, with support for grouping by location, drill-down details, and professional exports for college partner submissions.

## Generated Prompt Files

All task-specific prompts are located in this directory:

1. **task-1-prompt.md** - Create Commissions Report Page (with manifest creation)
2. **task-2-prompt.md** - Implement Commission Report API Route
3. **task-3-prompt.md** - Display Commission Report Results
4. **task-4-prompt.md** - Add CSV Export for Commissions Report
5. **task-5-prompt.md** - Create Professional PDF Template for Commissions
6. **task-6-prompt.md** - Implement PDF Export API Route
7. **task-7-prompt.md** - Add City Grouping/Filtering
8. **task-8-prompt.md** - Testing and Validation

## How to Use These Prompts

### Sequential Execution in Claude Code Web

These prompts are designed for sequential execution in Claude Code Web (200k context window). Follow these steps:

#### Step 1: Start with Task 1

1. Open Claude Code Web (https://claude.ai/code)
2. Navigate to your project directory
3. Copy the **entire contents** of `task-1-prompt.md`
4. Paste into Claude Code Web
5. Let Claude execute the task

**Important**: Task 1 creates a manifest file that tracks progress through all tasks.

#### Step 2: Verify Manifest Creation

After Task 1 completes:
- Check that `manifest.md` was created in this directory
- Verify Task 1 is marked as "In Progress" or "Completed"
- Review the implementation notes

#### Step 3: Continue with Remaining Tasks

For each subsequent task (2 through 8):

1. **Before starting**: Read the manifest to see what was completed
2. **Copy prompt**: Copy the entire contents of the next task prompt file
3. **Paste in Claude**: Paste into Claude Code Web
4. **Execute**: Let Claude implement the task
5. **Update manifest**: Claude should update the manifest as instructed
6. **Verify**: Test the implementation before moving to next task

#### Step 4: Track Progress

The manifest file (`manifest.md`) tracks:
- Current status of each task
- Start and completion dates
- Implementation notes and decisions
- Any issues or blockers

Update this file after each task completion.

## Task Dependencies

Tasks have dependencies and should be completed in order:

```
Task 1: Report Page UI
  └─> Task 2: API Route
       └─> Task 3: Display Component
            ├─> Task 4: CSV Export
            └─> Task 5: PDF Template
                 └─> Task 6: PDF Export API
                      └─> Task 7: City Grouping
                           └─> Task 8: Testing
```

**Do not skip tasks** - each builds on the previous implementation.

## Quick Reference

### Files You'll Create

**Frontend**:
- `apps/reports/app/reports/commissions/page.tsx` - Report page
- `apps/reports/app/components/CommissionReportTable.tsx` - Table component
- `apps/reports/app/components/CommissionReportPDF.tsx` - PDF template

**Backend**:
- `apps/reports/app/api/reports/commissions/route.ts` - Report API
- `apps/reports/app/api/reports/commissions/export/route.ts` - Export API
- `supabase/migrations/XXX_create_commission_report_function.sql` - Database function

**Utilities** (may already exist from Story 7.2):
- `packages/utils/src/csv-formatter.ts` - CSV utilities
- `packages/utils/src/pdf-generator.ts` - PDF utilities

**Tests**:
- `apps/reports/app/api/reports/commissions/__tests__/route.test.ts`
- `apps/reports/app/components/__tests__/CommissionReportTable.test.tsx`
- `e2e/reports/commission-report.spec.ts`

### Key Technologies

- **Frontend**: Next.js App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Export**: @react-pdf/renderer (PDF), csv-stringify (CSV)
- **Testing**: Vitest, React Testing Library, Playwright

### Acceptance Criteria Checklist

Use this to verify story completion:

- [ ] 1. Generate commission report with breakdown by college and branch for selected time period
- [ ] 2. Display columns: college, branch, city, total paid, commission rate, earned commission, outstanding commission
- [ ] 3. City field distinguishes between multiple branches of same school
- [ ] 4. Report includes date range filter
- [ ] 5. Report exportable to CSV and PDF
- [ ] 6. PDF version formatted professionally for submission to college partners
- [ ] 7. Report shows supporting details: list of students and payment plans contributing to commission
- [ ] 8. Report can be grouped/filtered by city

## Important Notes

### Security

- All queries MUST filter by `agency_id` (multi-tenant isolation)
- Row-Level Security (RLS) enforced on all database tables
- Use server-side Supabase client with user authentication

### Commission Calculation

The formulas used throughout:

**Earned Commission**:
```
SUM(installment.amount × (branch.commission_rate_percent / 100))
WHERE installment.paid_at IS NOT NULL
```

**Outstanding Commission**:
```
SUM(installment.amount × (branch.commission_rate_percent / 100))
WHERE installment.paid_at IS NULL AND installment.due_date < NOW()
```

### Performance

- Use database functions for aggregations (reduce round trips)
- Indexes on `installments.due_date` and `branches.city`
- Consider materialized views for frequently run reports
- Limit to 1000 colleges/branches per export

### Excel Compatibility (CSV)

- Use UTF-8 BOM (`\uFEFF`) for proper character encoding
- Format currency as decimal (no symbols): "1234.56"
- Proper escaping for commas, quotes, newlines

### PDF Quality

- Professional formatting suitable for college partner submission
- Include agency logo
- Clean typography, consistent spacing
- Proper page breaks for long reports
- Footer with page numbers

## Troubleshooting

### Common Issues

**Issue**: Manifest not created after Task 1
- **Solution**: Check Claude's output for errors, manually create manifest using template from task-1-prompt.md

**Issue**: API returns 401 Unauthorized
- **Solution**: Verify Supabase authentication, check user session

**Issue**: Commission calculations incorrect
- **Solution**: Test SQL queries directly in Supabase SQL editor, verify FILTER clause syntax

**Issue**: CSV doesn't open correctly in Excel
- **Solution**: Verify UTF-8 BOM is present, check file encoding

**Issue**: PDF rendering fails
- **Solution**: Check @react-pdf/renderer version, verify image URLs are accessible

**Issue**: Tests failing
- **Solution**: Check test setup, verify mock data, ensure database is in clean state

### Getting Help

If you encounter issues:

1. Check the story context file: `.bmad-ephemeral/stories/7-4-commission-report-by-college.context.xml`
2. Review the full story markdown: `.bmad-ephemeral/stories/7-4-commission-report-by-college.md`
3. Check related documentation:
   - `docs/epics.md` (Story 7.4 section)
   - `docs/architecture.md` (Reporting Zone, Database Schema)
   - `.bmad-ephemeral/stories/7-2-csv-export-functionality.md` (CSV patterns)

## Manifest File Location

After Task 1 completes, your progress will be tracked in:

**Location**: `.bmad-ephemeral/stories/prompts/7-4-commission-report-by-college/manifest.md`

This file tracks:
- Overall story status
- Each task's status (Not Started, In Progress, Completed)
- Start and completion dates
- Implementation notes

## Completion

When all 8 tasks are complete:

1. Update manifest story status to "Completed"
2. Add final completion date
3. Summarize implementation in notes
4. Run all tests to verify everything works
5. Update the story file status to "done" or "ready-for-review"
6. Celebrate!

## Tips for Success

- Work through tasks sequentially - don't skip ahead
- Test each task before moving to the next
- Update the manifest after each task
- Commit code frequently (after each task or subtask)
- Read the acceptance criteria before starting
- Refer to the story context XML for detailed technical info
- Use the provided code examples and patterns
- Ask Claude to explain anything unclear
- Take breaks between tasks to review what was built
- Verify security (RLS) is working at each step

## Estimated Time per Task

- Task 1: 45-60 minutes (UI setup)
- Task 2: 60-90 minutes (API + database function)
- Task 3: 45-60 minutes (Table component)
- Task 4: 30-45 minutes (CSV export)
- Task 5: 30-45 minutes (PDF template)
- Task 6: 30-45 minutes (PDF API)
- Task 7: 30-45 minutes (City grouping)
- Task 8: 90-120 minutes (Comprehensive testing)

**Total**: 6-8 hours

Adjust based on your familiarity with the tech stack and codebase.

---

Good luck with your implementation! 🚀
