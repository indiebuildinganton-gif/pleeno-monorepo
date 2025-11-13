# Task 9: Audit Logging

**Story Context**: [4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml)

## Task Description

Log payment plan creation to audit_logs table with user_id, timestamp, entity details, and commission calculation parameters for transparency and compliance.

## Acceptance Criteria

- All acceptance criteria (comprehensive audit trail)

## Subtasks

1. Log payment plan creation to audit_logs table

2. Include: user_id, timestamp, entity_type='payment_plan', entity_id, action='create'

3. Log all field values in new_values (JSONB)

4. Log commission calculation parameters for transparency

## Implementation Notes

**File Locations**:
- `apps/payments/app/api/payment-plans/route.ts` (add audit logging)
- `packages/utils/src/audit-logger.ts` (shared utility, may exist from Story 3.3)

**Audit Log Schema** (should already exist from Story 3.3):
```sql
-- If audit_logs table doesn't exist, create it
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON audit_logs(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_agency
  ON audit_logs(agency_id, timestamp DESC);
```

**Audit Logger Utility**:
```typescript
// packages/utils/src/audit-logger.ts
import { createClient } from '@supabase/supabase-js';

interface AuditLogParams {
  userId: string;
  agencyId: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

export async function logAudit(params: AuditLogParams) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from('audit_logs').insert({
    user_id: params.userId,
    agency_id: params.agencyId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    old_values: params.oldValues || null,
    new_values: params.newValues || null,
    metadata: params.metadata || null,
    timestamp: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to log audit:', error);
    // Don't throw error - audit logging failure shouldn't break the operation
  }
}
```

**Integration in Payment Plan API**:
```typescript
// apps/payments/app/api/payment-plans/route.ts
import { logAudit } from '@/packages/utils/src/audit-logger';

export async function POST(request: Request) {
  // ... payment plan creation logic ...

  const paymentPlan = await createPaymentPlan(data);

  // Log audit trail
  await logAudit({
    userId: user.id,
    agencyId: paymentPlan.agency_id,
    entityType: 'payment_plan',
    entityId: paymentPlan.id,
    action: 'create',
    newValues: {
      enrollment_id: paymentPlan.enrollment_id,
      total_amount: paymentPlan.total_amount,
      currency: paymentPlan.currency,
      start_date: paymentPlan.start_date,
      commission_rate_percent: paymentPlan.commission_rate_percent,
      expected_commission: paymentPlan.expected_commission,
      status: paymentPlan.status,
      notes: paymentPlan.notes,
      reference_number: paymentPlan.reference_number,
    },
    metadata: {
      // Include commission calculation parameters for transparency
      commission_calculation: {
        formula: 'total_amount * (commission_rate_percent / 100)',
        total_amount: paymentPlan.total_amount,
        commission_rate_percent: paymentPlan.commission_rate_percent,
        expected_commission: paymentPlan.expected_commission,
      },
      enrollment: {
        student_name: enrollment.student.first_name + ' ' + enrollment.student.last_name,
        college_name: enrollment.branch.college.name,
        branch_city: enrollment.branch.city,
        program_name: enrollment.program_name,
      },
    },
  });

  return NextResponse.json({ success: true, data: paymentPlan }, { status: 201 });
}
```

**Audit Log Query Example**:
```typescript
// apps/payments/hooks/usePaymentPlanAuditLog.ts
import { useQuery } from '@tanstack/react-query';

export function usePaymentPlanAuditLog(paymentPlanId: string) {
  return useQuery({
    queryKey: ['audit-logs', 'payment_plan', paymentPlanId],
    queryFn: async () => {
      const response = await fetch(
        `/api/audit-logs?entity_type=payment_plan&entity_id=${paymentPlanId}`
      );
      return response.json();
    },
  });
}
```

## Related Tasks

- **Depends on**: Task 3 (API routes must be implemented)
- **Blocks**: None (optional enhancement)

## Testing Checklist

- [ ] Audit log created on payment plan creation
- [ ] user_id matches authenticated user
- [ ] agency_id matches payment plan agency
- [ ] entity_type is 'payment_plan'
- [ ] entity_id matches created payment plan
- [ ] action is 'create'
- [ ] new_values contains all payment plan fields
- [ ] metadata contains commission calculation parameters
- [ ] metadata contains enrollment details
- [ ] Audit logging failure doesn't break payment plan creation
- [ ] Audit logs queryable by entity_id
- [ ] Audit logs queryable by user_id
- [ ] Audit logs queryable by agency_id

## References

- [docs/architecture.md](../../../docs/architecture.md) - Audit Logging (lines 1264-1323)
- [docs/PRD.md](../../../docs/PRD.md) - FR-10: Audit & Compliance (lines 1206-1244)
- [Story 3.3](../../3-3-student-college-enrollment-linking.md) - Audit logging pattern
