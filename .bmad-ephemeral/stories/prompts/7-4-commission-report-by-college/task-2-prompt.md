# Story 7-4: Commission Report by College - Task 2

## Story Context

**As an** Agency Admin
**I want** to generate commission reports grouped by college/branch with location details
**So that** I can track what commissions are owed to me, distinguish between multiple branches, and use for claim submissions

## Task 2: Implement Commission Report API Route

**Acceptance Criteria**: #1-4, #7

**Previous Task**: Task 1 - Created the commissions report page with UI filters

### Task Description

Create the API route that queries and aggregates commission data by college, branch, and city with support for date range and city filtering.

### Subtasks Checklist

- [ ] Create API route: `POST /api/reports/commissions`
- [ ] Accept filter params:
  - `date_from`, `date_to` (required date range)
  - `city` (optional city filter)
- [ ] Query payment_plans with joins:
  ```typescript
  SELECT
    c.id AS college_id,
    c.name AS college_name,
    b.id AS branch_id,
    b.name AS branch_name,
    b.city,
    b.commission_rate_percent,
    COUNT(DISTINCT pp.id) AS total_payment_plans,
    COUNT(DISTINCT e.student_id) AS total_students,
    SUM(i.amount) FILTER (WHERE i.paid_at IS NOT NULL) AS total_paid,
    SUM(i.amount * (b.commission_rate_percent / 100)) FILTER (WHERE i.paid_at IS NOT NULL) AS earned_commission,
    SUM(i.amount * (b.commission_rate_percent / 100)) FILTER (WHERE i.paid_at IS NULL AND i.due_date < NOW()) AS outstanding_commission
  FROM colleges c
  INNER JOIN branches b ON c.id = b.college_id
  INNER JOIN enrollments e ON b.id = e.branch_id
  INNER JOIN payment_plans pp ON e.id = pp.enrollment_id
  INNER JOIN installments i ON pp.id = i.payment_plan_id
  WHERE pp.agency_id = ?
    AND i.due_date >= ?  -- date_from
    AND i.due_date <= ?  -- date_to
    AND (? IS NULL OR b.city = ?)  -- city filter (optional)
  GROUP BY c.id, c.name, b.id, b.name, b.city, b.commission_rate_percent
  ORDER BY c.name, b.name
  ```
- [ ] Include drill-down data: student payment plans for each branch
- [ ] Apply RLS filtering by agency_id
- [ ] Return JSON with grouped commission data
- [ ] Test: POST with date range → Returns commission breakdown by college/branch

## Context

### Relevant Acceptance Criteria

1. **Given** I am viewing the reports page
   **When** I generate a commission report
   **Then** I see commission breakdown by college and branch for a selected time period

2. **And** each row shows: college, branch, city, total paid by students, commission rate, earned commission, outstanding commission

3. **And** the city field helps distinguish between multiple branches of the same school

4. **And** the report includes date range filter

7. **And** the report shows supporting details: list of students and payment plans contributing to commission

### Key Constraints

- **Multi-Tenant Security**: All queries MUST filter by agency_id. RLS enforced on colleges, branches, enrollments, payment_plans, installments tables.
- **Commission Calculation Formula**:
  - `earned_commission = SUM(amount * (rate / 100)) WHERE paid_at IS NOT NULL`
  - `outstanding_commission = SUM(amount * (rate / 100)) WHERE paid_at IS NULL AND due_date < NOW()`
- **Database Functions**: Use PostgreSQL stored function (`get_commission_report`) to reduce round trips and centralize aggregation logic
- **Performance**: Use database indexes on installments.due_date and branches.city. Consider materialized view for frequently run reports. Limit to 1000 colleges/branches per export.

### Interface to Implement

**Commission Report API**:
- Kind: REST endpoint
- Signature: `POST /api/reports/commissions` - Body: `{ date_from, date_to, city? }` - Returns: `{ data: CommissionRow[], summary: { total_paid, total_earned, total_outstanding } }`
- Path: `apps/reports/app/api/reports/commissions/route.ts`

**Database Function** (create if needed):
- Name: `get_commission_report`
- Signature: `get_commission_report(p_agency_id UUID, p_date_from DATE, p_date_to DATE, p_city TEXT) RETURNS TABLE (...)`
- Path: `supabase/migrations/XXX_create_commission_report_function.sql`

