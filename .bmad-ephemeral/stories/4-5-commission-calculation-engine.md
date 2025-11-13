# Story 4.5: Commission Calculation Engine

Status: ready-for-dev

## Story

As an **Agency User**,
I want **commissions to be automatically calculated based on actual payments received**,
So that **I know exactly how much commission I'm entitled to claim from each college**.

## Acceptance Criteria

1. **Draft Installment Calculation During Payment Plan Creation**
   - When user inputs total_amount, number_of_installments, and frequency in payment plan wizard
   - System automatically calculates: installment_amount = total_amount / number_of_installments
   - System generates draft installments with calculated amounts and due dates based on frequency
   - Draft installments presented to user for review and approval before saving to database
   - User can manually adjust individual installment amounts (must total to payment plan total)
   - Final installment auto-adjusts to account for rounding differences
   - Validation: SUM(installment amounts) must equal payment_plan.total_amount

2. **Earned Commission Calculation Based on Payments**
   - When installments are marked as paid, system automatically recalculates earned commission
   - Formula: earned_commission = (SUM(paid_amount WHERE status='paid') / total_amount) * expected_commission
   - Earned commission updates in real-time as payments are recorded
   - Commission only counted for installments with status = "paid"
   - Partial payments contribute proportionally to earned commission

3. **Per-Payment-Plan Commission Tracking**
   - Payment plan detail page displays:
     - Expected commission (based on total_amount * commission_rate)
     - Earned commission (based on actual paid amounts)
     - Outstanding commission (expected - earned)
     - Commission progress bar: earned / expected
     - Percentage of commission earned: (earned / expected) * 100
   - Commission values update immediately when payment recorded (via query invalidation)

4. **Per-College/Branch Commission Aggregation**
   - Agency can view total earned commission per college/branch
   - Aggregation: GROUP BY college_id, branch_id; SUM(earned_commission)
   - Includes columns: College Name, Branch Name, Expected Commission, Earned Commission, Outstanding Commission
   - Sortable and filterable by college, branch, and date range
   - Drill-down: Click college/branch to see contributing payment plans

5. **Dashboard Commission Summary**
   - Dashboard displays "Total Outstanding Commission" widget showing:
     - Total expected commission across all active payment plans
     - Total earned commission (sum of all earned commission)
     - Total outstanding commission (expected - earned)
     - Trend indicator: change vs. last month
   - Widget updates in real-time as payments recorded (query invalidation)

6. **Non-Commissionable Fees Exclusion**
   - Commission calculations exclude non-commissionable fees (materials_cost, admin_fees, other_fees)
   - Commissionable amount = total_amount - (materials_cost + admin_fees + other_fees)
   - Installments linked to non-commissionable fees (generates_commission = false) excluded from commission calculations
   - UI clearly distinguishes commission-eligible vs non-commission items

7. **Data Isolation and Performance**
   - All commission calculations filtered by agency_id via RLS
   - Use cached earned_commission field on payment_plans table for performance
   - Recalculate and update earned_commission field on every payment recording
   - Optional: Database view payment_plans_with_commission for real-time calculation without caching

## Tasks / Subtasks

- [ ] **Task 1: Draft Installment Calculation Logic** (AC: 1)
  - [ ] Create calculateInstallmentSchedule utility function in packages/utils/src/commission-calculator.ts
  - [ ] Function inputs: { total_amount, number_of_installments, frequency, start_date, student_lead_time_days }
  - [ ] Function outputs: Array of draft installments with:
    - installment_number (1-N)
    - amount (calculated, with final installment adjusted for rounding)
    - student_due_date (calculated based on frequency and start_date)
    - college_due_date (student_due_date + student_lead_time_days)
    - status: 'draft'
  - [ ] Frequency calculation:
    - Monthly: Add 1 month between installments using date-fns addMonths()
    - Quarterly: Add 3 months between installments
    - Custom: Handled manually by user (not auto-calculated)
  - [ ] Rounding handling:
    - Calculate base_amount = Math.floor((total_amount / number_of_installments) * 100) / 100
    - Distribute base_amount to all installments except last
    - Final installment = total_amount - SUM(installments 1 to N-1)
  - [ ] Validation: SUM(installments) === total_amount (throw error if not equal)

