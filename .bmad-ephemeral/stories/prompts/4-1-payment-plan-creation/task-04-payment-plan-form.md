# Task 4: Payment Plan Form Component

**Story Context**: [4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml)

## Task Description

Create payment plan creation form at /payments/plans/new with enrollment selection, form fields, real-time validation, and inline error display.

## Acceptance Criteria

- AC 1: Payment Plan Data Entry
- AC 2: Enrollment Selection
- AC 4: Payment Plan Metadata
- AC 5: Data Validation

## Subtasks

1. Create `/payments/plans/new/page.tsx` with payment plan creation form

2. Add enrollment selection dropdown (search/autocomplete):
   - Query enrollments with student, college, branch info
   - Display format: "Student Name - College (Branch) - Program"
   - Filter enrollments by agency_id via RLS
   - Support search/filter functionality

3. Add form fields:
   - total_amount input (currency formatted)
   - start_date input (date picker)
   - notes textarea (optional)
   - reference_number input (optional)
   - commission_rate display (read-only, auto-populated from branch)
   - expected_commission display (calculated in real-time)

4. Implement React Hook Form + Zod validation schema

5. Show validation errors inline

6. Display real-time commission preview as user types

## Implementation Notes

**File Locations**:
- `apps/payments/app/plans/new/page.tsx`
- `apps/payments/app/plans/new/components/PaymentPlanForm.tsx`
- `packages/validations/src/payment-plan.schema.ts`

**Payment Plan Form Component**:
```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentPlanSchema } from '@/packages/validations/src/payment-plan.schema';
import { EnrollmentSelect } from './EnrollmentSelect';
import { PaymentPlanSummary } from './PaymentPlanSummary';

export function PaymentPlanForm() {
  const form = useForm({
    resolver: zodResolver(paymentPlanSchema),
    defaultValues: {
      enrollment_id: '',
      total_amount: 0,
      start_date: new Date(),
      notes: '',
      reference_number: '',
    },
  });

  const watchedAmount = form.watch('total_amount');
  const watchedRate = form.watch('commission_rate');

  // Real-time commission calculation
  const expectedCommission = calculateExpectedCommission(
    watchedAmount,
    watchedRate
  );

  return (
    <Form {...form}>
      <EnrollmentSelect
        value={form.getValues('enrollment_id')}
        onChange={(value) => form.setValue('enrollment_id', value)}
        error={form.formState.errors.enrollment_id?.message}
      />

      <Input
        type="number"
        label="Total Amount"
        placeholder="Enter total amount"
        {...form.register('total_amount', { valueAsNumber: true })}
        error={form.formState.errors.total_amount?.message}
      />

      <DatePicker
        label="Start Date"
        value={form.getValues('start_date')}
        onChange={(date) => form.setValue('start_date', date)}
        error={form.formState.errors.start_date?.message}
      />

      <Textarea
        label="Notes (Optional)"
        placeholder="Add any notes or comments"
        {...form.register('notes')}
      />

      <Input
        label="Reference Number (Optional)"
        placeholder="Invoice #, PO #, etc."
        {...form.register('reference_number')}
      />

      <PaymentPlanSummary
        totalAmount={watchedAmount}
        commissionRate={watchedRate}
        expectedCommission={expectedCommission}
        currency="USD"
      />

      <Button type="submit">Create Payment Plan</Button>
    </Form>
  );
}
```

**Zod Validation Schema**:
```typescript
// packages/validations/src/payment-plan.schema.ts
import { z } from 'zod';

export const paymentPlanSchema = z.object({
  enrollment_id: z.string().uuid('Please select a valid enrollment'),
  total_amount: z
    .number()
    .positive('Amount must be greater than 0')
    .min(0.01, 'Amount must be at least $0.01'),
  start_date: z.date(),
  commission_rate: z
    .number()
    .min(0, 'Commission rate must be at least 0%')
    .max(100, 'Commission rate cannot exceed 100%'),
  notes: z.string().max(10000, 'Notes cannot exceed 10,000 characters').optional(),
  reference_number: z.string().max(255, 'Reference number cannot exceed 255 characters').optional(),
});

export type PaymentPlanFormData = z.infer<typeof paymentPlanSchema>;
```

**Page Layout**:
```tsx
// apps/payments/app/plans/new/page.tsx
import { PaymentPlanForm } from './components/PaymentPlanForm';

export default function NewPaymentPlanPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6">Create Payment Plan</h1>
      <PaymentPlanForm />
    </div>
  );
}
```

## Related Tasks

- **Depends on**: Task 3 (API routes), Task 7 (EnrollmentSelect component)
- **Blocks**: Task 6 (creation mutation)
- **Uses**: Task 5 (PaymentPlanSummary component)

## Testing Checklist

- [ ] Form renders with all fields
- [ ] Enrollment dropdown loads and displays enrollments
- [ ] Total amount input validates positive numbers
- [ ] Start date picker allows date selection
- [ ] Notes textarea accepts text input
- [ ] Reference number input accepts text
- [ ] Commission rate displays correctly (read-only)
- [ ] Expected commission updates in real-time
- [ ] Validation errors show inline
- [ ] Form submission triggers API call
- [ ] Loading state shows during submission
- [ ] Success redirects to detail page
- [ ] Error displays toast notification

## References

- [docs/architecture.md](../../../docs/architecture.md) - Multi-Zone Architecture (lines 156-228)
- [docs/PRD.md](../../../docs/PRD.md) - FR-5: Payment Plan Management (lines 734-836)
- [Story 3.3](../../3-3-student-college-enrollment-linking.md) - Form patterns
