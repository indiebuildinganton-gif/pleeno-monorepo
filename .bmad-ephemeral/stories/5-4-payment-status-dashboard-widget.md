# Story 5.4: Payment Status Dashboard Widget

Status: ready-for-dev

## Story

As an **Agency User**,
I want **a dashboard widget showing payment status overview at a glance**,
so that **I instantly know which payments need attention**.

## Acceptance Criteria

1. **Given** I am viewing the dashboard
   **When** the page loads
   **Then** I see a payment status summary widget displaying count and total value for each status category

2. **And** the widget displays count and total value of pending payments

3. **And** the widget displays count and total value of due soon payments (next 7 days)

4. **And** the widget displays count and total value of overdue payments

5. **And** the widget displays count and total value of paid payments (this month)

6. **And** clicking any metric filters the payment plans list accordingly (navigates to /payments with appropriate filter)

## Tasks / Subtasks

- [ ] **Task 1: Create Dashboard Page and Layout** (AC: #1)
  - [ ] Create dashboard page at `apps/dashboard/app/page.tsx` if not exists
  - [ ] Create dashboard layout with navigation at `apps/dashboard/app/layout.tsx`
  - [ ] Configure routing in shell app to proxy `/dashboard` to dashboard zone
  - [ ] Add dashboard to Turborepo configuration

- [ ] **Task 2: Implement Payment Status Summary API Route** (AC: #1-5)
  - [ ] Create API route: `GET /api/dashboard/payment-status-summary`
  - [ ] Implement database queries to calculate:
    - Count and sum of pending installments
    - Count and sum of due soon installments (due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days')
    - Count and sum of overdue installments (status = 'overdue')
    - Count and sum of paid installments (status = 'paid' AND paid_at >= start of current month)
  - [ ] Apply RLS to ensure agency_id filtering
  - [ ] Return JSON response with counts and totals for each category
  - [ ] Add 5-minute caching for performance optimization

- [ ] **Task 3: Create PaymentStatusWidget Component** (AC: #1-5)
  - [ ] Create React component: `apps/dashboard/app/components/PaymentStatusWidget.tsx`
  - [ ] Use TanStack Query to fetch payment status summary from API
  - [ ] Display four status cards with:
    - Count of installments
    - Total amount formatted as currency
    - Visual status indicator (color-coded)
  - [ ] Use visual indicators:
    - Green for paid
    - Yellow/amber for due soon
    - Red for overdue
    - Gray/neutral for pending
  - [ ] Style with Tailwind CSS and Shadcn UI components
  - [ ] Add loading state while data fetches
  - [ ] Add error state if query fails

- [ ] **Task 4: Add Navigation to Payment Plans with Filters** (AC: #6)
  - [ ] Make each status card clickable (Link or router navigation)
  - [ ] Pass filter parameter to `/payments` route:
    - Pending: `/payments?status=pending`
    - Due Soon: `/payments?status=due_soon`
    - Overdue: `/payments?status=overdue`
    - Paid This Month: `/payments?status=paid&period=current_month`
  - [ ] Ensure payments zone can receive and apply filter query parameters

- [ ] **Task 5: Testing** (AC: All)
  - [ ] Write unit tests for payment status summary API route
  - [ ] Mock database queries and verify correct aggregation logic
  - [ ] Write component tests for PaymentStatusWidget using React Testing Library
  - [ ] Test loading states, error states, and data display
  - [ ] Verify click navigation passes correct filter parameters
  - [ ] Write integration test verifying dashboard loads and displays widget

## Dev Notes

### Architecture Context

**Multi-Zone Setup:**
- Dashboard widget lives in `apps/dashboard/` zone
- API route can be in `apps/dashboard/app/api/` or shared `apps/shell/app/api/`
- Shell app proxies `/dashboard` requests to dashboard zone via next.config.js rewrites

**State Management:**
- Use TanStack Query for server state (payment status summary data)
- Automatic caching, refetching on window focus, and stale-while-revalidate
- No need for Zustand unless adding client-side filter state

**Database Queries:**
- All queries MUST respect RLS policies (agency_id filtering automatic via auth.uid())
- Use Supabase client for database access
- Query installments table with joins to payment_plans if needed
- Consider performance: aggregation queries on installments table could be slow at scale
  - Add database indexes on: `status`, `due_date`, `paid_at`, `agency_id`
  - Cache API response for 5 minutes to reduce load

**Security:**
- Dashboard is protected route (middleware validates JWT)
- RLS ensures users only see their agency's data
- API routes must use server-side Supabase client (not anon key)

### Project Structure Notes

**Dashboard Zone Structure:**
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

**Shell Routing Configuration:**
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

### Testing Standards

**Unit Tests (Vitest):**
- Test API route logic independently
- Mock Supabase client queries
- Verify aggregation calculations

**Component Tests (React Testing Library):**
- Test widget renders correctly with mock data
- Test loading and error states
- Test click handlers and navigation

**Integration Tests (Playwright - optional for this story):**
- E2E test: login → navigate to dashboard → verify widget displays
- Verify clicking status card navigates to filtered payment plans

### References

- [Source: docs/architecture.md#Dashboard Endpoints] - API structure for dashboard queries
- [Source: docs/architecture.md#Multi-Tenant Isolation] - RLS policy patterns
- [Source: docs/architecture.md#Project Structure] - Dashboard zone organization
- [Source: docs/epics.md#Story 5.4] - Acceptance criteria and technical notes

## Dev Agent Record

### Context Reference

- [5-4-payment-status-dashboard-widget.context.xml](.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