- [ ] **Task 2: Payment Plan Wizard Draft Review Step** (AC: 1)
  - [ ] Modify PaymentPlanWizard component (Step 2: Payment Structure)
  - [ ] After user inputs number_of_installments and frequency:
    - Call calculateInstallmentSchedule()
    - Display draft installments in read-only table for review
    - Show: Installment #, Amount, Student Due Date, College Due Date
  - [ ] Add "Edit Amounts" button to enable manual adjustment mode
  - [ ] In edit mode:
    - Make amount fields editable (number inputs)
    - Show running total: SUM(installment amounts) and compare to total_amount
    - Show validation error if SUM != total_amount: "Installments must total ${total_amount}"
    - Disable "Next" button until SUM === total_amount
  - [ ] Add "Reset to Auto-Calculated" button to revert manual changes
  - [ ] Final installment amount auto-adjusts as user edits other installments

- [ ] **Task 3: Earned Commission Calculation Utility** (AC: 2, 6)
  - [ ] Create calculateEarnedCommission function in packages/utils/src/commission-calculator.ts
  - [ ] Function inputs: { installments: Installment[], total_amount, expected_commission, materials_cost, admin_fees, other_fees }
  - [ ] Calculate commissionable_amount = total_amount - (materials_cost + admin_fees + other_fees)
  - [ ] Filter installments: WHERE generates_commission = true AND status = 'paid'
  - [ ] Calculate total_paid = SUM(paid_amount) for filtered installments
  - [ ] Calculate earned_commission = (total_paid / commissionable_amount) * expected_commission
  - [ ] Return: { earned_commission, total_paid, commissionable_amount, commission_percentage }
  - [ ] Handle edge case: If commissionable_amount = 0, earned_commission = 0

- [ ] **Task 4: Update Payment Recording to Recalculate Commission** (AC: 2)
  - [ ] Modify POST /api/installments/[id]/record-payment from Story 4.4
  - [ ] After updating installment status to 'paid':
    - Fetch payment plan with all installments
    - Call calculateEarnedCommission()
    - UPDATE payment_plans SET earned_commission = calculated_value WHERE id = payment_plan_id
  - [ ] Return updated payment plan with new earned_commission in response
  - [ ] TanStack Query mutation invalidates: ['payment-plans', planId], ['dashboard', 'commission-summary']

- [ ] **Task 5: Payment Plan Detail Commission Display** (AC: 3)
  - [ ] Add CommissionSummary component to payment plan detail page
  - [ ] Component displays:
    - Expected Commission: formatCurrency(payment_plan.expected_commission)
    - Earned Commission: formatCurrency(payment_plan.earned_commission) (green text)
    - Outstanding Commission: formatCurrency(expected - earned) (red if positive)
    - Commission Progress Bar: Visual bar showing earned / expected percentage
    - Percentage Earned: ((earned / expected) * 100).toFixed(1) + '%'
  - [ ] Commission values fetch from payment_plan.expected_commission and payment_plan.earned_commission
  - [ ] Update in real-time via query invalidation when payment recorded
  - [ ] Handle edge case: If expected_commission = 0, show "N/A" or "No commission expected"

- [ ] **Task 6: Commission by College/Branch Report** (AC: 4)
  - [ ] Create GET /api/reports/commission-by-college API route
  - [ ] Query parameters: { date_from, date_to, college_id?, branch_id? }
  - [ ] SQL query:
    ```sql
    SELECT
      colleges.id, colleges.name AS college_name,
      branches.id AS branch_id, branches.name AS branch_name,
      SUM(payment_plans.expected_commission) AS total_expected,
      SUM(payment_plans.earned_commission) AS total_earned,
      SUM(payment_plans.expected_commission - payment_plans.earned_commission) AS total_outstanding,
      COUNT(payment_plans.id) AS plan_count
    FROM payment_plans
    JOIN enrollments ON payment_plans.enrollment_id = enrollments.id
    JOIN branches ON enrollments.branch_id = branches.id
    JOIN colleges ON branches.college_id = colleges.id
    WHERE payment_plans.agency_id = current_agency_id
      AND payment_plans.status = 'active'
      [AND payment_plans.created_at BETWEEN date_from AND date_to]
      [AND colleges.id = college_id]
      [AND branches.id = branch_id]
    GROUP BY colleges.id, branches.id
    ORDER BY total_earned DESC
    ```
  - [ ] Return JSON: [{ college_id, college_name, branch_id, branch_name, total_expected, total_earned, total_outstanding, plan_count }]
  - [ ] RLS enforcement: agency_id filtering

