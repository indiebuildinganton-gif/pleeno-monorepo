# Story 4.3: Payment Plan List and Detail Views - Task 5

## Story Context

**As an** Agency User
**I want** to view all payment plans and drill into individual plan details
**So that** I can quickly find plans and see their payment status

## Task 5: Search Bar Component

### Description
Create PaymentPlansSearchBar component with debounced search functionality.

### Acceptance Criteria
- AC 3: Search Functionality

### Subtasks
- [ ] Create PaymentPlansSearchBar component
- [ ] Text input with search icon
- [ ] Debounced search (300ms delay)
- [ ] Search placeholder: "Search by student name or reference number..."
- [ ] Clear button (X icon) to reset search
- [ ] Update URL query param: ?search=...

## Context

### Previous Task Completion
Tasks 1-4 should now be complete. You should have:
- GET /api/payment-plans endpoint with search param (Task 1)
- Payment Plans List page with filter panel (Tasks 3-4)
- URL state management established

### Key Constraints
- Client Components: Use 'use client' for search bar
- Debounced Search: Implement 300ms debounce to reduce API calls
- URL State: Persist search in URL query params
- TanStack Query: Search changes trigger query refetch

### Component to Create
**apps/payments/app/plans/components/PaymentPlansSearchBar.tsx**
- 'use client' directive
- Debounced input handling
- URL synchronization
- Clear search functionality

### Dependencies
- Shadcn UI components: Input, Button
- lodash.debounce or custom debounce hook
- Next.js useRouter, useSearchParams

### Relevant Documentation
- [docs/architecture.md - Performance Patterns](docs/architecture.md) - Debounced search with 300ms delay

## Manifest Update Instructions

1. Open `.bmad-ephemeral/stories/prompts/4-3/MANIFEST.md`
2. Update Task 4:
   - Status: Completed
   - Completed: [Current Date]
   - Notes: [Any relevant implementation notes]
3. Update Task 5:
   - Status: In Progress
   - Started: [Current Date]

## Implementation Approach

### Step 1: Create Search Bar Component
```typescript
// apps/payments/app/plans/components/PaymentPlansSearchBar.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue' // or lodash.debounce

export function PaymentPlansSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebouncedValue(search, 300)

  useEffect(() => {
    // Update URL when debounced search changes
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedSearch) {
      params.set('search', debouncedSearch)
    } else {
      params.delete('search')
    }
    router.push(`?${params.toString()}`)
  }, [debouncedSearch])

  const handleClear = () => {
    setSearch('')
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by student name or reference number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-10 pr-10"
      />
      {search && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-3"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
```

### Step 2: Implement Debouncing

Option 1: Custom hook
```typescript
// hooks/useDebouncedValue.ts
import { useState, useEffect } from 'react'

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

Option 2: Use lodash.debounce
```typescript
import debounce from 'lodash.debounce'

const debouncedUpdateSearch = debounce((value: string) => {
  // Update URL
}, 300)
```

### Step 3: URL Synchronization
- Read initial search value from URL query params
- Update URL when debounced search changes
- Preserve other query params (filters)
- Use Next.js useRouter for navigation

### Step 4: Clear Functionality
- Show X button only when search has value
- Clear button resets search input
- Clear search removes search param from URL
- Triggers refetch with empty search

## Building on Previous Work

- Integrate with PaymentPlansList component (Task 3)
- Work alongside filter panel (Task 4)
- Use API search param from Task 1
- Follow same URL state patterns as filters

## Integration with Task 3

PaymentPlansList should already be reading URL params. The search param will automatically trigger refetch:

```typescript
// In PaymentPlansList.tsx
const searchParams = useSearchParams()
const search = searchParams.get('search')

const { data } = useQuery({
  queryKey: ['payment-plans', { search, ...filters }],
  queryFn: () => fetchPaymentPlans({ search, ...filters }),
  staleTime: 5 * 60 * 1000,
})
```

## Page Layout Integration

Update page.tsx to include search bar:

```typescript
// apps/payments/app/plans/page.tsx
export default async function PaymentPlansPage() {
  return (
    <div className="container mx-auto py-8">
      <h1>Payment Plans</h1>
      <div className="flex gap-4 my-4">
        <PaymentPlansSearchBar />
        <PaymentPlansFilterPanel />
      </div>
      <PaymentPlansList />
    </div>
  )
}
```

## Next Steps

After completing this task:
1. Update the manifest (Task 5 → Completed)
2. Move to `task-6-prompt.md` (Payment Plan Detail Page)
3. Task 6 will create the detail view UI

## Testing Checklist

- [ ] Test search input displays with search icon
- [ ] Test typing triggers debounced search (300ms delay)
- [ ] Test search by student name (partial match)
- [ ] Test search by reference number
- [ ] Test URL updates with ?search= param
- [ ] Test clear button appears when search has value
- [ ] Test clear button removes search and resets results
- [ ] Test search works with filters simultaneously
- [ ] Test search state persists on page refresh
- [ ] Test multiple rapid keystrokes only trigger one API call (debouncing works)
