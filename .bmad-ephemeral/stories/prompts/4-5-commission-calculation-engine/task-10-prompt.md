# Story 4.5: Commission Calculation Engine - Task 10

## Story Context
**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Previous Task**: Task 9 - Non-Commissionable Fees Handling (Completed)

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

---

## Task 10: Database View for Real-Time Commission Calculation (Optional)

### Acceptance Criteria
AC 7: Data Isolation and Performance
- Optional database view payment_plans_with_commission for real-time calculation without caching
- View includes calculated fields: total_paid, commissionable_amount, earned_commission, commission_percentage
- Trade-off: View calculation adds query time vs cached field
- Use for audit/reconciliation when maximum accuracy needed

### Task Description
Create an optional database view that calculates commission in real-time using SQL aggregation. This view provides an alternative to the cached `earned_commission` field for scenarios requiring maximum accuracy or audit/reconciliation.

**Note:** This is an optional optimization task. The system works with the cached field approach from Task 4. This view is for scenarios requiring real-time accuracy without relying on cached values.

### Subtasks Checklist
- [ ] Create database view: payment_plans_with_commission
- [ ] View includes all payment_plan fields plus calculated fields:
  - total_paid: SUM(installments.paid_amount WHERE status='paid' AND generates_commission=true)
  - commissionable_amount: total_amount - (materials_cost + admin_fees + other_fees)
  - earned_commission_calculated: (total_paid / commissionable_amount) * expected_commission
  - commission_percentage: (earned_commission / expected_commission) * 100
- [ ] Query from view instead of cached earned_commission field for audit/reconciliation
- [ ] Benchmark: Compare view query performance vs cached field approach

---

## Context & Constraints

### Key Constraints
- Optional implementation: System works without this view
- Performance trade-off: Real-time accuracy vs query speed
- Use case: Audit, reconciliation, reporting where accuracy is critical
- Not for dashboard: Use cached field for performance-critical queries
- RLS applies: View must respect agency_id filtering

---

## Manifest Update Instructions

Before starting:
1. Open: `.bmad-ephemeral/stories/prompts/4-5-commission-calculation-engine/MANIFEST.md`
2. Update Task 9:
   - Status: "Completed"
   - Completed: [Date]
   - Notes: [Implementation notes from Task 9]
3. Update Task 10:
   - Status: "In Progress"
   - Started: [Current Date]

---

## Implementation Steps

### Step 1: Create Database View
Create: `supabase/migrations/003_payments_domain/008_commission_view.sql`

```sql
-- Create view for real-time commission calculation
CREATE OR REPLACE VIEW payment_plans_with_commission AS
SELECT
  pp.*,
  -- Total paid from commission-eligible installments
  COALESCE(
    SUM(i.paid_amount) FILTER (
      WHERE i.status = 'paid' AND i.generates_commission = true
    ),
    0
  ) AS total_paid,

  -- Commissionable amount (excluding fees)
  pp.total_amount - (
    COALESCE(pp.materials_cost, 0) +
    COALESCE(pp.admin_fees, 0) +
    COALESCE(pp.other_fees, 0)
  ) AS commissionable_amount,

  -- Earned commission (real-time calculation)
  CASE
    WHEN (pp.total_amount - (
      COALESCE(pp.materials_cost, 0) +
      COALESCE(pp.admin_fees, 0) +
      COALESCE(pp.other_fees, 0)
    )) > 0
    THEN (
      COALESCE(
        SUM(i.paid_amount) FILTER (
          WHERE i.status = 'paid' AND i.generates_commission = true
        ),
        0
      ) /
      (pp.total_amount - (
        COALESCE(pp.materials_cost, 0) +
        COALESCE(pp.admin_fees, 0) +
        COALESCE(pp.other_fees, 0)
      ))
    ) * pp.expected_commission
    ELSE 0
  END AS earned_commission_calculated,

  -- Commission percentage
  CASE
    WHEN pp.expected_commission > 0
    THEN (
      (CASE
        WHEN (pp.total_amount - (
          COALESCE(pp.materials_cost, 0) +
          COALESCE(pp.admin_fees, 0) +
          COALESCE(pp.other_fees, 0)
        )) > 0
        THEN (
          COALESCE(
            SUM(i.paid_amount) FILTER (
              WHERE i.status = 'paid' AND i.generates_commission = true
            ),
            0
          ) /
          (pp.total_amount - (
            COALESCE(pp.materials_cost, 0) +
            COALESCE(pp.admin_fees, 0) +
            COALESCE(pp.other_fees, 0)
          ))
        ) * pp.expected_commission
        ELSE 0
      END) / pp.expected_commission
    ) * 100
    ELSE 0
  END AS commission_percentage

FROM payment_plans pp
LEFT JOIN installments i ON i.payment_plan_id = pp.id
GROUP BY pp.id;

-- Grant permissions
GRANT SELECT ON payment_plans_with_commission TO authenticated;

-- RLS Policy (inherits from payment_plans)
ALTER VIEW payment_plans_with_commission SET (security_invoker = true);
```

### Step 2: Create Helper Function for Querying View
Create: `packages/db/src/queries/payment-plans-view.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export async function getPaymentPlansWithCommission(
  supabase: ReturnType<typeof createClient>,
  filters?: {
    planId?: string;
    collegeId?: string;
    branchId?: string;
    status?: string;
  }
) {
  let query = supabase
    .from('payment_plans_with_commission')
    .select('*');

  if (filters?.planId) {
    query = query.eq('id', filters.planId);
  }

  if (filters?.collegeId) {
    query = query.eq('college_id', filters.collegeId);
  }

  if (filters?.branchId) {
    query = query.eq('branch_id', filters.branchId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getSinglePaymentPlanWithCommission(
  supabase: ReturnType<typeof createClient>,
  planId: string
) {
  const { data, error } = await supabase
    .from('payment_plans_with_commission')
    .select('*')
    .eq('id', planId)
    .single();

  if (error) throw error;
  return data;
}
```

