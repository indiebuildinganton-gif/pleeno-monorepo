# Task 5: Real-Time Commission Preview

**Story Context**: [4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml)

## Task Description

Create PaymentPlanSummary component that displays total amount, commission rate, and expected commission with real-time updates as user types.

## Acceptance Criteria

- AC 3: Commission Calculation

## Subtasks

1. Create `PaymentPlanSummary` component showing:
   - Total Amount: $X,XXX.XX
   - Commission Rate: X%
   - Expected Commission: $X,XXX.XX (green highlight)

2. Update expected commission in real-time as user types total_amount

3. Use `packages/utils/src/commission-calculator.ts` for client-side calculation

4. Format currency values using `packages/utils/src/formatters.ts`

## Implementation Notes

**File Location**:
- `apps/payments/app/plans/new/components/PaymentPlanSummary.tsx`
- `packages/utils/src/formatters.ts` (may need to create)

**PaymentPlanSummary Component**:
```tsx
'use client';

import { formatCurrency } from '@/packages/utils/src/formatters';
import { cn } from '@/lib/utils';

interface PaymentPlanSummaryProps {
  totalAmount: number;
  commissionRate: number;
  expectedCommission: number;
  currency: string;
  className?: string;
}

export function PaymentPlanSummary({
  totalAmount,
  commissionRate,
  expectedCommission,
  currency,
  className,
}: PaymentPlanSummaryProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 space-y-4', className)}>
      <h3 className="text-lg font-semibold">Payment Plan Summary</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <span className="text-xl font-bold">
            {formatCurrency(totalAmount, currency)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Commission Rate</span>
          <span className="text-lg font-medium">{commissionRate}%</span>
        </div>

        <div className="border-t pt-3" />

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Expected Commission
          </span>
          <span className="text-2xl font-bold text-green-600">
            {formatCurrency(expectedCommission, currency)}
          </span>
        </div>
      </div>

      {totalAmount > 0 && (
        <p className="text-xs text-muted-foreground">
          Commission calculated at {commissionRate}% of total amount
        </p>
      )}
    </div>
  );
}
```

**Currency Formatter Utility**:
```typescript
// packages/utils/src/formatters.ts

/**
 * Format a number as currency with locale-specific formatting
 *
 * @param amount - The amount to format
 * @param currency - Currency code (USD, EUR, GBP, etc.)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1500, 'USD') // Returns "$1,500.00"
 * formatCurrency(1500.50, 'EUR', 'de-DE') // Returns "1.500,50 €"
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  if (isNaN(amount)) return formatCurrency(0, currency, locale);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a percentage value
 *
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(15) // Returns "15.00%"
 * formatPercent(15.5, 1) // Returns "15.5%"
 */
export function formatPercent(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}
```

**Integration with Form**:
```tsx
// In PaymentPlanForm component
import { calculateExpectedCommission } from '@/packages/utils/src/commission-calculator';
import { PaymentPlanSummary } from './PaymentPlanSummary';

// Watch form values for real-time updates
const totalAmount = form.watch('total_amount');
const commissionRate = form.watch('commission_rate');

// Calculate expected commission
const expectedCommission = calculateExpectedCommission(totalAmount, commissionRate);

// Render summary
<PaymentPlanSummary
  totalAmount={totalAmount}
  commissionRate={commissionRate}
  expectedCommission={expectedCommission}
  currency={userCurrency}
/>
```

## Related Tasks

- **Depends on**: Task 2 (commission calculator utility)
- **Used by**: Task 4 (payment plan form)

## Testing Checklist

- [ ] PaymentPlanSummary component renders correctly
- [ ] Total amount displays with correct currency format
- [ ] Commission rate displays with % symbol
- [ ] Expected commission displays in green
- [ ] Expected commission updates when total_amount changes
- [ ] Expected commission updates when commission_rate changes
- [ ] Currency formatting works for different locales
- [ ] Handles edge cases (0, negative, null)
- [ ] Matches database calculation exactly

## References

- [docs/architecture.md](../../../docs/architecture.md) - Commission Calculation Engine (lines 462-656)
- [docs/PRD.md](../../../docs/PRD.md) - FR-5.5: Commission Calculation (lines 816-836)
