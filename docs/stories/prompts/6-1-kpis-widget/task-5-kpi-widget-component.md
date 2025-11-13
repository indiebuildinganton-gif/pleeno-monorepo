# Task 5: Create KPIWidget Component

## Context
You are implementing Story 6.1, Task 5 of the Pleeno payment tracking system.

**Story:** As an Agency Admin, I want to see high-level KPIs with seasonal trends and market breakdown on my dashboard, so that I can quickly assess business health, identify peak months, and understand which schools and markets drive the most commission.

**This Task:** Create React component that displays 5 KPI metric cards with trend indicators.

## Acceptance Criteria
- AC #1-7: KPI cards displaying core business metrics with trend indicators

## Requirements

Create React component at `apps/dashboard/app/components/KPIWidget.tsx` that:

1. **Uses TanStack Query** to fetch KPI data from `/api/dashboard/kpis`

2. **Displays 5 metric cards:**
   - Active Students (count with person icon)
   - Active Payment Plans (count with document icon)
   - Outstanding Amount (currency formatted with warning icon)
   - Earned Commission (currency formatted with money icon, green styling)
   - Collection Rate (percentage with progress indicator)

3. **Displays trend arrows:**
   - ↑ green for positive (up)
   - ↓ red for negative (down)
   - → gray for no change (neutral)

4. **Formats currency** using agency.currency from config

5. **Adds loading skeleton** while fetching

6. **Adds error state** with retry button

## Component Structure

```typescript
export function KPIWidget() {
  // TanStack Query hook
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/kpis');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <KPISkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <MetricCard
        label="Active Students"
        value={data.active_students}
        icon={<PersonIcon />}
        trend={data.trends.active_students}
      />
      {/* ... other cards ... */}
    </div>
  );
}
```

## Styling Requirements

- Use Tailwind CSS for styling
- Use Shadcn UI components (Card, Badge, etc.)
- Color coding:
  - Green for positive trends / earned commission
  - Yellow/amber for outstanding amount
  - Red for negative trends
  - Gray for neutral trends
- Responsive: 1 column on mobile, 5 columns on desktop

## Technical Constraints

- **State management:** TanStack Query for server state, 5-minute stale time
- **Styling:** Tailwind CSS + Shadcn UI
- **Icons:** Use lucide-react or heroicons
- **Currency formatting:** Use agency.currency setting (e.g., "AUD", "NZD")

## Implementation Notes

- Use `Intl.NumberFormat` for currency formatting
- Use `Intl.NumberFormat` for percentage formatting (collection_rate)
- Loading skeleton should match card layout for smooth transition
- Error state should show friendly message and "Retry" button
- Trend arrows should have aria-labels for accessibility

## Testing Requirements

- Component test: renders 5 cards correctly
- Test: displays trend arrows with correct colors
- Test: formats currency according to agency settings
- Test: shows loading skeleton while fetching
- Test: shows error state with retry button
- Test: clicking retry button refetches data

## Dependencies

- @tanstack/react-query
- react
- tailwindcss
- shadcn/ui
- lucide-react (for icons)

## References

- [Architecture: TanStack Query Caching Strategy](docs/architecture.md#Caching-Strategy-TanStack-Query)
- [Architecture: Styling Constraints](docs/architecture.md#Styling)
