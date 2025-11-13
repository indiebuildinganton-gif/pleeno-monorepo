# Story 5.2: Due Soon Notification Flags - Task 2

## Story Context

**As an** Agency User
**I want** to see visual indicators for payments due within the next 4 days
**So that** I can proactively follow up before payments become overdue, including weekend and early-week payments

## Task 2: Update UI to display "due soon" badges

### Previous Task Completion

✅ Task 1 implemented the backend foundation:
- Database schema with `agencies.due_soon_threshold_days` field
- Query logic for calculating "due soon" status
- Agency settings API for threshold configuration
- RLS policies updated

### Task Description

Implement the user interface components to visually display "due soon" status across the application. This includes creating reusable badge components, updating existing views, and adding dashboard widgets.

### Subtasks Checklist

- [ ] Add "due soon" badge component with yellow/amber color coding
- [ ] Update payment plan list UI to show "due soon" status
- [ ] Update payment plan detail UI to show "due soon" for individual installments
- [ ] Add dashboard widget showing count of "due soon" installments
- [ ] Implement filter for payment plans list to show only "due soon" plans
- [ ] Ensure consistent color coding: yellow/amber for "due soon", red for "overdue"

### Acceptance Criteria

This task supports:
- **AC2**: And "due soon" installments display with a warning badge/color
- **AC3**: And the dashboard shows a count of "due soon" installments
- **AC4**: And I can filter the payment plans list to show only plans with "due soon" installments

### Context & Constraints

**Key Constraints:**
- Color coding consistency: yellow/amber for "due soon", red for "overdue", green for "paid"
- All UI components must respect agency-scoped data (RLS enforced on backend)
- Dashboard widgets should use React Query for data fetching with proper caching
- Badge components should be reusable across different views

**Interfaces to Implement:**

1. **GET /api/dashboard/due-soon-count** (apps/dashboard/app/api/dashboard/due-soon-count/route.ts):
```typescript
GET /api/dashboard/due-soon-count
Query: { agency_id: string }
Auth: Required
Returns: { success: boolean, data: { count: number, total_amount: number } }
```

**Components to Create:**

1. **DueSoonBadge.tsx** (apps/dashboard/app/components/DueSoonBadge.tsx):
   - Reusable badge component
   - Yellow/amber background with appropriate text color
   - Shows "Due Soon" label
   - Optional: show days until due

2. **DueSoonWidget.tsx** (apps/dashboard/app/components/DueSoonWidget.tsx):
   - Dashboard widget showing count of due soon installments
   - Displays total amount due soon
   - Links to filtered payment plans view
   - Uses React Query for data fetching

3. **InstallmentStatusBadge.tsx** (apps/payments/app/plans/components/InstallmentStatusBadge.tsx):
   - Update existing component to handle "due soon" status
   - Add yellow/amber styling for due soon state
   - Maintain red for overdue, green for paid

### Dependencies

**From Task 1:**
- isDueSoon() utility function (packages/utils/src/date-helpers.ts)
- Agency settings with due_soon_threshold_days configured
- Database query logic for "due soon" calculation

**External Dependencies:**
- @tanstack/react-query (5.90.7)
- React components from your UI library
- Tailwind CSS for styling (yellow-500, amber-500 colors)

### Architecture Reference

From [docs/architecture.md](docs/architecture.md):
- **Pattern 3: Automated Status State Machine** - Query-time status calculation displayed in UI
- UI components fetch computed "due soon" flags from backend queries

### File Structure

```
apps/dashboard/app/components/
├── DueSoonWidget.tsx      # Dashboard widget showing count
└── DueSoonBadge.tsx       # Reusable badge component

apps/payments/app/plans/components/
└── InstallmentStatusBadge.tsx  # Updated to show "due soon"

apps/dashboard/app/api/dashboard/due-soon-count/
└── route.ts               # API endpoint for dashboard count
```

### Testing Requirements

**Component Tests** (apps/dashboard/app/components/*.test.tsx):
- Test DueSoonBadge component renders with yellow/amber background color
- Test DueSoonWidget displays correct count and amount
- Test InstallmentStatusBadge shows correct color for each status

**Integration Tests:**
- Test dashboard API returns correct count of due soon installments for agency
- Test payment plans list filters correctly when "due soon" filter applied
- Test clicking widget navigates to filtered payment plans view

---

## Update Manifest

Before starting implementation, update the manifest file:

`.bmad-ephemeral/stories/prompts/5-2-due-soon-notification-flags/MANIFEST.md`

Update:
1. Mark Task 1 status as "Completed" with completion date
2. Add notes about Task 1 implementation (files created, database changes)
3. Mark Task 2 status as "In Progress" with start date

---

## Implementation Steps

1. **Update manifest** to mark Task 2 as in progress
2. **Create DueSoonBadge component** with yellow/amber styling
3. **Create dashboard API endpoint** for due soon count
4. **Create DueSoonWidget component** using the API endpoint
5. **Update InstallmentStatusBadge** to handle "due soon" status
6. **Add filter functionality** to payment plans list
7. **Update payment plan views** to show due soon badges
8. **Write component tests** for new/updated components
9. **Test color coding** across all views for consistency
10. **Update manifest** when task complete

## Example Component Structure

### DueSoonBadge.tsx
```typescript
interface DueSoonBadgeProps {
  daysUntilDue?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function DueSoonBadge({ daysUntilDue, size = 'md' }: DueSoonBadgeProps) {
  return (
    <span className="bg-amber-100 text-amber-800 border border-amber-300 ...">
      Due Soon {daysUntilDue && `(${daysUntilDue}d)`}
    </span>
  );
}
```

### DueSoonWidget.tsx
```typescript
export function DueSoonWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['due-soon-count'],
    queryFn: () => fetch('/api/dashboard/due-soon-count').then(r => r.json())
  });

  return (
    <div className="widget-card">
      <h3>Due Soon</h3>
      <div className="metric">{data?.count || 0}</div>
      <div className="amount">${data?.total_amount || 0}</div>
      <Link href="/plans?filter=due-soon">View All</Link>
    </div>
  );
}
```

## Next Steps

After completing Task 2:
1. Update the manifest file - mark Task 2 as "Completed" with today's date
2. Add implementation notes about UI components created
3. Move to [task-3-prompt.md](task-3-prompt.md) for student notification system

---

**Source Story**: [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.md](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.md)
**Story Context**: [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml)
