# Story 4.3: Payment Plan List and Detail Views

Status: ready-for-dev

## Story

As an **Agency User**,
I want **to view all payment plans and drill into individual plan details**,
So that **I can quickly find plans and see their payment status**.

## Acceptance Criteria

1. **Payment Plans List View**
   - Display all payment plans for the authenticated user's agency
   - Show key information per plan: student name, college/branch, total amount, number of installments, next due date, overall status
   - Support pagination or infinite scroll for large datasets
   - Default sort by next due date (ascending)
   - Enable clicking on any plan to navigate to detail view

2. **Comprehensive Filtering**
   - Filter by status (active, completed, cancelled) - multi-select
   - Filter by student name (dropdown or autocomplete)
   - Filter by college/branch (dropdown)
   - Filter by total amount (range: min/max inputs)
   - Filter by number of installments (range or dropdown)
   - Filter by next due date (date range picker)
   - Support applying multiple filters simultaneously
   - Display active filters as visual chips/tags
   - Provide "Clear all filters" button to reset

3. **Search Functionality**
   - Text search by student name (partial match)
   - Text search by reference number (exact or partial match)
   - Search updates results in real-time (debounced)

4. **Payment Plan Detail Page**
   - Display complete plan information:
     - Student details (name, contact, linked to student profile)
     - Enrollment details (college, branch, program)
     - Payment plan metadata (total amount, currency, start date, reference number, notes)
     - Commission calculation breakdown (commission rate, expected commission)
     - Overall plan status
   - Display all installments in chronological order
   - Show installment details: installment number, amount, student due date, college due date, status, paid date (if paid)
   - Visual status indicators for each installment (badges/colors)
   - Calculate and display plan progress: X of Y installments paid, total paid / total amount

5. **Data Isolation**
   - All queries filtered by agency_id (via RLS)
   - Users only see payment plans belonging to their agency
   - Prevent access to other agencies' data

## Tasks / Subtasks

- [ ] **Task 1: Payment Plans List API** (AC: 1, 2, 3, 5)
  - [ ] Implement GET /api/payment-plans with comprehensive query params:
    - status: string[] (multi-select)
    - student_id: string
    - college_id: string
    - branch_id: string
    - amount_min: number
    - amount_max: number
    - installments_min: number
    - installments_max: number
    - due_date_from: string (ISO date)
    - due_date_to: string (ISO date)
    - search: string (student name or reference number)
    - page: number
    - limit: number
    - sort_by: string (default: next_due_date)
    - sort_order: 'asc' | 'desc'
  - [ ] Join payment_plans with enrollments, students, branches, colleges
  - [ ] Calculate next_due_date: MIN(installments.student_due_date WHERE status = 'pending')
  - [ ] Calculate installment counts: COUNT(installments) as total_installments
  - [ ] Apply RLS filtering by agency_id
  - [ ] Return paginated results with total count
  - [ ] Optimize query performance with indexes on (agency_id, status), (student_id), (branch_id)

- [ ] **Task 2: Payment Plan Detail API** (AC: 4, 5)
  - [ ] Implement GET /api/payment-plans/[id]
  - [ ] Return payment plan with nested relationships:
    - enrollment (with student, branch, college)
    - all installments (ordered by student_due_date ASC)
  - [ ] Calculate plan progress metrics:
    - total_paid: SUM(installments.paid_amount WHERE status = 'paid')
    - installments_paid_count: COUNT(installments WHERE status = 'paid')
  - [ ] Apply RLS filtering by agency_id
  - [ ] Return 404 if plan not found or belongs to different agency

- [ ] **Task 3: Payment Plans List Page** (AC: 1, 2, 3)
  - [ ] Create /payments/plans/page.tsx (Server Component)
  - [ ] Create PaymentPlansList component (Client Component with TanStack Query)
  - [ ] Display plans in table/card layout with columns:
    - Student Name (linked to student profile)
    - College / Branch
    - Total Amount (formatted currency)
    - Installments (e.g., "5 of 12 paid")
    - Next Due Date (formatted date)
    - Status (badge: active/completed/cancelled)
  - [ ] Implement default sort by next_due_date ASC
  - [ ] Add "View Details" button/link for each plan
  - [ ] Show loading skeleton while fetching data
  - [ ] Show empty state: "No payment plans found. Create your first payment plan."