- [ ] **Task 7: Commission by College/Branch Report Page** (AC: 4)
  - [ ] Create /reports/commissions/by-college page in reports zone
  - [ ] CommissionByCollegeReport component with filters:
    - Date range picker (default: All time)
    - College filter dropdown (optional)
    - Branch filter dropdown (optional, dependent on college selection)
  - [ ] Display results in sortable table (TanStack Table):
    - Columns: College, Branch, Expected Commission, Earned Commission, Outstanding Commission, # of Plans
    - Sort by any column (default: Earned Commission DESC)
    - Click row to drill down to payment plans list filtered by college/branch
  - [ ] Show summary row at bottom: Total Expected, Total Earned, Total Outstanding across all colleges
  - [ ] Export to CSV button (reuse CSV export logic from Story 7.2)

- [ ] **Task 8: Dashboard Commission Summary Widget** (AC: 5)
  - [ ] Create CommissionSummaryWidget component for dashboard
  - [ ] Implement GET /api/dashboard/commission-summary API route
  - [ ] Query:
    ```sql
    SELECT
      SUM(expected_commission) AS total_expected,
      SUM(earned_commission) AS total_earned,
      SUM(expected_commission - earned_commission) AS total_outstanding
    FROM payment_plans
    WHERE agency_id = current_agency_id AND status = 'active'
    ```
  - [ ] Calculate trend: Compare to last month's total_earned (requires monthly_metrics table or date range query)
  - [ ] Widget displays:
    - Total Expected Commission (large number, currency formatted)
    - Total Earned Commission (green, currency formatted)
    - Total Outstanding Commission (red if > 0, currency formatted)
    - Trend indicator: ↑ X% vs last month (or ↓ if decreased)
  - [ ] Widget refreshes on payment recording via query invalidation
  - [ ] Click widget to navigate to /reports/commissions/by-college

- [ ] **Task 9: Non-Commissionable Fees Handling** (AC: 6)
  - [ ] Update payment plan creation to store materials_cost, admin_fees, other_fees (fields added in Story 4.2)
  - [ ] Update installments table to include generates_commission BOOLEAN field (default: true)
  - [ ] When creating installments:
    - Installments for tuition: generates_commission = true
    - Installments for fees (materials, admin, other): generates_commission = false
  - [ ] Update calculateEarnedCommission to filter: WHERE generates_commission = true
  - [ ] Update commission display:
    - Show "Commission-Eligible Amount: $X" (total_amount - fees)
    - Show "Non-Commissionable Fees: $Y" (materials + admin + other)
    - Show "Total Course Value: $Z" (total_amount)
  - [ ] Installments table shows "Commission" column: "Yes" or "No" badge

- [ ] **Task 10: Database View for Real-Time Commission Calculation (Optional)** (AC: 7)
  - [ ] Create database view: payment_plans_with_commission
  - [ ] View includes all payment_plan fields plus:
    - total_paid: SUM(installments.paid_amount WHERE status='paid' AND generates_commission=true)
    - commissionable_amount: total_amount - (materials_cost + admin_fees + other_fees)
    - earned_commission: (total_paid / commissionable_amount) * expected_commission
    - commission_percentage: (earned_commission / expected_commission) * 100
  - [ ] View definition:
    ```sql
    CREATE VIEW payment_plans_with_commission AS
    SELECT
      pp.*,
      COALESCE(SUM(i.paid_amount) FILTER (WHERE i.status = 'paid' AND i.generates_commission = true), 0) AS total_paid,
      pp.total_amount - (pp.materials_cost + pp.admin_fees + pp.other_fees) AS commissionable_amount,
      CASE
        WHEN (pp.total_amount - (pp.materials_cost + pp.admin_fees + pp.other_fees)) > 0
        THEN (COALESCE(SUM(i.paid_amount) FILTER (WHERE i.status = 'paid' AND i.generates_commission = true), 0) /
              (pp.total_amount - (pp.materials_cost + pp.admin_fees + pp.other_fees))) * pp.expected_commission
        ELSE 0
      END AS earned_commission_calculated,
      CASE
        WHEN pp.expected_commission > 0
        THEN ((COALESCE(SUM(i.paid_amount) FILTER (WHERE i.status = 'paid' AND i.generates_commission = true), 0) /
               (pp.total_amount - (pp.materials_cost + pp.admin_fees + pp.other_fees))) * pp.expected_commission /
              pp.expected_commission) * 100
        ELSE 0
      END AS commission_percentage
    FROM payment_plans pp
    LEFT JOIN installments i ON i.payment_plan_id = pp.id
    GROUP BY pp.id
    ```
  - [ ] Query from view instead of cached earned_commission field for maximum accuracy
  - [ ] Trade-off: View calculation adds query time vs cached field (benchmark both)