### Database Schema Reference

- `colleges` table: id, name, agency_id
- `branches` table: id, college_id, name, city, commission_rate_percent, contract_expiration_date
- `enrollments` table: id, student_id, branch_id, agency_id
- `payment_plans` table: id, enrollment_id, agency_id, status
- `installments` table: id, payment_plan_id, amount, due_date, paid_at

### Reference Documentation

- Context File: `.bmad-ephemeral/stories/7-4-commission-report-by-college.context.xml`
- Architecture: `docs/architecture.md` (Reporting Zone, Database Schema sections)
- Story Dev Notes: See the "Commission Report API Implementation" section in the story markdown

## Manifest Update Instructions

Before starting implementation:

1. **Read the manifest**: `.bmad-ephemeral/stories/prompts/7-4-commission-report-by-college/manifest.md`
2. **Update Task 1**:
   - Status: Completed
   - Completed: [Today's Date]
   - Notes: [Add any notes from Task 1, e.g., "Created report page with date range and city filters"]
3. **Update Task 2**:
   - Status: In Progress
   - Started: [Today's Date]

## Implementation Notes

**Building on Task 1**: Task 1 created the UI that will call this API. This task creates the backend logic that processes commission data.

**Key Implementation Points**:

1. **API Route Structure** (`apps/reports/app/api/reports/commissions/route.ts`):
   - Create a POST handler
   - Use Supabase server client with user authentication
   - Extract agency_id from user metadata
   - Validate date range parameters
   - Call database function or execute query
   - Calculate summary totals
   - Return JSON response

2. **Database Function Approach** (Recommended):
   - Create a PostgreSQL function `get_commission_report` in a migration file
   - Function handles all joins and aggregations
   - Returns structured data including drill-down details (payment_plans as JSONB)
   - Use `SECURITY DEFINER` but ensure agency_id filtering inside function
   - See the story markdown Dev Notes section for complete SQL example

3. **Commission Calculation**:
   - Use `FILTER` clauses with aggregate functions (PostgreSQL feature)
   - Earned: `SUM(amount * rate/100) FILTER (WHERE paid_at IS NOT NULL)`
   - Outstanding: `SUM(amount * rate/100) FILTER (WHERE paid_at IS NULL AND due_date < NOW())`
   - Use `COALESCE(..., 0)` to handle NULL cases

4. **Drill-Down Data**:
   - Include student payment plans for each branch
   - Use `jsonb_agg` to aggregate payment plan details
   - Include: student_id, student_name, payment_plan_id, total_amount, paid_amount, commission_earned

5. **Security**:
   - Always filter by user's agency_id
   - Validate input parameters (date format, SQL injection prevention)
   - Use parameterized queries
   - Return 401 if not authenticated, 400 for bad input

6. **Error Handling**:
   - Handle database errors gracefully
   - Return meaningful error messages
   - Log errors for debugging

**Pattern to Follow**:
Reference `apps/reports/app/api/reports/payment-plans/route.ts` if it exists for similar API route patterns.

## Next Steps

After completing this task:

1. **Test the API**:
   - Use curl or Postman to POST to `/api/reports/commissions`
   - Verify commission calculations are accurate
   - Test with different date ranges and city filters
   - Verify RLS is working (only see your agency's data)

2. **Update the manifest**:
   - Set Task 2 status to "Completed" with today's date
   - Add implementation notes (e.g., "Created database function for commission aggregation")

3. **Verify Integration**:
   - Go back to the commissions report page from Task 1
   - Click "Generate Report" with filters
   - Verify API is called and returns data (check browser network tab)

4. **Move to Task 3**:
   - Open file: `task-3-prompt.md`
   - Task 3 will create the table component to display the API results
   - Copy and paste the contents into Claude Code Web

## Tips

- Use the database function approach to keep API route simple and testable
- Test SQL queries directly in Supabase SQL editor before putting in function
- Verify FILTER clause syntax (PostgreSQL 9.4+)
- Use TypeScript interfaces for request/response types
- Consider creating a separate file for TypeScript types if they're complex
- Test edge cases: no data, 0% commission rate, negative amounts (credits)
