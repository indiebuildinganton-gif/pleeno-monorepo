# Story 4.5: Commission Calculation Engine - Task 12

## Story Context
**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Previous Task**: Task 11 - Testing (Completed)

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

---

## Task 12: Migration and Data Seeding

### Acceptance Criteria
AC 7: Data Isolation and Performance
- Add earned_commission field to payment_plans table (cached value)
- Add generates_commission field to installments table
- Create performance index on installments table
- Backfill existing data with calculated commission values

### Task Description
Create and run the database migration to add the necessary fields for commission calculation. This includes adding the cached `earned_commission` field to payment_plans, the `generates_commission` flag to installments, and performance indexes. Also backfill existing data.

### Subtasks Checklist
- [ ] Create migration: supabase/migrations/003_payments_domain/007_commission_calculations.sql
- [ ] Migration adds:
  - payment_plans.earned_commission DECIMAL (default: 0) - cached value
  - installments.generates_commission BOOLEAN (default: true)
  - Index: CREATE INDEX idx_installments_paid_commission ON installments(payment_plan_id, status, generates_commission)
- [ ] Backfill earned_commission for existing payment plans
- [ ] Backfill generates_commission for existing installments (default: true)
- [ ] Test migration on development database
- [ ] Document rollback procedure

---

## Context & Constraints

### Key Constraints
- Migration must be reversible (include DOWN migration)
- Backfill must handle large datasets (use batching if needed)
- Zero downtime: New fields nullable initially, set defaults after
- Test thoroughly before production deployment
- Performance: Index required for fast commission queries

### Database Access
```bash
# Run migration locally
supabase migration up

# Run migration on staging
supabase db push --project-ref staging-ref

# Run migration on production
supabase db push --project-ref production-ref
```

---

## Manifest Update Instructions

Before starting:
1. Open: `.bmad-ephemeral/stories/prompts/4-5-commission-calculation-engine/MANIFEST.md`
2. Update Task 11:
   - Status: "Completed"
   - Completed: [Date]
   - Notes: [Implementation notes from Task 11]
3. Update Task 12:
   - Status: "In Progress"
   - Started: [Current Date]

---

## Implementation Steps

### Step 1: Create Migration File
Create: `supabase/migrations/003_payments_domain/007_commission_calculations.sql`

