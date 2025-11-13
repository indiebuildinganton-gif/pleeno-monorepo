# Story 4-4: Manual Payment Recording - Task 5

## Story Context
**As a** Agency User
**I want** to manually record when an installment is paid
**So that** I can keep the system up-to-date and track which payments have been received

**Previous Tasks**:
- Task 1 (Record Payment API) - Completed
- Task 2 (Mark as Paid UI Component) - Completed
- Task 3 (TanStack Query Mutation) - Completed
- Task 4 (Payment Plan Detail Page Updates) - Completed

## Task 5: Dashboard Widget Updates

### Description
Ensure dashboard widgets reflect payment status updates after recording payments.

### Implementation Checklist
- [ ] Identify all dashboard widgets that display payment data
- [ ] Verify widgets use TanStack Query with proper query keys
- [ ] Ensure query keys include `['dashboard', 'payment-status']` or similar
- [ ] Test that widgets refetch after payment recording (via Task 3's query invalidation)
- [ ] Update dashboard widgets to show:
  - [ ] Next due date (should update when installment marked paid)
  - [ ] Cash flow projection (should reflect new paid amounts)
  - [ ] Commission breakdown (should show updated earned commission)
  - [ ] Payment status summary (pending vs paid counts)
- [ ] Verify real-time updates without page refresh
- [ ] Add loading states during refetch

### Acceptance Criteria
- **AC 5**: Dashboard and Reports Reflect Updates - Dashboard widgets, next due date, cash flow projection, and commission breakdown all update to reflect new payment status.

### Key Constraints
- Query Invalidation: Widgets should refetch when `['dashboard', 'payment-status']` is invalidated (handled by Task 3)
- Multi-Zone Architecture: Dashboard widgets may be in different zones
- Currency Formatting: Use packages/utils/src/formatters.ts formatCurrency()

### Relevant Artifacts
- Task 3's query invalidation: Invalidates `['dashboard', 'payment-status']` on payment recording
- Architecture: Multi-zone architecture - payment widgets may span multiple zones

### Implementation Guide

**Dashboard Widget Query Pattern**:
```typescript
// Ensure dashboard widgets use this query key structure
const { data, isLoading } = useQuery({
  queryKey: ['dashboard', 'payment-status', agencyId],
  queryFn: fetchPaymentStatusData,
  staleTime: 1000 * 60 * 2 // 2 minutes
})
```

**Query Invalidation** (already handled by Task 3):
```typescript
// Task 3 invalidates these keys on payment recording:
queryClient.invalidateQueries({ queryKey: ['dashboard', 'payment-status'] })
```

**Widgets to Update**:
1. **Next Due Date Widget**: Shows earliest unpaid installment due date
2. **Cash Flow Projection Widget**: Shows expected vs actual cash flow
3. **Commission Breakdown Widget**: Shows expected vs earned commission
4. **Payment Status Summary**: Shows counts of pending/partial/paid installments

---

## Manifest Update Instructions

**Before starting Task 5**, update the manifest:

1. Open `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/manifest.md`
2. Update Task 4:
   ```markdown
   ### Task 4: Payment Plan Detail Page Updates
   - Status: Completed
   - Started: [Date]
   - Completed: [Current Date]
   - Notes: [Add any notes about Task 4 implementation]
   ```
3. Update Task 5:
   ```markdown
   ### Task 5: Dashboard Widget Updates
   - Status: In Progress
   - Started: [Current Date]
   - Completed:
   - Notes:
   ```

---

## Implementation Notes from Previous Tasks

- **Task 1**: API updates installment status and payment plan status
- **Task 3**: `useRecordPayment` invalidates `['dashboard', 'payment-status']` on success
- **Task 4**: Payment plan detail page shows updated progress

This task (Task 5) ensures the dashboard reflects these changes automatically.

**Note**: Most of the work is already done by Task 3's query invalidation. This task primarily involves:
1. Verifying dashboard widgets use the correct query keys
2. Testing that widgets refetch automatically
3. Ensuring widget UI updates properly with new data

---

## Next Steps

1. Update the manifest as described above
2. Implement Task 5 following the checklist
3. Test dashboard updates:
   - Record a payment in a payment plan
   - Verify dashboard widgets update without page refresh
   - Check all relevant metrics (next due date, cash flow, commission)
4. When Task 5 is complete:
   - Update manifest: Set Task 5 status to "Completed" with completion date
   - Add implementation notes
   - Move to `task-6-prompt.md` (Partial Payment Display)

**Reference**: For full story context, see `.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml`