- [ ] **Task 4: Filter Panel Component** (AC: 2)
  - [ ] Create PaymentPlansFilterPanel component
  - [ ] Status filter: Multi-select checkboxes (active, completed, cancelled)
  - [ ] Student filter: Autocomplete dropdown (fetch students from API)
  - [ ] College/Branch filter: Nested dropdown (college → branches)
  - [ ] Amount filter: Min/Max number inputs with currency formatting
  - [ ] Installments filter: Min/Max number inputs or dropdown (1-5, 6-10, 11-20, 20+)
  - [ ] Due date filter: Date range picker (from/to)
  - [ ] Display active filters as removable chips
  - [ ] "Clear all filters" button resets all filter state
  - [ ] Update URL query params when filters change (shareable URLs)

- [ ] **Task 5: Search Bar Component** (AC: 3)
  - [ ] Create PaymentPlansSearchBar component
  - [ ] Text input with search icon
  - [ ] Debounced search (300ms delay)
  - [ ] Search placeholder: "Search by student name or reference number..."
  - [ ] Clear button (X icon) to reset search
  - [ ] Update URL query param: ?search=...

- [ ] **Task 6: Payment Plan Detail Page** (AC: 4)
  - [ ] Create /payments/plans/[id]/page.tsx (Server Component)
  - [ ] Create PaymentPlanDetail component (Client Component)
  - [ ] Display sections:
    - **Plan Overview**: Total amount, currency, status, reference number, notes, start date
    - **Student Information**: Name (linked), contact info, link to student profile page
    - **Enrollment Details**: College name, branch name, program, enrollment status
    - **Commission Breakdown**: Commission rate (%), expected commission (amount), calculation formula display
    - **Payment Progress**: Visual progress bar (X of Y installments paid, $X of $Y paid)
  - [ ] Add breadcrumb navigation: Home → Payment Plans → [Plan ID]
  - [ ] Add "Edit Plan" button (future story)
  - [ ] Add "Cancel Plan" button (future story, with confirmation modal)

- [ ] **Task 7: Installments List Component** (AC: 4)
  - [ ] Create InstallmentsList component
  - [ ] Display installments in table format:
    - Installment # (1, 2, 3...)
    - Amount (currency formatted)
    - Student Due Date
    - College Due Date
    - Status (badge: pending/paid/overdue/cancelled)
    - Paid Date (if status = paid)
    - Action button: "Mark as Paid" (links to Story 4.4)
  - [ ] Sort installments by student_due_date ASC
  - [ ] Highlight overdue installments (red background or icon)
  - [ ] Highlight next pending installment (blue highlight)
  - [ ] Show initial payment (installment_number = 0) separately if exists
  - [ ] Display commission vs non-commission breakdown per installment (if generates_commission field exists)

- [ ] **Task 8: Payment Plan Status Calculation** (AC: 1, 4)
  - [ ] Calculate overall plan status logic:
    - "active": At least one installment is pending
    - "completed": All installments are paid
    - "cancelled": Plan is explicitly cancelled
  - [ ] Calculate next_due_date: MIN(student_due_date) WHERE status = 'pending'
  - [ ] Implement as database view or computed column
  - [ ] Cache computed values in TanStack Query (5-minute stale time)

- [ ] **Task 9: Pagination / Infinite Scroll** (AC: 1)
  - [ ] Implement pagination using TanStack Query
  - [ ] Default page size: 20 plans per page
  - [ ] Option 1: Classic pagination with page numbers
  - [ ] Option 2: Infinite scroll with "Load More" button
  - [ ] Show total count: "Showing X-Y of Z payment plans"
  - [ ] Persist pagination state in URL query params

- [ ] **Task 10: TanStack Query Integration** (AC: All)
  - [ ] Create usePaymentPlans query hook with filters/pagination
  - [ ] Create usePaymentPlanDetail query hook with plan ID
  - [ ] Implement query key structure: ['payment-plans', { filters }]
  - [ ] Configure stale time: 5 minutes for list, 2 minutes for detail
  - [ ] Implement optimistic updates for future mutations (Story 4.4)
  - [ ] Add error boundary for failed queries

