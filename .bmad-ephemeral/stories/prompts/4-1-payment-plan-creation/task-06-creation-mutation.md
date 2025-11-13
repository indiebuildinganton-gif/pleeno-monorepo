# Task 6: Payment Plan Creation Mutation

**Story Context**: [4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml)

## Task Description

Implement TanStack Query mutation for POST /api/payment-plans with success/error handling, navigation, optimistic updates, and cache invalidation.

## Acceptance Criteria

- AC 1: Payment Plan Data Entry
- AC 5: Data Validation

## Subtasks

1. Implement TanStack Query mutation for POST /api/payment-plans

2. Handle success:
   - Navigate to /payments/plans/[id] detail page
   - Show success toast notification

3. Handle error:
   - Display error toast notification with descriptive message
   - Show validation errors inline in form

4. Optimistic update: Add new plan to cache immediately

5. Invalidate payment-plans query cache on success

## Implementation Notes

**File Locations**:
- `apps/payments/hooks/useCreatePaymentPlan.ts`
- `apps/payments/app/plans/new/page.tsx` (integration)

**TanStack Query Mutation Hook**:
```typescript
// apps/payments/hooks/useCreatePaymentPlan.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import type { PaymentPlanFormData } from '@/packages/validations/src/payment-plan.schema';

interface CreatePaymentPlanResponse {
  success: boolean;
  data: {
    id: string;
    enrollment_id: string;
    agency_id: string;
    total_amount: number;
    currency: string;
    start_date: string;
    commission_rate_percent: number;
    expected_commission: number;
    status: 'active';
    notes: string | null;
    reference_number: string | null;
    created_at: string;
    updated_at: string;
  };
}

export function useCreatePaymentPlan() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: PaymentPlanFormData) => {
      const response = await fetch('/api/payment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create payment plan');
      }

      return response.json() as Promise<CreatePaymentPlanResponse>;
    },

    onSuccess: (response) => {
      // Invalidate payment plans cache
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });

      // Show success toast
      toast({
        title: 'Payment plan created',
        description: 'The payment plan has been created successfully.',
        variant: 'success',
      });

      // Navigate to detail page
      router.push(`/payments/plans/${response.data.id}`);
    },

    onError: (error: Error) => {
      // Show error toast
      toast({
        title: 'Failed to create payment plan',
        description: error.message,
        variant: 'destructive',
      });
    },

    // Optimistic update
    onMutate: async (newPaymentPlan) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['payment-plans'] });

      // Snapshot the previous value
      const previousPaymentPlans = queryClient.getQueryData(['payment-plans']);

      // Optimistically update to the new value
      queryClient.setQueryData(['payment-plans'], (old: any) => {
        return {
          ...old,
          data: [
            ...(old?.data || []),
            {
              ...newPaymentPlan,
              id: 'temp-id',
              status: 'active',
              created_at: new Date().toISOString(),
            },
          ],
        };
      });

      // Return context with snapshot
      return { previousPaymentPlans };
    },

    // Rollback on error
    onError: (err, newPaymentPlan, context) => {
      if (context?.previousPaymentPlans) {
        queryClient.setQueryData(['payment-plans'], context.previousPaymentPlans);
      }
    },
  });
}
```

**Integration in Form Component**:
```tsx
// apps/payments/app/plans/new/components/PaymentPlanForm.tsx
import { useCreatePaymentPlan } from '@/apps/payments/hooks/useCreatePaymentPlan';

export function PaymentPlanForm() {
  const form = useForm({
    resolver: zodResolver(paymentPlanSchema),
  });

  const createPaymentPlan = useCreatePaymentPlan();

  const onSubmit = (data: PaymentPlanFormData) => {
    createPaymentPlan.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}

        <Button
          type="submit"
          disabled={createPaymentPlan.isPending}
        >
          {createPaymentPlan.isPending ? 'Creating...' : 'Create Payment Plan'}
        </Button>
      </form>
    </Form>
  );
}
```

**Error Handling with Validation Errors**:
```typescript
// Handle validation errors from API
onError: (error: any) => {
  if (error.response?.data?.error?.fields) {
    // Set form field errors
    const fields = error.response.data.error.fields;
    Object.entries(fields).forEach(([field, errors]) => {
      form.setError(field as any, {
        type: 'server',
        message: (errors as string[])[0],
      });
    });
  }

  toast({
    title: 'Failed to create payment plan',
    description: error.message,
    variant: 'destructive',
  });
},
```

## Related Tasks

- **Depends on**: Task 3 (API routes), Task 4 (form component)
- **Blocks**: None (completes creation flow)

## Testing Checklist

- [ ] Mutation triggers POST /api/payment-plans
- [ ] Success shows toast notification
- [ ] Success navigates to detail page
- [ ] Success invalidates payment-plans cache
- [ ] Error shows toast notification
- [ ] Validation errors display inline in form
- [ ] Loading state shows during submission
- [ ] Optimistic update adds plan to cache immediately
- [ ] Rollback removes optimistic update on error
- [ ] Button disabled during submission

## References

- [docs/architecture.md](../../../docs/architecture.md) - State Management (lines 229-399)
- TanStack Query docs: https://tanstack.com/query/latest/docs/react/guides/mutations
