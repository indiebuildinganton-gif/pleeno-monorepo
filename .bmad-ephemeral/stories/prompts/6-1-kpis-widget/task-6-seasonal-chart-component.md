# Task 6: Create SeasonalCommissionChart Component

## Context
You are implementing Story 6.1, Task 6 of the Pleeno payment tracking system.

**Story:** As an Agency Admin, I want to see high-level KPIs with seasonal trends and market breakdown on my dashboard, so that I can quickly assess business health, identify peak months, and understand which schools and markets drive the most commission.

**This Task:** Create React component that displays a line chart showing monthly commission for the last 12 months with peak/quiet indicators.

## Acceptance Criteria
- AC #8-10: Seasonal commission chart with peak/quiet month indicators and year-over-year comparison

## Requirements

Create React component at `apps/dashboard/app/components/SeasonalCommissionChart.tsx` that:

1. **Uses TanStack Query** to fetch seasonal data from `/api/dashboard/seasonal-commission`

2. **Renders line chart** using Recharts library

3. **X-axis:** Month labels (Jan, Feb, Mar...)

4. **Y-axis:** Commission amount (formatted as currency)

5. **Visual indicators:**
   - Peak months: Highlight with green background or marker
   - Quiet months: Highlight with orange/yellow background or marker

6. **Year-over-year comparison:** Show comparison line in different color (if data available)

7. **Tooltip** showing exact values on hover

8. **Responsive design** (adjusts to container width)

## Component Structure

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

export function SeasonalCommissionChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'seasonal-commission'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/seasonal-commission');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <ChartSkeleton />;
  if (isError) return <ErrorState />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data.data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tickFormatter={formatMonth} />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="commission"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981' }}
        />
        {/* Render peak/quiet indicators */}
        {data.data.map((item, idx) => (
          item.is_peak && <ReferenceDot key={idx} x={item.month} y={item.commission} fill="green" />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## Styling Requirements

- Use Recharts for chart rendering
- Green line for current year commission
- Blue/gray line for year-over-year comparison (if available)
- Peak months: Green dot/marker
- Quiet months: Orange/yellow dot/marker
- Tooltip shows exact commission value and YoY change
- Responsive: Full width, height 300px

## Technical Constraints

- **Charts library:** Recharts 3.3.0
- **State management:** TanStack Query with 5-minute stale time
- **Currency formatting:** Use agency.currency setting
- **Date formatting:** Format "2025-01" as "Jan", "2025-02" as "Feb"

## Implementation Notes

- Use `date-fns` format function to convert "2025-01" to "Jan"
- Custom tooltip should show:
  - Month name
  - Commission amount (currency formatted)
  - YoY change (if available): "+15%" or "-10%"
- Peak/quiet indicators can be ReferenceDot or custom markers
- Handle edge case: <12 months of data (show available months only)

## Testing Requirements

- Component test: renders Recharts LineChart
- Test: highlights peak months with green marker
- Test: highlights quiet months with orange marker
- Test: displays year-over-year line if data available
- Test: tooltip shows exact values on hover (using React Testing Library + mock data)
- Test: responsive design adjusts to container width

## Dependencies

- recharts (3.3.0)
- @tanstack/react-query
- react
- date-fns

## References

- [Architecture: Charts - Recharts](docs/architecture.md#Charts)
- [Architecture: TanStack Query Caching](docs/architecture.md#Caching-Strategy-TanStack-Query)
