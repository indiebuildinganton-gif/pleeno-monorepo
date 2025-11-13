# Story 5-4: Payment Status Dashboard Widget - Implementation Guide

## Overview

**Story ID**: 5-4
**Story Title**: Payment Status Dashboard Widget
**Total Tasks**: 5

This directory contains task-specific prompts for implementing the Payment Status Dashboard Widget feature in Claude Code Web. Each prompt is designed to be executed sequentially, building upon the work completed in previous tasks.

---

## Generated Files

All prompts are located in: `docs/stories/prompts/5-4/`

- **[task-1-prompt.md](task-1-prompt.md)** - Create Dashboard Page and Layout (includes manifest creation)
- **[task-2-prompt.md](task-2-prompt.md)** - Implement Payment Status Summary API Route
- **[task-3-prompt.md](task-3-prompt.md)** - Create PaymentStatusWidget Component
- **[task-4-prompt.md](task-4-prompt.md)** - Add Navigation to Payment Plans with Filters
- **[task-5-prompt.md](task-5-prompt.md)** - Testing
- **[README.md](README.md)** - This file (usage instructions)
- **manifest.md** - Will be created by Task 1 (tracks progress)

---

## Usage Instructions

### Step 1: Open Claude Code Web

Navigate to Claude Code Web in your browser.

### Step 2: Start with Task 1

1. Open [task-1-prompt.md](task-1-prompt.md)
2. Copy the entire contents of the file
3. Paste into Claude Code Web
4. Execute the prompt

**Important**: Task 1 will create the `manifest.md` file that tracks your progress through all tasks.

### Step 3: Verify Manifest Creation

After Task 1 completes, verify that `docs/stories/prompts/5-4/manifest.md` was created and contains the progress tracking structure.

### Step 4: Execute Remaining Tasks Sequentially

When Task 1 is complete:

1. Open [task-2-prompt.md](task-2-prompt.md)
2. Copy and paste into Claude Code Web
3. Execute the prompt
4. Repeat for tasks 3, 4, and 5

**Critical**: Tasks must be executed in order as they have dependencies:
- Task 2 depends on Task 1 (dashboard infrastructure)
- Task 3 depends on Task 2 (API endpoint)
- Task 4 depends on Task 3 (widget component)
- Task 5 depends on all previous tasks (comprehensive testing)

### Step 5: Track Progress

After each task:
1. The prompt will instruct Claude to update the manifest
2. Check `manifest.md` to see your progress
3. Add any implementation notes or decisions made

---

## Manifest Tracking

### Location

The manifest file will be created at: `docs/stories/prompts/5-4/manifest.md`

### Purpose

The manifest tracks:
- Status of each task (Not Started, In Progress, Completed)
- Start and completion dates
- Implementation notes
- Blockers or issues encountered

### How to Use

- **Before each task**: Check manifest to see what's been completed
- **During each task**: Update status to "In Progress"
- **After each task**: Update status to "Completed" with date and notes
- **Throughout**: Add implementation notes, decisions, or issues

---

## Tips for Success

### Execute in Order

Tasks have dependencies. Don't skip ahead:
1. Task 1: Infrastructure (dashboard app, layout, routing)
2. Task 2: Backend (API endpoint for data)
3. Task 3: Frontend (widget component)
4. Task 4: Navigation (interactive links)
5. Task 5: Testing (comprehensive coverage)

### Update the Manifest

After completing each task, update the manifest with:
- Completion date
- Key files created
- Important decisions made
- Any blockers or issues

### Reference Story Context

If you need more context, refer to the original story context file:
- **Path**: `.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml`
- **Contains**: Full story details, constraints, interfaces, dependencies

### All Acceptance Criteria Are Tracked

Each prompt references the specific acceptance criteria it fulfills. By the end of Task 5, all criteria should be covered:

- **AC #1**: Dashboard displays payment status summary widget
- **AC #2**: Widget shows pending payment count and total
- **AC #3**: Widget shows due soon payment count and total (next 7 days)
- **AC #4**: Widget shows overdue payment count and total
- **AC #5**: Widget shows paid payment count and total (this month)
- **AC #6**: Clicking metrics navigates to filtered payment plans

### Ask Questions

If anything is unclear in a prompt:
- Reference the story context XML for more details
- Check the linked documentation files
- Review the manifest for previous implementation notes

---

## What Gets Built

By the end of these 5 tasks, you will have:

### Infrastructure (Task 1)
- Dashboard Next.js zone at `apps/dashboard/`
- Dashboard page and layout
- Shell routing configuration
- Turborepo integration

### Backend (Task 2)
- API endpoint: `GET /api/dashboard/payment-status-summary`
- Database queries with aggregations
- Row-Level Security (RLS) enforcement
- 5-minute response caching

### Frontend (Task 3)
- `PaymentStatusWidget` React component
- TanStack Query integration
- Four status cards with color coding:
  - 🟢 Paid (green)
  - 🟡 Due Soon (amber/yellow)
  - 🔴 Overdue (red)
  - ⚪ Pending (gray)
- Loading and error states

### Navigation (Task 4)
- Clickable status cards
- Navigation to `/payments` with filters:
  - `/payments?status=pending`
  - `/payments?status=due_soon`
  - `/payments?status=overdue`
  - `/payments?status=paid&period=current_month`

### Testing (Task 5)
- Unit tests for API route
- Component tests for widget
- Integration tests for navigation
- >80% code coverage

---

## Tech Stack

This feature uses:

- **Framework**: Next.js 15.x (App Router, React Server Components)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x + Shadcn UI
- **State Management**: TanStack Query 5.90.7 (server state)
- **Database**: Supabase with Row-Level Security
- **Testing**: Vitest + React Testing Library + Playwright
- **Build System**: Turborepo monorepo

---

## Architecture Context

### Multi-Zone Setup

- Dashboard is a separate Next.js app: `apps/dashboard/`
- Shell app proxies `/dashboard` requests to dashboard zone
- Allows independent deployment and scaling

### Security

- All routes are protected (JWT validation)
- Row-Level Security (RLS) ensures multi-tenant isolation
- Agency users only see their own data

### Performance

- API responses cached for 5 minutes
- Database indexes on key columns
- Target load time: <2 seconds

---

## Need Help?

- **Story Context**: [.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml](../../.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml)
- **Architecture**: [docs/architecture.md](../../architecture.md)
- **Epics**: [docs/epics.md](../../epics.md)
- **PRD**: [docs/PRD.md](../../PRD.md)

---

## Good luck with your implementation, anton! 🚀

Execute the prompts in order, track your progress in the manifest, and you'll have a fully functional Payment Status Dashboard Widget when you're done.

**Start here**: [task-1-prompt.md](task-1-prompt.md)