- [ ] **Task 11: Testing** (AC: All)
  - [ ] Write integration tests for GET /api/payment-plans with various filter combinations
  - [ ] Test RLS policies: users cannot access other agencies' payment plans
  - [ ] Test search functionality (student name, reference number)
  - [ ] Test pagination/sorting
  - [ ] Write E2E test: Navigate from list → detail page
  - [ ] Test filter combinations and clear filters
  - [ ] Test empty states (no plans, no results after filtering)
  - [ ] Test detail page with various plan statuses

## Dev Notes

### Architecture Patterns and Constraints

**Multi-Zone Architecture:**
- Payment plans list/detail live in `apps/payments/` zone
- Requires joined data from `apps/entities/` (students, colleges, branches, enrollments)
- Use `packages/database` for Supabase client and shared queries
- Filter/search logic shared via `packages/utils/src/query-helpers.ts`

**Server Component Pattern (Next.js 15):**
- List page and detail page are Server Components for SEO and initial data load
- Client Components handle interactivity: filters, search, TanStack Query
- Server Components fetch initial data using Supabase SSR client
- Client Components use TanStack Query for client-side filtering/pagination

**Database Patterns:**
- Row-Level Security (RLS) enforces agency_id filtering on all queries
- Use database views or computed columns for next_due_date and plan status
- Indexes on (agency_id, status), (student_id), (branch_id) for fast filtering
- Join payment_plans → enrollments → students, branches, colleges

**TanStack Query Patterns:**
- Query key structure: `['payment-plans', { status, student_id, search, page }]`
- Stale time: 5 minutes (list view), 2 minutes (detail view)
- Prefetch detail page data on list row hover (performance optimization)
- Infinite queries for infinite scroll pagination

**Filtering & Search:**
- URL query params for shareable filter state: `/payments/plans?status=active&student_id=123`
- Debounced search (300ms delay) to reduce API calls
- Multi-select filters represented as arrays in query params
- Filter panel state managed via React Hook Form or Zustand

**Date Handling:**
- Store dates in UTC in database
- Display dates in agency's configured timezone
- Use `packages/utils/src/date-helpers.ts` for formatting
- Date range filters: Convert to UTC before sending to API

**Currency Formatting:**
- Use `packages/utils/src/formatters.ts` for consistent currency display
- Display currency symbol from agency.currency setting
- Format amounts with thousands separators and 2 decimal places

### Project Structure Notes

**Payment Plans List/Detail Components:**
```
apps/payments/
├── app/
│   ├── plans/
│   │   ├── page.tsx                            # NEW: Payment plans list (Server Component)
│   │   ├── [id]/
│   │   │   └── page.tsx                        # NEW: Payment plan detail (Server Component)
│   │   └── components/
│   │       ├── PaymentPlansList.tsx            # NEW: Client Component (TanStack Query)
│   │       ├── PaymentPlansFilterPanel.tsx     # NEW: Filter UI
│   │       ├── PaymentPlansSearchBar.tsx       # NEW: Search UI
│   │       ├── PaymentPlanDetail.tsx           # NEW: Detail view
│   │       ├── InstallmentsList.tsx            # NEW: Installments table
│   │       └── PaymentPlanStatusBadge.tsx      # NEW: Status indicator
```

**API Routes:**
```
apps/payments/app/api/
├── payment-plans/
│   ├── route.ts                                # NEW: GET /api/payment-plans (list with filters)
│   └── [id]/
│       └── route.ts                            # NEW: GET /api/payment-plans/[id] (detail)
```

**Shared Utilities:**
```
packages/utils/src/
├── query-helpers.ts                            # NEW: buildPaymentPlansQuery()
├── date-helpers.ts                             # EXISTING: formatDate(), parseDate()
└── formatters.ts                               # EXISTING: formatCurrency()
```

**Database Views (optional optimization):**
```
supabase/migrations/003_payments_domain/
└── 004_payment_plans_views.sql                 # NEW: Create views for next_due_date, plan_status
```

### References