- [ ] **Task 11: Testing** (AC: All)
  - [ ] Write unit tests for calculateInstallmentSchedule:
    - Test monthly frequency calculation (correct due dates)
    - Test quarterly frequency calculation
    - Test rounding: SUM(installments) === total_amount
    - Test final installment adjustment
    - Test validation: Throw error if SUM != total_amount
  - [ ] Write unit tests for calculateEarnedCommission:
    - Test basic calculation: (paid / total) * expected
    - Test non-commissionable fees exclusion
    - Test generates_commission = false installments excluded
    - Test partial payments contribute proportionally
    - Test edge case: commissionable_amount = 0
  - [ ] Write integration test: POST /api/installments/[id]/record-payment updates earned_commission
  - [ ] Write integration test: GET /api/reports/commission-by-college returns correct aggregations
  - [ ] Write E2E test: Payment plan creation with draft installment review
    - Enter total_amount, number_of_installments, frequency
    - Verify draft installments displayed correctly
    - Edit installment amounts manually
    - Verify validation: SUM must equal total_amount
    - Submit and verify installments saved
  - [ ] Write E2E test: Commission updates when payment recorded
    - Record payment for installment
    - Verify earned_commission updates on payment plan detail page
    - Verify dashboard commission widget updates
    - Verify commission by college report updates

- [ ] **Task 12: Migration and Data Seeding** (AC: 7)
  - [ ] Create migration: supabase/migrations/003_payments_domain/007_commission_calculations.sql
  - [ ] Migration adds:
    - payment_plans.earned_commission DECIMAL (default: 0) - cached value
    - installments.generates_commission BOOLEAN (default: true)
    - Database view: payment_plans_with_commission (if using view approach)
    - Index: CREATE INDEX idx_installments_paid_commission ON installments(payment_plan_id, status, generates_commission)
  - [ ] Backfill earned_commission for existing payment plans:
    ```sql
    UPDATE payment_plans pp
    SET earned_commission = (
      SELECT COALESCE(
        (SUM(i.paid_amount) FILTER (WHERE i.status = 'paid' AND i.generates_commission = true) /
         NULLIF(pp.total_amount - (pp.materials_cost + pp.admin_fees + pp.other_fees), 0)) * pp.expected_commission,
        0
      )
      FROM installments i
      WHERE i.payment_plan_id = pp.id
    )
    WHERE pp.agency_id IS NOT NULL
    ```
  - [ ] Backfill generates_commission for existing installments (default: true)

## Dev Notes

### Architecture Patterns and Constraints

**Multi-Zone Architecture:**
- Commission calculation utilities live in `packages/utils/src/commission-calculator.ts` (shared across zones)
- Payment plan wizard in `apps/payments/` zone
- Reports zone: `apps/reports/` for commission reports
- Dashboard zone: `apps/dashboard/` for commission summary widget

**Calculation Strategy Options:**

1. **Cached Field Approach (Recommended for MVP):**
   - Store earned_commission as a field on payment_plans table
   - Recalculate and update on every payment recording
   - Pros: Fast queries, simple to implement
   - Cons: Risk of stale data if calculation logic changes

2. **Database View Approach (More Accurate):**
   - Create payment_plans_with_commission view
   - Calculate earned_commission on-the-fly via SQL aggregation
   - Pros: Always accurate, no stale data risk
   - Cons: Slower queries (requires JOIN and SUM on every read)

**Recommendation:** Use cached field for MVP (performance), add database view as fallback for audit/reconciliation.

**Commission Calculation Formula:**

```typescript
// Exclude non-commissionable fees from commission calculation
const commissionableAmount = totalAmount - (materialsCost + adminFees + otherFees);

// Filter only commission-eligible paid installments
const totalPaid = installments
  .filter(i => i.status === 'paid' && i.generatesCommission === true)
  .reduce((sum, i) => sum + i.paidAmount, 0);

// Calculate earned commission proportionally
const earnedCommission = (totalPaid / commissionableAmount) * expectedCommission;
```

**Rounding Strategy for Installments:**

```typescript
// Distribute evenly, adjust final installment for rounding
const baseAmount = Math.floor((totalAmount / numInstallments) * 100) / 100;
const installments = Array(numInstallments - 1).fill(baseAmount);
const finalAmount = totalAmount - (baseAmount * (numInstallments - 1));
installments.push(finalAmount);

// Validation: Ensure SUM equals total
if (installments.reduce((a, b) => a + b, 0) !== totalAmount) {
  throw new Error('Installment amounts do not total to payment plan amount');
}
```

