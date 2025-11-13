# Story 4-4: Manual Payment Recording - Task 3

## Story Context
**As a** Agency User
**I want** to manually record when an installment is paid
**So that** I can keep the system up-to-date and track which payments have been received

**Previous Tasks**:
- Task 1 (Record Payment API) - Completed
- Task 2 (Mark as Paid UI Component) - Completed

## Task 3: TanStack Query Mutation for Payment Recording

### Description
Create the TanStack Query mutation hook that handles payment recording with optimistic updates.

### Implementation Checklist
- [ ] Create `useRecordPayment.ts` hook in `apps/payments/app/plans/[id]/hooks/`
- [ ] Set up TanStack Query mutation with POST to `/api/installments/[id]/record-payment`
- [ ] Implement optimistic update logic:
  - [ ] Update installment in cache immediately before API call
  - [ ] Update payment plan status if all installments paid
  - [ ] Update earned_commission in cache
- [ ] Implement rollback on error (revert optimistic updates)
- [ ] Add query invalidation on success:
  - [ ] `['payment-plans', planId]` - Payment plan detail
  - [ ] `['payment-plans']` - Payment plan list
  - [ ] `['dashboard', 'payment-status']` - Dashboard widgets
- [ ] Add toast notifications:
  - [ ] Success: "Payment recorded successfully"
  - [ ] Error: Display error message from API
- [ ] Return mutation state: `isPending`, `isError`, `error`
- [ ] Export typed mutation function

### Acceptance Criteria
- **AC 6**: Optimistic UI Updates - Client-side optimistic update with instant UI feedback. Revert on error. TanStack Query invalidates queries on success.

### Key Constraints
- Optimistic Updates: TanStack Query mutation with optimistic cache update, revert on error
- Query Invalidation: Invalidate ['payment-plans', planId], ['payment-plans'], ['dashboard', 'payment-status']

### Interface Definition

**useRecordPayment Hook**

```typescript
const { mutate: recordPayment, isPending } = useRecordPayment()

recordPayment({
  installmentId: string,
  paid_date: string,
  paid_amount: number,
  notes?: string
}, {
  onSuccess: (data) => void,
  onError: (error) => void
})
```

Features:
- Optimistic update: Immediately update cache before API call
- Invalidate queries on success: payment-plans, dashboard widgets
- Revert optimistic update on error
- Show toast notifications

### Dependencies
- `@tanstack/react-query` (5.90.7) - TanStack Query for mutations with optimistic updates, query invalidation, error handling
- `shadcn-ui` Toast component for notifications

### Relevant Artifacts
- Existing query hook from Story 4.3: `apps/payments/app/plans/[id]/hooks/usePaymentPlanDetail.ts`
- Query key structure: `['payment-plans', planId]`, stale time: 2 minutes

### Implementation Guide

**Optimistic Update Pattern**:
```typescript
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: async (data) => {
    // Call API
    const response = await fetch(`/api/installments/${data.installmentId}/record-payment`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return response.json()
  },

  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['payment-plans', planId] })

    // Snapshot previous value
    const previousData = queryClient.getQueryData(['payment-plans', planId])

    // Optimistically update cache
    queryClient.setQueryData(['payment-plans', planId], (old) => {
      // Update installment in old data
      return updatedData
    })

    // Return context with snapshot
    return { previousData }
  },

  onError: (err, newData, context) => {
    // Revert optimistic update
    queryClient.setQueryData(['payment-plans', planId], context.previousData)

    // Show error toast
    toast.error(err.message)
  },

  onSuccess: (data) => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['payment-plans', planId] })
    queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'payment-status'] })

    // Show success toast
    toast.success('Payment recorded successfully')
  }
})
```

---

## Manifest Update Instructions

**Before starting Task 3**, update the manifest:

1. Open `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/manifest.md`
2. Update Task 2:
   ```markdown
   ### Task 2: Mark as Paid UI Component
   - Status: Completed
   - Started: [Date]
   - Completed: [Current Date]
   - Notes: [Add any notes about Task 2 implementation]
   ```
3. Update Task 3:
   ```markdown
   ### Task 3: TanStack Query Mutation for Payment Recording
   - Status: In Progress
   - Started: [Current Date]
   - Completed:
   - Notes:
   ```

---

## Implementation Notes from Previous Tasks

- **Task 1**: Created API endpoint at `/api/installments/[id]/record-payment`
- **Task 2**: Created `MarkAsPaidModal` component with form validation

This task (Task 3) connects the modal (Task 2) to the API (Task 1) via TanStack Query with optimistic updates.

**Integration Point**: Update the `MarkAsPaidModal` component to use the `useRecordPayment` hook:
```typescript
const { mutate: recordPayment, isPending } = useRecordPayment()

const onSubmit = (data) => {
  recordPayment({
    installmentId: installment.id,
    ...data
  }, {
    onSuccess: () => {
      onClose()
      onSuccess?.()
    }
  })
}
```

---

## Next Steps

1. Update the manifest as described above
2. Implement Task 3 following the checklist
3. Wire up the mutation hook in the `MarkAsPaidModal` component
4. Test optimistic updates and error handling
5. When Task 3 is complete:
   - Update manifest: Set Task 3 status to "Completed" with completion date
   - Add implementation notes
   - Move to `task-4-prompt.md` (Payment Plan Detail Page Updates)

**Reference**: For full story context, see `.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml`
