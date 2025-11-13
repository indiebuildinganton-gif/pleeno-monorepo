# Task 4: Create Commission by Country API Route

## Context
You are implementing Story 6.1, Task 4 of the Pleeno payment tracking system.

**Story:** As an Agency Admin, I want to see high-level KPIs with seasonal trends and market breakdown on my dashboard, so that I can quickly assess business health, identify peak months, and understand which schools and markets drive the most commission.

**This Task:** Create API route: `GET /api/dashboard/commission-by-country` that returns top 5 countries by commission with percentage share and trends.

## Acceptance Criteria
- AC #14-16: Commission breakdown by country of origin with percentage share and trends

## Requirements

Create API route at `apps/dashboard/app/api/commission-by-country/route.ts` that:

1. **Queries payment_plans** joined with enrollments and students (students.nationality)

2. **Calculates for current month:** SUM(earned_commission) GROUP BY students.nationality

3. **Calculates for previous month** for trend comparison

4. **Sorts by earned_commission DESC,** limit to top 5 countries

5. **Calculates percentage share:** (country_commission / total_commission) * 100

6. **Returns:**
```typescript
{
  success: true,
  data: Array<{
    country: string,              // nationality value or "Unknown"
    commission: number,
    percentage_share: number,     // 0-100
    trend: 'up' | 'down' | 'neutral'
  }>
}
```

7. **Applies RLS** for agency_id filtering

8. **Handles NULL nationality gracefully** (display as "Unknown")

## Technical Constraints

- **Architecture:** Dashboard zone at `apps/dashboard/`
- **Security:** Use server-side Supabase client, RLS enforces agency_id filtering
- **Performance:** 5-minute cache, database aggregation, limit to top 5
- **Database joins:**
  - payment_plans → enrollments (via enrollment_id)
  - enrollments → students (via student_id)
- **Date handling:** Use agency timezone for current/previous month boundaries

## Implementation Notes

- Filter installments by `status = 'paid'` and `paid_date` in current month
- Use COALESCE(students.nationality, 'Unknown') for NULL handling
- Calculate total_commission across all countries for percentage calculation
- Trend logic:
  - 'up' if current month commission > previous month commission
  - 'down' if current month commission < previous month commission
  - 'neutral' if equal or country didn't exist in previous month
- Handle edge cases: all students from same country, all NULL nationalities
- Sort by commission descending, limit 5

## Testing Requirements

- Unit test API route with mock data for multiple countries
- Verify NULL nationality displays as "Unknown"
- Verify percentage share calculation
- Test trend calculation comparing current vs previous month
- Test edge case: <5 countries total
- Test RLS enforcement

## Dependencies

- @supabase/supabase-js
- @supabase/ssr
- date-fns
- date-fns-tz
- next (for API route)

## References

- [Architecture: Dashboard Endpoints API](docs/architecture.md#Dashboard-Endpoints-API)
- [Architecture: Commission Calculation Engine](docs/architecture.md#Pattern-2-Commission-Calculation-Engine)