```sql
-- ============================================
-- Migration: Commission Calculation Fields
-- Story: 4.5 - Commission Calculation Engine
-- Date: [Current Date]
-- ============================================

-- Add earned_commission field to payment_plans table
ALTER TABLE payment_plans
ADD COLUMN IF NOT EXISTS earned_commission DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN payment_plans.earned_commission IS
  'Cached calculated commission based on paid installments. Updated on each payment recording.';

-- Add generates_commission field to installments table
ALTER TABLE installments
ADD COLUMN IF NOT EXISTS generates_commission BOOLEAN DEFAULT true;

COMMENT ON COLUMN installments.generates_commission IS
  'Determines if this installment counts toward commission calculation. False for non-commissionable fees (materials, admin fees, etc).';

-- Create performance index for commission queries
CREATE INDEX IF NOT EXISTS idx_installments_paid_commission
  ON installments(payment_plan_id, status, generates_commission)
  WHERE status = 'paid' AND generates_commission = true;

COMMENT ON INDEX idx_installments_paid_commission IS
  'Performance index for commission calculation queries. Filters paid installments that generate commission.';

-- Create composite index for aggregation queries
CREATE INDEX IF NOT EXISTS idx_payment_plans_agency_status_commission
  ON payment_plans(agency_id, status, earned_commission, expected_commission);

COMMENT ON INDEX idx_payment_plans_agency_status_commission IS
  'Performance index for commission aggregation and dashboard queries.';

-- ============================================
-- Backfill earned_commission for existing payment plans
-- ============================================

-- Function to calculate earned commission for a single payment plan
CREATE OR REPLACE FUNCTION backfill_earned_commission(plan_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_total_amount DECIMAL;
  v_expected_commission DECIMAL;
  v_materials_cost DECIMAL;
  v_admin_fees DECIMAL;
  v_other_fees DECIMAL;
  v_commissionable_amount DECIMAL;
  v_total_paid DECIMAL;
  v_earned_commission DECIMAL;
BEGIN
  -- Get payment plan details
  SELECT
    total_amount,
    expected_commission,
    COALESCE(materials_cost, 0),
    COALESCE(admin_fees, 0),
    COALESCE(other_fees, 0)
  INTO
    v_total_amount,
    v_expected_commission,
    v_materials_cost,
    v_admin_fees,
    v_other_fees
  FROM payment_plans
  WHERE id = plan_id;

  -- Calculate commissionable amount
  v_commissionable_amount := v_total_amount - (v_materials_cost + v_admin_fees + v_other_fees);

  -- Get total paid from commission-eligible installments
  SELECT COALESCE(SUM(paid_amount), 0)
  INTO v_total_paid
  FROM installments
  WHERE payment_plan_id = plan_id
    AND status = 'paid'
    AND generates_commission = true;

  -- Calculate earned commission
  IF v_commissionable_amount > 0 THEN
    v_earned_commission := (v_total_paid / v_commissionable_amount) * v_expected_commission;
  ELSE
    v_earned_commission := 0;
  END IF;

  RETURN v_earned_commission;
END;
$$ LANGUAGE plpgsql;

-- Backfill earned_commission for all payment plans
UPDATE payment_plans
SET earned_commission = backfill_earned_commission(id)
WHERE agency_id IS NOT NULL;

-- Drop temporary function
DROP FUNCTION IF EXISTS backfill_earned_commission(UUID);

-- ============================================
-- Backfill generates_commission for existing installments
-- ============================================

-- All existing installments default to generates_commission = true
-- This is already handled by the DEFAULT clause above
-- If specific installments should be false, update them here:

-- Example: If you have a way to identify fee-only installments
-- UPDATE installments
-- SET generates_commission = false
-- WHERE installment_number = 0 OR description LIKE '%fee%' OR description LIKE '%material%';

-- ============================================
-- Add constraints
-- ============================================

-- Ensure earned_commission is not negative
ALTER TABLE payment_plans
ADD CONSTRAINT check_earned_commission_non_negative
CHECK (earned_commission >= 0);

-- Ensure earned_commission doesn't exceed expected_commission (with some tolerance for rounding)
ALTER TABLE payment_plans
ADD CONSTRAINT check_earned_commission_reasonable
CHECK (earned_commission <= expected_commission * 1.01);

-- ============================================
-- Update RLS policies (if needed)
-- ============================================

-- RLS policies should already cover earned_commission since it's on payment_plans table
-- No additional policies needed

-- ============================================
-- Grant permissions
-- ============================================

-- Ensure authenticated users can read earned_commission
-- (Already covered by existing payment_plans RLS policies)

-- ============================================
-- Create audit trigger for earned_commission updates
-- ============================================

CREATE OR REPLACE FUNCTION audit_commission_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.earned_commission IS DISTINCT FROM NEW.earned_commission THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      user_id,
      agency_id,
      created_at
    ) VALUES (
      'payment_plans',
      NEW.id,
      'commission_updated',
      jsonb_build_object('earned_commission', OLD.earned_commission),
      jsonb_build_object('earned_commission', NEW.earned_commission),
      auth.uid(),
      NEW.agency_id,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_commission_update
AFTER UPDATE ON payment_plans
FOR EACH ROW
EXECUTE FUNCTION audit_commission_update();

-- ============================================
-- Migration complete
-- ============================================

-- Verify backfill results
DO $$
DECLARE
  v_total_plans INTEGER;
  v_plans_with_commission INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_plans FROM payment_plans;
  SELECT COUNT(*) INTO v_plans_with_commission FROM payment_plans WHERE earned_commission > 0;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  Total payment plans: %', v_total_plans;
  RAISE NOTICE '  Plans with earned commission > 0: %', v_plans_with_commission;
END $$;
```

### Step 2: Create Rollback Migration
Create: `supabase/migrations/003_payments_domain/007_commission_calculations_rollback.sql`

