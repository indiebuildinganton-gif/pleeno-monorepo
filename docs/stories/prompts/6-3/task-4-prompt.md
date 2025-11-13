# Task 4: Implement Drill-Down to Payment Plans

## Context
You are implementing **Story 6.3: Commission Breakdown by College** for the Pleeno agency management platform. This task adds clickable navigation from the commission breakdown table to detailed views.

**Story Goal**: Enable Agency Admins to see commission breakdown by college/branch with tax details to identify valuable institutions and prioritize relationships.

**This Task**: Make college and branch names clickable, and add a "View Payment Plans" action that navigates to filtered payment plan views.

## Acceptance Criteria Coverage
This task addresses AC #5:
- AC #5: Clicking a college/branch drills down to see associated payment plans

## Task Requirements

### Drill-Down Interactions

#### 1. College Name Link
- **Make clickable**: College name in table row
- **Navigation target**: `/entities/colleges/[college_id]`
- **Purpose**: View college detail page
- **Visual**: Blue text with underline on hover
- **Tooltip**: Optional - "View college details"

#### 2. Branch Name Link
- **Make clickable**: Branch name in table row
- **Navigation target**: `/entities/colleges/[college_id]?branch=[branch_id]`
- **Purpose**: View college detail page with branch filter applied
- **Visual**: Blue text with underline on hover
- **Tooltip**: Optional - "View branch details"

#### 3. "View Payment Plans" Action
- **Location**: Icon/button in each table row (new column or action column)
- **Navigation target**: `/payments/plans?college=[college_id]&branch=[branch_id]`
- **Purpose**: View payment plans list pre-filtered by college and branch
- **Visual**: Icon button (e.g., eye icon, list icon, or "View Plans" text button)
- **Tooltip**: "Click to view [N] payment plans for [College - Branch]"

#### 4. Payment Plan Count Display
- **Location**: In row or tooltip
- **Content**: "12 plans" or "(12)" next to action button
- **Purpose**: Show user how many plans exist before clicking
- **Data source**: `payment_plan_count` from API response

## Implementation Details

### Updated Table Column: College
```typescript
{
  accessorKey: 'college_name',
  header: 'College',
  cell: ({ row }) => (
    <Link
      href={`/entities/colleges/${row.original.college_id}`}
      className="text-blue-600 hover:underline font-medium"
    >
      {row.original.college_name}
    </Link>
  ),
}
```

### Updated Table Column: Branch
```typescript
{
  accessorKey: 'branch_name',
  header: 'Branch',
  cell: ({ row }) => (
    <Link
      href={`/entities/colleges/${row.original.college_id}?branch=${row.original.branch_id}`}
      className="text-blue-600 hover:underline"
    >
      {row.original.branch_name} ({row.original.branch_city})
    </Link>
  ),
}
```

### New Table Column: Actions
Add a new column for actions at the end of the table:

```typescript
{
  id: 'actions',
  header: 'Actions',
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <Link
        href={`/payments/plans?college=${row.original.college_id}&branch=${row.original.branch_id}`}
        className="..."
      >
        <button
          type="button"
          className="..."
          title={`View ${row.original.payment_plan_count} payment plans for ${row.original.college_name} - ${row.original.branch_name}`}
        >
          <EyeIcon className="h-4 w-4" />
          <span className="ml-1 text-sm">
            View Plans ({row.original.payment_plan_count})
          </span>
        </button>
      </Link>
    </div>
  ),
}
```

Alternative: Icon-only button if space is limited:
```typescript
<Link
  href={`/payments/plans?college=${row.original.college_id}&branch=${row.original.branch_id}`}
  title={`View ${row.original.payment_plan_count} payment plans`}
>
  <button className="...">
    <ListIcon className="h-5 w-5" />
  </button>
</Link>
```

## Navigation Patterns

### College Detail Page
- **URL**: `/entities/colleges/[college_id]`
- **Expected behavior**: Shows college overview with branch list
- **Assumption**: This page already exists or will be created in another story

### College Detail with Branch Filter
- **URL**: `/entities/colleges/[college_id]?branch=[branch_id]`
- **Expected behavior**: College page opens with specific branch selected/highlighted
- **Implementation**: College detail page reads `branch` query param and filters/scrolls to branch

### Payment Plans List with Filters
- **URL**: `/payments/plans?college=[college_id]&branch=[branch_id]`
- **Expected behavior**: Payment plans page opens with college and branch filters pre-applied
- **Implementation**: Payment plans page reads query params and applies filters on mount

Example payment plans page filter initialization:
```typescript
// In /payments/plans/page.tsx
import { useSearchParams } from 'next/navigation'

function PaymentPlansPage() {
  const searchParams = useSearchParams()
  const collegeId = searchParams.get('college')
  const branchId = searchParams.get('branch')

  useEffect(() => {
    if (collegeId || branchId) {
      setFilters({
        college_id: collegeId,
        branch_id: branchId,
      })
    }
  }, [collegeId, branchId])

  // ...
}
```

## User Experience Considerations

