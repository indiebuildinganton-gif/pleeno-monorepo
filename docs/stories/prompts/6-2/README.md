# Story 6-2: Cash Flow Projection Chart - Implementation Guide

## Overview

**Story:** Cash Flow Projection Chart
**Story ID:** 6-2
**Total Tasks:** 8

This directory contains task-specific development prompts for implementing the Cash Flow Projection Chart feature. Each prompt is designed to be executed sequentially in Claude Code Web.

## Generated Files

All prompt files are located in this directory:

1. **[task-1-prompt.md](task-1-prompt.md)** - Create Cash Flow Projection API Route
2. **[task-2-prompt.md](task-2-prompt.md)** - Create CashFlowChart Component
3. **[task-3-prompt.md](task-3-prompt.md)** - Implement Interactive Tooltip
4. **[task-4-prompt.md](task-4-prompt.md)** - Add View Toggle Controls
5. **[task-5-prompt.md](task-5-prompt.md)** - Implement Real-Time Updates
6. **[task-6-prompt.md](task-6-prompt.md)** - Add Widget Header and Controls
7. **[task-7-prompt.md](task-7-prompt.md)** - Integrate into Dashboard Page
8. **[task-8-prompt.md](task-8-prompt.md)** - Testing

## Usage Instructions

### Step 1: Open Claude Code Web

Navigate to [Claude Code Web](https://claude.ai/code) in your browser.

### Step 2: Start with Task 1

1. Open `task-1-prompt.md`
2. Copy the entire contents
3. Paste into Claude Code Web
4. Follow the instructions to:
   - Create the implementation manifest
   - Implement the API route

### Step 3: Verify Manifest Creation

After Task 1 completes, verify that `manifest.md` was created in this directory. This file tracks your progress through all 8 tasks.

### Step 4: Continue with Remaining Tasks

For each subsequent task (2-8):

1. Open the corresponding `task-{n}-prompt.md` file
2. Copy the entire contents
3. Paste into Claude Code Web
4. Follow the instructions
5. Update the manifest after completing each task

**Important:** Execute tasks in order! Each task builds on the previous one.

## Manifest Tracking

The manifest file (`manifest.md`) is created by Task 1 and tracks:

- Task completion status
- Start and completion dates
- Implementation notes
- Overall story progress

**Update the manifest after each task** to maintain accurate progress tracking.

## Story Context Reference

If you need additional context during implementation:

- **Story File:** `.bmad-ephemeral/stories/6-2-cash-flow-projection-chart.md`
- **Context XML:** `.bmad-ephemeral/stories/6-2-cash-flow-projection-chart.context.xml`

## Task Breakdown

### Task 1: Create Cash Flow Projection API Route
**Acceptance Criteria:** #1-3, 5

Create the backend API route at `apps/dashboard/app/api/cash-flow-projection/route.ts` that:
- Accepts `days` and `groupBy` query parameters
- Queries installments table with date filtering and grouping
- Returns time series data with paid/expected amounts
- Includes 5-minute caching

**Key Files:**
- `apps/dashboard/app/api/cash-flow-projection/route.ts` (new)

---

### Task 2: Create CashFlowChart Component
**Acceptance Criteria:** #1, 3-6

Create the React component that visualizes cash flow data:
- Fetches data using TanStack Query
- Renders stacked bar chart with Recharts
- Shows paid (green) vs expected (blue) amounts
- Includes loading and error states

**Key Files:**
- `apps/dashboard/app/components/CashFlowChart.tsx` (new)

---

### Task 3: Implement Interactive Tooltip
**Acceptance Criteria:** #4

Enhance the chart with detailed tooltips:
- Shows date range, amounts, and installment count
- Lists up to 5 students with names and amounts
- Handles empty buckets gracefully
- Formats currency correctly

**Key Files:**
- `apps/dashboard/app/components/CashFlowChart.tsx` (update)

---

### Task 4: Add View Toggle Controls
**Acceptance Criteria:** #6

Add buttons to switch between time views:
- Daily, Weekly, Monthly toggle buttons
- Persists selection in Zustand store
- Triggers data refetch on toggle
- Highlights active button

**Key Files:**
- `packages/stores/src/dashboard-store.ts` (update or create)
- `apps/dashboard/app/components/CashFlowChart.tsx` (update)

---

### Task 5: Implement Real-Time Updates
**Acceptance Criteria:** #5

Configure automatic data refreshing:
- Refetch on window focus
- Background polling every 5 minutes
- Optional: Supabase Realtime subscription
- Visual loading indicator

**Key Files:**
- `apps/dashboard/app/components/CashFlowChart.tsx` (update)

---

### Task 6: Add Widget Header and Controls
**Acceptance Criteria:** #1, 6

Create a polished widget container:
- Header with title and refresh button
- Summary metrics (Total Expected, Paid, Net)
- Date range indicator
- Responsive layout

**Key Files:**
- `apps/dashboard/app/components/CashFlowChart.tsx` (update)

---

### Task 7: Integrate into Dashboard Page
**Acceptance Criteria:** #1

Add the chart to the main dashboard:
- Import component into dashboard page
- Position below KPI widgets
- Full-width layout
- Responsive design

**Key Files:**
- `apps/dashboard/app/page.tsx` (update or create)

---

### Task 8: Testing
**Acceptance Criteria:** All

Write comprehensive tests:
- API route unit tests (date grouping, calculations, RLS)
- Component tests (rendering, interactions, states)
- E2E tests (dashboard integration, responsiveness)

**Key Files:**
- `apps/dashboard/__tests__/api/cash-flow-projection.test.ts` (new)
- `apps/dashboard/__tests__/components/CashFlowChart.test.tsx` (new)
- `__tests__/e2e/dashboard-cash-flow.spec.ts` (new)

---

## Tips for Success

### Execute in Order
Tasks have dependencies. For example:
- Task 2 depends on Task 1 (API must exist)
- Task 3 depends on Task 2 (Component must exist)
- Task 7 depends on Tasks 1-6 (All features complete)

### Update the Manifest
After completing each task:
1. Mark previous task as "Completed" with date
2. Mark current task as "In Progress" with date
3. Add implementation notes

### Reference Story Context
If you need more details:
- Acceptance criteria
- Technical constraints
- Database schema
- Architecture patterns

All information is in the story files listed above.

### Test as You Go
While Task 8 is dedicated to testing, consider testing each task after completion:
- Task 1: Test API with curl or Postman
- Tasks 2-7: Visual testing in browser
- Task 8: Automated test suite

### Ask for Help
If you encounter issues:
- Check the story context XML for additional details
- Review architecture.md for patterns
- Check previous stories (6-1) for similar implementations

## Success Criteria

Story 6-2 is complete when:

✅ All 8 tasks are completed
✅ Manifest shows all tasks as "Completed"
✅ All tests pass (Task 8)
✅ Chart displays on dashboard at `/dashboard`
✅ Users can toggle between Daily/Weekly/Monthly views
✅ Tooltip shows student details on hover
✅ Chart updates in real-time
✅ Responsive on mobile, tablet, desktop

## Next Steps After Completion

Once Story 6-2 is complete:

1. **Mark story as complete** in the project tracking system
2. **Deploy to staging** for QA testing
3. **Update documentation** if any architecture decisions changed
4. **Move to next story** in Epic 6

---

**Ready to begin? Start with task-1-prompt.md and good luck, anton!**
