# Story 7-3: PDF Export Functionality - Implementation Guide

**Story ID**: 7-3
**Story Title**: PDF Export Functionality
**Total Tasks**: 9

## Overview

This directory contains task-specific development prompts for implementing PDF Export functionality in Pleeno. Each task is broken down into manageable subtasks with clear acceptance criteria, context, and implementation guidelines.

## Generated Files

All prompt files are located in `.bmad-ephemeral/stories/prompts/7-3/`:

1. **task-1-prompt.md** - Create PDF Export API Route (includes manifest creation)
2. **task-2-prompt.md** - Create PDF Template with React Components
3. **task-3-prompt.md** - Add Agency Logo/Branding
4. **task-4-prompt.md** - Include Report Metadata and Filters
5. **task-5-prompt.md** - Format Data Table with Pagination
6. **task-6-prompt.md** - Add Summary Totals Section
7. **task-7-prompt.md** - Add Export Button to Report UI
8. **task-8-prompt.md** - Add Export Tracking
9. **task-9-prompt.md** - Testing (comprehensive test coverage)

## Usage Instructions

### Step 1: Prepare Your Environment

- Open Claude Code Web (https://claude.ai/code)
- Have your project workspace ready
- Ensure you have the story context file: `.bmad-ephemeral/stories/7-3-pdf-export-functionality.context.xml`

### Step 2: Start with Task 1

1. Open `task-1-prompt.md`
2. Copy the **entire contents** of the file
3. Paste into Claude Code Web
4. Execute the task
5. **IMPORTANT**: Task 1 will create `manifest.md` to track your progress

### Step 3: Verify Manifest Creation

After Task 1 completes:
1. Check that `manifest.md` was created at `.bmad-ephemeral/stories/prompts/7-3/manifest.md`
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
`.bmad-ephemeral/stories/prompts/7-3/manifest.md` (created by Task 1)

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
Task 1: API Route
  ↓
Task 2: PDF Components (uses API route)
  ↓
Task 3: Logo Upload (enhances components)
  ↓
Task 4: Metadata & Filters (enhances components)
  ↓
Task 5: Table Formatting (completes components)
  ↓
Task 6: Summary Totals (completes components)
  ↓
Task 7: Export Button UI (triggers API)
  ↓
Task 8: Activity Tracking (logs exports)
  ↓
Task 9: Testing (validates everything)
```

## Acceptance Criteria

All tasks contribute to meeting these acceptance criteria:

1. ✅ **AC #1**: Given I have generated a report, When I click "Export to PDF", Then a PDF file is downloaded with formatted report data
2. ✅ **AC #2**: And the PDF includes: agency logo/name, report title, generation date, filters applied
3. ✅ **AC #3**: And the PDF includes a formatted table with the report data
4. ✅ **AC #4**: And the PDF includes summary totals
5. ✅ **AC #5**: And the PDF has proper page breaks for large reports
6. ✅ **AC #6**: And the filename includes the report type and timestamp

## Key Technical Components

### NPM Packages Required
- `@react-pdf/renderer` (^4.3.1) - PDF generation
- `@supabase/supabase-js` (latest) - Database and storage
- `date-fns` (^4.1.0) - Date formatting
- `date-fns-tz` (latest) - Timezone support

### Files Created/Modified
- `apps/reports/app/api/reports/payment-plans/export/route.ts` - API route
- `packages/ui/src/pdf/PDFReportHeader.tsx` - Header component
- `packages/ui/src/pdf/PDFFiltersSection.tsx` - Filters display
- `packages/ui/src/pdf/PDFReportTable.tsx` - Table component
- `packages/ui/src/pdf/PDFReportFooter.tsx` - Footer/summary
- `packages/ui/src/pdf/pdf-styles.ts` - PDF stylesheet
- `packages/utils/src/pdf-exporter.ts` - Export utility
- `apps/agency/app/settings/page.tsx` - Logo upload
- Database migration for `agencies.logo_url`
- Supabase Storage bucket: `agency-logos`

## Tips for Success

### Execute in Order
Tasks have dependencies - don't skip ahead! Task 2 needs Task 1 to be complete, Task 3 builds on Task 2, etc.

### Update Manifest Regularly
Keep the manifest up-to-date after each task. It helps you track progress and serves as a development log.

### Reference Story Context
If you need more context, refer to the story context file:
`.bmad-ephemeral/stories/7-3-pdf-export-functionality.context.xml`

### Test as You Go
Don't wait until Task 9 to start testing. Each task includes testing guidelines - use them!

### Ask Questions
If something is unclear in a prompt, ask Claude Code for clarification. The prompts are comprehensive but may need interpretation.

## Troubleshooting

### Manifest Not Created
- Ensure Task 1 completed successfully
- Check file permissions in `.bmad-ephemeral/stories/prompts/7-3/`
- Create manually using template from task-1-prompt.md

### Dependencies Not Found
- Run `npm install` or `pnpm install` in project root
- Check package.json for @react-pdf/renderer and date-fns
- Install manually if needed: `pnpm add @react-pdf/renderer date-fns date-fns-tz`

### API Route Not Working
- Verify Task 1 completed and files were created
- Check Next.js server is running
- Review API route logs for errors

### PDF Not Generating
- Check browser console for errors
- Verify API route returns 200 status
- Check @react-pdf/renderer is installed correctly

## Progress Tracking

As you complete tasks, update this checklist:

- [ ] Task 1: Create PDF Export API Route
- [ ] Task 2: Create PDF Template with React Components
- [ ] Task 3: Add Agency Logo/Branding
- [ ] Task 4: Include Report Metadata and Filters
- [ ] Task 5: Format Data Table with Pagination
- [ ] Task 6: Add Summary Totals Section
- [ ] Task 7: Add Export Button to Report UI
- [ ] Task 8: Add Export Tracking
- [ ] Task 9: Testing

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

You're implementing a comprehensive PDF export feature with professional formatting, pagination, branding, and tracking. Take it one task at a time, keep your manifest updated, and test thoroughly.

**Remember**: Quality over speed. It's better to complete each task correctly than to rush through and create technical debt.

---

**Generated by**: BMM execute-dev-story-claude-code-web workflow
**Date**: 2025-11-13
**Story Context**: `.bmad-ephemeral/stories/7-3-pdf-export-functionality.context.xml`
