# Task 8: Create CommissionByCountryWidget Component

## Context
You are implementing Story 6.1, Task 8 of the Pleeno payment tracking system.

**Story:** As an Agency Admin, I want to see high-level KPIs with seasonal trends and market breakdown on my dashboard, so that I can quickly assess business health, identify peak months, and understand which schools and markets drive the most commission.

**This Task:** Create React component that displays top 5 countries by commission with percentage share and trends.

## Acceptance Criteria
- AC #14-16: Commission breakdown by country of origin with percentage share and trends

## Requirements

Create React component at `apps/dashboard/app/components/CommissionByCountryWidget.tsx` that:

1. **Uses TanStack Query** to fetch country breakdown from `/api/dashboard/commission-by-country`

2. **Displays as horizontal bar chart or table** with columns:
   - Country Name (with flag emoji if possible)
   - Commission Amount (currency formatted)
   - Percentage Share (visual progress bar + text percentage)
   - Trend (arrow icon: ↑/↓/→)

3. **Limits to top 5 countries**

4. **Handles "Unknown" nationality gracefully**

5. **Color codes progress bars** (gradient from low to high)

## Component Structure

```typescript
export function CommissionByCountryWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'commission-by-country'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/commission-by-country');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <WidgetSkeleton />;
  if (isError) return <ErrorState />;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Top Countries</h3>
      <div className="space-y-3">
        {data.data.map((country, idx) => (
          <CountryRow
            key={idx}
            name={country.country}
            commission={country.commission}
            percentageShare={country.percentage_share}
            trend={country.trend}
          />
        ))}
      </div>
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
- Display country with flag emoji if possible (optional enhancement)
- Handle "Unknown" with special icon or styling (e.g., globe icon)
- Responsive: Stack columns on mobile

## Technical Constraints

- **State management:** TanStack Query with 5-minute stale time
- **Styling:** Tailwind CSS + Shadcn UI
- **Currency formatting:** Use agency.currency setting
- **Flag emojis (optional):** Use country-flag-emoji library or manual mapping

## Implementation Notes

- CountryRow component shows:
  - Country name (with flag emoji if available)
  - Commission (currency formatted)
  - Progress bar (width = percentage_share)
  - Trend arrow icon
- Progress bar width should be proportional to percentage_share (0-100%)
- Use lucide-react icons: ArrowUp, ArrowDown, ArrowRight
- Handle "Unknown" gracefully: Show globe icon instead of flag
- Handle edge case: <5 countries (show all available)

## Optional Enhancement: Flag Emojis

Map country names to flag emojis:
```typescript
const countryFlags: Record<string, string> = {
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',
  'India': '🇮🇳',
  'Unknown': '🌍',
  // ... add more as needed
};
```

## Testing Requirements

- Component test: renders top 5 countries
- Test: displays commission amounts with correct currency formatting
- Test: progress bar width matches percentage_share
- Test: trend arrows have correct colors
- Test: handles "Unknown" nationality gracefully
- Test: flag emojis display if implemented

## Dependencies

- @tanstack/react-query
- react
- tailwindcss
- shadcn/ui
- lucide-react
- country-flag-emoji (optional)

## References

- [Architecture: TanStack Query Caching](docs/architecture.md#Caching-Strategy-TanStack-Query)
- [Architecture: Styling](docs/architecture.md#Styling)