```sql
-- ============================================
-- Rollback: Commission Calculation Fields
-- Story: 4.5 - Commission Calculation Engine
-- ============================================

-- Drop audit trigger
DROP TRIGGER IF EXISTS trigger_audit_commission_update ON payment_plans;
DROP FUNCTION IF EXISTS audit_commission_update();

-- Drop constraints
ALTER TABLE payment_plans DROP CONSTRAINT IF EXISTS check_earned_commission_non_negative;
ALTER TABLE payment_plans DROP CONSTRAINT IF EXISTS check_earned_commission_reasonable;

-- Drop indexes
DROP INDEX IF EXISTS idx_installments_paid_commission;
DROP INDEX IF EXISTS idx_payment_plans_agency_status_commission;

-- Remove columns
ALTER TABLE payment_plans DROP COLUMN IF EXISTS earned_commission;
ALTER TABLE installments DROP COLUMN IF EXISTS generates_commission;

-- Rollback complete
RAISE NOTICE 'Rollback complete: Commission calculation fields removed';
```

### Step 3: Test Migration Locally
```bash
# 1. Create test database
supabase start

# 2. Run migration
supabase migration up

# 3. Verify migration applied
psql $DATABASE_URL -c "
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'payment_plans' AND column_name = 'earned_commission';
"

# 4. Check indexes
psql $DATABASE_URL -c "
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'installments' AND indexname LIKE '%commission%';
"

# 5. Verify backfill
psql $DATABASE_URL -c "
  SELECT
    COUNT(*) as total_plans,
    COUNT(*) FILTER (WHERE earned_commission > 0) as plans_with_commission,
    AVG(earned_commission) as avg_commission
  FROM payment_plans;
"

# 6. Test rollback
supabase migration down

# 7. Verify rollback
psql $DATABASE_URL -c "
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'payment_plans' AND column_name = 'earned_commission';
"
# Should return no rows

# 8. Re-apply migration
supabase migration up
```

### Step 4: Create Migration Verification Script
Create: `scripts/verify-commission-migration.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

async function verifyCommissionMigration() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  console.log('Verifying commission calculation migration...\n');

  // 1. Check if earned_commission column exists
  const { data: paymentPlansColumns, error: colError } = await supabase
    .rpc('get_table_columns', { table_name: 'payment_plans' });

  const hasEarnedCommission = paymentPlansColumns?.some(
    (col: any) => col.column_name === 'earned_commission'
  );
  console.log('✓ payment_plans.earned_commission exists:', hasEarnedCommission);

  // 2. Check if generates_commission column exists
  const { data: installmentsColumns } = await supabase
    .rpc('get_table_columns', { table_name: 'installments' });

  const hasGeneratesCommission = installmentsColumns?.some(
    (col: any) => col.column_name === 'generates_commission'
  );
  console.log('✓ installments.generates_commission exists:', hasGeneratesCommission);

  // 3. Check indexes
  const { data: indexes } = await supabase
    .rpc('get_table_indexes', { table_name: 'installments' });

  const hasCommissionIndex = indexes?.some(
    (idx: any) => idx.indexname === 'idx_installments_paid_commission'
  );
  console.log('✓ Commission index exists:', hasCommissionIndex);

  // 4. Verify backfill data
  const { data: stats, error: statsError } = await supabase
    .from('payment_plans')
    .select('earned_commission, expected_commission')
    .not('earned_commission', 'is', null);

  const totalPlans = stats?.length || 0;
  const plansWithCommission = stats?.filter(p => p.earned_commission > 0).length || 0;

  console.log('\nBackfill Statistics:');
  console.log('  Total payment plans:', totalPlans);
  console.log('  Plans with earned commission > 0:', plansWithCommission);

  // 5. Sample calculation verification
  const { data: samplePlan } = await supabase
    .from('payment_plans')
    .select(`
      id,
      total_amount,
      expected_commission,
      earned_commission,
      materials_cost,
      admin_fees,
      other_fees,
      installments (
        status,
        paid_amount,
        generates_commission
      )
    `)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (samplePlan) {
    const commissionableAmount = samplePlan.total_amount -
      (samplePlan.materials_cost + samplePlan.admin_fees + samplePlan.other_fees);

    const totalPaid = samplePlan.installments
      .filter((i: any) => i.status === 'paid' && i.generates_commission)
      .reduce((sum: number, i: any) => sum + i.paid_amount, 0);

    const calculatedCommission = (totalPaid / commissionableAmount) * samplePlan.expected_commission;

    console.log('\nSample Plan Verification:');
    console.log('  Plan ID:', samplePlan.id);
    console.log('  Cached commission:', samplePlan.earned_commission);
    console.log('  Calculated commission:', calculatedCommission.toFixed(2));
    console.log('  Match:', Math.abs(samplePlan.earned_commission - calculatedCommission) < 0.01 ? '✓' : '✗');
  }

  console.log('\n✓ Migration verification complete!');
}

verifyCommissionMigration();
```

