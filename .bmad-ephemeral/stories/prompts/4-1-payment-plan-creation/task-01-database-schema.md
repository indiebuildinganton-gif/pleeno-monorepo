# Task 1: Database Schema Implementation

**Story Context**: [4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml)

## Task Description

Create the payment_plans database table with all required fields, triggers for commission calculation, RLS policies, indexes, and default currency configuration.

## Acceptance Criteria

- AC 1: Payment Plan Data Entry
- AC 3: Commission Calculation
- AC 4: Payment Plan Metadata

## Subtasks

1. Create `payment_plans` table with fields:
   - id (UUID, primary key)
   - enrollment_id (UUID, FK to enrollments)
   - agency_id (UUID, FK to agencies)
   - total_amount (DECIMAL)
   - currency (TEXT)
   - start_date (DATE)
   - commission_rate_percent (DECIMAL)
   - expected_commission (DECIMAL, calculated)
   - status (ENUM: 'active', 'completed', 'cancelled')
   - notes (TEXT, optional)
   - reference_number (TEXT, optional)
   - created_at (TIMESTAMPTZ)
   - updated_at (TIMESTAMPTZ)

2. Add database trigger to auto-calculate expected_commission on INSERT/UPDATE

3. Enable RLS policies on payment_plans table filtering by agency_id:
   - SELECT: user's agency_id matches row's agency_id
   - INSERT: user's agency_id matches row's agency_id
   - UPDATE: user's agency_id matches row's agency_id
   - DELETE: user's agency_id matches row's agency_id

4. Create indexes:
   - (agency_id, status) for fast filtering
   - (enrollment_id) for joins

5. Set default currency from agencies.currency configuration

## Implementation Notes

**File Location**: `supabase/migrations/003_payments_domain/001_payment_plans_schema.sql`

**Database Patterns**:
- Use DECIMAL type for monetary values (total_amount, expected_commission)
- Use DECIMAL type for commission_rate_percent (supports up to 2 decimal places)
- Use TIMESTAMPTZ for created_at/updated_at (stores UTC, displays in user's timezone)
- Foreign key constraints: ON DELETE CASCADE for agency_id, ON DELETE RESTRICT for enrollment_id

**Commission Calculation Formula**:
```sql
expected_commission = total_amount * (commission_rate_percent / 100)
```

**RLS Pattern**:
```sql
CREATE POLICY "Users can only access payment plans for their agency"
  ON payment_plans
  FOR ALL
  USING (agency_id = auth.uid()::uuid);
```

**Status Enum**:
```sql
CREATE TYPE payment_plan_status AS ENUM ('active', 'completed', 'cancelled');
```

## Related Tasks

- **Depends on**: Story 3.3 (enrollments table must exist)
- **Blocks**: Task 2 (commission calculation function), Task 3 (API routes)

## Testing Checklist

- [ ] payment_plans table created successfully
- [ ] All columns have correct data types
- [ ] Foreign keys enforce referential integrity
- [ ] Indexes created and used in queries (verify with EXPLAIN)
- [ ] RLS policies block cross-agency access
- [ ] Default currency set from agencies table
- [ ] Status enum values work correctly
- [ ] created_at and updated_at timestamps auto-populate

## References

- [docs/architecture.md](../../../docs/architecture.md) - Payments Domain (lines 1632-1709)
- [docs/PRD.md](../../../docs/PRD.md) - FR-5: Payment Plan Management (lines 734-836)
- [Story 3.3](../../3-3-student-college-enrollment-linking.md) - Enrollments table schema
