# Story 4.4: Manual Payment Recording

Status: ready-for-dev

## Story

As an **Agency User**,
I want **to manually record when an installment is paid**,
So that **I can keep the system up-to-date and track which payments have been received**.

## Acceptance Criteria

1. **Mark Installment as Paid**
   - From payment plan detail page, user can mark any pending installment as paid
   - User records the payment date (actual date payment was received)
   - User records the actual amount paid (can differ from installment amount)
   - Payment date cannot be in the future
   - Paid amount must be positive and non-zero
   - Installment status changes from "pending" to "paid"

2. **Partial Payment Support**
   - User can record partial payments where paid_amount < installment.amount
   - System tracks paid_amount separately from installment.amount
   - Outstanding balance visible: installment.amount - paid_amount
   - Future: Allow multiple partial payments (not in this story)

3. **Payment Notes**
   - User can add optional notes to payment record (e.g., "Check #1234", "Bank transfer")
   - Notes field max 500 characters
   - Notes stored with payment record and visible in payment history

4. **Payment Plan Status Auto-Update**
   - When all installments marked as paid → payment_plan.status changes to "completed"
   - System calculates: if COUNT(installments WHERE status != 'paid') = 0 → plan complete
   - Auto-update triggers after each payment recording
   - Manual override: Agency Admin can mark plan as completed even if some installments unpaid

5. **Dashboard and Reports Reflect Updates**
   - Dashboard widgets (overdue payments, payment status summary) reflect updated payment status
   - Next due date recalculates based on remaining pending installments
   - Cash flow projection updates to show payment received
   - Commission breakdown shows updated earned commission

6. **Optimistic UI Updates**
   - Client-side optimistic update: UI instantly reflects "paid" status before API confirmation
   - If API fails, UI reverts to previous state and shows error message
   - TanStack Query invalidates payment plan detail and list queries after successful mutation

7. **Data Isolation**
   - All payment recording operations filtered by agency_id (via RLS)
   - Users can only record payments for installments in their agency
   - Prevent recording payments for other agencies' installments

## Tasks / Subtasks

