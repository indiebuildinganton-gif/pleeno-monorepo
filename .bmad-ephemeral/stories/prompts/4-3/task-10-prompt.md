# Story 4.3: Payment Plan List and Detail Views - Task 10

## Story Context

**As an** Agency User
**I want** to view all payment plans and drill into individual plan details
**So that** I can quickly find plans and see their payment status

## Task 10: TanStack Query Integration

### Description
Create and finalize TanStack Query hooks with proper patterns, caching, and error handling.

### Acceptance Criteria
- AC: All (proper data fetching and caching throughout)

### Subtasks
- [ ] Create usePaymentPlans query hook with filters/pagination
- [ ] Create usePaymentPlanDetail query hook with plan ID
- [ ] Implement query key structure: ['payment-plans', { filters }]
- [ ] Configure stale time: 5 minutes for list, 2 minutes for detail
- [ ] Implement optimistic updates for future mutations (Story 4.4)
- [ ] Add error boundary for failed queries

## Context

### Previous Task Completion
Tasks 1-9 should now be complete. You should have:
- All API endpoints working (Tasks 1-2)
- All UI components rendering (Tasks 3-7)
- Status calculation (Task 8)
- Pagination (Task 9)
- TanStack Query already in use throughout components

### Current State
TanStack Query is already being used inline in components. This task extracts query logic into reusable hooks with best practices.

### Key Constraints
- TanStack Query: Use query keys ['payment-plans', { filters }] with 5-minute stale time for list, 2-minute for detail
- Error Handling: Graceful error states throughout
- Type Safety: Full TypeScript types for query results

### Hooks to Create
1. **usePaymentPlans** - List query with filters and pagination
2. **usePaymentPlanDetail** - Single plan detail query
3. **usePrefetchPaymentPlan** - Prefetch on hover (performance optimization)

### Dependencies
- @tanstack/react-query (5.90.7) - Already installed
- TypeScript types from packages/database

### Relevant Documentation
- [docs/architecture.md - State Management](docs/architecture.md) - TanStack Query patterns

## Manifest Update Instructions

1. Open `.bmad-ephemeral/stories/prompts/4-3/MANIFEST.md`
2. Update Task 9:
   - Status: Completed
   - Completed: [Current Date]
   - Notes: [Any relevant implementation notes]
3. Update Task 10:
   - Status: In Progress
   - Started: [Current Date]

## Implementation Approach

### Step 1: Create Hooks Directory Structure
```
apps/payments/app/plans/
├── hooks/
│   ├── usePaymentPlans.ts
│   ├── usePaymentPlanDetail.ts
│   └── usePrefetchPaymentPlan.ts
```

### Step 2: Create usePaymentPlans Hook
```typescript
// apps/payments/app/plans/hooks/usePaymentPlans.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query'

export interface PaymentPlanFilters {
  status?: string[]
  student_id?: string
  college_id?: string
  branch_id?: string
  amount_min?: number
  amount_max?: number
  installments_min?: number
  installments_max?: number
  due_date_from?: string
  due_date_to?: string
  search?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaymentPlansResponse {
  success: boolean
  data: PaymentPlan[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

export function usePaymentPlans(
  filters: PaymentPlanFilters = {}
): UseQueryResult<PaymentPlansResponse, Error> {
  return useQuery({
    queryKey: ['payment-plans', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, String(value))
          }
        }
      })

      const response = await fetch(`/api/payment-plans?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch payment plans')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}
```

### Step 3: Create usePaymentPlanDetail Hook
```typescript
// apps/payments/app/plans/hooks/usePaymentPlanDetail.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query'

export interface PaymentPlanDetailResponse {
  success: boolean
  data: PaymentPlan & {
    enrollment: Enrollment & {
      student: Student
      branch: Branch & {
        college: College
      }
    }
    installments: Installment[]
    progress: {
      total_paid: number
      installments_paid_count: number
    }
  }
}

