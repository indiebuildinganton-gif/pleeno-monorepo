# Story 4.3: Payment Plan List and Detail Views - Task 4

## Story Context

**As an** Agency User
**I want** to view all payment plans and drill into individual plan details
**So that** I can quickly find plans and see their payment status

## Task 4: Filter Panel Component

### Description
Create PaymentPlansFilterPanel component with multi-select filters for comprehensive plan filtering.

### Acceptance Criteria
- AC 2: Comprehensive Filtering

### Subtasks
- [ ] Create PaymentPlansFilterPanel component
- [ ] Status filter: Multi-select checkboxes (active, completed, cancelled)
- [ ] Student filter: Autocomplete dropdown (fetch students from API)
- [ ] College/Branch filter: Nested dropdown (college → branches)
- [ ] Amount filter: Min/Max number inputs with currency formatting
- [ ] Installments filter: Min/Max number inputs or dropdown (1-5, 6-10, 11-20, 20+)
- [ ] Due date filter: Date range picker (from/to)
- [ ] Display active filters as removable chips
- [ ] "Clear all filters" button resets all filter state
- [ ] Update URL query params when filters change (shareable URLs)

## Context

### Previous Task Completion
Tasks 1-3 should now be complete. You should have:
- GET /api/payment-plans endpoint with filter params (Task 1)
- Payment Plans List page displaying plans (Task 3)
- Basic table/card layout working

### Key Constraints
- Client Components: Use 'use client' for filter panel
- URL State: Persist filter state in URL query params for shareable URLs
- TanStack Query: Filter changes should trigger query refetch
- Form Management: Use React Hook Form or Zustand for filter state

### Component to Create
**apps/payments/app/plans/components/PaymentPlansFilterPanel.tsx**
- 'use client' directive
- Form state management
- URL synchronization
- Filter UI with Shadcn components

### Dependencies
- react-hook-form (7.66.0) - Form state management
- @hookform/resolvers (latest) - Zod resolver
- zod (4.x) - Schema validation
- Shadcn UI components: Select, Input, Checkbox, Button, Popover, Calendar
- date-fns (latest) - Date handling

### Filter Structure
```typescript
interface PaymentPlanFilters {
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
}
```

### Relevant Documentation
- [docs/architecture.md - Performance Patterns](docs/architecture.md) - URL state management

## Manifest Update Instructions

1. Open `.bmad-ephemeral/stories/prompts/4-3/MANIFEST.md`
2. Update Task 3:
   - Status: Completed
   - Completed: [Current Date]
   - Notes: [Any relevant implementation notes]
3. Update Task 4:
   - Status: In Progress
   - Started: [Current Date]

## Implementation Approach

### Step 1: Create Filter Panel Component
```typescript
// apps/payments/app/plans/components/PaymentPlansFilterPanel.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'

const filterSchema = z.object({
  status: z.array(z.string()).optional(),
  student_id: z.string().optional(),
  // ... other filters
})

export function PaymentPlansFilterPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const form = useForm({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      // Parse from URL query params
    }
  })

  const onSubmit = (values) => {
    // Update URL query params
    // This triggers TanStack Query refetch in PaymentPlansList
  }

  // Render filter UI
}
```

### Step 2: Implement Each Filter Type

1. **Status Filter**: Multi-select checkboxes
   - Checkbox group for active, completed, cancelled
   - Store as array in form state

2. **Student Filter**: Autocomplete dropdown
   - Fetch students from API (may need new endpoint)
   - Combobox with search/filter
   - Use Shadcn Combobox or Command component

3. **College/Branch Filter**: Nested dropdown
   - First dropdown: Select college
   - Second dropdown: Select branch (filtered by college)
   - Cascade selection

4. **Amount Filter**: Min/Max inputs
   - Two number inputs (min, max)
   - Currency formatting on display
   - Validation: min <= max

5. **Installments Filter**: Range or dropdown
   - Option 1: Min/Max inputs
   - Option 2: Dropdown with ranges (1-5, 6-10, etc.)

6. **Due Date Filter**: Date range picker
   - Shadcn Calendar component in Popover
   - From date, To date
   - Validation: from <= to

### Step 3: Active Filters Display
- Parse current filters from URL or form state
- Display as chips/badges
- Each chip has X button to remove that filter
- Use Shadcn Badge component

### Step 4: Clear All Filters Button
- Reset form to default values
- Clear all URL query params
- Trigger refetch with empty filters

### Step 5: URL Synchronization
- When filters change, update URL query params
- Format: `/payments/plans?status=active,completed&student_id=123`
- Use Next.js useRouter and useSearchParams
- Shareable URLs for filtered views

## Building on Previous Work

- Integrate with PaymentPlansList component (Task 3)
- Use API filter params from Task 1
- Filter changes trigger TanStack Query refetch

## Integration with Task 3

Update PaymentPlansList to:
1. Read filters from URL query params
2. Pass filters to TanStack Query queryKey
3. Refetch when filters change

```typescript
// In PaymentPlansList.tsx
const searchParams = useSearchParams()
const filters = parseFiltersFromSearchParams(searchParams)

const { data } = useQuery({
  queryKey: ['payment-plans', filters],
  queryFn: () => fetchPaymentPlans(filters),
  staleTime: 5 * 60 * 1000,
})
```

## Next Steps

After completing this task:
1. Update the manifest (Task 4 → Completed)
2. Move to `task-5-prompt.md` (Search Bar Component)
3. Task 5 will add search functionality

## Testing Checklist

- [ ] Test each filter type works independently
- [ ] Test multi-select status filter
- [ ] Test amount range validation (min <= max)
- [ ] Test date range validation (from <= to)
- [ ] Test multiple filters applied simultaneously
- [ ] Test active filters display as chips
- [ ] Test removing individual filter chips
- [ ] Test "Clear all filters" resets all
- [ ] Test URL query params update on filter change
- [ ] Test shareable URLs (copy URL, paste in new tab)
- [ ] Test filter state persists on page refresh
