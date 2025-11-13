# Story 6.1: Key Performance Indicators (KPIs) Widget with Seasonal and Market Insights

Status: ready-for-dev

## Story

As an **Agency Admin**,
I want **to see high-level KPIs with seasonal trends and market breakdown on my dashboard**,
so that **I can quickly assess business health, identify peak months, and understand which schools and markets drive the most commission**.

## Acceptance Criteria

1. **Given** I am viewing the dashboard
   **When** the page loads
   **Then** I see KPI cards displaying core business metrics

2. **And** I see total active students (count)

3. **And** I see total active payment plans (count)

4. **And** I see total outstanding amount (sum of unpaid installments)

5. **And** I see total earned commission (sum of commission from paid installments)

6. **And** I see payment collection rate (% of expected payments received this month)

7. **And** each KPI shows trend indicator (up/down vs last month)

8. **And** I see a seasonal commission chart showing monthly commission totals for the last 12 months

9. **And** the seasonal chart displays visual indicators of peak and quiet months

10. **And** the seasonal chart shows year-over-year comparison (if historical data available)

11. **And** I see commission breakdown by school displaying top 5 schools by commission earned (current month)

12. **And** the school breakdown shows percentage share of total commission per school

13. **And** the school breakdown displays trend indicator for each school (vs previous month)

14. **And** I see commission breakdown by country of origin displaying top 5 countries by commission earned (current month)

15. **And** the country breakdown shows percentage share of total commission per country

16. **And** the country breakdown displays trend indicator for each country (vs previous month)

## Tasks / Subtasks