**Epic Breakdown:**
- [Source: docs/epics.md#Story-4.3-Payment-Plan-List-and-Detail-Views]
- Full acceptance criteria: lines 732-769
- Prerequisites: Story 4.2 (Flexible Installment Structure)

**Architecture:**
- [Source: docs/architecture.md#Payment-Plans-List]
- List view component structure: lines 133-139
- API endpoint specification: GET /api/payment-plans: lines 1933-1976
- Pagination/infinite scroll patterns: lines 2204-2207
- Server Component + TanStack Query pattern: lines 1112-1123

**PRD Requirements:**
- Payment plan management: FR-5 (Payment Plans and Installments)
- List/detail view requirements derived from Epic 4 acceptance criteria
- Filter requirements: Enable quick access to specific payment plans

**Technical Decisions:**
- Next.js 15 with App Router (Server Components for initial render, Client Components for interactivity)
- Supabase PostgreSQL with RLS for multi-tenancy
- TanStack Query for client-side caching, filtering, and pagination
- URL query params for shareable filter state
- Shadcn UI components (Table, Select, Input, DatePicker, Badge, Button)

### Learnings from Previous Story

**From Story 4.1: Payment Plan Creation (Status: drafted)**

Story 4.1 created the foundation for payment plans that Story 4.3 will display:

- **Payment Plans Table Created**: `payment_plans` table with fields: id, enrollment_id, agency_id, total_amount, currency, start_date, commission_rate_percent, expected_commission, status, notes, reference_number, created_at, updated_at
- **Commission Calculation Pattern**: expected_commission = total_amount * (commission_rate_percent / 100)
- **Payment Plan API Routes**:
  - POST /api/payment-plans (create)
  - GET /api/payment-plans/[id] (detail endpoint already exists)
- **RLS Policies**: Agency-level data isolation established on payment_plans table
- **Status Enum**: 'active', 'completed', 'cancelled'

**Key Interfaces to Reuse:**
- Payment plan detail endpoint: GET /api/payment-plans/[id] returns full plan with enrollment details
- Status badge component pattern from Story 4.1 (active/completed/cancelled)
- Currency formatting from Story 4.1 (formatCurrency utility)
- Commission calculation display format

**Database Dependencies:**
- Payment plans list requires payment_plans table (Story 4.1)
- Requires enrollments table (Story 3.3) via payment_plans.enrollment_id FK
- Requires installments table (Story 4.2) for installment counts and next due date
- Join path: payment_plans → enrollments → students, branches, colleges

**Architectural Continuity:**
- Follow same RLS pattern: agency_id filtering on all queries
- Follow same audit logging pattern (if implemented in 4.1)
- Use consistent status badge styling (active=green, completed=gray, cancelled=red)
- Use consistent currency formatting and date display patterns

**Important Notes:**
- Story 4.3 displays payment plans created in Story 4.1
- Installments from Story 4.2 drive the "X of Y installments paid" display
- Next due date calculated from installments table (MIN(student_due_date) WHERE status='pending')
- Filter by student/college requires joins to enrollments, students, branches, colleges
- Search by reference_number uses payment_plans.reference_number field from Story 4.1

**UI Component Reuse:**
- Status badge component from Story 4.1 (adapt for list view)
- Currency formatting utilities from Story 4.1
- Form validation patterns (React Hook Form + Zod) for filter form
- TanStack Query patterns for API calls and caching

[Source: stories/4-1-payment-plan-creation.md]

**Files Created by Story 4.1 (to reference):**
- Database: `003_payments_domain/001_payment_plans_schema.sql`
- API routes: `/api/payment-plans` (POST), `/api/payment-plans/[id]` (GET)
- Components: `PaymentPlanForm.tsx`, `PaymentPlanSummary.tsx`, `EnrollmentSelect.tsx`
- Utilities: `commission-calculator.ts`

**Patterns to Follow:**
- Server Component initial data load + Client Component TanStack Query for interactivity
- RLS-enforced agency_id filtering on all queries
- Comprehensive error handling and empty states
- Real-time data updates via TanStack Query refetch/invalidation

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/4-3-payment-plan-list-and-detail-views.context.xml](.bmad-ephemeral/stories/4-3-payment-plan-list-and-detail-views.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
