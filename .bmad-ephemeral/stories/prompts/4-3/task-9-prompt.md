# Story 4.3: Payment Plan List and Detail Views - Task 9

## Story Context

**As an** Agency User
**I want** to view all payment plans and drill into individual plan details
**So that** I can quickly find plans and see their payment status

## Task 9: Pagination / Infinite Scroll

### Description
Implement pagination using TanStack Query for the payment plans list.

### Acceptance Criteria
- AC 1: Payment Plans List View (pagination support)

### Subtasks
- [ ] Implement pagination using TanStack Query
- [ ] Default page size: 20 plans per page
- [ ] Option 1: Classic pagination with page numbers
- [ ] Option 2: Infinite scroll with "Load More" button
- [ ] Show total count: "Showing X-Y of Z payment plans"
- [ ] Persist pagination state in URL query params

## Context

### Previous Task Completion
Tasks 1-8 should now be complete. You should have:
- GET /api/payment-plans endpoint returning paginated results (Task 1)
- PaymentPlansList component displaying plans (Task 3)
- Filter and search functionality (Tasks 4-5)
- All core functionality working without pagination UI

### Key Constraints
- Pagination: Default page size of 20 plans
- URL State: Persist page number in URL query params
- TanStack Query: Use standard query or infinite query based on approach

### Implementation Options

**Option 1: Classic Pagination (Recommended for most cases)**
- Page numbers (1, 2, 3, ...)
- Previous/Next buttons
- Simple URL structure: `?page=2`
- Better for SEO and bookmarking

**Option 2: Infinite Scroll**
- "Load More" button or automatic scroll detection
- Better for mobile experience
- More complex state management

Choose based on your UX preference. This guide covers both.

### Dependencies
- @tanstack/react-query (5.90.7) - Pagination queries
- Shadcn UI components: Button, Pagination (if using shadcn)
- Next.js useRouter, useSearchParams

### API Response Structure (from Task 1)
```typescript
{
  success: boolean
  data: PaymentPlan[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}
```

### Relevant Documentation
- [docs/architecture.md - Performance Patterns](docs/architecture.md) - Pagination patterns

## Manifest Update Instructions

1. Open `.bmad-ephemeral/stories/prompts/4-3/MANIFEST.md`
2. Update Task 8:
   - Status: Completed
   - Completed: [Current Date]
   - Notes: [Any relevant implementation notes]
3. Update Task 9:
   - Status: In Progress
   - Started: [Current Date]

## Implementation Approach

### Option 1: Classic Pagination

#### Step 1: Update PaymentPlansList Component
```typescript
// apps/payments/app/plans/components/PaymentPlansList.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { Pagination } from '@/components/ui/pagination'

export function PaymentPlansList() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = parseInt(searchParams.get('page') || '1', 10)
  const filters = parseFiltersFromSearchParams(searchParams)

  const { data, isLoading, error } = useQuery({
    queryKey: ['payment-plans', { ...filters, page }],
    queryFn: () => fetchPaymentPlans({ ...filters, page, limit: 20 }),
    staleTime: 5 * 60 * 1000,
  })

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorDisplay error={error} />
  if (!data?.success || data.data.length === 0) return <EmptyState />

  const { data: plans, meta } = data

  return (
    <div className="space-y-4">
      {/* Display total count */}
      <div className="text-sm text-muted-foreground">
        Showing {(meta.page - 1) * meta.per_page + 1}-
        {Math.min(meta.page * meta.per_page, meta.total)} of {meta.total} payment plans
      </div>

      {/* Plans table/cards */}
      <PaymentPlansTable plans={plans} />

      {/* Pagination controls */}
      <PaginationControls
        currentPage={meta.page}
        totalPages={meta.total_pages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
```

#### Step 2: Create Pagination Controls Component
```typescript
interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      <div className="flex gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            onClick={() => onPageChange(page)}
            size="sm"
          >
            {page}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  )
}
```

