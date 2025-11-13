# Story 5-4: Payment Status Dashboard Widget - Task 1

## Story Context

**As an** Agency User
**I want** a dashboard widget showing payment status overview at a glance
**So that** I instantly know which payments need attention

---

## Task 1: Create Dashboard Page and Layout

### Task Description

Set up the foundational dashboard infrastructure including the dashboard page, layout with navigation, shell app routing configuration, and Turborepo integration.

### Subtasks

- [ ] Create dashboard page at `apps/dashboard/app/page.tsx` if not exists
- [ ] Create dashboard layout with navigation at `apps/dashboard/app/layout.tsx`
- [ ] Configure routing in shell app to proxy `/dashboard` to dashboard zone
- [ ] Add dashboard to Turborepo configuration

### Acceptance Criteria

This task supports **AC #1**: Given I am viewing the dashboard, When the page loads, Then I see a payment status summary widget displaying count and total value for each status category

---

## Context & Technical Details

### Architecture Constraints

- **Multi-Zone Setup**: Dashboard lives in `apps/dashboard/` zone as an independent Next.js application
- **Shell Proxying**: Shell app (`apps/shell/`) must proxy `/dashboard` requests to dashboard zone via `next.config.js` rewrites
- **Turborepo**: Dashboard must be added to Turborepo configuration for proper build orchestration
- **Protected Route**: Dashboard is a protected route - middleware must validate JWT before access
- **Performance Target**: Dashboard load time target is <2 seconds

### Tech Stack

- **Framework**: Next.js 15.x with App Router and React Server Components
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x + Shadcn UI components
- **State Management**: TanStack Query 5.90.7 for server state, Zustand 5.0.8 for client state (if needed)
- **Database**: Supabase with Row-Level Security (RLS)

### Project Structure Reference

From [docs/architecture.md](../../architecture.md):

```
apps/dashboard/
├── app/
│   ├── page.tsx                        # Main dashboard page
│   ├── layout.tsx                      # Dashboard navigation
│   ├── api/
│   │   └── payment-status-summary/
│   │       └── route.ts                # API route handler
│   └── components/
│       └── PaymentStatusWidget.tsx     # Widget component
└── next.config.js                      # basePath: /dashboard
```

### Shell Routing Configuration

From [docs/architecture.md](../../architecture.md):

```typescript
// apps/shell/next.config.js
rewrites: async () => [
  {
    source: '/dashboard/:path*',
    destination: 'http://localhost:3001/dashboard/:path*' // Dev
    // In prod: dashboard-pleeno.vercel.app
  }
]
```

### UI/UX Requirements

Reference design: **Stripe Dashboard** (clean, data-rich, professional)
- Dashboard-first experience with immediate visibility on login
- Key KPIs panel showing critical metrics
- Clean, modern dashboard aesthetic with visual hierarchy

---

## CRITICAL: Create Manifest File

**Before you begin implementation**, create a manifest tracking file to monitor progress across all tasks.

### Manifest Location

Create: `docs/stories/prompts/5-4/manifest.md`

### Manifest Template

```markdown
# Story 5-4 Implementation Manifest

**Story**: Payment Status Dashboard Widget
**Status**: In Progress
**Started**: [Current Date]

## Task Progress

### Task 1: Create Dashboard Page and Layout
- Status: In Progress
- Started: [Current Date]
- Completed:
- Notes:

### Task 2: Implement Payment Status Summary API Route
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Create PaymentStatusWidget Component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Add Navigation to Payment Plans with Filters
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Testing
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through the tasks]

## Blockers / Issues

[Document any blockers or issues encountered]
```

---

## Implementation Steps

1. **Create the manifest file** using the template above
2. **Set up dashboard app structure**:
   - Create `apps/dashboard/` directory if it doesn't exist
   - Initialize Next.js app structure
   - Configure `next.config.js` with `basePath: '/dashboard'`
   - Set up `package.json` with dependencies

3. **Create dashboard page** (`apps/dashboard/app/page.tsx`):
   - Export default dashboard page component
   - Add placeholder for PaymentStatusWidget (will be created in Task 3)
   - Include basic layout structure

4. **Create dashboard layout** (`apps/dashboard/app/layout.tsx`):
   - Set up dashboard navigation
   - Include auth protection
   - Add Tailwind CSS and global styles

5. **Configure shell app routing** (`apps/shell/next.config.js`):
   - Add rewrite rule for `/dashboard/:path*`
   - Point to dashboard zone (localhost:3001 for dev, dashboard-pleeno.vercel.app for prod)

6. **Update Turborepo configuration** (`turbo.json` at root):
   - Add `dashboard` app to Turborepo pipeline
   - Configure build dependencies

7. **Update manifest** when complete:
   - Mark Task 1 as "Completed" with completion date
   - Add implementation notes about what was created

---

## Next Steps

After completing this task:

1. **Update the manifest file**:
   - Set Task 1 status to "Completed" with date
   - Add any relevant implementation notes

2. **Proceed to Task 2**: Implement Payment Status Summary API Route
   - Prompt file: `task-2-prompt.md`
   - This will create the backend API that fetches payment status data

---

## Reference Documents

- [docs/architecture.md](../../architecture.md) - System Architecture (Multi-Zone Setup, Project Structure, Security)
- [docs/epics.md](../../epics.md) - Epic 5: Story 5.4 requirements
- [docs/PRD.md](../../PRD.md) - Product Requirements (Business Intelligence Dashboard)
- [Story Context XML](.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml)