### Visual Feedback
- **Hover states**: Links should show underline on hover
- **Cursor**: Change to pointer cursor on clickable elements
- **Color consistency**: Use same blue color for all links (`text-blue-600`)
- **Active states**: Optional - show pressed state on buttons

### Accessibility
- **Semantic HTML**: Use `<a>` tags for navigation (Next.js `<Link>` renders `<a>`)
- **Keyboard navigation**: All links/buttons tabbable and activatable with Enter
- **Screen reader support**:
  - Link text should be descriptive
  - Tooltip text available via `title` attribute
  - Button has accessible name (text or aria-label)
- **Color contrast**: Ensure blue link text meets WCAG AA (4.5:1 minimum)

### Tooltip Content
Format: "Click to view [N] payment plans for [College - Branch]"
Example: "Click to view 12 payment plans for University of Sydney - Sydney Campus"

## Testing Requirements

### Component Tests Required
Add to: `apps/dashboard/__tests__/components/CommissionBreakdownTable.test.tsx`

**Test Cases**:
1. **Test college name link**
   - Mock Next.js router
   - Click college name
   - Verify navigation to `/entities/colleges/[college_id]`
   - Verify correct college_id in URL

2. **Test branch name link**
   - Mock Next.js router
   - Click branch name
   - Verify navigation to `/entities/colleges/[college_id]?branch=[branch_id]`
   - Verify correct college_id and branch_id in URL

3. **Test "View Payment Plans" action**
   - Mock Next.js router
   - Click "View Plans" button
   - Verify navigation to `/payments/plans?college=[college_id]&branch=[branch_id]`
   - Verify correct query parameters

4. **Test payment plan count display**
   - Render table with mock data including payment_plan_count
   - Verify count displays correctly (e.g., "(12)")
   - Verify count appears in tooltip

5. **Test hover states**
   - Hover over college name → verify underline appears
   - Hover over branch name → verify underline appears
   - Hover over action button → verify visual feedback

6. **Test keyboard navigation**
   - Tab through table rows
   - Verify links are focusable
   - Press Enter on focused link → verify navigation

7. **Test accessibility**
   - Verify links have meaningful text
   - Verify buttons have accessible names
   - Verify tooltips are present

### Test Pattern
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { describe, it, expect, vi } from 'vitest'
import CommissionBreakdownTable from './CommissionBreakdownTable'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

describe('CommissionBreakdownTable - Drill-Down', () => {
  it('navigates to college detail when college name clicked', () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)

    render(<CommissionBreakdownTable />)

    const collegeLink = screen.getByText('Mock College Name')
    fireEvent.click(collegeLink)

    expect(mockPush).toHaveBeenCalledWith('/entities/colleges/college-123')
  })

  it('navigates to payment plans with filters when View Plans clicked', () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)

    render(<CommissionBreakdownTable />)

    const viewPlansButton = screen.getByTitle(/View.*payment plans/)
    fireEvent.click(viewPlansButton)

    expect(mockPush).toHaveBeenCalledWith('/payments/plans?college=college-123&branch=branch-456')
  })

  // ... more tests
})
```

## Icon Suggestions
Use an icon library already in the project (e.g., Heroicons, Lucide, or similar):

- **Eye icon**: For "view" action
- **List icon**: For "payment plans" action
- **Arrow right icon**: For "go to" action

Example with Heroicons:
```typescript
import { EyeIcon, ListBulletIcon } from '@heroicons/react/24/outline'
```

Example with Lucide:
```typescript
import { Eye, List } from 'lucide-react'
```

## Dependencies
- `next/link` - Next.js Link component (already used)
- Icon library (Heroicons, Lucide, or similar) - check project for existing

## Assumptions
This task assumes:
1. College detail page exists at `/entities/colleges/[id]`
2. Payment plans page exists at `/payments/plans`
3. Payment plans page can read and apply `college` and `branch` query params
4. An icon library is available in the project

If these assumptions are incorrect, coordinate with team or adjust implementation.

## Success Criteria
- [ ] College name is a clickable link
- [ ] College link navigates to `/entities/colleges/[college_id]`
- [ ] Branch name is a clickable link
- [ ] Branch link navigates to `/entities/colleges/[college_id]?branch=[branch_id]`
- [ ] "View Payment Plans" action added (button or link)
- [ ] View Plans navigates to `/payments/plans?college=[college_id]&branch=[branch_id]`
- [ ] Payment plan count displayed in row or tooltip
- [ ] Hover states work for all links
- [ ] Keyboard navigation works
- [ ] Tooltips show descriptive text
- [ ] Links meet accessibility standards
- [ ] Component tests written and passing

## Related Files
- Component: `apps/dashboard/app/components/CommissionBreakdownTable.tsx` (Task 2)
- College detail page: `apps/entities/app/colleges/[id]/page.tsx` (assumed to exist)
- Payment plans page: `apps/payments/app/plans/page.tsx` (assumed to exist)
- Story file: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md`

## Next Steps
After completing this task, proceed to **Task 5: Add Summary Metrics** which will add aggregate summary cards above the table.