For large page counts, implement ellipsis pagination (show first, last, and nearby pages).

### Option 2: Infinite Scroll

#### Step 1: Update to Use Infinite Query
```typescript
// apps/payments/app/plans/components/PaymentPlansList.tsx
'use client'

import { useInfiniteQuery } from '@tanstack/react-query'

export function PaymentPlansList() {
  const searchParams = useSearchParams()
  const filters = parseFiltersFromSearchParams(searchParams)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['payment-plans', filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchPaymentPlans({ ...filters, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.meta
      return page < total_pages ? page + 1 : undefined
    },
    staleTime: 5 * 60 * 1000,
    initialPageParam: 1,
  })

  if (isLoading) return <LoadingSkeleton />

  const plans = data?.pages.flatMap(page => page.data) || []
  const totalCount = data?.pages[0]?.meta.total || 0

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Showing {plans.length} of {totalCount} payment plans
      </div>

      <PaymentPlansTable plans={plans} />

      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  )
}
```

#### Step 2: Automatic Scroll Detection (Optional)
```typescript
import { useEffect, useRef } from 'react'

function useInfiniteScroll(callback: () => void, hasMore: boolean) {
  const observerRef = useRef<IntersectionObserver>()

  useEffect(() => {
    if (!hasMore) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          callback()
        }
      },
      { threshold: 1.0 }
    )

    const sentinel = document.getElementById('scroll-sentinel')
    if (sentinel) observer.observe(sentinel)

    observerRef.current = observer

    return () => observer.disconnect()
  }, [callback, hasMore])
}

// Usage in component:
useInfiniteScroll(() => fetchNextPage(), hasNextPage)

// Add sentinel div at bottom:
<div id="scroll-sentinel" className="h-10" />
```

## Verify API Route Supports Pagination

Ensure GET /api/payment-plans (Task 1) returns pagination meta:

```typescript
// In route.ts
return NextResponse.json({
  success: true,
  data: plans,
  meta: {
    total: totalCount,
    page: currentPage,
    per_page: limit,
    total_pages: Math.ceil(totalCount / limit),
  },
})
```

## Update Filters/Search to Reset Pagination

When filters or search change, reset to page 1:

```typescript
// In PaymentPlansFilterPanel or SearchBar
const handleFilterChange = (newFilters) => {
  const params = new URLSearchParams()
  // Add filters to params
  params.set('page', '1') // Reset to page 1
  router.push(`?${params.toString()}`)
}
```

## Building on Previous Work

- Use existing API from Task 1 (already returns paginated results)
- Integrate with filter panel (Task 4) and search bar (Task 5)
- Works with existing PaymentPlansList structure (Task 3)

## Next Steps

After completing this task:
1. Update the manifest (Task 9 → Completed)
2. Move to `task-10-prompt.md` (TanStack Query Integration)
3. Task 10 will finalize query hooks and patterns

## Testing Checklist

- [ ] Test default shows page 1 with 20 results
- [ ] Test page navigation (Previous/Next buttons)
- [ ] Test page number buttons work correctly
- [ ] Test "Showing X-Y of Z" text is accurate
- [ ] Test pagination state persists in URL (?page=2)
- [ ] Test filters/search reset to page 1
- [ ] Test Last page disables "Next" button
- [ ] Test First page disables "Previous" button
- [ ] Test infinite scroll "Load More" button (if implemented)
- [ ] Test automatic scroll detection (if implemented)
- [ ] Test with < 20 results (no pagination shown)
- [ ] Test with exactly 20 results (no pagination or disabled Next)
- [ ] Test with > 20 results (pagination appears)

### If Using Infinite Scroll:
- [ ] Test "Load More" fetches next page
- [ ] Test "Load More" button disappears on last page
- [ ] Test automatic scroll triggers fetch (if implemented)
- [ ] Test total count displays correctly
- [ ] Test plans append to existing list (no duplicates)