### Step 3: Create Reconciliation Utility
Create: `packages/utils/src/commission-reconciliation.ts`

Use the view to verify cached values match calculated values:

```typescript
export async function reconcileCommissionValues(
  supabase: ReturnType<typeof createClient>,
  planId?: string
) {
  // Get payment plans from view (real-time calculation)
  const query = supabase
    .from('payment_plans_with_commission')
    .select('id, earned_commission, earned_commission_calculated');

  if (planId) {
    query.eq('id', planId);
  }

  const { data: plans, error } = await query;
  if (error) throw error;

  // Find discrepancies between cached and calculated values
  const discrepancies = plans.filter(plan => {
    const diff = Math.abs(plan.earned_commission - plan.earned_commission_calculated);
    return diff > 0.01; // Allow for floating point precision
  });

  return {
    total_plans: plans.length,
    discrepancies_found: discrepancies.length,
    discrepancies: discrepancies.map(plan => ({
      plan_id: plan.id,
      cached_value: plan.earned_commission,
      calculated_value: plan.earned_commission_calculated,
      difference: plan.earned_commission_calculated - plan.earned_commission,
    })),
  };
}
```

### Step 4: Add Performance Benchmark
Create: `scripts/benchmark-commission-queries.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

async function benchmarkCommissionQueries() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const testRuns = 10;
  const cachedTimes: number[] = [];
  const viewTimes: number[] = [];

  for (let i = 0; i < testRuns; i++) {
    // Benchmark cached field approach
    const cachedStart = performance.now();
    await supabase
      .from('payment_plans')
      .select('*')
      .limit(100);
    const cachedEnd = performance.now();
    cachedTimes.push(cachedEnd - cachedStart);

    // Benchmark view approach
    const viewStart = performance.now();
    await supabase
      .from('payment_plans_with_commission')
      .select('*')
      .limit(100);
    const viewEnd = performance.now();
    viewTimes.push(viewEnd - viewStart);
  }

  const avgCached = cachedTimes.reduce((a, b) => a + b) / testRuns;
  const avgView = viewTimes.reduce((a, b) => a + b) / testRuns;

  console.log('Benchmark Results (average over', testRuns, 'runs):');
  console.log('Cached field approach:', avgCached.toFixed(2), 'ms');
  console.log('Database view approach:', avgView.toFixed(2), 'ms');
  console.log('Difference:', (avgView - avgCached).toFixed(2), 'ms');
  console.log('View is', (avgView / avgCached).toFixed(2), 'x slower');
}

benchmarkCommissionQueries();
```

### Step 5: Documentation
Document when to use view vs cached field:

**Use Cached Field (earned_commission) When:**
- Dashboard queries (performance critical)
- Real-time UI updates (user-facing)
- Frequent queries (< 5 second response time needed)
- General payment plan listing

**Use Database View (payment_plans_with_commission) When:**
- Audit reports (accuracy > performance)
- Reconciliation checks (verify cached values)
- Month-end financial reports
- Dispute resolution (need authoritative values)
- Batch processing (not user-facing)

---

## Testing Requirements

### Integration Tests
Create: `supabase/tests/commission-view.test.sql`

Test cases:
1. View returns same results as cached field for consistent data
2. View calculates commission correctly for various scenarios
3. View respects RLS policies (agency_id filtering)
4. View handles edge cases (zero commissionable amount, no installments)
5. Performance test: View query completes within acceptable time (< 500ms for 100 plans)

### Reconciliation Test
Test the reconciliation utility:
1. Create payment plans with known commission values
2. Run reconciliation check
3. Verify no discrepancies found
4. Manually corrupt cached value
5. Run reconciliation again
6. Verify discrepancy detected

---

## Context References

### Story Context File
Full context: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Related Files
- Migration: `supabase/migrations/003_payments_domain/008_commission_view.sql` (NEW)
- Query Helper: `packages/db/src/queries/payment-plans-view.ts` (NEW)
- Reconciliation: `packages/utils/src/commission-reconciliation.ts` (NEW)
- Benchmark: `scripts/benchmark-commission-queries.ts` (NEW)

### Architecture Decision
- **Primary approach**: Cached earned_commission field (Task 4)
- **Secondary approach**: Database view (this task) for audit/reconciliation
- **Recommendation**: Use cached field for UI, view for reports and audits

---

## Next Steps

After completing Task 10:
1. Update MANIFEST.md:
   - Task 10 status: "Completed"
   - Task 10 completed date
   - Add notes: Database view created, benchmarked, documented
2. Run benchmark and document results
3. Move to Task 11: Testing
4. Reference file: `task-11-prompt.md`

---

## Success Criteria

Task 10 is complete when:
- [x] Database view payment_plans_with_commission created
- [x] View calculates earned_commission in real-time
- [x] View includes total_paid, commissionable_amount, commission_percentage
- [x] Query helper functions created
- [x] Reconciliation utility implemented
- [x] Performance benchmark completed and documented
- [x] Usage guidelines documented (when to use view vs cached)
- [x] Integration tests pass
- [x] MANIFEST.md updated with Task 10 completion