**Date Calculation for Installments:**

```typescript
import { addMonths, addDays } from 'date-fns';

const calculateInstallmentDates = (startDate: Date, frequency: 'monthly' | 'quarterly', count: number, leadTimeDays: number) => {
  const increment = frequency === 'monthly' ? 1 : 3;
  return Array.from({ length: count }, (_, i) => {
    const collegeDueDate = addMonths(startDate, i * increment);
    const studentDueDate = addDays(collegeDueDate, -leadTimeDays);
    return { studentDueDate, collegeDueDate };
  });
};
```

**Performance Considerations:**
- Index installments table: (payment_plan_id, status, generates_commission) for fast SUM queries
- Consider caching commission aggregations (college/branch totals) in materialized view if large dataset
- Use database view for real-time accuracy, cached field for performance-critical queries (dashboard)

**Testing Strategy:**
- Unit tests: Commission calculation logic (edge cases, rounding, fees exclusion)
- Integration tests: API routes return correct commission values
- E2E tests: User workflow from payment plan creation to commission tracking
- Performance tests: Benchmark view vs cached field query times with 1000+ payment plans

### Project Structure Notes

**Commission Calculation Utilities:**
```
packages/utils/src/
├── commission-calculator.ts                  # NEW: Core commission calculation logic
│   ├── calculateInstallmentSchedule()        # Draft installment generator
│   ├── calculateEarnedCommission()           # Earned commission calculator
│   └── validateInstallmentTotal()            # Validation helper
└── formatters.ts                             # EXISTING: Currency formatting
```

**Payment Plan Wizard Updates:**
```
apps/payments/app/plans/new/
├── components/
│   ├── PaymentPlanWizard.tsx                 # MODIFIED: Add draft review step
│   ├── DraftInstallmentsReview.tsx           # NEW: Draft installments table with edit mode
│   └── CommissionSummary.tsx                 # NEW: Commission display component
```

**Payment Plan Detail Updates:**
```
apps/payments/app/plans/[id]/
├── components/
│   ├── PaymentPlanDetail.tsx                 # MODIFIED: Add CommissionSummary component
│   ├── CommissionSummary.tsx                 # NEW: Expected/Earned/Outstanding display
│   └── InstallmentsList.tsx                  # MODIFIED: Add "Commission" column
```

**Reports Zone:**
```
apps/reports/app/
├── commissions/
│   └── by-college/
│       ├── page.tsx                          # NEW: Commission by college report
│       └── components/
│           ├── CommissionByCollegeTable.tsx  # NEW: Sortable table
│           └── CommissionFilters.tsx         # NEW: Date/college/branch filters
└── api/
    └── commission-by-college/
        └── route.ts                          # NEW: GET endpoint for commission aggregation
```

**Dashboard Zone:**
```
apps/dashboard/app/
├── components/
│   ├── CommissionSummaryWidget.tsx           # NEW: Total commission overview
│   └── widgets.tsx                           # MODIFIED: Add CommissionSummaryWidget
└── api/
    └── commission-summary/
        └── route.ts                          # NEW: GET endpoint for dashboard summary
```

**Database Updates:**
```
supabase/migrations/003_payments_domain/
├── 007_commission_calculations.sql           # NEW: earned_commission field, generates_commission field
└── 008_commission_view.sql                   # OPTIONAL: payment_plans_with_commission view
```

**Shared Validations:**
```
packages/validations/src/
└── payment-plan.schema.ts                    # MODIFIED: Add installment draft validation
```

### Learnings from Previous Story

**From Story 4.4: Manual Payment Recording (Status: drafted)**

Story 4.4 implemented payment recording functionality that Story 4.5 will extend with commission recalculation:

- **Payment Recording API Created**: POST /api/installments/[id]/record-payment updates installment status to 'paid' and records paid_date, paid_amount, payment_notes
- **Payment Plan Status Auto-Update**: When all installments paid → payment_plan.status = 'completed'
- **MarkAsPaidModal Component**: Dialog for recording payments with validation (paid_date, paid_amount, notes)
- **Optimistic Updates Pattern**: TanStack Query mutation with immediate UI update, revert on error
- **Query Invalidation**: Payment recording invalidates ['payment-plans', planId], ['payment-plans'], ['dashboard', 'payment-status']
- **Audit Logging**: All payment recordings logged to audit_logs table with user context
- **Partial Payment Support**: User can record paid_amount < installment.amount

