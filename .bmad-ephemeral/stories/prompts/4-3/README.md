# Story 4.3: Payment Plan List and Detail Views - Implementation Guide

## Overview

**Story ID**: 4.3
**Title**: Payment Plan List and Detail Views
**Total Tasks**: 11
**Location**: `.bmad-ephemeral/stories/prompts/4-3/`

## User Story

**As an** Agency User
**I want** to view all payment plans and drill into individual plan details
**So that** I can quickly find plans and see their payment status

## Acceptance Criteria Summary

1. **Payment Plans List View** - Display all plans with pagination and navigation
2. **Comprehensive Filtering** - Multi-select filters for status, student, college, amount, dates
3. **Search Functionality** - Search by student name or reference number
4. **Payment Plan Detail Page** - Complete plan information with installments
5. **Data Isolation** - RLS-enforced agency filtering

## Generated Files

This workflow has generated 11 task-specific prompts for sequential execution:

1. `task-1-prompt.md` - Payment Plans List API (includes manifest creation)
2. `task-2-prompt.md` - Payment Plan Detail API
3. `task-3-prompt.md` - Payment Plans List Page
4. `task-4-prompt.md` - Filter Panel Component
5. `task-5-prompt.md` - Search Bar Component
6. `task-6-prompt.md` - Payment Plan Detail Page
7. `task-7-prompt.md` - Installments List Component
8. `task-8-prompt.md` - Payment Plan Status Calculation
9. `task-9-prompt.md` - Pagination / Infinite Scroll
10. `task-10-prompt.md` - TanStack Query Integration
11. `task-11-prompt.md` - Testing

## Usage Instructions

### Step 1: Open Claude Code Web

Go to [https://claude.ai/code](https://claude.ai/code) or your Claude Code Web instance.

### Step 2: Start with Task 1

1. Open `task-1-prompt.md`
2. Copy the entire contents
3. Paste into Claude Code Web
4. Allow Claude to execute the task

**Important**: Task 1 will create the manifest file (`MANIFEST.md`) that tracks progress.

### Step 3: Verify Manifest Creation

After Task 1 completes:
1. Check that `MANIFEST.md` exists in this directory
2. Verify Task 1 is marked as "Completed" in the manifest
3. Review any implementation notes added by Claude

### Step 4: Continue with Remaining Tasks

For Tasks 2-11:
1. Open the next task prompt file (e.g., `task-2-prompt.md`)
2. Copy the entire contents
3. Paste into Claude Code Web
4. Claude will:
   - Read the current manifest
   - Mark the previous task as complete
   - Update the current task to "In Progress"
   - Execute the task
   - Add implementation notes

### Step 5: Track Progress

Use `MANIFEST.md` to track your progress:
- View which tasks are complete
- See which task is currently in progress
- Review implementation notes for each task
- Identify any blockers or issues

## Manifest Tracking

The manifest file will be created by Task 1 at:
```
.bmad-ephemeral/stories/prompts/4-3/MANIFEST.md
```

It tracks:
- Overall story status
- Start date
- Progress for each task (Not Started → In Progress → Completed)
- Completion dates
- Implementation notes

**Always update the manifest after completing each task!**

## Task Dependencies

Tasks should be executed in order as they have dependencies:

- **Task 1-2**: API endpoints (backend)
- **Task 3**: Basic list UI (depends on Task 1)
- **Task 4-5**: Filter and search (depends on Task 3)
- **Task 6**: Detail page UI (depends on Task 2)
- **Task 7**: Installments list (depends on Task 6)
- **Task 8**: Status calculation (backend optimization)
- **Task 9**: Pagination (enhances Task 3)
- **Task 10**: Query hooks (refactoring and optimization)
- **Task 11**: Testing (covers all tasks)

## Key Implementation Notes

### Architecture
- **Multi-Zone**: Payment plans live in `apps/payments/` zone
- **Server Components**: Pages use Next.js 15 Server Components
- **Client Components**: Interactive components with TanStack Query
- **RLS Security**: All queries filtered by agency_id automatically

### Technology Stack
- Next.js 15 (App Router)
- Supabase (PostgreSQL + RLS)
- TanStack Query 5.90.7
- React Hook Form + Zod
- Shadcn UI components
- date-fns for date handling

### Database Schema
- `payment_plans` table (Story 4.1)
- `installments` table (Story 4.2)
- Joins with `enrollments`, `students`, `branches`, `colleges`

## Context Reference

Full story context available at:
```
.bmad-ephemeral/stories/4-3-payment-plan-list-and-detail-views.context.xml
```

This includes:
- Complete acceptance criteria
- Architecture constraints
- Interface specifications
- Dependencies
- Testing requirements

## Tips for Success

1. **Execute in Order**: Tasks build on each other, so follow the sequence
2. **Update Manifest**: Keep the manifest current after each task
3. **Test as You Go**: Each task includes a testing checklist
4. **Reference Context**: When in doubt, check the story context XML
5. **Document Issues**: Add notes to manifest if you encounter problems
6. **Review AC**: Check acceptance criteria frequently to ensure coverage

## Completion Criteria

Story 4.3 is complete when:
- [ ] All 11 tasks are marked "Completed" in manifest
- [ ] All acceptance criteria are met
- [ ] All tests pass (Task 11)
- [ ] List view displays plans with filtering and search
- [ ] Detail view shows complete plan information
- [ ] RLS properly isolates agency data
- [ ] No critical bugs or blockers

## Support

If you need help or encounter issues:
1. Review the task prompt again for detailed instructions
2. Check the story context XML for architecture details
3. Review previous task implementation notes in manifest
4. Consult the project architecture documentation

## Next Steps After Completion

Once Story 4.3 is complete:
1. Mark story status as "Completed" in the story file
2. Update the sprint manifest (if using sprint planning workflow)
3. Move to Story 4.4 (Mark Installments as Paid)
4. Celebrate! You've built a comprehensive payment plan management interface!

---

Good luck with your implementation!

Generated by: BMAD Execute Dev Story Workflow
Date: 2025-11-13
