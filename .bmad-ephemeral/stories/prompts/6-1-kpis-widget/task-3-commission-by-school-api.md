# Task 3: Create Commission by School API Route

## Context
You are implementing Story 6.1, Task 3 of the Pleeno payment tracking system.

**Story:** As an Agency Admin, I want to see high-level KPIs with seasonal trends and market breakdown on my dashboard, so that I can quickly assess business health, identify peak months, and understand which schools and markets drive the most commission.

**This Task:** Create API route: `GET /api/dashboard/commission-by-school` that returns top 5 schools by commission with percentage share and trends.

## Acceptance Criteria
- AC #11-13: Commission breakdown by school with percentage share and trends

## Requirements

Create API route at `apps/dashboard/app/api/commission-by-school/route.ts` that:

1. **Queries payment_plans** joined with enrollments, branches, and colleges

2. **Calculates for current month:** SUM(earned_commission) GROUP BY college_id

3. **Calculates for previous month** for trend comparison

4. **Sorts by earned_commission DESC,** limit to top 5 schools

5. **Calculates percentage share:** (school_commission / total_commission) * 100

6. **Returns:**
```typescript
{
  success: true,
  data: Array<{
    college_id: string,
    college_name: string,
    commission: number,
    percentage_share: number,    // 0-100
    trend: 'up' | 'down' | 'neutral'
  }>
}
```

7. **Applies RLS** for agency_id filtering

## Technical Constraints

- **Architecture:** Dashboard zone at `apps/dashboard/`
- **Security:** Use server-side Supabase client, RLS enforces agency_id filtering
- **Performance:** 5-minute cache, database aggregation, limit to top 5
- **Database joins:**
  - payment_plans → enrollments (via enrollment_id)
  - enrollments → branches (via branch_id)
  - branches → colleges (via college_id)
- **Date handling:** Use agency timezone for current/previous month boundaries

## Implementation Notes

- Filter installments by `status = 'paid'` and `paid_date` in current month
- Calculate total_commission across all colleges for percentage calculation
- Trend logic:
  - 'up' if current month commission > previous month commission
  - 'down' if current month commission < previous month commission
  - 'neutral' if equal or school didn't exist in previous month
- Handle edge cases: new schools (no previous data), schools with zero commission
- Sort by commission descending, limit 5

## Testing Requirements

- Unit test API route with mock data for multiple schools
- Verify percentage share calculation (should sum to ~100% for all schools)
- Test trend calculation comparing current vs previous month
- Test edge case: <5 schools total
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
