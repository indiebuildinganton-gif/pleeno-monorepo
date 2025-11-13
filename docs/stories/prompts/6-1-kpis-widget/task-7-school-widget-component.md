# Task 7: Create CommissionBySchoolWidget Component

## Context
You are implementing Story 6.1, Task 7 of the Pleeno payment tracking system.

**Story:** As an Agency Admin, I want to see high-level KPIs with seasonal trends and market breakdown on my dashboard, so that I can quickly assess business health, identify peak months, and understand which schools and markets drive the most commission.

**This Task:** Create React component that displays top 5 schools by commission with percentage share and trends.

## Acceptance Criteria
- AC #11-13: Commission breakdown by school with percentage share and trends

## Requirements

Create React component at `apps/dashboard/app/components/CommissionBySchoolWidget.tsx` that:

1. **Uses TanStack Query** to fetch school breakdown from `/api/dashboard/commission-by-school`

2. **Displays as horizontal bar chart or table** with columns:
   - School Name (clickable link to college detail page)
   - Commission Amount (currency formatted)
   - Percentage Share (visual progress bar + text percentage)
   - Trend (arrow icon: ↑/↓/→)

3. **Limits to top 5 schools**

4. **Adds "View All Colleges" link** to full report page

5. **Color codes progress bars** (gradient from low to high)

## Component Structure

```typescript
export function CommissionBySchoolWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'commission-by-school'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/commission-by-school');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <WidgetSkeleton />;
  if (isError) return <ErrorState />;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Top Schools</h3>
      <div className="space-y-3">
        {data.data.map((school) => (
          <SchoolRow
            key={school.college_id}
            name={school.college_name}
            commission={school.commission}
            percentageShare={school.percentage_share}
            trend={school.trend}
          />
        ))}
      </div>
      <Link href="/colleges" className="text-sm text-blue-600 hover:underline">
        View All Colleges →
      </Link>
    </div>
  );
}
```

## Styling Requirements

- Use Tailwind CSS for styling
- Use Shadcn UI Progress component for percentage bars
- Color coding:
  - Progress bars: Gradient from yellow (low) to green (high)
  - Trend arrows: Green (up), Red (down), Gray (neutral)
- School name should be clickable link with hover effect
- Responsive: Stack columns on mobile

## Technical Constraints

- **State management:** TanStack Query with 5-minute stale time
- **Styling:** Tailwind CSS + Shadcn UI
- **Currency formatting:** Use agency.currency setting
- **Navigation:** Link to `/colleges/{college_id}` (or `/colleges` for "View All")

## Implementation Notes

- SchoolRow component shows:
  - School name (clickable)
  - Commission (currency formatted)
  - Progress bar (width = percentage_share)
  - Trend arrow icon
- Progress bar width should be proportional to percentage_share (0-100%)
- Use lucide-react icons: ArrowUp, ArrowDown, ArrowRight
- Handle edge case: <5 schools (show all available)

## Testing Requirements

- Component test: renders top 5 schools
- Test: displays commission amounts with correct currency formatting
- Test: progress bar width matches percentage_share
- Test: trend arrows have correct colors
- Test: school name is clickable link
- Test: "View All Colleges" link present

## Dependencies

- @tanstack/react-query
- react
- next/link
- tailwindcss
- shadcn/ui
- lucide-react

## References

- [Architecture: TanStack Query Caching](docs/architecture.md#Caching-Strategy-TanStack-Query)
- [Architecture: Styling](docs/architecture.md#Styling)
