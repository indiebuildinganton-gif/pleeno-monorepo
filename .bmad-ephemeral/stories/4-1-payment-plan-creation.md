# Story 4.1: Payment Plan Creation

Status: ready-for-dev

## Story

As an **Agency User**,
I want **to create a payment plan for a student's enrollment**,
So that **I can track the total amount owed, installment schedule, and expected commission**.

## Acceptance Criteria

1. **Payment Plan Data Entry**
   - Specify the total amount in the agency's currency
   - Select the linked enrollment (student + branch)
   - Specify a payment start date
   - Add notes or reference numbers (e.g., invoice #)
   - Calculate expected commission based on the branch's commission rate
   - Save plan with status "active"

2. **Enrollment Selection**
   - Select from existing enrollments (student-college-branch combinations)
   - Display enrollment as: "Student Name - College Name (Branch City) - Program"
   - Enrollment must belong to the same agency as the authenticated user

3. **Commission Calculation**
   - Auto-calculate expected commission using formula: `expected_commission = total_amount * (commission_rate_percent / 100)`
   - Copy commission_rate_percent from associated branch at creation time
   - Display calculated commission in real-time as user enters amount
   - Store both total_amount and expected_commission in payment_plans table

4. **Payment Plan Metadata**
   - Support optional notes field (free text, unlimited length)
   - Support optional reference_number field (e.g., invoice number, PO number)
   - Default status to "active" upon creation
   - Default currency to agency's configured currency
   - Record created_at and updated_at timestamps

5. **Data Validation**
   - total_amount must be greater than 0
   - commission_rate must be between 0 and 100
   - start_date must be a valid date
   - enrollment_id must exist and belong to same agency
   - Required fields: enrollment_id, total_amount, commission_rate, start_date

## Tasks / Subtasks

- [ ] **Task 1: Database Schema Implementation** (AC: 1, 3, 4)
  - [ ] Create `payment_plans` table: id, enrollment_id (FK), agency_id (FK), total_amount (decimal), currency, start_date, commission_rate_percent (decimal), expected_commission (decimal, calculated), status ENUM ('active', 'completed', 'cancelled'), notes (text), reference_number (text), created_at, updated_at
  - [ ] Add database trigger to auto-calculate expected_commission on INSERT/UPDATE
  - [ ] Enable RLS policies on payment_plans table filtering by agency_id
  - [ ] Create indexes on (agency_id, status) and (enrollment_id) for performance
  - [ ] Set default currency from agencies.currency configuration

- [ ] **Task 2: Commission Calculation Function** (AC: 3)
  - [ ] Create PostgreSQL function: `calculate_expected_commission(total_amount DECIMAL, commission_rate_percent DECIMAL) RETURNS DECIMAL`
  - [ ] Implement formula: `expected_commission = total_amount * (commission_rate_percent / 100)`
  - [ ] Create database trigger to auto-update expected_commission when total_amount or commission_rate changes
  - [ ] Add TypeScript utility function in `packages/utils/src/commission-calculator.ts` for client-side preview

- [ ] **Task 3: Payment Plan API Routes** (AC: 1, 2, 5)
  - [ ] Implement POST /api/payment-plans (create new plan)
  - [ ] Implement GET /api/payment-plans/[id] (payment plan detail)
  - [ ] Validate enrollment_id exists and belongs to user's agency
  - [ ] Validate total_amount > 0
  - [ ] Validate commission_rate between 0 and 100
  - [ ] Auto-populate agency_id from authenticated user's session
  - [ ] Auto-populate commission_rate from branch (query enrollments → branches → commission_rate_percent)
  - [ ] Return validation errors with descriptive messages

- [ ] **Task 4: Payment Plan Form Component** (AC: 1, 2, 4, 5)
  - [ ] Create `/payments/plans/new/page.tsx` with payment plan creation form
  - [ ] Add enrollment selection dropdown (search/autocomplete)
    - Query enrollments with student, college, branch info
    - Display format: "Student Name - College (Branch) - Program"
    - Filter enrollments by agency_id via RLS
  - [ ] Add total_amount input field (currency formatted)
  - [ ] Add start_date input field (date picker)
  - [ ] Add notes textarea (optional)
  - [ ] Add reference_number input field (optional)
  - [ ] Display commission_rate (read-only, auto-populated from branch)
  - [ ] Display expected_commission (calculated in real-time)
  - [ ] Use React Hook Form + Zod validation schema
  - [ ] Show validation errors inline

- [ ] **Task 5: Real-Time Commission Preview** (AC: 3)
  - [ ] Create `PaymentPlanSummary` component showing:
    - Total Amount: $X,XXX.XX
    - Commission Rate: X%
    - Expected Commission: $X,XXX.XX (green highlight)
  - [ ] Update expected commission in real-time as user types total_amount
  - [ ] Use `packages/utils/src/commission-calculator.ts` for client-side calculation
  - [ ] Format currency values using `packages/utils/src/formatters.ts`

- [ ] **Task 6: Payment Plan Creation Mutation** (AC: 1, 5)
  - [ ] Implement TanStack Query mutation for POST /api/payment-plans
  - [ ] Handle success: Navigate to /payments/plans/[id] detail page
  - [ ] Handle error: Display error toast notification
  - [ ] Optimistic update: Add new plan to cache immediately
  - [ ] Invalidate payment-plans query cache on success

- [ ] **Task 7: Enrollment Dropdown Component** (AC: 2)
  - [ ] Create `EnrollmentSelect` component (reusable)
  - [ ] Fetch enrollments: GET /api/enrollments?student_id=&college_id=&status=active
  - [ ] Display format: "Student Name - College (Branch City) - Program"
  - [ ] Support search/filter by student name or college name
  - [ ] Show loading state while fetching enrollments
  - [ ] Handle empty state: "No active enrollments found. Create a student enrollment first."
  - [ ] Link to student creation page if no enrollments exist

- [ ] **Task 8: Payment Plan Status Enum** (AC: 1, 4)
  - [ ] Create status enum in database: ('active', 'completed', 'cancelled')
  - [ ] Default to 'active' on creation
  - [ ] Add status column to payment_plans table
  - [ ] Create status badge component for UI display

- [ ] **Task 9: Audit Logging** (AC: All)
  - [ ] Log payment plan creation to audit_logs table
  - [ ] Include: user_id, timestamp, entity_type='payment_plan', entity_id, action='create'
  - [ ] Log all field values in new_values (JSONB)
  - [ ] Log commission calculation parameters for transparency

- [ ] **Task 10: Testing** (AC: All)
  - [ ] Write integration tests for POST /api/payment-plans
  - [ ] Test commission calculation with various amounts and rates
  - [ ] Test validation errors (negative amount, invalid enrollment, etc.)
  - [ ] Test RLS policies (users cannot create plans for other agencies' enrollments)
  - [ ] Write E2E test for payment plan creation flow
  - [ ] Test enrollment dropdown loading and selection
  - [ ] Test real-time commission preview updates

## Dev Notes

### Architecture Patterns and Constraints

**Multi-Zone Architecture:**
- Payment plan creation lives in `apps/payments/` zone
- Enrollment selection requires data from `apps/entities/` zone (students, colleges, branches)
- Share commission calculation logic via `packages/utils/src/commission-calculator.ts`
- Use `packages/database` for Supabase client and shared queries

**Database Patterns:**
- Row-Level Security (RLS) enforces multi-tenant isolation via agency_id
- Foreign key from payment_plans → enrollments creates 1:M relationship (one enrollment can have multiple payment plans)
- Commission calculation handled by database trigger for consistency
- Indexes on (agency_id, status) for fast filtering

**Commission Calculation Pattern:**
- **Formula**: `expected_commission = total_amount * (commission_rate_percent / 100)`
- **Database Trigger**: Auto-calculates on INSERT/UPDATE of total_amount or commission_rate
- **Client-Side Preview**: TypeScript utility function for real-time UI updates
- **Source of Truth**: commission_rate_percent copied from branch at payment plan creation time (not live-linked)

**State Management:**
- Use TanStack Query for payment plan data (list, detail)
- Use React Hook Form for payment plan creation form state
- Use Zod schema for validation (`packages/validations/src/payment-plan.schema.ts`)

**Date Handling:**
- Use `packages/utils/src/date-helpers.ts` for date formatting
- Store start_date in UTC
- Display in agency's configured timezone

### Project Structure Notes

**Payment Plan Components Location:**
```
apps/payments/
├── app/
│   ├── plans/
│   │   ├── page.tsx                            # Payment plans list (future)
│   │   ├── [id]/
│   │   │   └── page.tsx                        # Payment plan detail (future)
│   │   └── new/
│   │       ├── page.tsx                        # NEW: Payment plan creation
│   │       └── components/
│   │           ├── PaymentPlanForm.tsx         # NEW
│   │           ├── PaymentPlanSummary.tsx      # NEW
│   │           └── EnrollmentSelect.tsx        # NEW
```

**Shared Utilities:**
```
packages/utils/src/
├── commission-calculator.ts                    # NEW: calculateExpectedCommission()
└── formatters.ts                               # EXISTING: Currency formatting
```

**Database Migrations:**
```
supabase/migrations/003_payments_domain/
├── 001_payment_plans_schema.sql                # NEW: Payment plans table
├── 002_payment_plans_triggers.sql              # NEW: Commission calculation trigger
└── 003_payment_plans_rls.sql                   # NEW: RLS policies
```

**Validation Schemas:**
```
packages/validations/src/
└── payment-plan.schema.ts                      # NEW: Zod schema for payment plan
```

### References

**Epic Breakdown:**
- [Source: docs/epics.md#Story-4.1-Payment-Plan-Creation]
- Full acceptance criteria detailed in Epic 4, Story 4.1 (lines 639-667)

**Architecture:**
- [Source: docs/architecture.md#Payments-Domain]
- Payment plans schema defined in "Payments Domain (Epic 4, 5)" section (lines 1632-1709)
- Commission calculation pattern: "Pattern 2: Commission Calculation Engine" section (lines 462-656)

**PRD Requirements:**
- Payment plan management: FR-5 (lines 734-836)
- Commission calculation engine: FR-5.5 (lines 816-836)
- Multi-tenant data isolation requirement

**Technical Decisions:**
- Next.js 15 with App Router (Server Components for list/detail, Client Components for forms)
- Supabase PostgreSQL with RLS for multi-tenancy
- TanStack Query for client-side caching and mutations
- React Hook Form + Zod for form validation
- Database triggers for commission calculation (ensures consistency)
- Shadcn UI components (Form, Select, Input, Button, Badge)

### Learnings from Previous Story

**From Story 3.3: Student-College Enrollment Linking (Status: drafted)**

Story 3.3 established the enrollment foundation that Story 4.1 depends on:

- **Enrollments Table Created**: `enrollments` table with fields: id, student_id, branch_id, agency_id, program_name, offer_letter_url, offer_letter_filename, status
- **Foreign Key Relationship**: Story 3.3 added `enrollment_id` FK column to `payment_plans` table (migration: 008_payment_plans_fk.sql)
- **Enrollment API Routes**:
  - GET /api/enrollments/[id] (enrollment detail)
  - GET /api/students/[id]/enrollments (all enrollments for student)
  - GET /api/branches/[id]/enrollments (all enrolled students for branch)
- **Duplicate Enrollment Prevention**: Unique constraint on (student_id, branch_id, program_name)
- **RLS Policies**: Agency-level data isolation established on enrollments table

**Key Interfaces to Reuse:**
- Enrollment selection dropdown can query GET /api/enrollments API
- Enrollment display format: "Student Name - College (Branch City) - Program"
- Enrollment status filtering: Use status='active' to show only active enrollments in dropdown

**Architectural Continuity:**
- Follow same RLS pattern: agency_id filtering on payment_plans table
- Follow same audit logging pattern: log all payment plan CRUD operations
- Follow same validation pattern: Ensure enrollment exists and belongs to same agency

**Database Dependencies:**
- Payment plan creation requires enrollments table to exist (Story 3.3)
- Commission rate is fetched from branches table via enrollments.branch_id
- Agency currency setting fetched from agencies table

**UI Component Reuse:**
- Status badge component pattern from Story 3.3 can be adapted for payment plan status
- Form validation pattern with React Hook Form + Zod established in Story 3.3
- TanStack Query mutation pattern for API calls

**Important Notes:**
- Story 3.3 created the enrollments table but did NOT create installments
- Story 4.1 focuses ONLY on payment plan creation (top-level entity)
- Installments will be created in Story 4.2 (Flexible Installment Structure)
- Payment plan links to ONE enrollment via enrollment_id FK
- Commission rate is COPIED from branch at creation time (snapshot, not live-linked)

[Source: stories/3-3-student-college-enrollment-linking.md]

**Files Created by Story 3.3 (to reference):**
- Supabase migration: `002_entities_domain/006_enrollments_schema.sql`
- Supabase migration: `002_entities_domain/008_payment_plans_fk.sql` (added enrollment_id FK)
- API routes: `/api/enrollments/*`
- Components: `EnrollmentsSection.tsx`, `EnrolledStudentsSection.tsx`

**Patterns to Follow:**
- Database trigger pattern for auto-calculation (commission in 4.1, similar to enrollment creation in 3.3)
- Real-time validation and preview (similar to duplicate enrollment check in 3.3)
- Multi-step form pattern (enrollment creation was part of payment plan wizard in 3.3)

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/4-1-payment-plan-creation.context.xml](.bmad-ephemeral/stories/4-1-payment-plan-creation.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
