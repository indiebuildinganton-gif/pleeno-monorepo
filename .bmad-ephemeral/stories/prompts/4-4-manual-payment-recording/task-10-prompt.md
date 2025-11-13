# Story 4-4: Manual Payment Recording - Task 10 (OPTIONAL)

## Story Context
**As a** Agency User
**I want** to manually record when an installment is paid
**So that** I can keep the system up-to-date and track which payments have been received

**Previous Tasks**:
- Task 1-9 (All core functionality) - Completed

**Note**: This task is OPTIONAL and provides enhanced UX. It can be skipped if time is limited, as it lays groundwork for Epic 8 (Payment History & Audit Trail).

## Task 10: Payment History Timeline (Optional)

### Description
Add a visual timeline showing the payment history for each installment, providing users with a chronological view of payment activities.

### Implementation Checklist
- [ ] Create `PaymentHistoryTimeline.tsx` component
- [ ] Fetch audit logs for installment from `audit_logs` table
- [ ] Display timeline with entries for:
  - [ ] Payment recorded events
  - [ ] Partial payments
  - [ ] Payment updates/modifications
- [ ] Show for each timeline entry:
  - [ ] Date and time
  - [ ] Action performed (e.g., "Payment recorded")
  - [ ] Amount paid
  - [ ] User who performed the action
  - [ ] Payment notes (if any)
- [ ] Add visual timeline indicators:
  - [ ] Icons for different action types
  - [ ] Connecting lines between events
  - [ ] Color coding (green for payments, blue for updates)
- [ ] Integrate timeline into payment plan detail page:
  - [ ] Add "Show History" button for each installment
  - [ ] Display timeline in modal or expandable section
- [ ] Add loading states and empty states ("No payment history yet")

### Acceptance Criteria
- **AC 5** (Enhanced): Payment history provides transparency into all payment activities
- **Foundation for Epic 8**: Timeline component ready for expanded audit trail features

### Key Constraints
- Multi-Zone Architecture: Timeline component lives in apps/payments/ zone
- RLS Enforcement: Audit logs filtered by agency_id (already implemented in Task 7)
- Date Handling: Display dates in agency timezone using date-helpers.ts

### Dependencies
- Task 7's audit logging implementation
- `date-fns` (4.1.0) - Date formatting
- `shadcn-ui` - Timeline components or custom implementation

### Relevant Artifacts
- Audit logs table from Task 7: `audit_logs`
- Date helpers: [packages/utils/src/date-helpers.ts](packages/utils/src/date-helpers.ts)

### Implementation Guide

**PaymentHistoryTimeline Component**:
```typescript
interface PaymentHistoryTimelineProps {
  installmentId: string
}

export function PaymentHistoryTimeline({ installmentId }: PaymentHistoryTimelineProps) {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', 'installment', installmentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, user:user_id(name)')
        .eq('entity_type', 'installment')
        .eq('entity_id', installmentId)
        .order('created_at', { ascending: false })
      return data
    }
  })

  if (isLoading) return <Spinner />
  if (!auditLogs?.length) return <EmptyState message="No payment history yet" />

  return (
    <div className="payment-timeline">
      {auditLogs.map((log) => (
        <TimelineEntry key={log.id} log={log} />
      ))}
    </div>
  )
}
```

**Timeline Entry**:
```typescript
function TimelineEntry({ log }: { log: AuditLog }) {
  return (
    <div className="timeline-entry">
      <div className="timeline-marker">
        <PaymentIcon className="text-green-600" />
      </div>
      <div className="timeline-content">
        <div className="timeline-header">
          <span className="font-medium">{formatAction(log.action)}</span>
          <span className="text-sm text-muted-foreground">
            {formatDateTime(log.created_at)}
          </span>
        </div>
        <div className="timeline-details">
          <div>Amount: {formatCurrency(log.new_values.paid_amount)}</div>
          {log.metadata?.notes && (
            <div className="text-sm italic">"{log.metadata.notes}"</div>
          )}
          <div className="text-xs text-muted-foreground">
            By {log.user.name}
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Integration in InstallmentsList**:
```typescript
<TableCell>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setSelectedInstallmentForHistory(installment)}
  >
    <HistoryIcon className="h-4 w-4" />
    History
  </Button>
</TableCell>

{/* Modal */}
<Dialog open={!!selectedInstallmentForHistory} onOpenChange={() => setSelectedInstallmentForHistory(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Payment History - Installment #{selectedInstallmentForHistory?.installment_number}</DialogTitle>
    </DialogHeader>
    <PaymentHistoryTimeline installmentId={selectedInstallmentForHistory?.id} />
  </DialogContent>
</Dialog>
```

### UI/UX Guidelines
- Timeline should be easy to scan visually
- Most recent events should appear at the top
- Use consistent date/time formatting throughout
- Icons should be intuitive (payment = money icon, update = pencil icon)
- Consider mobile responsiveness

---

## Manifest Update Instructions

**Before starting Task 10**, update the manifest:

1. Open `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/manifest.md`
2. Update Task 9:
   ```markdown
   ### Task 9: Testing
   - Status: Completed
   - Started: [Date]
   - Completed: [Current Date]
   - Notes: [Add any notes about Task 9 implementation]
   ```
3. Update Task 10:
   ```markdown
   ### Task 10: Payment History Timeline (Optional)
   - Status: In Progress
   - Started: [Current Date]
   - Completed:
   - Notes: Optional task - enhances UX and prepares for Epic 8
   ```

**If skipping Task 10**:
```markdown
### Task 10: Payment History Timeline (Optional)
- Status: Skipped
- Started:
- Completed:
- Notes: Skipped for now - can be implemented as part of Epic 8
```

---

## Implementation Notes from Previous Tasks

- **Task 7**: Audit logging infrastructure is in place and capturing all payment events
- **Task 1-9**: All core functionality is complete and tested

This task (Task 10) adds a nice-to-have feature that improves transparency and prepares for Epic 8.

**Decision Point**: Discuss with the team whether to implement this now or defer to Epic 8. The core feature is complete without this task.

---

## Next Steps

**Option A - Implement Task 10**:
1. Update the manifest as described above
2. Implement Task 10 following the checklist
3. Test the payment history timeline
4. When Task 10 is complete:
   - Update manifest: Set Task 10 status to "Completed" with completion date
   - Mark the entire story as DONE

**Option B - Skip Task 10**:
1. Update the manifest to mark Task 10 as "Skipped"
2. Mark the entire story as DONE (Tasks 1-9 are sufficient for story completion)

**Final Step - Either Option**:
Update the overall story status in the manifest:
```markdown
**Story**: Manual Payment Recording
**Status**: Completed
**Started**: [Date]
**Completed**: [Current Date]
```

**Reference**: For full story context, see `.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml`
