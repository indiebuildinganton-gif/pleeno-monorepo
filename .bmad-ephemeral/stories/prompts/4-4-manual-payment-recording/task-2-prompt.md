# Story 4-4: Manual Payment Recording - Task 2

## Story Context
**As a** Agency User
**I want** to manually record when an installment is paid
**So that** I can keep the system up-to-date and track which payments have been received

**Previous Task**: Task 1 (Record Payment API) should be completed before starting this task.

## Task 2: Mark as Paid UI Component

### Description
Create the modal component that allows users to mark installments as paid from the UI.

### Implementation Checklist
- [ ] Create `MarkAsPaidModal.tsx` component in `apps/payments/app/plans/[id]/components/`
- [ ] Set up React Hook Form with Zod validation (reuse RecordPaymentSchema)
- [ ] Add form fields:
  - [ ] `paid_date`: DatePicker component (default: today, max: today)
  - [ ] `paid_amount`: NumberInput (default: installment.amount, validation: positive, max 2 decimals)
  - [ ] `notes`: Textarea (optional, max 500 chars with character counter)
- [ ] Implement form validation on client side
- [ ] Add modal actions: Submit and Cancel buttons
- [ ] Display installment details in modal header (installment number, due date, amount)
- [ ] Show validation errors inline on form fields
- [ ] Add loading state during submission
- [ ] Close modal on successful submission
- [ ] Handle error display (toast notification)
- [ ] Support keyboard shortcuts (Esc to close, Enter to submit when valid)
- [ ] Add accessibility attributes (ARIA labels, roles)

### Acceptance Criteria
- **AC 1**: Mark Installment as Paid - User can mark pending installments as paid, recording payment date, actual amount paid, with validation (no future dates, positive amounts).
- **AC 2**: Partial Payment Support - User can record partial payments where paid_amount < installment.amount.
- **AC 3**: Payment Notes - User can add optional notes (max 500 chars) to payment record.
- **AC 6**: Optimistic UI Updates - Client-side optimistic update with instant UI feedback. Revert on error.

### Key Constraints
- Client-Side Validation: React Hook Form + Zod on MarkAsPaidModal form
- Currency Formatting: Use packages/utils/src/formatters.ts formatCurrency() with agency.currency
- Date Handling: Store paid_date in UTC, display in agency timezone using date-helpers.ts
- Path Format: Use project-relative paths only

### Interface Definition

**MarkAsPaidModal Component**

Props:
```typescript
interface MarkAsPaidModalProps {
  installment: Installment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

Form Fields:
- `paid_date`: DatePicker (default: today, max: today)
- `paid_amount`: NumberInput (default: installment.amount)
- `notes`: Textarea (optional, max 500 chars with counter)

Actions:
- Submit: Calls useRecordPayment mutation (will be implemented in Task 3)
- Cancel: Closes modal

### Dependencies
- `react-hook-form` (7.66.0) - Form state management
- `zod` (4.x) - Schema validation (reuse RecordPaymentSchema from Task 1)
- `shadcn-ui` - UI components: Dialog, Form, DatePicker, Input, Textarea, Button
- `date-fns` (4.1.0) - Date manipulation and validation
- Existing utilities: `packages/utils/src/formatters.ts` (formatCurrency), `packages/utils/src/date-helpers.ts`

### Relevant Artifacts
- Formatter utilities: [packages/utils/src/formatters.ts](packages/utils/src/formatters.ts)
- Date helpers: [packages/utils/src/date-helpers.ts](packages/utils/src/date-helpers.ts)
- Validation schema from Task 1: `packages/validations/src/installment.schema.ts`

### UI/UX Guidelines
- Modal should be responsive and work on mobile devices
- Use consistent styling with existing shadcn-ui components
- Show clear validation messages (e.g., "Payment date cannot be in the future")
- Character counter for notes field should update in real-time
- Disable submit button while form is invalid or submitting
- Show loading spinner on submit button during API call

---

## Manifest Update Instructions

**Before starting Task 2**, update the manifest:

1. Open `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/manifest.md`
2. Update Task 1:
   ```markdown
   ### Task 1: Record Payment API
   - Status: Completed
   - Started: [Date]
   - Completed: [Current Date]
   - Notes: [Add any notes about Task 1 implementation]
   ```
3. Update Task 2:
   ```markdown
   ### Task 2: Mark as Paid UI Component
   - Status: In Progress
   - Started: [Current Date]
   - Completed:
   - Notes:
   ```

---

## Implementation Notes from Previous Task

Task 1 should have created:
- API route: `apps/payments/app/api/installments/[id]/record-payment/route.ts`
- Zod schema: `packages/validations/src/installment.schema.ts` (RecordPaymentSchema)
- Database transaction logic for updating installments and payment plans
- RLS enforcement and audit logging

This task (Task 2) builds on that by creating the UI component that calls the API.

---

## Next Steps

1. Update the manifest as described above
2. Implement Task 2 following the checklist
3. Test the modal component (visual testing, form validation)
4. When Task 2 is complete:
   - Update manifest: Set Task 2 status to "Completed" with completion date
   - Add implementation notes
   - Move to `task-3-prompt.md` (TanStack Query mutation)

**Note**: Task 2 creates the UI component, but Task 3 will wire it up with the actual mutation logic.

**Reference**: For full story context, see `.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml`