- [ ] **Task 1: Create KPI Metrics API Route** (AC: #1-7)
  - [ ] Create API route: `GET /api/dashboard/kpis`
  - [ ] Query database to calculate:
    - `active_students`: COUNT(students WHERE enrollments.status = 'active')
    - `active_payment_plans`: COUNT(payment_plans WHERE status = 'active')
    - `outstanding_amount`: SUM(installments.amount WHERE status IN ('pending', 'overdue'))
    - `earned_commission`: SUM across all payment_plans.earned_commission using calculate_earned_commission() function
    - `collection_rate`: (payments received this month / expected this month) * 100
  - [ ] Query previous month's values for trend comparison
  - [ ] Return JSON with current values, previous values, and trend directions
  - [ ] Apply RLS for agency_id filtering
  - [ ] Add 5-minute cache for performance

- [ ] **Task 2: Create Seasonal Commission API Route** (AC: #8-10)
  - [ ] Create API route: `GET /api/dashboard/seasonal-commission`
  - [ ] Query installments with paid status grouped by month for last 12 months
  - [ ] Calculate commission per month: SUM(earned_commission) GROUP BY month
  - [ ] If data available, include year-over-year comparison (same month, previous year)
  - [ ] Identify peak months (highest commission) and quiet months (lowest commission)
  - [ ] Return time series data: [{ month: string, commission: number, year_over_year_change?: number }]
  - [ ] Apply RLS for agency_id filtering

- [ ] **Task 3: Create Commission by School API Route** (AC: #11-13)
  - [ ] Create API route: `GET /api/dashboard/commission-by-school`
  - [ ] Query payment_plans joined with enrollments, branches, and colleges
  - [ ] Calculate for current month: SUM(earned_commission) GROUP BY college_id
  - [ ] Calculate for previous month for trend comparison
  - [ ] Sort by earned_commission DESC, limit to top 5 schools
  - [ ] Calculate percentage share: (school_commission / total_commission) * 100
  - [ ] Return: [{ college_id, college_name, commission, percentage_share, trend }]
  - [ ] Apply RLS for agency_id filtering

- [ ] **Task 4: Create Commission by Country API Route** (AC: #14-16)
  - [ ] Create API route: `GET /api/dashboard/commission-by-country`
  - [ ] Query payment_plans joined with enrollments and students (students.nationality)
  - [ ] Calculate for current month: SUM(earned_commission) GROUP BY students.nationality
  - [ ] Calculate for previous month for trend comparison
  - [ ] Sort by earned_commission DESC, limit to top 5 countries
  - [ ] Calculate percentage share: (country_commission / total_commission) * 100
  - [ ] Return: [{ country, commission, percentage_share, trend }]
  - [ ] Apply RLS for agency_id filtering
  - [ ] Handle NULL nationality gracefully (display as "Unknown")

- [ ] **Task 5: Create KPIWidget Component** (AC: #1-7)
  - [ ] Create React component: `apps/dashboard/app/components/KPIWidget.tsx`
  - [ ] Use TanStack Query to fetch KPI data from `/api/dashboard/kpis`
  - [ ] Display 5 metric cards:
    - Active Students (count with person icon)
    - Active Payment Plans (count with document icon)
    - Outstanding Amount (currency formatted with warning icon)
    - Earned Commission (currency formatted with money icon, green styling)
    - Collection Rate (percentage with progress indicator)
  - [ ] Display trend arrows (↑ green for positive, ↓ red for negative, → gray for no change)
  - [ ] Format currency using agency.currency from config
  - [ ] Add loading skeleton while fetching
  - [ ] Add error state with retry button

- [ ] **Task 6: Create SeasonalCommissionChart Component** (AC: #8-10)
  - [ ] Create React component: `apps/dashboard/app/components/SeasonalCommissionChart.tsx`
  - [ ] Use TanStack Query to fetch seasonal data from `/api/dashboard/seasonal-commission`
  - [ ] Render line chart using Recharts library
  - [ ] X-axis: Month labels (Jan, Feb, Mar...)
  - [ ] Y-axis: Commission amount (formatted as currency)
  - [ ] Visual indicators:
    - Peak months: Highlight with green background or marker
    - Quiet months: Highlight with orange/yellow background or marker
  - [ ] If year-over-year data available: Show comparison line in different color
  - [ ] Add tooltip showing exact values on hover
  - [ ] Responsive design (adjusts to container width)

- [ ] **Task 7: Create CommissionBySchoolWidget Component** (AC: #11-13)
  - [ ] Create React component: `apps/dashboard/app/components/CommissionBySchoolWidget.tsx`
  - [ ] Use TanStack Query to fetch school breakdown from `/api/dashboard/commission-by-school`
  - [ ] Display as horizontal bar chart or table with columns:
    - School Name (clickable link to college detail page)
    - Commission Amount (currency formatted)
    - Percentage Share (visual progress bar + text percentage)
    - Trend (arrow icon: ↑/↓/→)
  - [ ] Limit to top 5 schools
  - [ ] Add "View All Colleges" link to full report page
  - [ ] Color code progress bars (gradient from low to high)

- [ ] **Task 8: Create CommissionByCountryWidget Component** (AC: #14-16)
  - [ ] Create React component: `apps/dashboard/app/components/CommissionByCountryWidget.tsx`
  - [ ] Use TanStack Query to fetch country breakdown from `/api/dashboard/commission-by-country`
  - [ ] Display as horizontal bar chart or table with columns:
    - Country Name (with flag emoji if possible)
    - Commission Amount (currency formatted)
    - Percentage Share (visual progress bar + text percentage)
    - Trend (arrow icon: ↑/↓/→)
  - [ ] Limit to top 5 countries
  - [ ] Handle "Unknown" nationality gracefully
  - [ ] Color code progress bars (gradient from low to high)

- [ ] **Task 9: Integrate Widgets into Dashboard Page** (AC: All)
  - [ ] Update `apps/dashboard/app/page.tsx` to include all four new widgets
  - [ ] Arrange in responsive grid layout:
    - Row 1: KPI cards (5 columns on desktop, stacked on mobile)
    - Row 2: Seasonal chart (full width)
    - Row 3: School breakdown (left half) + Country breakdown (right half)
  - [ ] Ensure consistent spacing and styling with existing dashboard widgets
  - [ ] Add section headings: "Key Metrics", "Seasonal Trends", "Commission Breakdown"

- [ ] **Task 10: Testing** (AC: All)
  - [ ] Write unit tests for all API routes
  - [ ] Mock database queries and verify aggregation logic
  - [ ] Test trend calculation (positive, negative, no change)
  - [ ] Test percentage share calculations
  - [ ] Write component tests for all widgets using React Testing Library
  - [ ] Test loading states, error states, and data display
  - [ ] Test chart rendering with mock data (Recharts)
  - [ ] Verify currency formatting respects agency settings
  - [ ] Write integration test verifying dashboard loads with all widgets

## Dev Notes

### Architecture Context

**Dashboard Zone:**
- All components live in `apps/dashboard/` zone
- API routes can be in `apps/dashboard/app/api/` or `apps/shell/app/api/`
- Shell app proxies `/dashboard` requests via next.config.js rewrites

**Database Schema Dependencies:**
- `agencies` table: currency, timezone
- `students` table: nationality field (for country breakdown)
- `payment_plans` table: earned_commission (calculated field)
- `installments` table: status, amount, paid_date, student_due_date
- `enrollments` table: links students to colleges via branches
- `colleges` table: name, id
- `branches` table: college_id

**Commission Calculation:**
- Use existing `calculate_earned_commission()` PostgreSQL function
- Earned commission is proportional to paid installments: `(paid_amount / total_amount) * expected_commission`
- Filter by `generates_commission = true` to exclude non-commissionable fees
- See [Source: docs/architecture.md#Pattern 2: Commission Calculation Engine]

**Date Handling:**
- Use agency timezone for all date calculations
- Current month: First day of month to last day of month in agency timezone
- Previous month: One month back from current month
- Last 12 months: Rolling 12-month window from today
- Use `date-fns` and `date-fns-tz` libraries for timezone-aware calculations

### Project Structure Notes

**Component Organization:**
```
apps/dashboard/
├── app/
│   ├── page.tsx                           # Main dashboard (import all widgets)
│   ├── api/
│   │   ├── kpis/
│   │   │   └── route.ts                   # KPI metrics API
│   │   ├── seasonal-commission/
│   │   │   └── route.ts                   # Seasonal data API
│   │   ├── commission-by-school/
│   │   │   └── route.ts                   # School breakdown API
│   │   └── commission-by-country/
│   │       └── route.ts                   # Country breakdown API
│   └── components/
│       ├── KPIWidget.tsx
│       ├── SeasonalCommissionChart.tsx
│       ├── CommissionBySchoolWidget.tsx
│       └── CommissionByCountryWidget.tsx
```

**Shared Utilities:**
- Commission calculation: `packages/utils/src/commission-calculator.ts`
- Date helpers: `packages/utils/src/date-helpers.ts`
- Currency formatting: `packages/utils/src/formatters.ts`

### Learnings from Previous Story

**From Story 5.4 (Status: ready-for-dev)**

This is the first story in Epic 6, so the dashboard zone may not yet exist. Story 5.4 planned the dashboard infrastructure but may not have been implemented yet.

**Key Points for Implementation:**
- Dashboard zone setup: Ensure `apps/dashboard/` exists with proper routing configuration
- Multi-zone navigation: Shell app must proxy `/dashboard` to dashboard zone
- RLS policies: All database queries automatically filtered by agency_id via auth.uid()
- TanStack Query caching: Use 5-minute stale time for dashboard metrics to reduce load
- Performance: Add database indexes on frequently queried columns (status, due_date, paid_at, agency_id)

**If Story 5.4 was implemented:**
- Reuse existing dashboard page structure at `apps/dashboard/app/page.tsx`
- Follow established patterns for API routes and component organization
- Use consistent styling with PaymentStatusWidget component

**If Story 5.4 was not yet implemented:**
- This story will need to create the dashboard zone infrastructure from scratch
- Initialize dashboard zone with proper Turborepo and Next.js configuration
- Set up shell routing to proxy `/dashboard` requests
- Create layout and navigation components

### Security Considerations

**Row-Level Security:**
- All queries MUST respect RLS policies (agency_id filtering automatic)
- Use server-side Supabase client (not anon key) in API routes
- JWT auth middleware protects dashboard routes

**Data Privacy:**
- KPIs only show current user's agency data
- Trend comparisons only within same agency
- No cross-agency data leakage possible (enforced by RLS)

### Performance Optimization

**Database Indexes:**
```sql
-- Add indexes for KPI queries
CREATE INDEX idx_students_agency_status ON students(agency_id, status);
CREATE INDEX idx_payment_plans_agency_status ON payment_plans(agency_id, status);
CREATE INDEX idx_installments_agency_status ON installments(agency_id, status);
CREATE INDEX idx_installments_paid_date ON installments(agency_id, paid_date);
```

**Caching Strategy:**
- API route caching: 5-minute stale time (use Next.js `revalidate` or Vercel Edge caching)
- TanStack Query: 5-minute stale time, background refetch on window focus
- Consider pre-computing KPIs in materialized view for large datasets (future optimization)

**Query Optimization:**
- Use database functions for complex calculations (avoid fetching all rows to application)
- Aggregate at database level (SUM, COUNT, GROUP BY)
- Limit result sets (top 5 schools, top 5 countries)

### Testing Standards

**API Route Tests (Vitest):**
- Mock Supabase client queries
- Verify aggregation logic with sample data
- Test edge cases: no data, single record, multiple agencies
- Test trend calculation: positive, negative, zero change

**Component Tests (React Testing Library):**
- Test rendering with mock data
- Test loading states (skeleton UI)
- Test error states with retry button
- Test trend indicators (up/down arrows)
- Test currency formatting
- Test chart rendering (Recharts with mock data)

**Integration Tests (Playwright - optional):**
- E2E: login → dashboard → verify all widgets display
- Test data refresh after user action (e.g., record payment → KPIs update)

### References

- [Source: docs/epics.md#Story 6.1] - Acceptance criteria and technical notes
- [Source: docs/architecture.md#Dashboard Endpoints] - API structure for KPI, seasonal, and breakdown queries
- [Source: docs/architecture.md#Pattern 2: Commission Calculation Engine] - Commission calculation logic
- [Source: docs/architecture.md#Date Handling Pattern] - Timezone-aware date helpers
- [Source: docs/architecture.md#Multi-Tenant Isolation] - RLS policy patterns
- [Source: docs/architecture.md#Performance Considerations] - Caching and query optimization strategies

## Dev Agent Record

### Context Reference

- [6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.context.xml](.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