- [ ] **Task 1: Record Payment API** (AC: 1, 2, 3, 4, 7)
  - [ ] Implement POST /api/installments/[id]/record-payment
  - [ ] Request body validation using Zod schema:
    ```typescript
    {
      paid_date: string (ISO date format),
      paid_amount: number (positive, max 2 decimal places),
      notes?: string (max 500 chars)
    }
    ```
  - [ ] Validate paid_date is not in the future (server-side check)
  - [ ] Validate paid_amount > 0 and <= installment.amount * 1.1 (allow 10% overpayment buffer)
  - [ ] Update installment record: SET status = 'paid', paid_date, paid_amount, payment_notes
  - [ ] Check if all installments paid: COUNT(installments WHERE status != 'paid' AND payment_plan_id = X) = 0
  - [ ] If all paid → UPDATE payment_plans SET status = 'completed' WHERE id = X
  - [ ] Apply RLS filtering by agency_id (ensure installment belongs to user's agency)
  - [ ] Return updated installment and payment plan status
  - [ ] Add error handling: 404 if installment not found, 400 if validation fails, 403 if wrong agency

- [ ] **Task 2: Mark as Paid UI Component** (AC: 1, 2, 3, 6)
  - [ ] Create MarkAsPaidModal component (Shadcn Dialog)
  - [ ] Modal triggered from "Mark as Paid" button on each pending installment row
  - [ ] Form fields:
    - Paid Date: Date picker (default: today, max: today)
    - Paid Amount: Number input (default: installment.amount, pre-filled, editable)
    - Notes: Textarea (optional, max 500 chars, character counter)
  - [ ] Show installment details in modal header: Installment #N, Amount: $X, Due: Y
  - [ ] Form validation with React Hook Form + Zod:
    - paid_date required, cannot be future
    - paid_amount required, positive, max 2 decimals
    - notes max 500 chars
  - [ ] Submit button: "Record Payment"
  - [ ] Cancel button: Closes modal without saving
  - [ ] Show validation errors inline (field-level)

- [ ] **Task 3: TanStack Query Mutation for Payment Recording** (AC: 6)
  - [ ] Create useRecordPayment mutation hook
  - [ ] Optimistic update:
    - Immediately update installment status to "paid" in cache
    - Update paid_date and paid_amount in cache
    - Update payment plan status if this was the last pending installment
  - [ ] On mutation success:
    - Invalidate queries: ['payment-plans', planId], ['payment-plans'], ['dashboard', 'payment-status']
    - Show success toast: "Payment recorded successfully"
    - Close modal
  - [ ] On mutation error:
    - Revert optimistic update
    - Show error toast with error message
    - Keep modal open with form data intact
  - [ ] Mutation function: POST /api/installments/[id]/record-payment

- [ ] **Task 4: Payment Plan Detail Page Updates** (AC: 1, 4, 5)
  - [ ] Update InstallmentsList component (from Story 4.3) to include "Mark as Paid" button
  - [ ] Button appears only for installments with status = 'pending'
  - [ ] Already paid installments show:
    - Status badge: "Paid" (green)
    - Paid date (formatted)
    - Paid amount (if different from installment amount, show both)
    - Payment notes (if any) in tooltip or expandable row
  - [ ] Add payment progress bar at top of installments section:
    - "X of Y installments paid"
    - "$X of $Y paid"
    - Visual progress bar (green fill)
  - [ ] Recalculate next_due_date when payment recorded:
    - MIN(student_due_date) WHERE status = 'pending'
  - [ ] Update plan status badge if status changes to "completed"

- [ ] **Task 5: Dashboard Widget Updates** (AC: 5)
  - [ ] Ensure PaymentStatusWidget (Story 5.4) reflects payment recordings
  - [ ] Query invalidation triggers widget refresh
  - [ ] Verify widget shows updated counts:
    - Pending payments count decreases
    - Paid payments count increases
    - Overdue payments count decreases (if overdue installment paid)
    - Due soon count decreases (if due soon installment paid)
  - [ ] Verify cash flow projection updates (if implemented in Story 6.2)

- [ ] **Task 6: Partial Payment Display** (AC: 2)
  - [ ] If paid_amount < installment.amount:
    - Show "Partial Payment" badge next to "Paid" status
    - Display: "Paid: $X of $Y"
    - Calculate outstanding: installment.amount - paid_amount
    - Show outstanding balance in installment row or tooltip
  - [ ] Future enhancement placeholder comment: "Allow multiple partial payments (Story 4.6)"
  - [ ] For now: One payment per installment (status changes to 'paid' even if partial)

- [ ] **Task 7: Audit Logging** (AC: Foundation for Epic 8)
  - [ ] Log payment recording event to audit_logs table:
    - user_id: current authenticated user
    - action_type: 'payment_recorded'
    - entity_type: 'installment'
    - entity_id: installment.id
    - new_values: { paid_date, paid_amount, status: 'paid', notes }
    - old_values: { status: 'pending' }
    - timestamp, ip_address, user_agent
  - [ ] Log payment plan status change if triggered:
    - action_type: 'payment_plan_completed'
    - entity_type: 'payment_plan'
    - entity_id: payment_plan.id
    - new_values: { status: 'completed' }
    - old_values: { status: 'active' }

- [ ] **Task 8: Commission Recalculation** (AC: 5, foundation for Story 4.5)
  - [ ] After payment recorded, recalculate earned_commission for payment plan:
    - earned_commission = (SUM(paid_amount WHERE status='paid') / total_amount) * expected_commission
  - [ ] Update payment_plan.earned_commission field (cached value for performance)
  - [ ] Alternatively: Use database view or computed column (preferred for real-time accuracy)
  - [ ] Ensure commission breakdown widget (Story 6.3) reflects updated earned commission

- [ ] **Task 9: Testing** (AC: All)
  - [ ] Write integration test: POST /api/installments/[id]/record-payment
    - Test successful payment recording
    - Test paid_date validation (cannot be future)
    - Test paid_amount validation (positive, non-zero)
    - Test RLS: user cannot record payment for other agency's installment
    - Test payment plan status auto-update when all installments paid
    - Test partial payment: paid_amount < installment.amount
  - [ ] Write E2E test: Mark installment as paid flow
    - Navigate to payment plan detail page
    - Click "Mark as Paid" on pending installment
    - Fill form with paid_date, paid_amount, notes
    - Submit form
    - Verify installment status changes to "paid"
    - Verify payment plan status changes to "completed" if last installment
    - Verify dashboard widget updates
  - [ ] Test optimistic updates: UI updates before API response
  - [ ] Test error handling: API failure reverts optimistic update
  - [ ] Test partial payment display
  - [ ] Test payment notes display

- [ ] **Task 10: Payment History Timeline (Optional Enhancement)** (AC: 5, foundation for Epic 8)
  - [ ] Add "Payment History" section to payment plan detail page
  - [ ] Display chronological list of all payment recordings:
    - Timestamp (relative: "2 days ago")
    - User who recorded payment
    - Installment number
    - Amount paid
    - Notes (if any)
  - [ ] Query audit_logs filtered by payment_plan_id and action_type='payment_recorded'
  - [ ] Display as timeline or table
  - [ ] Future: Link to Epic 8 Story 8.4 (Change History for Payment Plans)

## Dev Notes

### Architecture Patterns and Constraints

**Multi-Zone Architecture:**
- Payment recording lives in `apps/payments/` zone
- API route: `apps/payments/app/api/installments/[id]/record-payment/route.ts`
- Uses `packages/database` for Supabase client
- Audit logging uses shared `packages/utils/src/audit-logger.ts` (create if not exists)

**Server Actions vs API Routes:**
- Use API Routes (POST /api/installments/[id]/record-payment) for mutation consistency
- TanStack Query mutation on client side
- Server-side validation with Zod schema from `packages/validations`

**Optimistic Updates Pattern:**
- TanStack Query mutation with optimistic update
- Update cache immediately before API call
- Revert cache on error, invalidate on success
- Provides instant feedback for better UX

**Database Patterns:**
- Single transaction: UPDATE installment + UPDATE payment_plan (if all paid)
- Use Supabase RPC function for atomic operation (optional)
- RLS policies enforce agency_id filtering
- Audit logging via database trigger or API route insert

**Commission Calculation:**
- Recalculate earned_commission after each payment
- Store in payment_plan.earned_commission (cached value)
- Or use database view: `payment_plans_with_commission` (real-time accuracy)
- Formula: (SUM(paid_amount) / total_amount) * expected_commission

**Date Handling:**
- Store paid_date in UTC in database
- Display in agency's configured timezone
- Validate paid_date <= today (server-side and client-side)
- Use `packages/utils/src/date-helpers.ts` for formatting

**Currency Formatting:**
- Use `packages/utils/src/formatters.ts` formatCurrency()
- Display agency.currency symbol
- Format with 2 decimal places and thousands separators

### Project Structure Notes

**Payment Recording Components:**
```
apps/payments/
├── app/
│   ├── plans/
│   │   ├── [id]/
│   │   │   └── components/
│   │   │       ├── MarkAsPaidModal.tsx           # NEW: Modal dialog for recording payment
│   │   │       ├── PaymentHistoryTimeline.tsx    # NEW: Optional payment history display
│   │   │       └── InstallmentsList.tsx          # MODIFIED: Add "Mark as Paid" button
│   │   └── components/
│   │       └── PaymentPlanDetail.tsx             # MODIFIED: Add payment progress bar
│   └── api/
│       └── installments/
│           └── [id]/
│               └── record-payment/
│                   └── route.ts                  # NEW: POST endpoint for recording payment
```

**Shared Utilities:**
```
packages/validations/src/
└── installment.schema.ts                         # NEW: Zod schema for recordPayment

packages/utils/src/
├── audit-logger.ts                               # NEW: Shared audit logging utility
└── commission-calculator.ts                      # EXISTING: Add calculateEarnedCommission()
```

**Database Updates:**
```
supabase/migrations/003_payments_domain/
└── 006_payment_recording.sql                     # NEW: Add payment_notes to installments, triggers
```

**TanStack Query Hooks:**
```
apps/payments/app/plans/[id]/hooks/
└── useRecordPayment.ts                           # NEW: Mutation hook with optimistic updates
```

### Learnings from Previous Story

**From Story 4.3: Payment Plan List and Detail Views (Status: drafted)**

Story 4.3 created the payment plan detail page and installments list that Story 4.4 will extend with payment recording functionality:

- **InstallmentsList Component Created**: Displays all installments in table format with columns: Installment #, Amount, Student Due Date, College Due Date, Status, Paid Date
- **Payment Plan Detail Page**: `/payments/plans/[id]/page.tsx` shows plan overview, student info, enrollment details, commission breakdown, and installments list
- **TanStack Query Integration**: usePaymentPlanDetail query hook fetches plan data with nested installments
- **Status Badge Component**: PaymentPlanStatusBadge displays status indicators (pending/paid/overdue/cancelled)
- **RLS Enforcement**: All queries filtered by agency_id via Supabase RLS policies

**Key Interfaces to Reuse:**
- InstallmentsList component: Add "Mark as Paid" button column for pending installments
- PaymentPlanDetail component: Add payment progress bar and auto-refresh on payment recording
- usePaymentPlanDetail hook: Invalidate after payment mutation to trigger refetch
- Status badge component: Reuse for "Paid", "Partial Payment" badges

**Database Dependencies:**
- installments table (Story 4.2): id, payment_plan_id, installment_number, amount, student_due_date, college_due_date, status, paid_date, paid_amount, is_initial_payment, generates_commission
- Need to add: payment_notes field (max 500 chars, TEXT, nullable)
- payment_plans table (Story 4.1): id, status, total_amount, expected_commission, earned_commission

**Architectural Continuity:**
- Follow same TanStack Query pattern: mutation with optimistic updates
- Follow same RLS pattern: agency_id filtering on all mutations
- Follow same Server Component + Client Component pattern
- Use same Shadcn UI components: Dialog, Form, DatePicker, Input, Textarea, Button

**Important Notes:**
- Story 4.4 extends InstallmentsList component from Story 4.3 with "Mark as Paid" functionality
- Payment recording triggers payment plan status auto-update (active → completed)
- Dashboard widgets (Story 5.4) must reflect payment recordings via query invalidation
- Audit logging lays foundation for Epic 8 (Audit & Compliance)
- Commission recalculation lays foundation for Story 4.5 (Commission Calculation Engine)

**UI Component Reuse:**
- InstallmentsList table component from Story 4.3 (add action column)
- Status badge component from Story 4.3 (add "Paid", "Partial Payment" variants)
- Currency formatting from Story 4.3
- Date formatting from Story 4.3
- TanStack Query patterns from Story 4.3 (mutations with optimistic updates)

**Files to Modify from Story 4.3:**
- `apps/payments/app/plans/[id]/components/InstallmentsList.tsx`: Add "Mark as Paid" button
- `apps/payments/app/plans/[id]/components/PaymentPlanDetail.tsx`: Add payment progress bar
- `apps/payments/app/plans/[id]/hooks/usePaymentPlanDetail.ts`: Invalidate after payment mutation

**New Files to Create:**
- `apps/payments/app/plans/[id]/components/MarkAsPaidModal.tsx`: Payment recording modal
- `apps/payments/app/api/installments/[id]/record-payment/route.ts`: API endpoint
- `apps/payments/app/plans/[id]/hooks/useRecordPayment.ts`: Mutation hook
- `packages/validations/src/installment.schema.ts`: Zod schema for payment recording
- `packages/utils/src/audit-logger.ts`: Shared audit logging utility (if not exists)
- `supabase/migrations/003_payments_domain/006_payment_recording.sql`: Add payment_notes field

**Patterns to Follow:**
- Optimistic updates: Instant UI feedback, revert on error
- Mutation invalidation: Invalidate payment plan detail, list, and dashboard queries
- Server-side validation: Zod schema on API route
- Client-side validation: React Hook Form + Zod on form
- Audit logging: Log all payment recordings with user context
- RLS enforcement: agency_id filtering on all mutations
- Error handling: Show toast notifications, revert optimistic updates on failure

[Source: stories/4-3-payment-plan-list-and-detail-views.md]

### References

**Epic Breakdown:**
- [Source: docs/epics.md#Story-4.4-Manual-Payment-Recording]
- Full acceptance criteria: lines 772-802
- Prerequisites: Story 4.3 (Payment Plan List and Detail Views)

**Architecture:**
- [Source: docs/architecture.md#Payment-Recording]
- API endpoint specification: POST /api/installments/[id]/record-payment
- Optimistic updates pattern: lines 1112-1123 (Server Component + TanStack Query)
- Audit logging pattern: Epic 8 foundation

**PRD Requirements:**
- Payment recording: FR-5.3 (Record installment payments manually)
- Commission tracking: FR-5.4 (Track earned commission based on payments received)
- Audit trail: NFR-4 (All payment changes must be logged)

**Technical Decisions:**
- TanStack Query mutations with optimistic updates for instant feedback
- Supabase RLS for multi-tenancy and security
- Server-side and client-side validation with Zod
- Audit logging via database triggers or API route inserts
- Currency and date formatting via shared utilities

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml](.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