**Key Interfaces to Extend:**
- POST /api/installments/[id]/record-payment: Add commission recalculation after payment recording
- useRecordPayment mutation hook: Invalidate commission-related queries on success
- PaymentPlanDetail component: Add CommissionSummary to display earned commission
- Dashboard: Add CommissionSummaryWidget to show total outstanding commission

**Database Dependencies:**
- installments table: id, payment_plan_id, amount, paid_amount, status, generates_commission (NEW)
- payment_plans table: id, total_amount, expected_commission, earned_commission (NEW), materials_cost, admin_fees, other_fees
- Need to add: earned_commission field to payment_plans (cached calculated value)
- Need to add: generates_commission BOOLEAN to installments (default: true)

**Architectural Continuity:**
- Follow same TanStack Query pattern for commission queries: useCommissionSummary, useCommissionByCollege
- Follow same RLS pattern: agency_id filtering on all commission queries
- Reuse payment recording mutation from Story 4.4, extend with commission recalculation
- Use same Shadcn UI components: Card, Table, Badge, Progress for commission display

**Important Notes:**
- Story 4.5 extends payment recording from Story 4.4 with automatic commission recalculation
- Commission calculation excludes non-commissionable fees (materials_cost, admin_fees, other_fees)
- Earned commission updates in real-time via query invalidation when payment recorded
- Dashboard commission widget provides high-level visibility into total outstanding commission
- Commission by college report enables drill-down into commission breakdown by institution

**Commission Calculation Logic from Story 4.4:**
- Story 4.4 includes Task 8: Commission Recalculation (foundation for Story 4.5)
- Formula: earned_commission = (SUM(paid_amount WHERE status='paid') / total_amount) * expected_commission
- Story 4.5 extends this with:
  - Non-commissionable fees exclusion
  - generates_commission filtering
  - College/branch aggregation
  - Dashboard summary widget

**Files to Modify from Story 4.4:**
- `apps/payments/app/api/installments/[id]/record-payment/route.ts`: Add commission recalculation logic
- `apps/payments/app/plans/[id]/hooks/useRecordPayment.ts`: Invalidate commission queries
- `apps/payments/app/plans/[id]/components/PaymentPlanDetail.tsx`: Add CommissionSummary component

**New Files to Create:**
- `packages/utils/src/commission-calculator.ts`: Core commission calculation utilities
- `apps/payments/app/plans/[id]/components/CommissionSummary.tsx`: Commission display component
- `apps/reports/app/commissions/by-college/page.tsx`: Commission by college report
- `apps/dashboard/app/components/CommissionSummaryWidget.tsx`: Dashboard widget
- `supabase/migrations/003_payments_domain/007_commission_calculations.sql`: Add earned_commission field

**Patterns to Follow:**
- Commission recalculation: Triggered on every payment recording (Story 4.4 mutation)
- Query invalidation: Invalidate payment plans + commission-related queries
- Cached vs Real-Time: Use cached earned_commission field for performance, view for accuracy
- Non-commissionable fees: Filter installments by generates_commission = true
- Aggregation: Use SQL GROUP BY for college/branch commission totals
- Dashboard widgets: Use TanStack Query with 5-minute cache for performance

[Source: stories/4-4-manual-payment-recording.md#Task-8-Commission-Recalculation]

### References

**Epic Breakdown:**
- [Source: docs/epics.md#Story-4.5-Commission-Calculation-Engine]
- Full acceptance criteria: lines 804-843
- Prerequisites: Story 4.4 (Manual Payment Recording)

**Architecture:**
- [Source: docs/architecture.md#Commission-Calculation]
- Formula: earned_commission = (paid_amount / total_amount) * expected_commission
- Non-commissionable fees exclusion pattern
- Database view vs cached field trade-offs

**PRD Requirements:**
- Commission tracking: FR-5.4 (Automatic commission calculation based on payments received)
- Commission reporting: FR-7.4 (Commission reports by college/branch)
- Dashboard KPIs: FR-6.1 (Display total earned commission and outstanding commission)

**Technical Decisions:**
- Cached earned_commission field on payment_plans for performance
- Optional database view for real-time accuracy and reconciliation
- Commission calculation utilities in shared packages/utils
- TanStack Query with query invalidation for real-time UI updates
- Exclude non-commissionable fees from commission calculations

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml](.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
