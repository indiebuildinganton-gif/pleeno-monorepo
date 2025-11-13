# Task 2: Commission Calculation Function

**Story Context**: [4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml)

## Task Description

Create PostgreSQL function for commission calculation, database trigger for auto-update, and TypeScript utility function for client-side preview.

## Acceptance Criteria

- AC 3: Commission Calculation

## Subtasks

1. Create PostgreSQL function: `calculate_expected_commission(total_amount DECIMAL, commission_rate_percent DECIMAL) RETURNS DECIMAL`
   - Implement formula: `expected_commission = total_amount * (commission_rate_percent / 100)`
   - Handle edge cases (NULL values, division by zero)
   - Return result rounded to 2 decimal places

2. Create database trigger to auto-update expected_commission when:
   - total_amount changes
   - commission_rate_percent changes
   - New row inserted

3. Add TypeScript utility function in `packages/utils/src/commission-calculator.ts`:
   - Export `calculateExpectedCommission(totalAmount: number, commissionRatePercent: number): number`
   - Match database formula exactly
   - Include JSDoc documentation
   - Add unit tests

## Implementation Notes

**File Locations**:
- `supabase/migrations/003_payments_domain/002_payment_plans_triggers.sql`
- `packages/utils/src/commission-calculator.ts`
- `packages/utils/src/commission-calculator.test.ts`

**PostgreSQL Function**:
```sql
CREATE OR REPLACE FUNCTION calculate_expected_commission(
  total_amount DECIMAL,
  commission_rate_percent DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  IF total_amount IS NULL OR commission_rate_percent IS NULL THEN
    RETURN 0;
  END IF;

  RETURN ROUND(total_amount * (commission_rate_percent / 100), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Database Trigger**:
```sql
CREATE TRIGGER update_expected_commission_trigger
  BEFORE INSERT OR UPDATE OF total_amount, commission_rate_percent
  ON payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION calculate_expected_commission_trigger();
```

**TypeScript Utility**:
```typescript
/**
 * Calculate expected commission based on total amount and commission rate.
 *
 * @param totalAmount - Total payment plan amount
 * @param commissionRatePercent - Commission rate as percentage (0-100)
 * @returns Expected commission rounded to 2 decimal places
 *
 * @example
 * calculateExpectedCommission(10000, 15) // Returns 1500.00
 * calculateExpectedCommission(5000, 0) // Returns 0.00
 * calculateExpectedCommission(3500, 20) // Returns 700.00
 */
export function calculateExpectedCommission(
  totalAmount: number,
  commissionRatePercent: number
): number {
  if (!totalAmount || !commissionRatePercent) return 0;
  return Math.round(totalAmount * (commissionRatePercent / 100) * 100) / 100;
}
```

## Related Tasks

- **Depends on**: Task 1 (payment_plans table must exist)
- **Blocks**: Task 5 (real-time commission preview)

## Testing Checklist

- [ ] PostgreSQL function returns correct values:
  - 0% rate = $0 commission
  - 15% of $10,000 = $1,500.00
  - 100% of $5,000 = $5,000.00
  - 20% of $3,500 = $700.00
  - 0.5% of $100,000 = $500.00
- [ ] Database trigger fires on INSERT
- [ ] Database trigger fires on UPDATE of total_amount
- [ ] Database trigger fires on UPDATE of commission_rate_percent
- [ ] Database trigger does NOT fire on UPDATE of other fields
- [ ] TypeScript function matches database function results exactly
- [ ] TypeScript function handles edge cases (0, NULL, negative)
- [ ] Unit tests cover all scenarios

## References

- [docs/architecture.md](../../../docs/architecture.md) - Commission Calculation Engine (lines 462-656)
- [docs/PRD.md](../../../docs/PRD.md) - FR-5.5: Commission Calculation Engine (lines 816-836)
