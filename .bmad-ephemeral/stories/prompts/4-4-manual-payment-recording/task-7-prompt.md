# Story 4-4: Manual Payment Recording - Task 7

## Story Context
**As a** Agency User
**I want** to manually record when an installment is paid
**So that** I can keep the system up-to-date and track which payments have been received

**Previous Tasks**:
- Task 1 (Record Payment API) - Completed
- Task 2 (Mark as Paid UI Component) - Completed
- Task 3 (TanStack Query Mutation) - Completed
- Task 4 (Payment Plan Detail Page Updates) - Completed
- Task 5 (Dashboard Widget Updates) - Completed
- Task 6 (Partial Payment Display) - Completed

## Task 7: Audit Logging

### Description
Implement comprehensive audit logging for all payment recording actions to support future audit trails and payment history (Epic 8).

### Implementation Checklist
- [ ] Create audit log table schema (if not exists):
  - [ ] `audit_logs` table with columns:
    - [ ] id (uuid, primary key)
    - [ ] agency_id (uuid, foreign key, indexed)
    - [ ] user_id (uuid, foreign key)
    - [ ] entity_type (text, e.g., "installment")
    - [ ] entity_id (uuid, e.g., installment.id)
    - [ ] action (text, e.g., "payment_recorded")
    - [ ] old_values (jsonb, nullable)
    - [ ] new_values (jsonb)
    - [ ] metadata (jsonb, nullable, e.g., notes, ip_address)
    - [ ] created_at (timestamp with time zone)
- [ ] Add RLS policies for audit_logs table (agency_id filtering)
- [ ] Create audit logging utility function
- [ ] Integrate audit logging into Task 1's API endpoint:
  - [ ] Log old installment values before update
  - [ ] Log new installment values after update
  - [ ] Include user context (user_id from auth session)
  - [ ] Include metadata (payment notes, timestamp)
- [ ] Add error handling for audit logging failures (should not block payment recording)
- [ ] Create migration file for audit_logs table

### Acceptance Criteria
- **AC 7** (Foundation): All payment recordings are logged with user context, old/new values, and timestamp for future audit trails (Epic 8).

### Key Constraints
- Audit Logging: Log all payment recordings with user context (user_id, timestamp, old/new values)
- RLS Enforcement: Audit logs filtered by agency_id
- Database Transaction: Audit logging should be part of the same transaction as payment recording

### Implementation Guide

**Audit Logs Table Schema** (Migration):
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_agency_id ON audit_logs(agency_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their agency"
  ON audit_logs FOR SELECT
  USING (agency_id = auth.current_agency_id());

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);
```

**Audit Logging Utility**:
```typescript
// packages/database/src/audit.ts
export async function logAudit({
  agency_id,
  user_id,
  entity_type,
  entity_id,
  action,
  old_values,
  new_values,
  metadata
}: AuditLogInput) {
  try {
    await supabase.from('audit_logs').insert({
      agency_id,
      user_id,
      entity_type,
      entity_id,
      action,
      old_values,
      new_values,
      metadata,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    // Log error but don't throw (audit logging should not block operations)
    console.error('Audit logging failed:', error)
  }
}
```

**Integration in Task 1's API Route**:
```typescript
// Before update: capture old values
const oldInstallment = await supabase
  .from('installments')
  .select('*')
  .eq('id', installmentId)
  .single()

// Perform update
const { data: updatedInstallment } = await supabase
  .from('installments')
  .update({
    paid_date,
    paid_amount,
    status,
    payment_notes: notes
  })
  .eq('id', installmentId)
  .select()
  .single()

// Log audit after update
await logAudit({
  agency_id: oldInstallment.agency_id,
  user_id: session.user.id,
  entity_type: 'installment',
  entity_id: installmentId,
  action: 'payment_recorded',
  old_values: {
    status: oldInstallment.status,
    paid_date: oldInstallment.paid_date,
    paid_amount: oldInstallment.paid_amount,
    payment_notes: oldInstallment.payment_notes
  },
  new_values: {
    status: updatedInstallment.status,
    paid_date: updatedInstallment.paid_date,
    paid_amount: updatedInstallment.paid_amount,
    payment_notes: updatedInstallment.payment_notes
  },
  metadata: {
    notes,
    ip_address: request.headers.get('x-forwarded-for')
  }
})
```

---

## Manifest Update Instructions

**Before starting Task 7**, update the manifest:

1. Open `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/manifest.md`
2. Update Task 6:
   ```markdown
   ### Task 6: Partial Payment Display
   - Status: Completed
   - Started: [Date]
   - Completed: [Current Date]
   - Notes: [Add any notes about Task 6 implementation]
   ```
3. Update Task 7:
   ```markdown
   ### Task 7: Audit Logging
   - Status: In Progress
   - Started: [Current Date]
   - Completed:
   - Notes:
   ```

---

## Implementation Notes from Previous Tasks

- **Task 1**: API endpoint handles payment recording - this is where audit logging integrates

This task (Task 7) adds comprehensive audit logging to support future Epic 8 (Payment History & Audit Trail).

**Important**: Audit logging should never block payment recording. If audit logging fails, log the error but allow the payment to succeed.

---

## Next Steps

1. Update the manifest as described above
2. Implement Task 7 following the checklist
3. Create and run migration for audit_logs table
4. Test audit logging:
   - Record a payment
   - Query audit_logs table
   - Verify old_values, new_values, and metadata are captured
5. When Task 7 is complete:
   - Update manifest: Set Task 7 status to "Completed" with completion date
   - Add implementation notes
   - Move to `task-8-prompt.md` (Commission Recalculation)

**Reference**: For full story context, see `.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml`
