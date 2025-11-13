# Task 12: Audit Logging

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** All
**Status:** pending

## Context

This task implements comprehensive audit logging for payment plan and installment creation to ensure traceability, compliance, and debugging capability. All wizard actions and data are logged to the audit_logs table.

## Task Description

Create audit logging functionality that captures payment plan creation with all wizard data, including each installment creation event, for complete traceability.

## Subtasks

- [ ] Verify audit_logs table exists (should be created in earlier stories)
- [ ] Create audit logging utility function (if not exists)
- [ ] Log payment plan creation event in POST /api/payment-plans route
- [ ] Log each installment creation event (optional: batch log)
- [ ] Include all relevant data in new_values JSONB column
- [ ] Include commission calculation parameters
- [ ] Add error logging for failed payment plan creation attempts
- [ ] Test audit log entries are created correctly
- [ ] Verify audit logs are queryable and useful for debugging

## Technical Requirements

**Audit Log Table Schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  agency_id UUID REFERENCES agencies(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  entity_type TEXT NOT NULL,  -- 'payment_plan', 'installment'
  entity_id UUID,
  action TEXT NOT NULL,       -- 'create', 'update', 'delete'
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Audit Logging Utility:**
```typescript
// packages/utils/src/audit-logger.ts

interface AuditLogEntry {
  user_id: string
  agency_id: string
  entity_type: string
  entity_id?: string
  action: 'create' | 'update' | 'delete'
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  metadata?: Record<string, any>
}

export async function logAudit(
  supabaseClient: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  const { error } = await supabaseClient
    .from('audit_logs')
    .insert({
      user_id: entry.user_id,
      agency_id: entry.agency_id,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      action: entry.action,
      old_values: entry.old_values || null,
      new_values: entry.new_values || null,
      metadata: entry.metadata || null,
    })

  if (error) {
    console.error('Failed to log audit entry:', error)
    // Don't throw - audit logging failure shouldn't break the main flow
  }
}
```

**Payment Plan Creation Audit Log:**
```typescript
// In POST /api/payment-plans route after successful creation

await logAudit(supabase, {
  user_id: userId,
  agency_id: agencyId,
  entity_type: 'payment_plan',
  entity_id: createdPlan.id,
  action: 'create_with_installments',
  new_values: {
    student_id: body.student_id,
    course_name: body.course_name,
    total_course_value: body.total_course_value,
    commission_rate: body.commission_rate,
    course_dates: {
      start: body.course_start_date,
      end: body.course_end_date,
    },
    payment_structure: {
      initial_payment_amount: body.initial_payment_amount,
      initial_payment_paid: body.initial_payment_paid,
      number_of_installments: body.number_of_installments,
      payment_frequency: body.payment_frequency,
    },
    fees: {
      materials_cost: body.materials_cost,
      admin_fees: body.admin_fees,
      other_fees: body.other_fees,
    },
    timeline: {
      first_college_due_date: body.first_college_due_date,
      student_lead_time_days: body.student_lead_time_days,
    },
    gst_inclusive: body.gst_inclusive,
    calculated_values: {
      commissionable_value: createdPlan.commissionable_value,
      expected_commission: createdPlan.expected_commission,
    },
  },
  metadata: {
    wizard_version: '1.0',
    installment_count: body.installments.length,
    source: 'payment_plan_wizard',
  },
})
```

**Installment Creation Audit Logs (Batch):**
```typescript
// Option 1: Single log entry for all installments
await logAudit(supabase, {
  user_id: userId,
  agency_id: agencyId,
  entity_type: 'installments',
  entity_id: createdPlan.id, // Reference parent payment plan
  action: 'create_batch',
  new_values: {
    installments: createdInstallments.map(inst => ({
      installment_number: inst.installment_number,
      amount: inst.amount,
      student_due_date: inst.student_due_date,
      college_due_date: inst.college_due_date,
      is_initial_payment: inst.is_initial_payment,
      status: inst.status,
    })),
  },
  metadata: {
    payment_plan_id: createdPlan.id,
    total_installments: createdInstallments.length,
  },
})

// Option 2: Individual log entry per installment (more granular, but verbose)
for (const installment of createdInstallments) {
  await logAudit(supabase, {
    user_id: userId,
    agency_id: agencyId,
    entity_type: 'installment',
    entity_id: installment.id,
    action: 'create',
    new_values: {
      payment_plan_id: createdPlan.id,
      installment_number: installment.installment_number,
      amount: installment.amount,
      student_due_date: installment.student_due_date,
      college_due_date: installment.college_due_date,
      is_initial_payment: installment.is_initial_payment,
      generates_commission: installment.generates_commission,
      status: installment.status,
    },
  })
}
```

**Error Audit Logging:**
```typescript
// In POST /api/payment-plans error handler

catch (error) {
  await logAudit(supabase, {
    user_id: userId,
    agency_id: agencyId,
    entity_type: 'payment_plan',
    action: 'create',
    metadata: {
      error: error.message,
      error_code: error.code,
      request_body: body, // Include for debugging
      stack: error.stack, // Optional, for development only
    },
  })

  throw error
}
```

## Acceptance Criteria

✅ **AC All:** Comprehensive audit logging
- Log payment plan creation with all wizard data
- Log installment creation (batch or individual)
- Include commission calculation parameters
- Log errors for debugging
- Ensure logs are queryable

## References

**From Story Context:**
- Architecture: Audit logging pattern from previous stories
- Security: Audit logs required for compliance
- Task 9: Payment plan creation API (where logging occurs)

## Testing Checklist

### Unit Tests

- [ ] Test logAudit utility function:
  - Successfully inserts audit log
  - Handles missing optional fields
  - Doesn't throw on insert error (fail gracefully)

### Integration Tests

- [ ] Test payment plan creation logging:
  - Audit log created on successful payment plan creation
  - Audit log includes all wizard data
  - Audit log includes calculated commission values

- [ ] Test installment creation logging:
  - Batch log created with all installments
  - OR individual logs created per installment

- [ ] Test error logging:
  - Audit log created on payment plan creation failure
  - Error details captured in metadata

- [ ] Test audit log queries:
  - Can query all payment plan creations by agency
  - Can query all payment plan creations by user
  - Can query all payment plan creations in date range
  - Can retrieve full wizard data from audit log

### E2E Tests

- [ ] Create payment plan through wizard
- [ ] Verify audit log entry exists
- [ ] Verify all expected data present in new_values
- [ ] Query audit log and verify data integrity

## Dev Notes

**Why Audit Logging?**

1. **Compliance:** Regulatory requirements for financial transactions
2. **Debugging:** Trace issues back to original data entry
3. **Security:** Detect unauthorized access or modifications
4. **Analytics:** Understand user behavior and wizard completion rates
5. **Data Recovery:** Restore data if corrupted

**What to Log:**

✅ **Always Log:**
- Who (user_id)
- What (entity_type, action)
- When (timestamp, auto-generated)
- Where (agency_id for multi-tenancy)
- Details (new_values)

✅ **For Payment Plans:**
- All Step 1 data (student, course, commission)
- All Step 2 data (payment structure, fees, timeline, GST)
- All calculated values (commissionable_value, expected_commission)
- Installment count and structure

✅ **For Errors:**
- Error message and code
- Request body (for debugging)
- Stack trace (development only)

❌ **Never Log:**
- Sensitive data (passwords, tokens)
- Excessive PII (unless required for compliance)
- Raw stack traces in production (security risk)

**Batch vs Individual Logging:**

*Batch Approach (Recommended):*
- Single audit log entry for all installments
- More efficient (fewer DB writes)
- Easier to review (one entry per payment plan)
- Sufficient for most use cases

*Individual Approach:*
- Separate audit log entry per installment
- More granular traceability
- Useful if installments are modified individually
- More verbose, harder to review

Choose batch approach for this story. Individual logging can be added later if needed.

**Performance Considerations:**

Audit logging adds overhead to the payment plan creation API. To minimize impact:
- Use fire-and-forget pattern (don't await if not critical)
- Or use background job queue for audit logging
- Don't let audit failures break main flow

**Fire-and-Forget Pattern:**
```typescript
logAudit(supabase, entry).catch(err => {
  console.error('Audit logging failed:', err)
  // Logged but doesn't block response
})
```

**Querying Audit Logs:**

Example queries:

```sql
-- All payment plan creations by agency in last 30 days
SELECT * FROM audit_logs
WHERE entity_type = 'payment_plan'
  AND action = 'create_with_installments'
  AND agency_id = '...'
  AND timestamp > NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC;

-- All failed payment plan creation attempts
SELECT * FROM audit_logs
WHERE entity_type = 'payment_plan'
  AND action = 'create'
  AND metadata->>'error' IS NOT NULL
ORDER BY timestamp DESC;

-- Retrieve full wizard data for a specific payment plan
SELECT new_values FROM audit_logs
WHERE entity_type = 'payment_plan'
  AND entity_id = '...'
  AND action = 'create_with_installments';
```

**RLS on Audit Logs:**
Ensure audit_logs table has RLS policies:
- Users can only read their agency's audit logs
- Admin/system can read all audit logs
- Only system can insert audit logs (not direct user access)

**Retention Policy:**
Consider implementing audit log retention:
- Keep detailed logs for 1 year
- Archive older logs to cold storage
- Comply with data retention regulations