### Step 5: Deploy to Staging
```bash
# 1. Deploy to staging database
supabase db push --project-ref [staging-ref]

# 2. Run verification script on staging
DATABASE_URL=[staging-url] npm run verify:migration

# 3. Test commission calculation on staging
# - Create test payment plan
# - Record test payment
# - Verify earned_commission updates

# 4. Check performance on staging
# - Run commission queries
# - Verify index usage
# - Check query execution time
```

### Step 6: Deploy to Production
```bash
# 1. Backup production database
supabase db dump --project-ref [production-ref] > backup-$(date +%Y%m%d).sql

# 2. Deploy migration to production
supabase db push --project-ref [production-ref]

# 3. Monitor migration
# - Check logs for errors
# - Verify backfill completed
# - Run verification script

# 4. Smoke test production
# - Load payment plan page
# - Verify commission displays
# - Record test payment (on test account)
# - Verify commission updates
```

---

## Migration Safety Checklist

Before running in production:
- [ ] Migration tested on local database
- [ ] Migration tested on staging database
- [ ] Rollback migration tested and working
- [ ] Backfill verified with sample data
- [ ] Indexes created and verified
- [ ] Performance benchmarked (query times acceptable)
- [ ] Verification script run successfully
- [ ] Production database backed up
- [ ] Deployment plan reviewed
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

---

## Testing Requirements

### Migration Tests
Create: `supabase/tests/007_commission_calculations.test.sql`

```sql
-- Test 1: Columns exist
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'payment_plans' AND column_name = 'earned_commission'
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_earned_commission_column;

-- Test 2: Indexes exist
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_installments_paid_commission'
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_commission_index;

-- Test 3: Backfill integrity
SELECT
  CASE
    WHEN COUNT(*) FILTER (WHERE earned_commission < 0) = 0
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_no_negative_commission
FROM payment_plans;

-- Test 4: Audit trigger exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trigger_audit_commission_update'
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_audit_trigger;
```

---

## Context References

### Story Context File
Full context: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Migration Files
- Migration: `supabase/migrations/003_payments_domain/007_commission_calculations.sql` (NEW)
- Rollback: `supabase/migrations/003_payments_domain/007_commission_calculations_rollback.sql` (NEW)
- Verification: `scripts/verify-commission-migration.ts` (NEW)
- Tests: `supabase/tests/007_commission_calculations.test.sql` (NEW)

### Database Schema Changes
- `payment_plans.earned_commission` (DECIMAL, default: 0)
- `installments.generates_commission` (BOOLEAN, default: true)
- Index: `idx_installments_paid_commission`
- Index: `idx_payment_plans_agency_status_commission`
- Audit trigger: `trigger_audit_commission_update`

---

## Final Steps

After completing Task 12:
1. Update MANIFEST.md:
   - Task 12 status: "Completed"
   - Task 12 completed date
   - Add notes: Migration deployed, data backfilled, verification passed
2. Update MANIFEST.md story status:
   - Status: "Completed"
   - All tasks completed: [Date]
3. Document deployment:
   - Migration timestamp
   - Verification results
   - Any issues encountered
4. Story 4.5 is complete!

---

## Success Criteria

Task 12 is complete when:
- [x] Migration file created with all necessary schema changes
- [x] Rollback migration created and tested
- [x] Migration tested on local database
- [x] Migration tested on staging database
- [x] Backfill completed successfully (all payment plans have earned_commission)
- [x] Indexes created and working
- [x] Audit trigger functional
- [x] Verification script confirms migration success
- [x] Performance benchmarks meet targets
- [x] Migration deployed to production
- [x] Production smoke tests passed
- [x] MANIFEST.md updated with Task 12 completion
- [x] Story 4.5 marked as COMPLETE
