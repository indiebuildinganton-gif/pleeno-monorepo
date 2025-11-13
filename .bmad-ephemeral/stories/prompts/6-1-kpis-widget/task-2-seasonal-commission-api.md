# Task 2: Create Seasonal Commission API Route

## Context
You are implementing Story 6.1, Task 2 of the Pleeno payment tracking system.

**Story:** As an Agency Admin, I want to see high-level KPIs with seasonal trends and market breakdown on my dashboard, so that I can quickly assess business health, identify peak months, and understand which schools and markets drive the most commission.

**This Task:** Create API route: `GET /api/dashboard/seasonal-commission` that returns 12-month commission data with peak/quiet month indicators.

## Acceptance Criteria
- AC #8-10: Seasonal commission chart with peak/quiet months and year-over-year comparison

## Requirements

Create API route at `apps/dashboard/app/api/seasonal-commission/route.ts` that:

1. **Queries installments** with paid status grouped by month for last 12 months

2. **Calculates commission per month:** SUM(earned_commission) GROUP BY month

3. **Includes year-over-year comparison** if data available (same month, previous year)

4. **Identifies peak months** (highest commission) and quiet months (lowest commission)

5. **Returns time series data:**
```typescript
{
  success: true,
  data: Array<{
    month: string,           // "2025-01", "2025-02", etc.
    commission: number,
    year_over_year_change?: number,  // percentage change vs same month last year
    is_peak?: boolean,       // true if in top 3 months
    is_quiet?: boolean       // true if in bottom 3 months
  }>
}
```

6. **Applies RLS** for agency_id filtering

## Technical Constraints

- **Architecture:** Dashboard zone at `apps/dashboard/`
- **Security:** Use server-side Supabase client, RLS enforces agency_id filtering
- **Performance:** 5-minute cache, use database aggregation
- **Date handling:** Use agency timezone, rolling 12-month window from today
- **Commission calculation:** Use calculate_earned_commission() PostgreSQL function

## Implementation Notes

- Query installments where `status = 'paid'` and `paid_date` within last 12 months
- Group by month using date_trunc('month', paid_date AT TIME ZONE agency.timezone)
- Calculate year-over-year only if data exists for same month in previous year
- Peak months: Top 3 months by commission
- Quiet months: Bottom 3 months by commission
- Sort results chronologically (oldest to newest)
- Handle months with zero commission (include in results with 0 value)

## Testing Requirements

- Unit test API route with mock 12-month data
- Verify peak/quiet month detection logic
- Test year-over-year calculation with and without historical data
- Test edge case: agency with <12 months of data
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
- [Architecture: Date Handling Pattern](docs/architecture.md#Date-Handling-Pattern)
