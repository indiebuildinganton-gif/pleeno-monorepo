# Task 1: Create KPI Metrics API Route

## Context
You are implementing Story 6.1, Task 1 of the Pleeno payment tracking system.

**Story:** As an Agency Admin, I want to see high-level KPIs with seasonal trends and market breakdown on my dashboard, so that I can quickly assess business health, identify peak months, and understand which schools and markets drive the most commission.

**This Task:** Create API route: `GET /api/dashboard/kpis` that returns core business metrics with trend indicators.

## Acceptance Criteria
- AC #1-7: KPI cards displaying metrics with trend indicators

## Requirements

Create API route at `apps/dashboard/app/api/kpis/route.ts` that:

1. **Queries database** to calculate:
   - `active_students`: COUNT(students WHERE enrollments.status = 'active')
   - `active_payment_plans`: COUNT(payment_plans WHERE status = 'active')
   - `outstanding_amount`: SUM(installments.amount WHERE status IN ('pending', 'overdue'))
   - `earned_commission`: SUM across all payment_plans.earned_commission using calculate_earned_commission() function
   - `collection_rate`: (payments received this month / expected this month) * 100

2. **Queries previous month's values** for trend comparison

3. **Returns JSON** with structure:
```typescript
{
  success: true,
  data: {
    active_students: number,
    active_payment_plans: number,
    outstanding_amount: number,
    earned_commission: number,
    collection_rate: number,
    trends: {
      active_students: 'up' | 'down' | 'neutral',
      active_payment_plans: 'up' | 'down' | 'neutral',
      outstanding_amount: 'up' | 'down' | 'neutral',
      earned_commission: 'up' | 'down' | 'neutral',
      collection_rate: 'up' | 'down' | 'neutral'
    }
  }
}
```

4. **Applies RLS** for agency_id filtering (automatic via Supabase)

5. **Adds 5-minute cache** for performance using Next.js revalidate

## Technical Constraints

- **Architecture:** Dashboard zone at `apps/dashboard/` with basePath `/dashboard`
- **Security:** Use server-side Supabase client (not anon key), RLS enforces agency_id filtering
- **Performance:** API responses cached for 5 minutes, use database aggregation (SUM, COUNT, GROUP BY)
- **Database schema:**
  - agencies (currency, timezone)
  - students (nationality)
  - payment_plans (earned_commission)
  - installments (status, amount, paid_date)
  - enrollments (links)
  - colleges (name, id)
  - branches (college_id)
- **Date handling:** Use agency timezone for all date calculations with date-fns and date-fns-tz
- **Commission calculation:** Use calculate_earned_commission() PostgreSQL function, filter by generates_commission = true

## Database Indexes Required
```sql
CREATE INDEX idx_students_agency_status ON students(agency_id, status);
CREATE INDEX idx_payment_plans_agency_status ON payment_plans(agency_id, status);
CREATE INDEX idx_installments_agency_status ON installments(agency_id, status);
CREATE INDEX idx_installments_paid_date ON installments(agency_id, paid_date);
```

## Implementation Notes

- Use server-side Supabase client (not anon key)
- Calculate "current month" as first day to last day in agency timezone
- Calculate "previous month" as one month back from current month
- Trend logic:
  - 'up' if current > previous
  - 'down' if current < previous
  - 'neutral' if current === previous
- Handle edge cases: no data, first month (no previous data)
- Add error handling with proper HTTP status codes

## Testing Requirements

- Unit test API route with mock Supabase client
- Verify aggregation logic with sample data
- Test edge cases: no data, single record
- Test trend calculation: positive, negative, zero change
- Test RLS enforcement (cannot access other agencies' data)

## Dependencies

- @supabase/supabase-js
- @supabase/ssr
- date-fns
- date-fns-tz
- next (for API route)

## References

- [PRD: Product Performance Metrics](docs/PRD.md)
- [Architecture: Dashboard Endpoints API](docs/architecture.md#Dashboard-Endpoints-API)
- [Architecture: Commission Calculation Engine](docs/architecture.md#Pattern-2-Commission-Calculation-Engine)
- [Architecture: Date Handling Pattern](docs/architecture.md#Date-Handling-Pattern)
- [Architecture: Multi-Tenant Isolation](docs/architecture.md#Multi-Tenant-Isolation-RLS)