export function usePaymentPlanDetail(
  planId: string | undefined
): UseQueryResult<PaymentPlanDetailResponse, Error> {
  return useQuery({
    queryKey: ['payment-plan', planId],
    queryFn: async () => {
      if (!planId) throw new Error('Plan ID is required')

      const response = await fetch(`/api/payment-plans/${planId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Payment plan not found')
        }
        throw new Error('Failed to fetch payment plan')
      }

      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
    enabled: !!planId, // Only run if planId is provided
  })
}
```

### Step 4: Create Prefetch Hook (Performance Optimization)
```typescript
// apps/payments/app/plans/hooks/usePrefetchPaymentPlan.ts
import { useQueryClient } from '@tanstack/react-query'

export function usePrefetchPaymentPlan() {
  const queryClient = useQueryClient()

  const prefetch = (planId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['payment-plan', planId],
      queryFn: async () => {
        const response = await fetch(`/api/payment-plans/${planId}`)
        if (!response.ok) throw new Error('Failed to fetch')
        return response.json()
      },
      staleTime: 2 * 60 * 1000,
    })
  }

  return prefetch
}
```

### Step 5: Update PaymentPlansList to Use Hook
```typescript
// apps/payments/app/plans/components/PaymentPlansList.tsx
'use client'

import { usePaymentPlans } from '../hooks/usePaymentPlans'
import { usePrefetchPaymentPlan } from '../hooks/usePrefetchPaymentPlan'

export function PaymentPlansList() {
  const searchParams = useSearchParams()
  const filters = parseFiltersFromSearchParams(searchParams)

  const { data, isLoading, error } = usePaymentPlans(filters)
  const prefetchPlan = usePrefetchPaymentPlan()

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorDisplay error={error} />
  if (!data?.success) return <EmptyState />

  return (
    <div>
      {data.data.map(plan => (
        <div
          key={plan.id}
          onMouseEnter={() => prefetchPlan(plan.id)} // Prefetch on hover
        >
          <PaymentPlanRow plan={plan} />
        </div>
      ))}
    </div>
  )
}
```

### Step 6: Update PaymentPlanDetail to Use Hook
```typescript
// apps/payments/app/plans/components/PaymentPlanDetail.tsx
'use client'

import { usePaymentPlanDetail } from '../hooks/usePaymentPlanDetail'

interface Props {
  planId: string
}

export function PaymentPlanDetail({ planId }: Props) {
  const { data, isLoading, error } = usePaymentPlanDetail(planId)

  if (isLoading) return <DetailSkeleton />
  if (error) return <ErrorDisplay error={error} />
  if (!data?.success) return <NotFound />

  return <div>{/* Render plan details */}</div>
}
```

### Step 7: Setup Query Client with Error Boundaries

Create or update the root QueryClientProvider:

```typescript
// apps/payments/app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute default
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Step 8: Create Error Boundary Component
```typescript
// apps/payments/app/plans/components/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-8 text-center">
            <h2>Something went wrong</h2>
            <p className="text-muted-foreground">{this.state.error?.message}</p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
```

Wrap pages with ErrorBoundary:

```typescript
// apps/payments/app/plans/page.tsx
export default function PaymentPlansPage() {
  return (
    <ErrorBoundary>
      <PaymentPlansList />
    </ErrorBoundary>
  )
}
```

## Query Key Structure

Consistent query keys for proper cache management:

```typescript
// List queries
['payment-plans'] // All plans (no filters)
['payment-plans', { status: ['active'] }] // Filtered
['payment-plans', { search: 'john', page: 2 }] // Search + pagination

// Detail queries
['payment-plan', '123'] // Single plan by ID

// Invalidation examples
queryClient.invalidateQueries({ queryKey: ['payment-plans'] }) // All lists
queryClient.invalidateQueries({ queryKey: ['payment-plan', planId] }) // Single plan
```

## Optimistic Updates (Preparation for Story 4.4)

Add mutation helpers for future use:

```typescript
// apps/payments/app/plans/hooks/useUpdatePaymentPlan.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useUpdatePaymentPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (update: { planId: string; data: Partial<PaymentPlan> }) => {
      const response = await fetch(`/api/payment-plans/${update.planId}`, {
        method: 'PATCH',
        body: JSON.stringify(update.data),
      })
      if (!response.ok) throw new Error('Update failed')
      return response.json()
    },
    onMutate: async (update) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['payment-plan', update.planId] })

      // Snapshot previous value
      const previous = queryClient.getQueryData(['payment-plan', update.planId])

      // Optimistically update
      queryClient.setQueryData(['payment-plan', update.planId], (old: any) => ({
        ...old,
        data: { ...old.data, ...update.data },
      }))

      return { previous }
    },
    onError: (_err, update, context) => {
      // Rollback on error
      queryClient.setQueryData(['payment-plan', update.planId], context?.previous)
    },
    onSettled: (_data, _error, update) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['payment-plan', update.planId] })
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    },
  })
}
```

## Next Steps

After completing this task:
1. Update the manifest (Task 10 → Completed)
2. Move to `task-11-prompt.md` (Testing)
3. Task 11 will add comprehensive tests

## Testing Checklist

- [ ] Test usePaymentPlans hook returns data correctly
- [ ] Test usePaymentPlans with different filter combinations
- [ ] Test usePaymentPlanDetail hook returns plan data
- [ ] Test query keys are consistent across components
- [ ] Test stale time: data cached for 5 minutes (list) / 2 minutes (detail)
- [ ] Test prefetch on hover works (check network tab)
- [ ] Test error boundary catches and displays errors
- [ ] Test retry logic (queries retry on failure)
- [ ] Test enabled flag prevents query when planId is undefined
- [ ] Test query invalidation (manual invalidate refreshes data)
- [ ] Test React Query DevTools show queries correctly
