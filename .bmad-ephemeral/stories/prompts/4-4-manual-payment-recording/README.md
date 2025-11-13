# Story 4-4: Manual Payment Recording - Implementation Guide

## Overview

**Story ID**: 4-4
**Title**: Manual Payment Recording
**Total Tasks**: 10 (9 required + 1 optional)
**Location**: `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/`

## Story Summary

Enable Agency Users to manually record when an installment is paid, track partial payments, and automatically update payment plan status when all installments are completed.

## Generated Files

This workflow has generated the following prompt files:

1. **task-1-prompt.md** - Record Payment API (includes manifest creation)
2. **task-2-prompt.md** - Mark as Paid UI Component
3. **task-3-prompt.md** - TanStack Query Mutation for Payment Recording
4. **task-4-prompt.md** - Payment Plan Detail Page Updates
5. **task-5-prompt.md** - Dashboard Widget Updates
6. **task-6-prompt.md** - Partial Payment Display
7. **task-7-prompt.md** - Audit Logging
8. **task-8-prompt.md** - Commission Recalculation
9. **task-9-prompt.md** - Testing
10. **task-10-prompt.md** - Payment History Timeline (OPTIONAL)

## Usage Instructions

### Step 1: Setup
1. Open Claude Code Web (https://claude.ai)
2. Navigate to this directory: `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/`

### Step 2: Execute Tasks Sequentially
Execute tasks in order, as each builds on the previous:

1. **Start with Task 1**:
   - Open `task-1-prompt.md`
   - Copy the entire contents
   - Paste into Claude Code Web
   - Follow the instructions
   - **IMPORTANT**: Task 1 will create `manifest.md` - verify it's created

2. **Continue with Tasks 2-9**:
   - For each task:
     - Open the task prompt file (e.g., `task-2-prompt.md`)
     - Copy the entire contents
     - Paste into Claude Code Web
     - Follow the instructions
     - Update the manifest when complete

3. **Optional Task 10**:
   - Decide if you want to implement the payment history timeline
   - If yes: Follow same process as Tasks 2-9
   - If no: Mark as "Skipped" in manifest

### Step 3: Track Progress
- After completing each task, update `manifest.md`
- Mark task status: "In Progress" → "Completed"
- Add completion date and implementation notes
- This helps track progress and provides context for later tasks

### Step 4: Verify Completion
After all tasks are complete:
- Run the test suite (Task 9)
- Verify all acceptance criteria are met
- Update the overall story status in the manifest

## Manifest Tracking

The manifest file (`manifest.md`) is created by Task 1 and tracks:
- Overall story status
- Individual task progress (status, dates, notes)
- Implementation notes

**Location**: `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/manifest.md`

**Update after each task**:
- Set previous task to "Completed" with date
- Set current task to "In Progress" with date
- Add any relevant notes

## Task Dependencies

Tasks must be completed in order due to dependencies:

```
Task 1 (API)
   ↓
Task 2 (UI Component)
   ↓
Task 3 (Mutation Hook) ← Connects Task 1 & 2
   ↓
Task 4 (Page Integration) ← Uses Tasks 1, 2, 3
   ↓
Task 5 (Dashboard Updates) ← Depends on Task 3's query invalidation
   ↓
Task 6 (Partial Payment Display) ← Enhances Tasks 2 & 4
   ↓
Task 7 (Audit Logging) ← Integrates into Task 1's API
   ↓
Task 8 (Commission Calc) ← Integrates into Task 1's API
   ↓
Task 9 (Testing) ← Tests all previous tasks
   ↓
Task 10 (History Timeline) [OPTIONAL] ← Uses Task 7's audit logs
```

## Acceptance Criteria

All tasks work together to satisfy these criteria:

1. **Mark Installment as Paid** - User can mark pending installments as paid with validation (Tasks 1, 2, 3, 4)
2. **Partial Payment Support** - User can record partial payments and see outstanding balance (Tasks 1, 2, 6)
3. **Payment Notes** - User can add optional notes to payments (Tasks 1, 2)
4. **Payment Plan Status Auto-Update** - Status changes to "completed" when all paid (Task 1, 4)
5. **Dashboard Updates** - All widgets reflect new payment status (Task 5, 8)
6. **Optimistic UI Updates** - Instant feedback with rollback on error (Task 3)
7. **Data Isolation** - RLS enforces agency_id filtering (Task 1)

## Tips for Success

1. **Follow the order**: Tasks build on each other - don't skip ahead
2. **Update the manifest**: Keep track of progress and notes
3. **Test as you go**: Don't wait until Task 9 to test
4. **Reference the context**: Full story context is in `.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml`
5. **Ask questions**: If something is unclear, refer back to the context file or documentation

## Key Files Created

By the end of implementation, you will have created:

### Backend
- `apps/payments/app/api/installments/[id]/record-payment/route.ts` - API endpoint
- `packages/validations/src/installment.schema.ts` - Zod validation schema
- `packages/utils/src/commission.ts` - Commission calculation utility
- `packages/database/src/audit.ts` - Audit logging utility
- Migration for `audit_logs` table

### Frontend
- `apps/payments/app/plans/[id]/components/MarkAsPaidModal.tsx` - Payment modal
- `apps/payments/app/plans/[id]/hooks/useRecordPayment.ts` - Mutation hook
- Updates to `InstallmentsList.tsx` - Add "Mark as Paid" button
- Updates to `PaymentPlanDetail.tsx` - Add progress indicators
- Optional: `PaymentHistoryTimeline.tsx` - Timeline component

### Tests
- `__tests__/integration/api/installments/record-payment.test.ts`
- `apps/payments/__tests__/components/MarkAsPaidModal.test.tsx`
- `apps/payments/__tests__/hooks/useRecordPayment.test.ts`
- `__tests__/e2e/payment-recording.spec.ts`

## Need Help?

- **Full context**: `.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml`
- **Architecture docs**: `docs/architecture.md`
- **Epic breakdown**: `docs/epics.md` (Story 4.4 section)
- **Related story**: `.bmad-ephemeral/stories/4-3-payment-plan-list-and-detail-views.md` (previous story)

---

**Ready to start?** Open `task-1-prompt.md` and paste it into Claude Code Web!
