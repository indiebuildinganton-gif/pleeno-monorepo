# Task 8: Payment Plan Status Enum

**Story Context**: [4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml)

## Task Description

Create payment plan status enum in database ('active', 'completed', 'cancelled'), default to 'active' on creation, and create status badge component for UI display.

## Acceptance Criteria

- AC 1: Payment Plan Data Entry
- AC 4: Payment Plan Metadata

## Subtasks

1. Create status enum in database: ('active', 'completed', 'cancelled')

2. Default status to 'active' on creation

3. Add status column to payment_plans table

4. Create status badge component for UI display with color coding

## Implementation Notes

**File Locations**:
- `supabase/migrations/003_payments_domain/003_payment_plans_status.sql`
- `apps/payments/components/PaymentPlanStatusBadge.tsx`

**Database Status Enum**:
```sql
-- supabase/migrations/003_payments_domain/003_payment_plans_status.sql

-- Create payment plan status enum
CREATE TYPE payment_plan_status AS ENUM (
  'active',
  'completed',
  'cancelled'
);

-- Add status column to payment_plans table (if not already added in Task 1)
ALTER TABLE payment_plans
  ADD COLUMN IF NOT EXISTS status payment_plan_status NOT NULL DEFAULT 'active';

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_payment_plans_status
  ON payment_plans(status);

-- Add composite index for agency_id + status (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_payment_plans_agency_status
  ON payment_plans(agency_id, status);

COMMENT ON TYPE payment_plan_status IS 'Status of a payment plan: active (in progress), completed (all payments made), cancelled (plan terminated)';
COMMENT ON COLUMN payment_plans.status IS 'Current status of the payment plan. Defaults to active on creation.';
```

**PaymentPlanStatusBadge Component**:
```tsx
// apps/payments/components/PaymentPlanStatusBadge.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type PaymentPlanStatus = 'active' | 'completed' | 'cancelled';

interface PaymentPlanStatusBadgeProps {
  status: PaymentPlanStatus;
  className?: string;
}

const statusConfig = {
  active: {
    label: 'Active',
    variant: 'default' as const,
    className: 'bg-blue-500 hover:bg-blue-600',
  },
  completed: {
    label: 'Completed',
    variant: 'default' as const,
    className: 'bg-green-500 hover:bg-green-600',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive' as const,
    className: 'bg-red-500 hover:bg-red-600',
  },
};

export function PaymentPlanStatusBadge({
  status,
  className,
}: PaymentPlanStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

/**
 * Helper function to get status label
 */
export function getStatusLabel(status: PaymentPlanStatus): string {
  return statusConfig[status].label;
}

/**
 * Helper function to get all valid statuses
 */
export function getAllStatuses(): PaymentPlanStatus[] {
  return ['active', 'completed', 'cancelled'];
}
```

**Usage Example**:
```tsx
// In payment plan detail page or list
import { PaymentPlanStatusBadge } from '@/apps/payments/components/PaymentPlanStatusBadge';

export function PaymentPlanCard({ plan }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3>{plan.reference_number || 'Payment Plan'}</h3>
        <PaymentPlanStatusBadge status={plan.status} />
      </div>
      {/* Other plan details */}
    </div>
  );
}
```

**TypeScript Type Definition**:
```typescript
// packages/types/src/payment-plan.ts
export type PaymentPlanStatus = 'active' | 'completed' | 'cancelled';

export interface PaymentPlan {
  id: string;
  enrollment_id: string;
  agency_id: string;
  total_amount: number;
  currency: string;
  start_date: string;
  commission_rate_percent: number;
  expected_commission: number;
  status: PaymentPlanStatus;
  notes: string | null;
  reference_number: string | null;
  created_at: string;
  updated_at: string;
}
```

## Related Tasks

- **Depends on**: Task 1 (payment_plans table must exist)
- **Used by**: Task 4 (form component), Task 6 (API routes)

## Testing Checklist

- [ ] Database enum created with 3 values
- [ ] Status column added to payment_plans table
- [ ] Default value 'active' applies on INSERT
- [ ] Indexes created for status filtering
- [ ] PaymentPlanStatusBadge component renders correctly
- [ ] 'active' status displays blue badge
- [ ] 'completed' status displays green badge
- [ ] 'cancelled' status displays red badge
- [ ] Badge styling matches design system
- [ ] Status labels are user-friendly

## References

- [docs/architecture.md](../../../docs/architecture.md) - Payments Domain (lines 1632-1709)
- [Story 3.3](../../3-3-student-college-enrollment-linking.md) - Status badge pattern
- Shadcn UI Badge component: https://ui.shadcn.com/docs/components/badge
