# Task 1: Database Schema - Installments Table

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** AC 2, 3, 6, 9
**Status:** pending

## Context

This task creates the core `installments` table that stores individual payment installments for payment plans. Each payment plan can have multiple installments, including an initial payment (installment_number = 0) and regular installments (1..N).

## Task Description

Create the `installments` table with proper constraints, foreign keys, indexes, and Row-Level Security policies.

## Subtasks

- [ ] Create `installments` table with columns:
  - id (UUID, PRIMARY KEY)
  - payment_plan_id (UUID, FK to payment_plans, NOT NULL)
  - agency_id (UUID, FK to agencies, NOT NULL)
  - installment_number (INTEGER, NOT NULL, CHECK >= 0)
  - amount (DECIMAL, NOT NULL, CHECK > 0)
  - student_due_date (DATE)
  - college_due_date (DATE)
  - is_initial_payment (BOOLEAN, NOT NULL)
  - generates_commission (BOOLEAN, NOT NULL)
  - status (TEXT, CHECK IN ('draft', 'pending', 'paid', 'overdue', 'cancelled'), NOT NULL)
  - paid_date (DATE, nullable)
  - paid_amount (DECIMAL, nullable)
  - created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
  - updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

- [ ] Add foreign key constraint: payment_plan_id → payment_plans(id) ON DELETE CASCADE
- [ ] Add CHECK constraint: installment_number >= 0
- [ ] Add CHECK constraint: amount > 0
- [ ] Add NOT NULL constraints on required fields
- [ ] Enable RLS on installments table
- [ ] Create RLS policy for SELECT: agency_id = auth.jwt() ->> 'agency_id'
- [ ] Create RLS policy for INSERT: agency_id = auth.jwt() ->> 'agency_id'
- [ ] Create RLS policy for UPDATE: agency_id = auth.jwt() ->> 'agency_id'
- [ ] Create RLS policy for DELETE: agency_id = auth.jwt() ->> 'agency_id'
- [ ] Create composite index on (payment_plan_id, installment_number) for efficient queries
- [ ] Create index on (agency_id, status) for dashboard queries

## Technical Requirements

**Migration File:** `supabase/migrations/003_payments_domain/004_installments_schema.sql`

**Key Constraints:**
- Installment numbering: 0 = initial payment, 1-N = regular installments
- All amounts must be positive decimals
- Status must be one of: 'draft', 'pending', 'paid', 'overdue', 'cancelled'
- RLS policies enforce agency-level data isolation

**Dependencies:**
- Requires `payment_plans` table from Story 4.1
- Must have `agencies` table reference

## Acceptance Criteria

✅ **AC 2:** Initial Payment Configuration
- Initial payment stored as installment_number = 0
- is_initial_payment = true flag distinguishes it from regular installments

✅ **AC 3:** Installment Configuration
- Regular installments numbered 1, 2, 3...N
- Each installment has amount, student_due_date, college_due_date

✅ **AC 6:** Due Date Configuration
- Both student_due_date and college_due_date stored per installment
- Supports dual timeline pattern (student pays before agency pays college)

✅ **AC 9:** Installment Schedule Table
- Schema supports display of installment schedule with all required fields
- Status field enables badge rendering (draft, pending, paid, overdue, cancelled)

## References

**From Story Context:**
- Story 4.2 Context XML: `.bmad-ephemeral/stories/4-2-flexible-installment-structure.context.xml`
- Epic 4 Breakdown: `docs/epics.md` (Story 4.2 section)
- Database Architecture: `docs/architecture.md` (Pattern 2: Commission Calculation Engine)

**Related Story:**
- Story 4.1 created the `payment_plans` table that this table references

## Testing Checklist

- [ ] Migration runs successfully
- [ ] All constraints enforce data integrity
- [ ] Foreign key cascade deletes work correctly
- [ ] RLS policies prevent cross-agency access
- [ ] Indexes improve query performance (verify with EXPLAIN ANALYZE)
- [ ] Can insert installment_number = 0 (initial payment)
- [ ] Can insert installments numbered 1-N
- [ ] Cannot insert negative amounts
- [ ] Cannot insert invalid status values

## Dev Notes

**Installment Numbering Pattern:**
- Initial payment: `installment_number = 0`, `is_initial_payment = true`
- Regular installments: `installment_number = 1, 2, 3...N`, `is_initial_payment = false`
- Always ORDER BY installment_number when displaying

**Dual Timeline Pattern:**
- `student_due_date`: When student must pay agency
- `college_due_date`: When agency must pay college
- Formula: `student_due_date = college_due_date - student_lead_time_days`

**Status Lifecycle:**
- draft → pending → overdue → paid
- Can transition to 'cancelled' from any status

**RLS Pattern:**
Filter all queries by `agency_id` to enforce multi-tenant data isolation. Use the same pattern as payment_plans table.
